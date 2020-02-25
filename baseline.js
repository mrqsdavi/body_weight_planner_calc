var MAX_AGE = 250.0,
          INITIAL_AGE = 23.0,
          MIN_HEIGHT = 0.1,
          MAX_HEIGHT = 400.0,
          INITIAL_HEIGHT = 180.0,
          MIN_WEIGHT = 0.1,
          INITIAL_WEIGHT = 70.0,
          MIN_BFP = 0.0,
          MAX_BFP = 100.0,
          INITIAL_BFP = 18.0,
          INITIAL_RMR = 1708.0,
          MIN_PAL = 1.0,
          INITIAL_PAL = 1.6,
          INITIAL_CARB_INTAKE_PCT = 50.0,
          INITIAL_SODIUM = 4000.0,
          INITIAL_GLYCOGEN = 0.5,
          INITIAL_DELTA_E = 0,
          INITIAL_DECW = 0;

class Baseline {
  constructor (isMale, age, height, weight, bfp, rmr, pal) {
      this.isMale = isMale ? isMale : true;
      this.bfpCalc = this.bfpCalc || true;
      this.rmrCalc = this.rmrCalc || false;

      this.age = age || INITIAL_AGE;
      this.maximumage = MAX_AGE;

      this.height = height || INITIAL_HEIGHT;
      this.height = (this.height < 0.0) ? MIN_HEIGHT : this.height;
      this.height = (this.height > MAX_HEIGHT) ? MAX_HEIGHT : this.height;

      this.weight = weight || INITIAL_WEIGHT;
      this.weight = (this.weight < 0.0) ? MIN_WEIGHT : this.weight;

      this.bfp = bfp || INITIAL_BFP;
      this.bfp = (this.bfp < MIN_BFP) ? MIN_BFP : this.bfp;
      this.bfp = (this.bfp > MAX_BFP) ? MAX_BFP : this.bfp;

      this.rmr = rmr || INITIAL_RMR;

      this.pal = pal || INITIAL_PAL;
      this.pal = (this.pal < MIN_PAL) ? MIN_PAL : this.pal;

      this.carbIntakePct = INITIAL_CARB_INTAKE_PCT;
      this.sodium = INITIAL_SODIUM;
      this.delta_E = INITIAL_DELTA_E;
      this.dECW = INITIAL_DECW;
      this.glycogen = INITIAL_GLYCOGEN;
  }

  getNewAct = function (intervention) {
    return intervention && intervention.getAct(this);
  };

  getBFP = function () {
      if (this.bfpCalc) {
          if (this.isMale)
              this.bfp = (0.14 * this.age + 37.310000000000002 * Math.log(this.getBMI()) - 103.94);
          else
              this.bfp = (0.14 * this.age + 39.960000000000001 * Math.log(this.getBMI()) - 102.01000000000001);

          this.bfp = (this.bfp < 0.0) ? 0.0 : this.bfp;
          this.bfp = (this.bfp > 60.0) ? 60.0 : this.bfp;
      }

      return this.bfp;
  };

  getHealthyWeightRange = function () {
      var healthyWeightRange = {};
      healthyWeightRange.low = Math.round(18.5 * Math.pow((this.height / 100), 2));
      healthyWeightRange.high = Math.round(25 * Math.pow((this.height / 100), 2))
      return healthyWeightRange;
  };

  getRMR = function () {
      if (!this.rmrCalc) {
          if (this.isMale)
              this.rmr = (9.99 * this.weight + 625.0 * this.height / 100.0 - 4.92 * this.age + 5.0);
          else
              this.rmr = (9.99 * this.weight + 625.0 * this.height / 100.0 - 4.92 * this.age - 161.0);
      }

      return this.rmr;
  };

  getNewRMR = function (newWeight, day) {
      var rmr;

      if (this.isMale)
          rmr = 9.99 * newWeight + 625.0 * this.height / 100.0 - 4.92 * (this.age + day / 365.0) + 5.0;
      else
          rmr = 9.99 * newWeight + 625.0 * this.height / 100.0 - 4.92 * (this.age + day / 365.0) - 161.0;

      return rmr;
  };

