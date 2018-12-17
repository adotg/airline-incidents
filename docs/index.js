const cumulativeCalculation = (dm, variable, cumulativeVariableName) => {
  let i = 0;
  return dm.calculateVariable(
    {
      name: cumulativeVariableName,
      type: "measure",
      defAggFn: "sum"
    },
    [
      variable,
      inc => {
        i = i + inc;
        return i;
      }
    ]
  );
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

    const dm = new DataModel(nData, schema);
    let sdm = dm.sort([["Date"]]);

    // Create a variable to create pseudo axis
    sdm = sdm.calculateVariable(
      {
        name: "incident-count",
        type: "measure",
        defAggFn: "sum"
      },
      ["Date", () => 1]
    );

    // Create a variable to create year data
    sdm = sdm.calculateVariable(
      {
        name: "Year",
        type: "dimension"
      },
      [
        "Date",
        d => {
          return new Date(d).getFullYear();
        }
      ]
    );

    let airlineDM = sdm.groupBy(["Airline"], {
      "incident-count": "count"
    });
    const airlines = airlineDM.getData().data;
    airlineDM = airlineDM.calculateVariable(
      {
        name: "incident-count-2",
        type: "dimension"
      },
      [
        "Airline",
        d => {
          return 1;
        }
      ]
    );

    // Create a variable to create year data
    let incidentDm = sdm.calculateVariable(
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
    incidentDm = incidentDm.groupBy(["Monthly Date"]);
    incidentDm = cumulativeCalculation(
      incidentDm,
      "incident-count",
      "incident-count-cumulative"
    );
    document.getElementById(
      "number-of-incidents-content"
    ).innerHTML = sdm.groupBy([""]).getData().data[0][0];

    const canvas1 = muze()
      .canvas()
      .data(airlineDM.sort([["incident-count"]]))
      .rows(["incident-count-2"])
      .columns(["incident-count"])
      .color({
        field: "Airline",
        domain: [
          "indigo",
          "jet-airways",
          "air-india",
          "airasia",
          "vistara",
          "goair"
        ],
        range: [
          "#001197",
          "#f6e291",
          "#f3a737",
          "#f11a12",
          "#592b50",
          "#1c5891"
        ]
      })
      .layers([
        {
          mark: "bar",
          transform: {
            sort: "descending"
          }
        }
      ])
      .config({
        autoGroupBy: {
          disabled: true
        },
        gridLines: {
          x: {
            show: false
          }
        },
        border: {
          showValueBorders: {
            left: false,
            bottom: false
          }
        },
        legend: {
          position: "bottom",
          color: {
            title: {
              text: " "
            }
          }
        },
        axes: {
          y: {
            show: false,
            name: "s"
          },
          x: {
            show: false
          }
        }
      })
      .mount("#incidents-breakup");

    const canvas2 = muze()
      .canvas()
      .data(incidentDm)
      .rows(["incident-count-cumulative"])
      .columns(["Monthly Date"])
      .color({
        value: "#414141"
      })
      .layers([
        {
          mark: "line",
          interpolate: "stepBefore"
        }
      ])
      .config({
        axes: {
          y: {
            name: "Number of Incidents"
          }
        }
      })
      .mount("#incidents-by-year-step-content");

    const canvas3 = muze()
      .canvas()
      .data(sdm)
      .rows(["Airline"])
      .columns(["Year"])
      .color({
        field: "incident-count",
        range: ["#ea4335"]
      })
      .width((window.innerWidth - 200) / 2)
      .config({
        axes: {
          x: {
            padding: 0
          },
          y: {
            padding: 0
          }
        }
      })
      .mount("#incidents-by-year-heatmap-content");

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
      const newDm = cumulativeCalculation(
        sdm.select(fields => fields.Airline.value === e[0]).groupBy(["Date"]),
        "incident-count",
        "incident-count-cumulative"
      );

      const canvas = muze()
        .canvas()
        .data(newDm)
        .rows(["incident-count-cumulative"])
        .columns(["Date"])
        .color({
          value: "#414141"
        })
        .title(jsUcfirst(e[0]))
        .config({
          axes: {
            x: {
              tickValues: dates,
              domain: [dates[0], dates[dates.length - 1]]
            },
            y: {
              name: "Number of Incidents"
            }
          }
        })
        .mount(newElement);

      trellisCanvases.push(canvas);
    });
    muze.ActionModel.for(...trellisCanvases).enableCrossInteractivity();
  })
);

/**
 * Plan
 * ------------
 *
 * Q: How many incidents/accidents are recorded so far?
 * Q: Contribution of each airline on total incidents?
 * Q: year by year accidents with airline?
 */
