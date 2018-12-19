const createHeatMap = datamodel => {
  const goBack = () => {
    const backButton = document.getElementsByClassName("back-button");
    for (var i = 0; i < backButton.length; i++) {
      backButton[i].style.display = "none";
    }
    createHeatMap(datamodel);
  };
  const max = getMaxValue(datamodel, ["Airline", "Year"], "Count of Incidents");
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
      interaction: {
        tooltip: {
          formatter: dataModel => {
            const tooltipData = dataModel.getData().data;
            const fieldConfig = dataModel.getFieldsConfig();
            const elem = document
              .getElementById("incidents-by-year-heatmap-content")
              .getElementsByClassName("muze-tooltip-box")[0];
            const backElem = document.createElement("div");

            backElem.style.position = "absolute";
            backElem.style.top = "0";
            backElem.style.left = "0";
            backElem.style.width = "10px";
            backElem.style.height = "100%";
            elem.appendChild(backElem);

            let tooltipContent = "<div class = 'tooltip-mod'>";
            tooltipData.forEach((dataArray, i) => {
              const airline = dataArray[fieldConfig["Airline"].index];
              const year = dataArray[fieldConfig["Year"].index];
              const incidentCount =
                dataArray[fieldConfig["Count of Incidents"].index];
              const incident = incidentCount > 1 ? "incidents" : "incident";

              backElem.style.background = colorsForAirlines[airline];
              tooltipContent += `<div class = "tooltip-header">${jsUcfirst(
                airline
              )}</div>${incidentCount} ${incident} in ${year}`;
            });
            return html`
                ${tooltipContent}</div>
              `;
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
            const newCanvas = canvas
              .data(newDm)
              .columns(["Months"])
              .color({
                field: "Count of Incidents",
                range: ["#ea4335"],
                domain: [0, newMax]
              })
              .config({
                axes: {
                  x: {
                    domain: months,
                    name: `\u2190 Months of Year: ${e.srcElement.innerHTML}`
                  }
                }
              });

            newCanvas.done().then(() => {
              setTimeout(()=>{
              const backButton = content.getElementsByClassName(
                "muze-axis-name-x-0-0"
              );

              for (var i = 0; i < backButton.length; i++) {
                backButton[i].style.display = "block"
                backButton[i].classList.add("back-button");
                backButton[i].addEventListener("click", e => goBack());
              }
            }, 100);
          })
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
            innerHTML += `<div class = "info-link"> Click <a target="_blank" href = "${fullDoc}">here</a> to get the full story</div>`;

            infoBoxElem.innerHTML = innerHTML;
            infoBox.appendChild(infoBoxElem);
          });
        });
      }
    })
    .registerPhysicalBehaviouralMap({
      axisAndChartlick: {
        behaviours: ["select"]
      }
    })
    .registerSideEffects(
      class InfoBoxSideEffect extends SpawnableSideEffect {
        static formalName() {
          return "info-box";
        }

        apply(selectionSet) {
          /* Getting the datamodel */
          const dataModel = selectionSet.entrySet[0].model;

          /* Getting the Drawing Context */
          const drawingContext = this.drawingContext();

          /* Getting the side effect drawing area */

          const sideEffectGroup = drawingContext.sideEffectGroup;

          /* Getting the html container of the drawing area */

          const htmlContainer = drawingContext.htmlContainer;

          return this;
        }
      }
    );

  ActionModel.for(canvas).mapSideEffects({
    select: ["info-box"]
  });
};
