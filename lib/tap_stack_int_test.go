//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/codebuild"
	"github.com/aws/aws-sdk-go-v2/service/codepipeline"
	"github.com/aws/aws-sdk-go-v2/service/codestarconnections"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the deployment outputs
type StackOutputs struct {
	ArtifactBucketName    string `json:"artifactBucketName"`
	CodestarConnectionArn string `json:"codestarConnectionArn"`
	KmsKeyId              string `json:"kmsKeyId"`
	PipelineArn           string `json:"pipelineArn"`
	PipelineName          string `json:"pipelineName"`
	SnsTopicArn           string `json:"snsTopicArn"`
	StateBucketName       string `json:"stateBucketName"`
}

var (
	outputs   *StackOutputs
	ctx       context.Context
	awsConfig aws.Config
	envSuffix string
)

func init() {
	ctx = context.Background()

	// Load stack outputs - try multiple paths for different execution contexts
	outputsPaths := []string{
		"../../cfn-outputs/flat-outputs.json", // From tests/integration/
		"../cfn-outputs/flat-outputs.json",    // From lib/ (when copied)
		"cfn-outputs/flat-outputs.json",       // From root
	}

	var outputsData []byte
	var err error
	for _, path := range outputsPaths {
		outputsData, err = os.ReadFile(path)
		if err == nil {
			break
		}
	}
	if err != nil {
		panic(fmt.Sprintf("Failed to read outputs from any path: %v", err))
	}

	outputs = &StackOutputs{}
	if err := json.Unmarshal(outputsData, outputs); err != nil {
		panic(fmt.Sprintf("Failed to parse outputs: %v", err))
	}

	// Get environment suffix from outputs
	envSuffix = strings.TrimPrefix(outputs.StateBucketName, "pulumi-state-bucket-")

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}
	awsConfig = cfg
}

func TestS3StateBucketExists(t *testing.T) {
	client := s3.NewFromConfig(awsConfig)

	// Check bucket exists
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: &outputs.StateBucketName,
	})
	require.NoError(t, err, "State bucket should exist")

	// Check versioning is enabled
	versioningOutput, err := client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: &outputs.StateBucketName,
	})
	require.NoError(t, err)
	assert.Equal(t, "Enabled", string(versioningOutput.Status), "Bucket versioning should be enabled")

	// Check encryption
	encryptionOutput, err := client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: &outputs.StateBucketName,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, encryptionOutput.ServerSideEncryptionConfiguration.Rules, "Bucket should have encryption configured")
}

func TestS3ArtifactBucketExists(t *testing.T) {
	client := s3.NewFromConfig(awsConfig)

	// Check bucket exists
	_, err := client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: &outputs.ArtifactBucketName,
	})
	require.NoError(t, err, "Artifact bucket should exist")

	// Check lifecycle policy exists
	_, err = client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
		Bucket: &outputs.ArtifactBucketName,
	})
	require.NoError(t, err, "Bucket should have lifecycle policy")
}

func TestKMSKeyExists(t *testing.T) {
	client := kms.NewFromConfig(awsConfig)

	// Describe key
	output, err := client.DescribeKey(ctx, &kms.DescribeKeyInput{
		KeyId: &outputs.KmsKeyId,
	})
	require.NoError(t, err, "KMS key should exist")
	assert.True(t, output.KeyMetadata.Enabled, "KMS key should be enabled")
	assert.Contains(t, *output.KeyMetadata.Description, "Pulumi state encryption", "Key description should match")

	// Check key rotation
	rotationOutput, err := client.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
		KeyId: &outputs.KmsKeyId,
	})
	require.NoError(t, err)
	assert.True(t, rotationOutput.KeyRotationEnabled, "Key rotation should be enabled")
}

