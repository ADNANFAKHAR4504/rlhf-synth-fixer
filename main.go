package main

import (
	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	})
}
