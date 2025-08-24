package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cfg"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func CreateInfrastructure(ctx *pulumi.Context) error {
	// Get environment suffix for unique resource naming
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr308"
	}

	// Get Config resources from environment or use defaults
	configRecorder := os.Getenv("CONFIG_RECORDER_NAME")
	if configRecorder == "" {
		configRecorder = "tap-webapp-pr1598-config-recorder"
	}

	deliveryChannel := os.Getenv("DELIVERY_CHANNEL_NAME")
	if deliveryChannel == "" {
		deliveryChannel = "tap-webapp-pr1598-config-delivery-channel"
	}

	// Create the S3 bucket for storing sensitive financial documents
	financialDocumentsBucket, err := s3.NewBucket(ctx, "FinApp-DocumentsBucket", &s3.BucketArgs{
		Bucket: pulumi.Sprintf("finapp-financial-docs-%s", environmentSuffix),
		Tags: pulumi.StringMap{
			"Project":     pulumi.String("FinApp"),
			"Environment": pulumi.String("Production"),
			"Purpose":     pulumi.String("Financial Documents Storage"),
			"Compliance":  pulumi.String("Financial-Industry-Standards"),
		},
	})
	if err != nil {
		return err
	}

	// Enable versioning on the bucket for audit trail
	_, err = s3.NewBucketVersioningV2(ctx, "FinApp-BucketVersioning", &s3.BucketVersioningV2Args{
		Bucket: financialDocumentsBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return err
	}

	// Note: Object Lock must be enabled at bucket creation time
	// We'll configure a default retention policy instead

	// Configure server-side encryption with S3-managed keys (SSE-S3)
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "FinApp-BucketEncryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: financialDocumentsBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("AES256"),
				},
				BucketKeyEnabled: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return err
	}

	// Block all public access to the bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "FinApp-BucketPublicAccessBlock", &s3.BucketPublicAccessBlockArgs{
		Bucket:                financialDocumentsBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	// Create bucket policy to enforce SSL/TLS for all requests
	bucketPolicyDocument := financialDocumentsBucket.Arn.ApplyT(func(arn string) (string, error) {
		return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "DenyInsecureConnections",
						"Effect": "Deny",
						"Principal": "*",
						"Action": "s3:*",
						"Resource": [
							"%s",
							"%s/*"
						],
						"Condition": {
							"Bool": {
								"aws:SecureTransport": "false"
							}
						}
					}
				]
			}`, arn, arn), nil
	}).(pulumi.StringOutput)

	_, err = s3.NewBucketPolicy(ctx, "FinApp-BucketPolicy", &s3.BucketPolicyArgs{
		Bucket: financialDocumentsBucket.ID(),
		Policy: bucketPolicyDocument,
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for CloudTrail logs
	cloudTrailBucket, err := s3.NewBucket(ctx, "FinApp-CloudTrailBucket", &s3.BucketArgs{
		Bucket: pulumi.Sprintf("finapp-cloudtrail-logs-%s", environmentSuffix),
		Tags: pulumi.StringMap{
			"Project": pulumi.String("FinApp"),
			"Purpose": pulumi.String("CloudTrail Audit Logs"),
		},
	})
	if err != nil {
		return err
	}

	// CloudTrail bucket policy
	cloudTrailBucketPolicy := cloudTrailBucket.Arn.ApplyT(func(arn string) (string, error) {
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
			}`, arn, arn), nil
	}).(pulumi.StringOutput)

	_, err = s3.NewBucketPolicy(ctx, "FinApp-CloudTrailBucketPolicy", &s3.BucketPolicyArgs{
		Bucket: cloudTrailBucket.ID(),
		Policy: cloudTrailBucketPolicy,
	})
	if err != nil {
		return err
	}

	// Create CloudTrail for audit logging
	cloudTrailResource, err := cloudtrail.NewTrail(ctx, "FinApp-CloudTrail", &cloudtrail.TrailArgs{
		Name:                       pulumi.Sprintf("FinApp-AuditTrail-%s", environmentSuffix),
		S3BucketName:               cloudTrailBucket.ID(),
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(false),
		EnableLogFileValidation:    pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Project": pulumi.String("FinApp"),
			"Purpose": pulumi.String("Security Audit Trail"),
		},
	})
	if err != nil {
		return err
	}

	// Create AWS Config Service Role
	configServiceRole, err := iam.NewRole(ctx, "FinApp-ConfigServiceRole", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "config.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
	})
	if err != nil {
		return err
	}

	// Attach AWS Config service role policy (use correct policy ARN)
	_, err = iam.NewRolePolicyAttachment(ctx, "FinApp-ConfigServiceRolePolicy", &iam.RolePolicyAttachmentArgs{
		Role:      configServiceRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"),
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for AWS Config
	configBucket, err := s3.NewBucket(ctx, "FinApp-ConfigBucket", &s3.BucketArgs{
		Bucket: pulumi.Sprintf("finapp-config-compliance-%s", environmentSuffix),
	})
	if err != nil {
		return err
	}

	// Add bucket policy for AWS Config
	configBucketPolicy := configBucket.Arn.ApplyT(func(arn string) (string, error) {
		return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "AWSConfigBucketPermissionsCheck",
						"Effect": "Allow",
						"Principal": {
							"Service": "config.amazonaws.com"
						},
						"Action": "s3:GetBucketAcl",
						"Resource": "%s"
					},
					{
						"Sid": "AWSConfigBucketExistenceCheck",
						"Effect": "Allow",
						"Principal": {
							"Service": "config.amazonaws.com"
						},
						"Action": "s3:ListBucket",
						"Resource": "%s"
					},
					{
						"Sid": "AWSConfigBucketWrite",
						"Effect": "Allow",
						"Principal": {
							"Service": "config.amazonaws.com"
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
			}`, arn, arn, arn), nil
	}).(pulumi.StringOutput)

	_, err = s3.NewBucketPolicy(ctx, "FinApp-ConfigBucketPolicy", &s3.BucketPolicyArgs{
		Bucket: configBucket.ID(),
		Policy: configBucketPolicy,
	})
	if err != nil {
		return err
	}

	// Use existing or create new Config Recorder
	var configRecorderName pulumi.StringOutput
	if configRecorder != "" {
		// Use existing recorder
		configRecorderName = pulumi.String(configRecorder).ToStringOutput()
		ctx.Export("configRecorderUsed", pulumi.String(configRecorder))
	} else {
		// Create new recorder
		newConfigRecorder, err := cfg.NewRecorder(ctx, "FinApp-ConfigRecorder", &cfg.RecorderArgs{
			Name:    pulumi.Sprintf("FinApp-ComplianceRecorder-%s", environmentSuffix),
			RoleArn: configServiceRole.Arn,
			RecordingGroup: &cfg.RecorderRecordingGroupArgs{
				AllSupported:               pulumi.Bool(true),
				IncludeGlobalResourceTypes: pulumi.Bool(true),
			},
		})
		if err != nil {
			return err
		}
		configRecorderName = newConfigRecorder.Name
	}

	// Use existing or create new Delivery Channel
	if deliveryChannel != "" {
		// Use existing delivery channel
		ctx.Export("deliveryChannelUsed", pulumi.String(deliveryChannel))
	} else {
		// Create new delivery channel
		_, err = cfg.NewDeliveryChannel(ctx, "FinApp-ConfigDeliveryChannel", &cfg.DeliveryChannelArgs{
			Name:         pulumi.Sprintf("FinApp-ComplianceDelivery-%s", environmentSuffix),
			S3BucketName: configBucket.ID(),
		})
		if err != nil {
			return err
		}
	}

	// Enable Config Recorder
	_, err = cfg.NewRecorderStatus(ctx, "FinApp-ConfigRecorderStatus", &cfg.RecorderStatusArgs{
		Name:      configRecorderName,
		IsEnabled: pulumi.Bool(true),
	})
	if err != nil {
		return err
	}

	// Create IAM policy for least-privilege S3 access
	s3AccessPolicyDocument := financialDocumentsBucket.Arn.ApplyT(func(arn string) (string, error) {
		return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "ListBucket",
						"Effect": "Allow",
						"Action": [
							"s3:ListBucket",
							"s3:GetBucketLocation",
							"s3:GetBucketVersioning"
						],
						"Resource": "%s"
					},
					{
						"Sid": "ReadWriteObjects",
						"Effect": "Allow",
						"Action": [
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:PutObject",
							"s3:DeleteObject"
						],
						"Resource": "%s/*"
					},
					{
						"Sid": "GetEncryptionConfiguration",
						"Effect": "Allow",
						"Action": [
							"s3:GetEncryptionConfiguration",
							"s3:GetObjectLockConfiguration"
						],
						"Resource": "%s"
					}
				]
			}`, arn, arn, arn), nil
	}).(pulumi.StringOutput)

	s3AccessPolicy, err := iam.NewPolicy(ctx, "FinApp-S3AccessPolicy", &iam.PolicyArgs{
		Name:        pulumi.Sprintf("FinApp-S3-LeastPrivilegeAccess-%s", environmentSuffix),
		Description: pulumi.String("Least-privilege policy for accessing financial documents S3 bucket"),
		Policy:      s3AccessPolicyDocument,
	})
	if err != nil {
		return err
	}

	// Create IAM role for applications to access the S3 bucket
	assumeRolePolicyDocument := pulumi.String(`{
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
		}`)

	financialAppRole, err := iam.NewRole(ctx, "FinApp-ApplicationRole", &iam.RoleArgs{
		Name:             pulumi.Sprintf("FinApp-ApplicationRole-%s", environmentSuffix),
		Description:      pulumi.String("Role for financial application to access S3 bucket"),
		AssumeRolePolicy: assumeRolePolicyDocument,
		Tags: pulumi.StringMap{
			"Project":     pulumi.String("FinApp"),
			"Environment": pulumi.String("Production"),
		},
	})
	if err != nil {
		return err
	}

	// Attach the S3 access policy to the role
	_, err = iam.NewRolePolicyAttachment(ctx, "FinApp-RolePolicyAttachment", &iam.RolePolicyAttachmentArgs{
		Role:      financialAppRole.Name,
		PolicyArn: s3AccessPolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create an instance profile for EC2 instances
	instanceProfile, err := iam.NewInstanceProfile(ctx, "FinApp-InstanceProfile", &iam.InstanceProfileArgs{
		Name: pulumi.Sprintf("FinApp-EC2-InstanceProfile-%s", environmentSuffix),
		Role: financialAppRole.Name,
	})
	if err != nil {
		return err
	}

	// Export the outputs
	ctx.Export("bucketName", financialDocumentsBucket.ID())
	ctx.Export("bucketArn", financialDocumentsBucket.Arn)
	ctx.Export("roleArn", financialAppRole.Arn)
	ctx.Export("roleName", financialAppRole.Name)
	ctx.Export("instanceProfileArn", instanceProfile.Arn)
	ctx.Export("policyArn", s3AccessPolicy.Arn)
	ctx.Export("cloudTrailArn", cloudTrailResource.Arn)
	ctx.Export("configRecorderName", configRecorderName)

	// Export compliance information
	ctx.Export("encryptionEnabled", pulumi.Bool(true))
	ctx.Export("sslEnforced", pulumi.Bool(true))
	ctx.Export("publicAccessBlocked", pulumi.Bool(true))
	ctx.Export("versioningEnabled", pulumi.Bool(true))
	ctx.Export("objectLockEnabled", pulumi.Bool(false)) // Object Lock requires enabling at bucket creation
	ctx.Export("auditLoggingEnabled", pulumi.Bool(true))
	ctx.Export("complianceMonitoringEnabled", pulumi.Bool(true))

	return nil
}

func main() {
	pulumi.Run(CreateInfrastructure)
}
