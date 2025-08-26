I'll create a secure VPC infrastructure using AWS CDK in Go with strict security controls. Here's the complete implementation:

```go
// tap_stack.go
package main

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
		
		// Add tags for resource identification and compliance
		Tags: &map[string]*string{
			"Name":        jsii.String("corpVPC"),
			"Environment": jsii.String("production"),
			"Purpose":     jsii.String("secure-infrastructure"),
			"Owner":       jsii.String("corp-security-team"),
		},
	})

	// Create a highly restrictive security group
	// This security group implements zero-trust principles with explicit allow rules
	securityGroup := awsec2.NewSecurityGroup(stack, jsii.String("corpSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: vpc,
		
		// Descriptive name and description for security auditing
		SecurityGroupName: jsii.String("corpSecurityGroup"),
		Description:       jsii.String("Strict security group allowing HTTP from specific CIDR only, blocking all outbound traffic"),
		
		// Disable default outbound rules - we'll add explicit rules
		AllowAllOutbound: jsii.Bool(false),
		
		// Add tags for compliance and identification
		Tags: &map[string]*string{
			"Name":           jsii.String("corpSecurityGroup"),
			"SecurityLevel":  jsii.String("strict"),
			"Purpose":        jsii.String("restricted-web-access"),
			"Owner":          jsii.String("corp-security-team"),
		},
	})

	// Add strict inbound rule: Allow HTTP (port 80) ONLY from specific CIDR
	// This implements the principle of least privilege access
	securityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("203.0.113.0/24")), // Source: Specific CIDR block only
		awsec2.Port_Tcp(jsii.Number(80)),                 // Port: HTTP (80)
		jsii.String("Allow HTTP traffic from trusted CIDR block 203.0.113.0/24 only"),
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

// Main function for CDK app initialization
// This sets up the CDK application and creates the secure infrastructure stack
func main() {
	defer jsii.Close()

	// Initialize the CDK application
	app := awscdk.NewApp(nil)

	// Create the secure VPC infrastructure stack
	NewTapStack(app, "SecureInfrastructureStack", &TapStackProps{
		awscdk.StackProps{
			Env: env(),
			Tags: &map[string]*string{
				"Project":     jsii.String("secure-infrastructure"),
				"Environment": jsii.String("production"),
				"Team":        jsii.String("corp-security"),
			},
		},
	})

	// Synthesize the CDK app to CloudFormation
	app.Synth(nil)
}

// env determines the AWS environment (account + region) for stack deployment
// This function provides environment configuration for the CDK stack
func env() *awscdk.Environment {
	return nil // Uses default environment from AWS credentials/config
}
```

## Key Security Features Implemented:

### 1. **Secure VPC Configuration**
- **CIDR Block**: `10.0.0.0/16` as specified
- **DNS Support**: Enabled for proper name resolution
- **Subnet Segregation**: Public and private subnets for network isolation
- **Resource Tagging**: Comprehensive tagging for compliance and management

### 2. **Strict Security Group Controls**
- **Inbound Rules**: Only allows HTTP (port 80) from `203.0.113.0/24`
- **Outbound Rules**: **ALL outbound traffic blocked** by setting `AllowAllOutbound: false`
- **Zero Trust**: Implements explicit allow model with no default permissions

### 3. **Internet Gateway**
- Automatically created and attached through VPC subnet configuration
- Enables controlled internet access for public subnets only

### 4. **CDK Best Practices**
- **Resource Naming**: All resources use 'corp' prefix as required
- **Proper Scoping**: Correct use of constructs and stack hierarchy
- **Output Exports**: Key resource IDs exported for cross-stack references
- **Error Handling**: Proper Go pointer handling and JSII integration

## Usage Instructions:

1. **Initialize the project**:
```bash
mkdir secure-vpc-infrastructure
cd secure-vpc-infrastructure
go mod init secure-vpc-infrastructure
```

2. **Install dependencies**:
```bash
go get github.com/aws/aws-cdk-go/awscdk/v2
go get github.com/aws/aws-cdk-go/awscdk/v2/awsec2
go get github.com/aws/constructs-go/constructs/v10
go get github.com/aws/jsii-runtime-go
```

3. **Deploy the stack**:
```bash
cdk synth --output secure_infra.yml
cdk deploy
```

## Security Validation:

The security group configuration ensures:
- ✅ **Inbound**: Only HTTP from `203.0.113.0/24` allowed
- ✅ **Outbound**: **ALL traffic blocked** (no egress rules added)
- ✅ **Default Rules**: Removed by setting `AllowAllOutbound: false`

This implementation provides maximum security through explicit deny-by-default policies and minimal attack surface exposure.