  getMaintCals = function () {
      return this.pal * this.getRMR();
  };

  getActivityParam = function () {
      return (0.9 * this.getRMR() * this.pal - this.getRMR()) / this.weight;
  };

  getTEE = function () {
      return this.pal * this.getRMR();
  };

  getActivityExpenditure = function () {
      return this.getTEE() - this.getRMR();
  };

  getFatWeight = function () {
      //console.log(this.weight+" * "+this.getBFP())
      return this.weight * this.getBFP() / 100.0;
  };

  getLeanWeight = function () {
      return this.weight - this.getFatWeight();
  };

  getK = function () {
      return 0.76 * this.getMaintCals() - this.delta_E - 22.0 * this.getLeanWeight() - 3.2 * this.getFatWeight() - this.getActivityParam() * this.weight;
  };

  getBMI = function () {
      return this.weight / Math.pow(this.height / 100.0, 2.0);
  };

  getNewBMI = function (newWeight) {
      return newWeight / Math.pow(this.height / 100.0, 2.0);
  };

  getECW = function () {
      var ECW;

      if (this.isMale)
          ECW = 0.025 * this.age + 9.57 * this.height + 0.191 * this.weight - 12.4;
      else
          ECW = -4.0 + 5.98 * this.height + 0.167 * this.weight;

      return ECW;
  };

  getNewECW = function (days, newWeight) {
      var ECW;

      if (this.isMale)
          ECW = 0.025 * (this.age + days / 365.0) + 9.57 * this.height + 0.191 * newWeight - 12.4;
      else
          ECW = -4.0 + 5.98 * this.height + 0.167 * newWeight;

      return ECW;
  };

  proportionalSodium = function (newCals) {
      return this.sodium * newCals / this.getMaintCals();
  };

  getCarbsIn = function () {
      return this.carbIntakePct / 100.0 * this.getMaintCals();
  };

  setCalculatedBFP = function (bfpcalc) {
      this.bfp = this.getBFP();
      this.bfpCalc = bfpcalc;
  };

  setCalculatedRMR = function (rmrcalc) {
      this.rmr = this.getRMR();
      this.rmrCalc = rmrcalc;
  };

  getGlycogenH2O = function (newGlycogen) {
      return 3.7 * (newGlycogen - this.glycogen);
  };

  getTherm = function () {
      return 0.14 * this.getTEE();
  };

  getBodyComposition = function () {
      return [
          this.weight * this.bfp / 100.0,
          this.weight * (100.0 - this.bfp) / 100.0,
          this.dECW
      ];
  };

  getNewWeight = function (fat, lean, glycogen, deltaECW) {
      return fat + lean + this.getGlycogenH2O(glycogen) + deltaECW;
  };

  getNewWeightFromBodyModel = function (bodyModel) {
      return bodyModel.fat + bodyModel.lean + this.getGlycogenH2O(bodyModel.glycogen) + bodyModel.decw;
  };

  glycogenEquation = function (caloricIntake) {
      return this.glycogen * Math.sqrt(this.carbIntakePct / 100.0 * caloricIntake / this.getCarbsIn());
  };

  deltaECWEquation = function (caloricIntake) {
      return ((this.sodium / this.getMaintCals() + 4000.0 * this.carbIntakePct / (100.0 * this.getCarbsIn())) * caloricIntake - (this.sodium + 4000.0)) / 3000.0;
  };

  getStableWeight = function (fat, lean, caloricIntake) {
      var newGlycogen = this.glycogenEquation(caloricIntake),
          glycogenH2O = this.getGlycogenH2O(newGlycogen),
        deltaECW = this.deltaECWEquation(caloricIntake);

      return fat + lean + glycogenH2O + deltaECW;
  };

  getBodyState = function () {
      return new BodyModel(this);
  };

  getNewTEE = function (bodyModel, dailyParams) {
      return bodyModel.getTEE(this, dailyParams);
  };
}

module.exports = Baseline;
