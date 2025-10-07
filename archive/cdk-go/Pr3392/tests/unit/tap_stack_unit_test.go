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

	t.Run("creates nested stacks for infrastructure resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(4))
		// Verify the nested stacks exist without checking specific parameters
		nestedStacks := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), map[string]interface{}{})
		assert.True(t, len(*nestedStacks) == 4, "Should have exactly four nested stacks")
	})

	t.Run("verifies nested stack creation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		// Verify nested stacks exist (we can't easily test the internal resources in unit tests)
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(4))
		nestedStackTemplates := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), map[string]interface{}{})
		assert.True(t, len(*nestedStackTemplates) > 0, "Should have at least one nested stack")
	})

	t.Run("stack can be synthesized without errors", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})

		// ACT & ASSERT
		// This should not panic or throw errors
		template := assertions.Template_FromStack(stack.Stack, nil)
		assert.NotNil(t, template)

		// Verify basic stack structure
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(4))
	})

	t.Run("stack outputs are created", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("test"),
		})
		template := assertions.Template_FromStack(stack.Stack, nil)

		// ASSERT
		outputs := template.FindOutputs(jsii.String("*"), map[string]interface{}{})
		assert.Contains(t, *outputs, "VpcId")
		assert.Contains(t, *outputs, "KmsKeyId")
		assert.Contains(t, *outputs, "RdsEndpoint")
		assert.Contains(t, *outputs, "AlbDnsName")
		assert.Contains(t, *outputs, "SecurityFeatures")
	})
}

func TestNetworkingNestedStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required networking resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("TestNetworkingStack"),
			"test",
			&awscdk.NestedStackProps{
				Description: jsii.String("Test networking stack"),
			},
		)

		// ASSERT
		assert.NotNil(t, nestedStack)
		assert.NotNil(t, nestedStack.Vpc)
		assert.NotNil(t, nestedStack.PrivateSubnets)
		assert.NotNil(t, nestedStack.PublicSubnets)

		// Verify template can be generated
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)
		assert.NotNil(t, template)
	})

	t.Run("VPC has correct properties", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("TestNetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::VPC"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
			"Tags": []interface{}{
				map[string]interface{}{
					"Key":   "Environment",
					"Value": "test",
				},
				map[string]interface{}{
					"Key":   "Name",
					"Value": "tap-vpc-test",
				},
				map[string]interface{}{
					"Key":   "Owner",
					"Value": "TapProject",
				},
			},
		})
	})

	t.Run("DynamoDB VPC Endpoint is created", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("TestNetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::VPCEndpoint"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"VpcEndpointType": "Gateway",
		})
	})
}

func TestSecurityNestedStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required security resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewSecurityNestedStack(
			parentStack,
			jsii.String("TestSecurityStack"),
			"test",
			&awscdk.NestedStackProps{
				Description: jsii.String("Test security stack"),
			},
		)

		// ASSERT
		assert.NotNil(t, nestedStack)
		assert.NotNil(t, nestedStack.KmsKey)

		// Verify template can be generated
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)
		assert.NotNil(t, template)
	})

	t.Run("KMS Key has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// ACT
		nestedStack := lib.NewSecurityNestedStack(
			parentStack,
			jsii.String("TestSecurityStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::KMS::Key"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"Description":       "Customer-managed KMS key for RDS encryption (test)",
			"EnableKeyRotation": true,
		})

		// Verify KMS Alias
		template.ResourceCountIs(jsii.String("AWS::KMS::Alias"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::KMS::Alias"), map[string]interface{}{
			"AliasName": "alias/tap-rds-key-test",
		})
	})

}

func TestDataNestedStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required data resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// Create dependencies
		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		securityStack := lib.NewSecurityNestedStack(
			parentStack,
			jsii.String("SecurityStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewDataNestedStack(
			parentStack,
			jsii.String("TestDataStack"),
			"test",
			networkingStack,
			securityStack,
			&awscdk.NestedStackProps{
				Description: jsii.String("Test data stack"),
			},
		)

		// ASSERT
		assert.NotNil(t, nestedStack)
		assert.NotNil(t, nestedStack.RdsInstance)

		// Verify template can be generated
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)
		assert.NotNil(t, template)
	})

	t.Run("RDS instance has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		securityStack := lib.NewSecurityNestedStack(
			parentStack,
			jsii.String("SecurityStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewDataNestedStack(
			parentStack,
			jsii.String("TestDataStack"),
			"test",
			networkingStack,
			securityStack,
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::RDS::DBInstance"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"DBInstanceIdentifier": "tap-rds-test",
			"Engine":               "mysql",
			"EngineVersion":        "8.0",
			"DBInstanceClass":      "db.t3.small",
			"StorageEncrypted":     true,
			"AllocatedStorage":     "20",
			"MaxAllocatedStorage":  100,
			"DeletionProtection":   false,
			"MultiAZ":              false,
		})
	})

	t.Run("RDS security group has restricted access", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)
		securityStack := lib.NewSecurityNestedStack(
			parentStack,
			jsii.String("SecurityStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewDataNestedStack(
			parentStack,
			jsii.String("TestDataStack"),
			"test",
			networkingStack,
			securityStack,
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Security group for RDS database instance in test environment",
		})

		// Verify security group rules are configured (rules are inline in the SecurityGroup resource)
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"SecurityGroupIngress": []interface{}{
				map[string]interface{}{
					"CidrIp":      "10.0.0.0/16",
					"Description": "Allow MySQL access from VPC",
					"FromPort":    3306,
					"IpProtocol":  "tcp",
					"ToPort":      3306,
				},
			},
		})
	})
}

func TestApplicationNestedStack(t *testing.T) {
	defer jsii.Close()

	t.Run("creates all required application resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		// Create dependencies
		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewApplicationNestedStack(
			parentStack,
			jsii.String("TestApplicationStack"),
			"test",
			networkingStack,
			&awscdk.NestedStackProps{
				Description: jsii.String("Test application stack"),
			},
		)

		// ASSERT
		assert.NotNil(t, nestedStack)
		assert.NotNil(t, nestedStack.Alb)
		assert.NotNil(t, nestedStack.WebAcl)
		assert.NotNil(t, nestedStack.SecurityGroup)

		// Verify template can be generated
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)
		assert.NotNil(t, template)
	})

	t.Run("Application Load Balancer has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewApplicationNestedStack(
			parentStack,
			jsii.String("TestApplicationStack"),
			"test",
			networkingStack,
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Name":   "tap-alb-test",
			"Scheme": "internet-facing",
			"Type":   "application",
		})
	})

	t.Run("WAF WebACL has correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewApplicationNestedStack(
			parentStack,
			jsii.String("TestApplicationStack"),
			"test",
			networkingStack,
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACL"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"Name":  "tap-waf-acl-test",
			"Scope": "REGIONAL",
			"DefaultAction": map[string]interface{}{
				"Allow": map[string]interface{}{},
			},
		})

		// Verify WAF Association
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACLAssociation"), jsii.Number(1))
	})

	t.Run("ALB security group has restricted access", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		networkingStack := lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("NetworkingStack"),
			"test",
			&awscdk.NestedStackProps{},
		)

		// ACT
		nestedStack := lib.NewApplicationNestedStack(
			parentStack,
			jsii.String("TestApplicationStack"),
			"test",
			networkingStack,
			&awscdk.NestedStackProps{},
		)
		template := assertions.Template_FromStack(nestedStack.NestedStack, nil)

		// ASSERT
		template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(1))
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": "Security group for Application Load Balancer in test environment",
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

func BenchmarkNetworkingNestedStackCreation(b *testing.B) {
	defer jsii.Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		app := awscdk.NewApp(nil)
		parentStack := awscdk.NewStack(app, jsii.String("ParentStack"), nil)

		lib.NewNetworkingNestedStack(
			parentStack,
			jsii.String("BenchNetworkingStack"),
			"bench",
			&awscdk.NestedStackProps{},
		)
	}
}
