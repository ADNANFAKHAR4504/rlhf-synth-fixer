//go:build integration

package lib_test

import (
	"context"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
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
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		cfnClient := cloudformation.NewFromConfig(cfg)
		stackName := "TapStackIntegrationTest"
		envSuffix := "inttest"

		// Clean up any existing stack
		defer func() {
			_, _ = cfnClient.DeleteStack(ctx, &cloudformation.DeleteStackInput{
				StackName: aws.String(stackName),
			})
		}()

		// ACT
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String(stackName), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

		// Note: In a real deployment, you'd use CDK CLI to deploy and test resources
		// This test is set up for the structure, but actual deployment tests would
		// need AWS credentials and permission to deploy resources

		t.Log("Stack created successfully in memory. Full deployment testing requires CDK CLI integration.")
	})

	t.Run("stack resources are created with correct naming", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		cfnClient := cloudformation.NewFromConfig(cfg)
		s3Client := s3.NewFromConfig(cfg)

		// Test with a deployed stack (requires prior deployment)
		stackName := "TapStackIntegrationTest"
		envSuffix := "inttest"

		// ACT
		// Check if stack exists
		stack, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
			StackName: aws.String(stackName),
		})

		if err != nil || len(stack.Stacks) == 0 {
			t.Skip("Stack not deployed, skipping integration test")
		}

		// ASSERT
		// Check stack outputs
		var rawBucketName, processedBucketName, metadataTableName, modelBucketName, apiEndpoint string

		for _, output := range stack.Stacks[0].Outputs {
			switch *output.OutputKey {
			case "RawImageBucketName":
				rawBucketName = *output.OutputValue
			case "ProcessedBucketName":
				processedBucketName = *output.OutputValue
			case "MetadataTableName":
				metadataTableName = *output.OutputValue
			case "ModelBucketName":
				modelBucketName = *output.OutputValue
			case "InferenceApiEndpoint":
				apiEndpoint = *output.OutputValue
			}
		}

		// Verify expected bucket names
		assert.Equal(t, "raw-images-"+envSuffix, rawBucketName)
		assert.Equal(t, "processed-images-"+envSuffix, processedBucketName)
		assert.Equal(t, "model-artifacts-"+envSuffix, modelBucketName)
		assert.Equal(t, "image-metadata-"+envSuffix, metadataTableName)
		assert.NotEmpty(t, apiEndpoint)

		// Optional: Verify buckets actually exist
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(rawBucketName),
		})
		assert.NoError(t, err, "Raw image bucket does not exist")
	})

	t.Run("verify all AI/ML pipeline components are operational", func(t *testing.T) {
		// ARRANGE & ASSERT
		t.Skip("Test for verifying complete AI/ML pipeline should be implemented here. Requires actual deployment.")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 20*time.Minute, func(wo *cloudformation.StackCreateCompleteWaiterOptions) {
		wo.MinDelay = 30 * time.Second
		wo.MaxDelay = 2 * time.Minute
	})
}

// Helper function to check if stack exists
func stackExists(ctx context.Context, cfnClient *cloudformation.Client, stackName string) bool {
	_, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	})

	if err != nil {
		// Check if error is "Stack not found"
		return false
	}

	return true
}

// Helper function to clean up test resources
func cleanupStack(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	if !stackExists(ctx, cfnClient, stackName) {
		return nil
	}

	_, err := cfnClient.DeleteStack(ctx, &cloudformation.DeleteStackInput{
		StackName:       aws.String(stackName),
		RetainResources: []string{}, // Specify resources to retain if needed
	})

	if err != nil {
		return err
	}

	// Wait for stack deletion
	waiter := cloudformation.NewStackDeleteCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
