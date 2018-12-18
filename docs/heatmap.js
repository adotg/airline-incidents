const getMaxValue = (datamodel, groupByfields, maxValField) => {
  const groupedDataModel = datamodel.groupBy(groupByfields);
  const fieldConfig = groupedDataModel.getFieldsConfig();
  const incCtIndex = fieldConfig[maxValField].index;

  let max = 0;
  groupedDataModel.getData().data.forEach(e => {
    if (max < e[incCtIndex]) {
      max = e[incCtIndex];
    }
  });
  return max;
};

const createHeatMap = datamodel => {
  const max = getMaxValue(datamodel, ["Airline", "Year"], "incident-count");
  // Canvas for the heat map airline vs year
  const canvas = muze()
    .canvas()
    .data(datamodel)
    .rows(["Airline"])
    .columns(["Year"])
    .color({
      field: "incident-count",
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
                dataArray[fieldConfig["incident-count"].index];
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
      ctrlClick: firebolt => (targetEl, behaviours) => {
        const ticks = document
          .getElementById("incidents-by-year-heatmap-content-chart")
          .getElementsByClassName("muze-ticks-x-0-0");
        for (var i = 0; i < ticks.length; i++) {
          ticks[i].style.cursor = "pointer";
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
              "incident-count"
            );
            canvas
              .data(newDm)
              .columns(["Months"])
              .color({
                field: "incident-count",
                range: ["#ea4335"],
                domain: [0, newMax]
              })
              .config({
                axes: {
                  x: {
                    domain: months
                  }
                }
              });
          });
        }
      }
    })
    .registerPhysicalBehaviouralMap({
      ctrlClick: {
        behaviours: ["select"]
      }
    });
};
