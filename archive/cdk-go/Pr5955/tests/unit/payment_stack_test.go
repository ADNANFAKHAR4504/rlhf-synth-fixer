package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

// Helper function to synthesize template for testing
func synthPaymentStackTemplate(t *testing.T, environment string) assertions.Template {
	t.Helper()

	app := awscdk.NewApp(nil)
	envSuffix := environment
	if envSuffix == "" {
		envSuffix = "dev"
	}

	stack := lib.NewPaymentStack(app, "PaymentStackTest", &lib.PaymentStackProps{
		StackProps:        awscdk.StackProps{},
		EnvironmentSuffix: envSuffix,
		Environment:       environment,
	})

	return assertions.Template_FromStack(stack, nil)
}

func TestPaymentStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates a VPC with correct configuration", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have exactly 1 VPC
		tpl.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))

		// VPC should have correct CIDR block for dev
		tpl.HasResourceProperties(jsii.String("AWS::EC2::VPC"), &map[string]interface{}{
			"CidrBlock":          "10.0.0.0/16",
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
		})
	})

	t.Run("creates subnets in multiple AZs", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have 4 subnets (2 public + 2 private)
		tpl.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))

		// Should have NAT Gateways for private subnets
		tpl.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(2))
	})

	t.Run("creates RDS instance with correct properties", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have exactly 1 RDS instance
		tpl.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(1))

		// RDS should have correct configuration for dev
		tpl.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{
			"Engine":                "postgres",
			"EngineVersion":         "14",
			"DBInstanceClass":       "db.t3.small",
			"AllocatedStorage":      "20",
			"MultiAZ":               false,
			"PubliclyAccessible":    false,
			"BackupRetentionPeriod": 7.0,
		})
	})

	t.Run("creates RDS subnet group", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have RDS subnet group
		tpl.ResourceCountIs(jsii.String("AWS::RDS::DBSubnetGroup"), jsii.Number(1))
	})

	t.Run("creates S3 bucket with encryption", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have S3 bucket
		tpl.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))

		// Bucket should have encryption enabled
		tpl.HasResourceProperties(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{
			"BucketEncryption": assertions.Match_ObjectLike(&map[string]interface{}{
				"ServerSideEncryptionConfiguration": assertions.Match_AnyValue(),
			}),
			"VersioningConfiguration": assertions.Match_ObjectLike(&map[string]interface{}{
				"Status": "Enabled",
			}),
		})
	})

	t.Run("creates SQS queue with correct configuration", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have SQS queue
		tpl.ResourceCountIs(jsii.String("AWS::SQS::Queue"), jsii.Number(1))

		// Queue should have encryption enabled
		tpl.HasResourceProperties(jsii.String("AWS::SQS::Queue"), &map[string]interface{}{
			"KmsMasterKeyId": "alias/aws/sqs",
		})
	})

	t.Run("creates Lambda function with VPC configuration", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have at least 1 Lambda function (validation function)
		// Note: There may be additional Lambda functions for custom resources
		tpl.HasResourceProperties(jsii.String("AWS::Lambda::Function"), &map[string]interface{}{
			"Runtime":    "provided.al2023",
			"Handler":    "bootstrap",
			"MemorySize": 512.0,
			"Timeout":    30.0,
			"VpcConfig":  assertions.Match_AnyValue(),
		})
	})

	t.Run("creates security groups for Lambda and RDS", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have multiple security groups (Lambda, RDS, VPC default, etc.)
		// At minimum Lambda SG and RDS SG
		tpl.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(2))
	})

	t.Run("creates security group ingress rule for RDS", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have security group ingress rule allowing Lambda to access RDS
		tpl.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), &map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   5432.0,
			"ToPort":     5432.0,
		})
	})

	t.Run("creates IAM role for Lambda", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have Lambda execution role
		tpl.HasResourceProperties(jsii.String("AWS::IAM::Role"), &map[string]interface{}{
			"AssumeRolePolicyDocument": assertions.Match_ObjectLike(&map[string]interface{}{
				"Statement": assertions.Match_ArrayWith(&[]interface{}{
					assertions.Match_ObjectLike(&map[string]interface{}{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": assertions.Match_ObjectLike(&map[string]interface{}{
							"Service": "lambda.amazonaws.com",
						}),
					}),
				}),
			}),
		})
	})

	t.Run("creates CloudWatch alarms", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have 3 CloudWatch alarms (Lambda errors, SQS depth, RDS CPU)
		tpl.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(3))

		// Lambda errors alarm
		tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{
			"MetricName":         "Errors",
			"Namespace":          "AWS/Lambda",
			"Threshold":          10.0,
			"EvaluationPeriods":  2.0,
			"ComparisonOperator": "GreaterThanThreshold",
		})

		// SQS depth alarm
		tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{
			"MetricName":        "ApproximateNumberOfMessagesVisible",
			"Namespace":         "AWS/SQS",
			"Threshold":         100.0,
			"EvaluationPeriods": 2.0,
		})

		// RDS CPU alarm
		tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{
			"MetricName":        "CPUUtilization",
			"Namespace":         "AWS/RDS",
			"Threshold":         70.0,
			"EvaluationPeriods": 3.0,
		})
	})

	t.Run("creates required outputs", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have all required outputs
		tpl.HasOutput(jsii.String("VpcId"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))

		tpl.HasOutput(jsii.String("DatabaseEndpoint"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))

		tpl.HasOutput(jsii.String("QueueUrl"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))

		tpl.HasOutput(jsii.String("DataBucketName"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))

		tpl.HasOutput(jsii.String("ValidationFunctionArn"), assertions.Match_ObjectLike(&map[string]interface{}{
			"Value": assertions.Match_AnyValue(),
		}))
	})

	t.Run("applies correct tags to resources", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// VPC should have environment and cost center tags
		tpl.HasResourceProperties(jsii.String("AWS::EC2::VPC"), &map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				assertions.Match_ObjectLike(&map[string]interface{}{
					"Key":   "Environment",
					"Value": "dev",
				}),
			}),
		})
	})

	t.Run("creates Secrets Manager secret for RDS credentials", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "dev")

		// Should have Secrets Manager secret for DB credentials
		tpl.ResourceCountIs(jsii.String("AWS::SecretsManager::Secret"), jsii.Number(1))

		// Secret should be attached to RDS instance
		tpl.ResourceCountIs(jsii.String("AWS::SecretsManager::SecretTargetAttachment"), jsii.Number(1))
	})

	t.Run("prod environment uses different configuration", func(t *testing.T) {
		tpl := synthPaymentStackTemplate(t, "prod")

		// VPC should have different CIDR for prod
		tpl.HasResourceProperties(jsii.String("AWS::EC2::VPC"), &map[string]interface{}{
			"CidrBlock": "10.1.0.0/16",
		})

		// RDS should use larger instance type for prod
		tpl.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{
			"DBInstanceClass":  "db.r5.large",
			"AllocatedStorage": "100",
		})

		// Lambda should have more memory for prod
		tpl.HasResourceProperties(jsii.String("AWS::Lambda::Function"), &map[string]interface{}{
			"Runtime":    "provided.al2023",
			"Handler":    "bootstrap",
			"MemorySize": 2048.0,
		})

		// RDS CPU alarm should have higher threshold for prod
		tpl.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{
			"MetricName": "CPUUtilization",
			"Namespace":  "AWS/RDS",
			"Threshold":  80.0,
		})
	})

	t.Run("stack is created without errors", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewPaymentStack(app, "TestPaymentStack", &lib.PaymentStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: "test",
			Environment:       "dev",
		})

		assert.NotNil(t, stack)
	})
}

// Benchmark test for stack creation
func BenchmarkPaymentStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewPaymentStack(app, "BenchmarkStack", &lib.PaymentStackProps{
			StackProps:        awscdk.StackProps{},
			EnvironmentSuffix: "bench",
			Environment:       "dev",
		})
	}
}
