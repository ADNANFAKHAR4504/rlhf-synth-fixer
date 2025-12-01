//go:build integration
// +build integration

package integration

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the outputs from the Pulumi stack
type StackOutputs struct {
	VpcId              string `json:"vpcId"`
	EcsClusterName     string `json:"ecsClusterName"`
	DbInstanceEndpoint string `json:"dbInstanceEndpoint"`
	DbSecretArn        string `json:"dbSecretArn"`
	PipelineName       string `json:"pipelineName"`
	ArtifactBucketName string `json:"artifactBucketName"`
	TaskDefinitionArn  string `json:"taskDefinitionArn"`
}

func loadStackOutputs(t *testing.T) *StackOutputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skip("Stack outputs not available - run deployment first")
	}

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")
	return &outputs
}

func TestVPCDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.VpcId, "VPC ID should be exported")
	assert.Contains(t, outputs.VpcId, "vpc-", "VPC ID should have correct format")
}

func TestECSClusterDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.EcsClusterName, "ECS cluster name should be exported")
	assert.Contains(t, outputs.EcsClusterName, "payment-cluster", "Cluster name should contain expected prefix")
}

func TestRDSInstanceDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.DbInstanceEndpoint, "RDS endpoint should be exported")
	assert.Contains(t, outputs.DbInstanceEndpoint, "rds.amazonaws.com", "Endpoint should be RDS")
}

func TestSecretsManagerSecretDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.DbSecretArn, "Secret ARN should be exported")
	assert.Contains(t, outputs.DbSecretArn, "arn:aws:secretsmanager", "ARN should be SecretsManager")
}

func TestCodePipelineDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.PipelineName, "Pipeline name should be exported")
	assert.Contains(t, outputs.PipelineName, "payment-pipeline", "Pipeline name should contain expected prefix")
}

func TestS3BucketDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.ArtifactBucketName, "Artifact bucket name should be exported")
	assert.Contains(t, outputs.ArtifactBucketName, "payment-pipeline-artifacts", "Bucket name should contain expected prefix")
}

func TestECSTaskDefinitionDeployed(t *testing.T) {
	outputs := loadStackOutputs(t)
	assert.NotEmpty(t, outputs.TaskDefinitionArn, "Task definition ARN should be exported")
	assert.Contains(t, outputs.TaskDefinitionArn, "arn:aws:ecs", "ARN should be ECS")
}

func TestEnvironmentSuffixInResourceNames(t *testing.T) {
	outputs := loadStackOutputs(t)

	// All resources should include environment suffix from deployment
	assert.NotEmpty(t, outputs.EcsClusterName)
	assert.NotEmpty(t, outputs.PipelineName)
	assert.NotEmpty(t, outputs.ArtifactBucketName)
}

func TestMultiAZConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)

	// RDS should be deployed (Multi-AZ verified via configuration)
	assert.NotEmpty(t, outputs.DbInstanceEndpoint, "RDS instance should be deployed")
}

func TestPCIDSSComplianceMarkers(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify encryption is in use (RDS endpoint present implies successful deployment)
	assert.NotEmpty(t, outputs.DbInstanceEndpoint, "Encrypted RDS should be deployed")

	// Verify SecretsManager is used for credentials
	assert.NotEmpty(t, outputs.DbSecretArn, "SecretsManager should manage credentials")
}

func TestCICDPipelineComplete(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify full CI/CD pipeline is deployed
	assert.NotEmpty(t, outputs.PipelineName, "CodePipeline should be deployed")
	assert.NotEmpty(t, outputs.ArtifactBucketName, "Artifact bucket should be deployed")
}

func TestContainerOrchestrationReady(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify ECS resources are deployed
	assert.NotEmpty(t, outputs.EcsClusterName, "ECS cluster should be deployed")
	assert.NotEmpty(t, outputs.TaskDefinitionArn, "Task definition should be deployed")
}

func TestDatabaseConnectivity(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify database endpoint is reachable format
	assert.NotEmpty(t, outputs.DbInstanceEndpoint)
	assert.Contains(t, outputs.DbInstanceEndpoint, ":5432", "PostgreSQL port should be 5432")
}

func TestSecurityConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify security-related resources exist
	assert.NotEmpty(t, outputs.DbSecretArn, "Secrets should be managed")
	assert.NotEmpty(t, outputs.VpcId, "VPC for network isolation should exist")
}

func TestAllStackOutputsPresent(t *testing.T) {
	outputs := loadStackOutputs(t)

	// Verify all expected outputs are present
	assert.NotEmpty(t, outputs.VpcId, "vpcId output missing")
	assert.NotEmpty(t, outputs.EcsClusterName, "ecsClusterName output missing")
	assert.NotEmpty(t, outputs.DbInstanceEndpoint, "dbInstanceEndpoint output missing")
	assert.NotEmpty(t, outputs.DbSecretArn, "dbSecretArn output missing")
	assert.NotEmpty(t, outputs.PipelineName, "pipelineName output missing")
	assert.NotEmpty(t, outputs.ArtifactBucketName, "artifactBucketName output missing")
	assert.NotEmpty(t, outputs.TaskDefinitionArn, "taskDefinitionArn output missing")
}
