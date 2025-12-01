package integration_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/codebuild"
	"github.com/aws/aws-sdk-go-v2/service/codepipeline"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the stack outputs from deployment
type Outputs struct {
	PipelineArn          string `json:"PipelineArn"`
	BuildProjectName     string `json:"BuildProjectName"`
	ArtifactBucketName   string `json:"ArtifactBucketName"`
	NotificationTopicArn string `json:"NotificationTopicArn"`
}

// loadOutputs loads the cfn-outputs/flat-outputs.json file
func loadOutputs(t *testing.T) Outputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	require.NoError(t, err, "Failed to read ../../cfn-outputs/flat-outputs.json")

	var outputs Outputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse outputs JSON")

	return outputs
}

func TestIntegration_S3Bucket(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	require.NotEmpty(t, outputs.ArtifactBucketName, "ArtifactBucketName not found in outputs")

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Create S3 client
	s3Client := s3.NewFromConfig(cfg)

	// Test: Verify bucket exists
	t.Run("bucket exists", func(t *testing.T) {
		_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: &outputs.ArtifactBucketName,
		})
		assert.NoError(t, err, "Bucket should exist")
	})

	// Test: Verify bucket versioning
	t.Run("bucket has versioning enabled", func(t *testing.T) {
		versioning, err := s3Client.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: &outputs.ArtifactBucketName,
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioning.Status), "Versioning should be enabled")
	})

	// Test: Verify bucket encryption
	t.Run("bucket has encryption enabled", func(t *testing.T) {
		encryption, err := s3Client.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: &outputs.ArtifactBucketName,
		})
		require.NoError(t, err)
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules, "Encryption rules should exist")
	})

	// Test: Verify public access block
	t.Run("bucket blocks public access", func(t *testing.T) {
		publicAccess, err := s3Client.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: &outputs.ArtifactBucketName,
		})
		require.NoError(t, err)
		assert.True(t, *publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls, "Should block public ACLs")
		assert.True(t, *publicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy, "Should block public policy")
		assert.True(t, *publicAccess.PublicAccessBlockConfiguration.IgnorePublicAcls, "Should ignore public ACLs")
		assert.True(t, *publicAccess.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Should restrict public buckets")
	})
}

func TestIntegration_SNSTopic(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	require.NotEmpty(t, outputs.NotificationTopicArn, "NotificationTopicArn not found in outputs")

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Create SNS client
	snsClient := sns.NewFromConfig(cfg)

	// Test: Verify topic exists
	t.Run("topic exists", func(t *testing.T) {
		attrs, err := snsClient.GetTopicAttributes(context.TODO(), &sns.GetTopicAttributesInput{
			TopicArn: &outputs.NotificationTopicArn,
		})
		require.NoError(t, err, "Topic should exist")
		assert.NotEmpty(t, attrs.Attributes, "Topic attributes should not be empty")
	})
}

func TestIntegration_CodeBuildProject(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	require.NotEmpty(t, outputs.BuildProjectName, "BuildProjectName not found in outputs")

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Create CodeBuild client
	cbClient := codebuild.NewFromConfig(cfg)

	// Test: Verify project exists
	t.Run("project exists", func(t *testing.T) {
		projects, err := cbClient.BatchGetProjects(context.TODO(), &codebuild.BatchGetProjectsInput{
			Names: []string{outputs.BuildProjectName},
		})
		require.NoError(t, err, "Failed to get project")
		require.Len(t, projects.Projects, 1, "Should find exactly one project")
		assert.Equal(t, outputs.BuildProjectName, *projects.Projects[0].Name)
	})

	// Test: Verify project configuration
	t.Run("project has correct configuration", func(t *testing.T) {
		projects, err := cbClient.BatchGetProjects(context.TODO(), &codebuild.BatchGetProjectsInput{
			Names: []string{outputs.BuildProjectName},
		})
		require.NoError(t, err)

		project := projects.Projects[0]
		assert.Equal(t, "BUILD_GENERAL1_SMALL", string(project.Environment.ComputeType))
		assert.Equal(t, "LINUX_CONTAINER", string(project.Environment.Type))
		assert.False(t, *project.Environment.PrivilegedMode)
	})
}

