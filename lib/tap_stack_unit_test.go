package lib

import (
	"testing"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/aws/constructs-go/constructs/v10"
)

// buildAppStack returns the root TapStack (parent) so we can find nested stacks.
func buildAppStack(tb testing.TB) *TapStack {
	tb.Helper()

	app := awscdk.NewApp(nil)
	stack := NewTapStack(
		app,
		jsii.String("TapStackTest"),
		&TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String("dev"),
		},
	)
	return stack
}

// nestedTemplate finds a nested stack by its id under the root and returns its Template.
func nestedTemplate(tb testing.TB, root *TapStack, nestedID string) assertions.Template {
	tb.Helper()

	var node constructs.IConstruct = root.Stack.Node().FindChild(jsii.String(nestedID))
	if node == nil {
		tb.Fatalf("nested stack %q not found under root", nestedID)
	}

	// awscdk.NestedStack extends awscdk.Stack, so Template_FromStack works on it.
	// jsii types are interfaces in Go; this type assertion should succeed for NestedStack instances.
	ns, ok := node.(awscdk.NestedStack)
	if !ok {
		tb.Fatalf("child %q is not an awscdk.NestedStack (got %T)", nestedID, node)
	}
	return assertions.Template_FromStack(ns, nil)
}

// -------- Network nested stack (Network-dev) --------

func Test_Network_VPC_HasExpectedCIDR(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Network-dev")

	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
		"CidrBlock": "10.0.0.0/16",
	})
}

func Test_Network_Subnets_AreFour_Total(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Network-dev")

	// 2 public + 2 private
	template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))
}

func Test_Network_InternetGateway_Attached(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Network-dev")

	template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::EC2::VPCGatewayAttachment"), jsii.Number(1))
}

func Test_Network_PublicRoutes_GoToIGW(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Network-dev")

	template.HasResourceProperties(jsii.String("AWS::EC2::Route"), map[string]interface{}{
		"DestinationCidrBlock": "0.0.0.0/0",
		"GatewayId":            assertions.Match_AnyValue(),
	})
}

// -------- Security nested stack (Security-dev) --------

func Test_Security_SSH_From_BastionSG_To_PrivateSG(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Security-dev")

	// From bastion SG -> private SG, tcp/22
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
		"IpProtocol":            "tcp",
		"FromPort":              22,
		"ToPort":                22,
		"SourceSecurityGroupId": assertions.Match_AnyValue(),
	})
}

func Test_Security_VPC_Internal_HTTP_HTTPS(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Security-dev")

	// HTTP 80 within VPC
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
		"IpProtocol":           "tcp",
		"FromPort":             80,
		"ToPort":               80,
		"CidrIp":               "10.0.0.0/16",
	})
	// HTTPS 443 within VPC
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
		"IpProtocol":           "tcp",
		"FromPort":             443,
		"ToPort":               443,
		"CidrIp":               "10.0.0.0/16",
	})
}

// -------- Compute nested stack (Compute-dev) --------

func Test_Compute_Bastion_InstanceExists(t *testing.T) {
	root := buildAppStack(t)
	template := nestedTemplate(t, root, "Compute-dev")

	template.ResourceCountIs(jsii.String("AWS::EC2::Instance"), jsii.Number(1))
}

// -------- Root outputs (on parent TapStack) --------

func Test_Root_Outputs_Present(t *testing.T) {
	root := buildAppStack(t)
	parentTpl := assertions.Template_FromStack(root.Stack, nil)

	parentTpl.HasOutput(jsii.String("VpcId"), map[string]interface{}{
		"Description": "VPC ID",
	})
	parentTpl.HasOutput(jsii.String("BastionPublicIp"), map[string]interface{}{
		"Description": "Bastion Host Public IP",
	})
}
