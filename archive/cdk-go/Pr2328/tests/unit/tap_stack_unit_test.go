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

	t.Run("creates stack with correct environment and region", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		environment := "test"
		region := "us-east-1"

		// ACT
		stack := lib.NewTapStack(app, "TapStackTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: environment,
			Region:      region,
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.ApiEndpoint)
		assert.NotNil(t, stack.LambdaArn)
		assert.NotNil(t, stack.LogGroups)
		assert.NotNil(t, stack.ApiKeyOutput)
		assert.NotNil(t, stack.CrossRegionTopicArn)
		assert.NotNil(t, stack.VpcId)

		// Verify VPC is created
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))

		// Verify Lambda function exists
		template.ResourceCountIs(jsii.String("AWS::Lambda::Function"), jsii.Number(1)) // Main function

		// Verify API Gateway exists
		template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))

		// Verify CloudWatch Log Group exists
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(1))

		// Verify SQS Dead Letter Queue exists
		template.ResourceCountIs(jsii.String("AWS::SQS::Queue"), jsii.Number(1))

		// Verify SNS Cross-Region Topic exists
		template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))

		// Verify WAF Web ACL exists
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACL"), jsii.Number(1))
	})

	t.Run("creates lambda function with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackLambdaTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "test",
			Region:      "us-west-2",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Runtime":      "python3.9",
			"Handler":      "handler.lambda_handler",
			"MemorySize":   256,
			"Timeout":      30,
			"FunctionName": assertions.Match_StringLikeRegexp(jsii.String("tap-handler-test-us-west-2")),
			"Environment": map[string]interface{}{
				"Variables": map[string]interface{}{
					"LOG_LEVEL":   "INFO",
					"ENVIRONMENT": "test",
					"REGION":      "us-west-2",
				},
			},
			"TracingConfig": map[string]interface{}{
				"Mode": "Active",
			},
			"ReservedConcurrentExecutions": 100,
		})
	})

	t.Run("creates API Gateway with correct security configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackApiTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "prod",
			Region:      "eu-west-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
			"Name":        assertions.Match_StringLikeRegexp(jsii.String("tap-api-prod-eu-west-1")),
			"Description": "TAP API Gateway with enhanced security",
			"Policy": map[string]interface{}{
				"Statement": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Effect":    "Allow",
						"Principal": map[string]interface{}{"AWS": "*"},
						"Action":    "execute-api:Invoke",
						"Resource":  "*",
						"Condition": map[string]interface{}{
							"IpAddress": map[string]interface{}{
								"aws:SourceIp": []interface{}{"0.0.0.0/0"},
							},
						},
					},
				}),
			},
		})

		// Verify API Key is created
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::ApiKey"), map[string]interface{}{
			"Name":        assertions.Match_StringLikeRegexp(jsii.String("tap-api-key-prod-eu-west-1")),
			"Description": "API Key for TAP services",
			"Enabled":     true,
		})

		// Verify Usage Plan is created
		template.HasResourceProperties(jsii.String("AWS::ApiGateway::UsagePlan"), map[string]interface{}{
			"UsagePlanName": assertions.Match_StringLikeRegexp(jsii.String("tap-usage-plan-prod-eu-west-1")),
			"Description":   "Usage plan for TAP API",
			"Throttle": map[string]interface{}{
				"RateLimit":  1000,
				"BurstLimit": 2000,
			},
			"Quota": map[string]interface{}{
				"Limit":  10000,
				"Period": "DAY",
			},
		})
	})

	t.Run("creates CloudWatch alarms with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackAlarmsTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "staging",
			Region:      "ap-southeast-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify error alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName":          assertions.Match_StringLikeRegexp(jsii.String("tap-lambda-errors-staging-ap-southeast-1")),
			"AlarmDescription":   "Lambda function error rate exceeds threshold",
			"Threshold":          5,
			"ComparisonOperator": "GreaterThanThreshold",
			"EvaluationPeriods":  2,
			"DatapointsToAlarm":  2,
		})

		// Verify duration alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName":          assertions.Match_StringLikeRegexp(jsii.String("tap-lambda-duration-staging-ap-southeast-1")),
			"AlarmDescription":   "Lambda function duration exceeds threshold",
			"Threshold":          25000,
			"ComparisonOperator": "GreaterThanThreshold",
			"EvaluationPeriods":  2,
		})

		// Verify throttle alarm
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), map[string]interface{}{
			"AlarmName":          assertions.Match_StringLikeRegexp(jsii.String("tap-lambda-throttles-staging-ap-southeast-1")),
			"AlarmDescription":   "Lambda function throttles detected",
			"Threshold":          1,
			"ComparisonOperator": "GreaterThanOrEqualToThreshold",
			"EvaluationPeriods":  2,
		})
	})

	t.Run("creates WAF WebACL with rate limiting", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackWafTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "dev",
			Region:      "ca-central-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"Name":        assertions.Match_StringLikeRegexp(jsii.String("tap-api-waf-dev-ca-central-1")),
			"Description": "WAF for TAP API Gateway",
			"Scope":       "REGIONAL",
			"DefaultAction": map[string]interface{}{
				"Allow": map[string]interface{}{},
			},
			"Rules": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Name":     "RateLimitRule",
					"Priority": 1,
					"Statement": map[string]interface{}{
						"RateBasedStatement": map[string]interface{}{
							"Limit":            2000,
							"AggregateKeyType": "IP",
						},
					},
					"Action": map[string]interface{}{
						"Block": map[string]interface{}{},
					},
					"VisibilityConfig": map[string]interface{}{
						"SampledRequestsEnabled":   true,
						"CloudWatchMetricsEnabled": true,
						"MetricName":               assertions.Match_StringLikeRegexp(jsii.String("TapApiRateLimit-dev-ca-central-1")),
					},
				},
			}),
		})

		// Verify WAF association
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACLAssociation"), jsii.Number(1))
	})

	t.Run("creates VPC with correct subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackVpcTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "test",
			Region:      "us-east-2",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify VPC exists
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))

		// Verify subnets exist (public and private subnets across AZs)
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))

		// Verify security groups exist (Lambda SG + default VPC SG + others)
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(3))

		// Note: Using PRIVATE_ISOLATED subnets which don't need NAT gateways
		// If using PRIVATE_WITH_EGRESS, would have NAT gateways
	})

	t.Run("creates storage components correctly", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackStorageTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "prod",
			Region:      "us-west-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify Dead Letter Queue
		template.HasResourceProperties(jsii.String("AWS::SQS::Queue"), map[string]interface{}{
			"QueueName":              assertions.Match_StringLikeRegexp(jsii.String("tap-dlq-prod-us-west-1")),
			"MessageRetentionPeriod": 1209600, // 14 days
			"VisibilityTimeout":      300,     // 5 minutes
			"KmsMasterKeyId":         "alias/aws/sqs",
		})

		// Verify Cross-Region SNS Topic
		template.HasResourceProperties(jsii.String("AWS::SNS::Topic"), map[string]interface{}{
			"TopicName":   assertions.Match_StringLikeRegexp(jsii.String("tap-cross-region-prod-us-west-1")),
			"DisplayName": assertions.Match_StringLikeRegexp(jsii.String("TAP Cross-Region Communication -prod-us-west-1")),
		})
	})

	t.Run("applies correct tags to all resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackTagsTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "test",
			Region:      "eu-central-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify tags are applied to Lambda function
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Key":   "Environment",
					"Value": "test",
				},
				map[string]interface{}{
					"Key":   "Region",
					"Value": "eu-central-1",
				},
			}),
		})

		// Verify tags are applied to VPC
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Key":   "Environment",
					"Value": "test",
				},
			}),
		})
	})

	t.Run("creates outputs with correct export names", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)

		// ACT
		stack := lib.NewTapStack(app, "TapStackOutputsTest", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "dev",
			Region:      "ap-northeast-1",
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		outputs := template.FindOutputs(jsii.String("*"), map[string]interface{}{})
		require.NotNil(t, outputs)

		// Check that we have all expected outputs
		expectedOutputs := []string{
			"ApiEndpoint",
			"LambdaArn",
			"LogGroups",
			"ApiKeyId",
			"CrossRegionTopicArn",
			"VpcId",
		}

		outputsMap := *outputs
		for _, expectedOutput := range expectedOutputs {
			_, exists := outputsMap[expectedOutput]
			assert.True(t, exists, "Expected output %s not found", expectedOutput)
		}
	})

	t.Run("handles different environments correctly", func(t *testing.T) {
		environments := []struct {
			env    string
			region string
		}{
			{"dev", "us-east-1"},
			{"staging", "us-west-2"},
			{"prod", "eu-west-1"},
			{"test", "ap-southeast-2"},
		}

		for _, env := range environments {
			t.Run("environment_"+env.env+"_region_"+env.region, func(t *testing.T) {
				// ARRANGE
				app := awscdk.NewApp(nil)

				// ACT
				stack := lib.NewTapStack(app, "TapStack"+env.env, &lib.TapStackProps{
					StackProps:  awscdk.StackProps{},
					Environment: env.env,
					Region:      env.region,
				})
				template := assertions.Template_FromStack(stack.Stack, nil)

				// ASSERT
				assert.NotNil(t, stack)

				// Verify naming includes environment and region
				expectedSuffix := "-" + env.env + "-" + env.region

				template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
					"FunctionName": assertions.Match_StringLikeRegexp(jsii.String("tap-handler" + expectedSuffix)),
				})

				template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
					"Name": assertions.Match_StringLikeRegexp(jsii.String("tap-api" + expectedSuffix)),
				})
			})
		}
	})
}

// Benchmark tests
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, "BenchStack", &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "bench",
			Region:      "us-east-1",
		})
	}
}

func BenchmarkTemplateGeneration(b *testing.B) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "BenchTemplate", &lib.TapStackProps{
		StackProps:  awscdk.StackProps{},
		Environment: "bench",
		Region:      "us-east-1",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		assertions.Template_FromStack(stack.Stack, nil)
	}
}