func TestSNSTopicExists(t *testing.T) {
	client := sns.NewFromConfig(awsConfig)

	// Get topic attributes
	output, err := client.GetTopicAttributes(ctx, &sns.GetTopicAttributesInput{
		TopicArn: &outputs.SnsTopicArn,
	})
	require.NoError(t, err, "SNS topic should exist")
	assert.NotEmpty(t, output.Attributes, "Topic should have attributes")

	// List subscriptions
	subsOutput, err := client.ListSubscriptionsByTopic(ctx, &sns.ListSubscriptionsByTopicInput{
		TopicArn: &outputs.SnsTopicArn,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, subsOutput.Subscriptions, "Topic should have at least one subscription")
}

func TestCodePipelineExists(t *testing.T) {
	client := codepipeline.NewFromConfig(awsConfig)

	// Get pipeline
	output, err := client.GetPipeline(ctx, &codepipeline.GetPipelineInput{
		Name: &outputs.PipelineName,
	})
	require.NoError(t, err, "Pipeline should exist")

	pipeline := output.Pipeline
	assert.Equal(t, outputs.PipelineName, *pipeline.Name, "Pipeline name should match")
	assert.NotEmpty(t, pipeline.Stages, "Pipeline should have stages")

	// Verify stages
	stageNames := make([]string, 0, len(pipeline.Stages))
	for _, stage := range pipeline.Stages {
		stageNames = append(stageNames, *stage.Name)
	}
	assert.Contains(t, stageNames, "Source", "Should have Source stage")
	assert.Contains(t, stageNames, "Build", "Should have Build stage")
	assert.Contains(t, stageNames, "Test", "Should have Test stage")
	assert.Contains(t, stageNames, "Deploy-Dev", "Should have Deploy-Dev stage")
	assert.Contains(t, stageNames, "Deploy-Prod", "Should have Deploy-Prod stage")
}

func TestCodeBuildProjectsExist(t *testing.T) {
	client := codebuild.NewFromConfig(awsConfig)

	projectNames := []string{
		fmt.Sprintf("app-build-%s", envSuffix),
		fmt.Sprintf("pulumi-preview-%s", envSuffix),
		fmt.Sprintf("pulumi-deploy-dev-%s", envSuffix),
		fmt.Sprintf("pulumi-deploy-prod-%s", envSuffix),
	}

	for _, projectName := range projectNames {
		output, err := client.BatchGetProjects(ctx, &codebuild.BatchGetProjectsInput{
			Names: []string{projectName},
		})
		require.NoError(t, err, "Should be able to get CodeBuild project %s", projectName)
		require.Len(t, output.Projects, 1, "Project %s should exist", projectName)

		project := output.Projects[0]
		assert.Equal(t, projectName, *project.Name)
		assert.NotNil(t, project.ServiceRole, "Project should have a service role")
	}
}

func TestCloudWatchLogGroupsExist(t *testing.T) {
	client := cloudwatchlogs.NewFromConfig(awsConfig)

	logGroupNames := []string{
		fmt.Sprintf("/aws/codebuild/app-build-%s", envSuffix),
		fmt.Sprintf("/aws/codebuild/pulumi-preview-%s", envSuffix),
		fmt.Sprintf("/aws/codebuild/pulumi-deploy-dev-%s", envSuffix),
		fmt.Sprintf("/aws/codebuild/pulumi-deploy-prod-%s", envSuffix),
	}

	for _, logGroupName := range logGroupNames {
		output, err := client.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: &logGroupName,
		})
		require.NoError(t, err, "Should be able to describe log group %s", logGroupName)
		require.NotEmpty(t, output.LogGroups, "Log group %s should exist", logGroupName)

		logGroup := output.LogGroups[0]
		assert.Equal(t, logGroupName, *logGroup.LogGroupName)
		assert.Equal(t, int32(7), *logGroup.RetentionInDays, "Log retention should be 7 days")
	}
}

func TestSSMParametersExist(t *testing.T) {
	client := ssm.NewFromConfig(awsConfig)

	parameterNames := []string{
		fmt.Sprintf("/pulumi/access-token-%s", envSuffix),
		fmt.Sprintf("/pulumi/stack-config-%s", envSuffix),
	}

	for _, paramName := range parameterNames {
		output, err := client.GetParameter(ctx, &ssm.GetParameterInput{
			Name: &paramName,
		})
		require.NoError(t, err, "Parameter %s should exist", paramName)
		assert.Equal(t, paramName, *output.Parameter.Name)
		assert.Equal(t, "SecureString", string(output.Parameter.Type), "Parameter should be SecureString")
	}
}

