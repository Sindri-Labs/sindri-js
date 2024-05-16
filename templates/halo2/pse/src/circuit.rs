use std::fs::File;

use halo2_proofs::{
    arithmetic::Field,
    circuit::{Layouter, SimpleFloorPlanner, Value},
    halo2curves::bn256::Fr,
    plonk::{Circuit, ConstraintSystem, Error},
};

use super::chip::{EqualChip, EqualConfig};


#[derive(Default)]
pub struct EqualCircuit<F> {
    pub x: Value<F>,
    pub y: Value<F>,
}

impl<F: Field> Circuit<F> for EqualCircuit<F> {
    type Config = EqualConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self::default()
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        let col_0 = meta.advice_column();
        let col_1 = meta.advice_column();
        let instance = meta.instance_column();

        EqualChip::configure(meta, [col_0, col_1], instance)
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        let chip = EqualChip::construct(config);
        let (x_cell, y_cell) = chip.assign_operands(layouter.namespace(|| "load operands"), self.x, self.y)?;
        let equal_cell = chip.diff(layouter.namespace(|| "load diff row"), x_cell, y_cell.clone())?;

        chip.expose_public(layouter.namespace(|| "expose public"), &y_cell, &equal_cell)?;

        Ok(())
    }
}


impl EqualCircuit<Fr> {

    pub fn from_json(
        json_loc: &str,
    ) -> (Self, Vec<Vec<Fr>>) {

        let witness: serde_json::Value = serde_json::from_reader(File::open(json_loc).unwrap()).unwrap();
        let xin: u64 = serde_json::from_value(witness["X"].clone()).unwrap();
        let yin: u64 = serde_json::from_value(witness["Y"].clone()).unwrap();
        let equality: u64 = if xin == yin { 0 } else { 1 };

        (Self {         
            x: Value::known(Fr::from(xin)),
            y: Value::known(Fr::from(yin)),
        },
        vec![vec![Fr::from(yin), Fr::from(equality)]])
    }

    pub fn keygen_circuit() -> Self {
        Self::default()
    }
}
