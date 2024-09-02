use plonky2::field::types::Field;
use plonky2::iop::witness::{PartialWitness, WitnessWrite};
use plonky2::plonk::circuit_builder::CircuitBuilder;
use plonky2::plonk::circuit_data::{CircuitConfig, CommonCircuitData, VerifierOnlyCircuitData};
use plonky2::plonk::proof::ProofWithPublicInputs;
use plonky2::util::serialization::{
    Buffer, DefaultGateSerializer, DefaultGeneratorSerializer, GateSerializer, IoResult, Read,
    WitnessGeneratorSerializer, Write,
};
use plonky2::{
    iop::target::Target,
    plonk::config::{GenericConfig, PoseidonGoldilocksConfig},
};
use serde::{Deserialize, Serialize};
use std::fs;

pub const INITIAL_INPUTS: usize = 2;
pub const PUBLIC_OUTPUTS: usize = 1;
pub const D: usize = 2;

pub type C = PoseidonGoldilocksConfig;
pub type F = <C as GenericConfig<D>>::F;

pub struct TemplateStructName {
    pub proof: ProofWithPublicInputs<F, C, D>,
    pub verifier_only: VerifierOnlyCircuitData<C, D>,
    pub common: CommonCircuitData<F, D>,
}

// User should configure the inputs field to match the type in the from_json function
#[derive(Serialize, Deserialize)]
pub struct InputData {
    pub x: u64,
    pub y: u64,
}

impl TemplateStructName {
    pub fn prove(path: &str) -> Self {
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);

        // The arithmetic circuit.
        let x = builder.add_virtual_target();
        let y = builder.add_virtual_target();

        // Constrains x == y.
        builder.connect(x, y);

        // Public inputs are the two initial values (provided below) and the result (which is generated).
        builder.register_public_input(x);
        builder.register_public_input(y);

        let data = builder.build::<C>();

        // We construct the partial witness using inputs from the JSON file
        let input_data = from_json(path);
        let input_targets = data.prover_only.public_inputs.clone();

        let mut pw = PartialWitness::new();

        pw.set_target(input_targets[0], F::from_canonical_u64(input_data.x));
        pw.set_target(input_targets[1], F::from_canonical_u64(input_data.y));

        let proof_with_pis = data.prove(pw).unwrap();

        Self {
            proof: proof_with_pis,
            verifier_only: data.verifier_only,
            common: data.common,
        }
    }
}

pub fn from_json(path: &str) -> InputData {
    let inputs = fs::read_to_string(path).unwrap();
    let data: InputData = serde_json::from_str(&inputs).unwrap();

    data
}
