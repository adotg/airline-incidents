const tooltipFormatterHeatMap = (dataModel, field, extraInfo = "") => {
  const tooltipData = dataModel.getData().data;
  const fieldConfig = dataModel.getFieldsConfig();
  let elem = document
    .getElementById("incidents-by-year-heatmap-content")
    .getElementsByClassName("muze-tooltip-box");
  elem = elem[elem.length - 1];

  let backElem = elem.getElementsByClassName("background-elem");

  if (!backElem.length) {
    backElem = document.createElement("div");

    backElem.style.position = "absolute";
    backElem.setAttribute("id", "background-elem");
    backElem.classList.add("background-elem");
    backElem.style.top = "0";
    backElem.style.left = "0";
    backElem.style.width = "10px";
    backElem.style.height = "100%";
    elem.appendChild(backElem);
  } else {
    backElem = backElem[0];
  }

  let tooltipContent = "<div class = 'tooltip-mod'>";
  tooltipData.forEach((dataArray, i) => {
    const airline = dataArray[fieldConfig["Airline"].index];
    const year = dataArray[fieldConfig[field].index];
    const incidentCount = dataArray[fieldConfig["Count of Incidents"].index];
    const incident = incidentCount > 1 ? "incidents" : "incident";

    backElem.style.background = colorsForAirlines[airline];
    tooltipContent += `<div class = "tooltip-header">${jsUcfirst(
      airline
    )}</div>${incidentCount} ${incident} in ${year}${extraInfo}`;
  });
  return html`
        ${tooltipContent}</div>
      `;
};

