const moment = require('moment');
const Baseline = require('./baseline');
const Intervention = require('./intervention');

const WEIGHTUNITS = 1;
const ENERGYUNITS = 1;


//Entradas
const age = 27; // Years
const height = 170; // Centimeters
const weight = 124; // kilograms
const physicalActivityLevel = 1.4; // 1.4 - 2.3




var goalTime = 200; //Dias para conseguir o objetivo.
var goalWeight = 100;
const baseline = new Baseline(true, age, height, weight, true, false, physicalActivityLevel);

var healthyWeightRange = baseline.getHealthyWeightRange();
const weightRangeLow = Math.floor(healthyWeightRange.low * WEIGHTUNITS);
const weightRangeHigh = Math.ceil(healthyWeightRange.high * WEIGHTUNITS);

const dt = moment(new Date()).add(parseInt(goalTime), 'days').format('M/D/YYYY');

var goalIntervention = new Intervention();
var goalMaintenanceIntervention = goalIntervention;

if (Math.abs(goalWeight - baseline.weight) < .02) {
  goalWeight = baseline.weight;
}

let unachievableGoal = false;

try {
  goalIntervention = Intervention.forgoal(baseline, goalWeight, parseInt(goalTime), 0, 0, 0.001);
  unachievableGoal = false;
} catch (err) {
  unachievableGoal = true;
}

const goalCalsField = Math.round(goalIntervention.calories * ENERGYUNITS);

console.log(goalCalsField);