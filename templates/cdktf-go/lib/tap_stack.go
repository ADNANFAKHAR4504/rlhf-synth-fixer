package main

import (
	"os"
	"time"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
	aws "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"

	// Force jsii subpackages into module graph for CI (since .gen is ignored by go mod tidy)
	_ "github.com/aws/constructs-go/constructs/v10/jsii"
	_ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"
)

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	app := cdktf.NewApp(nil)

	// Get environment variables
	environmentSuffix := getEnv("ENVIRONMENT_SUFFIX", "dev")
	stateBucket := getEnv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
	stateBucketRegion := getEnv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
	awsRegion := getEnv("AWS_REGION", "us-east-1")
	repositoryName := getEnv("REPOSITORY", "unknown")
	commitAuthor := getEnv("COMMIT_AUTHOR", "unknown")
	prNumber := getEnv("PR_NUMBER", "unknown")
	team := getEnv("TEAM", "unknown")
	createdAt := time.Now().UTC().Format(time.RFC3339)

	// Calculate the stack name
	stackName := "TapStack" + environmentSuffix

	// Create the Terraform stack
	stack := cdktf.NewTerraformStack(app, jsii.String(stackName))

	// Configure S3 Backend
	cdktf.NewS3Backend(stack, &cdktf.S3BackendProps{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(environmentSuffix + "/" + stackName + ".tfstate"),
		Region: jsii.String(stateBucketRegion),
	})

	// Configure AWS Provider with default tags
	aws.NewAwsProvider(stack, jsii.String("aws"), &aws.AwsProviderConfig{
		Region: jsii.String(awsRegion),
		DefaultTags: &aws.AwsProviderDefaultTags{
			Tags: &map[string]*string{
				"Environment": jsii.String(environmentSuffix),
				"Repository":  jsii.String(repositoryName),
				"Author":      jsii.String(commitAuthor),
				"PRNumber":    jsii.String(prNumber),
				"Team":        jsii.String(team),
				"CreatedAt":   jsii.String(createdAt),
			},
		},
	})

	app.Synth()
}

func str(v string) *string { return &v }
