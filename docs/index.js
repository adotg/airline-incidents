
fetch("data.json").then(resp =>
  resp.json().then(originalData => {
    const {
        data,
        sdm,
        numberOfIncidents,
        airlines,
        airlineDM,
        trellisDM,
        incidentDm,
        incidentDmMonthly
      } = buildData(originalData);


    // Main KPI
    document.getElementById(
      "number-of-incidents-content"
    ).innerHTML = numberOfIncidents;
      const chartCreator = ()=>{
        createStackedBar(airlineDM, airlines);
        createStepLineAndBar(incidentDmMonthly, incidentDm, numberOfIncidents);
        createHeatMap(sdm);
        createTrellis(trellisDM, airlines);
      }
      chartCreator();
      // document.getElementById('number-of-incidents-header').innerHTML = screen.width;
      // // window.addEventListener('resize', chartCreator)
    

  })
);

