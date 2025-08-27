//go:build integration

package lib_test

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

// Test configuration
var (
	testEnvironment = getEnvOrDefault("TEST_ENVIRONMENT", "inttest")
	testRegion      = getEnvOrDefault("TEST_REGION", "us-east-1")
	stackName       = fmt.Sprintf("TapStackIntegrationTest-%s", testEnvironment)
)

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials or in short mode
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("stack_synthesis_and_validation", func(t *testing.T) {
		// ARRANGE & ACT
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, stackName, &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: testEnvironment,
			Region:      testRegion,
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.ApiEndpoint)
		assert.NotNil(t, stack.LambdaArn)
		assert.NotNil(t, stack.LogGroups)
		assert.NotNil(t, stack.ApiKeyOutput)
		assert.NotNil(t, stack.CrossRegionTopicArn)
		assert.NotNil(t, stack.VpcId)

		t.Log("Stack created successfully in memory with all required components")
	})

	t.Run("cloudformation_template_generation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		_ = lib.NewTapStack(app, stackName+"Template", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: testEnvironment,
			Region:      testRegion,
		})

		// ACT - Synthesize the template
		template := app.Synth(nil)
		assert.NotNil(t, template)

		// ASSERT
		stackArtifact := template.GetStackByName(jsii.String(stackName + "Template"))
		assert.NotNil(t, stackArtifact)

		templateBody := stackArtifact.Template()
		assert.NotNil(t, templateBody)

		templateStr, err := templateToString(templateBody)
		assert.NoError(t, err, "Failed to convert template to string")

		// Verify CloudFormation template structure
		assert.Contains(t, templateStr, `"Resources"`, "Template should have Resources section")
		assert.Contains(t, templateStr, `"Outputs"`, "Template should have Outputs section")

		// Verify essential resources are present
		assert.Contains(t, templateStr, `"AWS::Lambda::Function"`, "Template should contain Lambda function")
		assert.Contains(t, templateStr, `"AWS::ApiGateway::RestApi"`, "Template should contain API Gateway")
		assert.Contains(t, templateStr, `"AWS::EC2::VPC"`, "Template should contain VPC")
		assert.Contains(t, templateStr, `"AWS::WAFv2::WebACL"`, "Template should contain WAF")
		assert.Contains(t, templateStr, `"AWS::SQS::Queue"`, "Template should contain SQS Queue")
		assert.Contains(t, templateStr, `"AWS::SNS::Topic"`, "Template should contain SNS Topic")

		// Verify template size is reasonable (not too large)
		templateSize := len(templateStr)
		assert.Less(t, templateSize, 2000000, "Template should be less than 2MB")
		assert.Greater(t, templateSize, 1000, "Template should be substantial (>1KB)")

		t.Logf("Template generation successful. Size: %d bytes", templateSize)
	})

	t.Run("resource_naming_conventions", func(t *testing.T) {
		// ARRANGE
		environments := []struct {
			env    string
			region string
		}{
			{"dev", "us-east-1"},
			{"staging", "us-west-2"},
			{"prod", "eu-west-1"},
		}

		for _, testCase := range environments {
			t.Run(fmt.Sprintf("%s-%s", testCase.env, testCase.region), func(t *testing.T) {
				// ACT
				app := awscdk.NewApp(nil)
				_ = lib.NewTapStack(app, fmt.Sprintf("TapStackNaming%s", testCase.env), &lib.TapStackProps{
					StackProps:  awscdk.StackProps{},
					Environment: testCase.env,
					Region:      testCase.region,
				})

				// ASSERT
				template := app.Synth(nil)
				stackArtifact := template.GetStackByName(jsii.String(fmt.Sprintf("TapStackNaming%s", testCase.env)))
				templateBody, err := templateToString(stackArtifact.Template())
				assert.NoError(t, err)

				expectedSuffix := fmt.Sprintf("-%s-%s", testCase.env, testCase.region)

				// Check resource naming patterns
				assert.Contains(t, templateBody, fmt.Sprintf("tap-handler%s", expectedSuffix),
					"Lambda function should follow naming convention")
				assert.Contains(t, templateBody, fmt.Sprintf("tap-api%s", expectedSuffix),
					"API Gateway should follow naming convention")
				assert.Contains(t, templateBody, fmt.Sprintf("tap-dlq%s", expectedSuffix),
					"Dead Letter Queue should follow naming convention")
				assert.Contains(t, templateBody, fmt.Sprintf("tap-cross-region%s", expectedSuffix),
					"SNS Topic should follow naming convention")

				t.Logf("Naming conventions validated for %s environment in %s region",
					testCase.env, testCase.region)
			})
		}
	})

	t.Run("stack_security_configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		_ = lib.NewTapStack(app, "TapStackSecurity", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "security-test",
			Region:      testRegion,
		})

		// ACT
		template := app.Synth(nil)
		stackArtifact := template.GetStackByName(jsii.String("TapStackSecurity"))
		templateBody, err := templateToString(stackArtifact.Template())
		assert.NoError(t, err)

		// ASSERT
		// Verify VPC configuration
		assert.Contains(t, templateBody, "AWS::EC2::VPC", "Stack should include VPC")
		assert.Contains(t, templateBody, "AWS::EC2::SecurityGroup", "Stack should include Security Groups")

		// Verify encryption
		assert.Contains(t, templateBody, "alias/aws/sqs", "SQS should use KMS encryption")

		// Verify WAF
		assert.Contains(t, templateBody, "AWS::WAFv2::WebACL", "Stack should include WAF")
		assert.Contains(t, templateBody, "RateLimitRule", "WAF should include rate limiting")

		// Verify IAM roles have proper permissions
		assert.Contains(t, templateBody, "lambda:InvokeFunction", "IAM should allow Lambda invocation")
		assert.Contains(t, templateBody, "xray:PutTelemetryRecords", "IAM should allow X-Ray tracing")

		// Verify HTTPS enforcement
		assert.Contains(t, templateBody, "execute-api:Invoke", "API Gateway should have proper execution permissions")

		// Verify proper CORS configuration
		assert.Contains(t, templateBody, "Access-Control-Allow", "API Gateway should have CORS configured")

		t.Log("Security configuration validated successfully")
	})

	t.Run("performance_and_scaling_configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		_ = lib.NewTapStack(app, "TapStackPerformance", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "perf-test",
			Region:      testRegion,
		})

		// ACT
		template := app.Synth(nil)
		stackArtifact := template.GetStackByName(jsii.String("TapStackPerformance"))
		templateBody, err := templateToString(stackArtifact.Template())
		assert.NoError(t, err)

		// ASSERT
		// Verify Lambda configuration
		assert.Contains(t, templateBody, `"MemorySize":256`, "Lambda should have correct memory size")
		assert.Contains(t, templateBody, `"Timeout":30`, "Lambda should have correct timeout")
		assert.Contains(t, templateBody, `"ReservedConcurrentExecutions":100`,
			"Lambda should have reserved concurrency")

		// Verify API Gateway throttling
		assert.Contains(t, templateBody, `"RateLimit":1000`, "API Gateway should have rate limiting")
		assert.Contains(t, templateBody, `"BurstLimit":2000`, "API Gateway should have burst limiting")

		// Verify CloudWatch monitoring
		assert.Contains(t, templateBody, "AWS::CloudWatch::Alarm", "Stack should include CloudWatch alarms")
		assert.Contains(t, templateBody, "MetricsEnabled", "API Gateway should have metrics enabled")

		// Verify X-Ray tracing
		assert.Contains(t, templateBody, `"TracingEnabled":true`, "API Gateway should have tracing enabled")
		assert.Contains(t, templateBody, `"TracingConfig"`, "Lambda should have X-Ray tracing configuration")
		assert.Contains(t, templateBody, `"Mode":"Active"`, "Lambda should have X-Ray tracing active")

		t.Log("Performance and scaling configuration validated successfully")
	})

	t.Run("multi_region_capabilities", func(t *testing.T) {
		// ARRANGE
		regions := []string{"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"}

		for _, region := range regions {
			t.Run("region_"+region, func(t *testing.T) {
				// ACT
				app := awscdk.NewApp(nil)
				_ = lib.NewTapStack(app, fmt.Sprintf("TapStackRegion%s", strings.ReplaceAll(region, "-", "")), &lib.TapStackProps{
					StackProps:  awscdk.StackProps{},
					Environment: "multiregion",
					Region:      region,
				})

				// ASSERT
				template := app.Synth(nil)
				stackArtifact := template.GetStackByName(jsii.String(fmt.Sprintf("TapStackRegion%s", strings.ReplaceAll(region, "-", ""))))
				templateBody, err := templateToString(stackArtifact.Template())
				assert.NoError(t, err)

				// Verify region-specific naming
				expectedSuffix := fmt.Sprintf("-multiregion-%s", region)
				assert.Contains(t, templateBody, expectedSuffix, "Resources should include region in naming")

				// Verify cross-region SNS topic
				assert.Contains(t, templateBody, fmt.Sprintf("tap-cross-region%s", expectedSuffix),
					"Should have cross-region SNS topic")

				t.Logf("Multi-region capabilities validated for %s", region)
			})
		}
	})

	t.Run("template_parameter_validation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		_ = lib.NewTapStack(app, "TapStackParams", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "param-test",
			Region:      testRegion,
		})

		// ACT
		template := app.Synth(nil)
		stackArtifact := template.GetStackByName(jsii.String("TapStackParams"))
		templateBody, err := templateToString(stackArtifact.Template())
		assert.NoError(t, err)

		// ASSERT
		// Verify template has required sections
		assert.Contains(t, templateBody, `"Parameters"`, "Template should have Parameters section")
		assert.Contains(t, templateBody, `"Resources"`, "Template should have Resources section")
		assert.Contains(t, templateBody, `"Outputs"`, "Template should have Outputs section")

		// Verify CDK bootstrap parameter
		assert.Contains(t, templateBody, "BootstrapVersion", "Template should include CDK bootstrap version parameter")

		// Verify outputs are properly exported
		assert.Contains(t, templateBody, `"Export"`, "Template should have exported outputs")
		assert.Contains(t, templateBody, "TapApiEndpoint", "Should export API endpoint")
		assert.Contains(t, templateBody, "TapLambdaArn", "Should export Lambda ARN")

		t.Log("Template parameter validation successful")
	})

	t.Run("error_handling_and_resilience", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		_ = lib.NewTapStack(app, "TapStackResilience", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "resilience-test",
			Region:      testRegion,
		})

		// ACT
		template := app.Synth(nil)
		stackArtifact := template.GetStackByName(jsii.String("TapStackResilience"))
		templateBody, err := templateToString(stackArtifact.Template())
		assert.NoError(t, err)

		// ASSERT
		// Verify Dead Letter Queue configuration
		assert.Contains(t, templateBody, "DeadLetterConfig", "Lambda should have DLQ configured")
		assert.Contains(t, templateBody, "AWS::SQS::Queue", "Should have SQS DLQ")

		// Verify retry configuration
		assert.Contains(t, templateBody, "MaximumRetryAttempts", "Lambda should have retry configuration")
		assert.Contains(t, templateBody, `"MaximumRetryAttempts":2`, "Lambda should have 2 retry attempts")

		// Verify CloudWatch alarms for monitoring
		assert.Contains(t, templateBody, "AWS::CloudWatch::Alarm", "Should have CloudWatch alarms")
		assert.Contains(t, templateBody, "tap-lambda-errors", "Should have error alarm")
		assert.Contains(t, templateBody, "tap-lambda-duration", "Should have duration alarm")
		assert.Contains(t, templateBody, "tap-lambda-throttles", "Should have throttle alarm")

		// Verify VPC configuration for network isolation
		assert.Contains(t, templateBody, "VpcConfig", "Lambda should have VPC configuration")
		assert.Contains(t, templateBody, "SecurityGroupIds", "Lambda should have security group configuration")

		t.Log("Error handling and resilience configuration validated successfully")
	})
}

