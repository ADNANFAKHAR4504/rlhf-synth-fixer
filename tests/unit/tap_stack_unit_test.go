package unit

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// testSetup holds the app and stack for testing
type testSetup struct {
	app   awscdk.App
	stack *lib.TapStack
}

// buildAppStack creates a TapStack for testing
func buildAppStack(tb testing.TB) *testSetup {
	tb.Helper()

	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(
		app,
		jsii.String("TapStackTest"),
		&lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("dev"),
		},
	)
	return &testSetup{
		app:   app,
		stack: stack,
	}
}

// getTemplate returns the CloudFormation template for the stack
func getTemplate(tb testing.TB, setup *testSetup) assertions.Template {
	tb.Helper()
	
	// Synthesize the app to generate CloudFormation templates
	setup.app.Synth(nil)
	
	return assertions.Template_FromStack(setup.stack.Stack, nil)
}

func TestTapStack_Construction(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)

	if setup.stack == nil {
		t.Fatal("Stack should not be nil")
	}

	if setup.stack.EnvironmentSuffix == nil || *setup.stack.EnvironmentSuffix != "dev" {
		t.Errorf("Expected environment suffix 'dev', got %v", setup.stack.EnvironmentSuffix)
	}
}

func TestTapStack_VPC_HasCorrectCIDR(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
		"CidrBlock": "10.0.0.0/16",
	})
}

func TestTapStack_VPC_HasDNSSettings(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
		"EnableDnsHostnames": true,
		"EnableDnsSupport":   true,
	})
}

func TestTapStack_Subnets_CorrectCount(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	// Should have 4 subnets total (2 public + 2 private across 2 AZs)
	template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))
}

func TestTapStack_InternetGateway_Exists(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::EC2::VPCGatewayAttachment"), jsii.Number(1))
}

func TestTapStack_NATGateways_HighAvailability(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	// Should have 2 NAT gateways for HA (one per AZ)
	template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(2))
}

func TestTapStack_SecurityGroups_Exist(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	// Should have bastion and private security groups plus default VPC SG
	template.ResourceCountIs(jsii.String("AWS::EC2::SecurityGroup"), jsii.Number(2))
}

func TestTapStack_BastionSG_AllowsSSHFromTrustedCIDR(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
		"GroupName": "tap-bastion-sg",
		"SecurityGroupIngress": []map[string]interface{}{
			{
				"CidrIp":     "203.0.113.0/24",
				"FromPort":   22,
				"ToPort":     22,
				"IpProtocol": "tcp",
			},
		},
	})
}

func TestTapStack_PrivateSG_AllowsHTTPSFromVPC(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
		"GroupName": "tap-private-sg",
		"SecurityGroupIngress": []map[string]interface{}{
			{
				"FromPort":   22,
				"ToPort":     22,
				"IpProtocol": "tcp",
			},
			{
				"CidrIp":     "10.0.0.0/16",
				"FromPort":   80,
				"ToPort":     80,
				"IpProtocol": "tcp",
			},
			{
				"CidrIp":     "10.0.0.0/16",
				"FromPort":   443,
				"ToPort":     443,
				"IpProtocol": "tcp",
			},
		},
	})
}

func TestTapStack_BastionHost_Exists(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.ResourceCountIs(jsii.String("AWS::EC2::Instance"), jsii.Number(1))
}

func TestTapStack_BastionHost_CorrectInstanceType(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasResourceProperties(jsii.String("AWS::EC2::Instance"), map[string]interface{}{
		"InstanceType": "t3.micro",
	})
}

func TestTapStack_S3Bucket_HasBlockPublicAccess(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(1))
	template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
		"PublicAccessBlockConfiguration": map[string]interface{}{
			"BlockPublicAcls":       true,
			"BlockPublicPolicy":     true,
			"IgnorePublicAcls":      true,
			"RestrictPublicBuckets": true,
		},
		"VersioningConfiguration": map[string]interface{}{
			"Status": "Enabled",
		},
		"BucketEncryption": map[string]interface{}{
			"ServerSideEncryptionConfiguration": []map[string]interface{}{
				{
					"ServerSideEncryptionByDefault": map[string]interface{}{
						"SSEAlgorithm": "AES256",
					},
				},
			},
		},
	})
}

func TestTapStack_Tags_Applied(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	// Check that VPC has the Environment tag among others
	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
		"Tags": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{
				"Key":   "Environment",
				"Value": "Production",
			},
		}),
	})
}

func TestTapStack_Outputs_Present(t *testing.T) {
	defer jsii.Close()

	setup := buildAppStack(t)
	template := getTemplate(t, setup)

	template.HasOutput(jsii.String("VpcId"), map[string]interface{}{
		"Description": "VPC ID",
	})
	template.HasOutput(jsii.String("BastionInstanceId"), map[string]interface{}{
		"Description": "Bastion Instance ID",
	})
	template.HasOutput(jsii.String("BastionPublicIp"), map[string]interface{}{
		"Description": "Bastion Public IP",
	})
	template.HasOutput(jsii.String("ArtifactsBucketName"), map[string]interface{}{
		"Description": "Artifacts bucket (BPA enforced)",
	})
}

func TestTapStack_EnvironmentSuffix_DefaultsToDevWhenNil(t *testing.T) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(
		app,
		jsii.String("TapStackDefaultSuffixTest"),
		&lib.TapStackProps{
			StackProps: &awscdk.StackProps{},
			// EnvironmentSuffix is nil
		},
	)

	if stack.EnvironmentSuffix == nil || *stack.EnvironmentSuffix != "dev" {
		t.Errorf("Expected default environment suffix 'dev', got %v", stack.EnvironmentSuffix)
	}
}

func TestTapStack_EnvironmentSuffix_UsesPropsValue(t *testing.T) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(
		app,
		jsii.String("TapStackPropsSuffixTest"),
		&lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("prod"),
		},
	)

	if stack.EnvironmentSuffix == nil || *stack.EnvironmentSuffix != "prod" {
		t.Errorf("Expected environment suffix 'prod', got %v", stack.EnvironmentSuffix)
	}
}
