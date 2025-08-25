package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func CreateInfrastructure(ctx *pulumi.Context) error {
	// Get environment suffix for unique resource naming
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr308"
	}

	// Get current AWS account ID and region
	current, err := aws.GetCallerIdentity(ctx, nil, nil)
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

	// Common tags for HIPAA compliance
	commonTags := pulumi.StringMap{
		"Project":     pulumi.String("HealthApp"),
		"Environment": pulumi.String("Production"),
		"Compliance":  pulumi.String("HIPAA"),
		"ManagedBy":   pulumi.String("pulumi"),
	}

	// Create KMS key for encryption
	kmsKey, err := kms.NewKey(ctx, "healthapp-kms-key", &kms.KeyArgs{
		Description: pulumi.String("KMS key for HealthApp HIPAA compliance"),
		KeyUsage:    pulumi.String("ENCRYPT_DECRYPT"),
		Policy: pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "arn:aws:iam::%s:root"},
					"Action": "kms:*",
					"Resource": "*"
				}
			]
		}`, current.AccountId),
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create KMS alias
	_, err = kms.NewAlias(ctx, "healthapp-kms-alias", &kms.AliasArgs{
		Name:        pulumi.Sprintf("alias/healthapp-key-%s", environmentSuffix),
		TargetKeyId: kmsKey.KeyId,
	})
	if err != nil {
		return err
	}

	// Create VPC for network isolation
	vpc, err := ec2.NewVpc(ctx, "healthapp-vpc", &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("healthapp-vpc-%s", environmentSuffix),
			"Project":     pulumi.String("HealthApp"),
			"Environment": pulumi.String("Production"),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, "healthapp-igw", &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("healthapp-igw-%s", environmentSuffix),
			"Project":     pulumi.String("HealthApp"),
			"Environment": pulumi.String("Production"),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return err
	}

	// Create public subnets
	publicSubnet1, err := ec2.NewSubnet(ctx, "healthapp-public-subnet-1", &ec2.SubnetArgs{
		VpcId:               vpc.ID(),
		CidrBlock:           pulumi.String("10.0.10.0/24"),
		AvailabilityZone:    pulumi.String(azs.Names[0]),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags:                commonTags,
	})
	if err != nil {
		return err
	}

	publicSubnet2, err := ec2.NewSubnet(ctx, "healthapp-public-subnet-2", &ec2.SubnetArgs{
		VpcId:               vpc.ID(),
		CidrBlock:           pulumi.String("10.0.20.0/24"),
		AvailabilityZone:    pulumi.String(azs.Names[1]),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags:                commonTags,
	})
	if err != nil {
		return err
	}

	// Create NAT Gateway EIPs
	natEip1, err := ec2.NewEip(ctx, "healthapp-nat-eip-1", &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	natEip2, err := ec2.NewEip(ctx, "healthapp-nat-eip-2", &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	// Create NAT Gateways
	natGw1, err := ec2.NewNatGateway(ctx, "healthapp-nat-gw-1", &ec2.NatGatewayArgs{
		AllocationId: natEip1.ID(),
		SubnetId:     publicSubnet1.ID(),
		Tags:         commonTags,
	})
	if err != nil {
		return err
	}

	natGw2, err := ec2.NewNatGateway(ctx, "healthapp-nat-gw-2", &ec2.NatGatewayArgs{
		AllocationId: natEip2.ID(),
		SubnetId:     publicSubnet2.ID(),
		Tags:         commonTags,
	})
	if err != nil {
		return err
	}

	// Create private subnets
	privateSubnet1, err := ec2.NewSubnet(ctx, "healthapp-private-subnet-1", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.30.0/24"),
		AvailabilityZone: pulumi.String(azs.Names[0]),
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	privateSubnet2, err := ec2.NewSubnet(ctx, "healthapp-private-subnet-2", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.40.0/24"),
		AvailabilityZone: pulumi.String(azs.Names[1]),
		Tags:             commonTags,
	})
	if err != nil {
		return err
	}

	// Create route tables
	publicRt, err := ec2.NewRouteTable(ctx, "healthapp-public-rt", &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags:  commonTags,
	})
	if err != nil {
		return err
	}

	privateRt1, err := ec2.NewRouteTable(ctx, "healthapp-private-rt-1", &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags:  commonTags,
	})
	if err != nil {
		return err
	}

	privateRt2, err := ec2.NewRouteTable(ctx, "healthapp-private-rt-2", &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags:  commonTags,
	})
	if err != nil {
		return err
	}

	// Create routes
	_, err = ec2.NewRoute(ctx, "healthapp-public-route", &ec2.RouteArgs{
		RouteTableId:         publicRt.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		GatewayId:            igw.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRoute(ctx, "healthapp-private-route-1", &ec2.RouteArgs{
		RouteTableId:         privateRt1.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		NatGatewayId:         natGw1.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRoute(ctx, "healthapp-private-route-2", &ec2.RouteArgs{
		RouteTableId:         privateRt2.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		NatGatewayId:         natGw2.ID(),
	})
	if err != nil {
		return err
	}

	// Associate route tables with subnets
	_, err = ec2.NewRouteTableAssociation(ctx, "healthapp-public-rta-1", &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet1.ID(),
		RouteTableId: publicRt.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, "healthapp-public-rta-2", &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet2.ID(),
		RouteTableId: publicRt.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, "healthapp-private-rta-1", &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet1.ID(),
		RouteTableId: privateRt1.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, "healthapp-private-rta-2", &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet2.ID(),
		RouteTableId: privateRt2.ID(),
	})
	if err != nil {
		return err
	}

	// Create security groups
	bastionSg, err := ec2.NewSecurityGroup(ctx, "healthapp-bastion-sg", &ec2.SecurityGroupArgs{
		Name:        pulumi.Sprintf("healthapp-bastion-sg-%s", environmentSuffix),
		Description: pulumi.String("Security group for bastion host"),
		VpcId:       vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(22),
				ToPort:     pulumi.Int(22),
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
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	lambdaSg, err := ec2.NewSecurityGroup(ctx, "healthapp-lambda-sg", &ec2.SecurityGroupArgs{
		Name:        pulumi.Sprintf("healthapp-lambda-sg-%s", environmentSuffix),
		Description: pulumi.String("Security group for Lambda functions"),
		VpcId:       vpc.ID(),
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for PHI data
	phiBucket, err := s3.NewBucketV2(ctx, "healthapp-phi-bucket", &s3.BucketV2Args{
		Bucket: pulumi.Sprintf("healthapp-phi-data-%s", environmentSuffix),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	// Enable versioning on PHI bucket
	_, err = s3.NewBucketVersioningV2(ctx, "healthapp-phi-versioning", &s3.BucketVersioningV2Args{
		Bucket: phiBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return err
	}

	// Configure encryption for PHI bucket
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "healthapp-phi-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: phiBucket.ID(),
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

	// Block public access to PHI bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "healthapp-phi-public-block", &s3.BucketPublicAccessBlockArgs{
		Bucket:                phiBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for audit logs
	auditBucket, err := s3.NewBucketV2(ctx, "healthapp-audit-bucket", &s3.BucketV2Args{
		Bucket: pulumi.Sprintf("healthapp-audit-logs-%s", environmentSuffix),
		Tags:   commonTags,
	})
	if err != nil {
		return err
	}

	// Configure encryption for audit bucket
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "healthapp-audit-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: auditBucket.ID(),
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

	// Create bucket policy for CloudTrail
	_, err = s3.NewBucketPolicy(ctx, "healthapp-audit-bucket-policy", &s3.BucketPolicyArgs{
		Bucket: auditBucket.ID(),
		Policy: auditBucket.Arn.ApplyT(func(bucketArn string) (string, error) {
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "AWSCloudTrailAclCheck",
						"Effect": "Allow",
						"Principal": {
							"Service": "cloudtrail.amazonaws.com"
						},
						"Action": "s3:GetBucketAcl",
						"Resource": "%s"
					},
					{
						"Sid": "AWSCloudTrailWrite",
						"Effect": "Allow",
						"Principal": {
							"Service": "cloudtrail.amazonaws.com"
						},
						"Action": "s3:PutObject",
						"Resource": "%s/*",
						"Condition": {
							"StringEquals": {
								"s3:x-amz-acl": "bucket-owner-full-control"
							}
						}
					}
				]
			}`, bucketArn, bucketArn), nil
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	// Create CloudTrail for audit logging (depends on bucket policy)
	cloudTrail, err := cloudtrail.NewTrail(ctx, "healthapp-cloudtrail", &cloudtrail.TrailArgs{
		Name:                       pulumi.Sprintf("healthapp-audit-trail-%s", environmentSuffix),
		S3BucketName:               auditBucket.ID(),
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(false),
		EnableLogFileValidation:    pulumi.Bool(true),
		Tags:                       commonTags,
	}, pulumi.DependsOn([]pulumi.Resource{auditBucket}))
	if err != nil {
		return err
	}

	// Create Secrets Manager secret for database credentials
	dbSecret, err := secretsmanager.NewSecret(ctx, "healthapp-db-secret", &secretsmanager.SecretArgs{
		Name:        pulumi.Sprintf("healthapp/db/credentials-%s", environmentSuffix),
		Description: pulumi.String("Database credentials for HealthApp"),
		KmsKeyId:    kmsKey.Arn,
		Tags:        commonTags,
	})
	if err != nil {
		return err
	}

	// Create Secrets Manager secret for API keys
	apiKeySecret, err := secretsmanager.NewSecret(ctx, "healthapp-api-secret", &secretsmanager.SecretArgs{
		Name:        pulumi.Sprintf("healthapp/api/keys-%s", environmentSuffix),
		Description: pulumi.String("API keys for HealthApp integrations"),
		KmsKeyId:    kmsKey.Arn,
		Tags:        commonTags,
	})
	if err != nil {
		return err
	}

	// Create IAM role for application
	appRole, err := iam.NewRole(ctx, "healthapp-role", &iam.RoleArgs{
		Name: pulumi.Sprintf("healthapp-application-role-%s", environmentSuffix),
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "ec2.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create IAM policy for S3 access
	s3Policy, err := iam.NewPolicy(ctx, "healthapp-s3-policy", &iam.PolicyArgs{
		Name: pulumi.Sprintf("healthapp-s3-access-%s", environmentSuffix),
		Policy: pulumi.All(phiBucket.Arn, auditBucket.Arn).ApplyT(func(args []interface{}) (string, error) {
			phiArn := args[0].(string)
			auditArn := args[1].(string)
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
						"Resource": [
							"%s/*",
							"%s/*"
						]
					}
				]
			}`, phiArn, auditArn), nil
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	// Attach policy to role
	_, err = iam.NewRolePolicyAttachment(ctx, "healthapp-s3-attachment", &iam.RolePolicyAttachmentArgs{
		Role:      appRole.Name,
		PolicyArn: s3Policy.Arn,
	})
	if err != nil {
		return err
	}

	// Create Lambda execution role
	lambdaRole, err := iam.NewRole(ctx, "healthapp-lambda-role", &iam.RoleArgs{
		Name: pulumi.Sprintf("healthapp-lambda-role-%s", environmentSuffix),
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Attach basic Lambda execution policy
	_, err = iam.NewRolePolicyAttachment(ctx, "healthapp-lambda-basic", &iam.RolePolicyAttachmentArgs{
		Role:      lambdaRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
	})
	if err != nil {
		return err
	}

	// Create Lambda function for S3 processing
	lambdaFunction, err := lambda.NewFunction(ctx, "healthapp-s3-processor", &lambda.FunctionArgs{
		Name:       pulumi.Sprintf("healthapp-s3-processor-%s", environmentSuffix),
		Runtime:    pulumi.String("python3.9"),
		Code:       pulumi.NewFileArchive("lambda_function.zip"),
		Handler:    pulumi.String("lambda_function.handler"),
		Role:       lambdaRole.Arn,
		Timeout:    pulumi.Int(30),
		MemorySize: pulumi.Int(256),
		Environment: &lambda.FunctionEnvironmentArgs{
			Variables: pulumi.StringMap{
				"BUCKET_NAME": phiBucket.ID(),
				"KMS_KEY_ID":  kmsKey.KeyId,
				"ENVIRONMENT": pulumi.String(environmentSuffix),
			},
		},
		VpcConfig: &lambda.FunctionVpcConfigArgs{
			SubnetIds:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroupIds: pulumi.StringArray{lambdaSg.ID()},
		},
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Create CloudWatch alarms
	_, err = cloudwatch.NewMetricAlarm(ctx, "healthapp-lambda-errors", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("healthapp-lambda-errors-%s", environmentSuffix),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("Errors"),
		Namespace:          pulumi.String("AWS/Lambda"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.Float64(1),
		AlarmDescription:   pulumi.String("Lambda function errors"),
		Dimensions: pulumi.StringMap{
			"FunctionName": lambdaFunction.Name,
		},
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, "healthapp-s3-unauthorized-access", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("healthapp-s3-unauthorized-%s", environmentSuffix),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("4xxErrors"),
		Namespace:          pulumi.String("AWS/S3"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.Float64(5),
		AlarmDescription:   pulumi.String("S3 unauthorized access attempts"),
		Dimensions: pulumi.StringMap{
			"BucketName": phiBucket.ID(),
		},
		Tags: commonTags,
	})
	if err != nil {
		return err
	}

	// Export outputs
	ctx.Export("vpcId", vpc.ID())
	ctx.Export("kmsKeyId", kmsKey.KeyId)
	ctx.Export("kmsKeyArn", kmsKey.Arn)
	ctx.Export("phiBucketName", phiBucket.ID())
	ctx.Export("auditBucketName", auditBucket.ID())
	ctx.Export("cloudTrailArn", cloudTrail.Arn)
	ctx.Export("dbSecretArn", dbSecret.Arn)
	ctx.Export("apiKeySecretArn", apiKeySecret.Arn)
	ctx.Export("appRoleArn", appRole.Arn)
	ctx.Export("lambdaRoleArn", lambdaRole.Arn)
	ctx.Export("lambdaFunctionArn", lambdaFunction.Arn)
	ctx.Export("publicSubnet1Id", publicSubnet1.ID())
	ctx.Export("publicSubnet2Id", publicSubnet2.ID())
	ctx.Export("privateSubnet1Id", privateSubnet1.ID())
	ctx.Export("privateSubnet2Id", privateSubnet2.ID())
	ctx.Export("bastionSecurityGroupId", bastionSg.ID())
	ctx.Export("lambdaSecurityGroupId", lambdaSg.ID())
	ctx.Export("internetGatewayId", igw.ID())
	ctx.Export("natGateway1Id", natGw1.ID())
	ctx.Export("natGateway2Id", natGw2.ID())

	return nil
}

func main() {
	pulumi.Run(CreateInfrastructure)
}
