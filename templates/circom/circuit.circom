pragma circom 2.0.8;

template templateTemplateName() {
    // Put your inputs here.
    signal input X;
    signal input Y;
    signal output isEqual;
    signal difference;
    signal differenceInverse;

    // Put your circuit logic here.
    difference <-- X - Y;
    differenceInverse <-- difference != 0 ? 1 / difference : 0;
    isEqual <== -difference * differenceInverse + 1;
    isEqual * difference === 0;
}

component main {public [Y]} = templateTemplateName();
