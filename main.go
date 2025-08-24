package main

import (
	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)
	lib.NewTapStack(app, "TapStack")
	app.Synth()
}