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
                airbusDetails.content[0].substring(0, 11) === 'Indigo A20N' &&
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
          },
        ]);
    }
    ActionModel.dissociateSideEffect(["highlighter", "select"])
      .dissociateSideEffect(["tooltip", "brush,select"])
      .registerSideEffects(
        class LinkSideEffect extends SpawnableSideEffect {
          static formalName() {
            return "link-effect";
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

            //    const textGroups = this.createElement(drawingContext.htmlContainer, 'g', dataModel.getData().data, 'link-effect');
            const textGroups = this.createElement(
              drawingContext.htmlContainer,
              "div",
              dataModel.getData().data,
              "link-effect"
            );
            textGroups.style("background", "#eee");
            textGroups.style("position", "absolute");

            /* createElement is a utility method for side effects */
            textGroups.html(d => {
              return `Click <a target="_blank" href = ${
                JSON.parse(d[2]).fullDoc
              }>here </a> to read the full story`;
            });

            textGroups.attr("y", "30");
            return this;
          }
        }
      );

    ActionModel.for(canvas).mapSideEffects({
      select: ["link-effect"]
    });


    ActionModel.for(canvas)
    .registerPhysicalActions({
      /* to register the action */
      ctrlClick: firebolt => (targetEl, behaviours) => {
        const ticks =newElement
          .getElementsByClassName("muze-ticks-x-0-0");
        for (var i = 0; i < ticks.length; i++) {
          ticks[i].style.cursor = "pointer";
          ticks[i].addEventListener("click", e => {
            const latestDm = newDm.select(
                fields => new Date(fields.Date.value).getFullYear() == e.srcElement.innerHTML
              );
 
              const fieldConfigLatest = latestDm.getFieldsConfig();
              const index = fieldConfigLatest["Date"].index;
              const arr = latestDm.getData().data.map(e=>e[index]);
              console.log(arr);
              behaviours.forEach(behaviour => firebolt.dispatchBehaviour(behaviour, {
                criteria: {
                    Date: arr
                }
            }));
             
          });
        }

        // targetEl.on('click', function (data) {
        //     // if (event.metaKey) {
        //         const utils = muze.utils
        //         const event = utils.getEvent();
        //         const mousePos = utils.getClientPoint(this, event);
        //         const interactionConfig = {
        //             data,
        //             getAllPoints: true
        //         };
        //         const nearestPoint = firebolt.context.getNearestPoint(mousePos.x, mousePos.y, 
        //                   interactionConfig);
        //                   console.log(nearestPoint)
        //         behaviours.forEach(behaviour => firebolt.dispatchBehaviour(behaviour, {
        //             criteria: nearestPoint.id
        //         }));
        //     // }
        // });
        
      }
    })
    .registerPhysicalBehaviouralMap({
      ctrlClick: {
        behaviours: ["select"]
      }
    });







    trellisCanvases.push(canvas);
  });
  muze.ActionModel.for(...trellisCanvases).enableCrossInteractivity();
};
