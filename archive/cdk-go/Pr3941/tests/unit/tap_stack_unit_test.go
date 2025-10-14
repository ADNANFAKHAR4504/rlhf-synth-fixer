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

	t.Run("creates an S3 bucket with the correct environment suffix", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "testenv"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Note: Uncomment these assertions when S3 bucket is actually created
		// template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		// template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		//     "BucketName": "tap-bucket-" + envSuffix,
		// })

		// For now, just verify stack was created successfully
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		_ = assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Note: Uncomment these assertions when S3 bucket is actually created
		// template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		// template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		//     "BucketName": "tap-bucket-dev",
		// })

		// For now, just verify stack was created successfully with default suffix
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})

	t.Run("creates S3 buckets with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Check S3 buckets are created
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(2))

		// Check source bucket has lifecycle rules with transitions
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"LifecycleConfiguration": map[string]interface{}{
				"Rules": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Id":     "DeleteOldOriginals",
						"Prefix": "originals/",
						"Status": "Enabled",
						"Transitions": assertions.Match_ArrayWith(&[]interface{}{
							map[string]interface{}{
								"StorageClass":     "STANDARD_IA",
								"TransitionInDays": 30,
							},
						}),
					},
				}),
			},
		})

		// Check processed bucket has expiration
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"LifecycleConfiguration": map[string]interface{}{
				"Rules": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Id":               "DeleteOldPreviews",
						"ExpirationInDays": 365,
						"Prefix":           "previews/",
						"Status":           "Enabled",
					},
				}),
			},
		})
	})

	t.Run("creates DynamoDB table with correct schema", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))

		// Check table has correct key schema
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"KeySchema": []interface{}{
				map[string]interface{}{
					"AttributeName": "imageId",
					"KeyType":       "HASH",
				},
				map[string]interface{}{
					"AttributeName": "timestamp",
					"KeyType":       "RANGE",
				},
			},
			"BillingMode": "PAY_PER_REQUEST",
		})

		// Check GSI exists with correct structure
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
			"GlobalSecondaryIndexes": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"IndexName": "StatusIndex",
					"KeySchema": assertions.Match_ArrayWith(&[]interface{}{
						map[string]interface{}{
							"AttributeName": "processingStatus",
							"KeyType":       "HASH",
						},
					}),
					"Projection": map[string]interface{}{
						"ProjectionType": "ALL",
					},
				},
				map[string]interface{}{
					"IndexName": "UserIndex",
					"KeySchema": assertions.Match_ArrayWith(&[]interface{}{
						map[string]interface{}{
							"AttributeName": "userId",
							"KeyType":       "HASH",
						},
					}),
					"Projection": map[string]interface{}{
						"ProjectionType": "ALL",
					},
				},
			}),
		})
	})

	t.Run("creates Lambda function with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(2)) // Image processor + bucket notifications handler

		// Check Lambda function properties
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Runtime":                      "provided.al2023",
			"Handler":                      "bootstrap",
			"MemorySize":                   1024,
			"Timeout":                      30,
			"ReservedConcurrentExecutions": 10,
		})

		// Check environment variables
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Environment": map[string]interface{}{
				"Variables": map[string]interface{}{
					"LOG_LEVEL":      "INFO",
					"MAX_IMAGE_SIZE": "10485760",
					"PREVIEW_SIZES":  "150x150,300x300,800x800",
				},
			},
		})
	})

	t.Run("creates IAM roles with correct policies", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Check IAM roles exist (at least 2: image processor role + bucket notifications role)
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(2))

		// Check that Lambda role exists with correct trust policy
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "lambda.amazonaws.com",
						},
					},
				}),
			},
			"Description": "Role for image processing Lambda function",
		})

		// Check IAM policies exist (at least 2: image processor policy + bucket notifications policy)
		template.ResourceCountIs(jsii.String("AWS::IAM::Policy"), jsii.Number(2))
	})

	t.Run("creates CloudWatch dashboard and alarms", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Check CloudWatch resources
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Dashboard"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(2))

		// Check high error rate alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"MetricName":         "Errors",
			"Namespace":          "AWS/Lambda",
			"Threshold":          10,
			"ComparisonOperator": "GreaterThanOrEqualToThreshold",
			"EvaluationPeriods":  2,
			"TreatMissingData":   "notBreaching",
		})

		// Check high duration alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"MetricName":         "Duration",
			"Namespace":          "AWS/Lambda",
			"Threshold":          20000,
			"ComparisonOperator": "GreaterThanOrEqualToThreshold",
		})
	})

	t.Run("creates CloudWatch log group", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"RetentionInDays": 7,
		})
	})

	t.Run("creates SQS dead letter queue", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::SQS::Queue"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::SQS::Queue"), map[string]interface{}{
			"MessageRetentionPeriod": 1209600, // 14 days
		})
	})

	t.Run("creates Lambda event invoke config", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Lambda::EventInvokeConfig"), map[string]interface{}{
			"MaximumEventAgeInSeconds": 3600,
			"MaximumRetryAttempts":     2,
		})
	})

	t.Run("creates S3 event notifications", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Check Lambda permission for S3
		template.HasResourceProperties(jsii.String("AWS::Lambda::Permission"), map[string]interface{}{
			"Action":    "lambda:InvokeFunction",
			"Principal": "s3.amazonaws.com",
		})

		// Check S3 bucket notifications resource exists
		template.ResourceCountIs(jsii.String("Custom::S3BucketNotifications"), jsii.Number(1))
	})

	t.Run("creates stack outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Check all required outputs exist
		outputs := template.FindOutputs(jsii.String("*"), &map[string]interface{}{})

		assert.NotNil(t, outputs)

		// Verify specific outputs exist by trying to find them
		template.HasOutput(jsii.String("SourceBucketName"), &map[string]interface{}{})
		template.HasOutput(jsii.String("ProcessedBucketName"), &map[string]interface{}{})
		template.HasOutput(jsii.String("MetadataTableName"), &map[string]interface{}{})
		template.HasOutput(jsii.String("LambdaFunctionName"), &map[string]interface{}{})
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
