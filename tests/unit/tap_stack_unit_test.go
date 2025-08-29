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

	t.Run("creates VPC with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackVPCTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"CidrBlock": "10.0.0.0/16",
			"EnableDnsHostnames": true,
			"EnableDnsSupport": true,
		})
	})

	t.Run("creates S3 buckets with proper security configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackS3Test"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(2)) // logs bucket and config bucket
		
		// Check logs bucket properties
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls": true,
				"BlockPublicPolicy": true,
				"IgnorePublicAcls": true,
				"RestrictPublicBuckets": true,
			},
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("creates KMS key with proper configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackKMSTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation": true,
		})
	})

	t.Run("creates Application Load Balancer with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackALBTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Scheme": "internet-facing",
			"Type": "application",
		})
	})

	t.Run("creates Auto Scaling Group with proper configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackASGTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::AutoScaling::AutoScalingGroup"), map[string]interface{}{
			"MinSize": "2",
			"MaxSize": "10",
			"DesiredCapacity": "2",
		})
	})

	t.Run("creates RDS database with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackRDSTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"StorageEncrypted": true,
			"MultiAZ": true,
			"DeletionProtection": true,
			"BackupRetentionPeriod": 7,
		})
	})

	t.Run("creates WAF Web ACL with managed rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackWAFTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACL"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"Scope": "REGIONAL",
		})
	})

	t.Run("creates CloudTrail for API monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackCloudTrailTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CloudTrail::Trail"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
			"IncludeGlobalServiceEvents": true,
			"IsMultiRegionTrail": true,
			"EnableLogFileValidation": true,
		})
	})

	t.Run("creates AWS Config for compliance monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackConfigTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Config::ConfigurationRecorder"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::Config::DeliveryChannel"), jsii.Number(1))
	})

	t.Run("creates CloudWatch alarms for monitoring", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackAlarmsTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(2)) // CPU and DB connection alarms
	})

	t.Run("creates IAM roles with least privilege", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackIAMTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::IAM::Role"), jsii.Number(2)) // EC2 role and Config role
		template.ResourceCountIs(jsii.String("AWS::IAM::InstanceProfile"), jsii.Number(1))
	})

	t.Run("creates security groups with proper rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackSecurityTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(3)) // ALB, EC2, and RDS security groups
	})

	t.Run("creates Network ACL with proper rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackNACLTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::NetworkAcl"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::EC2::NetworkAclEntry"), jsii.Number(2)) // HTTP and HTTPS rules
	})

	t.Run("creates CloudWatch Log Groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackLogsTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(1))
	})

	t.Run("creates proper outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackOutputsTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.OutputCountIs(jsii.Number(3)) // LoadBalancerDNS, DatabaseEndpoint, KMSKeyId
		template.HasOutput(jsii.String("LoadBalancerDNS"), map[string]interface{}{
			"Description": "DNS name of the Application Load Balancer",
		})
		template.HasOutput(jsii.String("DatabaseEndpoint"), map[string]interface{}{
			"Description": "RDS database endpoint",
		})
		template.HasOutput(jsii.String("KMSKeyId"), map[string]interface{}{
			"Description": "KMS Key ID for encryption",
		})
	})

	t.Run("stack is created successfully", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackBasicTest"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.Stack)
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
