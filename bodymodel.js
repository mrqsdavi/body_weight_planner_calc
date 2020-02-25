const DailyParams = require('./dailyparams');
const BodyChange = require('./bodychange');

class BodyModel {
  constructor(fat, lean, glycogen, decw, therm) {
    this.RK4wt = [1, 2, 2, 1];
    this.fat = fat || 0;
    this.lean = lean || 0;
    this.glycogen = glycogen || 0;
    this.decw = decw || 0;
    this.therm = therm || 0;
  }

  static createFromBaseline = function (baseline) {
    return new BodyModel(
      baseline.getFatWeight(),
      baseline.getLeanWeight(),
      baseline.glycogen,
      baseline.dECW,
      baseline.getTherm()
    );
  }

  static projectFromBaseline = function (baseline, dailyParams, simlength) {
      //Creates a BodyModel projected from the given baseline, using the input DailyParameters for simlength days
      var loop = BodyModel.createFromBaseline(baseline);
      //console.log("loop: " + JSON.stringify(loop));
      for (var i = 0; i < simlength ; i++) {
          loop = BodyModel.RungeKatta(loop, baseline, dailyParams);
          //console.log("loop: " + JSON.stringify(loop));
      }
      return loop;
  };

  static projectFromBaselineViaIntervention = function (baseline, intervention, simlength) {
      ////intervention.sodium = 4000;
      //console.log("baseline: " + JSON.stringify(baseline));
      //console.log("intervention: " + JSON.stringify(intervention));
      //console.log("simlength: " + JSON.stringify(simlength));



      var dailyParams = new DailyParams.createFromIntervention(intervention, baseline);
      //console.log("dailyParams: " + JSON.stringify(dailyParams));
      return BodyModel.projectFromBaseline(baseline, dailyParams, simlength);
  };

  getWeight = function (baseline) {
      var weight = this.fat + this.lean + baseline.getGlycogenH2O(this.glycogen) + this.decw;
      //console.log(weight + " = " + this.fat + " " + this.lean + " " + baseline.getGlycogenH2O(this.glycogen) + " " + this.decw);
      //console.log(weight);
      return weight
  };

  getapproxWeight = function () {
      return this.fat + this.lean + this.dECW;
  };

  getFatFree = function (baseline) {
      return this.getWeight(baseline) - this.fat;
  };

  getFatPercent = function (baseline) {
      return this.fat / this.getWeight(baseline) * 100.0;
  };

  getBMI = function (baseline) {
      return baseline.getNewBMI(this.getWeight(baseline));
  };

  dt = function (baseline, dailyParams) {
      var df = this.dfdt(baseline, dailyParams),
      dl = this.dldt(baseline, dailyParams),
      dg = this.dgdt(baseline, dailyParams),
      dDecw = this.dDecwdt(baseline, dailyParams),
      dtherm = this.dthermdt(baseline, dailyParams);

      return new BodyChange(df, dl, dg, dDecw, dtherm);
  };

  static RungeKattaAveraged = function (bodyModel, baseline, dailyParams1, dailyParams2) {
      var midailyParams = dailyParams2.isramped() ? dailyParams2 : DailyParams.avg(dailyParams1, dailyParams2),
      dt1 = bodyModel.dt(baseline, dailyParams1),
      b2 = bodyModel.addchange(dt1, 0.5),
      dt2 = b2.dt(baseline, midailyParams),
      b3 = bodyModel.addchange(dt2, 0.5),
      dt3 = b3.dt(baseline, midailyParams),
      b4 = bodyModel.addchange(dt3, 1.0),
      dt4 = b4.dt(baseline, dailyParams2),
      finaldt = bodyModel.avgdt_weighted(this.RK4wt, [dt1, dt2, dt3, dt4]),
      finalstate = bodyModel.addchange(finaldt, 1.0);

      return finalstate;
  };

  static RungeKatta = function (bodyModel, baseline, dailyParams) {
      
      var dt1 = bodyModel.dt(baseline, dailyParams),
      b2 = bodyModel.addchange(dt1, 0.5),
      dt2 = b2.dt(baseline, dailyParams),
      b3 = bodyModel.addchange(dt2, 0.5),
      dt3 = b3.dt(baseline, dailyParams),
      b4 = bodyModel.addchange(dt3, 1.0),
      dt4 = b4.dt(baseline, dailyParams),
      finaldt = bodyModel.avgdt_weighted(this.RK4wt, [dt1, dt2, dt3, dt4]),
      finalstate = bodyModel.addchange(finaldt, 1.0);
      //console.log(dt1 + " " + b2 + " " + dt2 + " " + b3 + " " + dt3 + " " + b4 + " " + dt4 + " " + finaldt + " " + finalstate);
      //console.log(JSON.stringify(dt1));
      return finalstate;
  };

  static Euler = function (bodyModel, baseline, dailyParams) {
      var dt1 = bodyModel.dt(baseline, dailyParams);
      return bodyModel.addchange(dt1, 1.0);
  };

  getTEE = function (baseline, dailyParams) {
      var p = this.getp(),
      calin = dailyParams.calories,
      carbflux = this.carbflux(baseline, dailyParams),
      Expend = this.getExpend(baseline, dailyParams);
          //console.log(p + ", " + calin + ", " + carbflux + ", " + Expend);
      return (Expend + (calin - carbflux) * ((1.0 - p) * 180.0 / 9440.0 + p * 230.0 / 1807.0)) / (1.0 + p * 230.0 / 1807.0 + (1.0 - p) * 180.0 / 9440.0);

  };

