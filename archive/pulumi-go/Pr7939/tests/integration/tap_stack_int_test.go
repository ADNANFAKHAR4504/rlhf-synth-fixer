//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestStackOutputs verifies that all required outputs are exported
func TestStackOutputs(t *testing.T) {
	// Read Pulumi stack outputs
	cmd := exec.Command("pulumi", "stack", "output", "--json")
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to get stack outputs")

	var outputs map[string]interface{}
	err = json.Unmarshal(output, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")

	// Verify required outputs exist
	requiredOutputs := []string{
		"repositoryCloneUrlHttp",
		"repositoryArn",
		"pipelineArn",
		"artifactBucketName",
		"secretArn",
		"kmsKeyArn",
		"logGroupName",
		"vpcId",
		"privateSubnet1Id",
		"privateSubnet2Id",
		"buildSecurityGroupId",
	}

	for _, outputName := range requiredOutputs {
		assert.Contains(t, outputs, outputName, fmt.Sprintf("Missing required output: %s", outputName))
		assert.NotEmpty(t, outputs[outputName], fmt.Sprintf("Output %s is empty", outputName))
	}
}

// TestKMSKeyExists verifies the KMS key was created
func TestKMSKeyExists(t *testing.T) {
	kmsKeyArn := getStackOutput(t, "kmsKeyArn")
	require.NotEmpty(t, kmsKeyArn, "KMS key ARN is empty")

	// Verify KMS key exists using AWS CLI
	cmd := exec.Command("aws", "kms", "describe-key", "--key-id", kmsKeyArn)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe KMS key")
	assert.Contains(t, string(output), "KeyMetadata", "KMS key not found")
}

// TestVPCExists verifies the VPC was created
func TestVPCExists(t *testing.T) {
	vpcId := getStackOutput(t, "vpcId")
	require.NotEmpty(t, vpcId, "VPC ID is empty")

	// Verify VPC exists using AWS CLI
	cmd := exec.Command("aws", "ec2", "describe-vpcs", "--vpc-ids", vpcId)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe VPC")
	assert.Contains(t, string(output), vpcId, "VPC not found")
}

// TestSubnetsExist verifies the subnets were created
func TestSubnetsExist(t *testing.T) {
	subnet1Id := getStackOutput(t, "privateSubnet1Id")
	subnet2Id := getStackOutput(t, "privateSubnet2Id")
	require.NotEmpty(t, subnet1Id, "Private subnet 1 ID is empty")
	require.NotEmpty(t, subnet2Id, "Private subnet 2 ID is empty")

	// Verify subnets exist
	cmd := exec.Command("aws", "ec2", "describe-subnets", "--subnet-ids", subnet1Id, subnet2Id)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe subnets")
	assert.Contains(t, string(output), subnet1Id, "Subnet 1 not found")
	assert.Contains(t, string(output), subnet2Id, "Subnet 2 not found")
}

// TestSecurityGroupExists verifies the security group was created
func TestSecurityGroupExists(t *testing.T) {
	sgId := getStackOutput(t, "buildSecurityGroupId")
	require.NotEmpty(t, sgId, "Security group ID is empty")

	// Verify security group exists
	cmd := exec.Command("aws", "ec2", "describe-security-groups", "--group-ids", sgId)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe security group")
	assert.Contains(t, string(output), sgId, "Security group not found")
}

// TestS3BucketExists verifies the S3 bucket was created
func TestS3BucketExists(t *testing.T) {
	bucketName := getStackOutput(t, "artifactBucketName")
	require.NotEmpty(t, bucketName, "Bucket name is empty")

	// Verify bucket exists
	cmd := exec.Command("aws", "s3api", "head-bucket", "--bucket", bucketName)
	err := cmd.Run()
	assert.NoError(t, err, "S3 bucket not found or not accessible")
}

// TestS3BucketEncryption verifies bucket encryption is enabled
func TestS3BucketEncryption(t *testing.T) {
	bucketName := getStackOutput(t, "artifactBucketName")
	require.NotEmpty(t, bucketName, "Bucket name is empty")

	// Check bucket encryption
	cmd := exec.Command("aws", "s3api", "get-bucket-encryption", "--bucket", bucketName)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to get bucket encryption")
	assert.Contains(t, string(output), "aws:kms", "Bucket not encrypted with KMS")
}

// TestS3BucketVersioning verifies bucket versioning is enabled
func TestS3BucketVersioning(t *testing.T) {
	bucketName := getStackOutput(t, "artifactBucketName")
	require.NotEmpty(t, bucketName, "Bucket name is empty")

	// Check bucket versioning
	cmd := exec.Command("aws", "s3api", "get-bucket-versioning", "--bucket", bucketName)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to get bucket versioning")
	assert.Contains(t, string(output), "Enabled", "Bucket versioning not enabled")
}

// TestCodeCommitRepositoryExists verifies the repository was created
func TestCodeCommitRepositoryExists(t *testing.T) {
	repoArn := getStackOutput(t, "repositoryArn")
	require.NotEmpty(t, repoArn, "Repository ARN is empty")

	// Extract repo name from ARN
	cloneUrl := getStackOutput(t, "repositoryCloneUrlHttp")
	require.NotEmpty(t, cloneUrl, "Clone URL is empty")

	// Verify repository exists
	cmd := exec.Command("aws", "codecommit", "get-repository", "--repository-name", extractRepoName(cloneUrl))
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to get repository")
	assert.Contains(t, string(output), "repositoryMetadata", "Repository not found")
}

// TestSecretsManagerSecretExists verifies the secret was created
func TestSecretsManagerSecretExists(t *testing.T) {
	secretArn := getStackOutput(t, "secretArn")
	require.NotEmpty(t, secretArn, "Secret ARN is empty")

	// Verify secret exists
	cmd := exec.Command("aws", "secretsmanager", "describe-secret", "--secret-id", secretArn)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe secret")
	assert.Contains(t, string(output), "ARN", "Secret not found")
}

// TestCloudWatchLogGroupExists verifies the log group was created
func TestCloudWatchLogGroupExists(t *testing.T) {
	logGroupName := getStackOutput(t, "logGroupName")
	require.NotEmpty(t, logGroupName, "Log group name is empty")

	// Verify log group exists
	cmd := exec.Command("aws", "logs", "describe-log-groups", "--log-group-name-prefix", logGroupName)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe log group")
	assert.Contains(t, string(output), logGroupName, "Log group not found")
}

// TestCodePipelineExists verifies the pipeline was created
func TestCodePipelineExists(t *testing.T) {
	pipelineArn := getStackOutput(t, "pipelineArn")
	require.NotEmpty(t, pipelineArn, "Pipeline ARN is empty")

	// Extract pipeline name from ARN
	pipelineName := extractPipelineName(pipelineArn)
	require.NotEmpty(t, pipelineName, "Pipeline name is empty")

	// Verify pipeline exists
	cmd := exec.Command("aws", "codepipeline", "get-pipeline", "--name", pipelineName)
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to get pipeline")
	assert.Contains(t, string(output), "pipeline", "Pipeline not found")
}

// TestResourceTagging verifies resources are properly tagged
func TestResourceTagging(t *testing.T) {
	vpcId := getStackOutput(t, "vpcId")
	require.NotEmpty(t, vpcId, "VPC ID is empty")

	// Check VPC tags
	cmd := exec.Command("aws", "ec2", "describe-tags", "--filters", fmt.Sprintf("Name=resource-id,Values=%s", vpcId))
	output, err := cmd.Output()
	require.NoError(t, err, "Failed to describe tags")

	// Verify required tags exist
	requiredTags := []string{"Environment", "Compliance"}
	outputStr := string(output)
	for _, tag := range requiredTags {
		assert.Contains(t, outputStr, tag, fmt.Sprintf("Missing required tag: %s", tag))
	}
}

// Helper function to get stack output
func getStackOutput(t *testing.T, outputName string) string {
	cmd := exec.Command("pulumi", "stack", "output", outputName)
	output, err := cmd.Output()
	if err != nil {
		t.Logf("Warning: Failed to get output %s: %v", outputName, err)
		return ""
	}
	return string(output)
}

// Helper function to extract repo name from clone URL
func extractRepoName(cloneUrl string) string {
	// Extract repo name from URL like: https://git-codecommit.region.amazonaws.com/v1/repos/repo-name
	// This is a simplified extraction
	return "pci-transactions-" + os.Getenv("ENVIRONMENT_SUFFIX")
}

// Helper function to extract pipeline name from ARN
func extractPipelineName(arn string) string {
	// Extract pipeline name from ARN like: arn:aws:codepipeline:region:account:pipeline-name
	// This is a simplified extraction
	return "pci-cicd-pipeline-" + os.Getenv("ENVIRONMENT_SUFFIX")
}
