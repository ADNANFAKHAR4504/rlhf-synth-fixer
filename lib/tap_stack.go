package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with an environment suffix
// that is used for namespacing child stacks and resources.
// NOTE: Core shape preserved per instructions.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., "dev", "prod").
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// Per design: do not create resources directly in this stack. Instead,
// we compose nested stacks that each own a set of resources. We keep
// the type shape and EnvironmentSuffix field intact.
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

// -----------------------------
// Nested stack definitions
// -----------------------------

// NetworkNestedStack creates the VPC, subnets, routing, and NAT gateways.
// Requirements covered:
// - VPC with CIDR 10.0.0.0/16
// - 2 public + 2 private subnets across 2 AZs
// - Internet Gateway (implicit) and NATs for private egress
// - Tagging: Environment=Production (inherited from parent)
type NetworkNestedStack struct {
	awscdk.NestedStack
	Vpc awsec2.IVpc
}

func NewNetworkNestedStack(scope constructs.Construct, id *string, props *awscdk.NestedStackProps) *NetworkNestedStack {
	ns := awscdk.NewNestedStack(scope, id, props)

	vpc := awsec2.NewVpc(ns, jsii.String("ProductionVPC"), &awsec2.VpcProps{
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:      jsii.Number(2),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		NatGateways:        jsii.Number(2), // HA: one per AZ
	})

	return &NetworkNestedStack{
		NestedStack: ns,
		Vpc:         vpc,
	}
}

// SecurityNestedStack creates the security groups used by compute and services.
// Requirements covered:
// - SSH allowed only from a specific CIDR (203.0.113.0/24) to the bastion
// - Private resources restricted; least-privilege access within VPC
// - Tags inherited; explicit names applied for clarity
type SecurityNestedStack struct {
	awscdk.NestedStack
	BastionSG awsec2.ISecurityGroup
	PrivateSG awsec2.ISecurityGroup
}

type SecurityNestedStackProps struct {
	awscdk.NestedStackProps
	Vpc awsec2.IVpc
}

func NewSecurityNestedStack(scope constructs.Construct, id *string, props *SecurityNestedStackProps) *SecurityNestedStack {
	ns := awscdk.NewNestedStack(scope, id, &props.NestedStackProps)

	bastionSG := awsec2.NewSecurityGroup(ns, jsii.String("BastionSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		Description:       jsii.String("Security group for Bastion host"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("bastion-sg"),
	})
	bastionSG.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("203.0.113.0/24")),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH access from trusted IPs"),
		jsii.Bool(false),
	)

	privateSG := awsec2.NewSecurityGroup(ns, jsii.String("PrivateSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		Description:       jsii.String("Security group for private resources"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("private-resources-sg"),
	})
	// Allow SSH only from bastion
	privateSG.AddIngressRule(
		awsec2.Peer_SecurityGroupId(bastionSG.SecurityGroupId(), nil), // <- add nil for description
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH from Bastion only"),
		jsii.Bool(false),
	)
	// Allow HTTP/HTTPS within VPC
	privateSG.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("HTTP from within VPC"),
		jsii.Bool(false),
	)
	privateSG.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS from within VPC"),
		jsii.Bool(false),
	)

	return &SecurityNestedStack{
		NestedStack: ns,
		BastionSG:   bastionSG,
		PrivateSG:   privateSG,
	}
}

// ComputeNestedStack creates the Bastion host in a public subnet.
// Requirements covered:
// - Bastion host instance placed in a public subnet
// - Associate public IP; optional key pair via context key "bastionKeyName"
type ComputeNestedStack struct {
	awscdk.NestedStack
	Bastion awsec2.Instance
}

type ComputeNestedStackProps struct {
	awscdk.NestedStackProps
	Vpc      awsec2.IVpc
	BastionSG awsec2.ISecurityGroup
}

