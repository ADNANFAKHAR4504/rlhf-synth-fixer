package main

import (
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// Minimal CDKTF app entrypoint.
// We avoid committing go.mod; CI initializes it and runs `go mod tidy`.
func main() {
	app := cdktf.NewApp(nil)

	// Create an empty stack to allow synthesis to succeed
	_ = cdktf.NewTerraformStack(app, str("TapStack"))

	app.Synth()
}

func str(v string) *string { return &v }
