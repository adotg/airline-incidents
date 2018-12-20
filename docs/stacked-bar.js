const createStackedBar = (datamodel, airlines) => {
  let total = 0;
  const groupedDataModel = datamodel
    .sort([["Count of Incidents"]])
    .groupBy(["Airline", "c"]);
  const fieldConfig = groupedDataModel.getFieldsConfig();
  const incCtIndex = fieldConfig["Count of Incidents"].index;
  groupedDataModel.getData().data.forEach(e => {
    total += e[incCtIndex];
  });

  // Canvas for incident counts
  const canvas = muze()
    .canvas()
    .data(groupedDataModel)
    .rows(["c"])
    .minUnitHeight(10)
    .height(100)
    .columns([["Count of Incidents"]])
    .color({
      field: "Airline",
      domain: Object.keys(colorsForAirlines),
      range: Object.entries(colorsForAirlines).map(e => e[1])
    })
    .layers([
      {
        mark: "bar",
        transform: { sort: "descending" }
      }
    ])
    .config({
      autoGroupBy: { disabled: true },
      gridLines: {
        x: { show: false }
      },
      border: {
        showValueBorders: { top: false, left: false, bottom: false }
      },
      legend: {
        position: "bottom",
        color: { show: false }
      },
      axes: {
        y: { show: false, padding: 0.1 },
        x: {
          show: true,
          showAxisName: false,
          nice: false,
          tickValues: [-0.5, total],
          setFixedBaseline: false,
          tickFormat: (val, i, allTicks) => {
            if (i === 0) {
              return "0%";
            } else if (i === allTicks.length - 1) {
              return `100%`;
            }
            return "";
          }
        }
      }
    })
    .mount("#incidents-breakup-viz");

  const parentLegendDiv = document.getElementById("incidents-breakup-legend");
  parentLegendDiv.innerHTML = '';
  const legendElem = document.createElement("div");

  airlines.forEach((e, i) => {
    const legendElemInner = document.createElement("div");
    legendElemInner.setAttribute("id", `legend-${i}`);
    legendElemInner.setAttribute("class", `incidents-legend`);
    const box = `<div style = 'background: ${colorsForAirlines[e[0]]}; color: ${
      colorsForAirlines[e[0]]
    }' class = 'legend-box'>xxx</div>`;
    legendElemInner.innerHTML = `${box} <div class = 'legend-text'>${jsUcfirst(
      e[0]
    )} : ${e[1]} (${((e[1] * 100) / 155).toFixed(1)}%)</div>`;
    legendElem.appendChild(legendElemInner);
  });
  parentLegendDiv.appendChild(legendElem);

  ActionModel.for(canvas)
    .dissociateSideEffect(["tooltip", "highlight"])
    .dissociateSideEffect(["crossline", "highlight"])
    .dissociateSideEffect(["highlighter", "highlight"])
    .dissociateSideEffect(["highlighter", "brush"])
    .dissociateSideEffect(["selectionBox", "brush"])
    .dissociateSideEffect(["highlighter", "select"])
    .dissociateSideEffect(["tooltip", "brush,select"]);
};
