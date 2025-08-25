package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get configuration
		conf := config.New(ctx, "")
		region := conf.Get("region")
		if region == "" {
			region = "us-east-1"
		}

		// Get environment suffix from environment variable
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if environmentSuffix == "" {
			environmentSuffix = "synthtrainr360"
		}

		// Set up AWS provider
		provider, err := aws.NewProvider(ctx, "aws-provider", &aws.ProviderArgs{
			Region: pulumi.String(region),
		})
		if err != nil {
			return err
		}

		// Common resource prefix with environment suffix
		prefix := fmt.Sprintf("iac-task-%s", environmentSuffix)

		// Common tags
		commonTags := pulumi.StringMap{
			"Project":     pulumi.String("trainr360"),
			"Environment": pulumi.String("dev"),
			"Prefix":      pulumi.String(prefix),
		}

		// Get availability zones
		azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("%s-vpc", prefix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-vpc", prefix)),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("%s-igw", prefix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-igw", prefix)),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-public-subnet-1", prefix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String(azs.Names[0]),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-public-subnet-1", prefix)),
				"Type":        pulumi.String("Public"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-public-subnet-2", prefix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String(azs.Names[1]),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-public-subnet-2", prefix)),
				"Type":        pulumi.String("Public"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create private subnets
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-private-subnet-1", prefix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.10.0/24"),
			AvailabilityZone: pulumi.String(azs.Names[0]),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-subnet-1", prefix)),
				"Type":        pulumi.String("Private"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-private-subnet-2", prefix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.11.0/24"),
			AvailabilityZone: pulumi.String(azs.Names[1]),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-subnet-2", prefix)),
				"Type":        pulumi.String("Private"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-public-rt", prefix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-public-rt", prefix)),
				"Type":        pulumi.String("Public"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create default route to Internet Gateway
		_, err = ec2.NewRoute(ctx, fmt.Sprintf("%s-public-route", prefix), &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-public-rta-1", prefix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-public-rta-2", prefix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create private route table
		privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-private-rt", prefix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-rt", prefix)),
				"Type":        pulumi.String("Private"),
				"Project":     commonTags["Project"],
				"Environment": commonTags["Environment"],
				"Prefix":      commonTags["Prefix"],
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Associate private subnets with private route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-private-rta-1", prefix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-private-rta-2", prefix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Export values
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("vpcCidrBlock", vpc.CidrBlock)
		ctx.Export("internetGatewayId", igw.ID())
		ctx.Export("publicSubnetIds", pulumi.StringArray{
			publicSubnet1.ID(),
			publicSubnet2.ID(),
		})
		ctx.Export("privateSubnetIds", pulumi.StringArray{
			privateSubnet1.ID(),
			privateSubnet2.ID(),
		})
		ctx.Export("publicRouteTableId", publicRouteTable.ID())
		ctx.Export("privateRouteTableId", privateRouteTable.ID())
		ctx.Export("availabilityZones", pulumi.StringArray{
			pulumi.String(azs.Names[0]),
			pulumi.String(azs.Names[1]),
		})
		ctx.Export("environmentSuffix", pulumi.String(environmentSuffix))
		ctx.Export("resourcePrefix", pulumi.String(prefix))

		return nil
	})
}
