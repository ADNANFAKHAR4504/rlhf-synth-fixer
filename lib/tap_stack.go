package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Create the S3 bucket for storing sensitive financial documents
		financialDocumentsBucket, err := s3.NewBucket(ctx, "FinApp-DocumentsBucket", &s3.BucketArgs{
			Bucket: pulumi.String("finapp-financial-documents"),
			Tags: pulumi.StringMap{
				"Project":     pulumi.String("FinApp"),
				"Environment": pulumi.String("Production"),
				"Purpose":     pulumi.String("Financial Documents Storage"),
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
							"s3:GetEncryptionConfiguration"
						],
						"Resource": "%s"
					}
				]
			}`, arn, arn, arn), nil
		}).(pulumi.StringOutput)

		s3AccessPolicy, err := iam.NewPolicy(ctx, "FinApp-S3AccessPolicy", &iam.PolicyArgs{
			Name:        pulumi.String("FinApp-S3-LeastPrivilegeAccess"),
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
			Name:             pulumi.String("FinApp-ApplicationRole"),
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
			Name: pulumi.String("FinApp-EC2-InstanceProfile"),
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

		// Export compliance information
		ctx.Export("encryptionEnabled", pulumi.Bool(true))
		ctx.Export("sslEnforced", pulumi.Bool(true))
		ctx.Export("publicAccessBlocked", pulumi.Bool(true))
		ctx.Export("versioningEnabled", pulumi.Bool(true))

		return nil
	})
}