package main

import (
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		env := os.Getenv("ENVIRONMENT_SUFFIX")
		if env == "" {
			env = "dev"
		}

		repo := os.Getenv("REPOSITORY")
		if repo == "" {
			repo = "unknown"
		}

		author := os.Getenv("COMMIT_AUTHOR")
		if author == "" {
			author = "unknown"
		}

		tags := map[string]string{
			"Environment": env,
			"Repository":  repo,
			"Author":      author,
		}

		config := InfrastructureConfig{
			Environment:        env,
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:       "t3.medium",
			DBInstanceClass:    "db.t3.micro",
			DBAllocatedStorage: 20,
			BackupRetention:    7,
			MultiAZ:            true,
			EnableInsights:     true,
			Tags:               tags,
		}

		infrastructure := NewMultiRegionInfrastructure(ctx, config)
		return infrastructure.Deploy()
	})
}
