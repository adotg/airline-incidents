const infoBoxCreator = (data, innerHTML, headerInfo) => {
  const infoBox = document.getElementById("incidents-by-year-step-info-box");
  infoBox.innerHTML = "";
  const infoBoxHeader = document.createElement("div");
  infoBoxHeader.setAttribute("class", "info-box-header");
  infoBoxHeader.innerHTML = `${headerInfo} `;
  infoBox.appendChild(infoBoxHeader);

  data.forEach(e => {
    const infoBoxElem = document.createElement("div");
    infoBoxElem.setAttribute("class", "info-box-elem");
    infoBoxElem.innerHTML = innerHTML(e);
    infoBox.appendChild(infoBoxElem);
  });
};

const registerListener = (canvas, datamodel, type) => {
  ActionModel.for(canvas)
    .dissociateSideEffect(["tooltip", "highlight"])
    .dissociateSideEffect(["highlighter", "highlight"])
    .dissociateSideEffect(["highlighter", "brush"])
    .dissociateSideEffect(["selectionBox", "brush"])
    .dissociateSideEffect(["highlighter", "select"])
    .dissociateSideEffect(["tooltip", "brush,select"])
    .registerSideEffects(
      class InfoBoxSideEffect extends SpawnableSideEffect {
        static formalName() {
          return "info-box";
        }

        apply(selectionSet, payload) {
          const id = payload.criteria;

          if (id) {
            if (type === "monthly") {
              const currDateVar = new Date(id[1][0]);

              const newDataModel = datamodel
                .select(
                  fields => {
                    const dateVar = new Date(fields.Date.value);

                    return (
                      dateVar.getMonth() === currDateVar.getMonth() &&
                      dateVar.getFullYear() === currDateVar.getFullYear()
                    );
                  },
                  { saveChild: false }
                )
                .groupBy(["Airline"]);
              const infoFieldsConfig = newDataModel.getFieldsConfig();
              const airlineIndex = infoFieldsConfig.Airline.index;
              const incIndex = infoFieldsConfig["Count of Incidents"].index;
              const time = `${
                months[currDateVar.getMonth()]
              }, ${currDateVar.getFullYear()}`;
              const dataSet = newDataModel.getData().data;
              dataSet.length &&
                infoBoxCreator(
                  dataSet,
                  e => {
                    let innerHTML = `<div class = 'back-elem' style='background: ${
                      colorsForAirlines[e[airlineIndex]]
                    }'></div>`;

                    innerHTML += `<div class = "info-header">${jsUcfirst(
                      e[airlineIndex]
                    )}</div>`;
                    innerHTML += `<div class = "info-content">${
                      e[incIndex]
                    } Incidents in  ${time}</div>`;
                    return innerHTML;
                  },
                  time
                );
            } else {
              const airlineIndex = id[0].indexOf("Airline");
              const dateIndex = id[0].indexOf("Date");
              const detailsIndex = id[0].indexOf("Details");
              let data = [];
              let time = "";
              id.forEach((e, i) => {
                if (i > 0) {
                  data.push(e);
                  const currDateVar = new Date(e[dateIndex]);
                  time = `${currDateVar.getDate()} ${
                    months[currDateVar.getMonth()]
                  }, ${currDateVar.getFullYear()}`;
                }
              });
              infoBoxCreator(
                data,
                e => {
                  let innerHTML = `<div class = 'back-elem' style='background: ${
                    colorsForAirlines[e[airlineIndex]]
                  }'></div>`;

                  innerHTML += `<div class = "info-header">${jsUcfirst(
                    e[airlineIndex]
                  )}</div>`;
                  const details = JSON.parse(e[detailsIndex]);
                  innerHTML += `<div class = "info-content">${
                    details.content[0]
                  }</div>`;

                  return innerHTML;
                },
                time
              );
            }
          }

          return this;
        }
      }
    );
  ActionModel.for(canvas).mapSideEffects({
    highlight: ["info-box"]
  });
};

const stackLayerMaker = canvas => {
  ActionModel.registerSideEffects(
    class StackLayer extends SpawnableSideEffect {
      static formalName() {
        return "stack-layer";
      }

      constructor(...params) {
        super(...params);
        const visualUnit = this.firebolt.context;
        const xField = visualUnit.fields().x[0];
        const yField = visualUnit.fields().y[0];
        this._layers = [];
        const encoding = {
          x: "Monthly Date",
          y: { field: "Count of Incidents" },
          color: {
            field: "Airline"
          }
        };
        const barLayers = visualUnit.addLayer({
          name: "stackLayer",
          mark: "bar",
          className: "muze-stackLayer",
          calculateDomain: false,
          encoding,
          render: false,
          transition: {
            disabled: true
          }
        });

        this._layers = [...barLayers];
      }

      apply(selectionSet) {
        const interactionDm = selectionSet.mergedEnter.model;

        const sideEffectGroup = this.drawingContext().sideEffectGroup;
        const dynamicMarkGroup = this.createElement(
          sideEffectGroup,
          "g",
          this._layers,
          ".stack-layer"
        );
        dynamicMarkGroup.each(function(layer) {
          layer.mount(this).data(interactionDm);
        });

        return this;
      }
    }
  );

  ActionModel.for(canvas).mapSideEffects({
    highlight: ["stack-layer"]
  });
};

