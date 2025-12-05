package test

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTerraformOutputsExist verifies that all expected outputs are present
func TestTerraformOutputsExist(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	// Verify all required outputs exist
	assert.NotEmpty(t, outputs["codecommit_clone_url_http"], "codecommit_clone_url_http should be set")
	assert.NotEmpty(t, outputs["codecommit_clone_url_ssh"], "codecommit_clone_url_ssh should be set")
	assert.NotEmpty(t, outputs["pipeline_arn"], "pipeline_arn should be set")
	assert.NotEmpty(t, outputs["pipeline_name"], "pipeline_name should be set")
	assert.NotEmpty(t, outputs["terraform_state_bucket"], "terraform_state_bucket should be set")
	assert.NotEmpty(t, outputs["terraform_locks_table"], "terraform_locks_table should be set")
	assert.NotEmpty(t, outputs["sns_topic_arn"], "sns_topic_arn should be set")
	assert.NotEmpty(t, outputs["kms_key_arn"], "kms_key_arn should be set")
}

// TestCodeCommitURLFormat verifies CodeCommit URLs are correctly formatted
func TestCodeCommitURLFormat(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	httpURL := outputs["codecommit_clone_url_http"].(string)
	sshURL := outputs["codecommit_clone_url_ssh"].(string)

	// Verify HTTP URL format
	assert.Contains(t, httpURL, "https://git-codecommit", "HTTP URL should start with https://git-codecommit")
	assert.Contains(t, httpURL, "us-east-1", "HTTP URL should contain region")
	assert.Contains(t, httpURL, "infrastructure-code-", "HTTP URL should contain repository name")

	// Verify SSH URL format
	assert.Contains(t, sshURL, "ssh://git-codecommit", "SSH URL should start with ssh://git-codecommit")
	assert.Contains(t, sshURL, "us-east-1", "SSH URL should contain region")
	assert.Contains(t, sshURL, "infrastructure-code-", "SSH URL should contain repository name")
}

// TestPipelineARNFormat verifies pipeline ARN is correctly formatted
func TestPipelineARNFormat(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	pipelineARN := outputs["pipeline_arn"].(string)

	assert.Contains(t, pipelineARN, "arn:aws:codepipeline", "Pipeline ARN should be a CodePipeline ARN")
	assert.Contains(t, pipelineARN, "us-east-1", "Pipeline ARN should contain region")
	assert.Contains(t, pipelineARN, "terraform-pipeline-", "Pipeline ARN should contain pipeline name")
}

// TestSNSTopicARNFormat verifies SNS topic ARN is correctly formatted
func TestSNSTopicARNFormat(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	snsARN := outputs["sns_topic_arn"].(string)

	assert.Contains(t, snsARN, "arn:aws:sns", "SNS ARN should be an SNS topic ARN")
	assert.Contains(t, snsARN, "us-east-1", "SNS ARN should contain region")
	assert.Contains(t, snsARN, "pipeline-approvals-", "SNS ARN should contain topic name")
}

// TestKMSKeyARNFormat verifies KMS key ARN is correctly formatted
func TestKMSKeyARNFormat(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	kmsARN := outputs["kms_key_arn"].(string)

	assert.Contains(t, kmsARN, "arn:aws:kms", "KMS ARN should be a KMS key ARN")
	assert.Contains(t, kmsARN, "us-east-1", "KMS ARN should contain region")
	assert.Contains(t, kmsARN, "key/", "KMS ARN should contain key identifier")
}

// TestResourceNamingConvention verifies all resources follow naming convention with environment_suffix
func TestResourceNamingConvention(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	// All resource names should contain a unique suffix for environment isolation
	pipelineName := outputs["pipeline_name"].(string)
	stateBucket := outputs["terraform_state_bucket"].(string)
	locksTable := outputs["terraform_locks_table"].(string)

	// Verify naming patterns
	assert.Contains(t, pipelineName, "terraform-pipeline-", "Pipeline name should follow naming convention")
	assert.Contains(t, stateBucket, "terraform-state-", "State bucket should follow naming convention")
	assert.Contains(t, locksTable, "terraform-locks-", "Locks table should follow naming convention")

	// Extract suffix from pipeline name
	assert.NotEmpty(t, pipelineName, "Pipeline name should not be empty")
	assert.Greater(t, len(pipelineName), len("terraform-pipeline-"), "Pipeline name should have a suffix")
}

// TestStateManagementResources verifies state management resources are configured
func TestStateManagementResources(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	// Verify state bucket exists
	stateBucket := outputs["terraform_state_bucket"].(string)
	assert.NotEmpty(t, stateBucket, "State bucket should be configured")
	assert.Contains(t, stateBucket, "terraform-state-", "State bucket should have correct prefix")

	// Verify locks table exists
	locksTable := outputs["terraform_locks_table"].(string)
	assert.NotEmpty(t, locksTable, "Locks table should be configured")
	assert.Contains(t, locksTable, "terraform-locks-", "Locks table should have correct prefix")
}

// TestPipelineConfiguration verifies pipeline is correctly configured
func TestPipelineConfiguration(t *testing.T) {
	t.Parallel()

	outputs := loadOutputs(t)

	pipelineName := outputs["pipeline_name"].(string)
	pipelineARN := outputs["pipeline_arn"].(string)

	// Verify pipeline name is in ARN
	assert.Contains(t, pipelineARN, pipelineName, "Pipeline ARN should contain pipeline name")

	// Verify pipeline name follows convention
	assert.Contains(t, pipelineName, "terraform-pipeline-", "Pipeline name should have correct prefix")
}

// Helper function to load outputs from flat-outputs.json
func loadOutputs(t *testing.T) map[string]interface{} {
	outputFile := "../cfn-outputs/flat-outputs.json"

	data, err := os.ReadFile(outputFile)
	require.NoError(t, err, "Should be able to read outputs file")

	var outputs map[string]interface{}
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Should be able to parse outputs JSON")

	return outputs
}
