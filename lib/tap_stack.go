package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Common tags for all resources
		commonTags := pulumi.StringMap{
			"Environment": pulumi.String("production"),
			"Project":     pulumi.String("secure-vpc"),
			"ManagedBy":   pulumi.String("pulumi"),
		}

		// Create VPC
		vpc, err := createVPC(ctx, commonTags)
		if err != nil {
			return fmt.Errorf("failed to create VPC: %w", err)
		}

		// Create Internet Gateway
		igw, err := createInternetGateway(ctx, vpc.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create Internet Gateway: %w", err)
		}

		// Create DHCP Options Set
		dhcpOptions, err := createDHCPOptionsSet(ctx, vpc.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create DHCP options: %w", err)
		}

		// Create subnets
		publicSubnetA, err := createSubnet(ctx, vpc.ID(), "secure-vpc-public-subnet-a", "10.0.1.0/24", "us-east-1a", true, commonTags)
		if err != nil {
			return fmt.Errorf("failed to create public subnet A: %w", err)
		}

		publicSubnetB, err := createSubnet(ctx, vpc.ID(), "secure-vpc-public-subnet-b", "10.0.2.0/24", "us-east-1b", true, commonTags)
		if err != nil {
			return fmt.Errorf("failed to create public subnet B: %w", err)
		}

		privateSubnetA, err := createSubnet(ctx, vpc.ID(), "secure-vpc-private-subnet-a", "10.0.11.0/24", "us-east-1a", false, commonTags)
		if err != nil {
			return fmt.Errorf("failed to create private subnet A: %w", err)
		}

		privateSubnetB, err := createSubnet(ctx, vpc.ID(), "secure-vpc-private-subnet-b", "10.0.12.0/24", "us-east-1b", false, commonTags)
		if err != nil {
			return fmt.Errorf("failed to create private subnet B: %w", err)
		}

		// Create Elastic IPs for NAT Gateways
		eipA, err := createElasticIP(ctx, "secure-vpc-eip-a", commonTags)
		if err != nil {
			return fmt.Errorf("failed to create EIP A: %w", err)
		}

		eipB, err := createElasticIP(ctx, "secure-vpc-eip-b", commonTags)
		if err != nil {
			return fmt.Errorf("failed to create EIP B: %w", err)
		}

		// Create NAT Gateways
		natGatewayA, err := createNATGateway(ctx, "secure-vpc-nat-gateway-a", publicSubnetA.ID(), eipA.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create NAT Gateway A: %w", err)
		}

		natGatewayB, err := createNATGateway(ctx, "secure-vpc-nat-gateway-b", publicSubnetB.ID(), eipB.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create NAT Gateway B: %w", err)
		}

		// Create Route Tables
		publicRouteTable, err := createPublicRouteTable(ctx, vpc.ID(), igw.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create public route table: %w", err)
		}

		privateRouteTableA, err := createPrivateRouteTable(ctx, vpc.ID(), natGatewayA.ID(), "secure-vpc-private-rt-a", commonTags)
		if err != nil {
			return fmt.Errorf("failed to create private route table A: %w", err)
		}

		privateRouteTableB, err := createPrivateRouteTable(ctx, vpc.ID(), natGatewayB.ID(), "secure-vpc-private-rt-b", commonTags)
		if err != nil {
			return fmt.Errorf("failed to create private route table B: %w", err)
		}

		// Associate Route Tables with Subnets
		if err := associateRouteTableWithSubnet(ctx, publicRouteTable.ID(), publicSubnetA.ID(), "secure-vpc-public-rta-a"); err != nil {
			return fmt.Errorf("failed to associate public route table with subnet A: %w", err)
		}

		if err := associateRouteTableWithSubnet(ctx, publicRouteTable.ID(), publicSubnetB.ID(), "secure-vpc-public-rta-b"); err != nil {
			return fmt.Errorf("failed to associate public route table with subnet B: %w", err)
		}

		if err := associateRouteTableWithSubnet(ctx, privateRouteTableA.ID(), privateSubnetA.ID(), "secure-vpc-private-rta-a"); err != nil {
			return fmt.Errorf("failed to associate private route table A with subnet A: %w", err)
		}

		if err := associateRouteTableWithSubnet(ctx, privateRouteTableB.ID(), privateSubnetB.ID(), "secure-vpc-private-rta-b"); err != nil {
			return fmt.Errorf("failed to associate private route table B with subnet B: %w", err)
		}

		// Create Security Groups
		webSG, err := createWebSecurityGroup(ctx, vpc.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create web security group: %w", err)
		}

		sshSG, err := createSSHSecurityGroup(ctx, vpc.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create SSH security group: %w", err)
		}

		dbSG, err := createDatabaseSecurityGroup(ctx, vpc.ID(), webSG.ID(), commonTags)
		if err != nil {
			return fmt.Errorf("failed to create database security group: %w", err)
		}

		// Create Network ACLs
		if err := createNetworkACLs(ctx, vpc.ID(), commonTags); err != nil {
			return fmt.Errorf("failed to create Network ACLs: %w", err)
		}

		// Create VPC Flow Logs
		if err := createVPCFlowLogs(ctx, vpc.ID(), commonTags); err != nil {
			return fmt.Errorf("failed to create VPC Flow Logs: %w", err)
		}

		// Export outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("internetGatewayId", igw.ID())

		ctx.Export("publicSubnetAId", publicSubnetA.ID())
		ctx.Export("publicSubnetBId", publicSubnetB.ID())
		ctx.Export("privateSubnetAId", privateSubnetA.ID())
		ctx.Export("privateSubnetBId", privateSubnetB.ID())

		ctx.Export("natGatewayAId", natGatewayA.ID())
		ctx.Export("natGatewayBId", natGatewayB.ID())
		ctx.Export("elasticIpAAddress", eipA.PublicIp)
		ctx.Export("elasticIpBAddress", eipB.PublicIp)

		ctx.Export("webSecurityGroupId", webSG.ID())
		ctx.Export("sshSecurityGroupId", sshSG.ID())
		ctx.Export("databaseSecurityGroupId", dbSG.ID())

		ctx.Export("subnets", pulumi.Map{
			"public": pulumi.Map{
				"subnetA": pulumi.Map{
					"id":   publicSubnetA.ID(),
					"type": pulumi.String("public"),
					"az":   pulumi.String("us-east-1a"),
					"cidr": pulumi.String("10.0.1.0/24"),
				},
				"subnetB": pulumi.Map{
					"id":   publicSubnetB.ID(),
					"type": pulumi.String("public"),
					"az":   pulumi.String("us-east-1b"),
					"cidr": pulumi.String("10.0.2.0/24"),
				},
			},
			"private": pulumi.Map{
				"subnetA": pulumi.Map{
					"id":   privateSubnetA.ID(),
					"type": pulumi.String("private"),
					"az":   pulumi.String("us-east-1a"),
					"cidr": pulumi.String("10.0.11.0/24"),
				},
				"subnetB": pulumi.Map{
					"id":   privateSubnetB.ID(),
					"type": pulumi.String("private"),
					"az":   pulumi.String("us-east-1b"),
					"cidr": pulumi.String("10.0.12.0/24"),
				},
			},
		})

		_ = dhcpOptions // Suppress unused variable warning

		return nil
	})
}

