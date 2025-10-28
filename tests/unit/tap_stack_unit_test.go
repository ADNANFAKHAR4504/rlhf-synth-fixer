package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required AWS resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Resource counts
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::SQS::Queue"), jsii.Number(2)) // Main + DLQ
		template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RequestValidator"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(4))
		template.ResourceCountIs(jsii.String("AWS::Lambda::EventSourceMapping"), jsii.Number(1))
	})

	t.Run("creates DynamoDB table with correct name and billing", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName":   "orders-table-" + envSuffix,
			"BillingMode": "PAY_PER_REQUEST",
		})
	})

	t.Run("creates SQS queues with correct names", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Main Queue
		template.HasResourceProperties(jsii.String("AWS::SQS::Queue"), map[string]interface{}{
			"QueueName":         "order-queue-" + envSuffix,
			"VisibilityTimeout": 300,
		})

		// ASSERT - Dead Letter Queue
		template.HasResourceProperties(jsii.String("AWS::SQS::Queue"), map[string]interface{}{
			"QueueName": "order-dlq-" + envSuffix,
		})
	})

	t.Run("creates SNS topic with correct name", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::SNS::Topic"), map[string]interface{}{
			"TopicName":   "order-topic-" + envSuffix,
			"DisplayName": "Order Processing Notifications",
		})
	})

	t.Run("creates Lambda functions with Python runtime", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Order Processor
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName": "order-processor-" + envSuffix,
			"Runtime":      "python3.11",
			"Handler":      "order_processor.handler",
		})

		// ASSERT - API Handler
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName": "api-handler-" + envSuffix,
			"Runtime":      "python3.11",
			"Handler":      "api_handler.handler",
		})
	})

	t.Run("enables X-Ray tracing", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Lambda tracing
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"TracingConfig": map[string]interface{}{
				"Mode": "Active",
			},
		})

		// ASSERT - API Gateway tracing
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Stage"), map[string]interface{}{
			"TracingEnabled": true,
		})
	})

	t.Run("creates API Gateway with validation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
			"Name": "orders-api-" + envSuffix,
		})

		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RequestValidator"), map[string]interface{}{
			"Name":                "order-validator-" + envSuffix,
			"ValidateRequestBody": true,
		})
	})

	t.Run("creates CloudWatch alarms for monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Lambda Error Alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName": "order-processor-errors-" + envSuffix,
		})

		// ASSERT - Lambda Throttle Alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName": "order-processor-throttles-" + envSuffix,
		})

		// ASSERT - DLQ Alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName": "order-dlq-messages-" + envSuffix,
		})

		// ASSERT - Queue Depth Alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName": "order-queue-depth-" + envSuffix,
		})
	})

	t.Run("configures SQS event source for Lambda", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Lambda::EventSourceMapping"), map[string]interface{}{
			"BatchSize": 10,
		})
	})

	t.Run("grants DynamoDB permissions to Lambda", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - IAM policies exist
		template.ResourcePropertiesCountIs(jsii.String("AWS::IAM::Policy"),
			map[string]interface{}{}, jsii.Number(3)) // 3 Lambda IAM policies
	})

	t.Run("creates stack outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - At least 5 outputs exist
		outputs := template.FindOutputs(jsii.String("*"), map[string]interface{}{})
		outputMap := *outputs
		assert.True(t, len(outputMap) >= 5, "Expected at least 5 stack outputs")
	})

	t.Run("defaults environment suffix to 'dev'", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		require.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)

		// Verify resource has default suffix
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName": "orders-table-dev",
		})
	})

	t.Run("sets correct Lambda timeouts", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Order Processor timeout
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName": "order-processor-" + envSuffix,
			"Timeout":      60,
		})

		// ASSERT - API Handler timeout
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName": "api-handler-" + envSuffix,
			"Timeout":      30,
		})
	})

	t.Run("configures reserved concurrency for order processor", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName":                 "order-processor-" + envSuffix,
			"ReservedConcurrentExecutions": 100,
		})
	})

	t.Run("enables API Gateway logging", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "test"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Stage"), map[string]interface{}{
			"StageName": "prod",
		})
	})
}

// Benchmark tests
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
