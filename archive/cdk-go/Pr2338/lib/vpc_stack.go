package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type VpcStackProps struct {
	*awscdk.StackProps
	EnvironmentName string
}

type VpcStack struct {
	awscdk.Stack
	Vpc           awsec2.Vpc
	PrivateSubnet awsec2.ISubnet
	PublicSubnet  awsec2.ISubnet
}

func NewVpcStack(scope constructs.Construct, id *string, props *VpcStackProps) *VpcStack {
	var sprops awscdk.StackProps
	if props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Create VPC with public and private subnets across multiple AZs
	vpc := awsec2.NewVpc(stack, jsii.String("ProductionVpc"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(2), // Use 2 AZs for high availability
		Cidr:   jsii.String("10.0.0.0/16"),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		NatGateways:        jsii.Number(1), // Single NAT Gateway for cost optimization
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Tag the VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Component"), jsii.String("Network"), nil)

	// Get first subnets for resource placement
	privateSubnets := *vpc.PrivateSubnets()
	publicSubnets := *vpc.PublicSubnets()

	var privateSubnet awsec2.ISubnet
	var publicSubnet awsec2.ISubnet

	if len(privateSubnets) > 0 {
		privateSubnet = privateSubnets[0]
	}
	if len(publicSubnets) > 0 {
		publicSubnet = publicSubnets[0]
	}

	return &VpcStack{
		Stack:         stack,
		Vpc:           vpc,
		PrivateSubnet: privateSubnet,
		PublicSubnet:  publicSubnet,
	}
}
