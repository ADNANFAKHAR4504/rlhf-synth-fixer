package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
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

	// Get current AWS account ID
	current, err := aws.GetCallerIdentity(ctx, nil, nil)
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

	// Create private subnets
	privateSubnet1, err := ec2.NewSubnet(ctx, "healthapp-private-subnet-1", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.1.0/24"),
		AvailabilityZone: pulumi.String("us-east-1a"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("healthapp-private-subnet-1-%s", environmentSuffix),
			"Project":     pulumi.String("HealthApp"),
			"Environment": pulumi.String("Production"),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return err
	}

	privateSubnet2, err := ec2.NewSubnet(ctx, "healthapp-private-subnet-2", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.2.0/24"),
		AvailabilityZone: pulumi.String("us-east-1b"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("healthapp-private-subnet-2-%s", environmentSuffix),
			"Project":     pulumi.String("HealthApp"),
			"Environment": pulumi.String("Production"),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
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
		Policy: pulumi.All(auditBucket.Arn, current.AccountId).ApplyT(func(args []interface{}) (string, error) {
			bucketArn := args[0].(string)
			accountId := args[1].(string)
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
		IsMultiRegionTrail:         pulumi.Bool(true),
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
	ctx.Export("privateSubnet1Id", privateSubnet1.ID())
	ctx.Export("privateSubnet2Id", privateSubnet2.ID())

	return nil
}

func main() {
	pulumi.Run(CreateInfrastructure)
}
