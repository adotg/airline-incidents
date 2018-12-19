const DataModel = muze.DataModel;
const html = muze.Operators.html;
const ActionModel = muze.ActionModel;
const SpawnableSideEffect = muze.SideEffects.standards.SpawnableSideEffect;

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

const getDisplayDateFromMilliSeconds = (dateVar)=>{
    const date = new Date(dateVar);
   return `${date.getDate()}-${
        months[date.getMonth()]
      }-${date.getFullYear()}`
}

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
   

    tooltipContent[0] = [
      {
        value: variables[0],
        className: "muze-tooltip-key"
      },
      {
        value: getDisplayDateFromMilliSeconds(dateVar),
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

const colorsForAirlines = {
  indigo: "#001197",
  "jet-airways": "#f6e291",
  "air-india": "#f3a737",
  airasia: "#f11a12",
  vistara: "#592b50",
  goair: "#1c5891"
};


const getMaxValue = (datamodel, groupByfields, maxValField) => {
    const groupedDataModel = datamodel.groupBy(groupByfields);
    const fieldConfig = groupedDataModel.getFieldsConfig();
    const incCtIndex = fieldConfig[maxValField].index;
  
    let max = 0;
    groupedDataModel.getData().data.forEach(e => {
      if (max < e[incCtIndex]) {
        max = e[incCtIndex];
      }
    });
    return max;
  };
  