// Helper functions
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func templateToString(template interface{}) (string, error) {
	switch v := template.(type) {
	case string:
		return v, nil
	case map[string]interface{}:
		bytes, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(bytes), nil
	default:
		bytes, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(bytes), nil
	}
}

// Benchmark tests for integration scenarios
func BenchmarkStackSynthesis(b *testing.B) {
	defer jsii.Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, fmt.Sprintf("BenchStack%d", i), &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "bench",
			Region:      "us-east-1",
		})
		app.Synth(nil)
	}
}

func BenchmarkTemplateGeneration(b *testing.B) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	_ = lib.NewTapStack(app, "BenchTemplate", &lib.TapStackProps{
		StackProps:  awscdk.StackProps{},
		Environment: "bench",
		Region:      "us-east-1",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		template := app.Synth(nil)
		stackArtifact := template.GetStackByName(jsii.String("BenchTemplate"))
		_ = stackArtifact.Template()
	}
}

func BenchmarkStackCreationPerformance(b *testing.B) {
	defer jsii.Close()

	environments := []struct {
		env    string
		region string
	}{
		{"dev", "us-east-1"},
		{"staging", "us-west-2"},
		{"prod", "eu-west-1"},
	}

	for _, env := range environments {
		b.Run(fmt.Sprintf("%s-%s", env.env, env.region), func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				app := awscdk.NewApp(nil)
				lib.NewTapStack(app, fmt.Sprintf("BenchStack%s%d", env.env, i), &lib.TapStackProps{
					StackProps:  awscdk.StackProps{},
					Environment: env.env,
					Region:      env.region,
				})
			}
		})
	}
}
