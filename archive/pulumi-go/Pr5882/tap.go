package main

import (
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment suffix from environment variable or use default
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if environmentSuffix == "" {
			environmentSuffix = ctx.Stack()
		}

		// Create the infrastructure stack
		_, err := lib.NewTapStack(ctx, "TapStack", &lib.TapStackArgs{
			EnvironmentSuffix: environmentSuffix,
		})
		if err != nil {
			return err
		}

		return nil
	})
}
