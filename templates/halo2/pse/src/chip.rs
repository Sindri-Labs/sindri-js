use std::marker::PhantomData;

use halo2_proofs::{
    arithmetic::Field, 
    circuit::{AssignedCell, Layouter, Region, Value}, 
    plonk::{Advice, Column, ConstraintSystem, Error, Instance, Selector}, 
    poly::Rotation
};

#[derive(Debug, Clone)]
pub struct EqualConfig {
    pub advice: [Column<Advice>; 2],
    pub instance: Column<Instance>,
    pub selector: Selector,
}

#[derive(Debug, Clone)]
pub struct EqualChip<F: Field> {
    config: EqualConfig,
    _marker: PhantomData<F>,
}

impl<F: Field> EqualChip<F> {
    pub fn construct(config: EqualConfig) -> Self {
        Self {
            config,
            _marker: PhantomData,
        }
    }

    pub fn configure(
        meta: &mut ConstraintSystem<F>,
        advice: [Column<Advice>; 2],
        instance: Column<Instance>,
    ) -> EqualConfig {
        let col_0 = advice[0];
        let col_1 = advice[1];

        let s_eq = meta.selector();
        meta.enable_equality(instance);
        meta.enable_equality(col_0);
        meta.enable_equality(col_1);

        meta.create_gate("diff", |meta| {
            let lhs = meta.query_advice(col_0, Rotation::cur());
            let rhs = meta.query_advice(col_1, Rotation::cur());
            let diff = meta.query_advice(col_0, Rotation::next());
            let s_eq = meta.query_selector(s_eq);

            vec![s_eq * ((lhs - rhs) - diff)]
        });

        EqualConfig {
            advice: [col_0, col_1],
            instance,
            selector: s_eq,
        }

    }

    pub fn assign_operands(
        &self,
        mut layouter: impl Layouter<F>,
        x: Value<F>,
        y: Value<F>,
    ) -> Result<(AssignedCell<F, F>, AssignedCell<F, F>), Error> {
        layouter.assign_region(
            || "operand row",
            |mut region| {
                let x_cell = region.assign_advice(|| "x", self.config.advice[0],0,|| x)?;
                let y_cell = region.assign_advice(|| "y", self.config.advice[1], 0,|| y)?;
                Ok((x_cell, y_cell))
            },
        )
    }

    pub fn diff(
        &self,
        mut layouter: impl Layouter<F>,
        x: AssignedCell<F, F>,
        y: AssignedCell<F, F>,
    ) -> Result<AssignedCell<F, F>, Error> {

        layouter.assign_region(
            || "diff",
            |mut region: Region<'_, F>| {
                self.config.selector.enable(&mut region, 0)?;
                x.copy_advice(|| "lhs", &mut region, self.config.advice[0], 0)?;
                y.copy_advice(|| "rhs", &mut region, self.config.advice[1], 0)?;
                let value = x.value().map(|i| i.to_owned()) - y.value().map(|i| i.to_owned());
                region.assign_advice(|| "lhs - rhs", self.config.advice[0], 1, || value)
            },
        )
    }

    pub fn expose_public(
        &self,
        mut layouter: impl Layouter<F>,
        y_input_cell: &AssignedCell<F, F>,
        equal_bool_cell: &AssignedCell<F, F>,
    ) -> Result<(), Error> {

        layouter.constrain_instance(y_input_cell.cell(), self.config.instance, 0)?;
        layouter.constrain_instance(equal_bool_cell.cell(), self.config.instance, 1)?;
        Ok(())
    }

}
