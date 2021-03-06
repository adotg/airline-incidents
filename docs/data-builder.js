const years = [];
let dataYears = [];
let allAirlines = [];

const formalNames = {
  airasia: 'AirAsia',
  indigo: 'Indigo',
  'air-india': 'Air India',
  goair: 'GoAir',
  spicejet: 'SpiceJet',
  'jet-airways': 'Jet Airways',
  vistara: 'Vistara'
};

const buildData = originalData => {
  const data = originalData
    .filter(row => !!row[1]) /* Delets rows which does not contain any data */
    .map(row => ((row[0] = formalNames[row[0]]), row))
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

  let dm = new DataModel(nData, schema).sort([["Date"]]);;

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
          date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1;
        
        return `${month}-${date.getFullYear()}`;
      }
    ]
  );

  let sdm = dm.sort([["Date"]]);


    const tempYears = []
  // Create a variable to create year data
  sdm = sdm.calculateVariable({ name: "Year", type: "dimension" }, [
    "Date",
    d => {
      const year =  new Date(d).getFullYear();
      if(tempYears.indexOf(year)===-1){
        tempYears.push(year);
      }
      return year;
    }
  ]);

  for(let x = tempYears[0]; x<=tempYears[tempYears.length-1]; x++){
      years.push(x);
  }
  dataYears = tempYears;

  // Create a variable to create pseudo axis
  sdm = sdm.calculateVariable(
    {
      name: "Count of Incidents",
      type: "measure",
      defAggFn: "sum"
    },
    ["Date", () => 1]
  );

  // DataModel for the cumulative line chart
  let incidentDm = calcCumulative(sdm, "Date", "Number of Incidents");
  

  // DataModel for the cumulative bar chart  monthly
  let incidentDmMonthly = sdm;
//   let incidentDmMonthly = calcCumulative(sdm, "Monthly Date", "Number of Incidents");

  let airlineDM = sdm.groupBy(["Airline"], {
    "Count of Incidents": "count"
  });

  // Getting list of airlines
  const airlines = airlineDM.sort([["Count of Incidents", "desc"]]).getData().data;

  allAirlines = airlines.map(e=>e[0])

  // DataModel for the heatmap
  airlineDM = airlineDM.calculateVariable({ name: "c", type: "dimension" }, [
    "Airline",
    d => {
      return 1;
    }
  ]);

  // DataModel for the trellis
  const trellisDM = cumulativeCalculationAirlineDate(dm);

  const numberOfIncidents =  sdm.groupBy([""]).getData().data[0][0];

  return {
    data,
    sdm,
    airlines,
    airlineDM,
    trellisDM,
    incidentDm,
    incidentDmMonthly,
    numberOfIncidents
  };
};
