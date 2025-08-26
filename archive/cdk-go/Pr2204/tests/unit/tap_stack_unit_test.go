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

		// ASSERT - Security Group Creation
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Strict security group allowing HTTP from specific CIDR only, blocking all outbound traffic",
			"GroupName":        "corpSecurityGroup",
			"SecurityGroupIngress": []interface{}{
				map[string]interface{}{
					"IpProtocol":  "tcp",
					"FromPort":    80,
					"ToPort":      80,
					"CidrIp":      "203.0.113.0/24",
					"Description": "Allow HTTP traffic from trusted CIDR block 203.0.113.0/24 only",
				},
			},
			"SecurityGroupEgress": []interface{}{
				map[string]interface{}{
					"CidrIp":      "255.255.255.255/32",
					"Description": "Disallow all traffic",
					"FromPort":    252,
					"IpProtocol":  "icmp",
					"ToPort":      86,
				},
			},
		})

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

		// ASSERT - Subnets (public and private)
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4)) // 2 AZs * 2 subnet types

		// ASSERT - NAT Gateway
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(1))
	})

	t.Run("creates CloudFormation outputs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, "TapStackOutputTest", &lib.TapStackProps{
			StackProps: awscdk.StackProps{},
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT - Outputs
		template.HasOutput(jsii.String("VPCId"), map[string]interface{}{
			"Description": "ID of the secure corporate VPC",
			"Export": map[string]interface{}{
				"Name": "corpVPC-Id",
			},
		})

		template.HasOutput(jsii.String("SecurityGroupId"), map[string]interface{}{
			"Description": "ID of the strict corporate security group",
			"Export": map[string]interface{}{
				"Name": "corpSecurityGroup-Id",
			},
		})

		template.HasOutput(jsii.String("VPCCidr"), map[string]interface{}{
			"Description": "CIDR block of the corporate VPC",
			"Export": map[string]interface{}{
				"Name": "corpVPC-Cidr",
			},
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
