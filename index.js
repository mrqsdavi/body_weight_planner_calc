const Baseline = require('./baseline');
const Intervention = require('./intervention');
const BodyModel = require('./bodymodel');

const ENERGYUNITS = 1;

//Entradas
const age = 27; // Ano
const height = 170; // Centímetros
const weight = 124; // Quilogramas
const physicalActivityLevel = 1.4; // 1.4 - 2.3
var goalTime = 200; //Dias para conseguir o objetivo.
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
let goalMaintCals = goalCalsField;

var goalbc = new BodyModel.projectFromBaselineViaIntervention(baseline, goalIntervention, parseInt(goalTime) + 1);
var weightAtGoal = baseline.getNewWeightFromBodyModel(goalbc);
var bfpAtGoal = goalbc.getFatPercent(baseline);

if (goalWeight == baseline.weight && goalMaintenanceIntervention.actchangepercent == 0) {
    goalMaintCals = Math.round(baseline.getMaintCals());
} else {
    goalMaintCals = Math.round(goalbc.cals4balance(baseline, goalMaintenanceIntervention.getAct(baseline)));
}

console.log(goalCalsField, unachievableGoal, goalMaintCals);