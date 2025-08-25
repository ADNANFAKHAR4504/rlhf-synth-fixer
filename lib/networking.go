package main

import (
	"fmt"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/vpc"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/vpcendpoint"
)

type NetworkingResources struct {
	VPC             vpc.Vpc
	PublicSubnets   []subnet.Subnet
	PrivateSubnets  []subnet.Subnet
	InternetGateway internetgateway.InternetGateway
	NatGateway      natgateway.NatGateway
	SecurityGroups  map[string]securitygroup.SecurityGroup
	VPCEndpoints    map[string]vpcendpoint.VpcEndpoint
}

func NewNetworkingResources(stack *TapStack) *NetworkingResources {
	resources := &NetworkingResources{
		SecurityGroups: make(map[string]securitygroup.SecurityGroup),
		VPCEndpoints:   make(map[string]vpcendpoint.VpcEndpoint),
	}

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack.Stack, str("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: str("available"),
	})

	// Create VPC
	resources.VPC = vpc.NewVpc(stack.Stack, str("vpc"), &vpc.VpcConfig{
		CidrBlock:          str("10.0.0.0/16"),
		EnableDnsHostnames: boolPtr(true),
		EnableDnsSupport:   boolPtr(true),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-vpc"),
		},
	})

	// Create Internet Gateway
	resources.InternetGateway = internetgateway.NewInternetGateway(stack.Stack, str("igw"), &internetgateway.InternetGatewayConfig{
		VpcId: resources.VPC.Id(),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-igw"),
		},
	})

	// Create subnets across multiple AZs
	for i := 0; i < 2; i++ {
		// Public subnet
		publicCidr := fmt.Sprintf("10.0.%d.0/24", i*10+1)
		publicSubnet := subnet.NewSubnet(stack.Stack, str(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:               resources.VPC.Id(),
			CidrBlock:           str(publicCidr),
			AvailabilityZone:    getAvailabilityZone(azs, i),
			MapPublicIpOnLaunch: boolPtr(true),
			Tags: &map[string]*string{
				"Name": str(fmt.Sprintf("%s-public-subnet-%d", stack.Config.AppName, i)),
				"Type": str("public"),
			},
		})
		resources.PublicSubnets = append(resources.PublicSubnets, publicSubnet)

		// Private subnet
		privateCidr := fmt.Sprintf("10.0.%d.0/24", i*10+100)
		privateSubnet := subnet.NewSubnet(stack.Stack, str(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            resources.VPC.Id(),
			CidrBlock:        str(privateCidr),
			AvailabilityZone: getAvailabilityZone(azs, i),
			Tags: &map[string]*string{
				"Name": str(fmt.Sprintf("%s-private-subnet-%d", stack.Config.AppName, i)),
				"Type": str("private"),
			},
		})
		resources.PrivateSubnets = append(resources.PrivateSubnets, privateSubnet)
	}

	// Create Elastic IP for NAT Gateway
	natEip := eip.NewEip(stack.Stack, str("nat-eip"), &eip.EipConfig{
		Domain: str("vpc"),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-nat-eip"),
		},
	})

	// Create NAT Gateway (only one for cost optimization)
	resources.NatGateway = natgateway.NewNatGateway(stack.Stack, str("nat-gw"), &natgateway.NatGatewayConfig{
		AllocationId: natEip.Id(),
		SubnetId:     resources.PublicSubnets[0].Id(),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-nat-gw"),
		},
	})

	// Create route tables
	publicRouteTable := routetable.NewRouteTable(stack.Stack, str("public-rt"), &routetable.RouteTableConfig{
		VpcId: resources.VPC.Id(),
		Route: &[]*routetable.RouteTableRoute{{
			CidrBlock: str("0.0.0.0/0"),
			GatewayId: resources.InternetGateway.Id(),
		}},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-public-rt"),
		},
	})

	privateRouteTable := routetable.NewRouteTable(stack.Stack, str("private-rt"), &routetable.RouteTableConfig{
		VpcId: resources.VPC.Id(),
		Route: &[]*routetable.RouteTableRoute{{
			CidrBlock:    str("0.0.0.0/0"),
			NatGatewayId: resources.NatGateway.Id(),
		}},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-private-rt"),
		},
	})

	// Associate subnets with route tables
	for i, subnet := range resources.PublicSubnets {
		routetableassociation.NewRouteTableAssociation(stack.Stack, str(fmt.Sprintf("public-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRouteTable.Id(),
		})
	}

	for i, subnet := range resources.PrivateSubnets {
		routetableassociation.NewRouteTableAssociation(stack.Stack, str(fmt.Sprintf("private-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: privateRouteTable.Id(),
		})
	}

	// Create VPC endpoints for AWS services
	resources.createVPCEndpoints(stack)

	return resources
}

func getAvailabilityZone(azs dataawsavailabilityzones.DataAwsAvailabilityZones, index int) *string {
	// Use Fn.element to safely access the list element
	// For now, use hardcoded AZ names
	azName := "us-east-1a"
	if index == 1 {
		azName = "us-east-1b"
	}
	return &azName
}

func (n *NetworkingResources) createVPCEndpoints(stack *TapStack) {
	// DynamoDB endpoint
	n.VPCEndpoints["dynamodb"] = vpcendpoint.NewVpcEndpoint(stack.Stack, str("dynamodb-endpoint"), &vpcendpoint.VpcEndpointConfig{
		VpcId:       n.VPC.Id(),
		ServiceName: str("com.amazonaws." + stack.Config.Region + ".dynamodb"),
		VpcEndpointType: str("Gateway"),
		RouteTableIds: &[]*string{
			// Add route table IDs here
		},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-dynamodb-endpoint"),
		},
	})

	// S3 endpoint
	n.VPCEndpoints["s3"] = vpcendpoint.NewVpcEndpoint(stack.Stack, str("s3-endpoint"), &vpcendpoint.VpcEndpointConfig{
		VpcId:       n.VPC.Id(),
		ServiceName: str("com.amazonaws." + stack.Config.Region + ".s3"),
		VpcEndpointType: str("Gateway"),
		RouteTableIds: &[]*string{
			// Add route table IDs here
		},
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-s3-endpoint"),
		},
	})
}