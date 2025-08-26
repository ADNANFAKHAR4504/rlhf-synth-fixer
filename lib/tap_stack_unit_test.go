package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

func TestTapStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates infrastructure with the correct environment", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		environment := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: environment,
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Verify S3 buckets are created
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(3)) // CloudTrail + Access Logs + Main buckets
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "proj-cloudtrail-" + environment,
		})

		// Verify DynamoDB table is created
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName": "proj-dynamodb-" + environment,
		})

		// Verify Lambda function is created
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(2)) // Main function + bucket notifications function

		// For now, just verify stack was created successfully
		assert.NotNil(t, stack)
		assert.Equal(t, environment, stack.Environment)
	})

	t.Run("defaults environment to 'prod' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Verify resources are created with default environment
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "proj-cloudtrail-prod",
		})

		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName": "proj-dynamodb-prod",
		})

		// For now, just verify stack was created successfully with default environment
		assert.NotNil(t, stack)
		assert.Equal(t, "prod", stack.Environment)
	})

	t.Run("Write Unit Tests", func(t *testing.T) {
		// ARRANGE & ASSERT
		t.Skip("Unit test for TapStack should be implemented here.")
	})
}

// Benchmark tests can be added here
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "bench",
		})
	}
}
