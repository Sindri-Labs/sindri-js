use std::fs::File;
use halo2_base::{
    gates::{
        builder::{
            GateThreadBuilder, MultiPhaseThreadBreakPoints, RangeCircuitBuilder,
            RangeWithInstanceCircuitBuilder, RangeWithInstanceConfig,
        },
        GateChip, 
        GateInstructions
    },
    halo2_proofs::{
        circuit::{Layouter, SimpleFloorPlanner},
        plonk::{Circuit, ConstraintSystem, Error},
    },
    utils::ScalarField
};

pub struct CircuitInput<F: ScalarField> {
    pub x: F, 
    pub y: F,
}

//return default inputs
impl<F: ScalarField> Default for CircuitInput<F> {
    fn default() -> Self {
        Self {
            x: F::from(1),
            y: F::from(1),
        }        
    }
}

impl<F: ScalarField> CircuitInput<F> {
    //return inputs from json
    pub fn from_json(infile: &str) -> Self {
        let witness: serde_json::Value = serde_json::from_reader(File::open(infile).unwrap()).unwrap();
        let xin: u64 = serde_json::from_value(witness["X"].clone()).unwrap();
        let yin: u64 = serde_json::from_value(witness["Y"].clone()).unwrap();
        Self {
            x: F::from(xin),
            y: F::from(yin),
        }        
    }

    //From the witness input, this will return a circuit constructed from the various
    //modes of GateThreadBuilder - it returns the CircuitBuilder which implements
    //the final requirements of a circuit and has some handy instance methods
    pub fn create_circuit(
        self,
        mut builder: GateThreadBuilder<F>,
        break_points: Option<MultiPhaseThreadBreakPoints>,
    ) -> CircuitBuilder<F> {

        //initialize public vec and circuit context builder
        let mut assigned_instances = vec![];
        let ctx = builder.main(0);
        let gate = GateChip::<F>::default();

        // The main circuit logic via halo2-lib's high level API
        let x = ctx.load_witness(self.x); 
        let y = ctx.load_witness(self.y);
        assigned_instances.push(y);
        let _val_assigned = gate.is_equal(ctx, x, y);
        assigned_instances.push(_val_assigned);

        let k: usize = {{ degree }};
        builder.config(k, None);
        let circuit = match builder.witness_gen_only() {
            true => RangeCircuitBuilder::prover(builder, break_points.unwrap()),
            false => RangeCircuitBuilder::keygen(builder),
        };
        
        CircuitBuilder(RangeWithInstanceCircuitBuilder::new(circuit, assigned_instances))
    }
}


// BOILERPLATE METHOD INHERITANCE 
// MINIMAL CHANGES REQUIRED BELOW THIS POINT
pub struct CircuitBuilder<F: ScalarField>(pub RangeWithInstanceCircuitBuilder<F>);

impl<F: ScalarField> Circuit<F> for CircuitBuilder<F> {
    type Config = RangeWithInstanceConfig<F>;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        unimplemented!()
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        RangeWithInstanceCircuitBuilder::configure(meta)
    }

    fn synthesize(&self, config: Self::Config, layouter: impl Layouter<F>) -> Result<(), Error> {
        self.0.synthesize(config, layouter)
    }
}

impl<F: ScalarField> CircuitBuilder<F> {

    pub fn instance(&self) -> Vec<F> {
        self.0.instance()
    }

    pub fn break_points(&self) -> MultiPhaseThreadBreakPoints {
        self.0.circuit.0.break_points.borrow().clone()
    }
}