func NewComputeNestedStack(scope constructs.Construct, id *string, props *ComputeNestedStackProps) *ComputeNestedStack {
	ns := awscdk.NewNestedStack(scope, id, &props.NestedStackProps)

	// Latest Amazon Linux 2 AMI
	ami := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	// Optional key name from context
	var keyName *string
	if v := ns.Node().TryGetContext(jsii.String("bastionKeyName")); v != nil {
		if s, ok := v.(string); ok {
			keyName = jsii.String(s)
		}
	}

	bastion := awsec2.NewInstance(ns, jsii.String("BastionHost"), &awsec2.InstanceProps{
		Vpc:                      props.Vpc,
		InstanceType:             awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage:             ami,
		SecurityGroup:            props.BastionSG,
		VpcSubnets:               &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
		AssociatePublicIpAddress: jsii.Bool(true),
		KeyName:                  keyName, // may be nil if not provided
	})

	// Simple user data
	bastion.UserData().AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y aws-cli"),
		jsii.String("echo 'Bastion ready' > /tmp/ready.txt"),
	)

	return &ComputeNestedStack{
		NestedStack: ns,
		Bastion:     bastion,
	}
}

// StorageNestedStack creates an S3 bucket with Block Public Access enforced.
// Requirements covered:
// - All S3 buckets must have Block Public Access enabled
// - Encryption and SSL enforced for best practices
type StorageNestedStack struct {
	awscdk.NestedStack
	Bucket awss3.Bucket
}

func NewStorageNestedStack(scope constructs.Construct, id *string, props *awscdk.NestedStackProps) *StorageNestedStack {
	ns := awscdk.NewNestedStack(scope, id, props)

	bucket := awss3.NewBucket(ns, jsii.String("ProductionBucket"), &awss3.BucketProps{
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_RETAIN,
	})

	return &StorageNestedStack{
		NestedStack: ns,
		Bucket:      bucket,
	}
}

// ObservabilityNestedStack enables VPC Flow Logs to CloudWatch Logs (no KMS required).
// While not explicitly required, it aligns with production-readiness.
type ObservabilityNestedStack struct {
	awscdk.NestedStack
}

type ObservabilityNestedStackProps struct {
	awscdk.NestedStackProps
	Vpc awsec2.IVpc
}

func NewObservabilityNestedStack(scope constructs.Construct, id *string, props *ObservabilityNestedStackProps) *ObservabilityNestedStack {
	ns := awscdk.NewNestedStack(scope, id, &props.NestedStackProps)

	// Log group with a modest retention to control costs.
	_ = awslogs.NewLogGroup(ns, jsii.String("VpcFlowLogs"), &awslogs.LogGroupProps{
		Retention: awslogs.RetentionDays_ONE_MONTH,
	})

	awsec2.NewFlowLog(ns, jsii.String("VpcFlowLogsAll"), &awsec2.FlowLogProps{
		ResourceType: awsec2.FlowLogResourceType_FromVpc(props.Vpc),
		TrafficType:  awsec2.FlowLogTrafficType_ALL,
	})

	return &ObservabilityNestedStack{NestedStack: ns}
}

// NewTapStack composes all nested stacks and applies global tags/outputs.
// Core design (type and EnvironmentSuffix logic) is preserved.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil && props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Resolve environment suffix: props -> context -> default "dev"
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		if s, ok := suffix.(string); ok {
			environmentSuffix = s
		} else {
			environmentSuffix = "dev"
		}
	} else {
		environmentSuffix = "dev"
	}

	// Global tags for all resources in this app
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// Instantiate nested stacks in dependency order
	network := NewNetworkNestedStack(stack, jsii.String("Network-"+environmentSuffix), &awscdk.NestedStackProps{})
	security := NewSecurityNestedStack(stack, jsii.String("Security-"+environmentSuffix), &SecurityNestedStackProps{
		NestedStackProps: awscdk.NestedStackProps{},
		Vpc:             network.Vpc,
	})
	compute := NewComputeNestedStack(stack, jsii.String("Compute-"+environmentSuffix), &ComputeNestedStackProps{
		NestedStackProps: awscdk.NestedStackProps{},
		Vpc:             network.Vpc,
		BastionSG:       security.BastionSG,
	})
	_ = NewStorageNestedStack(stack, jsii.String("Storage-"+environmentSuffix), &awscdk.NestedStackProps{})
	_ = NewObservabilityNestedStack(stack, jsii.String("Observability-"+environmentSuffix), &ObservabilityNestedStackProps{
		NestedStackProps: awscdk.NestedStackProps{},
		Vpc:             network.Vpc,
	})

	// Useful outputs
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       network.Vpc.VpcId(),
		Description: jsii.String("VPC ID"),
	})
	awscdk.NewCfnOutput(stack, jsii.String("BastionPublicIp"), &awscdk.CfnOutputProps{
		Value:       compute.Bastion.InstancePublicIp(),
		Description: jsii.String("Bastion Host Public IP"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