const createHeatMap = datamodel => {
  const goBack = () => {
    const backButton = document.getElementsByClassName("back-button");
    for (var i = 0; i < backButton.length; i++) {
      backButton[i].style.display = "none";
    }
    createHeatMap(datamodel);
  };
  const max = getMaxValue(datamodel, ["Airline", "Year"], "Count of Incidents");
  let field = "Year";
  let extraInfo = "";

  // Canvas for the heat map airline vs year
  const canvas = muze()
    .canvas()
    .data(datamodel)
    .rows(["Airline"])
    .columns(["Year"])
    .color({
      field: "Count of Incidents",
      range: ["#ea4335"],
      domain: [0, max]
    })
    .config({
      axes: {
        x: { padding: 0, domain: years },
        y: { padding: 0, domain: allAirlines }
      },
      legend: {
        color: {
          title: {
            text: "Incidents"
          }
        }
      },
      interaction: {
        tooltip: {
          formatter: dataModel => {
            return tooltipFormatterHeatMap(dataModel, field, extraInfo);
          }
        }
      }
    })
    .mount("#incidents-by-year-heatmap-content-chart");

  ActionModel.for(canvas)
    .dissociateSideEffect(["highlighter", "select"])
    .dissociateSideEffect(["tooltip", "brush,select"])
    .dissociateSideEffect(["highlighter", "brush"])
    .dissociateSideEffect(["selectionBox", "brush"])
    .registerPhysicalActions({
      /* to register the action */
      axisAndChartlick: firebolt => (targetEl, behaviours) => {
        const content = document.getElementById(
          "incidents-by-year-heatmap-content-chart"
        );
        const ticks = content.getElementsByClassName("muze-ticks-x-0-0");

        for (var i = 0; i < ticks.length; i++) {
          ticks[i].style.cursor = "pointer";
          if (dataYears.indexOf(+ticks[i].innerHTML) > -1) {
            ticks[i].classList.add("ticks-link");
          }

          content.getElementsByClassName("muze-ticks-x-0-0");

          ticks[i].addEventListener("click", e => {
            let newDm = datamodel.select(
              fields => fields.Year.value == e.srcElement.innerHTML
            );

            newDm = newDm.calculateVariable(
              {
                name: "Months",
                type: "dimension"
              },
              [
                "Date",
                dateVar => {
                  const date = new Date(dateVar);
                  return months[date.getMonth()];
                }
              ]
            );

            const newMax = getMaxValue(
              newDm,
              ["Airline", "Months"],
              "Count of Incidents"
            );
            field = "Months";
            extraInfo = `,${e.srcElement.innerHTML}`;
            canvas.config({
              axes: {
                x: {
                  domain: months,
                  name: `\u2190 Months of Year: ${e.srcElement.innerHTML}`
                }
              }
            });
            const newCanvas = canvas
              .data(newDm)

              .columns(["Months"])
              .color({
                field: "Count of Incidents",
                range: ["#ea4335"],
                domain: [0, newMax]
              });

            ActionModel.for(newCanvas)
              .registerPhysicalActions({
                /* to register the action */
                axisNameClick: firebolt => (targetEl, behaviours) => {
                  const backButton = content.getElementsByClassName(
                    "muze-axis-name-x-0-0"
                  );

                  for (var i = 0; i < backButton.length; i++) {
                    backButton[i].style.display = "block";
                    backButton[i].classList.add("back-button");
                    backButton[i].addEventListener("click", e => goBack());
                  }
                }
              })
              .registerPhysicalBehaviouralMap({
                axisNameClick: {
                  behaviours: ["singleSelect"]
                }
              });
          });
        }

        // Info box
        targetEl.on("click", function(data) {
          const utils = muze.utils;
          const event = utils.getEvent();
          const mousePos = utils.getClientPoint(this, event);
          const interactionConfig = {
            data,
            getAllPoints: false
          };
          const nearestPoint = firebolt.context.getNearestPoint(
            mousePos.x,
            mousePos.y,
            interactionConfig
          );
          const { id } = nearestPoint;
          behaviours.forEach(behaviour =>
            firebolt.dispatchBehaviour(behaviour, {
              criteria: id
            })
          );
        });
      }
    })
    .registerBehaviouralActions([
      class SingleSelectBehaviour extends GenericBehaviour {
        static formalName() {
          return "singleSelect";
        }
        setSelectionSet(addSet, selectionSet) {
          if (addSet === null || !addSet.length) {
            selectionSet.reset();
          } else {
            selectionSet.reset();
            selectionSet.add(addSet);
          }
        }
      }
    ])
    .registerPhysicalBehaviouralMap({
      axisAndChartlick: {
        behaviours: ["singleSelect"]
      },
      longtouch: {
        behaviours: ["singleSelect"]
      }
    })

    .registerSideEffects(
      class InfoBoxSideEffect extends SpawnableSideEffect {
        static formalName() {
          return "info-box";
        }

        apply(selectionSet, payload) {
          const id = payload.criteria;
          const newDataModel = datamodel.select(fields => {
            const dateVar = new Date(fields.Date.value);
            const dateChecker =
              canvas.columns()[0] === "Year"
                ? dateVar.getFullYear()
                : months[dateVar.getMonth()];
            return fields.Airline.value === id[1][1] && dateChecker == id[1][0];
          });
          const infoBox = document.getElementById("heatmap-info-box");
          infoBox.innerHTML = "";
          const infoFieldsConfig = newDataModel.getFieldsConfig();
          const detailIndex = infoFieldsConfig.Details.index;
          const infoBoxHeader = document.createElement("div");

          infoBoxHeader.setAttribute("class", "info-box-header");
          infoBoxHeader.innerHTML = `Incidents by ${jsUcfirst(id[1][1])} in ${
            id[1][0]
          } `;
          infoBox.appendChild(infoBoxHeader);

          newDataModel.getData().data.forEach(e => {
            const infoBoxElem = document.createElement("div");

            infoBoxElem.setAttribute("class", "info-box-elem");
            const detailData = JSON.parse(e[detailIndex]);
            const { fullDoc, img, content } = detailData;
            let innerHTML = "";
            innerHTML += `<div class = "info-image">  <img src= "${img}"></div>`;
            innerHTML += `<div class = "info-header">${content[0]}</div>`;
            innerHTML += `<div class = "info-link">${content[2]}</div>`;
            innerHTML += `<div class = "info-link"> Click <a target="_blank" href = "${fullDoc}">here</a> to get the full story</div>`;

            infoBoxElem.innerHTML = innerHTML;
            infoBox.appendChild(infoBoxElem);
          });
          return this;
        }
      }
    );

  ActionModel.for(canvas).mapSideEffects({
    singleSelect: ["info-box"]
  });
};