  getExpend = function (baseline, dailyParams) {
      var TEF = 0.1 * dailyParams.calories,
      weight = baseline.getNewWeightFromBodyModel(this);
      //console.log(JSON.stringify(TEF) + ", " + JSON.stringify(weight));
      return baseline.getK() + 22.0 * this.lean + 3.2 * this.fat + dailyParams.actparam * weight + this.therm + TEF;
  };

  getp = function () {
      return 1.990762711864407 / (1.990762711864407 + this.fat);
  };

  carbflux = function (baseline, dailyParams) {
      var k_carb = baseline.getCarbsIn() / Math.pow(baseline.glycogen, 2.0);
      return dailyParams.getCarbIntake() - k_carb * Math.pow(this.glycogen, 2.0);
  };

  Na_imbal = function (baseline, dailyParams) {
      return dailyParams.sodium - baseline.sodium - 3000.0 * this.decw - 4000.0 * (1.0 - dailyParams.getCarbIntake() / baseline.getCarbsIn());
  };

  dfdt = function (baseline, dailyParams) {
      //console.log("dp: "+JSON.stringify(dailyParams));
      var dfdt = (1.0 - this.getp()) * (dailyParams.calories - this.getTEE(baseline, dailyParams) - this.carbflux(baseline, dailyParams)) / 9440.0;
      //console.log(this.carbflux(baseline, dailyParams));
      return dfdt;
  };

  dldt = function (baseline, dailyParams) {
      var dldt = this.getp() * (dailyParams.calories - this.getTEE(baseline, dailyParams) - this.carbflux(baseline, dailyParams)) / 1807.0;
      return dldt;
  };

  dgdt = function (baseline, dailyParams) {
      return this.carbflux(baseline, dailyParams) / 4180.0;
  };

  dDecwdt = function (baseline, dailyParams) {
      return this.Na_imbal(baseline, dailyParams) / 3220.0;
  };

  dthermdt = function (baseline, dailyParams) {
      return (0.14 * dailyParams.calories - this.therm) / 14.0;
  };

  addchange = function (bchange, tstep) {
      return new BodyModel(
      this.fat + tstep * bchange.df,
      this.lean + tstep * bchange.dl,
      this.glycogen + tstep * bchange.dg,
      this.decw + tstep * bchange.dDecw,
      this.therm + tstep * bchange.dtherm
      );
  };

  cals4balance = function (baseline, act) {
      var weight = this.getWeight(baseline),
      Expend_no_food = baseline.getK() + 22.0 * this.lean + 3.2 * this.fat + act * weight,
      p = this.getp(),
      p_d = 1.0 + p * 230.0 / 1807.0 + (1.0 - p) * 180.0 / 9440.0,
      p_n = (1.0 - p) * 180.0 / 9440.0 + p * 230.0 / 1807.0,
      maint_nocflux = Expend_no_food / (p_d - p_n - 0.24);

          return maint_nocflux;
  };

  static Bodytraj = function (baseline, paramtraj) {
      var simlength = paramtraj.length,
    bodytraj = [];

      bodytraj.push(new BodyModel(baseline));

      for (var i = 1; i < simlength; i++)
          bodytraj.push(BodyModel.RungeKatta(bodytraj[(i - 1)], baseline, paramtraj[(i - 1)], paramtraj[i]));

      return bodytraj;
  };

  avgdt = function (bchange) {
      var sumf = 0.0,
      suml = 0.0,
      sumg = 0.0,
      sumdecw = 0.0,
      sumtherm = 0.0;

      for (var i = 0; i < bchange.length; i++) {
          sumf += bchange[i].df;
          suml += bchange[i].dl;
          sumg += bchange[i].dg;
          sumdecw += bchange[i].dDecw;
          sumtherm += bchange[i].dtherm;
      }

      var nf = sumf / bchange.length,
  nl = suml / bchange.length,
  ng = sumg / bchange.length,
  ndecw = sumdecw / bchange.length,
  ntherm = sumtherm / bchange.length;

      return new BodyChange(nf, nl, ng, ndecw, ntherm);
  };

  avgdt_weighted = function (wt, bchange) {
      var sumf = 0.0,
  suml = 0.0,
  sumg = 0.0,
  sumdecw = 0.0,
  sumtherm = 0.0,
  wti = 0,
  wtsum = 0;

      for (var i = 0; i < bchange.length; i++) {
          try {
              wti = wt[i];
          }
          catch (e) {
              wti = 1;
          }

          wti = (wti < 0) ? 1 : wti;
          wtsum += wti;
          sumf += wti * bchange[i].df;
          suml += wti * bchange[i].dl;
          sumg += wti * bchange[i].dg;
          sumdecw += wti * bchange[i].dDecw;
          sumtherm += wti * bchange[i].dtherm;
      }

      var nf = sumf / wtsum,
  nl = suml / wtsum,
  ng = sumg / wtsum,
  ndecw = sumdecw / wtsum,
  ntherm = sumtherm / wtsum;

      return new BodyChange(nf, nl, ng, ndecw, ntherm);
  };
}

module.exports = BodyModel;