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

function jsUcfirst(string) 
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

fetch("data.json").then(resp =>
  resp.json().then(data => {
    const DataModel = muze.DataModel;

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
        defAggFn: "count"
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

    let incidentDm = sdm.groupBy(["Date"]);
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
      .data(airlineDM)
      .rows(["incident-count-2"])
      .columns(["incident-count"])
      .color("Airline")
      .config({
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
      .columns(["Date"])
      .layers([
        {
          mark: "line",
          interpolate: "stepBefore"
        }
      ])
      .config({
        axes: {
          y: {
            showAxisName: false
          }
        }
      })
      .mount("#incidents-by-year-step-content");

    const canvas3 = muze()
      .canvas()
      .data(sdm)
      .rows(["Airline"])
      .columns(["Year"])
      .color("incident-count")
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
        sdm.select(fields => fields.Airline.value === e[0]).groupBy(['Date']),
        "incident-count",
        "incident-count-cumulative"
      );

      const canvas = muze()
        .canvas()
        .data(newDm)
        .rows(["incident-count-cumulative"])
        .columns(["Date"])
        .title(jsUcfirst(e[0]))
        .config({
          axes: {
            x: {
              tickValues: dates,
              domain: [dates[0], dates[dates.length - 1]]
            },
            y: {
              show: false
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
