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

	t.Run("creates complete AI/ML pipeline infrastructure", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify the correct number of resources were created
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(4)) // Raw, Processed, Training, Model
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::Kinesis::Stream"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(4)) // Prep, Eval, Inference, + S3AutoDelete
		template.ResourceCountIs(jsii.String("AWS::StepFunctions::StateMachine"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Dashboard"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(2))
		template.ResourceCountIs(jsii.String("AWS::Events::Rule"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(8)) // SageMaker + Lambda roles + StepFunctions + S3AutoDelete

		// Verify resource naming
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "raw-images-" + envSuffix,
		})
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "processed-images-" + envSuffix,
		})
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName": "image-metadata-" + envSuffix,
		})
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
			"Name": "ml-inference-api-" + envSuffix,
		})

		// Verify environment suffix is stored correctly
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)

		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "raw-images-dev",
		})
	})

	t.Run("sets environment suffix from CDK context if available", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(&awscdk.AppProps{
			Context: &map[string]interface{}{
				"environmentSuffix": "contextenv",
			},
		})
		stack := lib.NewTapStack(app, jsii.String("TapStackTestContext"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.Equal(t, "contextenv", *stack.EnvironmentSuffix)

		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": "raw-images-contextenv",
		})
	})
}

// Benchmark tests can be added here
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("bench"),
		})
	}
}
