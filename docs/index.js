
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
  //     const supportsOrientationChange = window.onorientationchange ;
  //  const orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
  //     // document.getElementById('number-of-incidents-header').innerHTML = screen.width;
  //     window.addEventListener(supportsOrientationChange, chartCreator, false)

//       var previousOrientation = window.orientation;
//       const width = screen.width
//       const height = screen.height
// var checkOrientation = function(){
//     if(window.orientation !== previousOrientation){
//         previousOrientation = window.orientation;
//         chartCreator()
//         // orientation changed, do your magic here
//     }
// };

window.addEventListener("resize", checkOrientation, false);
window.addEventListener("orientationchange", checkOrientation, false);

// (optional) Android doesn't always fire orientationChange on 180 degree turns
setInterval(checkOrientation, 2000);
    

  })
);

