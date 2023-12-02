pragma circom 2.0.8;

include "node_modules/circomlib/circuits/comparators.circom";

template templateTemplateName() {
    // Put your inputs here.
    signal input X;
    signal input Y;
    signal output isEqual;

    // Use the `IsEqual` template from `circomlib`.
    component isEqualValidator = IsEqual();

    // Connect the inputs to the `IsEqual` circuit.
    isEqualValidator.in[0] <== X;
    isEqualValidator.in[1] <== Y;

    // Connect the output.
    isEqual <== isEqualValidator.out;
}

component main {public [Y]} = templateTemplateName();
