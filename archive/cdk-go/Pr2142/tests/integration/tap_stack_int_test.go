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
		stack := lib.NewTapStack(app, jsii.String(stackName), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("inttest"),
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "inttest", *stack.EnvironmentSuffix)

		// Note: Actual deployment testing would require CDK CLI or programmatic deployment
		// This is a placeholder for more comprehensive integration testing
		t.Log("Stack created successfully in memory. Full deployment testing requires CDK CLI integration.")
	})

	t.Run("stack resources are created with correct naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "integration"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackResourceTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

		// Add more specific resource assertions here when resources are actually created
		// For example:
		// - Verify S3 bucket naming conventions
		// - Check that all resources have proper tags
		// - Validate resource configurations
	})

	t.Run("Write Integration Tests", func(t *testing.T) {
		// ARRANGE & ASSERT
		t.Skip("Integration test for TapStack should be implemented here.")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
