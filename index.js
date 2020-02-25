const Baseline = require('./baseline');
const Intervention = require('./intervention');

const ENERGYUNITS = 1;

//Entradas
const age = 27; // Ano
const height = 170; // Centímetros
const weight = 124; // Quilogramas
const physicalActivityLevel = 1.6; // 1.4 - 2.3

var goalTime = 90; //Dias para conseguir o objetivo.
var goalWeight = 100; // Quilogramas
const baseline = new Baseline(true, age, height, weight, true, false, physicalActivityLevel);

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

console.log(goalCalsField, unachievableGoal);