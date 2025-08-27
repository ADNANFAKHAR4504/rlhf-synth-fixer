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

	t.Run("creates stack with correct environment suffix", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})

	t.Run("creates Lambda functions with correct properties", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		// Create TapStack which will create resources in the app
		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created (it will be named "TapStackTest")
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that two Lambda functions are created
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(2))

		// Check properties of the "hello" Lambda function
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Handler":    "index.lambda_handler",
			"Runtime":    "python3.9",
			"MemorySize": 256,
			"Environment": map[string]interface{}{
				"Variables": map[string]interface{}{
					"ENVIRONMENT": "testenv",
					"SERVICE":     "hello-service",
				},
			},
		})

		// Check properties of the "users" Lambda function
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Handler":    "index.lambda_handler",
			"Runtime":    "python3.9",
			"MemorySize": 256,
			"Environment": map[string]interface{}{
				"Variables": map[string]interface{}{
					"ENVIRONMENT": "testenv",
					"SERVICE":     "users-service",
				},
			},
		})
	})

	t.Run("creates an API Gateway with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that an API Gateway is created
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))

		// Check properties of the API Gateway
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
			"Name": "tap-api-testenv",
		})

		// Check that the API Gateway has a stage with logging enabled
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Stage"), map[string]interface{}{
			"StageName": "testenv",
		})

		// Check that API Gateway resources are created (health, hello, users)
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Resource"), jsii.Number(4))

		// Check that API Gateway methods are created
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Method"), jsii.Number(9))
	})

	t.Run("creates CloudWatch log groups for Lambda functions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that log groups are created (2 for Lambda functions + 1 for API Gateway)
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(3))

		// Check properties of the "hello" Lambda log group
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName":    "/aws/lambda/hello-handler-testenv",
			"RetentionInDays": 30,
		})

		// Check properties of the "users" Lambda log group
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName":    "/aws/lambda/users-handler-testenv",
			"RetentionInDays": 30,
		})

		// Check properties of the API Gateway log group
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName":    "/aws/apigateway/tap-api-testenv",
			"RetentionInDays": 30,
		})
	})

	t.Run("creates IAM roles for Lambda functions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that IAM roles are created for Lambda functions
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(3))

		// Check that roles have correct trust policy for Lambda
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": []interface{}{
					map[string]interface{}{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "lambda.amazonaws.com",
						},
						"Action": "sts:AssumeRole",
					},
				},
			},
		})
	})

	t.Run("creates outputs for API Gateway and Lambda functions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that outputs are created for API Gateway and Lambda functions
		template.HasOutput(jsii.String("ApiGatewayUrl"), map[string]interface{}{
			"Description": "API Gateway endpoint URL",
		})

		template.HasOutput(jsii.String("ApiGatewayId"), map[string]interface{}{
			"Description": "API Gateway ID",
		})

		template.HasOutput(jsii.String("HelloLambdaArn"), map[string]interface{}{
			"Description": "ARN of the hello Lambda function",
		})

		template.HasOutput(jsii.String("UsersLambdaArn"), map[string]interface{}{
			"Description": "ARN of the users Lambda function",
		})

		template.HasOutput(jsii.String("HelloLambdaName"), map[string]interface{}{
			"Description": "Name of the hello Lambda function",
		})

		template.HasOutput(jsii.String("UsersLambdaName"), map[string]interface{}{
			"Description": "Name of the users Lambda function",
		})
	})

	t.Run("validates Lambda function inline code is present", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that Lambda functions have inline code (ZipFile property)
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Code": map[string]interface{}{
				"ZipFile": assertions.Match_StringLikeRegexp(jsii.String(".*lambda_handler.*")),
			},
		})
	})

	t.Run("validates API Gateway CORS configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"

		lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		// Get the actual stack that was created
		stacks := app.Node().Children()
		var actualStack awscdk.Stack
		for _, child := range *stacks {
			if stackChild, ok := child.(awscdk.Stack); ok {
				if *stackChild.StackName() == "TapStackTest" {
					actualStack = stackChild
					break
				}
			}
		}

		template := assertions.Template_FromStack(actualStack, nil)

		// ASSERT
		// Check that OPTIONS methods are created for CORS
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Method"), map[string]interface{}{
			"HttpMethod": "OPTIONS",
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

func BenchmarkTemplateGeneration(b *testing.B) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
		StackProps:        &awscdk.StackProps{},
		EnvironmentSuffix: jsii.String("bench"),
	})

	// Get the actual stack that was created
	stacks := app.Node().Children()
	var actualStack awscdk.Stack
	for _, child := range *stacks {
		if stackChild, ok := child.(awscdk.Stack); ok {
			if *stackChild.StackName() == "BenchStack" {
				actualStack = stackChild
				break
			}
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		assertions.Template_FromStack(actualStack, nil)
	}
}
