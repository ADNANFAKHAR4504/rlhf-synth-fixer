package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// This function replicates the logic in main.go
func TestMainEntry_DefaultEnvVars(t *testing.T) {
	// Unset all vars
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	os.Unsetenv("REPOSITORY")
	os.Unsetenv("COMMIT_AUTHOR")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
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
		infra := NewMultiRegionInfrastructure(ctx, config)
		// You can just call Deploy, since it's fully mocked
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestMainEntry_CustomEnvVars(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "qa")
	os.Setenv("REPOSITORY", "iac-repo")
	os.Setenv("COMMIT_AUTHOR", "tester")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
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
		infra := NewMultiRegionInfrastructure(ctx, config)
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestMainEntry_PartialEnvVars(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "stage")
	os.Unsetenv("REPOSITORY")
	os.Setenv("COMMIT_AUTHOR", "stager")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
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
		infra := NewMultiRegionInfrastructure(ctx, config)
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}
