The errors are related to S3 bucket configuration resources that have different names or structures in the AWS provider version you're using. Let me fix these issues by using the correct S3 resource names and structures:

```go
package main

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

const (
	region     = "us-west-2"
	vpcCIDR    = "10.0.0.0/16"
	az1        = "us-west-2a"
	az2        = "us-west-2b"
	publicCIDR1 = "10.0.1.0/24"
	publicCIDR2 = "10.0.2.0/24"
	privateCIDR1 = "10.0.3.0/24"
	privateCIDR2 = "10.0.4.0/24"
)

// generateRandomString generates a random string of specified length
func generateRandomString(length int, includeSpecial bool) (string, error) {
	var charset string
	if includeSpecial {
		charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	} else {
		charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	}

	result := make([]byte, length)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}
	return string(result), nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get project and stack names directly from context
		projectName := ctx.Project()
		stackName := ctx.Stack()

		// Generate random credentials for RDS
		dbUsername, err := generateRandomString(8, false)
		if err != nil {
			return fmt.Errorf("failed to generate DB username: %w", err)
		}
		
		dbPassword, err := generateRandomString(16, true)
		if err != nil {
			return fmt.Errorf("failed to generate DB password: %w", err)
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "hipaa-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String(vpcCIDR),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-vpc", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "hipaa-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-igw", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create Public Subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, "public-subnet-1", &ec2.SubnetArgs{
			VpcId:                   vpc.ID(),
			CidrBlock:               pulumi.String(publicCIDR1),
			AvailabilityZone:        pulumi.String(az1),
			MapPublicIpOnLaunch:     pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-1", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, "public-subnet-2", &ec2.SubnetArgs{
			VpcId:                   vpc.ID(),
			CidrBlock:               pulumi.String(publicCIDR2),
			AvailabilityZone:        pulumi.String(az2),
			MapPublicIpOnLaunch:     pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

		// Create Private Subnets
		privateSubnet1, err := ec2.NewSubnet(ctx, "private-subnet-1", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(privateCIDR1),
			AvailabilityZone: pulumi.String(az1),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-1", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Private"),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, "private-subnet-2", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(privateCIDR2),
			AvailabilityZone: pulumi.String(az2),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Private"),
			},
		})
		if err != nil {
			return err
		}

		// Create NAT Gateway EIPs
		natEip1, err := ec2.NewEip(ctx, "nat-eip-1", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-eip-1", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		natEip2, err := ec2.NewEip(ctx, "nat-eip-2", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-eip-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create NAT Gateways
		natGw1, err := ec2.NewNatGateway(ctx, "nat-gw-1", &ec2.NatGatewayArgs{
			AllocationId: natEip1.ID(),
			SubnetId:     publicSubnet1.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-gw-1", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		natGw2, err := ec2.NewNatGateway(ctx, "nat-gw-2", &ec2.NatGatewayArgs{
			AllocationId: natEip2.ID(),
			SubnetId:     publicSubnet2.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-gw-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create Route Tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-rt", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		privateRouteTable1, err := ec2.NewRouteTable(ctx, "private-rt-1", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-rt-1", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		privateRouteTable2, err := ec2.NewRouteTable(ctx, "private-rt-2", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-rt-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create Routes
		_, err = ec2.NewRoute(ctx, "public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "private-route-1", &ec2.RouteArgs{
			RouteTableId:         privateRouteTable1.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGw1.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "private-route-2", &ec2.RouteArgs{
			RouteTableId:         privateRouteTable2.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGw2.ID(),
		})
		if err != nil {
			return err
		}

		// Associate Route Tables with Subnets
		_, err = ec2.NewRouteTableAssociation(ctx, "public-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "public-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "private-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRouteTable1.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "private-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRouteTable2.ID(),
		})
		if err != nil {
			return err
		}

		// Create Security Groups
		webSecurityGroup, err := ec2.NewSecurityGroup(ctx, "web-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-web-sg", projectName, stackName)),
			Description: pulumi.String("Security group for web servers"),
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
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String(vpcCIDR)},
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-web-sg", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, stackName)),
			Description: pulumi.String("Security group for RDS database"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(3306),
					ToPort:         pulumi.Int(3306),
					SecurityGroups: pulumi.StringArray{webSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create DB Subnet Group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "db-subnet-group", &rds.SubnetGroupArgs{
			Name:       pulumi.String(fmt.Sprintf("%s-%s-db-subnet-group", projectName, stackName)),
			SubnetIds:  pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-subnet-group", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create RDS Instance with Multi-AZ
		rdsInstance, err := rds.NewInstance(ctx, "hipaa-db", &rds.InstanceArgs{
			AllocatedStorage:     pulumi.Int(20),
			StorageType:          pulumi.String("gp2"),
			Engine:               pulumi.String("mysql"),
			EngineVersion:        pulumi.String("8.0"),
			InstanceClass:        pulumi.String("db.t3.micro"),
			DbName:               pulumi.String("hipaadb"),
			Username:             pulumi.String(dbUsername),
			Password:             pulumi.String(dbPassword),
			VpcSecurityGroupIds:  pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:    dbSubnetGroup.Name,
			MultiAz:              pulumi.Bool(true),
			StorageEncrypted:     pulumi.Bool(true),
			BackupRetentionPeriod: pulumi.Int(30),
			BackupWindow:         pulumi.String("03:00-04:00"),
			MaintenanceWindow:    pulumi.String("sun:04:00-sun:05:00"),
			DeletionProtection:   pulumi.Bool(true),
			SkipFinalSnapshot:    pulumi.Bool(false),
			FinalSnapshotIdentifier: pulumi.String(fmt.Sprintf("%s-%s-final-snapshot", projectName, stackName)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-rds", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM Role for EC2 instances
		ec2Role, err := iam.NewRole(ctx, "ec2-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						},
						"Effect": "Allow",
						"Sid": ""
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ec2-role", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Create S3 Bucket first to get its name for the policy
		s3Bucket, err := s3.NewBucket(ctx, "hipaa-bucket", &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("%s-%s-hipaa-bucket", projectName, stackName)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-hipaa-bucket", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM Policy for least privilege access
		ec2Policy, err := iam.NewPolicy(ctx, "ec2-policy", &iam.PolicyArgs{
			Description: pulumi.String("Least privilege policy for EC2 instances"),
			Policy: s3Bucket.Arn.ApplyT(func(bucketArn string) string {
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
							"Resource": "*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject"
							],
							"Resource": "%s/*"
						}
					]
				}`, bucketArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Attach policy to role
		_, err = iam.NewRolePolicyAttachment(ctx, "ec2-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: ec2Policy.Arn,
		})
		if err != nil {
			return err
		}

		// Create Instance Profile
		instanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-instance-profile", &iam.InstanceProfileArgs{
			Role: ec2Role.Name,
		})
		if err != nil {
			return err
		}

		// Get latest Amazon Linux 2 AMI
		amiResult, err := ec2.LookupAmi(ctx, &ec2.LookupAmiArgs{
			MostRecent: pulumi.BoolRef(true),
			Owners:     []string{"amazon"},
			Filters: []ec2.GetAmiFilter{
				{
					Name:   "name",
					Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
				},
			},
		})
		if err != nil {
			return err
		}

		// Create Launch Template
		launchTemplate, err := ec2.NewLaunchTemplate(ctx, "web-launch-template", &ec2.LaunchTemplateArgs{
			Name:         pulumi.String(fmt.Sprintf("%s-%s-web-lt", projectName, stackName)),
			ImageId:      pulumi.String(amiResult.Id),
			InstanceType: pulumi.String("t3.micro"),
			VpcSecurityGroupIds: pulumi.StringArray{webSecurityGroup.ID()},
			IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
				Name: instanceProfile.Name,
			},
			UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
`),
			TagSpecifications: ec2.LaunchTemplateTagSpecificationArray{
				&ec2.LaunchTemplateTagSpecificationArgs{
					ResourceType: pulumi.String("instance"),
					Tags: pulumi.StringMap{
						"Name":        pulumi.String(fmt.Sprintf("%s-%s-web-instance", projectName, stackName)),
						"Environment": pulumi.String(stackName),
						"Compliance":  pulumi.String("HIPAA"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Create Auto Scaling Group
		asg, err := autoscaling.NewGroup(ctx, "web-asg", &autoscaling.GroupArgs{
			VpcZoneIdentifiers: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			TargetGroupArns:    pulumi.StringArray{},
			HealthCheckType:    pulumi.String("EC2"),
			MinSize:            pulumi.Int(1),
			MaxSize:            pulumi.Int(3),
			DesiredCapacity:    pulumi.Int(2),
			LaunchTemplate: &autoscaling.GroupLaunchTemplateArgs{
				Id:      launchTemplate.ID(),
				Version: pulumi.String("$Latest"),
			},
			Tags: autoscaling.GroupTagArray{
				&autoscaling.GroupTagArgs{
					Key:               pulumi.String("Name"),
					Value:             pulumi.String(fmt.Sprintf("%s-%s-asg", projectName, stackName)),
					PropagateAtLaunch: pulumi.Bool(true),
				},
				&autoscaling.GroupTagArgs{
					Key:               pulumi.String("Environment"),
					Value:             pulumi.String(stackName),
					PropagateAtLaunch: pulumi.Bool(true),
				},
			},
		})
		if err != nil {
			return err
		}

		// Enable S3 bucket versioning using BucketV2 approach
		_, err = s3.NewBucketVersioningV2(ctx, "bucket-versioning", &s3.BucketVersioningV2Args{
			Bucket: s3Bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Enable S3 bucket encryption using BucketV2 approach
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: s3Bucket.ID(),
			ServerSideEncryptionConfiguration: &s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs{
				Rules: s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArray{
					&s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs{
						ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs{
							SseAlgorithm: pulumi.String("AES256"),
						},
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Block public access to S3 bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, "bucket-pab", &s3.BucketPublicAccessBlockArgs{
			Bucket:                s3Bucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Create CloudWatch Log Group
		logGroup, err := cloudwatch.NewLogGroup(ctx, "hipaa-log-group", &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/ec2/%s-%s", projectName, stackName)),
			RetentionInDays: pulumi.Int(30),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-log-group", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("vpcCidr", vpc.CidrBlock)
		ctx.Export("publicSubnet1Id", publicSubnet1.ID())
		ctx.Export("publicSubnet2Id", publicSubnet2.ID())
		ctx.Export("privateSubnet1Id", privateSubnet1.ID())
		ctx.Export("privateSubnet2Id", privateSubnet2.ID())
		ctx.Export("internetGatewayId", igw.ID())
		ctx.Export("natGateway1Id", natGw1.ID())
		ctx.Export("natGateway2Id", natGw2.ID())
		ctx.Export("webSecurityGroupId", webSecurityGroup.ID())
		ctx.Export("dbSecurityGroupId", dbSecurityGroup.ID())
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("rdsInstanceId", rdsInstance.ID())
		ctx.Export("dbUsername", pulumi.String(dbUsername))
		ctx.Export("s3BucketName", s3Bucket.ID())
		ctx.Export("s3BucketArn", s3Bucket.Arn)
		ctx.Export("iamRoleArn", ec2Role.Arn)
		ctx.Export("iamPolicyArn", ec2Policy.Arn)
		ctx.Export("launchTemplateId", launchTemplate.ID())
		ctx.Export("autoScalingGroupName", asg.Name)
		ctx.Export("cloudWatchLogGroupName", logGroup.Name)
		ctx.Export("cloudWatchLogGroupArn", logGroup.Arn)

		return nil
	})
}
```

## Key Changes Made:

1. **Fixed S3 Bucket Versioning**: Changed from `s3.NewBucketVersioning` to `s3.NewBucketVersioningV2` with correct argument structure.

2. **Fixed S3 Bucket Encryption**: Changed from `s3.NewBucketServerSideEncryptionConfiguration` to `s3.NewBucketServerSideEncryptionConfigurationV2` with correct argument structure.

3. **Updated Argument Names**: Used the correct field names and types for the V2 versions of these resources.

The main differences are:
- `BucketVersioningV2` instead of `BucketVersioning`
- `BucketServerSideEncryptionConfigurationV2` instead of `BucketServerSideEncryptionConfiguration`
- Updated argument structures to match the V2 API

This should resolve all the compilation errors you were experiencing. The infrastructure will still maintain all HIPAA compliance features including:

- Encrypted S3 bucket with versioning enabled
- Multi-AZ RDS with encryption
- Proper VPC isolation
- Security groups with least privilege access
- CloudWatch logging with 30-day retention
- IAM roles with minimal permissions
