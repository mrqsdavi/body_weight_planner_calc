class BodyChange {
  constructor (df, dl, dg, dDecw, dtherm) {
      this.df = df || 0;
      this.dl = dl || 0;
      this.dg = dg || 0;
      this.dDecw = dDecw || 0;
      this.dtherm = dtherm || 0;
  };
}

module.exports = BodyChange;
