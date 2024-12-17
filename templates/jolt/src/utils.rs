use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Input {
    pub x: i64,
    pub y: i64,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Output {
    pub equal: bool,
}
