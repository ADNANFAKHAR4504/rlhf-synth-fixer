package main

import (
	"fmt"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"os"
)

func main() {
	app := cdktf.NewApp(nil)

	// Get environment variables from the environment or use defaults
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}

	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		awsRegion = "us-east-1"
	}

	repositoryName := os.Getenv("REPOSITORY")
	if repositoryName == "" {
		repositoryName = "unknown"
	}

	commitAuthor := os.Getenv("COMMIT_AUTHOR")
	if commitAuthor == "" {
		commitAuthor = "unknown"
	}

	// Calculate the stack name
	stackName := fmt.Sprintf("TapStack%s", environmentSuffix)

	// Create the TapStack with the calculated properties
	NewTapStack(app, stackName, &TapStackProps{
		EnvironmentSuffix: environmentSuffix,
		StateBucket:       stateBucket,
		StateBucketRegion: stateBucketRegion,
		AwsRegion:         awsRegion,
		RepositoryName:    repositoryName,
		CommitAuthor:      commitAuthor,
	})

	// Synthesize the app to generate the Terraform configuration
	app.Synth()
}
