const createStepLineAndBar = (monthlyDataModel, datamodel, numberOfIncidents) => {
  const header = document.getElementById("incidents-by-year-step-header");
  const selection = document.createElement("select");
  selection.setAttribute("class", "dropdown-selector");
  selection.setAttribute("id", "dropdown-selector-stepline");

  const chartTypes = ["Monthly Sum", "Cumulative"];
  chartTypes.forEach(e => {
    const option = document.createElement("option");
    option.setAttribute("value", e);
    option.innerHTML = e;
    if (e === chartTypes[0]) {
      option.setAttribute("selected", true);
    }
    selection.appendChild(option);
  });
  header.appendChild(selection);

  createBar(monthlyDataModel);

  selection.addEventListener("change", e => {
    switch (selection.value) {
      case chartTypes[1]:
        createStepLine(datamodel, numberOfIncidents);
        break;
      case chartTypes[0]:
      default:
        createBar(monthlyDataModel);
        break;
    }
  });
};

createStepLine = (dataModel, numberOfIncidents) => {
  // Canvas for cumulative incident counts
  muze()
    .canvas()
    .data(dataModel)
    .columns(["Date"])
    .rows(["Number of Incidents"])
    .layers([
      { mark: "line", interpolate: "stepAfter" },
      { mark: "point", source: "lastPoint" },
      {
        mark: "text",
        name: 'firstText',
        encoding: {
          text: {
            field: "Date",
            formatter: (val)=>{
                return `Date recorded till: ${getDisplayDateFromMilliSeconds(val)}`
            }
          }
        },
        source: "lastPoint",
        encodingTransform: (points, layer, dependencies) => {
            let smartLabel = dependencies.smartLabel;
            for (let i = 0; i < points.length; i++) {
              let size = smartLabel.getOriSize(points[i].text);
              points[i].update.y +=   size.height+ 5;
              points[i].update.x += size.width / 2 + 1;
            }
            return points;
          },
      },
      {
        mark: "text",
        name: 'secondText',
        encoding: {
          text: {
            field: "Date",
            formatter: (val)=>{
                return `Total incident recorded: ${numberOfIncidents}`
            }
          }
        },
        source: "lastPoint",
        encodingTransform: (points, layer, dependencies) => {
            let smartLabel = dependencies.smartLabel;
            for (let i = 0; i < points.length; i++) {
              let size = smartLabel.getOriSize(points[i].text);
              points[i].update.y += size.height*2 + 5;
              points[i].update.x += size.width / 2 + 1;
            }
            return points;
          },
      }
    ])
    .transform({
      lastPoint: dt => {
        return dt.select(
          (fields, index) => index === dt.getData().data.length - 1
        );
      }
    })
    .config({
      interaction: {
        tooltip: {
          formatter: dataModel =>
            tooltipFormatter(dataModel, ["Date", "Number of Incidents"])
        }
      }
    })
    .color({ value: "#414141" })
    .config({
      axes: {
        y: { name: "Number of Incidents" },
        x: {
          domain: ["2008", "2020"]
        }
      },
      border: {
        showValueBorders: { left: false, bottom: false }
      }
    })
    .mount("#incidents-by-year-step-content");
};

createBar = dataModel => {
  muze()
    .canvas()
    .data(dataModel)
    .columns(["Monthly Date"])
    .rows(["Count of Incidents"])
    .layers([
      {
        mark: "bar",
        transform: {
          type: "identity"
        },
        encoding: {
          color: {
            value: () => "#414141"
          }
        }
      }
    ])

    .color({
      value: "#414141",
      field: "Airline"
    })
    .config({
      legend: {
        color: {
          show: false
        }
      },

      axes: {
        y: { name: "Number of Incidents" }
      },
      border: {
        showValueBorders: { left: false, bottom: false }
      }
    })
    .mount("#incidents-by-year-step-content");
};
