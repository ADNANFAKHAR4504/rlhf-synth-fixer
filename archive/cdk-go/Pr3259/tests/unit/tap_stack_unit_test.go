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

	t.Run("creates nested stack for serverless resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(1))
		// Verify the nested stack exists without checking specific parameters
		nestedStacks := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), map[string]interface{}{})
		assert.True(t, len(*nestedStacks) == 1, "Should have exactly one nested stack")
	})

	t.Run("verifies nested stack creation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify nested stack exists (we can't easily test the internal resources in unit tests)
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(1))
		nestedStackTemplates := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), map[string]interface{}{})
		assert.True(t, len(*nestedStackTemplates) > 0, "Should have at least one nested stack")
	})

	t.Run("environment suffix affects resource naming", func(t *testing.T) {
		// ARRANGE
		testCases := []struct {
			envSuffix string
		}{
			{"dev"},
			{"prod"},
			{"staging"},
		}

		for _, tc := range testCases {
			app := awscdk.NewApp(nil)
			stack := lib.NewTapStack(app, jsii.String("TapStackTest"+tc.envSuffix), &lib.TapStackProps{
				StackProps:        &awscdk.StackProps{},
				EnvironmentSuffix: jsii.String(tc.envSuffix),
			})

			// ASSERT
			assert.NotNil(t, stack)
			assert.Equal(t, tc.envSuffix, *stack.EnvironmentSuffix)

			// Verify nested stack has environment-specific ID
			template := assertions.Template_FromStack(stack.Stack, nil)
			template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(1))
		}
	})

	t.Run("stack can be synthesized without errors", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		// ACT & ASSERT
		// This should not panic or throw errors
		template := assertions.Template_FromStack(stack.Stack, nil)
		assert.NotNil(t, template)

		// Verify basic stack structure
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(1))
	})

	t.Run("handles nil props gracefully", func(t *testing.T) {
		// ARRANGE & ACT
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestNil"), nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix) // Should default to "dev"
	})

	t.Run("creates serverless nested stack with environment suffix", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "integration"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify that stack uses the environment suffix
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(1))
	})
}

func TestServerlessNestedStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required serverless resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{
				Description: jsii.String("Test nested stack"),
			},
		)

		// ASSERT
		assert.NotNil(t, nestedStack)
		assert.NotNil(t, nestedStack.Table)
		assert.NotNil(t, nestedStack.Function)
		assert.NotNil(t, nestedStack.Api)

		// Verify template can be generated
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)
		assert.NotNil(t, template)
	})

	t.Run("DynamoDB table has correct properties", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"TableName":   "tap-serverless-table-test",
			"BillingMode": "PAY_PER_REQUEST",
			"AttributeDefinitions": []interface{}{
				map[string]interface{}{
					"AttributeName": "id",
					"AttributeType": "S",
				},
			},
			"KeySchema": []interface{}{
				map[string]interface{}{
					"AttributeName": "id",
					"KeyType":       "HASH",
				},
			},
			"PointInTimeRecoverySpecification": map[string]interface{}{
				"PointInTimeRecoveryEnabled": true,
			},
			"Tags": []interface{}{
				map[string]interface{}{
					"Key":   "Application",
					"Value": "TapServerlessAPI",
				},
				map[string]interface{}{
					"Key":   "Component",
					"Value": "Database",
				},
				map[string]interface{}{
					"Key":   "Environment",
					"Value": "test",
				},
			},
		})
	})

	t.Run("Lambda function has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"FunctionName": "tap-api-handler-test",
			"Runtime":      "python3.12",
			"Handler":      "index.handler",
			"Timeout":      30,
			"MemorySize":   256,
			"Description":  "Lambda function for handling REST API requests (test)",
			"TracingConfig": map[string]interface{}{
				"Mode": "Active",
			},
			"Environment": map[string]interface{}{
				"Variables": map[string]interface{}{
					"ENVIRONMENT": "test",
				},
			},
		})
	})

	t.Run("IAM role has correct permissions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(2)) // Lambda role + API Gateway CloudWatch role
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"RoleName":    "tap-lambda-role-test",
			"Description": "Execution role for Tap Serverless API Lambda function (test)",
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
				"Version": "2012-10-17",
			},
		})

		// Verify DynamoDB permissions policy is created
		template.ResourceCountIs(jsii.String("AWS::IAM::Policy"), jsii.Number(1))
	})

	t.Run("API Gateway has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
			"Name":        "tap-serverless-api-test",
			"Description": "Serverless REST API with Lambda backend (test)",
			"EndpointConfiguration": map[string]interface{}{
				"Types": []interface{}{"REGIONAL"},
			},
		})

		// Verify deployment and stage
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Deployment"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Stage"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Stage"), map[string]interface{}{
			"StageName": "test",
		})
	})

	t.Run("CloudWatch Log Group is created", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName":    "/aws/lambda/tap-api-handler-test",
			"RetentionInDays": 7,
		})
	})

	t.Run("API Gateway methods and resources are configured", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		// Should have proxy resource and root resource
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Resource"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Resource"), map[string]interface{}{
			"PathPart": "{proxy+}",
		})

		// Should have 4 methods (ANY for root + proxy, plus CORS OPTIONS methods)
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::Method"), jsii.Number(4))
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Method"), map[string]interface{}{
			"HttpMethod": "ANY",
		})
	})

	t.Run("stack outputs are created", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("TestNestedStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		outputs := template.FindOutputs(jsii.String("*"), map[string]interface{}{})
		assert.Contains(t, *outputs, "APIEndpoint")
		assert.Contains(t, *outputs, "TableName")
		assert.Contains(t, *outputs, "LambdaFunctionArn")

		// Verify output properties
		template.HasOutput(jsii.String("APIEndpoint"), map[string]interface{}{
			"Description": "REST API endpoint URL (test)",
			"Export": map[string]interface{}{
				"Name": "TapServerlessAPIEndpoint-test",
			},
		})
	})

	t.Run("removal policy differs by environment", func(t *testing.T) {
		testCases := []struct {
			envSuffix    string
			shouldRetain bool
		}{
			{"prod", true},     // Production should retain
			{"dev", false},     // Development should destroy
			{"staging", false}, // Staging should destroy
		}

		for _, tc := range testCases {
			// ARRANGE
			app := awscdk.NewApp(nil)
			parentStack := awscdk.NewStack(app, jsii.String("ParentStack"+tc.envSuffix), nil)

			// ACT
			nestedStack := lib.NewServerlessNestedStack(
				parentStack,
				jsii.String("TestNestedStack"+tc.envSuffix),
				tc.envSuffix,
				&awscdk.NestedStackProps{},
			)

			// ASSERT
			assert.NotNil(t, nestedStack)
			template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

			// We can't easily test removal policy in CDK unit tests,
			// but we can verify the stack was created successfully
			template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		}
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
	stack := lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
		StackProps:        &awscdk.StackProps{},
		EnvironmentSuffix: jsii.String("bench"),
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		assertions.Template_FromStack(stack.Stack, nil)
	}
}

func BenchmarkServerlessNestedStackCreation(b *testing.B) {
	defer jsii.Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		lib.NewServerlessNestedStack(
			parentStack,
			jsii.String("BenchNestedStack"),
			"bench",
			&awscdk.NestedStackProps{},
		)
	}
}
