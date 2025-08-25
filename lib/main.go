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
		repositoryName = "iac-test-automations"
	}

	commitAuthor := os.Getenv("COMMIT_AUTHOR")
	if commitAuthor == "" {
		commitAuthor = "unknown"
	}

	// Get office IP for SSH access (from environment variable or use a placeholder)
	officeIP := os.Getenv("OFFICE_IP")
	if officeIP == "" {
		officeIP = "203.0.113.0/32" // Placeholder IP - replace with actual office IP
	}

	// Get instance type variable
	instanceType := os.Getenv("INSTANCE_TYPE")
	if instanceType == "" {
		instanceType = "t3.micro"
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
		OfficeIP:          officeIP,
		InstanceType:      instanceType,
	})

	// Synthesize the app to generate the Terraform configuration
	app.Synth()
}
