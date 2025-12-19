package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// NetworkConstructProps defines properties for the network construct.
type NetworkConstructProps struct {
	EnvironmentSuffix *string
}

// NetworkConstruct represents the network infrastructure.
type NetworkConstruct struct {
	constructs.Construct
	Vpc awsec2.Vpc
}

// NewNetworkConstruct creates VPC with public and private subnets across 2 AZs.
func NewNetworkConstruct(scope constructs.Construct, id *string, props *NetworkConstructProps) *NetworkConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create VPC with public and private subnets in 2 AZs
	vpc := awsec2.NewVpc(construct, jsii.String("Vpc"), &awsec2.VpcProps{
		VpcName:     jsii.String(fmt.Sprintf("globalstream-vpc-%s", environmentSuffix)),
		MaxAzs:      jsii.Number(2),
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
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
		// Use single NAT Gateway for cost optimization
		NatGateways: jsii.Number(1),
		// Restrict default security group
		RestrictDefaultSecurityGroup: jsii.Bool(true),
	})

	// Add VPC endpoints for S3 to reduce NAT costs
	vpc.AddGatewayEndpoint(jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
	})

	// Add VPC endpoint for DynamoDB to reduce NAT costs
	vpc.AddGatewayEndpoint(jsii.String("DynamoDbEndpoint"), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_DYNAMODB(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
	})

	// Add VPC endpoint for Secrets Manager
	vpc.AddInterfaceEndpoint(jsii.String("SecretsManagerEndpoint"), &awsec2.InterfaceVpcEndpointOptions{
		Service: awsec2.InterfaceVpcEndpointAwsService_SECRETS_MANAGER(),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// Tag VPC for identification
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String(fmt.Sprintf("globalstream-vpc-%s", environmentSuffix)), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Purpose"), jsii.String("DR Infrastructure"), nil)

	return &NetworkConstruct{
		Construct: construct,
		Vpc:       vpc,
	}
}
