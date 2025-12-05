package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createVPC(ctx *pulumi.Context, environmentSuffix string) (*ec2.Vpc, error) {
	// Create VPC
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("ecs-vpc-%s", environmentSuffix), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-vpc-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("ecs-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-igw-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create public subnets in 3 AZs
	publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:               vpc.ID(),
		CidrBlock:           pulumi.String("10.0.1.0/24"),
		AvailabilityZone:    pulumi.String("us-east-1a"),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-public-subnet-1-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:               vpc.ID(),
		CidrBlock:           pulumi.String("10.0.2.0/24"),
		AvailabilityZone:    pulumi.String("us-east-1b"),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-public-subnet-2-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	publicSubnet3, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-public-subnet-3-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:               vpc.ID(),
		CidrBlock:           pulumi.String("10.0.3.0/24"),
		AvailabilityZone:    pulumi.String("us-east-1c"),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-public-subnet-3-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create private subnets in 3 AZs
	privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.11.0/24"),
		AvailabilityZone: pulumi.String("us-east-1a"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-private-subnet-1-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.12.0/24"),
		AvailabilityZone: pulumi.String("us-east-1b"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-private-subnet-2-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	privateSubnet3, err := ec2.NewSubnet(ctx, fmt.Sprintf("ecs-private-subnet-3-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.13.0/24"),
		AvailabilityZone: pulumi.String("us-east-1c"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-private-subnet-3-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create public route table
	publicRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("ecs-public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-public-rt-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Associate public subnets with route table
	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet1.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet2.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-public-rta-3-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet3.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	// Create private route table (no NAT Gateway - using VPC endpoints instead)
	privateRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("ecs-private-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-private-rt-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Associate private subnets with route table
	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-private-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet1.ID(),
		RouteTableId: privateRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-private-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet2.ID(),
		RouteTableId: privateRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("ecs-private-rta-3-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet3.ID(),
		RouteTableId: privateRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	return vpc, nil
}
