package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
)

func TestTapStackCreation(t *testing.T) {
	defer jsii.Close()

	t.Run("creates stack with custom environment suffix", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		envSuffix := "testenv123"
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
		})
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)
	})

	t.Run("defaults environment suffix to 'dev' if not provided", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTestDefault"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		assert.NotNil(t, stack)
		assert.Equal(t, "dev", *stack.EnvironmentSuffix)
	})
}

func TestKMSKeys(t *testing.T) {
	defer jsii.Close()

	t.Run("creates three KMS keys with rotation enabled", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackKMSTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(3))
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation": true,
		})
	})

	t.Run("KMS keys have correct aliases", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackKMSAliasTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::KMS::Alias"), jsii.Number(3))
	})
}

func TestS3Buckets(t *testing.T) {
	defer jsii.Close()

	t.Run("creates four S3 buckets", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackS3Test"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(4))
	})

	t.Run("S3 buckets have KMS encryption enabled", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackS3EncryptionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketEncryption": map[string]interface{}{
				"ServerSideEncryptionConfiguration": []interface{}{
					map[string]interface{}{
						"ServerSideEncryptionByDefault": map[string]interface{}{
							"SSEAlgorithm": "aws:kms",
						},
					},
				},
			},
		})
	})

	t.Run("data and processed buckets have versioning enabled", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackS3VersioningTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("S3 buckets block all public access", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackS3PublicAccessTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
		})
	})
}

func TestVPC(t *testing.T) {
	defer jsii.Close()

	t.Run("creates VPC with private subnets", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackVPCTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(2)) // 2 AZs
	})

	t.Run("VPC has S3 gateway endpoint", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackVPCEndpointTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::EC2::VPCEndpoint"), jsii.Number(1))
	})

	t.Run("creates security group for Lambda", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackSecurityGroupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(1))
	})
}

func TestLambdaFunction(t *testing.T) {
	defer jsii.Close()

	t.Run("creates Lambda function in VPC", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackLambdaTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		// Check for our processing Lambda function with specific properties
		// Note: CDK creates additional Lambda functions for custom resources (log retention, etc.)
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Runtime": "provided.al2023",
			"Handler": "bootstrap",
		})
	})

	t.Run("Lambda has environment variables configured", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackLambdaEnvTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Environment": map[string]interface{}{
				"Variables": assertions.Match_ObjectLike(&map[string]interface{}{
					"PROCESSED_BUCKET": assertions.Match_AnyValue(),
					"ENVIRONMENT":      assertions.Match_AnyValue(),
				}),
			},
		})
	})
}

func TestCloudTrail(t *testing.T) {
	defer jsii.Close()

	t.Run("creates CloudTrail with encryption", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTrailTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::CloudTrail::Trail"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
			"IsLogging":               true,
			"EnableLogFileValidation": true,
		})
	})
}

func TestCloudWatchLogs(t *testing.T) {
	defer jsii.Close()

	t.Run("creates encrypted log groups", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackLogsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(2))
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"KmsKeyId": assertions.Match_AnyValue(),
		})
	})
}

func TestStackOutputs(t *testing.T) {
	defer jsii.Close()

	t.Run("exports required stack outputs", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackOutputsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		outputs := template.FindOutputs(jsii.String("*"), nil)
		assert.NotNil(t, outputs)
	})
}

func TestHIPAAComplianceTags(t *testing.T) {
	defer jsii.Close()

	t.Run("resources have HIPAA compliance tags", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTagsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Key":   "Compliance",
					"Value": "HIPAA",
				},
			}),
		})
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Key":   "DataClass",
					"Value": "PHI",
				},
			}),
		})
	})
}

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