func TestIAMRolesExist(t *testing.T) {
	client := iam.NewFromConfig(awsConfig)

	roleNames := []string{
		fmt.Sprintf("codebuild-role-%s", envSuffix),
		fmt.Sprintf("pipeline-role-%s", envSuffix),
		fmt.Sprintf("eventbridge-role-%s", envSuffix),
	}

	for _, roleName := range roleNames {
		output, err := client.GetRole(ctx, &iam.GetRoleInput{
			RoleName: &roleName,
		})
		require.NoError(t, err, "Role %s should exist", roleName)
		assert.Equal(t, roleName, *output.Role.RoleName)
		assert.NotEmpty(t, *output.Role.AssumeRolePolicyDocument, "Role should have trust policy")
	}
}

func TestIAMPoliciesExist(t *testing.T) {
	client := iam.NewFromConfig(awsConfig)

	// List policies to find ours
	output, err := client.ListPolicies(ctx, &iam.ListPoliciesInput{
		Scope: "Local",
	})
	require.NoError(t, err)

	policyNames := []string{
		fmt.Sprintf("codebuild-policy-%s", envSuffix),
		fmt.Sprintf("pipeline-policy-%s", envSuffix),
		fmt.Sprintf("eventbridge-policy-%s", envSuffix),
	}

	for _, policyName := range policyNames {
		found := false
		for _, policy := range output.Policies {
			if strings.Contains(*policy.PolicyName, policyName) {
				found = true
				break
			}
		}
		assert.True(t, found, "Policy %s should exist", policyName)
	}
}

func TestEventBridgeRulesExist(t *testing.T) {
	client := eventbridge.NewFromConfig(awsConfig)

	ruleNames := []string{
		fmt.Sprintf("pipeline-trigger-%s", envSuffix),
		fmt.Sprintf("pipeline-failure-%s", envSuffix),
	}

	for _, ruleName := range ruleNames {
		output, err := client.DescribeRule(ctx, &eventbridge.DescribeRuleInput{
			Name: &ruleName,
		})
		require.NoError(t, err, "EventBridge rule %s should exist", ruleName)
		assert.Equal(t, ruleName, *output.Name)
		assert.NotEmpty(t, *output.EventPattern, "Rule should have event pattern")
	}
}

func TestEventBridgeTargetsExist(t *testing.T) {
	client := eventbridge.NewFromConfig(awsConfig)

	ruleName := fmt.Sprintf("pipeline-trigger-%s", envSuffix)
	output, err := client.ListTargetsByRule(ctx, &eventbridge.ListTargetsByRuleInput{
		Rule: &ruleName,
	})
	require.NoError(t, err, "Should be able to list targets for rule %s", ruleName)
	assert.NotEmpty(t, output.Targets, "Rule should have at least one target")
}

func TestCodeStarConnectionExists(t *testing.T) {
	client := codestarconnections.NewFromConfig(awsConfig)

	// Get connection
	output, err := client.GetConnection(ctx, &codestarconnections.GetConnectionInput{
		ConnectionArn: &outputs.CodestarConnectionArn,
	})
	require.NoError(t, err, "CodeStar connection should exist")
	assert.Equal(t, outputs.CodestarConnectionArn, *output.Connection.ConnectionArn)
}

func TestResourceNamingIncludesEnvironmentSuffix(t *testing.T) {
	// Verify all resource names include environment suffix
	assert.Contains(t, outputs.StateBucketName, envSuffix, "State bucket name should contain environment suffix")
	assert.Contains(t, outputs.ArtifactBucketName, envSuffix, "Artifact bucket name should contain environment suffix")
	assert.Contains(t, outputs.PipelineName, envSuffix, "Pipeline name should contain environment suffix")
	assert.Contains(t, outputs.SnsTopicArn, envSuffix, "SNS topic ARN should contain environment suffix")
}

