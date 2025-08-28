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

	t.Run("creates VPC with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"CidrBlock":          "10.0.0.0/16",
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
		})
	})

	t.Run("creates security groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Should create 3 security groups: ALB, Web, and Database
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(3))

		// Check ALB Security Group
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Security group for Application Load Balancer",
		})

		// Check Web Security Group
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Security group for web servers",
		})

		// Check Database Security Group
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Security group for RDS database",
		})
	})

	t.Run("creates S3 bucket with correct properties", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
			"BucketEncryption": map[string]interface{}{
				"ServerSideEncryptionConfiguration": []interface{}{
					map[string]interface{}{
						"ServerSideEncryptionByDefault": map[string]interface{}{
							"SSEAlgorithm": "aws:kms",
						},
					},
				},
			},
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
		})
	})

	t.Run("creates Lambda function for S3 processing", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
			"Runtime": "python3.9",
			"Handler": "index.handler",
			"Timeout": 300, // 5 minutes
		})
	})

	t.Run("creates RDS database with correct properties", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"Engine":                    "mysql",
			"MultiAZ":                   true,
			"AllocatedStorage":          "20",
			"StorageEncrypted":          true,
			"DeletionProtection":        false,
			"DBInstanceClass":           "db.t3.small",
			"EnablePerformanceInsights": false,
		})
	})

	t.Run("creates Application Load Balancer", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Scheme": "internet-facing",
			"Type":   "application",
		})
	})

	t.Run("creates Auto Scaling Group", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::AutoScaling::AutoScalingGroup"), map[string]interface{}{
			"MinSize":         "2",
			"MaxSize":         "10",
			"DesiredCapacity": "2",
		})
	})

	t.Run("creates KMS key for encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation": true,
		})
	})

	t.Run("creates IAM role for EC2 instances", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.HasResourceProperties(jsii.String("AWS::IAM::Role"), map[string]interface{}{
			"AssumeRolePolicyDocument": map[string]interface{}{
				"Statement": []interface{}{
					map[string]interface{}{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "ec2.amazonaws.com",
						},
					},
				},
			},
		})
	})

	t.Run("creates CloudWatch Log Groups", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::Logs::LogGroup"), jsii.Number(2))
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName": "/aws/ec2/nginx/access",
		})
		template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
			"LogGroupName": "/aws/ec2/nginx/error",
		})
	})

	t.Run("creates SSM Parameters", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::SSM::Parameter"), jsii.Number(2))
		template.HasResourceProperties(jsii.String("AWS::SSM::Parameter"), map[string]interface{}{
			"Name": "/myapp/database/password",
			"Type": "String",
		})
		template.HasResourceProperties(jsii.String("AWS::SSM::Parameter"), map[string]interface{}{
			"Name": "/myapp/api/key",
			"Type": "String",
		})
	})

	t.Run("creates Launch Template", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::LaunchTemplate"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::LaunchTemplate"), map[string]interface{}{
			"LaunchTemplateData": map[string]interface{}{
				"InstanceType": "t3.small",
				"Monitoring": map[string]interface{}{
					"Enabled": true,
				},
			},
		})
	})

	t.Run("creates CloudWatch Dashboard", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CloudWatch::Dashboard"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::CloudWatch::Dashboard"), map[string]interface{}{
			"DashboardName": "MyApp-test-Dashboard",
		})
	})

	t.Run("creates CloudFormation Outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		outputs := template.FindOutputs(jsii.String("*"), map[string]interface{}{})
		assert.Contains(t, *outputs, "VPCId")
		assert.Contains(t, *outputs, "ALBDNSName")
		assert.Contains(t, *outputs, "S3BucketName")
		assert.Contains(t, *outputs, "DatabaseEndpoint")
		assert.Contains(t, *outputs, "LambdaFunctionName")
	})

	t.Run("creates target group and listener", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), map[string]interface{}{
			"Port":       80,
			"Protocol":   "HTTP",
			"TargetType": "instance",
		})

		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::Listener"), map[string]interface{}{
			"Port":     80,
			"Protocol": "HTTP",
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
	stack := lib.NewTapStack(app, jsii.String("BenchStack"), &lib.TapStackProps{
		StackProps:        &awscdk.StackProps{},
		EnvironmentSuffix: jsii.String("bench"),
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		assertions.Template_FromStack(stack.Stack, nil)
	}
}
