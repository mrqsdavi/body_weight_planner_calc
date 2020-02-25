const BodyModel = require('./bodymodel');

var MIN_CALORIES = 0.0,
INITIAL_CALORIES = 2200.0,
MIN_CARB_INTAKE_PCT = 0.0,
MAX_CARB_INTAKE_PCT = 100.0,
INITIAL_CARB_INTAKE_PCT = 50.0,
INITIAL_PAL = 1.6,
MIN_SODIUM = 0.0,
MAX_SODIUM = 50000.0,
INITIAL_SODIUM = 4000.0,
MIN_ACTIVITY_CHG_PCT = -100.0,
INITIAL_ACTIVITY_CHG_PCT = 0.0;

class Intervention {
  constructor (day, calories, carbinpercent, actchangepercent, sodium) {
      this.calories = (calories && calories >= MIN_CALORIES) ? calories : INITIAL_CALORIES;
      this.carbinpercent = (carbinpercent && (carbinpercent >= MIN_CARB_INTAKE_PCT) && (carbinpercent <= MAX_CARB_INTAKE_PCT)) ? carbinpercent : INITIAL_CARB_INTAKE_PCT;
      this.PAL = INITIAL_PAL;
      this.sodium = (sodium && (sodium >= MIN_SODIUM) && (sodium <= MAX_SODIUM)) ? sodium : INITIAL_SODIUM;
      this.on = this.on || true;
      this.rampon = this.rampon || false;
      this.actchangepercent = (actchangepercent && actchangepercent >= MIN_ACTIVITY_CHG_PCT) ? actchangepercent : INITIAL_ACTIVITY_CHG_PCT;
      this.day = day || 100;
      this.title = "";
      this.isdetailed = this.isdetailed || false;
  }

  static forgoal = function (baseline, goalwt, goaltime, actchangepercent, mincals, eps) {
      var logMessage = '',
          holdcals = 0.0;
      //We create the Intervention
      var goalinter = new Intervention();

      //We then set it's title and to start immediately
      goalinter.title = "Goal Intervention";
      goalinter.day = 1;

      //We set the calories to their minimum
      goalinter.calories= mincals;

      //Enter in the activity change level
      goalinter.actchangepercent = actchangepercent;

      //We use the baseline values for carbs and sodium)
      goalinter.carbinpercent = baseline.carbIntakePct;
      goalinter.setproportionalsodium(baseline);

      //console.log("goalinter: " + JSON.stringify(goalinter));
      if ((baseline.weight == goalwt) && (actchangepercent == 0)) {
          goalinter.calories = baseline.getMaintCals();
          goalinter.setproportionalsodium(baseline);
      } else {
          var starvtest = BodyModel.projectFromBaselineViaIntervention(baseline, goalinter, goaltime);
          //console.log("starvtest: " + JSON.stringify(starvtest));


          var starvwt = starvtest.getWeight(baseline);
          starvwt = (starvwt < 0) ? 0 : starvwt;

          var error = Math.abs(starvwt - goalwt);

          if ((error < eps) || (goalwt <= starvwt)) {
              logMessage = 'PROBLEM in calsforgoal'
                  + '    error is ' + error
                  + '    starvwt is' + starvwt
                  + '    starv[0] is' + starvtest.fat
                  + '    starv[1] is' + starvtest.lean
                  + '    starv[2] is' + starvtest.decw
                  + '    goalwt is' + goalwt
                  + '    mincals is ' + mincals
                  + '    goalwt is ' + goalwt
                  + '    goaltime is ' + goaltime
                  + '    eps is ' + eps;
              //$log.error(logMessage);

              goalinter.calories = 0.0;

              throw "Unachievable Goal";
          }

          var checkcals = mincals;
          var calstep = 200.0;

          //$log.info('Entering loop...');
          //$log.info('First calstep in cals for goal = ' + calstep);

          var i = 0;

          var PCXerror = 0;
          do {
              i++;
              holdcals = checkcals;
              checkcals += calstep;

              goalinter.calories = checkcals;
              goalinter.setproportionalsodium(baseline);

              var testbc = BodyModel.projectFromBaselineViaIntervention(baseline, goalinter, goaltime);
              var testwt = testbc.getWeight(baseline);

              //console.log(JSON.stringify(testbc) + ", " + JSON.stringify(testwt));

              if (testwt < 0.0) {
                  PCXerror++;
                  console.log("NEGATIVE testwt " + PCXerror);
                  if (PCXerror>10){
                      throw "Unachievable Goal";
                  }
              }
              error = Math.abs(goalwt - testwt);

              if (i == 0) {
                  logMessage = 'Loop report ' + i
                      + '    error=' + error
                      + '    bc=' + testbc.fat + ',' + testbc.lean
                      + '    testwt=' + testwt
                      + '    calstep=' + calstep
                      + '    holdcals=' + holdcals;
                  $log.error(logMessage);
              }

              if ((error > eps) && (testwt > goalwt)) {
                  calstep /= 2.0;
                  checkcals = holdcals;
              }
          } while (error > eps);

          //logMessage = 'Exiting loop after ' + i + ' iterations, result is ' + holdcals + ', error = ' + error + ', calstep = ' + calstep;
          //$log.info(logMessage);
      }

      return goalinter;
  };

  //getPAL_Act = function (baseline) {
  //    return baseline.getActivityParam() * (this.PAL - 1.0) / (baseline.getPAL() - 1.0);
  //};

  getAct = function (baseline) {
      return baseline.getActivityParam() * (1.0 + this.actchangepercent / 100.0);
  };

  setproportionalsodium = function (baseline) {
      this.sodium = (baseline.sodium * this.calories / baseline.getMaintCals());
  };
}

module.exports = Intervention;