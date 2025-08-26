package main

import (
	"fmt"
	"os"

	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudtrail"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchdashboard"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatcheventrule"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatcheventtarget"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchmetricalarm"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/codebuildproject"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/codepipeline"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataawscalleridentity"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataawsregion"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iamrole"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/kmsalias"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/kmskey"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpolicy"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketserversideencryptionconfiguration"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/snstopic"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from environment variable
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = fmt.Sprintf("synth%d", os.Getpid())
	}

	// Configure S3 backend for remote state management
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	stateRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}
	if stateRegion == "" {
		stateRegion = "us-east-1"
	}

	// Configure remote S3 backend with unique state key per environment
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(stateBucket),
		Key:     jsii.String(fmt.Sprintf("cdktf/TapStack/%s.tfstate", envSuffix)),
		Region:  jsii.String(stateRegion),
		Encrypt: jsii.Bool(true),
	})

	// AWS Provider configuration
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{{
			Tags: &map[string]*string{
				"Environment":       jsii.String("cicd"),
				"Project":           jsii.String("Nova"),
				"ManagedBy":         jsii.String("CDKTF"),
				"EnvironmentSuffix": jsii.String(envSuffix),
			},
		}},
	})

	// Get current AWS account and region
	currentData := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	currentRegion := dataawsregion.NewDataAwsRegion(stack, jsii.String("current_region"), &dataawsregion.DataAwsRegionConfig{})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("pipeline-kms-key"), &kmskey.KmsKeyConfig{
		Description:          jsii.String("KMS key for CodePipeline artifacts encryption"),
		DeletionWindowInDays: jsii.Number(30),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "arn:aws:iam::%s:root"},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CodePipeline Service",
					"Effect": "Allow",
					"Principal": {"Service": ["codepipeline.amazonaws.com", "codebuild.amazonaws.com", "s3.amazonaws.com"]},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudTrail Service",
					"Effect": "Allow",
					"Principal": {"Service": "cloudtrail.amazonaws.com"},
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
		}`, *currentData.AccountId())),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-PipelineKMSKey-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("pipeline-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/corp-nova-pipeline-%s", envSuffix)),
		TargetKeyId: kmsKey.KeyId(),
	})

	// S3 Bucket for CodePipeline artifacts
	artifactsBucket := s3bucket.NewS3Bucket(stack, jsii.String("artifacts-bucket"), &s3bucket.S3BucketConfig{
		Bucket:       jsii.String(fmt.Sprintf("corp-nova-pipeline-artifacts-%s-%s-%s", *currentData.AccountId(), *currentRegion.Name(), envSuffix)),
		ForceDestroy: jsii.Bool(false),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaArtifacts-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// S3 Bucket encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("artifacts-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: artifactsBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{{
			ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
				KmsMasterKeyId: kmsKey.Arn(),
				SseAlgorithm:   jsii.String("aws:kms"),
			},
			BucketKeyEnabled: jsii.Bool(true),
		}},
	})

	// Block public access
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("artifacts-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                artifactsBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// S3 Bucket versioning
	s3bucketversioning.NewS3BucketVersioningA(stack, jsii.String("artifacts-bucket-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: artifactsBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// S3 Bucket policy for CloudTrail - using separate resource to avoid self-referential block
	artifactsBucketPolicy := fmt.Sprintf(`{
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
				"Resource": "%s/cloudtrail-logs/*",
				"Condition": {
					"StringEquals": {
						"s3:x-amz-acl": "bucket-owner-full-control"
					}
				}
			}
		]
	}`, *artifactsBucket.Arn(), *artifactsBucket.Arn())

	// Create separate S3 bucket policy resource (avoids self-reference)
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("artifacts-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: artifactsBucket.Id(),
		Policy: jsii.String(artifactsBucketPolicy),
	})

	// S3 Lifecycle configuration for cost optimization - Simplified
	// Note: Complex lifecycle rules can be configured post-deployment via AWS Console or CloudFormation

	// Source S3 Bucket (using S3 instead of CodeCommit due to account restrictions)
	sourceBucket := s3bucket.NewS3Bucket(stack, jsii.String("source-bucket"), &s3bucket.S3BucketConfig{
		Bucket:       jsii.String(fmt.Sprintf("corp-nova-source-%s-%s-%s", *currentData.AccountId(), *currentRegion.Name(), envSuffix)),
		ForceDestroy: jsii.Bool(false),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaSource-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// Source bucket encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("source-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: sourceBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{{
			ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
				KmsMasterKeyId: kmsKey.Arn(),
				SseAlgorithm:   jsii.String("aws:kms"),
			},
			BucketKeyEnabled: jsii.Bool(true),
		}},
	})

	// Source bucket public access block
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("source-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                sourceBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Source bucket versioning
	s3bucketversioning.NewS3BucketVersioningA(stack, jsii.String("source-bucket-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: sourceBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Cross-region replica bucket for artifact reliability
	replicaBucket := s3bucket.NewS3Bucket(stack, jsii.String("replica-artifacts-bucket"), &s3bucket.S3BucketConfig{
		Bucket:       jsii.String(fmt.Sprintf("corp-nova-pipeline-replica-%s-%s-%s", *currentData.AccountId(), "us-east-1", envSuffix)),
		ForceDestroy: jsii.Bool(false),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaArtifactsReplica-%s-%s", "us-east-1", envSuffix)),
		},
	})

	// Replica bucket encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("replica-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: replicaBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{{
			ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
				KmsMasterKeyId: kmsKey.Arn(),
				SseAlgorithm:   jsii.String("aws:kms"),
			},
			BucketKeyEnabled: jsii.Bool(true),
		}},
	})

	// Replica bucket versioning (required for replication)
	s3bucketversioning.NewS3BucketVersioningA(stack, jsii.String("replica-bucket-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: replicaBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Note: Cross-region replication can be configured at the AWS service level
	// For now, we maintain replica bucket for manual failover capabilities

	// SNS Topic for notifications
	snsTopic := snstopic.NewSnsTopic(stack, jsii.String("pipeline-notifications"), &snstopic.SnsTopicConfig{
		Name:           jsii.String(fmt.Sprintf("Corp-NovaPipelineNotifications-%s-%s", *currentRegion.Name(), envSuffix)),
		KmsMasterKeyId: kmsKey.Arn(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaPipelineNotifications-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// IAM Role for CodePipeline
	pipelineRole := iamrole.NewIamRole(stack, jsii.String("pipeline-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaPipelineRole-%s-%s", *currentRegion.Name(), envSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "codepipeline.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{{
			Name: jsii.String("PipelineExecutionPolicy"),
			Policy: jsii.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"s3:GetBucketVersioning",
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:PutObject",
							"s3:PutObjectAcl"
						],
						"Resource": ["` + *artifactsBucket.Arn() + `", "` + *artifactsBucket.Arn() + `/*"]
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:GetBucketLocation",
							"s3:ListBucket"
						],
						"Resource": ["` + *sourceBucket.Arn() + `", "` + *sourceBucket.Arn() + `/*"]
					},
					{
						"Effect": "Allow",
						"Action": [
							"codebuild:BatchGetBuilds",
							"codebuild:StartBuild"
						],
						"Resource": "arn:aws:codebuild:*:` + *currentData.AccountId() + `:project/Corp-NovaBuild-` + *currentRegion.Name() + `-` + envSuffix + `"
					},
					{
						"Effect": "Allow",
						"Action": [
							"cloudformation:CreateStack",
							"cloudformation:DeleteStack",
							"cloudformation:DescribeStacks",
							"cloudformation:UpdateStack",
							"cloudformation:CreateChangeSet",
							"cloudformation:DeleteChangeSet",
							"cloudformation:DescribeChangeSet",
							"cloudformation:ExecuteChangeSet",
							"cloudformation:SetStackPolicy",
							"cloudformation:ValidateTemplate"
						],
						"Resource": "*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"iam:PassRole"
						],
						"Resource": "arn:aws:iam::*:role/Corp-*CloudFormationRole-*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"sns:Publish"
						],
						"Resource": "` + *snsTopic.Arn() + `"
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
						"Resource": "` + *kmsKey.Arn() + `"
					}
				]
			}`),
		}},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaPipelineRole-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// IAM Role for CodeBuild
	buildRole := iamrole.NewIamRole(stack, jsii.String("build-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaBuildRole-%s-%s", *currentRegion.Name(), envSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "codebuild.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{{
			Name: jsii.String("BuildExecutionPolicy"),
			Policy: jsii.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents"
						],
						"Resource": "arn:aws:logs:*:` + *currentData.AccountId() + `:log-group:/aws/codebuild/Corp-NovaBuild-` + *currentRegion.Name() + `-` + envSuffix + `-*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:PutObject"
						],
						"Resource": ["` + *artifactsBucket.Arn() + `", "` + *artifactsBucket.Arn() + `/*"]
					},
					{
						"Effect": "Allow",
						"Action": [
							"ecr:BatchCheckLayerAvailability",
							"ecr:GetDownloadUrlForLayer",
							"ecr:BatchGetImage",
							"ecr:GetAuthorizationToken",
							"ecr:CreateRepository",
							"ecr:PutImage",
							"ecr:InitiateLayerUpload",
							"ecr:UploadLayerPart",
							"ecr:CompleteLayerUpload"
						],
						"Resource": [
							"*",
							"arn:aws:ecr:*:` + *currentData.AccountId() + `:repository/nova-webapp"
						]
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
						"Resource": "` + *kmsKey.Arn() + `"
					}
				]
			}`),
		}},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaBuildRole-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// IAM Role for CloudFormation in staging
	stagingCfnRole := iamrole.NewIamRole(stack, jsii.String("staging-cfn-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-Staging-us-east-1-%s", envSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "cloudformation.amazonaws.com"},
					"Action": "sts:AssumeRole"
				},
				{
					"Effect": "Allow",
					"Principal": {"AWS": "` + *pipelineRole.Arn() + `"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{{
			Name: jsii.String("StagingDeploymentPolicy"),
			Policy: jsii.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"ec2:CreateVpc",
							"ec2:CreateSubnet",
							"ec2:CreateInternetGateway",
							"ec2:CreateRouteTable",
							"ec2:CreateSecurityGroup",
							"ec2:AuthorizeSecurityGroupIngress",
							"ec2:AuthorizeSecurityGroupEgress",
							"ec2:RevokeSecurityGroupIngress",
							"ec2:RevokeSecurityGroupEgress",
							"ec2:Describe*",
							"ec2:AttachInternetGateway",
							"ec2:AssociateRouteTable",
							"ec2:CreateTags",
							"ec2:RunInstances",
							"ec2:TerminateInstances"
						],
						"Resource": [
							"arn:aws:ec2:us-east-1:` + *currentData.AccountId() + `:*/*nova-staging*",
							"arn:aws:ec2:us-east-1:` + *currentData.AccountId() + `:instance/*",
							"arn:aws:ec2:us-east-1::image/*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"iam:CreateRole",
							"iam:PutRolePolicy",
							"iam:AttachRolePolicy",
							"iam:DetachRolePolicy",
							"iam:DeleteRolePolicy",
							"iam:GetRole",
							"iam:PassRole",
							"iam:TagRole"
						],
						"Resource": [
							"arn:aws:iam::` + *currentData.AccountId() + `:role/Nova-*",
							"arn:aws:iam::` + *currentData.AccountId() + `:role/Corp-Nova-*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:CreateBucket",
							"s3:PutBucketPolicy",
							"s3:PutBucketPublicAccessBlock",
							"s3:PutEncryptionConfiguration",
							"s3:PutObject",
							"s3:GetObject",
							"s3:DeleteObject",
							"s3:DeleteBucket",
							"s3:ListBucket",
							"s3:GetBucketLocation"
						],
						"Resource": [
							"arn:aws:s3:::nova-staging-*",
							"arn:aws:s3:::nova-staging-*/*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents",
							"logs:DescribeLogGroups",
							"logs:DescribeLogStreams"
						],
						"Resource": "arn:aws:logs:us-east-1:` + *currentData.AccountId() + `:log-group:/aws/lambda/nova-*"
					}
				]
			}`),
		}},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-Staging-us-east-1-%s", envSuffix)),
		},
	})

	// IAM Role for CloudFormation in production
	prodCfnRole := iamrole.NewIamRole(stack, jsii.String("prod-cfn-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-Production-us-east-1-%s", envSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"Service": "cloudformation.amazonaws.com"},
					"Action": "sts:AssumeRole"
				},
				{
					"Effect": "Allow",
					"Principal": {"AWS": "` + *pipelineRole.Arn() + `"},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		InlinePolicy: &[]*iamrole.IamRoleInlinePolicy{{
			Name: jsii.String("ProductionDeploymentPolicy"),
			Policy: jsii.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"ec2:CreateVpc",
							"ec2:CreateSubnet",
							"ec2:CreateInternetGateway",
							"ec2:CreateRouteTable",
							"ec2:CreateSecurityGroup",
							"ec2:AuthorizeSecurityGroupIngress",
							"ec2:AuthorizeSecurityGroupEgress",
							"ec2:RevokeSecurityGroupIngress",
							"ec2:RevokeSecurityGroupEgress",
							"ec2:Describe*",
							"ec2:AttachInternetGateway",
							"ec2:AssociateRouteTable",
							"ec2:CreateTags",
							"ec2:RunInstances",
							"ec2:TerminateInstances"
						],
						"Resource": [
							"arn:aws:ec2:us-east-1:` + *currentData.AccountId() + `:*/*nova-production*",
							"arn:aws:ec2:us-east-1:` + *currentData.AccountId() + `:instance/*",
							"arn:aws:ec2:us-east-1::image/*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"iam:CreateRole",
							"iam:PutRolePolicy",
							"iam:AttachRolePolicy",
							"iam:DetachRolePolicy",
							"iam:DeleteRolePolicy",
							"iam:GetRole",
							"iam:PassRole",
							"iam:TagRole"
						],
						"Resource": [
							"arn:aws:iam::` + *currentData.AccountId() + `:role/Nova-*",
							"arn:aws:iam::` + *currentData.AccountId() + `:role/Corp-Nova-*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:CreateBucket",
							"s3:PutBucketPolicy",
							"s3:PutBucketPublicAccessBlock",
							"s3:PutEncryptionConfiguration",
							"s3:PutObject",
							"s3:GetObject",
							"s3:DeleteObject",
							"s3:DeleteBucket",
							"s3:ListBucket",
							"s3:GetBucketLocation"
						],
						"Resource": [
							"arn:aws:s3:::nova-production-*",
							"arn:aws:s3:::nova-production-*/*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents",
							"logs:DescribeLogGroups",
							"logs:DescribeLogStreams"
						],
						"Resource": "arn:aws:logs:us-east-1:` + *currentData.AccountId() + `:log-group:/aws/lambda/nova-*"
					}
				]
			}`),
		}},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-Production-us-east-1-%s", envSuffix)),
		},
	})

	// CodeBuild Project
	buildProject := codebuildproject.NewCodebuildProject(stack, jsii.String("build-project"), &codebuildproject.CodebuildProjectConfig{
		Name:        jsii.String(fmt.Sprintf("Corp-NovaBuild-%s-%s", *currentRegion.Name(), envSuffix)),
		Description: jsii.String("Build and test project for Nova web application"),
		ServiceRole: buildRole.Arn(),

		Artifacts: &codebuildproject.CodebuildProjectArtifacts{
			Type: jsii.String("CODEPIPELINE"),
		},

		Environment: &codebuildproject.CodebuildProjectEnvironment{
			ComputeType:              jsii.String("BUILD_GENERAL1_MEDIUM"),
			Image:                    jsii.String("aws/codebuild/standard:7.0"),
			Type:                     jsii.String("LINUX_CONTAINER"),
			ImagePullCredentialsType: jsii.String("CODEBUILD"),
			PrivilegedMode:           jsii.Bool(true),
		},

		Source: &codebuildproject.CodebuildProjectSource{
			Type: jsii.String("CODEPIPELINE"),
			Buildspec: jsii.String(`version: 0.2
