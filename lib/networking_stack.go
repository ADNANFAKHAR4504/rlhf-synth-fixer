package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type NetworkingStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
}

type NetworkingStack struct {
	awscdk.NestedStack
	Vpc awsec2.IVpc
}

func NewNetworkingStack(scope constructs.Construct, id *string, props *NetworkingStackProps) *NetworkingStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Get environment suffix with fallback
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil && *props.EnvironmentSuffix != "" {
		envSuffix = *props.EnvironmentSuffix
	}

	// Create VPC with public and private subnets
	vpc := awsec2.NewVpc(nestedStack, jsii.String("VPC"), &awsec2.VpcProps{
		MaxAzs:      jsii.Number(3),
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				CidrMask:   jsii.Number(24),
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
			},
			{
				CidrMask:   jsii.Number(24),
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
			{
				CidrMask:   jsii.Number(28),
				Name:       jsii.String("Database"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
			},
		},
		NatGateways:        jsii.Number(2), // For high availability
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Add tags to VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("tap-vpc-"+envSuffix), nil)

	return &NetworkingStack{
		NestedStack: nestedStack,
		Vpc:         vpc,
	}
}
