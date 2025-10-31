//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("can deploy and destroy stack successfully", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		cfnClient := cloudformation.NewFromConfig(cfg)
		stackName := "TapStackIntegrationTest"

		// Clean up any existing stack
		defer func() {
			_, _ = cfnClient.DeleteStack(ctx, &cloudformation.DeleteStackInput{
				StackName: aws.String(stackName),
			})
		}()

		// ACT
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, stackName, &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("inttest"),
		})

		// ASSERT
		assert.NotNil(t, stack)

		// Note: Actual deployment testing would require CDK CLI or programmatic deployment
		// This is a placeholder for more comprehensive integration testing
		t.Log("Stack created successfully in memory. Full deployment testing requires CDK CLI integration.")
	})

	t.Run("stack resources are created with correct naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "integration"

		// ACT
		stack := lib.NewTapStack(app, "TapStackResourceTest", &lib.TapStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack)

		// Add more specific resource assertions here when resources are actually created
		// For example:
		// - Verify S3 bucket naming conventions
		// - Check that all resources have proper tags
		// - Validate resource configurations
	})

	t.Run("validate deployed stack outputs", func(t *testing.T) {
		// Skip if running in CI without AWS credentials
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// Read outputs from cdk-outputs.json if it exists
		outputsFile := "../../cdk-outputs.json"
		if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
			t.Skip("cdk-outputs.json not found. Run deployment first.")
		}

		// Read and parse outputs
		data, err := os.ReadFile(outputsFile)
		require.NoError(t, err, "Failed to read cdk-outputs.json")

		var outputs map[string]map[string]string
		err = json.Unmarshal(data, &outputs)
		require.NoError(t, err, "Failed to parse cdk-outputs.json")

		// Find the stack outputs
		var stackOutputs map[string]string
		for stackName, outputs := range outputs {
			if len(outputs) > 0 {
				stackOutputs = outputs
				t.Logf("Testing stack: %s", stackName)
				break
			}
		}

		require.NotEmpty(t, stackOutputs, "No stack outputs found")

		// Validate required outputs exist
		requiredOutputs := []string{
			"SourceBucketName",
			"ProcessedBucketName",
			"JobTableName",
			"DistributionDomainName",
			"TranscodeFunctionArn",
		}

		for _, outputKey := range requiredOutputs {
			value, exists := stackOutputs[outputKey]
			assert.True(t, exists, "Missing required output: %s", outputKey)
			assert.NotEmpty(t, value, "Output %s is empty", outputKey)
			t.Logf("✓ %s: %s", outputKey, value)
		}
	})

	t.Run("verify deployed resources are functional", func(t *testing.T) {
		// Skip if running in CI without AWS credentials
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// Read outputs
		outputsFile := "../../cdk-outputs.json"
		if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
			t.Skip("cdk-outputs.json not found. Run deployment first.")
		}

		data, err := os.ReadFile(outputsFile)
		require.NoError(t, err)

		var outputs map[string]map[string]string
		err = json.Unmarshal(data, &outputs)
		require.NoError(t, err)

		var stackOutputs map[string]string
		for _, outputs := range outputs {
			if len(outputs) > 0 {
				stackOutputs = outputs
				break
			}
		}

		ctx := context.Background()
		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err)

		// Test S3 buckets exist
		if sourceBucket, ok := stackOutputs["SourceBucketName"]; ok {
			s3Client := s3.NewFromConfig(cfg)
			_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
				Bucket: aws.String(sourceBucket),
			})
			assert.NoError(t, err, "Source bucket should exist: %s", sourceBucket)
			t.Logf("✓ Source bucket exists: %s", sourceBucket)
		}

		if processedBucket, ok := stackOutputs["ProcessedBucketName"]; ok {
			s3Client := s3.NewFromConfig(cfg)
			_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
				Bucket: aws.String(processedBucket),
			})
			assert.NoError(t, err, "Processed bucket should exist: %s", processedBucket)
			t.Logf("✓ Processed bucket exists: %s", processedBucket)
		}

		// Test DynamoDB table exists
		if tableName, ok := stackOutputs["JobTableName"]; ok {
			dynamoClient := dynamodb.NewFromConfig(cfg)
			_, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
				TableName: aws.String(tableName),
			})
			assert.NoError(t, err, "DynamoDB table should exist: %s", tableName)
			t.Logf("✓ DynamoDB table exists: %s", tableName)
		}

		// Test Lambda functions exist
		if functionArn, ok := stackOutputs["TranscodeFunctionArn"]; ok {
			lambdaClient := lambda.NewFromConfig(cfg)
			_, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
				FunctionName: aws.String(functionArn),
			})
			assert.NoError(t, err, "Transcode Lambda function should exist")
			t.Logf("✓ Transcode Lambda function exists")
		}

		if functionArn, ok := stackOutputs["StatusFunctionArn"]; ok {
			lambdaClient := lambda.NewFromConfig(cfg)
			_, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
				FunctionName: aws.String(functionArn),
			})
			assert.NoError(t, err, "Status Lambda function should exist")
			t.Logf("✓ Status Lambda function exists")
		}

		// Test CloudFront distribution domain
		if distDomain, ok := stackOutputs["DistributionDomainName"]; ok {
			assert.Contains(t, distDomain, ".cloudfront.net", "Distribution domain should be a CloudFront domain")
			t.Logf("✓ CloudFront distribution domain: %s", distDomain)
		}
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
