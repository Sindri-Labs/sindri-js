use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Input {
    pub x: u32,
    pub y: u32,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Output {
    pub equal: bool,
}
