const createHeatMap = datamodel => {

    const groupedDataModel = datamodel.groupBy(['Airline', 'Year']);
    const fieldConfig = groupedDataModel.getFieldsConfig();
    const incCtIndex = fieldConfig['incident-count'].index;

    let max = 0;
    const maxIncCt = groupedDataModel.getData().data.forEach(e=>{
        
        if(max<e[incCtIndex]){
            max = e[incCtIndex];
        }
    })
    
  // Canvas for the heat map airline vs year
  const canvas = muze()
    .canvas()
    .data(datamodel)
    .rows(["Airline"])
    .columns(["Year"])
    .color({ 
        field: "incident-count", 
        range: ["#ea4335"],
        domain: [0, max],
    })
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
              const incidentCount = dataArray[fieldConfig["incident-count"].index];
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

  ActionModel.for( canvas)
    .dissociateSideEffect(["highlighter", "select"])
    .dissociateSideEffect(["tooltip", "brush,select"])
    .dissociateSideEffect(["highlighter", "brush"])
    .dissociateSideEffect(["selectionBox", "brush"]);
};
