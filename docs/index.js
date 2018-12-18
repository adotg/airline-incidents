const cumulativeCalculationAirlineDate = dm => {
  let currDate = "";
  let currAirLine = "";
  let i = 0;
  let j = 0;
  // Create a variable to create pseudo axis
  return dm.sort([["Airline"], ["Date"]]).calculateVariable(
    {
      name: "Number of Incidents by Airline",
      type: "measure",
      defAggFn: "first"
    },
    [
      "Airline",
      "Date",
      (al, date) => {
        if (date === currDate && al === currAirLine) {
          j++;
          return i;
        } else if (al !== currAirLine) {
          i = 1;
          j = 0;
          currDate = date;
          currAirLine = al;
          return 1;
        } else {
          currDate = date;
          i = i + j + 1;
          j = 0;
          return i;
        }
      }
    ]
  );
};

const calcCumulative = (dm, variable, cumulativeVariableName) => {
  let currDate = "";
  let i = 0;
  let j = 0;
  // Create a variable to create pseudo axis
  return dm.calculateVariable(
    {
      name: cumulativeVariableName,
      type: "measure",
      defAggFn: "first"
    },
    [
      variable,
      date => {
        if (date === currDate) {
          j++;
          return i;
        } else {
          currDate = date;
          i = i + j + 1;
          j = 0;
          return i;
        }
      }
    ]
  );
};
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const tooltipFormatter = (dataModel, variables) => {
  const tooltipData = dataModel.getData().data;
  const fieldConfig = dataModel.getFieldsConfig();

  let tooltipContent = [];
  tooltipData.forEach((dataArray, i) => {
    const dateVar = dataArray[fieldConfig[variables[0]].index];
    const num = dataArray[fieldConfig[variables[1]].index];
    const date = new Date(dateVar);

    tooltipContent[0] = [
      {
        value: variables[0],
        className: "muze-tooltip-key"
      },
      {
        value: `${date.getDate()}-${
          months[date.getMonth()]
        }-${date.getFullYear()}`,
        className: "muze-tooltip-value"
      }
    ];

    tooltipContent[1] = [
      {
        value: variables[1],
        className: "muze-tooltip-key"
      },
      {
        value: num,
        className: "muze-tooltip-value"
      }
    ];
  });
  return tooltipContent;
};

function jsUcfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

