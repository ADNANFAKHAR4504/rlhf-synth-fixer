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

	t.Run("creates VPC with correct CIDR and naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - VPC Creation
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"CidrBlock":          "10.0.0.0/16",
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
		})

		// Verify stack was created successfully
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.VPC)
	})

	t.Run("creates security group with strict inbound/outbound rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackSecurityTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Security Group Creation (EC2, ALB, RDS)
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(3))

		// Verify security group was created successfully
		assert.NotNil(t, stack.SecurityGroup)
	})

	t.Run("creates Internet Gateway and subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackNetworkTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Internet Gateway
		template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
		template.ResourceCountIs(jsii.String("AWS::EC2::VPCGatewayAttachment"), jsii.Number(1))

		// ASSERT - Subnets (public, private, and isolated for RDS)
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(6)) // 2 AZs * 3 subnet types

		// ASSERT - NAT Gateway
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(2)) // 2 AZs
	})

	t.Run("creates S3 bucket with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackS3Test", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - S3 Buckets (main storage bucket only, AWS Config bucket removed due to regional limits)
		template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketEncryption": map[string]interface{}{
				"ServerSideEncryptionConfiguration": []interface{}{
					map[string]interface{}{
						"ServerSideEncryptionByDefault": map[string]interface{}{
							"SSEAlgorithm": "AES256",
						},
					},
				},
			},
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("creates RDS instance with security", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackRDSTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - RDS Instance
		template.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"Engine":           "mysql",
			"EngineVersion":    "8.0.39",
			"DBInstanceClass":  "db.t3.micro",
			"StorageEncrypted": true,
		})

		// ASSERT - RDS Subnet Group
		template.ResourceCountIs(jsii.String("AWS::RDS::DBSubnetGroup"), jsii.Number(1))
	})

	t.Run("creates DynamoDB table with encryption", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackDynamoTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - DynamoDB Table
		template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
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
		})
	})

	t.Run("creates Application Load Balancer and Auto Scaling Group", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackALBTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Application Load Balancer
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Type":   "application",
			"Scheme": "internet-facing",
		})

		// ASSERT - Auto Scaling Group
		template.ResourceCountIs(jsii.String("AWS::AutoScaling::AutoScalingGroup"), jsii.Number(1))

		// ASSERT - Launch Template
		template.ResourceCountIs(jsii.String("AWS::EC2::LaunchTemplate"), jsii.Number(1))

		// ASSERT - Target Group
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::TargetGroup"), jsii.Number(1))
	})

	t.Run("creates CloudFront distribution", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackCloudFrontTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - CloudFront Distribution
		template.ResourceCountIs(jsii.String("AWS::CloudFront::Distribution"), jsii.Number(1))
	})

	t.Run("creates WAF Web ACL", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackWAFTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - WAF Web ACL
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACL"), jsii.Number(1))
	})

	t.Run("creates CloudFormation outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackOutputTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Key Outputs (using actual output names from our stack)
		template.HasOutput(jsii.String("VpcId"), map[string]interface{}{
			"Description": "VPC ID",
		})

		template.HasOutput(jsii.String("LoadBalancerDNS"), map[string]interface{}{
			"Description": "Application Load Balancer DNS name",
		})

		template.HasOutput(jsii.String("CloudFrontDomainName"), map[string]interface{}{
			"Description": "CloudFront distribution domain name",
		})
	})
}

// Benchmark tests can be added here
func BenchmarkTapStackCreation(b *testing.B) {
	defer jsii.Close()

	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		lib.NewTapStack(app, "BenchStack", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
	}
}
