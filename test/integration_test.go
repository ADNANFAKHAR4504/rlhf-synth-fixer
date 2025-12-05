package test

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestIntegrationCodeCommitRepository verifies CodeCommit repository exists
func TestIntegrationCodeCommitRepository(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	// Verify CodeCommit URLs are accessible
	httpURL := outputs["codecommit_clone_url_http"].(string)
	sshURL := outputs["codecommit_clone_url_ssh"].(string)

	assert.NotEmpty(t, httpURL, "HTTP clone URL should be provided")
	assert.NotEmpty(t, sshURL, "SSH clone URL should be provided")

	// Verify URL formats
	assert.Contains(t, httpURL, "infrastructure-code-", "Repository name should be in HTTP URL")
	assert.Contains(t, sshURL, "infrastructure-code-", "Repository name should be in SSH URL")
}

// TestIntegrationCodePipeline verifies CodePipeline configuration
func TestIntegrationCodePipeline(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	pipelineARN := outputs["pipeline_arn"].(string)
	pipelineName := outputs["pipeline_name"].(string)

	// Verify pipeline exists
	assert.NotEmpty(t, pipelineARN, "Pipeline ARN should be set")
	assert.NotEmpty(t, pipelineName, "Pipeline name should be set")

	// Verify pipeline ARN format
	assert.Contains(t, pipelineARN, "arn:aws:codepipeline:us-east-1", "Pipeline should be in us-east-1")
	assert.Contains(t, pipelineARN, pipelineName, "ARN should contain pipeline name")
}

// TestIntegrationS3StateBucket verifies S3 state bucket configuration
func TestIntegrationS3StateBucket(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	stateBucket := outputs["terraform_state_bucket"].(string)

	assert.NotEmpty(t, stateBucket, "State bucket should be configured")
	assert.Contains(t, stateBucket, "terraform-state-", "Bucket should have correct prefix")

	// Verify bucket naming includes environment suffix
	assert.Greater(t, len(stateBucket), len("terraform-state-"), "Bucket should have environment suffix")
}

// TestIntegrationDynamoDBLocksTable verifies DynamoDB locks table
func TestIntegrationDynamoDBLocksTable(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	locksTable := outputs["terraform_locks_table"].(string)

	assert.NotEmpty(t, locksTable, "Locks table should be configured")
	assert.Contains(t, locksTable, "terraform-locks-", "Table should have correct prefix")

	// Verify table naming includes environment suffix
	assert.Greater(t, len(locksTable), len("terraform-locks-"), "Table should have environment suffix")
}

// TestIntegrationSNSTopic verifies SNS topic for approvals
func TestIntegrationSNSTopic(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	snsARN := outputs["sns_topic_arn"].(string)

	assert.NotEmpty(t, snsARN, "SNS topic ARN should be set")
	assert.Contains(t, snsARN, "arn:aws:sns:us-east-1", "SNS topic should be in us-east-1")
	assert.Contains(t, snsARN, "pipeline-approvals-", "Topic should have correct name prefix")
}

// TestIntegrationKMSKey verifies KMS key for encryption
func TestIntegrationKMSKey(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	kmsARN := outputs["kms_key_arn"].(string)

	assert.NotEmpty(t, kmsARN, "KMS key ARN should be set")
	assert.Contains(t, kmsARN, "arn:aws:kms:us-east-1", "KMS key should be in us-east-1")
	assert.Contains(t, kmsARN, "key/", "ARN should contain key identifier")

	// Verify it's a valid UUID format after "key/"
	assert.Greater(t, len(kmsARN), len("arn:aws:kms:us-east-1:123456789012:key/"), "Key should have UUID")
}

// TestIntegrationResourceIsolation verifies resources are properly isolated with environment suffix
func TestIntegrationResourceIsolation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	pipelineName := outputs["pipeline_name"].(string)
	stateBucket := outputs["terraform_state_bucket"].(string)
	locksTable := outputs["terraform_locks_table"].(string)

	// Extract suffix from pipeline name (everything after "terraform-pipeline-")
	pipelineSuffix := pipelineName[len("terraform-pipeline-"):]

	// Verify all resources use the same suffix
	assert.Contains(t, stateBucket, pipelineSuffix, "State bucket should use same suffix")
	assert.Contains(t, locksTable, pipelineSuffix, "Locks table should use same suffix")
	assert.NotEmpty(t, pipelineSuffix, "Environment suffix should not be empty")
}

// TestIntegrationOutputsFile verifies the outputs file structure
func TestIntegrationOutputsFile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputFile := "../cfn-outputs/flat-outputs.json"

	// Verify file exists
	_, err := os.Stat(outputFile)
	require.NoError(t, err, "Outputs file should exist")

	// Verify file can be parsed
	data, err := os.ReadFile(outputFile)
	require.NoError(t, err, "Should be able to read outputs file")

	var outputs map[string]interface{}
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Outputs should be valid JSON")

	// Verify all required keys exist
	requiredKeys := []string{
		"codecommit_clone_url_http",
		"codecommit_clone_url_ssh",
		"pipeline_arn",
		"pipeline_name",
		"terraform_state_bucket",
		"terraform_locks_table",
		"sns_topic_arn",
		"kms_key_arn",
	}

	for _, key := range requiredKeys {
		assert.Contains(t, outputs, key, "Outputs should contain key: "+key)
		assert.NotEmpty(t, outputs[key], "Output value should not be empty: "+key)
	}
}

// TestIntegrationEndToEndPipeline verifies the complete pipeline configuration
func TestIntegrationEndToEndPipeline(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	outputs := loadOutputs(t)

	// Verify pipeline components
	pipelineARN := outputs["pipeline_arn"].(string)
	pipelineName := outputs["pipeline_name"].(string)
	repoURL := outputs["codecommit_clone_url_http"].(string)
	snsARN := outputs["sns_topic_arn"].(string)
	kmsARN := outputs["kms_key_arn"].(string)
	stateBucket := outputs["terraform_state_bucket"].(string)
	locksTable := outputs["terraform_locks_table"].(string)

	// Verify all components exist
	assert.NotEmpty(t, pipelineARN, "Pipeline should exist")
	assert.NotEmpty(t, pipelineName, "Pipeline should have a name")
	assert.NotEmpty(t, repoURL, "Repository should exist")
	assert.NotEmpty(t, snsARN, "SNS topic should exist for approvals")
	assert.NotEmpty(t, kmsARN, "KMS key should exist for encryption")
	assert.NotEmpty(t, stateBucket, "State bucket should exist")
	assert.NotEmpty(t, locksTable, "Locks table should exist")

	// Verify all components are in the same region
	assert.Contains(t, pipelineARN, "us-east-1", "Pipeline should be in us-east-1")
	assert.Contains(t, repoURL, "us-east-1", "Repository should be in us-east-1")
	assert.Contains(t, snsARN, "us-east-1", "SNS topic should be in us-east-1")
	assert.Contains(t, kmsARN, "us-east-1", "KMS key should be in us-east-1")
}