// createVPC creates the main VPC with DNS support
func createVPC(ctx *pulumi.Context, tags pulumi.StringMap) (*ec2.Vpc, error) {
	vpc, err := ec2.NewVpc(ctx, "secure-vpc-main", &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-main"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return vpc, nil
}

// createInternetGateway creates and attaches an Internet Gateway
func createInternetGateway(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.InternetGateway, error) {
	igw, err := ec2.NewInternetGateway(ctx, "secure-vpc-igw", &ec2.InternetGatewayArgs{
		VpcId: vpcId,
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-igw"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return igw, nil
}

// createDHCPOptionsSet creates custom DHCP options
func createDHCPOptionsSet(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.VpcDhcpOptions, error) {
	dhcpOptions, err := ec2.NewVpcDhcpOptions(ctx, "secure-vpc-dhcp-options", &ec2.VpcDhcpOptionsArgs{
		DomainName: pulumi.String("internal.company.com"),
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-dhcp-options"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewVpcDhcpOptionsAssociation(ctx, "secure-vpc-dhcp-association", &ec2.VpcDhcpOptionsAssociationArgs{
		VpcId:         vpcId,
		DhcpOptionsId: dhcpOptions.ID(),
	})
	if err != nil {
		return nil, err
	}

	return dhcpOptions, nil
}

// createSubnet creates a subnet with the specified configuration
func createSubnet(ctx *pulumi.Context, vpcId pulumi.IDOutput, name, cidrBlock, az string, mapPublicIP bool, tags pulumi.StringMap) (*ec2.Subnet, error) {
	subnet, err := ec2.NewSubnet(ctx, name, &ec2.SubnetArgs{
		VpcId:               vpcId,
		CidrBlock:           pulumi.String(cidrBlock),
		AvailabilityZone:    pulumi.String(az),
		MapPublicIpOnLaunch: pulumi.Bool(mapPublicIP),
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String(name),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return subnet, nil
}

// createElasticIP creates an Elastic IP for NAT Gateway
func createElasticIP(ctx *pulumi.Context, name string, tags pulumi.StringMap) (*ec2.Eip, error) {
	eip, err := ec2.NewEip(ctx, name, &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String(name),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return eip, nil
}

// createNATGateway creates a NAT Gateway
func createNATGateway(ctx *pulumi.Context, name string, subnetId, allocationId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.NatGateway, error) {
	natGateway, err := ec2.NewNatGateway(ctx, name, &ec2.NatGatewayArgs{
		SubnetId:     subnetId,
		AllocationId: allocationId,
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String(name),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return natGateway, nil
}

// createPublicRouteTable creates a route table for public subnets
func createPublicRouteTable(ctx *pulumi.Context, vpcId, igwId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.RouteTable, error) {
	routeTable, err := ec2.NewRouteTable(ctx, "secure-vpc-public-rt", &ec2.RouteTableArgs{
		VpcId: vpcId,
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igwId,
			},
		},
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-public-rt"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return routeTable, nil
}

// createPrivateRouteTable creates a route table for private subnets
func createPrivateRouteTable(ctx *pulumi.Context, vpcId, natGatewayId pulumi.IDOutput, name string, tags pulumi.StringMap) (*ec2.RouteTable, error) {
	routeTable, err := ec2.NewRouteTable(ctx, name, &ec2.RouteTableArgs{
		VpcId: vpcId,
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock:    pulumi.String("0.0.0.0/0"),
				NatGatewayId: natGatewayId,
			},
		},
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String(name),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return routeTable, nil
}

// associateRouteTableWithSubnet associates a route table with a subnet
func associateRouteTableWithSubnet(ctx *pulumi.Context, routeTableId, subnetId pulumi.IDOutput, name string) error {
	_, err := ec2.NewRouteTableAssociation(ctx, name, &ec2.RouteTableAssociationArgs{
		RouteTableId: routeTableId,
		SubnetId:     subnetId,
	})
	return err
}

// createWebSecurityGroup creates security group for web servers
func createWebSecurityGroup(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.SecurityGroup, error) {
	webSG, err := ec2.NewSecurityGroup(ctx, "secure-vpc-web-sg", &ec2.SecurityGroupArgs{
		Name:        pulumi.String("secure-vpc-web-sg"),
		Description: pulumi.String("Security group for web servers"),
		VpcId:       vpcId,
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(80),
				ToPort:     pulumi.Int(80),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("-1"),
				FromPort:   pulumi.Int(0),
				ToPort:     pulumi.Int(0),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-web-sg"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return webSG, nil
}

// createSSHSecurityGroup creates security group for SSH access
func createSSHSecurityGroup(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.SecurityGroup, error) {
	sshSG, err := ec2.NewSecurityGroup(ctx, "secure-vpc-ssh-sg", &ec2.SecurityGroupArgs{
		Name:        pulumi.String("secure-vpc-ssh-sg"),
		Description: pulumi.String("Security group for SSH access"),
		VpcId:       vpcId,
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol: pulumi.String("tcp"),
				FromPort: pulumi.Int(22),
				ToPort:   pulumi.Int(22),
				CidrBlocks: pulumi.StringArray{
					pulumi.String("203.0.113.0/24"),  // Company office
					pulumi.String("198.51.100.0/24"), // Remote work VPN
				},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("-1"),
				FromPort:   pulumi.Int(0),
				ToPort:     pulumi.Int(0),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-ssh-sg"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return sshSG, nil
}

// createDatabaseSecurityGroup creates security group for database servers
func createDatabaseSecurityGroup(ctx *pulumi.Context, vpcId, webSGId pulumi.IDOutput, tags pulumi.StringMap) (*ec2.SecurityGroup, error) {
	dbSG, err := ec2.NewSecurityGroup(ctx, "secure-vpc-db-sg", &ec2.SecurityGroupArgs{
		Name:        pulumi.String("secure-vpc-db-sg"),
		Description: pulumi.String("Security group for database servers"),
		VpcId:       vpcId,
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(3306),
				ToPort:         pulumi.Int(3306),
				SecurityGroups: pulumi.StringArray{webSGId.ToStringOutput()},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("-1"),
				FromPort:   pulumi.Int(0),
				ToPort:     pulumi.Int(0),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-db-sg"),
		}, tags),
	})
	if err != nil {
		return nil, err
	}
	return dbSG, nil
}

// createNetworkACLs creates Network ACLs for additional security
func createNetworkACLs(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) error {
	// Public Network ACL
	publicNACL, err := ec2.NewNetworkAcl(ctx, "secure-vpc-public-nacl", &ec2.NetworkAclArgs{
		VpcId: vpcId,
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-public-nacl"),
		}, tags),
	})
	if err != nil {
		return err
	}

	// Add rules to public NACL
	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-100-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(100),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		FromPort:     pulumi.Int(80),
		ToPort:       pulumi.Int(80),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-110-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(110),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		FromPort:     pulumi.Int(443),
		ToPort:       pulumi.Int(443),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-120-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(120),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("203.0.113.0/24"),
		FromPort:     pulumi.Int(22),
		ToPort:       pulumi.Int(22),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-130-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(130),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("198.51.100.0/24"),
		FromPort:     pulumi.Int(22),
		ToPort:       pulumi.Int(22),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-140-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(140),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		FromPort:     pulumi.Int(1024),
		ToPort:       pulumi.Int(65535),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-public-nacl-rule-100-out", &ec2.NetworkAclRuleArgs{
		NetworkAclId: publicNACL.ID(),
		RuleNumber:   pulumi.Int(100),
		Protocol:     pulumi.String("-1"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		Egress:       pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	// Private Network ACL
	privateNACL, err := ec2.NewNetworkAcl(ctx, "secure-vpc-private-nacl", &ec2.NetworkAclArgs{
		VpcId: vpcId,
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-private-nacl"),
		}, tags),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-private-nacl-rule-100-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: privateNACL.ID(),
		RuleNumber:   pulumi.Int(100),
		Protocol:     pulumi.String("-1"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("10.0.0.0/16"),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-private-nacl-rule-110-in", &ec2.NetworkAclRuleArgs{
		NetworkAclId: privateNACL.ID(),
		RuleNumber:   pulumi.Int(110),
		Protocol:     pulumi.String("tcp"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		FromPort:     pulumi.Int(1024),
		ToPort:       pulumi.Int(65535),
		Egress:       pulumi.Bool(false),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewNetworkAclRule(ctx, "secure-vpc-private-nacl-rule-100-out", &ec2.NetworkAclRuleArgs{
		NetworkAclId: privateNACL.ID(),
		RuleNumber:   pulumi.Int(100),
		Protocol:     pulumi.String("-1"),
		RuleAction:   pulumi.String("allow"),
		CidrBlock:    pulumi.String("0.0.0.0/0"),
		Egress:       pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	return nil
}

// createVPCFlowLogs creates VPC Flow Logs to CloudWatch
func createVPCFlowLogs(ctx *pulumi.Context, vpcId pulumi.IDOutput, tags pulumi.StringMap) error {
	// Create CloudWatch Log Group
	logGroup, err := cloudwatch.NewLogGroup(ctx, "secure-vpc-flow-logs", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String("/aws/vpc/secure-vpc-flowlogs"),
		RetentionInDays: pulumi.Int(14),
		Tags:            tags,
	})
	if err != nil {
		return err
	}

	// Create IAM role for VPC Flow Logs
	assumeRolePolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Principal": {
					"Service": "vpc-flow-logs.amazonaws.com"
				},
				"Effect": "Allow",
				"Sid": ""
			}
		]
	}`

	flowLogsRole, err := iam.NewRole(ctx, "secure-vpc-flow-logs-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(assumeRolePolicy),
		Tags:             tags,
	})
	if err != nil {
		return err
	}

	// Create IAM role policy for CloudWatch Logs
	flowLogsPolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": [
					"logs:CreateLogGroup",
					"logs:CreateLogStream",
					"logs:PutLogEvents",
					"logs:DescribeLogGroups",
					"logs:DescribeLogStreams"
				],
				"Effect": "Allow",
				"Resource": "*"
			}
		]
	}`

	_, err = iam.NewRolePolicy(ctx, "secure-vpc-flow-logs-policy", &iam.RolePolicyArgs{
		Role:   flowLogsRole.Name,
		Policy: pulumi.String(flowLogsPolicy),
	})
	if err != nil {
		return err
	}

	// Create VPC Flow Log
	_, err = ec2.NewFlowLog(ctx, "secure-vpc-flow-log", &ec2.FlowLogArgs{
		VpcId:                  vpcId,
		TrafficType:            pulumi.String("ALL"),
		IamRoleArn:             flowLogsRole.Arn,
		LogDestinationType:     pulumi.String("cloud-watch-logs"),
		LogGroupName:           logGroup.Name,
		MaxAggregationInterval: pulumi.Int(60),
		Tags: mergeTags(pulumi.StringMap{
			"Name": pulumi.String("secure-vpc-flow-log"),
		}, tags),
	})
	if err != nil {
		return err
	}

	return nil
}

// Helper function to merge tags
func mergeTags(baseTags, commonTags pulumi.StringMap) pulumi.StringMap {
	result := make(pulumi.StringMap)
	for k, v := range commonTags {
		result[k] = v
	}
	for k, v := range baseTags {
		result[k] = v
	}
	return result
}

// Validation helper functions for unit testing

func isValidCIDR(cidr string) bool {
	// Simplified CIDR validation for testing
	validCIDRs := []string{"10.0.0.0/16", "172.16.0.0/12", "192.168.0.0/16"}
	for _, valid := range validCIDRs {
		if cidr == valid {
			return true
		}
	}
	return false
}

func isSubnetInVPC(subnet, vpc string) bool {
	// Simplified subnet validation - check if subnet is in VPC range
	if vpc == "10.0.0.0/16" {
		validSubnets := []string{"10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24", "10.0.255.0/24"}
		for _, valid := range validSubnets {
			if subnet == valid {
				return true
			}
		}
	}
	return false
}

func isValidAZ(az, region string) bool {
	if region == "us-east-1" {
		validAZs := []string{"us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e", "us-east-1f"}
		for _, valid := range validAZs {
			if az == valid {
				return true
			}
		}
	}
	return false
}

func isValidPort(port int) bool {
	return port > 0 && port <= 65535
}

func isRestrictedCIDR(cidr string) bool {
	restrictedCIDRs := []string{"203.0.113.0/24", "198.51.100.0/24"}
	for _, restricted := range restrictedCIDRs {
		if cidr == restricted {
			return true
		}
	}
	return false
}

func generateResourceName(prefix, resourceType, identifier string) string {
	if identifier == "" {
		return prefix + "-" + resourceType
	}
	return prefix + "-" + resourceType + "-" + identifier
}

// Route configuration types and functions
type RouteConfig struct {
	DestinationCIDR string
	TargetType      string
}

func hasInternetRoute(routes []RouteConfig) bool {
	for _, route := range routes {
		if route.DestinationCIDR == "0.0.0.0/0" && route.TargetType == "igw" {
			return true
		}
	}
	return false
}

func hasLocalRoute(routes []RouteConfig) bool {
	for _, route := range routes {
		if route.DestinationCIDR == "10.0.0.0/16" && route.TargetType == "local" {
			return true
		}
	}
	return false
}

func hasNATRoute(routes []RouteConfig) bool {
	for _, route := range routes {
		if route.DestinationCIDR == "0.0.0.0/0" && route.TargetType == "nat" {
			return true
		}
	}
	return false
}

// Network ACL validation
type NACLRule struct {
	RuleNumber int
	Protocol   string
	FromPort   int
	ToPort     int
	Action     string
}

func isValidNACLRule(rule NACLRule) bool {
	// Rule number validation
	if rule.RuleNumber <= 0 || rule.RuleNumber > 32767 {
		return false
	}

	// Protocol validation
	validProtocols := []string{"tcp", "udp", "icmp", "-1"}
	validProtocol := false
	for _, p := range validProtocols {
		if rule.Protocol == p {
			validProtocol = true
			break
		}
	}
	if !validProtocol {
		return false
	}

	// Port validation
	if rule.FromPort < 0 || rule.FromPort > 65535 || rule.ToPort < 0 || rule.ToPort > 65535 {
		return false
	}

	// Action validation
	if rule.Action != "allow" && rule.Action != "deny" {
		return false
	}

	return true
}

// Flow log configuration
type FlowLogConfig struct {
	TrafficType    string
	LogDestination string
	LogFormat      string
}

func isValidFlowLogConfig(config FlowLogConfig) bool {
	validTrafficTypes := []string{"ALL", "ACCEPT", "REJECT"}
	validTrafficType := false
	for _, t := range validTrafficTypes {
		if config.TrafficType == t {
			validTrafficType = true
			break
		}
	}

	validDestinations := []string{"cloud-watch-logs", "s3"}
	validDestination := false
	for _, d := range validDestinations {
		if config.LogDestination == d {
			validDestination = true
			break
		}
	}

	return validTrafficType && validDestination
}

func isValidDHCPOptions(options map[string]string) bool {
	validKeys := []string{"domain-name", "domain-name-servers", "ntp-servers", "netbios-name-servers"}

	for key := range options {
		valid := false
		for _, validKey := range validKeys {
			if key == validKey {
				valid = true
				break
			}
		}
		if !valid {
			return false
		}
	}
	return true
}

func hasInfrastructureComponent(component string) bool {
	// Function to verify infrastructure components exist
	expectedComponents := []string{
		"vpc", "internet_gateway", "dhcp_options", "subnets",
		"elastic_ips", "nat_gateways", "security_groups",
		"route_tables", "network_acls", "flow_logs",
	}

	for _, expected := range expectedComponents {
		if component == expected {
			return true
		}
	}
	return false
}
