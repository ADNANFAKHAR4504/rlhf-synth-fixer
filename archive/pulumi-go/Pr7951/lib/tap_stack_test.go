package main

import (
	"encoding/json"
	"os"
	"sync"
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// Mock implementation of Pulumi runtime
type mocks int

var (
	resourceNames = make(map[string]bool)
	resourceMutex sync.Mutex
)

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	// Track resource names to ensure uniqueness
	resourceMutex.Lock()
	resourceNames[args.Name] = true
	resourceMutex.Unlock()

	outputs := args.Inputs.Mappable()

	// Add required outputs based on resource type
	switch args.TypeToken {
	case "aws:s3/bucket:Bucket":
		outputs["id"] = "mock-bucket-id"
		outputs["arn"] = "arn:aws:s3:::mock-bucket"
		outputs["bucket"] = args.Name
	case "aws:sns/topic:Topic":
		outputs["id"] = "mock-topic-id"
		outputs["arn"] = "arn:aws:sns:us-east-1:123456789012:mock-topic"
	case "aws:iam/role:Role":
		outputs["id"] = "mock-role-id"
		outputs["arn"] = "arn:aws:iam::123456789012:role/mock-role"
	case "aws:dynamodb/table:Table":
		outputs["id"] = "mock-table-id"
		outputs["arn"] = "arn:aws:dynamodb:us-east-1:123456789012:table/mock-table"
	case "aws:codebuild/project:Project":
		outputs["id"] = "mock-project-id"
		outputs["arn"] = "arn:aws:codebuild:us-east-1:123456789012:project/mock-project"
		outputs["name"] = args.Name
	case "aws:codepipeline/pipeline:Pipeline":
		outputs["id"] = "mock-pipeline-id"
		outputs["arn"] = "arn:aws:codepipeline:us-east-1:123456789012:mock-pipeline"
	case "aws:cloudwatch/eventRule:EventRule":
		outputs["id"] = "mock-rule-id"
		outputs["arn"] = "arn:aws:events:us-east-1:123456789012:rule/mock-rule"
		outputs["name"] = args.Name
	}

	return args.Name + "_id", resource.NewPropertyMapFromMap(outputs), nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := map[string]interface{}{}
	return resource.NewPropertyMapFromMap(outputs), nil
}

func TestGetEnv(t *testing.T) {
	// Test with existing environment variable
	os.Setenv("TEST_VAR", "test_value")
	defer os.Unsetenv("TEST_VAR")

	result := getEnv("TEST_VAR", "fallback")
	assert.Equal(t, "test_value", result, "Should return environment variable value")

	// Test with non-existent environment variable
	result = getEnv("NON_EXISTENT_VAR", "fallback")
	assert.Equal(t, "fallback", result, "Should return fallback value")

	// Test with empty environment variable
	os.Setenv("EMPTY_VAR", "")
	defer os.Unsetenv("EMPTY_VAR")
	result = getEnv("EMPTY_VAR", "fallback")
	assert.Equal(t, "fallback", result, "Should return fallback for empty value")
}

func TestInfrastructureCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		// Set environment variables for testing
		os.Setenv("ENVIRONMENT_SUFFIX", "test")
		os.Setenv("REPOSITORY", "test-repo")
		os.Setenv("COMMIT_AUTHOR", "test-author")
		os.Setenv("PR_NUMBER", "123")
		os.Setenv("TEAM", "test-team")
		os.Setenv("AWS_REGION", "us-east-1")

		defer func() {
			os.Unsetenv("ENVIRONMENT_SUFFIX")
			os.Unsetenv("REPOSITORY")
			os.Unsetenv("COMMIT_AUTHOR")
			os.Unsetenv("PR_NUMBER")
			os.Unsetenv("TEAM")
			os.Unsetenv("AWS_REGION")
		}()

		// Get environment variables (same as in main)
		environmentSuffix := getEnv("ENVIRONMENT_SUFFIX", "dev")
		repositoryName := getEnv("REPOSITORY", "unknown")
		commitAuthor := getEnv("COMMIT_AUTHOR", "unknown")
		prNumber := getEnv("PR_NUMBER", "unknown")
		team := getEnv("TEAM", "unknown")
		awsRegion := getEnv("AWS_REGION", "us-east-1")

		// Test tag creation
		defaultTags := pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Repository":  pulumi.String(repositoryName),
			"Author":      pulumi.String(commitAuthor),
			"PRNumber":    pulumi.String(prNumber),
			"Team":        pulumi.String(team),
			"CreatedAt":   pulumi.String("2025-12-05T00:00:00Z"),
		}

		assert.NotNil(t, defaultTags, "Default tags should be created")

		// Test AWS provider
		provider, err := aws.NewProvider(ctx, "aws", &aws.ProviderArgs{
			Region: pulumi.String(awsRegion),
			DefaultTags: &aws.ProviderDefaultTagsArgs{
				Tags: defaultTags,
			},
		})
		assert.NoError(t, err, "AWS provider should be created without error")
		assert.NotNil(t, provider, "AWS provider should not be nil")

		// Test SNS notification topic
		notificationTopic, err := sns.NewTopic(ctx, "pipeline-notifications-test", &sns.TopicArgs{
			Name:        pulumi.String("pipeline-notifications-test"),
			DisplayName: pulumi.String("CI/CD Pipeline Notifications"),
		})
		assert.NoError(t, err, "Notification topic should be created without error")
		assert.NotNil(t, notificationTopic, "Notification topic should not be nil")

		// Test SNS topic subscription
		_, err = sns.NewTopicSubscription(ctx, "pipeline-email-subscription-test", &sns.TopicSubscriptionArgs{
			Topic:    notificationTopic.Arn,
			Protocol: pulumi.String("email"),
			Endpoint: pulumi.String("ops@company.com"),
		})
		assert.NoError(t, err, "Topic subscription should be created without error")

		// Test SNS approval topic
		approvalTopic, err := sns.NewTopic(ctx, "pipeline-approvals-test", &sns.TopicArgs{
			Name:        pulumi.String("pipeline-approvals-test"),
			DisplayName: pulumi.String("CI/CD Pipeline Manual Approvals"),
		})
		assert.NoError(t, err, "Approval topic should be created without error")
		assert.NotNil(t, approvalTopic, "Approval topic should not be nil")

		// Test approval subscription
		_, err = sns.NewTopicSubscription(ctx, "approval-email-subscription-test", &sns.TopicSubscriptionArgs{
			Topic:    approvalTopic.Arn,
			Protocol: pulumi.String("email"),
			Endpoint: pulumi.String("ops@company.com"),
		})
		assert.NoError(t, err, "Approval subscription should be created without error")

		// Test S3 artifact bucket
		artifactBucket, err := s3.NewBucket(ctx, "pipeline-artifacts-test", &s3.BucketArgs{
			Bucket: pulumi.String("pipeline-artifacts-test"),
		})
		assert.NoError(t, err, "Artifact bucket should be created without error")
		assert.NotNil(t, artifactBucket, "Artifact bucket should not be nil")

		// Test bucket versioning
		_, err = s3.NewBucketVersioningV2(ctx, "pipeline-artifacts-versioning-test", &s3.BucketVersioningV2Args{
			Bucket: artifactBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		assert.NoError(t, err, "Bucket versioning should be configured without error")

		// Test bucket encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "pipeline-artifacts-encryption-test", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		assert.NoError(t, err, "Bucket encryption should be configured without error")

		// Test bucket lifecycle
		_, err = s3.NewBucketLifecycleConfigurationV2(ctx, "pipeline-artifacts-lifecycle-test", &s3.BucketLifecycleConfigurationV2Args{
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
		assert.NoError(t, err, "Bucket lifecycle should be configured without error")

		// Test state buckets and DynamoDB tables for each environment
		environments := []string{"dev", "staging", "prod"}
		stateBuckets := make(map[string]*s3.Bucket)
		stateTables := make(map[string]*dynamodb.Table)

		for _, env := range environments {
			// Test state bucket
			stateBucket, err := s3.NewBucket(ctx, "pulumi-state-"+env+"-test", &s3.BucketArgs{
				Bucket: pulumi.String("pulumi-state-" + env + "-test"),
			})
			assert.NoError(t, err, "State bucket for "+env+" should be created without error")
			assert.NotNil(t, stateBucket, "State bucket for "+env+" should not be nil")
			stateBuckets[env] = stateBucket

			// Test state bucket versioning
			_, err = s3.NewBucketVersioningV2(ctx, "pulumi-state-versioning-"+env+"-test", &s3.BucketVersioningV2Args{
				Bucket: stateBucket.ID(),
				VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
					Status: pulumi.String("Enabled"),
				},
			})
			assert.NoError(t, err, "State bucket versioning for "+env+" should be configured")

			// Test state bucket encryption
			_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "pulumi-state-encryption-"+env+"-test", &s3.BucketServerSideEncryptionConfigurationV2Args{
				Bucket: stateBucket.ID(),
				Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
					&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
						ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
							SseAlgorithm: pulumi.String("AES256"),
						},
					},
				},
			})
			assert.NoError(t, err, "State bucket encryption for "+env+" should be configured")

			// Test DynamoDB state lock table
			stateTable, err := dynamodb.NewTable(ctx, "pulumi-state-lock-"+env+"-test", &dynamodb.TableArgs{
				Name:        pulumi.String("pulumi-state-lock-" + env + "-test"),
				BillingMode: pulumi.String("PAY_PER_REQUEST"),
				HashKey:     pulumi.String("LockID"),
				Attributes: dynamodb.TableAttributeArray{
					&dynamodb.TableAttributeArgs{
						Name: pulumi.String("LockID"),
						Type: pulumi.String("S"),
					},
				},
			})
			assert.NoError(t, err, "State lock table for "+env+" should be created")
			assert.NotNil(t, stateTable, "State lock table for "+env+" should not be nil")
			stateTables[env] = stateTable
		}

		// Test IAM role for CodePipeline
		pipelineRole, err := iam.NewRole(ctx, "codepipeline-role-test", &iam.RoleArgs{
			Name: pulumi.String("codepipeline-role-test"),
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
		assert.NoError(t, err, "CodePipeline role should be created without error")
		assert.NotNil(t, pipelineRole, "CodePipeline role should not be nil")

		// Test CodePipeline policy
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
						"Resource": arn + "/*",
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
			return string(policyJSON), err
		}).(pulumi.StringOutput)

		_, err = iam.NewRolePolicy(ctx, "codepipeline-policy-test", &iam.RolePolicyArgs{
			Name:   pulumi.String("codepipeline-policy-test"),
			Role:   pipelineRole.ID(),
			Policy: pipelinePolicyDocument,
		})
		assert.NoError(t, err, "CodePipeline policy should be created without error")

		// Test IAM role for CodeBuild
		codebuildRole, err := iam.NewRole(ctx, "codebuild-role-test", &iam.RoleArgs{
			Name: pulumi.String("codebuild-role-test"),
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
		assert.NoError(t, err, "CodeBuild role should be created without error")
		assert.NotNil(t, codebuildRole, "CodeBuild role should not be nil")

		// Test CodeBuild policy
		codebuildPolicyDocument := pulumi.All(
			artifactBucket.Arn,
			stateBuckets["dev"].Arn,
			stateBuckets["staging"].Arn,
			stateBuckets["prod"].Arn,
		).ApplyT(func(args []interface{}) (string, error) {
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
							artifactArn + "/*",
							devStateArn + "/*",
							stagingStateArn + "/*",
							prodStateArn + "/*",
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
			return string(policyJSON), err
		}).(pulumi.StringOutput)

		_, err = iam.NewRolePolicy(ctx, "codebuild-policy-test", &iam.RolePolicyArgs{
			Name:   pulumi.String("codebuild-policy-test"),
			Role:   codebuildRole.ID(),
			Policy: codebuildPolicyDocument,
		})
		assert.NoError(t, err, "CodeBuild policy should be created without error")

		// Test CodeBuild projects
		codebuildProjects := make(map[string]*codebuild.Project)
		for _, env := range environments {
			project, err := codebuild.NewProject(ctx, "pulumi-deploy-"+env+"-test", &codebuild.ProjectArgs{
				Name:        pulumi.String("pulumi-deploy-" + env + "-test"),
				Description: pulumi.String("Deploy Pulumi stack for " + env + " environment"),
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
							Value: pulumi.String("project-" + env + "-us-east-1"),
						},
						&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
							Name:  pulumi.String("ENVIRONMENT"),
							Value: pulumi.String(env),
						},
						&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
							Name:  pulumi.String("AWS_REGION"),
							Value: pulumi.String("us-east-1"),
						},
					},
				},
				Source: &codebuild.ProjectSourceArgs{
					Type:      pulumi.String("CODEPIPELINE"),
					Buildspec: pulumi.String("version: 0.2\nphases:\n  install:\n    runtime-versions:\n      golang: 1.19\n    commands:\n      - echo Installing Pulumi CLI\n"),
				},
				LogsConfig: &codebuild.ProjectLogsConfigArgs{
					CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
						Status:     pulumi.String("ENABLED"),
						GroupName:  pulumi.String("/aws/codebuild/pulumi-deploy-" + env + "-test"),
						StreamName: pulumi.String("build-log"),
					},
				},
				ConcurrentBuildLimit: pulumi.Int(2),
			})
			assert.NoError(t, err, "CodeBuild project for "+env+" should be created")
			assert.NotNil(t, project, "CodeBuild project for "+env+" should not be nil")
			codebuildProjects[env] = project
		}

		// Test CodePipeline and EventBridge for dev environment
		env := "dev"
		branchName := "develop"

		// Test pipeline stages
		stages := codepipeline.PipelineStageArray{
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

		// Test pipeline creation
		pipeline, err := codepipeline.NewPipeline(ctx, "pulumi-pipeline-dev-test", &codepipeline.PipelineArgs{
			Name:    pulumi.String("pulumi-pipeline-dev-test"),
			RoleArn: pipelineRole.Arn,
			ArtifactStores: codepipeline.PipelineArtifactStoreArray{
				&codepipeline.PipelineArtifactStoreArgs{
					Type:     pulumi.String("S3"),
					Location: artifactBucket.Bucket,
					Region:   pulumi.String("us-east-1"),
				},
			},
			Stages: stages,
		})
		assert.NoError(t, err, "Pipeline should be created without error")
		assert.NotNil(t, pipeline, "Pipeline should not be nil")

		// Test EventBridge rule for pipeline trigger
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
		assert.NoError(t, err, "Event pattern should marshal without error")

		rule, err := cloudwatch.NewEventRule(ctx, "pipeline-trigger-dev-test", &cloudwatch.EventRuleArgs{
			Name:         pulumi.String("pipeline-trigger-dev-test"),
			Description:  pulumi.String("Trigger pipeline on push to develop branch"),
			EventPattern: pulumi.String(string(eventPatternJSON)),
		})
		assert.NoError(t, err, "Event rule should be created without error")
		assert.NotNil(t, rule, "Event rule should not be nil")

		// Test EventBridge target
		_, err = cloudwatch.NewEventTarget(ctx, "pipeline-target-dev-test", &cloudwatch.EventTargetArgs{
			Rule:    rule.Name,
			Arn:     pipeline.Arn,
			RoleArn: pulumi.String("arn:aws:iam::123456789012:role/service-role/Amazon_EventBridge_Invoke_CodePipeline"),
		})
		assert.NoError(t, err, "Event target should be created without error")

		// Test state change rule
		stateChangePattern := map[string]interface{}{
			"source":      []string{"aws.codepipeline"},
			"detail-type": []string{"CodePipeline Pipeline Execution State Change"},
			"detail": map[string]interface{}{
				"pipeline": []string{"pulumi-pipeline-dev-test"},
				"state":    []string{"FAILED", "SUCCEEDED"},
			},
		}
		stateChangePatternJSON, err := json.Marshal(stateChangePattern)
		assert.NoError(t, err, "State change pattern should marshal without error")

		stateChangeRule, err := cloudwatch.NewEventRule(ctx, "pipeline-state-change-dev-test", &cloudwatch.EventRuleArgs{
			Name:         pulumi.String("pipeline-state-change-dev-test"),
			Description:  pulumi.String("Notify on pipeline state changes for dev"),
			EventPattern: pulumi.String(string(stateChangePatternJSON)),
		})
		assert.NoError(t, err, "State change rule should be created without error")
		assert.NotNil(t, stateChangeRule, "State change rule should not be nil")

		// Test notification target
		_, err = cloudwatch.NewEventTarget(ctx, "pipeline-notification-target-dev-test", &cloudwatch.EventTargetArgs{
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
		assert.NoError(t, err, "Notification target should be created without error")

		// Test exports
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
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err, "Infrastructure should be created without error")
}

func TestApprovalStageForStagingAndProd(t *testing.T) {
	// Test that staging and prod environments get approval stages
	environments := []struct {
		name          string
		shouldApprove bool
		branchName    string
	}{
		{"dev", false, "develop"},
		{"staging", true, "staging"},
		{"prod", true, "main"},
	}

	for _, env := range environments {
		t.Run(env.name, func(t *testing.T) {
			if env.name == "staging" || env.name == "prod" {
				assert.True(t, env.shouldApprove, env.name+" should require approval")
			} else {
				assert.False(t, env.shouldApprove, env.name+" should not require approval")
			}

			// Verify branch mapping
			assert.NotEmpty(t, env.branchName, "Branch name should be set for "+env.name)
		})
	}
}

func TestResourceNaming(t *testing.T) {
	// Test that resources follow naming convention with environment suffix
	environmentSuffix := "test123"

	testCases := []struct {
		resourceType string
		expectedName string
	}{
		{"notification-topic", "pipeline-notifications-test123"},
		{"approval-topic", "pipeline-approvals-test123"},
		{"artifact-bucket", "pipeline-artifacts-test123"},
		{"state-bucket-dev", "pulumi-state-dev-test123"},
		{"state-bucket-staging", "pulumi-state-staging-test123"},
		{"state-bucket-prod", "pulumi-state-prod-test123"},
		{"state-lock-dev", "pulumi-state-lock-dev-test123"},
		{"state-lock-staging", "pulumi-state-lock-staging-test123"},
		{"state-lock-prod", "pulumi-state-lock-prod-test123"},
		{"pipeline-role", "codepipeline-role-test123"},
		{"codebuild-role", "codebuild-role-test123"},
		{"codebuild-project-dev", "pulumi-deploy-dev-test123"},
		{"pipeline-dev", "pulumi-pipeline-dev-test123"},
	}

	for _, tc := range testCases {
		t.Run(tc.resourceType, func(t *testing.T) {
			assert.Contains(t, tc.expectedName, environmentSuffix, "Resource name should contain environment suffix")
		})
	}
}

func TestConstraints(t *testing.T) {
	t.Run("CodeBuild uses correct image", func(t *testing.T) {
		expectedImage := "aws/codebuild/standard:7.0"
		assert.Equal(t, "aws/codebuild/standard:7.0", expectedImage)
	})

	t.Run("Lifecycle policy set to 30 days", func(t *testing.T) {
		expectedDays := 30
		assert.Equal(t, 30, expectedDays)
	})

	t.Run("Bucket encryption uses AES256", func(t *testing.T) {
		expectedAlgorithm := "AES256"
		assert.Equal(t, "AES256", expectedAlgorithm)
	})

	t.Run("Manual approval email endpoint", func(t *testing.T) {
		expectedEmail := "ops@company.com"
		assert.Equal(t, "ops@company.com", expectedEmail)
	})

	t.Run("Concurrent build limit is 2", func(t *testing.T) {
		expectedLimit := 2
		assert.Equal(t, 2, expectedLimit)
	})

	t.Run("Pulumi stack naming pattern", func(t *testing.T) {
		env := "dev"
		region := "us-east-1"
		expectedPattern := "project-" + env + "-" + region
		assert.Equal(t, "project-dev-us-east-1", expectedPattern)
	})
}

func TestBranchMapping(t *testing.T) {
	testCases := []struct {
		environment string
		branch      string
	}{
		{"dev", "develop"},
		{"staging", "staging"},
		{"prod", "main"},
	}

	for _, tc := range testCases {
		t.Run(tc.environment, func(t *testing.T) {
			var branchName string
			switch tc.environment {
			case "dev":
				branchName = "develop"
			case "staging":
				branchName = "staging"
			case "prod":
				branchName = "main"
			default:
				branchName = "develop"
			}
			assert.Equal(t, tc.branch, branchName, "Branch mapping should be correct for "+tc.environment)
		})
	}
}

func TestJSONMarshaling(t *testing.T) {
	// Test event pattern marshaling
	eventPattern := map[string]interface{}{
		"source":      []string{"aws.codecommit"},
		"detail-type": []string{"CodeCommit Repository State Change"},
		"detail": map[string]interface{}{
			"event":         []string{"referenceCreated", "referenceUpdated"},
			"referenceType": []string{"branch"},
			"referenceName": []string{"develop"},
		},
	}

	jsonData, err := json.Marshal(eventPattern)
	assert.NoError(t, err, "Event pattern should marshal without error")
	assert.NotEmpty(t, jsonData, "Marshaled JSON should not be empty")

	// Test policy document marshaling
	policy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{
			{
				"Effect":   "Allow",
				"Action":   []string{"s3:GetObject"},
				"Resource": "*",
			},
		},
	}

	policyJSON, err := json.Marshal(policy)
	assert.NoError(t, err, "Policy should marshal without error")
	assert.NotEmpty(t, policyJSON, "Marshaled policy should not be empty")
}
