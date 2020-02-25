class DailyParams {
  constructor (calories, carbpercent, sodium, actparam) {
      this.calories = calories || 0;
      this.calories = (this.calories < 0) ? 0 : this.calories;
      this.carbpercent = carbpercent || 0;
      this.carbpercent = (this.carbpercent < 0) ? 0 : this.carbpercent;
      this.carbpercent = (this.carbpercent > 100.0) ? 100.0 : this.carbpercent;
      this.sodium = sodium || 0;
      this.sodium = (this.sodium < 0) ? 0 : this.sodium;
      this.actparam = actparam || 0;
      this.actparam = (this.actparam < 0) ? 0 : this.actparam;
      this.flag = this.flag || false;
      this.ramped = this.ramped || false;
  };

  static createFromBaseline = function (baseline) {
    return new DailyParams(
      baseline.getMaintCals(),
      baseline.carbIntakePct,
      baseline.sodium,
      baseline.getActivityParam()
    );
  };

  static createFromIntervention = function (intervention, baseline) {
      return new DailyParams(
      intervention.calories,
      intervention.carbinpercent,
      intervention.sodium,
      intervention.getAct(baseline)
    );
  };

  getCarbIntake = function () {
      return this.carbpercent / 100.0 * this.calories;
  };

  makeCaloricCopy = function (calorie) {
      var ncals = this.calories + calorie;
      ncals = (ncals < 0.0) ? 0.0 : ncals;
      return new DailyParams(ncals, this.carbpercent, this.sodium, this.actparam);
  };

  static avg = function (dailyParams1, dailyParams2) {
      var calories = (dailyParams1.calories + dailyParams2.calories) / 2.0,
      sodium = (dailyParams1.sodium + dailyParams2.sodium) / 2.0,
      carbpercent = (dailyParams1.carbpercent + dailyParams2.carbpercent) / 2.0,
      actparam = (dailyParams1.actparam + dailyParams2.actparam) / 2.0;

      return new DailyParams(calories, carbpercent, sodium, actparam);
  };

  static makeparamtrajectory = function (baseline, intervention1, intervention2, simlength) {
      //console.log("int1: "+ JSON.stringify(intervention1));
      //console.log("int2: " + JSON.stringify(intervention2));

      var maintcals = baseline.getMaintCals(),
      carbinp = baseline.carbIntakePct,
      act = baseline.getActivityParam(),
      Na = baseline.sodium,
      paramtraj = [],
      noeffect1 = (!intervention1.on) || ((intervention1.on) && (intervention1.day > simlength) && (!intervention1.rampon)),
      noeffect2 = (!intervention2.on) || ((intervention2.on) && (intervention2.day > simlength) && (!intervention2.rampon)),
      noeffect = noeffect1 && noeffect2,
      sameday = intervention1.day === intervention2.day,
      oneon = ((intervention1.on) && (!intervention2.on)) || ((!intervention1.on) && (intervention2.on)),
      bothon = (intervention1.on) && (intervention2.on),
      i = 0,
      dcal = 0.0,
      dact = 0.0,
      dcarb = 0.0,
      dsodium = 0.0,
      dailyParams = null;

      paramtraj.push(DailyParams.createFromBaseline(baseline));

      //console.log( (intervention1.day > parseInt(simlength)) + " = " + intervention1.day + ">" + parseInt(simlength) )

      if (noeffect) {
          for (i = 1; i < simlength; i++)
              paramtraj[i] = DailyParams.createFromBaseline(baseline);
      } else if ((oneon) || ((bothon) && (sameday) && (intervention2.rampon))) {
          var intervention;

          if (oneon)
              intervention = intervention1.on ? intervention1 : intervention2;
          else
              intervention = intervention2;

          if (intervention.rampon) {
              for (i = 1; i < intervention.day ; i++) {
                  dcal = maintcals + i / intervention.day * (intervention.calories - maintcals);
                  dact = act + i / intervention.day * (intervention.getAct(baseline) - act);
                  dcarb = carbinp + i / intervention.carbinpercent * (intervention.carbinpercent - carbinp);
                  dsodium = Na + i / intervention.day * (intervention.sodium - Na);
                  dailyParams = new DailyParams(dcal, dcarb, dsodium, dact);
                  dailyParams.ramped = true;

                  paramtraj.push(dailyParams);
              }

              for (i = intervention.day ; i < simlength; i++)
                  paramtraj.push(DailyParams.createFromIntervention(intervention, baseline));
          } else {
              for (i = 1; i < intervention.day ; i++)
                  paramtraj.push(DailyParams.createFromBaseline(baseline));

              for (i = intervention.day ; i < simlength; i++)
                  paramtraj.push(DailyParams.createFromIntervention(intervention, baseline));
          }
      } else {
          var firstIntervention = intervention1.day < intervention2.day ? intervention1 : intervention2,
        secondIntervention = intervention1.day < intervention2.day ? intervention2 : intervention1;

          if (firstIntervention.rampon) {
              for (i = 1; i < firstIntervention.day ; i++) {
                  dcal = maintcals + i / firstIntervention.day * (firstIntervention.calories - maintcals);
                  dact = act + i / firstIntervention.day * (firstIntervention.getAct(baseline) - act);
                  dcarb = carbinp + i / firstIntervention.carbinpercent * (firstIntervention.carbinpercent - carbinp);
                  dsodium = Na + i / firstIntervention.day * (firstIntervention.sodium - Na);
                  dailyParams = new DailyParams(dcal, dcarb, dsodium, dact);
                  dailyParams.ramped = true;

                  paramtraj.push(dailyParams);
              }
          } else {
              for (i = 1; i < firstIntervention.day ; i++)
                  paramtraj.push(DailyParams.createFromBaseline(baseline));
          }

          if (secondIntervention.rampon) {
              for (i = firstIntervention.day ; i < secondIntervention.day ; i++) {
                  var firstCalories = firstIntervention.calories,
            firstDay = firstIntervention.day,
            firstSodium = firstIntervention.sodium,
            firstAct = firstIntervention.getAct(baseline),
            firstCarbIn = firstIntervention.carbinpercent,
            secondCalories = secondIntervention.calories,
            secondDay = secondIntervention.day,
            secondSodium = secondIntervention.sodium,
            secondAct = secondIntervention.getAct(baseline),
            secondCarbIn = secondIntervention.carbinpercent;

                  dcal = firstCalories + (i - firstDay) / (secondDay - firstDay) * (secondCalories - firstCalories);
                  dact = firstAct + (i - firstDay) / (secondDay - firstDay) * (secondAct - firstAct);
                  dcarb = firstCarbIn + (i - firstDay) / (secondDay - firstDay) * (secondCarbIn - firstCarbIn);
                  dsodium = firstSodium + (i - firstDay) / (secondDay - firstDay) * (secondSodium - firstSodium);
                  dailyParams = new DailyParams(dcal, dcarb, dsodium, dact);
                  dailyParams.ramped = true;

                  paramtraj.push(dailyParams);
              }
          } else {
              var endfirst = Math.min(secondIntervention.day, parseInt(simlength, 10));

              for (i = firstIntervention.day ; i < endfirst; i++)
                  paramtraj.push(DailyParams.createFromIntervention(firstIntervention, baseline));
          }

          if (simlength > secondIntervention.day)
              for (i = secondIntervention.day ; i < simlength; i++)
                  paramtraj.push(DailyParams.createFromIntervention(secondIntervention, baseline));
      }

      return paramtraj;
  };

}

module.exports = DailyParams;