const createStepLineAndBar = (
  monthlyDataModel,
  datamodel,
  numberOfIncidents
) => {
  const header = document.getElementById("incidents-by-year-step-header");
  let  selection = document.getElementById("dropdown-selector-stepline");
  const chartTypes = ["By Month", "Daily Cumulative"];
  if (!selection) {
    selection = document.createElement("select");
    selection.setAttribute("class", "dropdown-selector");
    selection.setAttribute("id", "dropdown-selector-stepline");

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
  }

//   createBar(monthlyDataModel, datamodel);
  const dropDownChange = e => {
    infoBoxCreator([], "", "");

    switch (selection.value) {
      case chartTypes[1]:
        createStepLine(datamodel, numberOfIncidents);
        break;
      case chartTypes[0]:
      default:
        createBar(monthlyDataModel, datamodel);
        break;
    }
  };
  dropDownChange();

  selection.addEventListener("change", dropDownChange);

  //   createDropDown(header, chartTypes, dropDownChange)
};

createStepLine = (dataModel, numberOfIncidents) => {
  // Canvas for cumulative incident counts
  const canvas = muze()
    .canvas()
    .data(dataModel)
    .columns(["Date"])
    .detail(["Details", "Airline"])
    .rows(["Number of Incidents"])
    .layers([
      { mark: "line", interpolate: "stepAfter" },
      { mark: "point", source: "lastPoint", className: "lastPoint" },
      {
        mark: "text",
        name: "firstText",
        encoding: {
          text: {
            field: "Date",
            formatter: val => {
              return `Date recorded till: ${getDisplayDateFromMilliSeconds(
                val
              )}`;
            }
          }
        },
        source: "lastPoint",

        encodingTransform: (points, layer, dependencies) => {
          const width = layer.measurement().width;
          let smartLabel = dependencies.smartLabel;
          for (let i = 0; i < points.length; i++) {
            let size = smartLabel.getOriSize(points[i].text);

            if (points[i].update.x + size.width + size.width / 2 + 10 > width) {
              points[i].update.x -= size.width / 2 + 10;
            } else {
              points[i].update.x += size.width / 2 + 10;
            }
            points[i].update.y += 0;
          }
          return points;
        }
      },
      {
        mark: "text",
        name: "secondText",
        encoding: {
          text: {
            field: "Date",
            formatter: val => {
              return `Total incident recorded: ${numberOfIncidents}`;
            }
          }
        },
        source: "lastPoint",
        encodingTransform: (points, layer, dependencies) => {
          let smartLabel = dependencies.smartLabel;
          for (let i = 0; i < points.length; i++) {
            const width = layer.measurement().width;
            let size = smartLabel.getOriSize(points[i].text);
            points[i].update.y += size.height;
            if (points[i].update.x + size.width + size.width / 2 + 10 > width) {
              points[i].update.x -= size.width / 2 + 10;
            } else {
              points[i].update.x += size.width / 2 + 10;
            }
          }
          return points;
        }
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
          domain: ["2009", "2020"],
          tickFormat: genericTickFormatDate
        }
      },
      border: {
        showValueBorders: { left: false, bottom: false }
      }
    })
    .mount("#incidents-by-year-step-chart");
  registerListener(canvas, dataModel, "daily");
};

createBar = (dataModel, dailyDm) => {
  const canvas = muze()
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
        source: dt => dt.groupBy(["Monthly Date"]),
        encoding: {
          color: {
            value: () => "#414141"
          }
        }
      }
    ])

    .color({
      value: "#414141",
      field: "Airline",
      domain: Object.keys(colorsForAirlines),
      range: Object.entries(colorsForAirlines).map(e => e[1])
    })
    .config({
      legend: {
        color: {
          show: false
        }
      },
      axes: {
        y: { name: "Number of Incidents" },
        x: {
          padding: 0.2
          // tickFormat: genericTickFormatDate
        }
      },
      border: {
        showValueBorders: { left: false, bottom: false }
      }
    })
    .mount("#incidents-by-year-step-chart");
  registerListener(canvas, dailyDm, "monthly");
  stackLayerMaker(canvas);

  ActionModel.for(canvas)
    //   .dissociateSideEffect(["tooltip", "highlight"])
    .dissociateSideEffect(["crossline", "highlight"]);
};
