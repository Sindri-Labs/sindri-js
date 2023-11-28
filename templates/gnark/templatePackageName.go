package templatePackageName

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/witness"
	"github.com/consensys/gnark/frontend"
)

type Circuit struct {
	// Your circuit inputs go here.
	X frontend.Variable
	Y frontend.Variable `gnark:",public"`
}

func (circuit *Circuit) Define(api frontend.API) error {
	// Your circuit logic goes here.
	api.AssertIsEqual(circuit.X, circuit.Y)
	return nil
}

// Common utility for reading JSON in from a file.
func ReadFromInputPath(pathInput string) (map[string]interface{}, error) {

	absPath, err := filepath.Abs(pathInput)
	if err != nil {
		fmt.Println("Error constructing absolute path:", err)
		return nil, err
	}

	file, err := os.Open(absPath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	var data map[string]interface{}
	err = json.NewDecoder(file).Decode(&data)
	if err != nil {
		panic(err)
	}

	return data, nil
}

// Construct a witness from input data in a JSON file.
func FromJson(pathInput string) witness.Witness {

	data, err := ReadFromInputPath(pathInput)
	if err != nil {
		panic(err)
	}

	// Your witness construction logic goes here.
	X := frontend.Variable(data["X"])
	Y := frontend.Variable(data["Y"])
	assignment := Circuit{
		X: X,
		Y: Y,
	}
	w, err := frontend.NewWitness(&assignment, ecc.templateGnarkCurveName.ScalarField())
	if err != nil {
		panic(err)
	}
	return w
}
