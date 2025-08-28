package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"regexp"
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

const (
	region       = "us-east-1"
	vpcCIDR      = "10.0.0.0/16"
	az1          = "us-east-1a"
	az2          = "us-east-1b"
	publicCIDR1  = "10.0.1.0/24"
	publicCIDR2  = "10.0.2.0/24"
	privateCIDR1 = "10.0.3.0/24"
	privateCIDR2 = "10.0.4.0/24"
)

func sanitizeBucketName(name string) string {
	name = strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9\.-]`)
	name = reg.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	return name
}

// Generate RDS-compliant username
func generateDBUsername(length int) (string, error) {
	if length < 1 || length > 16 {
		return "", fmt.Errorf("username length must be between 1 and 16")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	allowed := letters + digits + "_"

	result := make([]byte, length)

	// First character must be a letter
	num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
	if err != nil {
		return "", err
	}
	result[0] = letters[num.Int64()]

	// Remaining characters can be letters, digits, underscore
	for i := 1; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

// Generate RDS-compliant password
func generateDBPassword(length int) (string, error) {
	if length < 8 || length > 41 {
		return "", fmt.Errorf("password length must be between 8 and 41")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	// ✅ safe specials (removed /, @, ", space)
	specials := "!#$%^&*()-_=+[]{}:;,.?"
	allowed := letters + digits + specials

	result := make([]byte, length)

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		projectName := ctx.Project()
		stackName := ctx.Stack()

		dbUsername, err := generateDBUsername(12) // max 16
		if err != nil {
			return fmt.Errorf("failed to generate DB username: %w", err)
		}

		dbPassword, err := generateDBPassword(20) // between 8 and 41
		if err != nil {
			return fmt.Errorf("failed to generate DB password: %w", err)
		}

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

		publicSubnet1, err := ec2.NewSubnet(ctx, "public-subnet-1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(publicCIDR1),
			AvailabilityZone:    pulumi.String(az1),
			MapPublicIpOnLaunch: pulumi.Bool(true),
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
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(publicCIDR2),
			AvailabilityZone:    pulumi.String(az2),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

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

		dbSubnetGroupName := sanitizeBucketName(fmt.Sprintf("%s-%s-db-subnet-group", projectName, stackName))
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "db-subnet-group", &rds.SubnetGroupArgs{
			Name:      pulumi.String(dbSubnetGroupName),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(dbSubnetGroupName),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		rdsInstance, err := rds.NewInstance(ctx, "hippa-db-new-pro", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(20),
			StorageType:           pulumi.String("gp2"),
			Engine:                pulumi.String("mysql"),
			EngineVersion:         pulumi.String("8.0"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			DbName:                pulumi.String("hipaadb"),
			Username:              pulumi.String(dbUsername),
			Password:              pulumi.String(dbPassword),
			VpcSecurityGroupIds:   pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			MultiAz:               pulumi.Bool(true),
			StorageEncrypted:      pulumi.Bool(true),
			BackupRetentionPeriod: pulumi.Int(30),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			DeletionProtection:    pulumi.Bool(false),
			SkipFinalSnapshot:     pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-rds", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

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

		bucketName := sanitizeBucketName(fmt.Sprintf("%s-%s-hipaa-bucket", projectName, stackName))
		s3Bucket, err := s3.NewBucketV2(ctx, "hipaa-bucket", &s3.BucketV2Args{
			Bucket: pulumi.String(bucketName),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(bucketName),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketVersioningV2(ctx, "bucket-versioning", &s3.BucketVersioningV2Args{
			Bucket: s3Bucket.Bucket,
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: s3Bucket.Bucket,
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
		// IAM Policy with correct S3 permissions
		ec2Policy, err := iam.NewPolicy(ctx, "ec2-policy", &iam.PolicyArgs{
			Description: pulumi.String("Least privilege policy for EC2 instances"),
			Policy: pulumi.All(s3Bucket.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
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
					"Action": "s3:ListBucket",
					"Resource": "%s"
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
		}`, bucketArn, bucketArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "ec2-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: ec2Policy.Arn,
		})
		if err != nil {
			return err
		}

		instanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-instance-profile", &iam.InstanceProfileArgs{
			Role: ec2Role.Name,
		})
		if err != nil {
			return err
		}

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

		rawUserData := `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
`
		encodedUserData := base64.StdEncoding.EncodeToString([]byte(rawUserData))

		launchTemplate, err := ec2.NewLaunchTemplate(ctx, "web-launch-template", &ec2.LaunchTemplateArgs{
			Name:         pulumi.String(fmt.Sprintf("%s-%s-web-lt", projectName, stackName)),
			ImageId:      pulumi.String(amiResult.Id),
			InstanceType: pulumi.String("t3.micro"),
			VpcSecurityGroupIds: pulumi.StringArray{
				webSecurityGroup.ID(),
			},
			IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
				Name: instanceProfile.Name,
			},
			UserData: pulumi.String(encodedUserData), // ✅ FIX: Base64-encoded
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
		asg, err := autoscaling.NewGroup(ctx, "web-asg", &autoscaling.GroupArgs{
			VpcZoneIdentifiers: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
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
