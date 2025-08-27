# MODEL_RESPONSE2.md - SecureCorp AWS Infrastructure Setup (Pulumi Go) - Fixed Version

This document shows the second model response for the Pulumi Go implementation with fixes for the issues identified in the first response.

## Fixed Implementation

```go
package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration variables
		environment := getEnvOrDefault("ENVIRONMENT", "dev")
		awsRegion := getEnvOrDefault("AWS_REGION", "us-east-1")
		projectName := getEnvOrDefault("PROJECT_NAME", "securecorp")
		vpcCidr := getEnvOrDefault("VPC_CIDR", "10.0.0.0/16")

		// Common tags
		commonTags := pulumi.StringMap{
			"Project":     pulumi.String("SecureCorp"),
			"Environment": pulumi.String(environment),
			"ManagedBy":   pulumi.String("pulumi"),
			"Owner":       pulumi.String("DevOps"),
		}

		// Get current account ID
		callerIdentity, err := aws.GetCallerIdentity(ctx)
		if err != nil {
			return err
		}

		// Get availability zones
		availabilityZones, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		})
		if err != nil {
			return err
		}

		// Create KMS key
		kmsKey, err := kms.NewKey(ctx, "main", &kms.KeyArgs{
			Description:            pulumi.Sprintf("KMS key for %s %s resources", projectName, environment),
			DeletionWindowInDays:   pulumi.Int(7),
			EnableKeyRotation:      pulumi.Bool(true),
			CustomerMasterKeySpec:  pulumi.String("SYMMETRIC_DEFAULT"),
			KeyUsage:               pulumi.String("ENCRYPT_DECRYPT"),
			MultiRegion:            pulumi.Bool(true),
			Tags:                   commonTags,
		})
		if err != nil {
			return err
		}

		// Create KMS alias
		_, err = kms.NewAlias(ctx, "main", &kms.AliasArgs{
			Name:         pulumi.Sprintf("alias/%s-%s-key", projectName, environment),
			TargetKeyId:  kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "main", &ec2.VpcArgs{
			CidrBlock:           pulumi.String(vpcCidr),
			EnableDnsHostnames:  pulumi.Bool(true),
			EnableDnsSupport:    pulumi.Bool(true),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		internetGateway, err := ec2.NewInternetGateway(ctx, "main", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-%d", i), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i),
				AvailabilityZone:    pulumi.String(availabilityZones.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags:                commonTags,
			})
			if err != nil {
				return err
			}
			publicSubnets[i] = subnet
		}

		// Create private subnets
		privateSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-%d", i), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+2),
				AvailabilityZone: pulumi.String(availabilityZones.Names[i]),
				Tags:             commonTags,
			})
			if err != nil {
				return err
			}
			privateSubnets[i] = subnet
		}

		// Create NAT Gateway EIPs
		natEips := make([]*ec2.Eip, 2)
		for i := 0; i < 2; i++ {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-%d", i), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags:   commonTags,
			})
			if err != nil {
				return err
			}
			natEips[i] = eip
		}

		// Create NAT Gateways
		natGateways := make([]*ec2.NatGateway, 2)
		for i := 0; i < 2; i++ {
			natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("main-%d", i), &ec2.NatGatewayArgs{
				AllocationId: natEips[i].ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags:         commonTags,
			})
			if err != nil {
				return err
			}
			natGateways[i] = natGateway
		}

		// Create route tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: internetGateway.ID(),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create private route tables
		privateRouteTables := make([]*ec2.RouteTable, 2)
		for i := 0; i < 2; i++ {
			routeTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-%d", i), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Routes: ec2.RouteTableRouteArray{
					&ec2.RouteTableRouteArgs{
						CidrBlock:     pulumi.String("0.0.0.0/0"),
						NatGatewayId:  natGateways[i].ID(),
					},
				},
				Tags: commonTags,
			})
			if err != nil {
				return err
			}
			privateRouteTables[i] = routeTable
		}

		// Associate route tables with subnets
		for i := 0; i < 2; i++ {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-%d", i), &ec2.RouteTableAssociationArgs{
				SubnetId:     publicSubnets[i].ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}

			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-%d", i), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnets[i].ID(),
				RouteTableId: privateRouteTables[i].ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		vpcEndpointsSg, err := ec2.NewSecurityGroup(ctx, "vpc-endpoints", &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("%s-%s-vpc-endpoints-sg", projectName, environment),
			Description: pulumi.String("Security group for VPC endpoints"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					Protocol:   pulumi.String("tcp"),
					CidrBlocks: pulumi.StringArray{pulumi.String(vpcCidr)},
					Description: pulumi.String("HTTPS from VPC"),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					Protocol:   pulumi.String("-1"),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("All outbound traffic"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		privateSg, err := ec2.NewSecurityGroup(ctx, "private", &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("%s-%s-private-sg", projectName, environment),
			Description: pulumi.String("Security group for private subnets"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					Protocol:   pulumi.String("tcp"),
					CidrBlocks: pulumi.StringArray{pulumi.String(vpcCidr)},
					Description: pulumi.String("HTTPS from VPC"),
				},
				&ec2.SecurityGroupIngressArgs{
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					Protocol:   pulumi.String("tcp"),
					CidrBlocks: pulumi.StringArray{pulumi.String(vpcCidr)},
					Description: pulumi.String("HTTP from VPC"),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					Protocol:   pulumi.String("tcp"),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("HTTPS to internet"),
				},
				&ec2.SecurityGroupEgressArgs{
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					Protocol:   pulumi.String("tcp"),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("HTTP to internet"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create VPC endpoints
		s3Endpoint, err := ec2.NewVpcEndpoint(ctx, "s3", &ec2.VpcEndpointArgs{
			VpcId:            vpc.ID(),
			ServiceName:       pulumi.Sprintf("com.amazonaws.%s.s3", awsRegion),
			VpcEndpointType:   pulumi.String("Gateway"),
			RouteTableIds:     pulumi.StringArray{publicRouteTable.ID()},
			Tags:              commonTags,
		})
		if err != nil {
			return err
		}

		kmsEndpoint, err := ec2.NewVpcEndpoint(ctx, "kms", &ec2.VpcEndpointArgs{
			VpcId:              vpc.ID(),
			ServiceName:         pulumi.Sprintf("com.amazonaws.%s.kms", awsRegion),
			VpcEndpointType:     pulumi.String("Interface"),
			SubnetIds:           pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			SecurityGroupIds:    pulumi.StringArray{vpcEndpointsSg.ID()},
			PrivateDnsEnabled:   pulumi.Bool(true),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		cloudtrailEndpoint, err := ec2.NewVpcEndpoint(ctx, "cloudtrail", &ec2.VpcEndpointArgs{
			VpcId:              vpc.ID(),
			ServiceName:         pulumi.Sprintf("com.amazonaws.%s.cloudtrail", awsRegion),
			VpcEndpointType:     pulumi.String("Interface"),
			SubnetIds:           pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			SecurityGroupIds:    pulumi.StringArray{vpcEndpointsSg.ID()},
			PrivateDnsEnabled:   pulumi.Bool(true),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		logsEndpoint, err := ec2.NewVpcEndpoint(ctx, "logs", &ec2.VpcEndpointArgs{
			VpcId:              vpc.ID(),
			ServiceName:         pulumi.Sprintf("com.amazonaws.%s.logs", awsRegion),
			VpcEndpointType:     pulumi.String("Interface"),
			SubnetIds:           pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			SecurityGroupIds:    pulumi.StringArray{vpcEndpointsSg.ID()},
			PrivateDnsEnabled:   pulumi.Bool(true),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		// Create S3 buckets
		cloudtrailLogsBucket, err := s3.NewBucket(ctx, "cloudtrail-logs", &s3.BucketArgs{
			Bucket: pulumi.Sprintf("%s-%s-cloudtrail-logs", projectName, environment),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure S3 bucket encryption
		_, err = s3.NewBucketServerSideEncryptionConfiguration(ctx, "cloudtrail-logs-encryption", &s3.BucketServerSideEncryptionConfigurationArgs{
			Bucket: cloudtrailLogsBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationRuleArray{
				&s3.BucketServerSideEncryptionConfigurationRuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs{
						KmsMasterKeyId: kmsKey.Arn,
						SseAlgorithm:   pulumi.String("aws:kms"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Configure S3 bucket public access block
		_, err = s3.NewBucketPublicAccessBlock(ctx, "cloudtrail-logs-public-access", &s3.BucketPublicAccessBlockArgs{
			Bucket:                cloudtrailLogsBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Configure S3 bucket versioning
		_, err = s3.NewBucketVersioning(ctx, "cloudtrail-logs-versioning", &s3.BucketVersioningArgs{
			Bucket: cloudtrailLogsBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningVersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// FIXED: Configure S3 bucket lifecycle with proper filter
		_, err = s3.NewBucketLifecycleConfiguration(ctx, "cloudtrail-logs-lifecycle", &s3.BucketLifecycleConfigurationArgs{
			Bucket: cloudtrailLogsBucket.ID(),
			Rules: s3.BucketLifecycleConfigurationRuleArray{
				&s3.BucketLifecycleConfigurationRuleArgs{
					Id:     pulumi.String("cloudtrail_logs_lifecycle"),
					Status: pulumi.String("Enabled"),
					Filter: &s3.BucketLifecycleConfigurationRuleFilterArgs{
						Prefix: pulumi.String(""), // Empty prefix for all objects
					},
					Transitions: s3.BucketLifecycleConfigurationRuleTransitionArray{
						&s3.BucketLifecycleConfigurationRuleTransitionArgs{
							Days:         pulumi.Int(30),
							StorageClass: pulumi.String("STANDARD_IA"),
						},
						&s3.BucketLifecycleConfigurationRuleTransitionArgs{
							Days:         pulumi.Int(90),
							StorageClass: pulumi.String("GLACIER"),
						},
						&s3.BucketLifecycleConfigurationRuleTransitionArgs{
							Days:         pulumi.Int(365),
							StorageClass: pulumi.String("DEEP_ARCHIVE"),
						},
					},
					Expiration: &s3.BucketLifecycleConfigurationRuleExpirationArgs{
						Days: pulumi.Int(2557), // 7 years
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Create application data bucket
		appDataBucket, err := s3.NewBucket(ctx, "app-data", &s3.BucketArgs{
			Bucket: pulumi.Sprintf("%s-%s-app-data", projectName, environment),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure app data bucket encryption
		_, err = s3.NewBucketServerSideEncryptionConfiguration(ctx, "app-data-encryption", &s3.BucketServerSideEncryptionConfigurationArgs{
			Bucket: appDataBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationRuleArray{
				&s3.BucketServerSideEncryptionConfigurationRuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs{
						KmsMasterKeyId: kmsKey.Arn,
						SseAlgorithm:   pulumi.String("aws:kms"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Configure app data bucket public access block
		_, err = s3.NewBucketPublicAccessBlock(ctx, "app-data-public-access", &s3.BucketPublicAccessBlockArgs{
			Bucket:                appDataBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Configure app data bucket versioning
		_, err = s3.NewBucketVersioning(ctx, "app-data-versioning", &s3.BucketVersioningArgs{
			Bucket: appDataBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningVersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM roles
		developerRole, err := iam.NewRole(ctx, "developer", &iam.RoleArgs{
			Name: pulumi.Sprintf("%s-%s-developer-role", projectName, environment),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"AWS": "arn:aws:iam::ACCOUNT_ID:root"
						},
						"Condition": {
							"StringEquals": {
								"sts:ExternalId": "developer-access"
							}
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create developer policy
		_, err = iam.NewRolePolicy(ctx, "developer-policy", &iam.RolePolicyArgs{
			Name: pulumi.Sprintf("%s-%s-developer-policy", projectName, environment),
			Role: developerRole.Name,
			Policy: pulumi.All(appDataBucket.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
				keyArn := args[1].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:ListBucket"
							],
							"Resource": [
								"%s",
								"%s/*"
							],
							"Condition": {
								"StringEquals": {
									"s3:x-amz-server-side-encryption": "aws:kms"
								}
							}
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:GenerateDataKey"
							],
							"Resource": ["%s"]
						}
					]
				}`, bucketArn, bucketArn, keyArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create CloudWatch log groups
		cloudtrailLogGroup, err := cloudwatch.NewLogGroup(ctx, "cloudtrail", &cloudwatch.LogGroupArgs{
			LogGroupName:    pulumi.Sprintf("/aws/cloudtrail/%s-%s", projectName, environment),
			RetentionInDays: pulumi.Int(2557), // 7 years
			Tags:            commonTags,
		})
		if err != nil {
			return err
		}

		applicationLogGroup, err := cloudwatch.NewLogGroup(ctx, "application", &cloudwatch.LogGroupArgs{
			LogGroupName:    pulumi.Sprintf("/aws/application/%s-%s", projectName, environment),
			RetentionInDays: pulumi.Int(90),
			Tags:            commonTags,
		})
		if err != nil {
			return err
		}

		// FIXED: Create CloudTrail with correct event selectors
		_, err = cloudtrail.NewTrail(ctx, "main", &cloudtrail.TrailArgs{
			Name:           pulumi.Sprintf("%s-%s-cloudtrail", projectName, environment),
			S3BucketName:   cloudtrailLogsBucket.Bucket,
			IncludeGlobalServiceEvents: pulumi.Bool(true),
			IsMultiRegionTrail:        pulumi.Bool(true),
			EnableLogFileValidation:   pulumi.Bool(true),
			KmsKeyId:                  kmsKey.Arn,
			EventSelectors: cloudtrail.TrailEventSelectorArray{
				&cloudtrail.TrailEventSelectorArgs{
					ReadWriteType: pulumi.String("All"),
					IncludeManagementEvents: pulumi.Bool(true),
					DataResources: cloudtrail.TrailEventSelectorDataResourceArray{
						&cloudtrail.TrailEventSelectorDataResourceArgs{
							Type:   pulumi.String("AWS::S3::Object"), // FIXED: Correct type
							Values: pulumi.StringArray{
								pulumi.Sprintf("%s/", cloudtrailLogsBucket.Arn),
							},
						},
					},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpc_id", vpc.ID())
		ctx.Export("private_subnet_ids", pulumi.All(privateSubnets[0].ID(), privateSubnets[1].ID()))
		ctx.Export("public_subnet_ids", pulumi.All(publicSubnets[0].ID(), publicSubnets[1].ID()))
		ctx.Export("kms_key_id", kmsKey.KeyId)
		ctx.Export("kms_key_arn", kmsKey.Arn)
		ctx.Export("cloudtrail_logs_bucket", cloudtrailLogsBucket.Bucket)
		ctx.Export("app_data_bucket", appDataBucket.Bucket)
		ctx.Export("iam_roles", pulumi.Map{
			"developer": developerRole.Arn,
		})
		ctx.Export("vpc_endpoints", pulumi.Map{
			"s3":         s3Endpoint.ID(),
			"kms":        kmsEndpoint.ID(),
			"cloudtrail": cloudtrailEndpoint.ID(),
			"logs":       logsEndpoint.ID(),
		})

		return nil
	})
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

## Fixes Applied in This Response

1. **S3 Bucket Lifecycle Configuration**: Added the required `filter` block with an empty prefix to fix the "InvalidRequest" error
2. **CloudTrail Event Selector**: Changed the data resource type from `AWS::S3::Bucket` to `AWS::S3::Object` to fix the "InvalidEventSelectorsException" error

## Remaining Issues

- **Missing CloudTrail Bucket Policy**: The S3 bucket still needs a bucket policy to allow CloudTrail to write logs
- **Account ID in IAM Policy**: The IAM role assume policy still contains placeholder "ACCOUNT_ID" text

These issues will be addressed in the final model response.
