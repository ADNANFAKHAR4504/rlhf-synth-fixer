package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack orchestrates the network, security, and supporting resources.
// Core types remain intact; resources are created inside NewTapStack to satisfy
// the single-file prompt.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil && props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Resolve environment suffix from props, context, or default to "dev"
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// ---------------------------
	// Global tagging (Production)
	// ---------------------------
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// ---------------------------
	// VPC & Subnets (2 AZs)
	// ---------------------------
	vpc := awsec2.NewVpc(stack, jsii.String("TapProdVpc"), &awsec2.VpcProps{
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		MaxAzs:      jsii.Number(2),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("private-egress"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		NatGateways:        jsii.Number(2), // One per AZ for HA
	})

	// ---------------------------
	// Security Groups
	// ---------------------------

	// Bastion Security Group: allow SSH only from a specific CIDR
	bastionSg := awsec2.NewSecurityGroup(stack, jsii.String("BastionSg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Bastion host SG (SSH only from allowed CIDR)"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("tap-bastion-sg"),
	})
	awscdk.Tags_Of(bastionSg).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// Allow SSH only from the trusted range per the prompt (adjust if needed)
	bastionSg.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("203.0.113.0/24")),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH from trusted IP range"),
		jsii.Bool(false),
	)

	// Private SG for internal resources; SSH only from bastion, HTTP/HTTPS inside VPC
	privateSg := awsec2.NewSecurityGroup(stack, jsii.String("PrivateSg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Private resource SG (SSH from bastion, web within VPC)"),
		AllowAllOutbound:  jsii.Bool(true),
		SecurityGroupName: jsii.String("tap-private-sg"),
	})
	awscdk.Tags_Of(privateSg).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	privateSg.AddIngressRule(
		awsec2.Peer_SecurityGroupId(bastionSg.SecurityGroupId(), nil),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH from bastion"),
		jsii.Bool(false),
	)
	privateSg.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("HTTP within VPC"),
		jsii.Bool(false),
	)
	privateSg.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS within VPC"),
		jsii.Bool(false),
	)

	// ---------------------------
	// Bastion Host (Public Subnet)
	// ---------------------------
	ami := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	bastion := awsec2.NewInstance(stack, jsii.String("BastionHost"), &awsec2.InstanceProps{
		Vpc:           vpc,
		InstanceType:  awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
		MachineImage:  ami,
		SecurityGroup: bastionSg,
		VpcSubnets:    &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
		// Optional: replace with a real key pair name if you plan to use SSH keys
		// KeyName: jsii.String("your-keypair-name"),
		AssociatePublicIpAddress: jsii.Bool(true),
		DetailedMonitoring:       jsii.Bool(true),
		UserData: awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
			Shebang: jsii.String("#!/bin/bash"),
		}),
	})

	// Simple user-data hardening/bootstrap
	bastion.UserData().AddCommands(
		jsii.String("set -eux"),
		jsii.String("yum update -y"),
		jsii.String("yum install -y aws-cli htop"),
		jsii.String("echo 'Bastion ready' > /var/tmp/bastion-ready.txt"),
	)

	awscdk.Tags_Of(bastion).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(bastion).Add(jsii.String("Role"), jsii.String("Bastion"), nil)
	awscdk.Tags_Of(bastion).Add(jsii.String("Name"), jsii.String("tap-bastion-"+environmentSuffix), nil)

	// ---------------------------
	// S3 Bucket (Block Public Access)
	// ---------------------------
	// Note: name left to AWS to avoid collisions; block public access is mandatory per prompt.
	bucket := awss3.NewBucket(stack, jsii.String("ArtifactsBucket"), &awss3.BucketProps{
		Versioned:         jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})
	awscdk.Tags_Of(bucket).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// ---------------------------
	// Useful Outputs
	// ---------------------------
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
	})
	awscdk.NewCfnOutput(stack, jsii.String("BastionInstanceId"), &awscdk.CfnOutputProps{
		Value:       bastion.InstanceId(),
		Description: jsii.String("Bastion Instance ID"),
	})
	awscdk.NewCfnOutput(stack, jsii.String("BastionPublicIp"), &awscdk.CfnOutputProps{
		Value:       bastion.InstancePublicIp(),
		Description: jsii.String("Bastion Public IP"),
	})
	awscdk.NewCfnOutput(stack, jsii.String("ArtifactsBucketName"), &awscdk.CfnOutputProps{
		Value:       bucket.BucketName(),
		Description: jsii.String("Artifacts bucket (BPA enforced)"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
