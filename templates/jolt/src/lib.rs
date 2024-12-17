#![no_main]
pub mod utils;
pub use utils::{Input, Output};

#[jolt::provable]
fn compare_x_y(input: Input) -> Output {
    let x_str = input.x.to_string();
    let y_str = input.y.to_string();

    Output { equal: x_str == y_str }
}
