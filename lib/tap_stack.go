package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
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

		// Create SNS topic for pipeline notifications
		notificationTopic, err := sns.NewTopic(ctx, fmt.Sprintf("pipeline-notifications-%s", environmentSuffix), &sns.TopicArgs{
			Name:        pulumi.String(fmt.Sprintf("pipeline-notifications-%s", environmentSuffix)),
			DisplayName: pulumi.String("CI/CD Pipeline Notifications"),
		})
		if err != nil {
			return err
		}

		// Subscribe email to SNS topic
		_, err = sns.NewTopicSubscription(ctx, fmt.Sprintf("pipeline-email-subscription-%s", environmentSuffix), &sns.TopicSubscriptionArgs{
			Topic:    notificationTopic.Arn,
			Protocol: pulumi.String("email"),
			Endpoint: pulumi.String("ops@company.com"),
		})
		if err != nil {
			return err
		}

		// Create SNS topic for manual approvals
		approvalTopic, err := sns.NewTopic(ctx, fmt.Sprintf("pipeline-approvals-%s", environmentSuffix), &sns.TopicArgs{
			Name:        pulumi.String(fmt.Sprintf("pipeline-approvals-%s", environmentSuffix)),
			DisplayName: pulumi.String("CI/CD Pipeline Manual Approvals"),
		})
		if err != nil {
			return err
		}

		// Subscribe email to approval topic
		_, err = sns.NewTopicSubscription(ctx, fmt.Sprintf("approval-email-subscription-%s", environmentSuffix), &sns.TopicSubscriptionArgs{
			Topic:    approvalTopic.Arn,
			Protocol: pulumi.String("email"),
			Endpoint: pulumi.String("ops@company.com"),
		})
		if err != nil {
			return err
		}

		// Create S3 bucket for pipeline artifacts
		artifactBucket, err := s3.NewBucket(ctx, fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix), &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix)),
		})
		if err != nil {
			return err
		}

		// Enable versioning on artifact bucket
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("pipeline-artifacts-versioning-%s", environmentSuffix), &s3.BucketVersioningV2Args{
			Bucket: artifactBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Enable server-side encryption on artifact bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pipeline-artifacts-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Add lifecycle policy to artifact bucket (30 days retention)
		_, err = s3.NewBucketLifecycleConfigurationV2(ctx, fmt.Sprintf("pipeline-artifacts-lifecycle-%s", environmentSuffix), &s3.BucketLifecycleConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketLifecycleConfigurationV2RuleArray{
				&s3.BucketLifecycleConfigurationV2RuleArgs{
					Id:     pulumi.String("delete-old-artifacts"),
					Status: pulumi.String("Enabled"),
					Expiration: &s3.BucketLifecycleConfigurationV2RuleExpirationArgs{
						Days: pulumi.Int(30),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Create S3 buckets for Pulumi state per environment
		environments := []string{"dev", "staging", "prod"}
		stateBuckets := make(map[string]*s3.Bucket)
		stateTables := make(map[string]*dynamodb.Table)

		for _, env := range environments {
			// Create state bucket
			stateBucket, err := s3.NewBucket(ctx, fmt.Sprintf("pulumi-state-%s-%s", env, environmentSuffix), &s3.BucketArgs{
				Bucket: pulumi.String(fmt.Sprintf("pulumi-state-%s-%s", env, environmentSuffix)),
			})
			if err != nil {
				return err
			}
			stateBuckets[env] = stateBucket

			// Enable versioning on state bucket
			_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("pulumi-state-versioning-%s-%s", env, environmentSuffix), &s3.BucketVersioningV2Args{
				Bucket: stateBucket.ID(),
				VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
					Status: pulumi.String("Enabled"),
				},
			})
			if err != nil {
				return err
			}

			// Enable server-side encryption on state bucket
			_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pulumi-state-encryption-%s-%s", env, environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
				Bucket: stateBucket.ID(),
				Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
					&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
						ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
							SseAlgorithm: pulumi.String("AES256"),
						},
					},
				},
			})
			if err != nil {
				return err
			}

			// Create DynamoDB table for state locking
			stateTable, err := dynamodb.NewTable(ctx, fmt.Sprintf("pulumi-state-lock-%s-%s", env, environmentSuffix), &dynamodb.TableArgs{
				Name:        pulumi.String(fmt.Sprintf("pulumi-state-lock-%s-%s", env, environmentSuffix)),
				BillingMode: pulumi.String("PAY_PER_REQUEST"),
				HashKey:     pulumi.String("LockID"),
				Attributes: dynamodb.TableAttributeArray{
					&dynamodb.TableAttributeArgs{
						Name: pulumi.String("LockID"),
						Type: pulumi.String("S"),
					},
				},
			})
			if err != nil {
				return err
			}
			stateTables[env] = stateTable
		}

		// Create IAM role for CodePipeline
		pipelineRole, err := iam.NewRole(ctx, fmt.Sprintf("codepipeline-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("codepipeline-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {
						"Service": "codepipeline.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}]
			}`),
		})
		if err != nil {
			return err
		}

		// Create IAM policy for CodePipeline
		pipelinePolicyDocument := artifactBucket.Arn.ApplyT(func(arn string) (string, error) {
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:PutObject",
						},
						"Resource": fmt.Sprintf("%s/*", arn),
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ListBucket",
						},
						"Resource": arn,
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"codebuild:BatchGetBuilds",
							"codebuild:StartBuild",
						},
						"Resource": "*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"sns:Publish",
						},
						"Resource": "*",
					},
				},
			}
			policyJSON, err := json.Marshal(policy)
			if err != nil {
				return "", err
			}
			return string(policyJSON), nil
		}).(pulumi.StringOutput)

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("codepipeline-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Name:   pulumi.String(fmt.Sprintf("codepipeline-policy-%s", environmentSuffix)),
			Role:   pipelineRole.ID(),
			Policy: pipelinePolicyDocument,
		})
		if err != nil {
			return err
		}

		// Create IAM role for CodeBuild
		codebuildRole, err := iam.NewRole(ctx, fmt.Sprintf("codebuild-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("codebuild-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {
						"Service": "codebuild.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}]
			}`),
		})
		if err != nil {
			return err
		}

		// Create IAM policy for CodeBuild
		codebuildPolicyDocument := pulumi.All(artifactBucket.Arn, stateBuckets["dev"].Arn, stateBuckets["staging"].Arn, stateBuckets["prod"].Arn).ApplyT(func(args []interface{}) (string, error) {
			artifactArn := args[0].(string)
			devStateArn := args[1].(string)
			stagingStateArn := args[2].(string)
			prodStateArn := args[3].(string)

			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents",
						},
						"Resource": "*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObject",
							"s3:GetObjectVersion",
							"s3:PutObject",
						},
						"Resource": []string{
							fmt.Sprintf("%s/*", artifactArn),
							fmt.Sprintf("%s/*", devStateArn),
							fmt.Sprintf("%s/*", stagingStateArn),
							fmt.Sprintf("%s/*", prodStateArn),
						},
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ListBucket",
						},
						"Resource": []string{
							artifactArn,
							devStateArn,
							stagingStateArn,
							prodStateArn,
						},
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"dynamodb:GetItem",
							"dynamodb:PutItem",
							"dynamodb:DeleteItem",
						},
						"Resource": "*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"sts:AssumeRole",
						},
						"Resource": "*",
					},
					{
						"Effect":   "Deny",
						"Action":   "*",
						"Resource": "*",
						"Condition": map[string]interface{}{
							"StringLike": map[string]interface{}{
								"aws:PrincipalArn": []string{
									"*dev*",
									"*staging*",
								},
							},
							"StringEquals": map[string]interface{}{
								"aws:RequestedRegion": "us-east-1",
							},
						},
					},
				},
			}
			policyJSON, err := json.Marshal(policy)
			if err != nil {
				return "", err
			}
			return string(policyJSON), nil
		}).(pulumi.StringOutput)

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("codebuild-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Name:   pulumi.String(fmt.Sprintf("codebuild-policy-%s", environmentSuffix)),
			Role:   codebuildRole.ID(),
			Policy: codebuildPolicyDocument,
		})
		if err != nil {
			return err
		}

		// Create CodeBuild projects for each environment
		codebuildProjects := make(map[string]*codebuild.Project)
		for _, env := range environments {
			project, err := codebuild.NewProject(ctx, fmt.Sprintf("pulumi-deploy-%s-%s", env, environmentSuffix), &codebuild.ProjectArgs{
				Name:        pulumi.String(fmt.Sprintf("pulumi-deploy-%s-%s", env, environmentSuffix)),
				Description: pulumi.String(fmt.Sprintf("Deploy Pulumi stack for %s environment", env)),
				ServiceRole: codebuildRole.Arn,
				Artifacts: &codebuild.ProjectArtifactsArgs{
					Type: pulumi.String("CODEPIPELINE"),
				},
				Environment: &codebuild.ProjectEnvironmentArgs{
					ComputeType:              pulumi.String("BUILD_GENERAL1_SMALL"),
					Image:                    pulumi.String("aws/codebuild/standard:7.0"),
					Type:                     pulumi.String("LINUX_CONTAINER"),
					ImagePullCredentialsType: pulumi.String("CODEBUILD"),
					EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
						&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
							Name:  pulumi.String("PULUMI_STACK"),
							Value: pulumi.String(fmt.Sprintf("project-%s-%s", env, awsRegion)),
						},
						&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
							Name:  pulumi.String("ENVIRONMENT"),
							Value: pulumi.String(env),
						},
						&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
							Name:  pulumi.String("AWS_REGION"),
							Value: pulumi.String(awsRegion),
						},
					},
				},
				Source: &codebuild.ProjectSourceArgs{
					Type: pulumi.String("CODEPIPELINE"),
					Buildspec: pulumi.String(fmt.Sprintf(`version: 0.2
phases:
  install:
    runtime-versions:
      golang: 1.19
    commands:
      - echo Installing Pulumi CLI
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
  pre_build:
    commands:
      - echo Configuring Pulumi backend
      - pulumi login s3://pulumi-state-%s-%s
  build:
    commands:
      - echo Building and deploying Pulumi stack
      - pulumi stack select $PULUMI_STACK --create
      - pulumi up --yes --skip-preview
  post_build:
    commands:
      - echo Deployment complete
artifacts:
  files:
    - '**/*'
`, env, environmentSuffix)),
				},
				LogsConfig: &codebuild.ProjectLogsConfigArgs{
					CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
						Status:     pulumi.String("ENABLED"),
						GroupName:  pulumi.String(fmt.Sprintf("/aws/codebuild/pulumi-deploy-%s-%s", env, environmentSuffix)),
						StreamName: pulumi.String("build-log"),
					},
				},
				ConcurrentBuildLimit: pulumi.Int(2),
			})
			if err != nil {
				return err
			}
			codebuildProjects[env] = project
		}

		// CloudWatch Log Groups will be automatically created by CodeBuild
		// Note: Log retention is configured in CodeBuild project LogsConfig

		// Create CodePipelines for each environment
		for _, env := range environments {
			// Determine branch name based on environment
			var branchName string
			switch env {
			case "dev":
				branchName = "develop"
			case "staging":
				branchName = "staging"
			case "prod":
				branchName = "main"
			default:
				branchName = "develop"
			}

			// Build pipeline stages
			stages := codepipeline.PipelineStageArray{
				// Source stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Source"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("SourceAction"),
							Category: pulumi.String("Source"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeStarSourceConnection"),
							Version:  pulumi.String("1"),
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("SourceOutput"),
							},
							Configuration: pulumi.StringMap{
								"ConnectionArn":    pulumi.String("arn:aws:codestar-connections:us-east-1:123456789012:connection/example"),
								"FullRepositoryId": pulumi.String("organization/repo"),
								"BranchName":       pulumi.String(branchName),
							},
						},
					},
				},
				// Build stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Build"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("BuildAction"),
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
								"ProjectName": codebuildProjects[env].Name,
							},
						},
					},
				},
			}

			// Add approval stage for staging and prod
			if env == "staging" || env == "prod" {
				approvalStage := &codepipeline.PipelineStageArgs{
					Name: pulumi.String("Approval"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("ManualApproval"),
							Category: pulumi.String("Approval"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("Manual"),
							Version:  pulumi.String("1"),
							Configuration: pulumi.StringMap{
								"NotificationArn": approvalTopic.Arn,
								"CustomData":      pulumi.String(fmt.Sprintf("Please approve deployment to %s environment", env)),
							},
						},
					},
				}
				stages = append(stages, approvalStage)
			}

			// Add deploy stage
			deployStage := &codepipeline.PipelineStageArgs{
				Name: pulumi.String("Deploy"),
				Actions: codepipeline.PipelineStageActionArray{
					&codepipeline.PipelineStageActionArgs{
						Name:     pulumi.String("DeployAction"),
						Category: pulumi.String("Build"),
						Owner:    pulumi.String("AWS"),
						Provider: pulumi.String("CodeBuild"),
						Version:  pulumi.String("1"),
						InputArtifacts: pulumi.StringArray{
							pulumi.String("BuildOutput"),
						},
						Configuration: pulumi.StringMap{
							"ProjectName": codebuildProjects[env].Name,
						},
					},
				},
			}
			stages = append(stages, deployStage)

			// Create pipeline
			pipeline, err := codepipeline.NewPipeline(ctx, fmt.Sprintf("pulumi-pipeline-%s-%s", env, environmentSuffix), &codepipeline.PipelineArgs{
				Name:    pulumi.String(fmt.Sprintf("pulumi-pipeline-%s-%s", env, environmentSuffix)),
				RoleArn: pipelineRole.Arn,
				ArtifactStores: codepipeline.PipelineArtifactStoreArray{
					&codepipeline.PipelineArtifactStoreArgs{
						Type:     pulumi.String("S3"),
						Location: artifactBucket.Bucket,
						Region:   pulumi.String(awsRegion),
					},
				},
				Stages: stages,
			})
			if err != nil {
				return err
			}

			// Create EventBridge rule to trigger pipeline on Git push
			eventPattern := map[string]interface{}{
				"source":      []string{"aws.codecommit"},
				"detail-type": []string{"CodeCommit Repository State Change"},
				"detail": map[string]interface{}{
					"event":         []string{"referenceCreated", "referenceUpdated"},
					"referenceType": []string{"branch"},
					"referenceName": []string{branchName},
				},
			}
			eventPatternJSON, err := json.Marshal(eventPattern)
			if err != nil {
				return err
			}

			rule, err := cloudwatch.NewEventRule(ctx, fmt.Sprintf("pipeline-trigger-%s-%s", env, environmentSuffix), &cloudwatch.EventRuleArgs{
				Name:         pulumi.String(fmt.Sprintf("pipeline-trigger-%s-%s", env, environmentSuffix)),
				Description:  pulumi.String(fmt.Sprintf("Trigger pipeline on push to %s branch", branchName)),
				EventPattern: pulumi.String(string(eventPatternJSON)),
			})
			if err != nil {
				return err
			}

			// Create EventBridge target to start pipeline
			_, err = cloudwatch.NewEventTarget(ctx, fmt.Sprintf("pipeline-target-%s-%s", env, environmentSuffix), &cloudwatch.EventTargetArgs{
				Rule:    rule.Name,
				Arn:     pipeline.Arn,
				RoleArn: pulumi.String(fmt.Sprintf("arn:aws:iam::%s:role/service-role/Amazon_EventBridge_Invoke_CodePipeline", "123456789012")),
			})
			if err != nil {
				return err
			}

			// Create EventBridge rule for pipeline state changes
			stateChangePattern := map[string]interface{}{
				"source":      []string{"aws.codepipeline"},
				"detail-type": []string{"CodePipeline Pipeline Execution State Change"},
				"detail": map[string]interface{}{
					"pipeline": []string{fmt.Sprintf("pulumi-pipeline-%s-%s", env, environmentSuffix)},
					"state":    []string{"FAILED", "SUCCEEDED"},
				},
			}
			stateChangePatternJSON, err := json.Marshal(stateChangePattern)
			if err != nil {
				return err
			}

			stateChangeRule, err := cloudwatch.NewEventRule(ctx, fmt.Sprintf("pipeline-state-change-%s-%s", env, environmentSuffix), &cloudwatch.EventRuleArgs{
				Name:         pulumi.String(fmt.Sprintf("pipeline-state-change-%s-%s", env, environmentSuffix)),
				Description:  pulumi.String(fmt.Sprintf("Notify on pipeline state changes for %s", env)),
				EventPattern: pulumi.String(string(stateChangePatternJSON)),
			})
			if err != nil {
				return err
			}

			// Create EventBridge target to send notification to SNS
			_, err = cloudwatch.NewEventTarget(ctx, fmt.Sprintf("pipeline-notification-target-%s-%s", env, environmentSuffix), &cloudwatch.EventTargetArgs{
				Rule: stateChangeRule.Name,
				Arn:  notificationTopic.Arn,
				InputTransformer: &cloudwatch.EventTargetInputTransformerArgs{
					InputPaths: pulumi.StringMap{
						"pipeline": pulumi.String("$.detail.pipeline"),
						"state":    pulumi.String("$.detail.state"),
						"stage":    pulumi.String("$.detail.stage"),
						"time":     pulumi.String("$.time"),
					},
					InputTemplate: pulumi.String(`"Pipeline <pipeline> has <state> at stage <stage> at <time>"`),
				},
			})
			if err != nil {
				return err
			}
		}

		// Export outputs
		ctx.Export("artifactBucketName", artifactBucket.Bucket)
		ctx.Export("notificationTopicArn", notificationTopic.Arn)
		ctx.Export("approvalTopicArn", approvalTopic.Arn)
		ctx.Export("devStateBucket", stateBuckets["dev"].Bucket)
		ctx.Export("stagingStateBucket", stateBuckets["staging"].Bucket)
		ctx.Export("prodStateBucket", stateBuckets["prod"].Bucket)
		ctx.Export("devStateLockTable", stateTables["dev"].Name)
		ctx.Export("stagingStateLockTable", stateTables["staging"].Name)
		ctx.Export("prodStateLockTable", stateTables["prod"].Name)
		ctx.Export("pipelineRoleArn", pipelineRole.Arn)
		ctx.Export("codebuildRoleArn", codebuildRole.Arn)

		return nil
	})
}