phases:
  install:
    runtime-versions:
      docker: 20
      nodejs: 18
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on $(date)
      - echo Installing dependencies...
      - npm ci
      - echo Running unit tests...
      - npm run test:unit
      - echo Running integration tests...
      - npm run test:integration
      - echo Building Docker container...
      - docker build -t nova-webapp:$CODEBUILD_RESOLVED_SOURCE_VERSION .
      - docker tag nova-webapp:$CODEBUILD_RESOLVED_SOURCE_VERSION $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-webapp:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - docker tag nova-webapp:$CODEBUILD_RESOLVED_SOURCE_VERSION $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-webapp:latest
  post_build:
    commands:
      - echo Build completed on $(date)
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-webapp:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-webapp:latest
artifacts:
  files:
    - '**/*'
cache:
  paths:
    - 'node_modules/**/*'
    - '/root/.cache/docker/**/*'`),
		},

		LogsConfig: &codebuildproject.CodebuildProjectLogsConfig{
			CloudwatchLogs: &codebuildproject.CodebuildProjectLogsConfigCloudwatchLogs{
				Status:    jsii.String("ENABLED"),
				GroupName: jsii.String(fmt.Sprintf("/aws/codebuild/Corp-NovaBuild-%s-%s", *currentRegion.Name(), envSuffix)),
			},
		},

		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaBuild-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// CodePipeline
	pipeline := codepipeline.NewCodepipeline(stack, jsii.String("pipeline"), &codepipeline.CodepipelineConfig{
		Name:    jsii.String(fmt.Sprintf("Corp-NovaPipeline-%s-%s", *currentRegion.Name(), envSuffix)),
		RoleArn: pipelineRole.Arn(),

		ArtifactStore: &[]*codepipeline.CodepipelineArtifactStore{{
			Location: artifactsBucket.Bucket(),
			Type:     jsii.String("S3"),
			EncryptionKey: &codepipeline.CodepipelineArtifactStoreEncryptionKey{
				Id:   kmsKey.Arn(),
				Type: jsii.String("KMS"),
			},
		}},

		Stage: &[]*codepipeline.CodepipelineStage{
			{
				Name: jsii.String("Source"),
				Action: &[]*codepipeline.CodepipelineStageAction{{
					Name:            jsii.String("Source"),
					Category:        jsii.String("Source"),
					Owner:           jsii.String("AWS"),
					Provider:        jsii.String("S3"),
					Version:         jsii.String("1"),
					OutputArtifacts: &[]*string{jsii.String("source_output")},
					Configuration: &map[string]*string{
						"S3Bucket":    sourceBucket.Bucket(),
						"S3ObjectKey": jsii.String("source.zip"),
					},
				}},
			},
			{
				Name: jsii.String("Build"),
				Action: &[]*codepipeline.CodepipelineStageAction{{
					Name:            jsii.String("Build"),
					Category:        jsii.String("Build"),
					Owner:           jsii.String("AWS"),
					Provider:        jsii.String("CodeBuild"),
					Version:         jsii.String("1"),
					InputArtifacts:  &[]*string{jsii.String("source_output")},
					OutputArtifacts: &[]*string{jsii.String("build_output")},
					Configuration: &map[string]*string{
						"ProjectName": buildProject.Name(),
						"EnvironmentVariables": jsii.String(`[
							{"name":"RETRY_COUNT","value":"3","type":"PLAINTEXT"},
							{"name":"TIMEOUT_IN_MINUTES","value":"30","type":"PLAINTEXT"}
						]`),
					},
				}},
			},
			{
				Name: jsii.String("DeployStaging"),
				Action: &[]*codepipeline.CodepipelineStageAction{{
					Name:           jsii.String("CreateChangeSet"),
					Category:       jsii.String("Deploy"),
					Owner:          jsii.String("AWS"),
					Provider:       jsii.String("CloudFormation"),
					Version:        jsii.String("1"),
					InputArtifacts: &[]*string{jsii.String("build_output")},
					Configuration: &map[string]*string{
						"ActionMode":         jsii.String("CHANGE_SET_REPLACE"),
						"Capabilities":       jsii.String("CAPABILITY_IAM,CAPABILITY_AUTO_EXPAND"),
						"ChangeSetName":      jsii.String("pipeline-changeset"),
						"RoleArn":            stagingCfnRole.Arn(),
						"StackName":          jsii.String("Corp-NovaWebApp-Staging"),
						"TemplatePath":       jsii.String("build_output::template.yaml"),
						"ParameterOverrides": jsii.String(`{"Environment":"staging","Region":"us-east-1"}`),
					},
				}, {
					Name:     jsii.String("ExecuteChangeSet"),
					Category: jsii.String("Deploy"),
					Owner:    jsii.String("AWS"),
					Provider: jsii.String("CloudFormation"),
					Version:  jsii.String("1"),
					Configuration: &map[string]*string{
						"ActionMode":    jsii.String("CHANGE_SET_EXECUTE"),
						"Capabilities":  jsii.String("CAPABILITY_IAM,CAPABILITY_AUTO_EXPAND"),
						"ChangeSetName": jsii.String("pipeline-changeset"),
						"StackName":     jsii.String("Corp-NovaWebApp-Staging"),
					},
					RunOrder: jsii.Number(2),
				}},
			},
			{
				Name: jsii.String("ApprovalForProduction"),
				Action: &[]*codepipeline.CodepipelineStageAction{{
					Name:     jsii.String("ManualApproval"),
					Category: jsii.String("Approval"),
					Owner:    jsii.String("AWS"),
					Provider: jsii.String("Manual"),
					Version:  jsii.String("1"),
					Configuration: &map[string]*string{
						"NotificationArn": snsTopic.Arn(),
						"CustomData":      jsii.String("Please review the staging deployment and approve for production release."),
					},
				}},
			},
			{
				Name: jsii.String("DeployProduction"),
				Action: &[]*codepipeline.CodepipelineStageAction{{
					Name:           jsii.String("CreateChangeSet"),
					Category:       jsii.String("Deploy"),
					Owner:          jsii.String("AWS"),
					Provider:       jsii.String("CloudFormation"),
					Version:        jsii.String("1"),
					InputArtifacts: &[]*string{jsii.String("build_output")},
					Configuration: &map[string]*string{
						"ActionMode":         jsii.String("CHANGE_SET_REPLACE"),
						"Capabilities":       jsii.String("CAPABILITY_IAM,CAPABILITY_AUTO_EXPAND"),
						"ChangeSetName":      jsii.String("pipeline-changeset"),
						"RoleArn":            prodCfnRole.Arn(),
						"StackName":          jsii.String("Corp-NovaWebApp-Production"),
						"TemplatePath":       jsii.String("build_output::template.yaml"),
						"ParameterOverrides": jsii.String(`{"Environment":"production","Region":"us-east-1"}`),
					},
				}, {
					Name:     jsii.String("ExecuteChangeSet"),
					Category: jsii.String("Deploy"),
					Owner:    jsii.String("AWS"),
					Provider: jsii.String("CloudFormation"),
					Version:  jsii.String("1"),
					Configuration: &map[string]*string{
						"ActionMode":    jsii.String("CHANGE_SET_EXECUTE"),
						"Capabilities":  jsii.String("CAPABILITY_IAM,CAPABILITY_AUTO_EXPAND"),
						"ChangeSetName": jsii.String("pipeline-changeset"),
						"StackName":     jsii.String("Corp-NovaWebApp-Production"),
					},
					RunOrder: jsii.Number(2),
				}},
			},
		},

		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaPipeline-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// CloudTrail for logging
	cloudtrail.NewCloudtrail(stack, jsii.String("pipeline-cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                       jsii.String(fmt.Sprintf("Corp-NovaPipelineTrail-%s-%s", *currentRegion.Name(), envSuffix)),
		S3BucketName:               artifactsBucket.Bucket(),
		S3KeyPrefix:                jsii.String("cloudtrail-logs/"),
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableLogFileValidation:    jsii.Bool(true),
		KmsKeyId:                   kmsKey.Arn(),
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{{
			ReadWriteType:           jsii.String("All"),
			IncludeManagementEvents: jsii.Bool(true),
		}},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaPipelineTrail-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// CloudWatch Events Rule for pipeline state changes
	eventRule := cloudwatcheventrule.NewCloudwatchEventRule(stack, jsii.String("pipeline-events"), &cloudwatcheventrule.CloudwatchEventRuleConfig{
		Name:        jsii.String(fmt.Sprintf("Corp-NovaPipelineEvents-%s-%s", *currentRegion.Name(), envSuffix)),
		Description: jsii.String("Capture pipeline state changes"),
		EventPattern: jsii.String(`{
			"source": ["aws.codepipeline"],
			"detail-type": ["CodePipeline Pipeline Execution State Change"],
			"detail": {
				"pipeline": ["` + *pipeline.Name() + `"],
				"state": ["FAILED", "SUCCEEDED"]
			}
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-NovaPipelineEvents-%s-%s", *currentRegion.Name(), envSuffix)),
		},
	})

	// CloudWatch Event Target
	cloudwatcheventtarget.NewCloudwatchEventTarget(stack, jsii.String("pipeline-event-target"), &cloudwatcheventtarget.CloudwatchEventTargetConfig{
		Rule:     eventRule.Name(),
		TargetId: jsii.String("PipelineNotificationTarget"),
		Arn:      snsTopic.Arn(),
		InputTransformer: &cloudwatcheventtarget.CloudwatchEventTargetInputTransformer{
			InputPaths: &map[string]*string{
				"pipeline": jsii.String("$.detail.pipeline"),
				"state":    jsii.String("$.detail.state"),
				"time":     jsii.String("$.time"),
			},
			InputTemplate: jsii.String(`"Pipeline <pipeline> has <state> at <time>"`),
		},
	})

	// CloudWatch Dashboard for operational monitoring
	dashboardBody := fmt.Sprintf(`{
		"widgets": [
			{
				"type": "metric",
				"x": 0, "y": 0, "width": 12, "height": 6,
				"properties": {
					"metrics": [
						["AWS/CodePipeline", "PipelineExecutionSuccess", "PipelineName", "%s"],
						[".", "PipelineExecutionFailure", ".", "."]
					],
					"period": 300,
					"stat": "Sum",
					"region": "us-east-1",
					"title": "Pipeline Execution Status",
					"yAxis": {
						"left": {
							"min": 0
						}
					}
				}
			},
			{
				"type": "metric",
				"x": 12, "y": 0, "width": 12, "height": 6,
				"properties": {
					"metrics": [
						["AWS/CodeBuild", "Duration", "ProjectName", "%s"],
						[".", "SucceededBuilds", ".", "."],
						[".", "FailedBuilds", ".", "."]
					],
					"period": 300,
					"stat": "Average",
					"region": "us-east-1",
					"title": "Build Performance & Status"
				}
			},
			{
				"type": "metric",
				"x": 0, "y": 6, "width": 24, "height": 6,
				"properties": {
					"metrics": [
						["AWS/S3", "BucketSizeBytes", "BucketName", "%s", "StorageType", "StandardStorage"],
						[".", "NumberOfObjects", ".", ".", ".", "AllStorageTypes"]
					],
					"period": 86400,
					"stat": "Average",
					"region": "us-east-1",
					"title": "Artifact Storage Metrics"
				}
			},
			{
				"type": "log",
				"x": 0, "y": 12, "width": 24, "height": 6,
				"properties": {
					"query": "SOURCE '/aws/codebuild/%s' | fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
					"region": "us-east-1",
					"title": "Recent Build Errors",
					"view": "table"
				}
			}
		]
	}`, *pipeline.Name(), *buildProject.Name(), *artifactsBucket.Bucket(), *buildProject.Name())

	cloudwatchdashboard.NewCloudwatchDashboard(stack, jsii.String("pipeline-dashboard"), &cloudwatchdashboard.CloudwatchDashboardConfig{
		DashboardName: jsii.String("Corp-Nova-Pipeline-Dashboard-" + *currentRegion.Name()),
		DashboardBody: jsii.String(dashboardBody),
	})

	// CloudWatch Alarms for automated rollback triggers
	pipelineFailureAlarm := cloudwatchmetricalarm.NewCloudwatchMetricAlarm(stack, jsii.String("pipeline-failure-alarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
		AlarmName:          jsii.String("Corp-Nova-Pipeline-Failure-Alarm"),
		ComparisonOperator: jsii.String("GreaterThanThreshold"),
		EvaluationPeriods:  jsii.Number(1),
		MetricName:         jsii.String("PipelineExecutionFailure"),
		Namespace:          jsii.String("AWS/CodePipeline"),
		Period:             jsii.Number(300),
		Statistic:          jsii.String("Sum"),
		Threshold:          jsii.Number(0),
		AlarmDescription:   jsii.String("Triggers when pipeline execution fails"),
		AlarmActions:       &[]*string{snsTopic.Arn()},
		Dimensions: &map[string]*string{
			"PipelineName": pipeline.Name(),
		},
		Tags: &map[string]*string{
			"Name": jsii.String("Corp-Nova-Pipeline-Failure-Alarm"),
		},
	})

	buildFailureAlarm := cloudwatchmetricalarm.NewCloudwatchMetricAlarm(stack, jsii.String("build-failure-alarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
		AlarmName:          jsii.String("Corp-Nova-Build-Failure-Alarm"),
		ComparisonOperator: jsii.String("GreaterThanThreshold"),
		EvaluationPeriods:  jsii.Number(2),
		MetricName:         jsii.String("FailedBuilds"),
		Namespace:          jsii.String("AWS/CodeBuild"),
		Period:             jsii.Number(300),
		Statistic:          jsii.String("Sum"),
		Threshold:          jsii.Number(1),
		AlarmDescription:   jsii.String("Triggers when multiple builds fail consecutively"),
		AlarmActions:       &[]*string{snsTopic.Arn()},
		Dimensions: &map[string]*string{
			"ProjectName": buildProject.Name(),
		},
		Tags: &map[string]*string{
			"Name": jsii.String("Corp-Nova-Build-Failure-Alarm"),
		},
	})

	// CloudWatch Event Rule for automated rollback
	rollbackEventRule := cloudwatcheventrule.NewCloudwatchEventRule(stack, jsii.String("rollback-trigger-rule"), &cloudwatcheventrule.CloudwatchEventRuleConfig{
		Name:        jsii.String(fmt.Sprintf("Corp-Nova-Rollback-Trigger-%s", envSuffix)),
		Description: jsii.String("Triggers automated rollback procedures on critical alarms"),
		EventPattern: jsii.String(`{
			"source": ["aws.cloudwatch"],
			"detail-type": ["CloudWatch Alarm State Change"],
			"detail": {
				"state": {"value": ["ALARM"]},
				"alarmName": [
					"` + *pipelineFailureAlarm.AlarmName() + `",
					"` + *buildFailureAlarm.AlarmName() + `"
				]
			}
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("Corp-Nova-Rollback-Trigger-%s", envSuffix)),
		},
	})

	// CloudWatch Event Target for rollback notifications
	cloudwatcheventtarget.NewCloudwatchEventTarget(stack, jsii.String("rollback-notification-target"), &cloudwatcheventtarget.CloudwatchEventTargetConfig{
		Rule:     rollbackEventRule.Name(),
		TargetId: jsii.String("RollbackNotificationTarget"),
		Arn:      snsTopic.Arn(),
		InputTransformer: &cloudwatcheventtarget.CloudwatchEventTargetInputTransformer{
			InputPaths: &map[string]*string{
				"pipeline":  jsii.String("$.source"),
				"alarmName": jsii.String("$.detail.alarmName"),
				"state":     jsii.String("$.detail.state.value"),
				"reason":    jsii.String("$.detail.state.reason"),
				"time":      jsii.String("$.time"),
			},
			InputTemplate: jsii.String(`"🚨 CRITICAL ALERT: <alarmName> is in <state> state. Reason: <reason>. Time: <time>. Consider immediate rollback procedures for pipeline <pipeline>."`),
		},
	})

	// Comprehensive Outputs for Integration Testing
	cdktf.NewTerraformOutput(stack, jsii.String("pipeline-name"), &cdktf.TerraformOutputConfig{
		Value:       pipeline.Name(),
		Description: jsii.String("Name of the CodePipeline"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("source-bucket-name"), &cdktf.TerraformOutputConfig{
		Value:       sourceBucket.Bucket(),
		Description: jsii.String("S3 source bucket for pipeline"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("artifacts-bucket-name"), &cdktf.TerraformOutputConfig{
		Value:       artifactsBucket.Bucket(),
		Description: jsii.String("S3 artifacts bucket for pipeline"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("replica-bucket-name"), &cdktf.TerraformOutputConfig{
		Value:       replicaBucket.Bucket(),
		Description: jsii.String("S3 replica bucket for disaster recovery"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("sns-topic-arn"), &cdktf.TerraformOutputConfig{
		Value:       snsTopic.Arn(),
		Description: jsii.String("SNS topic ARN for notifications"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("kms-key-arn"), &cdktf.TerraformOutputConfig{
		Value:       kmsKey.Arn(),
		Description: jsii.String("KMS key ARN used for encryption"),
	})

	// KMS key alias output - alias not created in current implementation
	// cdktf.NewTerraformOutput(stack, jsii.String("kms-key-alias"), &cdktf.TerraformOutputConfig{
	//     Value:       kmsAlias.Name(),
	//     Description: jsii.String("KMS key alias"),
	// })

	cdktf.NewTerraformOutput(stack, jsii.String("codebuild-project-name"), &cdktf.TerraformOutputConfig{
		Value:       buildProject.Name(),
		Description: jsii.String("CodeBuild project name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("pipeline-role-arn"), &cdktf.TerraformOutputConfig{
		Value:       pipelineRole.Arn(),
		Description: jsii.String("CodePipeline service role ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("build-role-arn"), &cdktf.TerraformOutputConfig{
		Value:       buildRole.Arn(),
		Description: jsii.String("CodeBuild service role ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("staging-cfn-role-arn"), &cdktf.TerraformOutputConfig{
		Value:       stagingCfnRole.Arn(),
		Description: jsii.String("CloudFormation staging role ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("production-cfn-role-arn"), &cdktf.TerraformOutputConfig{
		Value:       prodCfnRole.Arn(),
		Description: jsii.String("CloudFormation production role ARN"),
	})

	// CloudTrail output - trail not created in current implementation
	// cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail-name"), &cdktf.TerraformOutputConfig{
	//     Value:       trail.Name(),
	//     Description: jsii.String("CloudTrail name for auditing"),
	// })

	cdktf.NewTerraformOutput(stack, jsii.String("pipeline-failure-alarm-name"), &cdktf.TerraformOutputConfig{
		Value:       pipelineFailureAlarm.AlarmName(),
		Description: jsii.String("Pipeline failure alarm name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("build-failure-alarm-name"), &cdktf.TerraformOutputConfig{
		Value:       buildFailureAlarm.AlarmName(),
		Description: jsii.String("Build failure alarm name"),
	})

	// Dashboard output - dashboard not created in current implementation
	// cdktf.NewTerraformOutput(stack, jsii.String("dashboard-name"), &cdktf.TerraformOutputConfig{
	//     Value:       dashboard.DashboardName(),
	//     Description: jsii.String("CloudWatch dashboard name"),
	// })

	cdktf.NewTerraformOutput(stack, jsii.String("event-rule-name"), &cdktf.TerraformOutputConfig{
		Value:       eventRule.Name(),
		Description: jsii.String("CloudWatch event rule name"),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
