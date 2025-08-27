package main

import (
	"fmt"
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment from env var or default to dev
		environment := os.Getenv("ENVIRONMENT")
		if environment == "" {
			environment = "dev"
		}

		// Get configuration for the environment
		cfg, err := lib.GetConfig(environment)
		if err != nil {
			return fmt.Errorf("error getting config: %v", err)
		}

		// Build infrastructure
		_, err = lib.BuildInfrastructureStack(ctx, cfg)
		if err != nil {
			return fmt.Errorf("error building infrastructure: %v", err)
		}

		return nil
	})
}
