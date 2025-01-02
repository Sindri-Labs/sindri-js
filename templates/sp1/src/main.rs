#![no_main]
sp1_zkvm::entrypoint!(main);

pub fn main() {
    let x = sp1_zkvm::io::read::<u32>();
    let y = sp1_zkvm::io::read::<u32>();

    let equal: bool = x == y;
    sp1_zkvm::io::commit(&equal);
}