func TestS3BucketPublicAccessBlocked(t *testing.T) {
	client := s3.NewFromConfig(awsConfig)

	buckets := []string{outputs.StateBucketName, outputs.ArtifactBucketName}

	for _, bucket := range buckets {
		output, err := client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: &bucket,
		})
		require.NoError(t, err, "Should have public access block for %s", bucket)
		assert.True(t, *output.PublicAccessBlockConfiguration.BlockPublicAcls, "Public ACLs should be blocked")
		assert.True(t, *output.PublicAccessBlockConfiguration.BlockPublicPolicy, "Public policies should be blocked")
		assert.True(t, *output.PublicAccessBlockConfiguration.IgnorePublicAcls, "Public ACLs should be ignored")
		assert.True(t, *output.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Public buckets should be restricted")
	}
}

func TestKMSKeyAliasExists(t *testing.T) {
	client := kms.NewFromConfig(awsConfig)

	aliasName := fmt.Sprintf("alias/pulumi-state-%s", envSuffix)
	output, err := client.ListAliases(ctx, &kms.ListAliasesInput{})
	require.NoError(t, err)

	found := false
	for _, alias := range output.Aliases {
		if *alias.AliasName == aliasName {
			found = true
			assert.Equal(t, outputs.KmsKeyId, *alias.TargetKeyId, "Alias should point to correct key")
			break
		}
	}
	assert.True(t, found, "KMS alias %s should exist", aliasName)
}

func TestPipelineHasManualApproval(t *testing.T) {
	client := codepipeline.NewFromConfig(awsConfig)

	output, err := client.GetPipeline(ctx, &codepipeline.GetPipelineInput{
		Name: &outputs.PipelineName,
	})
	require.NoError(t, err)

	foundApproval := false
	for _, stage := range output.Pipeline.Stages {
		for _, action := range stage.Actions {
			if string(action.ActionTypeId.Category) == "Approval" {
				foundApproval = true
				break
			}
		}
	}
	assert.True(t, foundApproval, "Pipeline should have a manual approval action")
}

func TestCodeBuildProjectsUseCorrectComputeType(t *testing.T) {
	client := codebuild.NewFromConfig(awsConfig)

	projectNames := []string{
		fmt.Sprintf("app-build-%s", envSuffix),
		fmt.Sprintf("pulumi-preview-%s", envSuffix),
		fmt.Sprintf("pulumi-deploy-dev-%s", envSuffix),
		fmt.Sprintf("pulumi-deploy-prod-%s", envSuffix),
	}

	for _, projectName := range projectNames {
		output, err := client.BatchGetProjects(ctx, &codebuild.BatchGetProjectsInput{
			Names: []string{projectName},
		})
		require.NoError(t, err)
		require.Len(t, output.Projects, 1)

		project := output.Projects[0]
		assert.Equal(t, "BUILD_GENERAL1_MEDIUM", string(project.Environment.ComputeType), "Project %s should use BUILD_GENERAL1_MEDIUM", projectName)
	}
}

func TestSNSTopicHasEventBridgePolicy(t *testing.T) {
	client := sns.NewFromConfig(awsConfig)

	output, err := client.GetTopicAttributes(ctx, &sns.GetTopicAttributesInput{
		TopicArn: &outputs.SnsTopicArn,
	})
	require.NoError(t, err)

	policy := output.Attributes["Policy"]
	assert.NotEmpty(t, policy, "Topic should have a policy")
	assert.Contains(t, policy, "events.amazonaws.com", "Policy should allow EventBridge")
}

func TestAllResourcesHaveTags(t *testing.T) {
	// Test S3 buckets have tags
	s3Client := s3.NewFromConfig(awsConfig)
	for _, bucket := range []string{outputs.StateBucketName, outputs.ArtifactBucketName} {
		output, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
			Bucket: &bucket,
		})
		require.NoError(t, err, "Bucket %s should have tags", bucket)
		assert.NotEmpty(t, output.TagSet, "Bucket %s should have tags", bucket)

		// Verify default tags exist
		tagMap := make(map[string]string)
		for _, tag := range output.TagSet {
			tagMap[*tag.Key] = *tag.Value
		}
		assert.Contains(t, tagMap, "Environment", "Should have Environment tag")
		assert.Equal(t, envSuffix, tagMap["Environment"], "Environment tag should match suffix")
	}
}
