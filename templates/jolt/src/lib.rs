{% if not stdEnabled %}
#![cfg_attr(feature = "guest", no_std)]
{% endif %}
#![no_main]
pub mod utils;
pub use utils::{Input, Output};

#[jolt::provable]
fn compare_x_y(input: Input) -> Output {
    {% if not stdEnabled %}
    Output { equal: input.x == input.y }
    {% else %}
    // Use string operations to make use of the standard library
    let x_str = input.x.to_string();
    let y_str = input.y.to_string();
    Output { equal: x_str == y_str }
    {% endif %}
}
