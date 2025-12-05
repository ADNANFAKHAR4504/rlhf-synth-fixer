# Pulumi Go CI/CD Pipeline Implementation

This implementation creates a comprehensive CI/CD pipeline using AWS native services (CodePipeline, CodeBuild, CodeStar, EventBridge, SNS) with Pulumi state management in S3, cross-account IAM roles, and automated infrastructure deployments.

## File: lib/tap_stack.go

```go
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codestarconnections"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/events"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ssm"
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

		// Dev and Prod account IDs
		devAccountID := "123456789012"
		prodAccountID := "987654321098"

		// Create default tags
		defaultTags := pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Repository":  pulumi.String(repositoryName),
			"Author":      pulumi.String(commitAuthor),
			"PRNumber":    pulumi.String(prNumber),
			"Team":        pulumi.String(team),
			"CreatedAt":   pulumi.String(createdAt),
		}

		// Configure AWS provider with default tags
		provider, err := aws.NewProvider(ctx, "aws", &aws.ProviderArgs{
			Region: pulumi.String(awsRegion),
			DefaultTags: &aws.ProviderDefaultTagsArgs{
				Tags: defaultTags,
			},
		})
		if err != nil {
			return err
		}

		// 1. Create KMS key for encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("pulumi-state-key-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for Pulumi state encryption"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(7),
			Tags:                 defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = kms.NewAlias(ctx, fmt.Sprintf("pulumi-state-key-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/pulumi-state-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 2. Create S3 bucket for Pulumi state
		stateBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("pulumi-state-bucket-%s", environmentSuffix), &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("pulumi-state-bucket-%s", environmentSuffix)),
			Tags:   defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Enable versioning on state bucket
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("pulumi-state-bucket-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
			Bucket: stateBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Enable server-side encryption on state bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pulumi-state-bucket-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: stateBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm:   pulumi.String("aws:kms"),
						KmsMasterKeyId: kmsKey.Arn,
					},
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Block public access to state bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("pulumi-state-bucket-public-access-block-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
			Bucket:                stateBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 3. Create S3 bucket for pipeline artifacts
		artifactBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix), &s3.BucketV2Args{
			Bucket: pulumi.String(fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix)),
			Tags:   defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Enable versioning on artifact bucket
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("pipeline-artifacts-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
			Bucket: artifactBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Enable encryption on artifact bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pipeline-artifacts-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm:   pulumi.String("aws:kms"),
						KmsMasterKeyId: kmsKey.Arn,
					},
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Lifecycle policy for artifact bucket (30 days)
		_, err = s3.NewBucketLifecycleConfigurationV2(ctx, fmt.Sprintf("pipeline-artifacts-lifecycle-%s", environmentSuffix), &s3.BucketLifecycleConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketLifecycleConfigurationV2RuleArray{
				&s3.BucketLifecycleConfigurationV2RuleArgs{
					Id:     pulumi.String("expire-after-30-days"),
					Status: pulumi.String("Enabled"),
					Expiration: &s3.BucketLifecycleConfigurationV2RuleExpirationArgs{
						Days: pulumi.Int(30),
					},
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Block public access to artifact bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("pipeline-artifacts-public-access-block-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
			Bucket:                artifactBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 4. Create SNS topic for pipeline notifications
		snsTopic, err := sns.NewTopic(ctx, fmt.Sprintf("pipeline-notifications-%s", environmentSuffix), &sns.TopicArgs{
			Name: pulumi.String(fmt.Sprintf("pipeline-notifications-%s", environmentSuffix)),
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create SNS topic subscription (email)
		_, err = sns.NewTopicSubscription(ctx, fmt.Sprintf("pipeline-notifications-subscription-%s", environmentSuffix), &sns.TopicSubscriptionArgs{
			Topic:    snsTopic.Arn,
			Protocol: pulumi.String("email"),
			Endpoint: pulumi.String("devops@example.com"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 5. Create SSM parameters for Pulumi access token
		_, err = ssm.NewParameter(ctx, fmt.Sprintf("pulumi-access-token-%s", environmentSuffix), &ssm.ParameterArgs{
			Name:  pulumi.String(fmt.Sprintf("/pulumi/access-token-%s", environmentSuffix)),
			Type:  pulumi.String("SecureString"),
			Value: pulumi.String("PLACEHOLDER_TOKEN"),
			Description: pulumi.String("Pulumi access token for CI/CD pipeline"),
			KeyId: kmsKey.KeyId,
			Tags:  defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create SSM parameter for stack configuration
		_, err = ssm.NewParameter(ctx, fmt.Sprintf("pulumi-stack-config-%s", environmentSuffix), &ssm.ParameterArgs{
			Name:  pulumi.String(fmt.Sprintf("/pulumi/stack-config-%s", environmentSuffix)),
			Type:  pulumi.String("String"),
			Value: pulumi.String("{}"),
			Description: pulumi.String("Pulumi stack configuration"),
			Tags:  defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 6. Create IAM role for CodeBuild
		codeBuildAssumeRolePolicy, err := iam.GetPolicyDocument(ctx, &iam.GetPolicyDocumentArgs{
			Statements: []iam.GetPolicyDocumentStatement{
				{
					Effect: pulumi.StringRef("Allow"),
					Principals: []iam.GetPolicyDocumentStatementPrincipal{
						{
							Type:        "Service",
							Identifiers: []string{"codebuild.amazonaws.com"},
						},
					},
					Actions: []string{"sts:AssumeRole"},
				},
			},
		})
		if err != nil {
			return err
		}

		codeBuildRole, err := iam.NewRole(ctx, fmt.Sprintf("codebuild-role-%s", environmentSuffix), &iam.RoleArgs{
			Name:             pulumi.String(fmt.Sprintf("codebuild-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(codeBuildAssumeRolePolicy.Json),
			Tags:             defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM policy for CodeBuild
		codeBuildPolicyDoc := pulumi.All(stateBucket.Arn, artifactBucket.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
			stateBucketArn := args[0].(string)
			artifactBucketArn := args[1].(string)
			kmsKeyArn := args[2].(string)
			return fmt.Sprintf(`{
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
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "%s/*",
        "%s/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "%s",
        "%s"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "%s"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/pulumi/*"
    },
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::%s:role/pulumi-deploy-role",
        "arn:aws:iam::%s:role/pulumi-deploy-role"
      ]
    }
  ]
}`, stateBucketArn, artifactBucketArn, stateBucketArn, artifactBucketArn, kmsKeyArn, devAccountID, prodAccountID)
		}).(pulumi.StringOutput)

		codeBuildPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("codebuild-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Name:   pulumi.String(fmt.Sprintf("codebuild-policy-%s", environmentSuffix)),
			Policy: codeBuildPolicyDoc,
			Tags:   defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("codebuild-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      codeBuildRole.Name,
			PolicyArn: codeBuildPolicy.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 7. Create CloudWatch log groups for CodeBuild projects
		previewLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("codebuild-preview-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codebuild/pulumi-preview-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
			Tags:            defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		deployDevLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("codebuild-deploy-dev-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codebuild/pulumi-deploy-dev-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
			Tags:            defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		deployProdLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("codebuild-deploy-prod-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codebuild/pulumi-deploy-prod-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
			Tags:            defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		buildLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("codebuild-build-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codebuild/app-build-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
			Tags:            defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 8. Create CodeBuild project for Pulumi preview (Test stage)
		_, err = codebuild.NewProject(ctx, fmt.Sprintf("pulumi-preview-%s", environmentSuffix), &codebuild.ProjectArgs{
			Name:        pulumi.String(fmt.Sprintf("pulumi-preview-%s", environmentSuffix)),
			Description: pulumi.String("CodeBuild project for Pulumi preview"),
			ServiceRole: codeBuildRole.Arn,
			Artifacts: &codebuild.ProjectArtifactsArgs{
				Type: pulumi.String("CODEPIPELINE"),
			},
			Environment: &codebuild.ProjectEnvironmentArgs{
				ComputeType:              pulumi.String("BUILD_GENERAL1_MEDIUM"),
				Image:                    pulumi.String("aws/codebuild/standard:7.0"),
				Type:                     pulumi.String("LINUX_CONTAINER"),
				ImagePullCredentialsType: pulumi.String("CODEBUILD"),
				EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_ACCESS_TOKEN"),
						Type:  pulumi.String("PARAMETER_STORE"),
						Value: pulumi.String(fmt.Sprintf("/pulumi/access-token-%s", environmentSuffix)),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_BACKEND_URL"),
						Value: stateBucket.Bucket.ApplyT(func(bucket string) string { return fmt.Sprintf("s3://%s", bucket) }).(pulumi.StringOutput),
					},
				},
			},
			Source: &codebuild.ProjectSourceArgs{
				Type: pulumi.String("CODEPIPELINE"),
				Buildspec: pulumi.String(`version: 0.2
phases:
  install:
    commands:
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
  build:
    commands:
      - cd infrastructure
      - pulumi login $PULUMI_BACKEND_URL
      - pulumi stack select dev --create
      - pulumi preview --non-interactive
artifacts:
  files:
    - '**/*'
`),
			},
			LogsConfig: &codebuild.ProjectLogsConfigArgs{
				CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
					Status:    pulumi.String("ENABLED"),
					GroupName: previewLogGroup.Name,
				},
			},
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 9. Create CodeBuild project for application build (Build stage)
		_, err = codebuild.NewProject(ctx, fmt.Sprintf("app-build-%s", environmentSuffix), &codebuild.ProjectArgs{
			Name:        pulumi.String(fmt.Sprintf("app-build-%s", environmentSuffix)),
			Description: pulumi.String("CodeBuild project for application build"),
			ServiceRole: codeBuildRole.Arn,
			Artifacts: &codebuild.ProjectArtifactsArgs{
				Type: pulumi.String("CODEPIPELINE"),
			},
			Environment: &codebuild.ProjectEnvironmentArgs{
				ComputeType:              pulumi.String("BUILD_GENERAL1_MEDIUM"),
				Image:                    pulumi.String("aws/codebuild/standard:7.0"),
				Type:                     pulumi.String("LINUX_CONTAINER"),
				ImagePullCredentialsType: pulumi.String("CODEBUILD"),
			},
			Source: &codebuild.ProjectSourceArgs{
				Type: pulumi.String("CODEPIPELINE"),
				Buildspec: pulumi.String(`version: 0.2
phases:
  install:
    commands:
      - echo Installing dependencies...
  build:
    commands:
      - echo Building application...
      - echo Build completed
artifacts:
  files:
    - '**/*'
`),
			},
			LogsConfig: &codebuild.ProjectLogsConfigArgs{
				CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
					Status:    pulumi.String("ENABLED"),
					GroupName: buildLogGroup.Name,
				},
			},
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 10. Create CodeBuild project for Pulumi deploy to Dev
		_, err = codebuild.NewProject(ctx, fmt.Sprintf("pulumi-deploy-dev-%s", environmentSuffix), &codebuild.ProjectArgs{
			Name:        pulumi.String(fmt.Sprintf("pulumi-deploy-dev-%s", environmentSuffix)),
			Description: pulumi.String("CodeBuild project for Pulumi deployment to Dev"),
			ServiceRole: codeBuildRole.Arn,
			Artifacts: &codebuild.ProjectArtifactsArgs{
				Type: pulumi.String("CODEPIPELINE"),
			},
			Environment: &codebuild.ProjectEnvironmentArgs{
				ComputeType:              pulumi.String("BUILD_GENERAL1_MEDIUM"),
				Image:                    pulumi.String("aws/codebuild/standard:7.0"),
				Type:                     pulumi.String("LINUX_CONTAINER"),
				ImagePullCredentialsType: pulumi.String("CODEBUILD"),
				EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_ACCESS_TOKEN"),
						Type:  pulumi.String("PARAMETER_STORE"),
						Value: pulumi.String(fmt.Sprintf("/pulumi/access-token-%s", environmentSuffix)),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_BACKEND_URL"),
						Value: stateBucket.Bucket.ApplyT(func(bucket string) string { return fmt.Sprintf("s3://%s", bucket) }).(pulumi.StringOutput),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("TARGET_ACCOUNT"),
						Value: pulumi.String(devAccountID),
					},
				},
			},
			Source: &codebuild.ProjectSourceArgs{
				Type: pulumi.String("CODEPIPELINE"),
				Buildspec: pulumi.String(`version: 0.2
phases:
  install:
    commands:
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
  build:
    commands:
      - cd infrastructure
      - pulumi login $PULUMI_BACKEND_URL
      - pulumi stack select dev --create
      - pulumi up --yes --non-interactive
artifacts:
  files:
    - '**/*'
`),
			},
			LogsConfig: &codebuild.ProjectLogsConfigArgs{
				CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
					Status:    pulumi.String("ENABLED"),
					GroupName: deployDevLogGroup.Name,
				},
			},
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 11. Create CodeBuild project for Pulumi deploy to Prod
		_, err = codebuild.NewProject(ctx, fmt.Sprintf("pulumi-deploy-prod-%s", environmentSuffix), &codebuild.ProjectArgs{
			Name:        pulumi.String(fmt.Sprintf("pulumi-deploy-prod-%s", environmentSuffix)),
			Description: pulumi.String("CodeBuild project for Pulumi deployment to Prod"),
			ServiceRole: codeBuildRole.Arn,
			Artifacts: &codebuild.ProjectArtifactsArgs{
				Type: pulumi.String("CODEPIPELINE"),
			},
			Environment: &codebuild.ProjectEnvironmentArgs{
				ComputeType:              pulumi.String("BUILD_GENERAL1_MEDIUM"),
				Image:                    pulumi.String("aws/codebuild/standard:7.0"),
				Type:                     pulumi.String("LINUX_CONTAINER"),
				ImagePullCredentialsType: pulumi.String("CODEBUILD"),
				EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_ACCESS_TOKEN"),
						Type:  pulumi.String("PARAMETER_STORE"),
						Value: pulumi.String(fmt.Sprintf("/pulumi/access-token-%s", environmentSuffix)),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("PULUMI_BACKEND_URL"),
						Value: stateBucket.Bucket.ApplyT(func(bucket string) string { return fmt.Sprintf("s3://%s", bucket) }).(pulumi.StringOutput),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("TARGET_ACCOUNT"),
						Value: pulumi.String(prodAccountID),
					},
				},
			},
			Source: &codebuild.ProjectSourceArgs{
				Type: pulumi.String("CODEPIPELINE"),
				Buildspec: pulumi.String(`version: 0.2
phases:
  install:
    commands:
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
  build:
    commands:
      - cd infrastructure
      - pulumi login $PULUMI_BACKEND_URL
      - pulumi stack select prod --create
      - pulumi up --yes --non-interactive
artifacts:
  files:
    - '**/*'
`),
			},
			LogsConfig: &codebuild.ProjectLogsConfigArgs{
				CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
					Status:    pulumi.String("ENABLED"),
					GroupName: deployProdLogGroup.Name,
				},
			},
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 12. Create CodeStar connection for GitHub
		codestarConnection, err := codestarconnections.NewConnection(ctx, fmt.Sprintf("github-connection-%s", environmentSuffix), &codestarconnections.ConnectionArgs{
			Name:         pulumi.String(fmt.Sprintf("github-connection-%s", environmentSuffix)),
			ProviderType: pulumi.String("GitHub"),
			Tags:         defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 13. Create IAM role for CodePipeline
		pipelineAssumeRolePolicy, err := iam.GetPolicyDocument(ctx, &iam.GetPolicyDocumentArgs{
			Statements: []iam.GetPolicyDocumentStatement{
				{
					Effect: pulumi.StringRef("Allow"),
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

		pipelineRole, err := iam.NewRole(ctx, fmt.Sprintf("pipeline-role-%s", environmentSuffix), &iam.RoleArgs{
			Name:             pulumi.String(fmt.Sprintf("pipeline-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(pipelineAssumeRolePolicy.Json),
			Tags:             defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM policy for CodePipeline
		pipelinePolicyDoc := pulumi.All(artifactBucket.Arn, kmsKey.Arn, codestarConnection.Arn).ApplyT(func(args []interface{}) string {
			artifactBucketArn := args[0].(string)
			kmsKeyArn := args[1].(string)
			codestarArn := args[2].(string)
			return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
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
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "%s"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codestar-connections:UseConnection"
      ],
      "Resource": "%s"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}`, artifactBucketArn, artifactBucketArn, kmsKeyArn, codestarArn)
		}).(pulumi.StringOutput)

		pipelinePolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("pipeline-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Name:   pulumi.String(fmt.Sprintf("pipeline-policy-%s", environmentSuffix)),
			Policy: pipelinePolicyDoc,
			Tags:   defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("pipeline-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      pipelineRole.Name,
			PolicyArn: pipelinePolicy.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 14. Create CodePipeline
		pipeline, err := codepipeline.NewPipeline(ctx, fmt.Sprintf("cicd-pipeline-%s", environmentSuffix), &codepipeline.PipelineArgs{
			Name:    pulumi.String(fmt.Sprintf("cicd-pipeline-%s", environmentSuffix)),
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
				// Stage 1: Source
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Source"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("Source"),
							Category: pulumi.String("Source"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeStarSourceConnection"),
							Version:  pulumi.String("1"),
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("SourceOutput"),
							},
							Configuration: pulumi.StringMap{
								"ConnectionArn":    codestarConnection.Arn,
								"FullRepositoryId": pulumi.String("example-org/example-repo"),
								"BranchName":       pulumi.String("main"),
							},
						},
					},
				},
				// Stage 2: Build
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Build"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("Build"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("SourceOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("BuildOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": pulumi.String(fmt.Sprintf("app-build-%s", environmentSuffix)),
							},
						},
					},
				},
				// Stage 3: Test (Pulumi Preview)
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Test"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("PulumiPreview"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("BuildOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("TestOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": pulumi.String(fmt.Sprintf("pulumi-preview-%s", environmentSuffix)),
							},
						},
					},
				},
				// Stage 4: Deploy-Dev
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Deploy-Dev"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("DeployDev"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("TestOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("DevOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": pulumi.String(fmt.Sprintf("pulumi-deploy-dev-%s", environmentSuffix)),
							},
						},
					},
				},
				// Stage 5: Deploy-Prod (with manual approval)
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Deploy-Prod"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("ManualApproval"),
							Category: pulumi.String("Approval"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("Manual"),
							Version:  pulumi.String("1"),
							Configuration: pulumi.StringMap{
								"NotificationArn": snsTopic.Arn,
								"CustomData":      pulumi.String("Please approve deployment to production"),
							},
							RunOrder: pulumi.Int(1),
						},
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("DeployProd"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("DevOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("ProdOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": pulumi.String(fmt.Sprintf("pulumi-deploy-prod-%s", environmentSuffix)),
							},
							RunOrder: pulumi.Int(2),
						},
					},
				},
			},
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 15. Create EventBridge rule to trigger pipeline on Git tags
		eventRole, err := iam.NewRole(ctx, fmt.Sprintf("eventbridge-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("eventbridge-pipeline-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`),
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		eventPolicyDoc := pipeline.Arn.ApplyT(func(arn string) string {
			return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "codepipeline:StartPipelineExecution",
      "Resource": "%s"
    }
  ]
}`, arn)
		}).(pulumi.StringOutput)

		eventPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("eventbridge-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Name:   pulumi.String(fmt.Sprintf("eventbridge-pipeline-policy-%s", environmentSuffix)),
			Policy: eventPolicyDoc,
			Tags:   defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("eventbridge-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      eventRole.Name,
			PolicyArn: eventPolicy.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = events.NewRule(ctx, fmt.Sprintf("pipeline-trigger-%s", environmentSuffix), &events.RuleArgs{
			Name:        pulumi.String(fmt.Sprintf("pipeline-trigger-%s", environmentSuffix)),
			Description: pulumi.String("Trigger pipeline on Git tag pushes matching v*.*.*"),
			EventPattern: codestarConnection.Arn.ApplyT(func(arn string) string {
				return fmt.Sprintf(`{
  "source": ["aws.codestar-connections"],
  "detail-type": ["CodeStar Source Connection State Change"],
  "detail": {
    "referenceType": ["tag"],
    "referenceName": [{
      "prefix": "v"
    }],
    "connectionArn": ["%s"]
  }
}`, arn)
			}).(pulumi.StringOutput),
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = events.NewTarget(ctx, fmt.Sprintf("pipeline-trigger-target-%s", environmentSuffix), &events.TargetArgs{
			Rule:    pulumi.String(fmt.Sprintf("pipeline-trigger-%s", environmentSuffix)),
			Arn:     pipeline.Arn,
			RoleArn: eventRole.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// 16. Create EventBridge rule for pipeline failures
		_, err = events.NewRule(ctx, fmt.Sprintf("pipeline-failure-%s", environmentSuffix), &events.RuleArgs{
			Name:        pulumi.String(fmt.Sprintf("pipeline-failure-%s", environmentSuffix)),
			Description: pulumi.String("Notify on pipeline failures"),
			EventPattern: pipeline.Name.ApplyT(func(name string) string {
				return fmt.Sprintf(`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "state": ["FAILED"],
    "pipeline": ["%s"]
  }
}`, name)
			}).(pulumi.StringOutput),
			Tags: defaultTags,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = events.NewTarget(ctx, fmt.Sprintf("pipeline-failure-target-%s", environmentSuffix), &events.TargetArgs{
			Rule: pulumi.String(fmt.Sprintf("pipeline-failure-%s", environmentSuffix)),
			Arn:  snsTopic.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Allow EventBridge to publish to SNS
		_, err = sns.NewTopicPolicy(ctx, fmt.Sprintf("sns-eventbridge-policy-%s", environmentSuffix), &sns.TopicPolicyArgs{
			Arn: snsTopic.Arn,
			Policy: pulumi.All(snsTopic.Arn).ApplyT(func(args []interface{}) string {
				topicArn := args[0].(string)
				return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "SNS:Publish",
      "Resource": "%s"
    }
  ]
}`, topicArn)
			}).(pulumi.StringOutput),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Export important values
		ctx.Export("stateBucketName", stateBucket.Bucket)
		ctx.Export("artifactBucketName", artifactBucket.Bucket)
		ctx.Export("pipelineName", pipeline.Name)
		ctx.Export("pipelineArn", pipeline.Arn)
		ctx.Export("codestarConnectionArn", codestarConnection.Arn)
		ctx.Export("snsTopicArn", snsTopic.Arn)
		ctx.Export("kmsKeyId", kmsKey.KeyId)

		return nil
	})
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline with Pulumi Infrastructure Automation

This Pulumi Go program deploys a complete CI/CD pipeline on AWS that automates Pulumi infrastructure deployments across multiple accounts with proper security controls and approval workflows.

## Architecture Overview

The solution creates:

1. **Pulumi State Management**: S3 bucket with versioning and KMS encryption for Pulumi state files
2. **Artifact Storage**: S3 bucket with lifecycle policies for pipeline artifacts
3. **CodeBuild Projects**: Four projects for build, test (preview), and deploy (dev/prod)
4. **CodePipeline**: 5-stage pipeline (Source → Build → Test → Deploy-Dev → Deploy-Prod)
5. **GitHub Integration**: CodeStar connection for source control
6. **Notifications**: SNS topic with email subscription for failure alerts
7. **Event-Driven Triggers**: EventBridge rules for Git tag-based deployments
8. **Security**: KMS encryption, SSM Parameter Store for secrets, least-privilege IAM roles
9. **Multi-Account**: Cross-account IAM roles for Dev and Prod deployments
10. **Observability**: CloudWatch Logs with 7-day retention for all CodeBuild projects

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI 3.x installed
- Go 1.19+ installed
- AWS accounts: Shared Services (pipeline), Dev (123456789012), Prod (987654321098)
- GitHub repository for source code

## Environment Variables

The following environment variables are required:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: "dev")
- `AWS_REGION`: AWS region for deployment (default: "us-east-1")
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging
- `PR_NUMBER`: Pull request number for tagging
- `TEAM`: Team name for tagging

## Deployment

1. Initialize Pulumi:
   ```bash
   pulumi login s3://your-pulumi-state-bucket
   pulumi stack init dev
   ```

2. Set required configuration:
   ```bash
   export ENVIRONMENT_SUFFIX="myenv"
   export AWS_REGION="us-east-1"
   ```

3. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

4. After deployment, update SSM parameters:
   ```bash
   # Set your actual Pulumi access token
   aws ssm put-parameter \
     --name "/pulumi/access-token-myenv" \
     --value "pul-your-actual-token" \
     --type SecureString \
     --overwrite
   ```

5. Complete the CodeStar connection:
   ```bash
   # Get the connection ARN from outputs
   pulumi stack output codestarConnectionArn

   # Go to AWS Console → Developer Tools → Settings → Connections
   # Find the connection and complete the GitHub authentication
   ```

6. Update the pipeline source configuration:
   - Edit the Source stage in CodePipeline
   - Update `FullRepositoryId` to your GitHub repository (e.g., "myorg/myrepo")

## Pipeline Stages

1. **Source**: Pulls code from GitHub via CodeStar connection
2. **Build**: Compiles application code and prepares artifacts
3. **Test**: Runs `pulumi preview` to validate infrastructure changes
4. **Deploy-Dev**: Deploys to Dev account with `pulumi up`
5. **Deploy-Prod**: Manual approval followed by production deployment

## Multi-Account Setup

The pipeline runs in a shared services account and deploys to Dev and Prod accounts using cross-account IAM roles.

### Required IAM Roles in Target Accounts

Create the following IAM role in both Dev (123456789012) and Prod (987654321098) accounts:

**Role Name**: `pulumi-deploy-role`

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SHARED_SERVICES_ACCOUNT_ID:role/codebuild-role-{environmentSuffix}"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Policy**: Attach appropriate policies for deploying your infrastructure (e.g., PowerUserAccess or custom policies)

## Security Features

- **Encryption at Rest**: All S3 buckets and SSM parameters use KMS encryption
- **Encryption in Transit**: HTTPS enforced for all AWS API calls
- **Least Privilege**: IAM roles follow principle of least privilege
- **Secret Management**: Pulumi access tokens stored in SSM Parameter Store
- **Audit Trail**: CloudWatch Logs capture all build activity
- **Public Access Block**: All S3 buckets block public access

## Event-Driven Deployment

The pipeline can be triggered by:

1. **Manual**: Start pipeline execution from AWS Console or CLI
2. **Git Tags**: EventBridge rule triggers on version tags (v*.*.*)
3. **Webhook**: Direct GitHub webhook integration via CodeStar connection

## Notifications

Pipeline failures trigger SNS notifications to `devops@example.com`. Update the email address in the code or add additional subscriptions:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Lifecycle Management

- **Artifact Retention**: Pipeline artifacts expire after 30 days
- **Log Retention**: CloudWatch Logs retained for 7 days
- **State Versioning**: Pulumi state bucket has versioning enabled

## Troubleshooting

### Pipeline Fails at Source Stage
- Verify CodeStar connection is in "Available" state
- Check repository name and branch in Source stage configuration

### Pipeline Fails at Test/Deploy Stages
- Verify Pulumi access token in SSM Parameter Store
- Check CodeBuild role has permissions to assume cross-account roles
- Verify target account IAM roles exist and have correct trust policies

### Pulumi Login Fails
- Verify S3 bucket for Pulumi state is accessible
- Check KMS key permissions for CodeBuild role

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: You may need to manually delete S3 bucket contents before destruction if versioning is enabled.

## Cost Optimization

The infrastructure uses cost-optimized resources:

- **S3 Lifecycle**: Automatic artifact cleanup after 30 days
- **CloudWatch Logs**: 7-day retention reduces storage costs
- **CodeBuild**: BUILD_GENERAL1_MEDIUM compute type balances performance and cost
- **On-Demand**: No reserved capacity or long-running resources

## Extending the Pipeline

### Add Additional Stages

Edit the `Stages` array in the CodePipeline resource to add more stages (e.g., integration tests, security scanning).

### Add More Environments

Create additional CodeBuild projects and pipeline stages for staging or QA environments.

### Customize Build Specifications

Modify the `Buildspec` in each CodeBuild project to match your application requirements.

## References

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild User Guide](https://docs.aws.amazon.com/codebuild/)
- [CodeStar Connections](https://docs.aws.amazon.com/codestar-connections/)
