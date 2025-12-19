```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

const (
	region      = "us-west-2"
	environment = "production"
)

// Common tags for all resources
var commonTags = pulumi.StringMap{
	"Environment": pulumi.String(environment),
	"Project":     pulumi.String("secure-web-app"),
	"ManagedBy":   pulumi.String("pulumi"),
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configure AWS provider for us-west-2
		awsProvider, err := aws.NewProvider(ctx, "aws-provider", &aws.ProviderArgs{
			Region: pulumi.String(region),
		})
		if err != nil {
			return err
		}

		// Create KMS key for encryption
		kmsKey, err := createKMSKey(ctx, awsProvider)
		if err != nil {
			return err
		}

		// Create VPC with security groups
		vpc, securityGroup, err := createNetworkInfrastructure(ctx, awsProvider)
		if err != nil {
			return err
		}

		// Create S3 buckets with logging
		appBucket, logBucket, err := createS3Infrastructure(ctx, awsProvider, kmsKey)
		if err != nil {
			return err
		}

		// Create DynamoDB table
		dynamoTable, err := createDynamoDBTable(ctx, awsProvider, kmsKey)
		if err != nil {
			return err
		}

		// Create IAM roles and policies
		appRole, err := createIAMInfrastructure(ctx, awsProvider, appBucket, dynamoTable, kmsKey)
		if err != nil {
			return err
		}

		// Export important resource information
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("securityGroupId", securityGroup.ID())
		ctx.Export("appBucketName", appBucket.ID())
		ctx.Export("logBucketName", logBucket.ID())
		ctx.Export("dynamoTableName", dynamoTable.Name)
		ctx.Export("kmsKeyId", kmsKey.ID())
		ctx.Export("appRoleArn", appRole.Arn)
		ctx.Export("region", pulumi.String(region))

		return nil
	})
}

// createKMSKey creates a KMS key for encryption
func createKMSKey(ctx *pulumi.Context, provider *aws.Provider) (*kms.Key, error) {
	keyPolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "Enable IAM User Permissions",
				"Effect": "Allow",
				"Principal": {
					"AWS": "arn:aws:iam::*:root"
				},
				"Action": "kms:*",
				"Resource": "*"
			},
			{
				"Sid": "Allow use of the key for encryption/decryption",
				"Effect": "Allow",
				"Principal": {
					"Service": [
						"s3.amazonaws.com",
						"dynamodb.amazonaws.com",
						"logs.amazonaws.com"
					]
				},
				"Action": [
					"kms:Encrypt",
					"kms:Decrypt",
					"kms:ReEncrypt*",
					"kms:GenerateDataKey*",
					"kms:DescribeKey"
				],
				"Resource": "*"
			}
		]
	}`

	key, err := kms.NewKey(ctx, "app-kms-key", &kms.KeyArgs{
		Description: pulumi.String("KMS key for secure web application"),
		Policy:      pulumi.String(keyPolicy),
		Tags:        commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create alias for the key
	_, err = kms.NewAlias(ctx, "app-kms-alias", &kms.AliasArgs{
		Name:         pulumi.String("alias/secure-web-app-key"),
		TargetKeyId:  key.KeyId,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	return key, nil
}

// createNetworkInfrastructure creates VPC and security groups
func createNetworkInfrastructure(ctx *pulumi.Context, provider *aws.Provider) (*ec2.Vpc, *ec2.SecurityGroup, error) {
	// Create VPC
	vpc, err := ec2.NewVpc(ctx, "app-vpc", &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String("secure-web-app-vpc"),
			"Environment": pulumi.String(environment),
			"Project":     pulumi.String("secure-web-app"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Create security group with restrictive rules
	securityGroup, err := ec2.NewSecurityGroup(ctx, "app-security-group", &ec2.SecurityGroupArgs{
		Name:        pulumi.String("secure-web-app-sg"),
		Description: pulumi.String("Security group for secure web application"),
		VpcId:       vpc.ID(),

		// Ingress rules - only HTTPS
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},

		// Egress rules - allow HTTPS outbound
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},

		Tags: commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	return vpc, securityGroup, nil
}

// createS3Infrastructure creates S3 buckets with logging and encryption
func createS3Infrastructure(ctx *pulumi.Context, provider *aws.Provider, kmsKey *kms.Key) (*s3.BucketV2, *s3.BucketV2, error) {
	// Create logging bucket first
	logBucket, err := s3.NewBucketV2(ctx, "app-logs-bucket", &s3.BucketV2Args{
		Bucket: pulumi.String("secure-web-app-logs-" + ctx.Stack()),
		Tags:   commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Configure log bucket encryption
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "log-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: logBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					KmsMasterKeyId: kmsKey.Arn,
					SseAlgorithm:   pulumi.String("aws:kms"),
				},
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Block public access for log bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "log-bucket-pab", &s3.BucketPublicAccessBlockArgs{
		Bucket:                logBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Create main application bucket
	appBucket, err := s3.NewBucketV2(ctx, "app-bucket", &s3.BucketV2Args{
		Bucket: pulumi.String("secure-web-app-data-" + ctx.Stack()),
		Tags:   commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Configure app bucket encryption
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "app-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: appBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					KmsMasterKeyId: kmsKey.Arn,
					SseAlgorithm:   pulumi.String("aws:kms"),
				},
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Configure logging for app bucket
	_, err = s3.NewBucketLoggingV2(ctx, "app-bucket-logging", &s3.BucketLoggingV2Args{
		Bucket: appBucket.ID(),
		TargetBucket: logBucket.ID(),
		TargetPrefix: pulumi.String("access-logs/"),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Block public access for app bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "app-bucket-pab", &s3.BucketPublicAccessBlockArgs{
		Bucket:                appBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	// Enable versioning for both buckets
	_, err = s3.NewBucketVersioningV2(ctx, "app-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: appBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	_, err = s3.NewBucketVersioningV2(ctx, "log-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: logBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, nil, err
	}

	return appBucket, logBucket, nil
}

// createDynamoDBTable creates a secure DynamoDB table
func createDynamoDBTable(ctx *pulumi.Context, provider *aws.Provider, kmsKey *kms.Key) (*dynamodb.Table, error) {
	table, err := dynamodb.NewTable(ctx, "app-table", &dynamodb.TableArgs{
		Name:        pulumi.String("secure-web-app-table"),
		BillingMode: pulumi.String("PAY_PER_REQUEST"),

		Attributes: dynamodb.TableAttributeArray{
			&dynamodb.TableAttributeArgs{
				Name: pulumi.String("id"),
				Type: pulumi.String("S"),
			},
		},

		HashKey: pulumi.String("id"),

		// Enable encryption at rest
		ServerSideEncryption: &dynamodb.TableServerSideEncryptionArgs{
			Enabled:   pulumi.Bool(true),
			KmsKeyArn: kmsKey.Arn,
		},

		// Enable point-in-time recovery
		PointInTimeRecovery: &dynamodb.TablePointInTimeRecoveryArgs{
			Enabled: pulumi.Bool(true),
		},

		Tags: commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	return table, nil
}

// createIAMInfrastructure creates IAM roles and policies
func createIAMInfrastructure(ctx *pulumi.Context, provider *aws.Provider, appBucket *s3.BucketV2, dynamoTable *dynamodb.Table, kmsKey *kms.Key) (*iam.Role, error) {
	// Create assume role policy
	assumeRolePolicy := `{
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
	}`

	// Create IAM role
	role, err := iam.NewRole(ctx, "app-role", &iam.RoleArgs{
		Name:             pulumi.String("secure-web-app-role"),
		AssumeRolePolicy: pulumi.String(assumeRolePolicy),
		Tags:             commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create custom policy for the application
	policyDocument := pulumi.All(appBucket.Arn, dynamoTable.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
		bucketArn := args[0].(string)
		tableArn := args[1].(string)
		keyArn := args[2].(string)

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
						"dynamodb:GetItem",
						"dynamodb:PutItem",
						"dynamodb:UpdateItem",
						"dynamodb:DeleteItem",
						"dynamodb:Query",
						"dynamodb:Scan"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "%s"
				}
			]
		}`, bucketArn, bucketArn, tableArn, keyArn)
	}).(pulumi.StringOutput)

	policy, err := iam.NewPolicy(ctx, "app-policy", &iam.PolicyArgs{
		Name:        pulumi.String("secure-web-app-policy"),
		Description: pulumi.String("Policy for secure web application"),
		Policy:      policyDocument,
		Tags:        commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Attach policy to role
	_, err = iam.NewRolePolicyAttachment(ctx, "app-role-policy-attachment", &iam.RolePolicyAttachmentArgs{
		Role:      role.Name,
		PolicyArn: policy.Arn,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create instance profile
	_, err = iam.NewInstanceProfile(ctx, "app-instance-profile", &iam.InstanceProfileArgs{
		Name: pulumi.String("secure-web-app-instance-profile"),
		Role: role.Name,
		Tags: commonTags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	return role, nil
}
```
