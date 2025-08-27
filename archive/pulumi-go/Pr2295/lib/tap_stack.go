package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		commonTags := pulumi.StringMap{
			"Environment": pulumi.String("Development"),
			"Compliance":  pulumi.String("HIPAA"),
			"Project":     pulumi.String("SecureInfrastructure"),
		}

		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "hipaa-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags:               commonTags,
		})
		if err != nil {
			return err
		}

		igw, err := ec2.NewInternetGateway(ctx, "hipaa-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		publicSubnet, err := ec2.NewSubnet(ctx, "hipaa-public-subnet", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String("us-east-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		privateSubnetEc2, err := ec2.NewSubnet(ctx, "hipaa-private-subnet-ec2", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.2.0/24"),
			AvailabilityZone: pulumi.String("us-east-1a"),
			Tags:             commonTags,
		})
		if err != nil {
			return err
		}

		privateSubnetRds, err := ec2.NewSubnet(ctx, "hipaa-private-subnet-rds", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.3.0/24"),
			AvailabilityZone: pulumi.String("us-east-1b"),
			Tags:             commonTags,
		})
		if err != nil {
			return err
		}

		natEip, err := ec2.NewEip(ctx, "hipaa-nat-eip", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		natGateway, err := ec2.NewNatGateway(ctx, "hipaa-nat-gateway", &ec2.NatGatewayArgs{
			AllocationId: natEip.ID(),
			SubnetId:     publicSubnet.ID(),
			Tags:         commonTags,
		})
		if err != nil {
			return err
		}

		publicRouteTable, err := ec2.NewRouteTable(ctx, "hipaa-public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "hipaa-public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "hipaa-public-rta", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		privateRouteTable, err := ec2.NewRouteTable(ctx, "hipaa-private-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "hipaa-private-route", &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGateway.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "hipaa-private-rta-ec2", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnetEc2.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "hipaa-private-rta-rds", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnetRds.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		s3Bucket, err := s3.NewBucketV2(ctx, "hipaa-logging-bucket", &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("hipaa-logging-bucket-%s", current.AccountId)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketVersioningV2(ctx, "hipaa-bucket-versioning", &s3.BucketVersioningV2Args{
			Bucket: s3Bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "hipaa-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: s3Bucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketPublicAccessBlock(ctx, "hipaa-bucket-pab", &s3.BucketPublicAccessBlockArgs{
			Bucket:                s3Bucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		ec2Role, err := iam.NewRole(ctx, "hipaa-ec2-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		ec2Policy, err := iam.NewPolicy(ctx, "hipaa-ec2-policy", &iam.PolicyArgs{
			Policy: s3Bucket.Arn.ApplyT(func(arn string) string {
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": "%s/*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": "%s"
						},
						{
							"Effect": "Allow",
							"Action": [
								"logs:CreateLogGroup",
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": "arn:aws:logs:us-east-1:%s:*"
						}
					]
				}`, arn, arn, current.AccountId)
			}).(pulumi.StringOutput),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "hipaa-ec2-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: ec2Policy.Arn,
		})
		if err != nil {
			return err
		}

		ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, "hipaa-ec2-instance-profile", &iam.InstanceProfileArgs{
			Role: ec2Role.Name,
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		ec2SecurityGroup, err := ec2.NewSecurityGroup(ctx, "hipaa-ec2-sg", &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for HIPAA compliant EC2 instance"),
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		ami, err := ec2.LookupAmi(ctx, &ec2.LookupAmiArgs{
			MostRecent: pulumi.BoolRef(true),
			Owners:     []string{"amazon"},
			Filters: []ec2.GetAmiFilter{
				{
					Name:   "name",
					Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
				},
			},
		}, nil)
		if err != nil {
			return err
		}

		ec2Instance, err := ec2.NewInstance(ctx, "hipaa-ec2-instance", &ec2.InstanceArgs{
			Ami:                 pulumi.String(ami.Id),
			InstanceType:        pulumi.String("t3.micro"),
			SubnetId:            privateSubnetEc2.ID(),
			VpcSecurityGroupIds: pulumi.StringArray{ec2SecurityGroup.ID()},
			IamInstanceProfile:  ec2InstanceProfile.Name,
			UserData: pulumi.String(`#!/bin/bash
				yum update -y
				yum install -y awslogs
				systemctl start awslogsd
				systemctl enable awslogsd
			`),
			RootBlockDevice: &ec2.InstanceRootBlockDeviceArgs{
				VolumeType: pulumi.String("gp3"),
				VolumeSize: pulumi.Int(20),
				Encrypted:  pulumi.Bool(true),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "hipaa-db-subnet-group", &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{
				privateSubnetEc2.ID(),
				privateSubnetRds.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, "hipaa-rds-sg", &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for HIPAA compliant RDS instance"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(3306),
					ToPort:         pulumi.Int(3306),
					SecurityGroups: pulumi.StringArray{ec2SecurityGroup.ID()},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		rdsRole, err := iam.NewRole(ctx, "hipaa-rds-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "monitoring.rds.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "hipaa-rds-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      rdsRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"),
		})
		if err != nil {
			return err
		}

		dbParameterGroup, err := rds.NewParameterGroup(ctx, "hipaa-db-parameter-group", &rds.ParameterGroupArgs{
			Family: pulumi.String("mysql8.0"),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("innodb_file_per_table"),
					Value: pulumi.String("1"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		rdsInstance, err := rds.NewInstance(ctx, "hipaa-rds-instance", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(20),
			StorageType:           pulumi.String("gp3"),
			Engine:                pulumi.String("mysql"),
			EngineVersion:         pulumi.String("8.0"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			DbName:                pulumi.String("hipaadb"),
			Username:              pulumi.String("admin"),
			Password:              pulumi.String("SecurePassword123!"), // Use Secrets Manager for production
			VpcSecurityGroupIds:   pulumi.StringArray{rdsSecurityGroup.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			ParameterGroupName:    dbParameterGroup.Name,
			BackupRetentionPeriod: pulumi.Int(30),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			StorageEncrypted:      pulumi.Bool(true),
			MonitoringInterval:    pulumi.Int(60),
			MonitoringRoleArn:     rdsRole.Arn,
			EnabledCloudwatchLogsExports: pulumi.StringArray{
				pulumi.String("error"),
				pulumi.String("general"),
				pulumi.String("slowquery"),
			},
			DeletionProtection: pulumi.Bool(true),
			MultiAz:            pulumi.Bool(true),
			Tags:               commonTags,
		})
		if err != nil {
			return err
		}

		ctx.Export("vpcId", vpc.ID())
		ctx.Export("publicSubnetId", publicSubnet.ID())
		ctx.Export("privateSubnetEc2Id", privateSubnetEc2.ID())
		ctx.Export("privateSubnetRdsId", privateSubnetRds.ID())
		ctx.Export("ec2InstanceId", ec2Instance.ID())
		ctx.Export("ec2PrivateIp", ec2Instance.PrivateIp)
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("s3BucketName", s3Bucket.Bucket)
		ctx.Export("ec2SecurityGroupId", ec2SecurityGroup.ID())
		ctx.Export("rdsSecurityGroupId", rdsSecurityGroup.ID())

		return nil
	})
}
