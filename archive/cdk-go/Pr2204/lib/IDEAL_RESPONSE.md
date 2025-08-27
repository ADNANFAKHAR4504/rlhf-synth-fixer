```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack
type TapStackProps struct {
	awscdk.StackProps
}

// TapStack represents the CDK stack for secure VPC infrastructure
type TapStack struct {
	awscdk.Stack
	VPC           awsec2.Vpc
	SecurityGroup awsec2.SecurityGroup
}

// NewTapStack creates a new instance of the secure VPC infrastructure stack
// This function provisions a VPC with strict security controls including:
// - A VPC with CIDR 10.0.0.0/16
// - An Internet Gateway for external connectivity
// - A security group with restrictive inbound/outbound rules
func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create the secure VPC with Internet Gateway
	// This VPC will serve as the foundation for our secure infrastructure
	vpc := awsec2.NewVpc(stack, jsii.String("corpVPC"), &awsec2.VpcProps{
		// Define the IP address range for the VPC
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),

		// Configure subnets across availability zones
		MaxAzs: jsii.Number(2),

		// Define subnet configuration for public and private subnets
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("corpPublicSubnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("corpPrivateSubnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},

		// Internet Gateway configuration
		// This enables internet connectivity for public subnets
		NatGateways: jsii.Number(1),

		// Enable DNS support and hostnames for proper name resolution
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Add tags to VPC using CDK Tags API
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("corpVPC"), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), jsii.String("production"), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Purpose"), jsii.String("secure-infrastructure"), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Owner"), jsii.String("corp-security-team"), nil)

	// Create a highly restrictive security group
	// This security group implements zero-trust principles with explicit allow rules
	securityGroup := awsec2.NewSecurityGroup(stack, jsii.String("corpSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: vpc,

		// Descriptive name and description for security auditing
		SecurityGroupName: jsii.String("corpSecurityGroup"),
		Description:       jsii.String("Strict security group allowing HTTP from specific CIDR only, blocking all outbound traffic"),

		// Disable default outbound rules - we'll add explicit rules
		AllowAllOutbound: jsii.Bool(false),
	})

	// Add tags to Security Group using CDK Tags API
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Name"), jsii.String("corpSecurityGroup"), nil)
	awscdk.Tags_Of(securityGroup).Add(jsii.String("SecurityLevel"), jsii.String("strict"), nil)
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Purpose"), jsii.String("restricted-web-access"), nil)
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Owner"), jsii.String("corp-security-team"), nil)

	// Add strict inbound rule: Allow HTTP (port 80) ONLY from specific CIDR
	// This implements the principle of least privilege access
	securityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("203.0.113.0/24")), // Source: Specific CIDR block only
		awsec2.Port_Tcp(jsii.Number(80)),                // Port: HTTP (80)
		jsii.String("Allow HTTP traffic from trusted CIDR block 203.0.113.0/24 only"),
		jsii.Bool(false), // remoteRule parameter - set to false for standard rule
	)

	// Explicitly deny all outbound traffic by not adding any egress rules
	// Since AllowAllOutbound is set to false, no outbound traffic is permitted
	// This creates an air-gapped security posture for maximum security

	// Output important resource identifiers for reference and automation
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("ID of the secure corporate VPC"),
		ExportName:  jsii.String("corpVPC-Id"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("SecurityGroupId"), &awscdk.CfnOutputProps{
		Value:       securityGroup.SecurityGroupId(),
		Description: jsii.String("ID of the strict corporate security group"),
		ExportName:  jsii.String("corpSecurityGroup-Id"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("VPCCidr"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcCidrBlock(),
		Description: jsii.String("CIDR block of the corporate VPC"),
		ExportName:  jsii.String("corpVPC-Cidr"),
	})

	// Return the stack instance with references to created resources
	return &TapStack{
		Stack:         stack,
		VPC:           vpc,
		SecurityGroup: securityGroup,
	}
}
```