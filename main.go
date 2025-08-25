// In main.go
package main

import (
	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/hashicorp/terraform-cdktf-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)
	lib.NewTapStack(app, "tap-iac-stack")
	app.Synth()
}