fetch("data.json").then(resp =>
  resp.json().then(data => {
    const DataModel = muze.DataModel;
    const html = muze.Operators.html;

    data = data
      .filter(row => !!row[1]) /* Delets rows which does not contain any data */
      .map(row => ((row[2] = JSON.stringify(row[2])), row));

    const nData = [["Airline", "Date", "Details"]];
    data.forEach(row => nData.push(row));

    const schema = [
      {
        name: "Airline",
        type: "dimension"
      },
      {
        name: "Date",
        type: "dimension",
        subtype: "temporal",
        format: "%b-%e-%Y"
      },
      {
        name: "Details",
        type: "dimension"
      }
    ];

    let dm = new DataModel(nData, schema);

    // Create a variable to create monthly data
    dm = dm.calculateVariable(
      {
        name: "Monthly Date",
        type: "dimension",
        subtype: "temporal",
        format: "%m-%Y"
      },
      [
        "Date",
        d => {
          const date = new Date(d);
          const month =
            date.getMonth() < 10 ? `0${date.getMonth()}` : date.getMonth();
          return `${month}-${date.getFullYear()}`;
        }
      ]
    );

    let sdm = dm.sort([["Date"]]);

    // Create a variable to create year data
    sdm = sdm.calculateVariable({ name: "Year", type: "dimension" }, [
      "Date",
      d => {
        return new Date(d).getFullYear();
      }
    ]);

    // Create a variable to create pseudo axis
    sdm = sdm.calculateVariable(
      {
        name: "incident-count",
        type: "measure",
        defAggFn: "sum"
      },
      ["Date", () => 1]
    );

    // DataModel for the cumulative line chart
    let incidentDm = calcCumulative(sdm, "Date", "Number of Incidents");

    let airlineDM = sdm.groupBy(["Airline"], {
      "incident-count": "count"
    });

    // Getting list of airlines
    const airlines = airlineDM.sort([["incident-count", "desc"]]).getData()
      .data;

    // DataModel for the heatmap
    airlineDM = airlineDM.calculateVariable({ name: "c", type: "dimension" }, [
      "Airline",
      d => {
        return 1;
      }
    ]);

    // DataModel for the trellis
    const trellisDM = cumulativeCalculationAirlineDate(dm);

    const colorsForAirlines = {
      indigo: "#001197",
      "jet-airways": "#f6e291",
      "air-india": "#f3a737",
      airasia: "#f11a12",
      vistara: "#592b50",
      goair: "#1c5891"
    };

    // Main KPI
    document.getElementById(
      "number-of-incidents-content"
    ).innerHTML = sdm.groupBy([""]).getData().data[0][0];

    // Canvas for incident counts
    const canvas1 = muze()
      .canvas()
      .data(airlineDM.sort([["incident-count"]]))
      .rows(["c"])
      .minUnitHeight(10)
      .height(100)
      .columns(["incident-count"])
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
          showValueBorders: { left: false, bottom: false }
        },
        legend: {
          position: "bottom",
          color: { show: false }
        },
        axes: {
          y: { show: false },
          x: { show: false }
        }
      })
      .mount("#incidents-breakup-viz");

    const parentLegendDiv = document.getElementById("incidents-breakup-legend");
    const legendElem = document.createElement("div");

    airlines.forEach((e, i) => {
      const legendElemInner = document.createElement("div");
      legendElemInner.setAttribute("id", `legend-${i}`);
      legendElemInner.setAttribute("class", `incidents-legend`);
      const box = `<div style = 'background: ${
        colorsForAirlines[e[0]]
      }; color: ${colorsForAirlines[e[0]]}' class = 'legend-box'>xxx</div>`;
      legendElemInner.innerHTML = `${box} <div class = 'legend-text'>${jsUcfirst(
        e[0]
      )} : ${e[1]} (${((e[1] * 100) / 155).toFixed(1)}%)</div>`;
      legendElem.appendChild(legendElemInner);
    });
    parentLegendDiv.appendChild(legendElem);

    muze.ActionModel.for(canvas1)
      .dissociateSideEffect(["tooltip", "highlight"])
      .dissociateSideEffect(["crossline", "highlight"])
      .dissociateSideEffect(["highlighter", "highlight"])
      .dissociateSideEffect(["highlighter", "brush"])
      .dissociateSideEffect(["selectionBox", "brush"]);

    // Canvas for cumulative incident counts
    const canvas2 = muze()
      .canvas()
      .data(incidentDm)
      .rows(["Number of Incidents"])
      .columns(["Date"])
      .color({ value: "#414141" })
      .layers([{ mark: "line", interpolate: "stepAfter" }])
      .config({
        axes: {
          y: { name: "Number of Incidents" },
        },
        border: {
          showValueBorders: { left: false, bottom: false }
        },
        interaction: {
          tooltip: {
            formatter: dataModel =>
              tooltipFormatter(dataModel, ["Date", "Number of Incidents"])
          }
        }
      })
      .mount("#incidents-by-year-step-content");

    // Canvas for the heat map airline vs year
    const canvas3 = muze()
      .canvas()
      .data(sdm)
      .rows(["Airline"])
      .columns(["Year"])
      .color({ field: "incident-count", range: ["#ea4335"] })
      .width((window.innerWidth - 200) / 2)
      .config({
        axes: {
          x: { padding: 0 },
          y: { padding: 0 }
        },
        interaction: {
          tooltip: {
            formatter: dataModel => {
              const tooltipData = dataModel.getData().data;
              const fieldConfig = dataModel.getFieldsConfig();
              const elem =  document.getElementById("incidents-by-year-heatmap-content").getElementsByClassName('muze-tooltip-box')[0];
              const backElem = document.createElement("div");
        
          
              backElem.style.position = 'absolute'
              backElem.style.top = '0'
              backElem.style.left = '0'
              backElem.style.width = "10px";
              backElem.style.height = "100%";
              elem.appendChild(backElem);

              let tooltipContent = "<div class = 'tooltip-mod'>";
              tooltipData.forEach((dataArray, i) => {
                const airline = dataArray[fieldConfig["Airline"].index];
                const year = dataArray[fieldConfig["Year"].index];
                backElem.style.background = colorsForAirlines[airline];
                const incidentCount =
                  dataArray[fieldConfig["incident-count"].index];
                const incident = incidentCount > 1 ? "incidents" : "incident";
                tooltipContent += `<div class = "tooltip-header">${jsUcfirst(airline)}</div>${incidentCount} ${incident} in ${year}`;
              });
              return html`
                ${tooltipContent}</div>
              `;
            }
          }
        }
      })
      .mount("#incidents-by-year-heatmap-content");
    muze.ActionModel.for(canvas1, canvas3)
      .dissociateSideEffect(["highlighter", "select"])
      .dissociateSideEffect(["tooltip", "brush,select"])
      .dissociateSideEffect(["highlighter", "brush"])
      .dissociateSideEffect(["selectionBox", "brush"]);

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
      let newDm = trellisDM.select(fields => fields.Airline.value === e[0]);
      
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
                const elem =  newElement.getElementsByClassName('muze-tooltip-box')[0];
                const backElem = document.createElement("div");
          
                backElem.style.background = colorsForAirlines[e[0]];
                backElem.style.position = 'absolute'
                backElem.style.top = '0'
                backElem.style.left = '0'
                backElem.style.width = "10px";
                backElem.style.height = "100%";
                elem.appendChild(backElem);
             
                let tooltipContent = `<div class = "tooltip-mod"><div class = "tooltip-header">${jsUcfirst(e[0])}</div>`;
                let x = 0;
                tooltipData.forEach((dataArray, i) => {
                  const dateVar = dataArray[fieldConfig['Date'].index];
                  const num = dataArray[fieldConfig['Number of Incidents by Airline'].index];
                  const details = JSON.parse(dataArray[fieldConfig['Details'].index]);
                  const date = new Date(dateVar);
                  tooltipContent+=`<div class = "tooltip-sub-header">Incident #${num + x}</div>`;
                  x++;
                  tooltipContent+=`<div class = "tooltip-content">${details.content[0]}</div>`;
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
                  airbusDate.getMonth() === 7 &&
                  airbusDate.getFullYear() === 2015
                );
              })
          })
          .layers([
            { mark: "line" },
            {
              mark: "tick",
              name: "introAirBusA320",
              className: "introAirBusA320",
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
              name: "introAirBusA320Text",
              className: "introAirBusA320Text",
              encoding: {
                y: { field: null },
                text: {
                  field: "Date",
                  formatter: value => {
                    return `Introduction of AirBus A320 Neo`;
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
                  points[i].update.x -= size.width / 2 + 5;
                }
                return points;
              },
              calculateDomain: false,
              source: "airbusA230DM",
              interactive: false
            }
          ]);
      }

      trellisCanvases.push(canvas);
    });
    muze.ActionModel.for(...trellisCanvases).enableCrossInteractivity();
  })
);
