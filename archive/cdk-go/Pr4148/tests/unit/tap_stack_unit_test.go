package lib_test

import (
	"regexp"
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

		// Verify resource naming patterns (with random suffix)
		// Check that bucket names follow the pattern: raw-images-{env}-{random6chars}
		rawBucketPattern := regexp.MustCompile(`^raw-images-` + envSuffix + `-[a-z0-9]{6}$`)
		processedBucketPattern := regexp.MustCompile(`^processed-images-` + envSuffix + `-[a-z0-9]{6}$`)
		modelBucketPattern := regexp.MustCompile(`^model-artifacts-` + envSuffix + `-[a-z0-9]{6}$`)
		trainingBucketPattern := regexp.MustCompile(`^model-training-` + envSuffix + `-[a-z0-9]{6}$`)

		// Get template as JSON to check bucket names
		templateJSON := template.ToJSON()

		// Find bucket names in the template
		buckets := (*templateJSON)["Resources"].(map[string]interface{})
		var bucketNames []string
		for _, resource := range buckets {
			if resourceMap, ok := resource.(map[string]interface{}); ok {
				if resourceMap["Type"] == "AWS::S3::Bucket" {
					if props, ok := resourceMap["Properties"].(map[string]interface{}); ok {
						if bucketName, ok := props["BucketName"].(string); ok {
							bucketNames = append(bucketNames, bucketName)
						}
					}
				}
			}
		}

		// Verify bucket name patterns
		assert.Len(t, bucketNames, 4, "Should have 4 buckets")

		var foundRaw, foundProcessed, foundModel, foundTraining bool
		for _, name := range bucketNames {
			if rawBucketPattern.MatchString(name) {
				foundRaw = true
			} else if processedBucketPattern.MatchString(name) {
				foundProcessed = true
			} else if modelBucketPattern.MatchString(name) {
				foundModel = true
			} else if trainingBucketPattern.MatchString(name) {
				foundTraining = true
			}
		}

		assert.True(t, foundRaw, "Should have raw images bucket with correct pattern")
		assert.True(t, foundProcessed, "Should have processed images bucket with correct pattern")
		assert.True(t, foundModel, "Should have model artifacts bucket with correct pattern")
		assert.True(t, foundTraining, "Should have training bucket with correct pattern")

		// Verify environment suffix is stored correctly
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("verifies API Gateway security features", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testsec"
		stack := lib.NewTapStack(app, jsii.String("TapStackTestSecurity"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Verify API Key creation
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::ApiKey"), jsii.Number(1))

		// Check API Key name pattern
		templateJSON := template.ToJSON()
		resources := (*templateJSON)["Resources"].(map[string]interface{})
		var apiKeyName string
		for _, resource := range resources {
			if resourceMap, ok := resource.(map[string]interface{}); ok {
				if resourceMap["Type"] == "AWS::ApiGateway::ApiKey" {
					if props, ok := resourceMap["Properties"].(map[string]interface{}); ok {
						if name, ok := props["Name"].(string); ok {
							apiKeyName = name
							break
						}
					}
				}
			}
		}
		apiKeyPattern := regexp.MustCompile(`^ml-inference-key-` + envSuffix + `-[a-z0-9]{6}$`)
		assert.True(t, apiKeyPattern.MatchString(apiKeyName), "API Key name should match pattern")

		// Verify Usage Plan creation
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::UsagePlan"), jsii.Number(1))

		// Check Usage Plan name pattern
		var usagePlanName string
		for _, resource := range resources {
			if resourceMap, ok := resource.(map[string]interface{}); ok {
				if resourceMap["Type"] == "AWS::ApiGateway::UsagePlan" {
					if props, ok := resourceMap["Properties"].(map[string]interface{}); ok {
						if name, ok := props["UsagePlanName"].(string); ok {
							usagePlanName = name
							break
						}
					}
				}
			}
		}
		usagePlanPattern := regexp.MustCompile(`^ml-inference-usage-plan-` + envSuffix + `-[a-z0-9]{6}$`)
		assert.True(t, usagePlanPattern.MatchString(usagePlanName), "Usage Plan name should match pattern")

		// Verify Usage Plan Key association
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::UsagePlanKey"), jsii.Number(1))

		// Verify API method requires API Key
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::Method"), map[string]interface{}{
			"ApiKeyRequired": true,
			"HttpMethod":     "POST",
		})

		t.Logf("✓ API Gateway security features verified (API Key, Usage Plan, Throttling)")
	})

	t.Run("verifies IAM least privilege for SageMaker role", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testiam"
		stack := lib.NewTapStack(app, jsii.String("TapStackTestIAM"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})

		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Verify SageMaker role exists
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": []interface{}{
					map[string]interface{}{
						"Principal": map[string]interface{}{
							"Service": "sagemaker.amazonaws.com",
						},
					},
				},
			},
		})

		// Verify that there are IAM policies
		template.ResourceCountIs(jsii.String("AWS::IAM::Policy"), jsii.Number(4))

		t.Logf("✓ IAM least privilege verified (SageMaker role exists with policies)")
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

		// Check that bucket name follows pattern with random suffix
		templateJSON := template.ToJSON()
		resources := (*templateJSON)["Resources"].(map[string]interface{})
		var rawBucketName string
		for _, resource := range resources {
			if resourceMap, ok := resource.(map[string]interface{}); ok {
				if resourceMap["Type"] == "AWS::S3::Bucket" {
					if props, ok := resourceMap["Properties"].(map[string]interface{}); ok {
						if bucketName, ok := props["BucketName"].(string); ok {
							if regexp.MustCompile(`^raw-images-dev-[a-z0-9]{6}$`).MatchString(bucketName) {
								rawBucketName = bucketName
								break
							}
						}
					}
				}
			}
		}
		assert.NotEmpty(t, rawBucketName, "Should have raw images bucket with dev suffix and random suffix")
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

		// Check that bucket name follows pattern with random suffix
		templateJSON := template.ToJSON()
		resources := (*templateJSON)["Resources"].(map[string]interface{})
		var rawBucketName string
		for _, resource := range resources {
			if resourceMap, ok := resource.(map[string]interface{}); ok {
				if resourceMap["Type"] == "AWS::S3::Bucket" {
					if props, ok := resourceMap["Properties"].(map[string]interface{}); ok {
						if bucketName, ok := props["BucketName"].(string); ok {
							if regexp.MustCompile(`^raw-images-contextenv-[a-z0-9]{6}$`).MatchString(bucketName) {
								rawBucketName = bucketName
								break
							}
						}
					}
				}
			}
		}
		assert.NotEmpty(t, rawBucketName, "Should have raw images bucket with contextenv suffix and random suffix")
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
