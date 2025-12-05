package main

import (
	"fmt"
	"os"
	"time"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codecommit"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment variables
		environmentSuffix := getEnv("ENVIRONMENT_SUFFIX", "dev")
		repositoryName := getEnv("REPOSITORY", "unknown")
		commitAuthor := getEnv("COMMIT_AUTHOR", "unknown")
		prNumber := getEnv("PR_NUMBER", "unknown")
		team := getEnv("TEAM", "unknown")
		createdAt := time.Now().UTC().Format(time.RFC3339)
		awsRegion := getEnv("AWS_REGION", "us-east-1")

		// Create default tags
		defaultTags := pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Repository":  pulumi.String(repositoryName),
			"Author":      pulumi.String(commitAuthor),
			"PRNumber":    pulumi.String(prNumber),
			"Team":        pulumi.String(team),
			"CreatedAt":   pulumi.String(createdAt),
			"Compliance":  pulumi.String("PCI-DSS"),
			"Project":     pulumi.String("FinancialPipeline"),
		}

		// Configure AWS provider with default tags
		_, err := aws.NewProvider(ctx, "aws", &aws.ProviderArgs{
			Region: pulumi.String(awsRegion),
			DefaultTags: &aws.ProviderDefaultTagsArgs{
				Tags: defaultTags,
			},
		})
		if err != nil {
			return err
		}

		// 1. Create KMS key for encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("pci-kms-key-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for PCI-DSS compliant CI/CD pipeline encryption"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(30),
			Tags:                 defaultTags,
		})
		if err != nil {
			return err
		}

		// Create KMS alias
		_, err = kms.NewAlias(ctx, fmt.Sprintf("pci-kms-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/pci-cicd-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// 2. Create VPC for isolated build environment
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("pci-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags:               defaultTags,
		})
		if err != nil {
			return err
		}

		// Create private subnets for build environment
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("pci-private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.1.0/24"),
			AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", awsRegion)),
			Tags:             defaultTags,
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("pci-private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.2.0/24"),
			AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", awsRegion)),
			Tags:             defaultTags,
		})
		if err != nil {
			return err
		}

		// Create security group for build environment
		buildSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("pci-build-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for PCI-DSS compliant build environment"),
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: defaultTags,
		})
		if err != nil {
			return err
		}

		// 3. Create S3 bucket for artifacts with encryption
		artifactBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("pci-artifacts-%s", environmentSuffix), &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("pci-cicd-artifacts-%s-%s", environmentSuffix, getEnv("AWS_ACCOUNT_ID", "123456789012"))),
			Tags:   defaultTags,
		})
		if err != nil {
			return err
		}

		// Enable versioning
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("pci-artifacts-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
			Bucket: artifactBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Enable server-side encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pci-artifacts-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
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

		// Enable access logging
		logBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("pci-access-logs-%s", environmentSuffix), &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("pci-cicd-logs-%s-%s", environmentSuffix, getEnv("AWS_ACCOUNT_ID", "123456789012"))),
			Tags:   defaultTags,
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketLoggingV2(ctx, fmt.Sprintf("pci-artifacts-logging-%s", environmentSuffix), &s3.BucketLoggingV2Args{
			Bucket:       artifactBucket.ID(),
			TargetBucket: logBucket.ID(),
			TargetPrefix: pulumi.String("artifact-logs/"),
		})
		if err != nil {
			return err
		}

		// Block public access
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("pci-artifacts-public-block-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
			Bucket:                artifactBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// 4. Create CodeCommit repository with encryption
		repository, err := codecommit.NewRepository(ctx, fmt.Sprintf("pci-repo-%s", environmentSuffix), &codecommit.RepositoryArgs{
			RepositoryName: pulumi.String(fmt.Sprintf("pci-transactions-%s", environmentSuffix)),
			Description:    pulumi.String("PCI-DSS compliant repository for financial transaction processing"),
			KmsKeyId:       kmsKey.Arn,
			Tags:           defaultTags,
		})
		if err != nil {
			return err
		}

		// 5. Create Secrets Manager secret for sensitive data
		secret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("pci-secret-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Name:        pulumi.String(fmt.Sprintf("pci-cicd-secrets-%s", environmentSuffix)),
			Description: pulumi.String("Secrets for PCI-DSS compliant CI/CD pipeline"),
			KmsKeyId:    kmsKey.Arn,
			Tags:        defaultTags,
		})
		if err != nil {
			return err
		}

		// Create initial secret version
		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("pci-secret-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     secret.ID(),
			SecretString: pulumi.String(`{"apiKey":"placeholder","dbPassword":"placeholder"}`),
		})
		if err != nil {
			return err
		}

		// 6. Create CloudWatch log group for audit logging
		logGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("pci-pipeline-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codepipeline/pci-cicd-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(365), // 1 year retention for PCI-DSS compliance
			KmsKeyId:        kmsKey.Arn,
			Tags:            defaultTags,
		})
		if err != nil {
			return err
		}

		// 7. Create IAM role for CodePipeline
		pipelineRolePolicy, err := iam.GetPolicyDocument(ctx, &iam.GetPolicyDocumentArgs{
			Statements: []iam.GetPolicyDocumentStatement{
				{
					Effect: str("Allow"),
					Principals: []iam.GetPolicyDocumentStatementPrincipal{
						{
							Type:        "Service",
							Identifiers: []string{"codepipeline.amazonaws.com"},
						},
					},
					Actions: []string{"sts:AssumeRole"},
				},
			},
		})
		if err != nil {
			return err
		}

		pipelineRole, err := iam.NewRole(ctx, fmt.Sprintf("pci-pipeline-role-%s", environmentSuffix), &iam.RoleArgs{
			Name:             pulumi.String(fmt.Sprintf("pci-codepipeline-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(pipelineRolePolicy.Json),
			Tags:             defaultTags,
		})
		if err != nil {
			return err
		}

		// Attach policies to pipeline role
		pipelinePolicyDoc, err := iam.GetPolicyDocument(ctx, &iam.GetPolicyDocumentArgs{
			Statements: []iam.GetPolicyDocumentStatement{
				{
					Effect: str("Allow"),
					Actions: []string{
						"s3:GetObject",
						"s3:GetObjectVersion",
						"s3:PutObject",
					},
					Resources: []string{
						"arn:aws:s3:::*/*",
					},
				},
				{
					Effect: str("Allow"),
					Actions: []string{
						"codecommit:GetBranch",
						"codecommit:GetCommit",
						"codecommit:UploadArchive",
						"codecommit:GetUploadArchiveStatus",
					},
					Resources: []string{
						"*",
					},
				},
				{
					Effect: str("Allow"),
					Actions: []string{
						"kms:Decrypt",
						"kms:DescribeKey",
						"kms:Encrypt",
						"kms:GenerateDataKey",
					},
					Resources: []string{
						"*",
					},
				},
				{
					Effect: str("Allow"),
					Actions: []string{
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents",
					},
					Resources: []string{
						"*",
					},
				},
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("pci-pipeline-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role:   pipelineRole.ID(),
			Policy: pulumi.String(pipelinePolicyDoc.Json),
		})
		if err != nil {
			return err
		}

		// 8. Create CodePipeline
		pipeline, err := codepipeline.NewPipeline(ctx, fmt.Sprintf("pci-pipeline-%s", environmentSuffix), &codepipeline.PipelineArgs{
			Name:    pulumi.String(fmt.Sprintf("pci-cicd-pipeline-%s", environmentSuffix)),
			RoleArn: pipelineRole.Arn,
			ArtifactStores: codepipeline.PipelineArtifactStoreArray{
				&codepipeline.PipelineArtifactStoreArgs{
					Location: artifactBucket.Bucket,
					Type:     pulumi.String("S3"),
					EncryptionKey: &codepipeline.PipelineArtifactStoreEncryptionKeyArgs{
						Id:   kmsKey.Arn,
						Type: pulumi.String("KMS"),
					},
				},
			},
			Stages: codepipeline.PipelineStageArray{
				// Source stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Source"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("Source"),
							Category: pulumi.String("Source"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeCommit"),
							Version:  pulumi.String("1"),
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("source_output"),
							},
							Configuration: pulumi.StringMap{
								"RepositoryName": repository.RepositoryName,
								"BranchName":     pulumi.String("main"),
							},
						},
					},
				},
				// Build stage would go here (simplified for template)
				// Deploy stage would include manual approval for production
			},
			Tags: defaultTags,
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("repositoryCloneUrlHttp", repository.CloneUrlHttp)
		ctx.Export("repositoryArn", repository.Arn)
		ctx.Export("pipelineArn", pipeline.Arn)
		ctx.Export("artifactBucketName", artifactBucket.Bucket)
		ctx.Export("secretArn", secret.Arn)
		ctx.Export("kmsKeyArn", kmsKey.Arn)
		ctx.Export("logGroupName", logGroup.Name)
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("privateSubnet1Id", privateSubnet1.ID())
		ctx.Export("privateSubnet2Id", privateSubnet2.ID())
		ctx.Export("buildSecurityGroupId", buildSecurityGroup.ID())

		return nil
	})
}

func str(v string) *string { return &v }
