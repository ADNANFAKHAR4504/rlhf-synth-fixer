package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// CreateInfrastructure creates the infrastructure resources
func CreateInfrastructure(ctx *pulumi.Context) error {
	return createInfrastructure(ctx)
}

func createInfrastructure(ctx *pulumi.Context) error {
	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Get current AWS caller identity and region
	current, err := aws.GetCallerIdentity(ctx, nil, nil)
	if err != nil {
		return err
	}

	regionName := os.Getenv("AWS_REGION")
	if regionName == "" {
		regionName = "us-east-1"
	}

	azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
		State: pulumi.StringRef("available"),
	}, nil)
	if err != nil {
		return err
	}

	// Common tags for all resources
	commonTags := pulumi.StringMap{
		"Environment": pulumi.String("Development"),
		"Project":     pulumi.String("CloudEnvironmentSetup"),
		"ManagedBy":   pulumi.String("Pulumi"),
		"Suffix":      pulumi.String(environmentSuffix),
	}

	// Create VPC
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("vpc-%s", environmentSuffix), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-%s", environmentSuffix)),
			"Environment": commonTags["Environment"],
			"Project":     commonTags["Project"],
			"ManagedBy":   commonTags["ManagedBy"],
			"Suffix":      commonTags["Suffix"],
		},
	})
	if err != nil {
		return err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("igw-%s", environmentSuffix)),
			"Environment": commonTags["Environment"],
			"Project":     commonTags["Project"],
			"ManagedBy":   commonTags["ManagedBy"],
			"Suffix":      commonTags["Suffix"],
		},
	})
	if err != nil {
		return err
	}

	// Validate minimum AZ requirement
	if len(azs.Names) < 2 {
		return fmt.Errorf("at least 2 availability zones required, found %d", len(azs.Names))
	}

	// Create two public subnets in different AZs
	var publicSubnets []*ec2.Subnet
	for i := 0; i < 2; i++ {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%s-%d", environmentSuffix, i+1), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone:    pulumi.String(azs.Names[i]),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("public-subnet-%s-%d", environmentSuffix, i+1)),
				"Environment": commonTags["Environment"],
				"Project":     commonTags["Project"],
				"ManagedBy":   commonTags["ManagedBy"],
				"Suffix":      commonTags["Suffix"],
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}
		publicSubnets = append(publicSubnets, subnet)
	}

	// Create route table for public subnets
	publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-route-table-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("public-route-table-%s", environmentSuffix)),
			"Environment": commonTags["Environment"],
			"Project":     commonTags["Project"],
			"ManagedBy":   commonTags["ManagedBy"],
			"Suffix":      commonTags["Suffix"],
		},
	})
	if err != nil {
		return err
	}

	// Create route to Internet Gateway
	_, err = ec2.NewRoute(ctx, fmt.Sprintf("public-route-%s", environmentSuffix), &ec2.RouteArgs{
		RouteTableId:         publicRouteTable.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		GatewayId:            igw.ID(),
	})
	if err != nil {
		return err
	}

	// Associate public subnets with route table
	for i, subnet := range publicSubnets {
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-subnet-association-%s-%d", environmentSuffix, i+1), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}
	}

	// Create security group for development environment with restricted access
	devSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("security-group-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("security-group-%s", environmentSuffix)),
		Description: pulumi.String("Security group for development environment with restricted access"),
		VpcId:       vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			// HTTP access from VPC only
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(80),
				ToPort:     pulumi.Int(80),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
			// HTTPS access from VPC only
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			// HTTPS outbound for package updates
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
			// HTTP outbound for package updates
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(80),
				ToPort:     pulumi.Int(80),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create IAM role for EC2 instances
	ec2AssumeRolePolicy := `{
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
		}`

	ec2Role, err := iam.NewRole(ctx, fmt.Sprintf("ec2-role-%s", environmentSuffix), &iam.RoleArgs{
		Name:             pulumi.String(fmt.Sprintf("EC2-Role-%s", environmentSuffix)),
		AssumeRolePolicy: pulumi.String(ec2AssumeRolePolicy),
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	// Create minimal EC2 policy with Session Manager access
	ec2PolicyDocument := `{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:*:*:*"
				}
			]
		}`

	// Attach Session Manager policy for secure SSH access
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ec2-ssm-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      ec2Role.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
	})
	if err != nil {
		return err
	}

	ec2Policy, err := iam.NewPolicy(ctx, fmt.Sprintf("ec2-minimal-policy-%s", environmentSuffix), &iam.PolicyArgs{
		Name:   pulumi.String(fmt.Sprintf("EC2-Minimal-Policy-%s", environmentSuffix)),
		Policy: pulumi.String(ec2PolicyDocument),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ec2-minimal-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      ec2Role.Name,
		PolicyArn: ec2Policy.Arn,
	})
	if err != nil {
		return err
	}

	// Create instance profile for EC2 role
	ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, fmt.Sprintf("ec2-instance-profile-%s", environmentSuffix), &iam.InstanceProfileArgs{
		Name: pulumi.String(fmt.Sprintf("EC2-InstanceProfile-%s", environmentSuffix)),
		Role: ec2Role.Name,
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create IAM role for RDS
	rdsAssumeRolePolicy := `{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "rds.amazonaws.com"
					},
					"Effect": "Allow"
				}
			]
		}`

	rdsRole, err := iam.NewRole(ctx, fmt.Sprintf("rds-role-%s", environmentSuffix), &iam.RoleArgs{
		Name:             pulumi.String(fmt.Sprintf("RDS-Role-%s", environmentSuffix)),
		AssumeRolePolicy: pulumi.String(rdsAssumeRolePolicy),
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	// Create minimal RDS policy with least privilege
	rdsMonitoringPolicyDocument := `{
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
					"Resource": "arn:aws:logs:*:*:log-group:RDS*"
				}
			]
		}`

	rdsPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("rds-minimal-policy-%s", environmentSuffix), &iam.PolicyArgs{
		Name:   pulumi.String(fmt.Sprintf("RDS-Minimal-Policy-%s", environmentSuffix)),
		Policy: pulumi.String(rdsMonitoringPolicyDocument),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("rds-minimal-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      rdsRole.Name,
		PolicyArn: rdsPolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create VPC endpoints for Session Manager (secure access without internet)
	_, err = ec2.NewVpcEndpoint(ctx, fmt.Sprintf("ssm-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:            vpc.ID(),
		ServiceName:      pulumi.String("com.amazonaws." + regionName + ".ssm"),
		VpcEndpointType:  pulumi.String("Interface"),
		SubnetIds:        pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
		SecurityGroupIds: pulumi.StringArray{devSecurityGroup.ID()},
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewVpcEndpoint(ctx, fmt.Sprintf("ssmmessages-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:            vpc.ID(),
		ServiceName:      pulumi.String("com.amazonaws." + regionName + ".ssmmessages"),
		VpcEndpointType:  pulumi.String("Interface"),
		SubnetIds:        pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
		SecurityGroupIds: pulumi.StringArray{devSecurityGroup.ID()},
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewVpcEndpoint(ctx, fmt.Sprintf("ec2messages-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:            vpc.ID(),
		ServiceName:      pulumi.String("com.amazonaws." + regionName + ".ec2messages"),
		VpcEndpointType:  pulumi.String("Interface"),
		SubnetIds:        pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
		SecurityGroupIds: pulumi.StringArray{devSecurityGroup.ID()},
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for logging with versioning enabled
	logsBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("logs-bucket-%s", environmentSuffix), &s3.BucketV2Args{
		Bucket: pulumi.String(fmt.Sprintf("logs-bucket-%s-%s", environmentSuffix, current.AccountId)),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	// Enable versioning on the S3 bucket
	_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("logs-bucket-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
		Bucket: logsBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return err
	}

	// Block public access to the S3 bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("logs-bucket-pab-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
		Bucket:                logsBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	// Create KMS key for S3 encryption
	kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("logs-bucket-key-%s", environmentSuffix), &kms.KeyArgs{
		Description: pulumi.String(fmt.Sprintf("KMS key for logs bucket encryption - %s", environmentSuffix)),
		KeyUsage:    pulumi.String("ENCRYPT_DECRYPT"),
		Tags:        commonTags,
	})
	if err != nil {
		return err
	}

	// Create KMS key alias
	_, err = kms.NewAlias(ctx, fmt.Sprintf("logs-bucket-key-alias-%s", environmentSuffix), &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/logs-bucket-%s", environmentSuffix)),
		TargetKeyId: kmsKey.KeyId,
	})
	if err != nil {
		return err
	}

	// Set bucket encryption with KMS
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("logs-bucket-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: logsBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm:   pulumi.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn,
				},
				BucketKeyEnabled: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return err
	}

	// Export key values with validation
	ctx.Export("vpcId", vpc.ID())

	// Safely export subnet IDs
	if len(publicSubnets) >= 2 {
		ctx.Export("publicSubnetIds", pulumi.All(publicSubnets[0].ID(), publicSubnets[1].ID()))
	} else {
		return fmt.Errorf("insufficient public subnets created: expected 2, got %d", len(publicSubnets))
	}

	ctx.Export("internetGatewayId", igw.ID())
	ctx.Export("securityGroupId", devSecurityGroup.ID())
	ctx.Export("ec2RoleArn", ec2Role.Arn)
	ctx.Export("ec2InstanceProfileArn", ec2InstanceProfile.Arn)
	ctx.Export("rdsRoleArn", rdsRole.Arn)
	ctx.Export("logsBucketName", logsBucket.ID())
	ctx.Export("logsBucketArn", logsBucket.Arn)

	return nil
}

func main() {
	pulumi.Run(CreateInfrastructure)
}