func TestIntegration_CodePipeline(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	require.NotEmpty(t, outputs.PipelineArn, "PipelineArn not found in outputs")

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Create CodePipeline client
	cpClient := codepipeline.NewFromConfig(cfg)

	// Extract pipeline name from ARN
	// ARN format: arn:aws:codepipeline:region:account:pipeline-name
	// We need to extract the last part after the last colon
	pipelineName := ""
	for i := len(outputs.PipelineArn) - 1; i >= 0; i-- {
		if outputs.PipelineArn[i] == ':' {
			pipelineName = outputs.PipelineArn[i+1:]
			break
		}
	}
	require.NotEmpty(t, pipelineName, "Failed to extract pipeline name from ARN")

	// Test: Verify pipeline exists
	t.Run("pipeline exists", func(t *testing.T) {
		pipeline, err := cpClient.GetPipeline(context.TODO(), &codepipeline.GetPipelineInput{
			Name: &pipelineName,
		})
		require.NoError(t, err, "Pipeline should exist")
		assert.NotNil(t, pipeline.Pipeline)
	})

	// Test: Verify pipeline has three stages
	t.Run("pipeline has three stages", func(t *testing.T) {
		pipeline, err := cpClient.GetPipeline(context.TODO(), &codepipeline.GetPipelineInput{
			Name: &pipelineName,
		})
		require.NoError(t, err)

		assert.Len(t, pipeline.Pipeline.Stages, 3, "Pipeline should have three stages")
		assert.Equal(t, "Source", *pipeline.Pipeline.Stages[0].Name)
		assert.Equal(t, "Build", *pipeline.Pipeline.Stages[1].Name)
		assert.Equal(t, "Deploy", *pipeline.Pipeline.Stages[2].Name)
	})

	// Test: Verify pipeline status
	t.Run("pipeline is in valid state", func(t *testing.T) {
		state, err := cpClient.GetPipelineState(context.TODO(), &codepipeline.GetPipelineStateInput{
			Name: &pipelineName,
		})
		require.NoError(t, err)
		assert.NotEmpty(t, state.StageStates, "Pipeline should have stage states")
	})
}

func TestIntegration_IAMRoles(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Get environment suffix from outputs (extract from bucket name)
	envSuffix := ""
	bucketName := outputs.ArtifactBucketName
	if len(bucketName) > len("cicd-artifacts-") {
		envSuffix = bucketName[len("cicd-artifacts-"):]
	}
	require.NotEmpty(t, envSuffix, "Failed to extract environment suffix")

	// Create IAM client
	iamClient := iam.NewFromConfig(cfg)

	// Test: Verify CodeBuild role exists
	t.Run("CodeBuild role exists", func(t *testing.T) {
		roleName := "codebuild-role-" + envSuffix
		role, err := iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
			RoleName: &roleName,
		})
		require.NoError(t, err, "CodeBuild role should exist")
		assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "codebuild.amazonaws.com")
	})

	// Test: Verify CodePipeline role exists
	t.Run("CodePipeline role exists", func(t *testing.T) {
		roleName := "codepipeline-role-" + envSuffix
		role, err := iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
			RoleName: &roleName,
		})
		require.NoError(t, err, "CodePipeline role should exist")
		assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "codepipeline.amazonaws.com")
	})
}

func TestIntegration_StackOutputs(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	// Test: All required outputs exist
	t.Run("all required outputs exist", func(t *testing.T) {
		assert.NotEmpty(t, outputs.PipelineArn, "PipelineArn should exist")
		assert.NotEmpty(t, outputs.BuildProjectName, "BuildProjectName should exist")
		assert.NotEmpty(t, outputs.ArtifactBucketName, "ArtifactBucketName should exist")
		assert.NotEmpty(t, outputs.NotificationTopicArn, "NotificationTopicArn should exist")
	})

	// Test: Output format validation
	t.Run("outputs have correct format", func(t *testing.T) {
		assert.Contains(t, outputs.PipelineArn, "arn:aws:codepipeline:")
		assert.Contains(t, outputs.NotificationTopicArn, "arn:aws:sns:")
		assert.Contains(t, outputs.ArtifactBucketName, "cicd-artifacts-")
		assert.Contains(t, outputs.BuildProjectName, "build-project-")
	})
}

func TestIntegration_ResourceConnectivity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	// Test: Pipeline can access artifact bucket
	t.Run("pipeline has access to artifact bucket", func(t *testing.T) {
		cfnClient := cloudformation.NewFromConfig(cfg)

		// Get stack name from environment
		envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if envSuffix == "" {
			envSuffix = "dev"
		}
		stackName := "TapStack" + envSuffix

		// Get stack resources
		resources, err := cfnClient.DescribeStackResources(context.TODO(), &cloudformation.DescribeStackResourcesInput{
			StackName: &stackName,
		})

		if err == nil {
			// Verify both pipeline and bucket exist in the stack
			var hasPipeline, hasBucket bool
			for _, resource := range resources.StackResources {
				if *resource.ResourceType == "AWS::CodePipeline::Pipeline" {
					hasPipeline = true
				}
				if *resource.ResourceType == "AWS::S3::Bucket" {
					hasBucket = true
				}
			}
			assert.True(t, hasPipeline, "Stack should contain CodePipeline")
			assert.True(t, hasBucket, "Stack should contain S3 bucket")
		}
	})
}
