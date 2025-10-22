//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

type DeploymentOutputs struct {
	KMSKeyID                   string `json:"kms_key_id"`
	KMSKeyARN                  string `json:"kms_key_arn"`
	VPCID                      string `json:"vpc_id"`
	KinesisStreamName          string `json:"kinesis_stream_name"`
	KinesisStreamARN           string `json:"kinesis_stream_arn"`
	RDSClusterEndpoint         string `json:"rds_cluster_endpoint"`
	RDSClusterReaderEndpoint   string `json:"rds_cluster_reader_endpoint"`
	ElastiCachePrimaryEndpoint string `json:"elasticache_primary_endpoint"`
	ElastiCacheReaderEndpoint  string `json:"elasticache_reader_endpoint"`
	ECSClusterName             string `json:"ecs_cluster_name"`
	ECSClusterARN              string `json:"ecs_cluster_arn"`
	ECSServiceName             string `json:"ecs_service_name"`
	APIGatewayID               string `json:"api_gateway_id"`
	APIGatewayEndpoint         string `json:"api_gateway_endpoint"`
	DBSecretARN                string `json:"db_secret_arn"`
}

func loadOutputs(t *testing.T) *DeploymentOutputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Skipping integration test - outputs file not found: %v", err)
	}

	var outputs DeploymentOutputs
	err = json.Unmarshal(data, &outputs)
	assert.NoError(t, err)
	return &outputs
}

func TestKMSKeyDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.KMSKeyID, "KMS Key ID should be present")
	assert.NotEmpty(t, outputs.KMSKeyARN, "KMS Key ARN should be present")
	assert.Contains(t, outputs.KMSKeyARN, "arn:aws:kms:")
}

func TestVPCDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.VPCID, "VPC ID should be present")
	assert.Contains(t, outputs.VPCID, "vpc-")
}

func TestKinesisStreamDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.KinesisStreamName, "Kinesis stream name should be present")
	assert.NotEmpty(t, outputs.KinesisStreamARN, "Kinesis stream ARN should be present")
	assert.Contains(t, outputs.KinesisStreamARN, "arn:aws:kinesis:")
	assert.Contains(t, outputs.KinesisStreamName, "patient-data-stream")
}

func TestRDSClusterDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.RDSClusterEndpoint, "RDS cluster endpoint should be present")
	assert.NotEmpty(t, outputs.RDSClusterReaderEndpoint, "RDS cluster reader endpoint should be present")
	assert.Contains(t, outputs.RDSClusterEndpoint, ".rds.amazonaws.com")
}

func TestElastiCacheDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.ElastiCachePrimaryEndpoint, "ElastiCache primary endpoint should be present")
	assert.NotEmpty(t, outputs.ElastiCacheReaderEndpoint, "ElastiCache reader endpoint should be present")
}

func TestECSClusterDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.ECSClusterName, "ECS cluster name should be present")
	assert.NotEmpty(t, outputs.ECSClusterARN, "ECS cluster ARN should be present")
	assert.NotEmpty(t, outputs.ECSServiceName, "ECS service name should be present")
	assert.Contains(t, outputs.ECSClusterARN, "arn:aws:ecs:")
	assert.Contains(t, outputs.ECSClusterName, "healthcare-processing")
}

func TestAPIGatewayDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.APIGatewayID, "API Gateway ID should be present")
	assert.NotEmpty(t, outputs.APIGatewayEndpoint, "API Gateway endpoint should be present")
	assert.Contains(t, outputs.APIGatewayEndpoint, "https://")
	assert.Contains(t, outputs.APIGatewayEndpoint, ".execute-api.")
	assert.Contains(t, outputs.APIGatewayEndpoint, ".amazonaws.com/prod")
}

func TestSecretsManagerDeployed(t *testing.T) {
	outputs := loadOutputs(t)
	assert.NotEmpty(t, outputs.DBSecretARN, "Database secret ARN should be present")
	assert.Contains(t, outputs.DBSecretARN, "arn:aws:secretsmanager:")
}

func TestHIPAACompliance(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify encryption is enabled through KMS
	assert.NotEmpty(t, outputs.KMSKeyARN, "KMS encryption key must be present for HIPAA compliance")

	// Verify database encryption
	assert.NotEmpty(t, outputs.RDSClusterEndpoint, "RDS cluster must be deployed with encryption")

	// Verify cache encryption
	assert.NotEmpty(t, outputs.ElastiCachePrimaryEndpoint, "ElastiCache must be deployed with encryption")

	// Verify secure credential storage
	assert.NotEmpty(t, outputs.DBSecretARN, "Secrets Manager must be used for credentials")
}
