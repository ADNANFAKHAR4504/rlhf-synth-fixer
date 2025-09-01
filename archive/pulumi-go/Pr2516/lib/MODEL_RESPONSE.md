```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/wafv2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get current AWS account and region info
		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}

		region := "us-west-2"

		// =====================================================
		// KMS Key for Encryption
		// =====================================================
		kmsKey, err := kms.NewKey(ctx, "webapp-kms-key", &kms.KeyArgs{
			Description: pulumi.String("KMS key for web application encryption"),
			KeyUsage:    pulumi.String("ENCRYPT_DECRYPT"),
			KeySpec:     pulumi.String("SYMMETRIC_DEFAULT"),
			Policy: pulumi.String(fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Enable IAM User Permissions",
						"Effect": "Allow",
						"Principal": {
							"AWS": "arn:aws:iam::%s:root"
						},
						"Action": "kms:*",
						"Resource": "*"
					}
				]
			}`, current.AccountId)),
		})
		if err != nil {
			return err
		}

		kmsAlias, err := kms.NewAlias(ctx, "webapp-kms-alias", &kms.AliasArgs{
			Name:         pulumi.String("alias/webapp-encryption"),
			TargetKeyId:  kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// =====================================================
		// VPC and Network Foundation
		// =====================================================
		vpc, err := ec2.NewVpc(ctx, "webapp-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("webapp-vpc"),
				"Environment": pulumi.String("production"),
			},
		})
		if err != nil {
			return err
		}

		// Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "webapp-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("webapp-igw"),
			},
		})
		if err != nil {
			return err
		}

		// Get availability zones
		azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		}, nil)
		if err != nil {
			return err
		}

		// Public Subnets (2 AZs)
		var publicSubnets []*ec2.Subnet
		var privateSubnets []*ec2.Subnet

		for i := 0; i < 2; i++ {
			// Public Subnet
			publicSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
				AvailabilityZone:    pulumi.String(azs.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("public-subnet-%d", i+1)),
					"Type": pulumi.String("public"),
				},
			})
			if err != nil {
				return err
			}
			publicSubnets = append(publicSubnets, publicSubnet)

			// Private Subnet
			privateSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
				AvailabilityZone: pulumi.String(azs.Names[i]),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("private-subnet-%d", i+1)),
					"Type": pulumi.String("private"),
				},
			})
			if err != nil {
				return err
			}
			privateSubnets = append(privateSubnets, privateSubnet)
		}

		// NAT Gateways for private subnet internet access
		var natGateways []*ec2.NatGateway
		for i, publicSubnet := range publicSubnets {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%d", i+1), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("nat-eip-%d", i+1)),
				},
			})
			if err != nil {
				return err
			}

			natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%d", i+1), &ec2.NatGatewayArgs{
				AllocationId: eip.ID(),
				SubnetId:     publicSubnet.ID(),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("nat-gateway-%d", i+1)),
				},
			})
			if err != nil {
				return err
			}
			natGateways = append(natGateways, natGw)
		}

		// Route Tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public-route-table", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("public-route-table"),
			},
		})
		if err != nil {
			return err
		}

		// Public route to internet gateway
		_, err = ec2.NewRoute(ctx, "public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Private route tables (one per AZ for HA)
		for i, privateSubnet := range privateSubnets {
			privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-route-table-%d", i+1), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("private-route-table-%d", i+1)),
				},
			})
			if err != nil {
				return err
			}

			// Route to NAT Gateway
			_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-%d", i+1), &ec2.RouteArgs{
				RouteTableId:         privateRouteTable.ID(),
				DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
				NatGatewayId:         natGateways[i].ID(),
			})
			if err != nil {
				return err
			}

			// Associate private subnet
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnet.ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// =====================================================
		// Security Groups
		// =====================================================

		// ALB Security Group
		albSecurityGroup, err := ec2.NewSecurityGroup(ctx, "alb-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("alb-security-group"),
			Description: pulumi.String("Security group for Application Load Balancer"),
			VpcId:       vpc.ID(),
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
			Tags: pulumi.StringMap{
				"Name": pulumi.String("alb-security-group"),
			},
		})
		if err != nil {
			return err
		}

		// Bastion Host Security Group
		bastionSecurityGroup, err := ec2.NewSecurityGroup(ctx, "bastion-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("bastion-security-group"),
			Description: pulumi.String("Security group for Bastion Host"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // Restrict this to your IP in production
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
			Tags: pulumi.StringMap{
				"Name": pulumi.String("bastion-security-group"),
			},
		})
		if err != nil {
			return err
		}

		// Application Server Security Group
		appSecurityGroup, err := ec2.NewSecurityGroup(ctx, "app-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("app-security-group"),
			Description: pulumi.String("Security group for Application Servers"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(80),
					ToPort:         pulumi.Int(80),
					SecurityGroups: pulumi.StringArray{albSecurityGroup.ID()},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(22),
					ToPort:         pulumi.Int(22),
					SecurityGroups: pulumi.StringArray{bastionSecurityGroup.ID()},
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
			Tags: pulumi.StringMap{
				"Name": pulumi.String("app-security-group"),
			},
		})
		if err != nil {
			return err
		}

		// Database Security Group
		dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("db-security-group"),
			Description: pulumi.String("Security group for RDS Database"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(3306),
					ToPort:         pulumi.Int(3306),
					SecurityGroups: pulumi.StringArray{appSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("db-security-group"),
			},
		})
		if err != nil {
			return err
		}

		// =====================================================
		// IAM Roles and Policies
		// =====================================================

		// EC2 Instance Role for Application Servers
		ec2Role, err := iam.NewRole(ctx, "ec2-app-role", &iam.RoleArgs{
			Name: pulumi.String("ec2-app-role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		// Attach CloudWatch agent policy
		_, err = iam.NewRolePolicyAttachment(ctx, "ec2-cloudwatch-policy", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"),
		})
		if err != nil {
			return err
		}

		// Custom policy for minimal required permissions
		ec2Policy, err := iam.NewRolePolicy(ctx, "ec2-app-policy", &iam.RolePolicyArgs{
			Name: pulumi.String("ec2-app-policy"),
			Role: ec2Role.ID(),
			Policy: kmsKey.Arn.ApplyT(func(kmsArn string) (string, error) {
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"logs:CreateLogGroup",
								"logs:CreateLogStream",
								"logs:PutLogEvents",
								"logs:DescribeLogStreams"
							],
							"Resource": "arn:aws:logs:%s:%s:*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:GenerateDataKey"
							],
							"Resource": "%s"
						}
					]
				}`, region, current.AccountId, kmsArn), nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Instance Profile
		instanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-app-profile", &iam.InstanceProfileArgs{
			Name: pulumi.String("ec2-app-profile"),
			Role: ec2Role.Name,
		})
		if err != nil {
			return err
		}

		// =====================================================
		// RDS Database (MySQL)
		// =====================================================

		// DB Subnet Group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "db-subnet-group", &rds.SubnetGroupArgs{
			Name:       pulumi.String("webapp-db-subnet-group"),
			SubnetIds:  pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("webapp-db-subnet-group"),
			},
		})
		if err != nil {
			return err
		}

		// RDS Parameter Group
		dbParameterGroup, err := rds.NewParameterGroup(ctx, "db-parameter-group", &rds.ParameterGroupArgs{
			Name:   pulumi.String("webapp-mysql-params"),
			Family: pulumi.String("mysql8.0"),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("innodb_buffer_pool_size"),
					Value: pulumi.String("{DBInstanceClassMemory*3/4}"),
				},
			},
		})
		if err != nil {
			return err
		}

		// RDS Instance
		dbInstance, err := rds.NewInstance(ctx, "webapp-db", &rds.InstanceArgs{
			Identifier:     pulumi.String("webapp-mysql-db"),
			Engine:         pulumi.String("mysql"),
			EngineVersion:  pulumi.String("8.0"),
			InstanceClass:  pulumi.String("db.t3.micro"),
			AllocatedStorage: pulumi.Int(20),
			StorageType:    pulumi.String("gp2"),
			StorageEncrypted: pulumi.Bool(true),
			KmsKeyId:       kmsKey.Arn,
			
			DbName:   pulumi.String("webapp"),
			Username: pulumi.String("admin"),
			Password: pulumi.String("SecurePassword123!"), // Use AWS Secrets Manager in production
			
			VpcSecurityGroupIds: pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:   dbSubnetGroup.Name,
			ParameterGroupName:  dbParameterGroup.Name,
			
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:         pulumi.String("03:00-04:00"),
			MaintenanceWindow:    pulumi.String("sun:04:00-sun:05:00"),
			
			MultiAz:               pulumi.Bool(true), // High Availability
			PubliclyAccessible:    pulumi.Bool(false),
			AutoMinorVersionUpgrade: pulumi.Bool(true),
			
			DeletionProtection: pulumi.Bool(true),
			SkipFinalSnapshot: pulumi.Bool(false),
			FinalSnapshotIdentifier: pulumi.String("webapp-db-final-snapshot"),
			
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("webapp-mysql-db"),
				"Environment": pulumi.String("production"),
			},
		})
		if err != nil {
			return err
		}

		// =====================================================
		// Application Load Balancer
		// =====================================================

		alb, err := elbv2.NewLoadBalancer(ctx, "webapp-alb", &elbv2.LoadBalancerArgs{
			Name:           pulumi.String("webapp-alb"),
			LoadBalancerType: pulumi.String("application"),
			Subnets:        pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
			SecurityGroups: pulumi.StringArray{albSecurityGroup.ID()},
			EnableDeletionProtection: pulumi.Bool(false), // Set to true in production
			Tags: pulumi.StringMap{
				"Name": pulumi.String("webapp-alb"),
			},
		})
		if err != nil {
			return err
		}

		// Target Group
		targetGroup, err := elbv2.NewTargetGroup(ctx, "webapp-tg", &elbv2.TargetGroupArgs{
			Name:     pulumi.String("webapp-tg"),
			Port:     pulumi.Int(80),
			Protocol: pulumi.String("HTTP"),
			VpcId:    vpc.ID(),
			HealthCheck: &elbv2.TargetGroupHealthCheckArgs{
				Enabled:            pulumi.Bool(true),
				HealthyThreshold:   pulumi.Int(2),
				UnhealthyThreshold: pulumi.Int(2),
				Timeout:            pulumi.Int(5),
				Interval:           pulumi.Int(30),
				Path:               pulumi.String("/health"),
				Matcher:            pulumi.String("200"),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("webapp-target-group"),
			},
		})
		if err != nil {
			return err
		}

		// ALB Listener
		_, err = elbv2.NewListener(ctx, "webapp-listener", &elbv2.ListenerArgs{
			LoadBalancerArn: alb.Arn,
			Port:            pulumi.String("80"),
			Protocol:        pulumi.String("HTTP"),
			DefaultActions: elbv2.ListenerDefaultActionArray{
				&elbv2.ListenerDefaultActionArgs{
					Type:           pulumi.String("forward"),
					TargetGroupArn: targetGroup.Arn,
				},
			},
		})
		if err != nil {
			return err
		}

		// =====================================================
		// WAF v2 for ALB Protection
		// =====================================================

		// WAF Web ACL
		webAcl, err := wafv2.NewWebAcl(ctx, "webapp-waf", &wafv2.WebAclArgs{
			Name:  pulumi.String("webapp-waf"),
			Scope: pulumi.String("REGIONAL"),
			DefaultAction: &wafv2.WebAclDefaultActionArgs{
				Allow: &wafv2.WebAclDefaultActionAllowArgs{},
			},
			Rules: wafv2.WebAclRuleArray{
				// AWS Managed Rule - Common Rule Set
				&wafv2.WebAclRuleArgs{
					Name:     pulumi.String("AWSManagedRulesCommonRuleSet"),
					Priority: pulumi.Int(1),
					OverrideAction: &wafv2.WebAclRuleOverrideActionArgs{
						None: &wafv2.WebAclRuleOverrideActionNoneArgs{},
					},
					Statement: &wafv2.WebAclRuleStatementArgs{
						ManagedRuleGroupStatement: &wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs{
							Name:        pulumi.String("AWSManagedRulesCommonRuleSet"),
							VendorName:  pulumi.String("AWS"),
						},
					},
					VisibilityConfig: &wafv2.WebAclRuleVisibilityConfigArgs{
						CloudwatchMetricsEnabled: pulumi.Bool(true),
						MetricName:              pulumi.String("CommonRuleSetMetric"),
						SampledRequestsEnabled:   pulumi.Bool(true),
					},
				},
				// AWS Managed Rule - Known Bad Inputs
				&wafv2.WebAclRuleArgs{
					Name:     pulumi.String("AWSManagedRulesKnownBadInputsRuleSet"),
					Priority: pulumi.Int(2),
					OverrideAction: &wafv2.WebAclRuleOverrideActionArgs{
						None: &wafv2.WebAclRuleOverrideActionNoneArgs{},
					},
					Statement: &wafv2.WebAclRuleStatementArgs{
						ManagedRuleGroupStatement: &wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs{
							Name:       pulumi.String("AWSManagedRulesKnownBadInputsRuleSet"),
							VendorName: pulumi.String("AWS"),
						},
					},
					VisibilityConfig: &wafv2.WebAclRuleVisibilityConfigArgs{
						CloudwatchMetricsEnabled: pulumi.Bool(true),
						MetricName:              pulumi.String("KnownBadInputsRuleSetMetric"),
						SampledRequestsEnabled:   pulumi.Bool(true),
					},
				},
			},
			VisibilityConfig: &wafv2.WebAclVisibilityConfigArgs{
				CloudwatchMetricsEnabled: pulumi.Bool(true),
				MetricName:              pulumi.String("webappWAF"),
				SampledRequestsEnabled:   pulumi.Bool(true),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("webapp-waf"),
			},
		})
		if err != nil {
			return err
		}

		// Associate WAF with ALB
		_, err = wafv2.NewWebAclAssociation(ctx, "webapp-waf-association", &wafv2.WebAclAssociationArgs{
			ResourceArn: alb.Arn,
			WebAclArn:   webAcl.Arn,
		})
		if err != nil {
			return err
		}

		// =====================================================
		// EC2 Instances
		// =====================================================

		// Get latest Amazon Linux 2 AMI
		ami, err := aws.LookupAmi(ctx, &aws.LookupAmiArgs{
			MostRecent: pulumi.BoolRef(true),
			Owners:     []string{"amazon"},
			Filters: []aws.GetAmiFilter{
				{
					Name:   "name",
					Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
				},
			},
		}, nil)
		if err != nil {
			return err
		}

		// User data script for application servers
		userData := `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
`

		// Launch Template for Auto Scaling
		launchTemplate, err := ec2.NewLaunchTemplate(ctx, "webapp-launch-template", &ec2.LaunchTemplateArgs{
			Name:         pulumi.String("webapp-launch-template"),
			ImageId:      pulumi.String(ami.Id),
			InstanceType: pulumi.String("t3.micro"),
			KeyName:      pulumi.String("my-key-pair"), // Replace with your key pair
			VpcSecurityGroupIds: pulumi.StringArray{appSecurityGroup.ID()},
			IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
				Name: instanceProfile.Name,
			},
			UserData: pulumi.String(userData),
			BlockDeviceMappings: ec2.LaunchTemplateBlockDeviceMappingArray{
				&ec2.LaunchTemplateBlockDeviceMappingArgs{
					DeviceName: pulumi.String("/dev/xvda"),
					Ebs: &ec2.LaunchTemplateBlockDeviceMappingEbsArgs{
						VolumeSize:  pulumi.Int(8),
						VolumeType:  pulumi.String("gp3"),
						Encrypted:   pulumi.Bool(true),
						KmsKeyId:    kmsKey.Arn,
					},
				},
			},
			TagSpecifications: ec2.LaunchTemplateTagSpecificationArray{
				&ec2.LaunchTemplateTagSpecificationArgs{
					ResourceType: pulumi.String("instance"),
					Tags: pulumi.StringMap{
						"Name": pulumi.String("webapp-app-server"),
						"Type": pulumi.String("application"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Auto Scaling Group
		_, err = ec2.NewAutoScalingGroup(ctx, "webapp-asg", &ec2.AutoScalingGroupArgs{
			Name:               pulumi.String("webapp-asg"),
			VpcZoneIdentifiers: pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			TargetGroupArns:    pulumi.StringArray{targetGroup.Arn},
			HealthCheckType:    pulumi.String("ELB"),
			HealthCheckGracePeriod: pulumi.Int(300),
			
			MinSize:         pulumi.Int(2),
			MaxSize:         pulumi.Int(6),
			Des
```