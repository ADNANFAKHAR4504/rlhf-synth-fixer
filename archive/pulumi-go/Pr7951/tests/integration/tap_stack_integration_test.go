package integration

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/codebuild"
	"github.com/aws/aws-sdk-go/service/codepipeline"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// loadOutputs loads the stack outputs from cfn-outputs/flat-outputs.json
func loadOutputs(t *testing.T) map[string]string {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skip("Stack outputs not found - deployment may not have completed")
		return nil
	}

	var outputs map[string]string
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Should parse stack outputs")
	return outputs
}

// getAWSSession creates an AWS session for testing
func getAWSSession(t *testing.T) *session.Session {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	require.NoError(t, err, "Should create AWS session")
	return sess
}

func TestStackOutputsExist(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	// Verify all required outputs are present
	requiredOutputs := []string{
		"artifactBucketName",
		"notificationTopicArn",
		"approvalTopicArn",
		"devStateBucket",
		"stagingStateBucket",
		"prodStateBucket",
		"devStateLockTable",
		"stagingStateLockTable",
		"prodStateLockTable",
		"pipelineRoleArn",
		"codebuildRoleArn",
	}

	for _, output := range requiredOutputs {
		value, exists := outputs[output]
		assert.True(t, exists, "Output %s should exist", output)
		assert.NotEmpty(t, value, "Output %s should not be empty", output)
	}
}

func TestArtifactBucketConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := s3.New(sess)

	bucketName := outputs["artifactBucketName"]
	require.NotEmpty(t, bucketName, "Artifact bucket name should be in outputs")

	// Test bucket exists
	_, err := svc.HeadBucket(&s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	assert.NoError(t, err, "Artifact bucket should exist")

	// Test versioning is enabled
	versioningResult, err := svc.GetBucketVersioning(&s3.GetBucketVersioningInput{
		Bucket: aws.String(bucketName),
	})
	require.NoError(t, err, "Should get bucket versioning")
	assert.Equal(t, "Enabled", *versioningResult.Status, "Versioning should be enabled")

	// Test encryption is configured
	encryptionResult, err := svc.GetBucketEncryption(&s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	})
	require.NoError(t, err, "Should get bucket encryption")
	assert.NotNil(t, encryptionResult.ServerSideEncryptionConfiguration, "Encryption should be configured")
	assert.NotEmpty(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, "Encryption rules should exist")
	assert.Equal(t, "AES256", *encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm, "Should use AES256")

	// Test lifecycle configuration
	lifecycleResult, err := svc.GetBucketLifecycleConfiguration(&s3.GetBucketLifecycleConfigurationInput{
		Bucket: aws.String(bucketName),
	})
	require.NoError(t, err, "Should get lifecycle configuration")
	assert.NotEmpty(t, lifecycleResult.Rules, "Lifecycle rules should exist")
	found := false
	for _, rule := range lifecycleResult.Rules {
		if *rule.Status == "Enabled" && rule.Expiration != nil && *rule.Expiration.Days == 30 {
			found = true
			break
		}
	}
	assert.True(t, found, "Should have lifecycle rule with 30-day expiration")
}

func TestStateBucketsConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := s3.New(sess)

	environments := []string{"dev", "staging", "prod"}
	for _, env := range environments {
		t.Run(env, func(t *testing.T) {
			bucketKey := env + "StateBucket"
			bucketName := outputs[bucketKey]
			require.NotEmpty(t, bucketName, "State bucket for %s should be in outputs", env)

			// Test bucket exists
			_, err := svc.HeadBucket(&s3.HeadBucketInput{
				Bucket: aws.String(bucketName),
			})
			assert.NoError(t, err, "%s state bucket should exist", env)

			// Test versioning
			versioningResult, err := svc.GetBucketVersioning(&s3.GetBucketVersioningInput{
				Bucket: aws.String(bucketName),
			})
			require.NoError(t, err, "Should get %s bucket versioning", env)
			assert.Equal(t, "Enabled", *versioningResult.Status, "%s versioning should be enabled", env)

			// Test encryption
			encryptionResult, err := svc.GetBucketEncryption(&s3.GetBucketEncryptionInput{
				Bucket: aws.String(bucketName),
			})
			require.NoError(t, err, "Should get %s bucket encryption", env)
			assert.Equal(t, "AES256", *encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm, "%s should use AES256", env)
		})
	}
}

func TestStateLockTablesConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := dynamodb.New(sess)

	environments := []string{"dev", "staging", "prod"}
	for _, env := range environments {
		t.Run(env, func(t *testing.T) {
			tableKey := env + "StateLockTable"
			tableName := outputs[tableKey]
			require.NotEmpty(t, tableName, "State lock table for %s should be in outputs", env)

			// Test table exists and configuration
			describeResult, err := svc.DescribeTable(&dynamodb.DescribeTableInput{
				TableName: aws.String(tableName),
			})
			require.NoError(t, err, "%s state lock table should exist", env)

			table := describeResult.Table
			assert.Equal(t, "ACTIVE", *table.TableStatus, "%s table should be active", env)
			assert.Equal(t, "PAY_PER_REQUEST", *table.BillingModeSummary.BillingMode, "%s table should use PAY_PER_REQUEST", env)

			// Verify hash key
			require.NotEmpty(t, table.KeySchema, "Table should have key schema")
			assert.Equal(t, "LockID", *table.KeySchema[0].AttributeName, "Hash key should be LockID")
			assert.Equal(t, "HASH", *table.KeySchema[0].KeyType, "Key type should be HASH")
		})
	}
}

func TestSNSTopicsConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := sns.New(sess)

	t.Run("NotificationTopic", func(t *testing.T) {
		topicArn := outputs["notificationTopicArn"]
		require.NotEmpty(t, topicArn, "Notification topic ARN should be in outputs")

		// Test topic exists
		attrs, err := svc.GetTopicAttributes(&sns.GetTopicAttributesInput{
			TopicArn: aws.String(topicArn),
		})
		require.NoError(t, err, "Notification topic should exist")
		assert.NotNil(t, attrs.Attributes, "Topic should have attributes")

		// Test subscription exists
		subs, err := svc.ListSubscriptionsByTopic(&sns.ListSubscriptionsByTopicInput{
			TopicArn: aws.String(topicArn),
		})
		require.NoError(t, err, "Should list subscriptions")
		assert.NotEmpty(t, subs.Subscriptions, "Topic should have subscriptions")

		// Verify email subscription
		foundEmail := false
		for _, sub := range subs.Subscriptions {
			if *sub.Protocol == "email" && *sub.Endpoint == "ops@company.com" {
				foundEmail = true
				break
			}
		}
		assert.True(t, foundEmail, "Should have email subscription to ops@company.com")
	})

	t.Run("ApprovalTopic", func(t *testing.T) {
		topicArn := outputs["approvalTopicArn"]
		require.NotEmpty(t, topicArn, "Approval topic ARN should be in outputs")

		// Test topic exists
		attrs, err := svc.GetTopicAttributes(&sns.GetTopicAttributesInput{
			TopicArn: aws.String(topicArn),
		})
		require.NoError(t, err, "Approval topic should exist")
		assert.NotNil(t, attrs.Attributes, "Topic should have attributes")

		// Test subscription
		subs, err := svc.ListSubscriptionsByTopic(&sns.ListSubscriptionsByTopicInput{
			TopicArn: aws.String(topicArn),
		})
		require.NoError(t, err, "Should list subscriptions")
		assert.NotEmpty(t, subs.Subscriptions, "Topic should have subscriptions")
	})
}

func TestIAMRolesConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := iam.New(sess)

	t.Run("CodePipelineRole", func(t *testing.T) {
		roleArn := outputs["pipelineRoleArn"]
		require.NotEmpty(t, roleArn, "Pipeline role ARN should be in outputs")

		// Extract role name from ARN
		roleName := extractRoleName(roleArn)

		// Test role exists
		roleResult, err := svc.GetRole(&iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err, "Pipeline role should exist")
		assert.NotNil(t, roleResult.Role, "Role should be returned")

		// Test trust policy allows CodePipeline service
		assert.Contains(t, *roleResult.Role.AssumeRolePolicyDocument, "codepipeline.amazonaws.com", "Trust policy should allow CodePipeline service")
	})

	t.Run("CodeBuildRole", func(t *testing.T) {
		roleArn := outputs["codebuildRoleArn"]
		require.NotEmpty(t, roleArn, "CodeBuild role ARN should be in outputs")

		// Extract role name from ARN
		roleName := extractRoleName(roleArn)

		// Test role exists
		roleResult, err := svc.GetRole(&iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err, "CodeBuild role should exist")
		assert.NotNil(t, roleResult.Role, "Role should be returned")

		// Test trust policy allows CodeBuild service
		assert.Contains(t, *roleResult.Role.AssumeRolePolicyDocument, "codebuild.amazonaws.com", "Trust policy should allow CodeBuild service")
	})
}

func TestCodeBuildProjectsConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := codebuild.New(sess)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	environments := []string{"dev", "staging", "prod"}
	for _, env := range environments {
		t.Run(env, func(t *testing.T) {
			projectName := fmt.Sprintf("pulumi-deploy-%s-%s", env, environmentSuffix)

			// Test project exists
			result, err := svc.BatchGetProjects(&codebuild.BatchGetProjectsInput{
				Names: []*string{aws.String(projectName)},
			})
			require.NoError(t, err, "Should get CodeBuild project for %s", env)
			require.NotEmpty(t, result.Projects, "Project should exist for %s", env)

			project := result.Projects[0]

			// Verify image
			assert.Equal(t, "aws/codebuild/standard:7.0", *project.Environment.Image, "Should use standard:7.0 image")

			// Verify concurrent build limit
			assert.Equal(t, int64(2), *project.ConcurrentBuildLimit, "Concurrent build limit should be 2")

			// Verify environment variables
			envVars := project.Environment.EnvironmentVariables
			assert.NotEmpty(t, envVars, "Should have environment variables")

			// Check for required env vars
			hasStack := false
			hasEnv := false
			hasRegion := false
			for _, envVar := range envVars {
				switch *envVar.Name {
				case "PULUMI_STACK":
					hasStack = true
					assert.Contains(t, *envVar.Value, env, "PULUMI_STACK should contain environment")
				case "ENVIRONMENT":
					hasEnv = true
					assert.Equal(t, env, *envVar.Value, "ENVIRONMENT should match")
				case "AWS_REGION":
					hasRegion = true
				}
			}
			assert.True(t, hasStack, "Should have PULUMI_STACK environment variable")
			assert.True(t, hasEnv, "Should have ENVIRONMENT environment variable")
			assert.True(t, hasRegion, "Should have AWS_REGION environment variable")
		})
	}
}

func TestCodePipelinesConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	sess := getAWSSession(t)
	svc := codepipeline.New(sess)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	environments := []struct {
		name        string
		branch      string
		hasApproval bool
	}{
		{"dev", "develop", false},
		{"staging", "staging", true},
		{"prod", "main", true},
	}

	for _, env := range environments {
		t.Run(env.name, func(t *testing.T) {
			pipelineName := fmt.Sprintf("pulumi-pipeline-%s-%s", env.name, environmentSuffix)

			// Test pipeline exists
			result, err := svc.GetPipeline(&codepipeline.GetPipelineInput{
				Name: aws.String(pipelineName),
			})
			require.NoError(t, err, "Pipeline should exist for %s", env.name)
			assert.NotNil(t, result.Pipeline, "Pipeline should be returned")

			pipeline := result.Pipeline

			// Verify stages
			stages := pipeline.Stages
			assert.NotEmpty(t, stages, "Pipeline should have stages")

			// Count stages (Source, Build, [Approval], Deploy)
			expectedStages := 3
			if env.hasApproval {
				expectedStages = 4
			}
			assert.Equal(t, expectedStages, len(stages), "Pipeline should have %d stages", expectedStages)

			// Verify Source stage
			assert.Equal(t, "Source", *stages[0].Name, "First stage should be Source")

			// Verify Build stage
			assert.Equal(t, "Build", *stages[1].Name, "Second stage should be Build")

			// Verify Approval stage for staging and prod
			if env.hasApproval {
				assert.Equal(t, "Approval", *stages[2].Name, "Third stage should be Approval")
				assert.Equal(t, "Approval", *stages[2].Actions[0].ActionTypeId.Category, "Approval action should be present")
			}
		})
	}
}

func TestResourceNamingConvention(t *testing.T) {
	outputs := loadOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		t.Skip("ENVIRONMENT_SUFFIX not set")
		return
	}

	// Verify all resource names contain environment suffix
	for key, value := range outputs {
		if key == "pipelineRoleArn" || key == "codebuildRoleArn" ||
			key == "notificationTopicArn" || key == "approvalTopicArn" {
			// ARNs should contain environment suffix in the resource name
			assert.Contains(t, value, environmentSuffix, "ARN %s should contain environment suffix", key)
		} else {
			// Bucket and table names should contain environment suffix
			assert.Contains(t, value, environmentSuffix, "Resource %s should contain environment suffix", key)
		}
	}
}

// Helper function to extract role name from ARN
func extractRoleName(arn string) string {
	// ARN format: arn:aws:iam::123456789012:role/role-name
	parts := aws.StringValue(&arn)
	if len(parts) > 0 {
		// Extract last part after "role/"
		idx := len(parts) - 1
		for i := len(parts) - 1; i >= 0; i-- {
			if parts[i] == '/' {
				idx = i + 1
				break
			}
		}
		return parts[idx:]
	}
	return ""
}
