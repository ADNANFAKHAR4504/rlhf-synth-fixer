package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// Test stack creation with environment suffix
func TestTapStackCreation(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	if template == nil {
		t.Fatal("Template should not be nil")
	}
	// Verify basic resources exist
	template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::CloudFront::Distribution"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::Events::Rule"), jsii.Number(1))
}

// Test stack creation with default suffix
func TestTapStackDefaultSuffix(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
	})
	template := assertions.Template_FromStack(stack, nil)
	if template == nil {
		t.Fatal("Template should not be nil")
	}
}

// Test S3 buckets configuration
func TestS3BucketsConfiguration(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		"BucketEncryption": map[string]interface{}{
			"ServerSideEncryptionConfiguration": []interface{}{
				map[string]interface{}{"ServerSideEncryptionByDefault": map[string]interface{}{"SSEAlgorithm": "AES256"}},
			},
		},
		"PublicAccessBlockConfiguration": map[string]interface{}{
			"BlockPublicAcls":       true,
			"BlockPublicPolicy":     true,
			"IgnorePublicAcls":      true,
			"RestrictPublicBuckets": true,
		},
	})
}

// Test DynamoDB table configuration
func TestDynamoDBTableConfiguration(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
		"BillingMode": "PAY_PER_REQUEST",
		"KeySchema": []interface{}{
			map[string]interface{}{"AttributeName": "jobId", "KeyType": "HASH"},
		},
	})
}

// Test Lambda functions
func TestLambdaFunctions(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
		"Runtime": "nodejs18.x",
		"Handler": "index.handler",
	})
}

// Test IAM roles
func TestIAMRoles(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
		"AssumeRolePolicyDocument": map[string]interface{}{
			"Statement": []interface{}{
				map[string]interface{}{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
				},
			},
		},
	})
}

// Test SNS topic
func TestSNSTopic(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::SNS::Topic"), map[string]interface{}{
		"DisplayName": "Media Pipeline Notifications",
	})
}

// Test CloudFront distribution
func TestCloudFrontDistribution(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	template.HasResourceProperties(jsii.String("AWS::CloudFront::Distribution"), map[string]interface{}{
		"DistributionConfig": map[string]interface{}{
			"Enabled":     true,
			"HttpVersion": "http2and3",
			"PriceClass":  "PriceClass_100",
		},
	})
}

// Test Lambda code generation functions
func TestGetTranscodeLambdaCode(t *testing.T) {
	// This indirectly tests the getTranscodeLambdaCode function by checking Lambda code in template
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	// Verify Lambda has inline code
	template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
		"Code": map[string]interface{}{
			"ZipFile": assertions.Match_StringLikeRegexp(jsii.String(".*MediaConvertClient.*")),
		},
	})
}

// Test stack outputs
func TestStackOutputs(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	// Verify outputs exist
	template.HasOutput(jsii.String("SourceBucketName"), map[string]interface{}{})
	template.HasOutput(jsii.String("ProcessedBucketName"), map[string]interface{}{})
	template.HasOutput(jsii.String("JobTableName"), map[string]interface{}{})
	template.HasOutput(jsii.String("DistributionDomainName"), map[string]interface{}{})
	template.HasOutput(jsii.String("TranscodeFunctionArn"), map[string]interface{}{})
	template.HasOutput(jsii.String("StatusFunctionArn"), map[string]interface{}{})
	template.HasOutput(jsii.String("NotificationTopicArn"), map[string]interface{}{})
}

// Test EventBridge rule for MediaConvert
func TestEventBridgeRule(t *testing.T) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps:        awscdk.StackProps{Env: &awscdk.Environment{Region: jsii.String("eu-south-1")}},
		EnvironmentSuffix: jsii.String("test"),
	})
	template := assertions.Template_FromStack(stack, nil)
	// Verify EventBridge rule for MediaConvert exists
	template.HasResourceProperties(jsii.String("AWS::Events::Rule"), map[string]interface{}{
		"EventPattern": map[string]interface{}{
			"source":      []interface{}{"aws.mediaconvert"},
			"detail-type": []interface{}{"MediaConvert Job State Change"},
		},
		"State": "ENABLED",
	})
}
