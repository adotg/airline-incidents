const createTrellis = (datamodel, airlines) => {
  const trellisCanvases = [];
  airlines.forEach((e, i) => {
    const parentDiv = document.getElementById(
      "incidents-by-year-trellis-content"
    );
    const newElement = document.createElement("div");
    newElement.setAttribute("id", `incidents-${i}`);
    newElement.setAttribute("class", `incidents-trellis`);
    newElement.style.width = "30%";
    newElement.style.height = "50%";
    parentDiv.appendChild(newElement);
    const dates = [];
    for (let j = 2009; j <= 2019; j++) {
      dates.push(new Date(j, 0, 1));
    }
    let newDm = datamodel.select(fields => fields.Airline.value === e[0]);

    const canvas = muze()
      .canvas()
      .data(newDm)
      .rows(["Number of Incidents by Airline"])
      .columns(["Date"])
      .detail(["Details"])
      .color({ value: "#414141" })
      .title(jsUcfirst(e[0]))
      .config({
        axes: {
          x: {
            tickValues: dates,
            domain: [dates[0], dates[dates.length - 1]]
          },
          y: { name: "No. of Incidents", domain: [0, 60] }
        },
        border: {
          showValueBorders: { left: false, bottom: false }
        },
        interaction: {
          tooltip: {
            formatter: dataModel => {
              const tooltipData = dataModel.getData().data;
              const fieldConfig = dataModel.getFieldsConfig();
              const elem = newElement.getElementsByClassName(
                "muze-tooltip-box"
              )[0];
              const backElem = document.createElement("div");

              backElem.style.background = colorsForAirlines[e[0]];
              backElem.style.position = "absolute";
              backElem.style.top = "0";
              backElem.style.left = "0";
              backElem.style.width = "10px";
              backElem.style.height = "100%";
              elem.appendChild(backElem);

              let tooltipContent = `<div class = "tooltip-mod"><div class = "tooltip-header">${jsUcfirst(
                e[0]
              )}</div>`;
              let x = 0;
              tooltipData.forEach((dataArray, i) => {
                const dateVar = dataArray[fieldConfig["Date"].index];
                const num =
                  dataArray[
                    fieldConfig["Number of Incidents by Airline"].index
                  ];
                const details = JSON.parse(
                  dataArray[fieldConfig["Details"].index]
                );
                const date = new Date(dateVar);
                tooltipContent += `<div class = "tooltip-sub-header">Incident #${num +
                  x}</div>`;
                x++;
                tooltipContent += `<div class = "tooltip-content">${
                  details.content[0]
                }</div>`;
              });
              return html`${tooltipContent}</div>`;
            }
          }
        }
      })
      .mount(newElement);

    if (e[0] === "indigo") {
      canvas
        .transform({
          airbusA230DM: dt =>
            dt.select(fields => {
              const airbusDate = new Date(fields.Date.value);
              return (
                airbusDate.getMonth() === 7 && airbusDate.getFullYear() === 2015
              );
            }),
          airbusA230DMN: dt => {
            let firstDate = null;
            return dt.select(fields => {
              const airbusDetails = JSON.parse(fields.Details.value);
              if (
                airbusDetails.content[0].substring(0, 11) === "Indigo A20N" &&
                !firstDate
              ) {
                firstDate = true;
                return true;
              }
              return false;
            });
          }
        })
        .layers([
          { mark: "line" },
          {
            mark: "tick",
            name: "airBusA320N",
            className: "airBusA320N",
            encoding: {
              y: { field: null },
              x: "Date",
              color: { value: () => "red" }
            },
            calculateDomain: false,
            source: "airbusA230DM",
            interactive: false
          },
          {
            mark: "text",
            name: "airBusA320NText",
            className: "airBusA320NText",
            encoding: {
              y: { field: null },
              text: {
                field: "Date",
                formatter: value => {
                  return `Introduction of AirBus A320 \u2192`;
                }
              },
              x: "Date",
              color: { value: () => "#414141" }
            },
            encodingTransform: (points, layer, dependencies) => {
              let smartLabel = dependencies.smartLabel;
              for (let i = 0; i < points.length; i++) {
                let size = smartLabel.getOriSize(points[i].text);
                points[i].update.y += size.height + 5;
                points[i].update.x -= size.width / 2 + 1;
              }
              return points;
            },
            calculateDomain: false,
            source: "airbusA230DM",
            interactive: false
          }
        ]);
    }

    ActionModel.for(canvas)
      .registerPhysicalActions({
        /* to register the action */
        ctrlClick: firebolt => (targetEl, behaviours) => {
          const ticks = newElement.getElementsByClassName("muze-ticks-x-0-0");
          for (var i = 0; i < ticks.length; i++) {
            ticks[i].style.cursor = "pointer";
            ticks[i].addEventListener("click", e => {
              const latestDm = newDm.select(
                fields =>
                  new Date(fields.Date.value).getFullYear() ==
                  e.srcElement.innerHTML
              );

              const fieldConfigLatest = latestDm.getFieldsConfig();
              const index = fieldConfigLatest["Date"].index;
              const arr = latestDm.getData().data.map(e => e[index]);

              behaviours.forEach(behaviour =>
                firebolt.dispatchBehaviour(behaviour, {
                  criteria: {
                    Date: arr
                  },
                  Year: e.srcElement.innerHTML
                })
              );
            });
          }
        }
      })
      .registerPhysicalBehaviouralMap({
        ctrlClick: {
          behaviours: ["select"]
        }
      })

      .registerSideEffects(
        class BandCreator extends SpawnableSideEffect {
          constructor(...params) {
            super(...params);
            const visualUnit = this.firebolt.context;
            const xField = visualUnit.fields().x[0];
            const yField = visualUnit.fields().y[0];
            this._layers = [];
            const encoding = {
              x: "startDate",
              x0: "endDate",
              y: { field: null },
              color: {
                value: () => "#eee"
              }
            };
            const barLayers = visualUnit.addLayer({
              name: "contributionLayer",
              mark: "bar",
              className: "muze-contributionLayer",
              calculateDomain: false,
              encoding,
              render: false,
              axis: {
                x: "Date"
              }
            });

            this._layers = [...barLayers];
            //     , ...visualUnit.addLayer({
            //     name: 'label',
            //     mark: 'text',
            //     className: 'textLayer',
            //     encoding: {
            //         x: xField.getMembers()[0],
            //         y: yField.getMembers()[0],
            //         color: {
            //             value: () => '#fff'
            //         },
            //         text: xField.getMembers()[0]
            //     },
            //     encodingTransform: require('layers', ['barLayer', (barLayer) => {
            //         return (points, layerInst) => {
            //             const fieldsConfig = layerInst.data().getFieldsConfig();
            //             const yField = layerInst.config().encoding.y.field;
            //             const xField = layerInst.config().encoding.x.field;
            //             const xFieldIndex = fieldsConfig[xField].index;
            //             const yFieldIndex = fieldsConfig[yField].index;
            //             const barData = barLayer.data().getData().data;
            //             const sourceYFieldIndex = barLayer.data().getFieldsConfig()[yField].index;
            //             const sourceXFieldIndex = barLayer.data().getFieldsConfig()[xField].index;
            //             points.forEach((point) => {
            //                 const source = point.source;
            //                 const totalValue = barData.find(d => d[sourceYFieldIndex] === source[yFieldIndex])[sourceXFieldIndex];
            //                 point.text = `${((point.source[xFieldIndex] / totalValue) * 100).toFixed(2)}%`;
            //                 point.update.x += 3;
            //             });
            //             return points;
            //         }
            //     }])
            // })];
          }

          static formalName() {
            return "band-creator";
          }

          apply(selectionSet, payload) {
            const jsonData = [
              {
                startDate: `Jan-1-${payload.Year}`,
                endDate: `Dec-31-${payload.Year}`
              }
            ];
            const schema = [
              {
                name: "startDate",
                type: "dimension",
                subtype: "temporal",
                format: "%b-%e-%Y"
              },
              {
                name: "endDate",
                type: "dimension",
                subtype: "temporal",
                format: "%b-%e-%Y"
              }
            ];
            const interactionDm = new DataModel(jsonData, schema);

            const sideEffectGroup = this.drawingContext().sideEffectGroup;
            const dynamicMarkGroup = this.createElement(
              sideEffectGroup,
              "g",
              this._layers,
              ".contribution-layer"
            );
            dynamicMarkGroup.each(function(layer) {
         
              layer.mount(this).data(interactionDm);
            });
          }
        }
      )
      .mapSideEffects({
        select: ["band-creator"]
      });

    trellisCanvases.push(canvas);
  });
  muze.ActionModel.for(...trellisCanvases).enableCrossInteractivity();
};
