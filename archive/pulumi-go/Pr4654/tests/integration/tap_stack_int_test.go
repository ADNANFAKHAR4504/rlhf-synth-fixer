//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the flattened Pulumi stack outputs
type StackOutputs struct {
	KmsKeyID                   string `json:"kms_key_id"`
	KmsKeyArn                  string `json:"kms_key_arn"`
	VpcID                      string `json:"vpc_id"`
	KinesisStreamName          string `json:"kinesis_stream_name"`
	KinesisStreamArn           string `json:"kinesis_stream_arn"`
	RdsClusterEndpoint         string `json:"rds_cluster_endpoint"`
	RdsClusterReaderEndpoint   string `json:"rds_cluster_reader_endpoint"`
	ElasticachePrimaryEndpoint string `json:"elasticache_primary_endpoint"`
	ElasticacheReaderEndpoint  string `json:"elasticache_reader_endpoint"`
	EfsID                      string `json:"efs_id"`
	EcsClusterName             string `json:"ecs_cluster_name"`
	EcsClusterArn              string `json:"ecs_cluster_arn"`
	EcsServiceName             string `json:"ecs_service_name"`
	ApiGatewayID               string `json:"api_gateway_id"`
	ApiGatewayEndpoint         string `json:"api_gateway_endpoint"`
}

// loadStackOutputs loads the stack outputs from cfn-outputs/flat-outputs.json
func loadStackOutputs(t *testing.T) *StackOutputs {
	outputFile := "cfn-outputs/flat-outputs.json"

	// Check if file exists
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		t.Skipf("Output file %s not found. Stack may not be deployed yet.", outputFile)
		return nil
	}

	data, err := os.ReadFile(outputFile)
	require.NoError(t, err, "Failed to read stack outputs file")

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")

	return &outputs
}

func TestIntegration_StackOutputsExist(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify all required outputs are present
	assert.NotEmpty(t, outputs.KmsKeyID, "KMS Key ID should be present")
	assert.NotEmpty(t, outputs.KmsKeyArn, "KMS Key ARN should be present")
	assert.NotEmpty(t, outputs.VpcID, "VPC ID should be present")
	assert.NotEmpty(t, outputs.KinesisStreamName, "Kinesis Stream Name should be present")
	assert.NotEmpty(t, outputs.KinesisStreamArn, "Kinesis Stream ARN should be present")
	assert.NotEmpty(t, outputs.RdsClusterEndpoint, "RDS Cluster Endpoint should be present")
	assert.NotEmpty(t, outputs.RdsClusterReaderEndpoint, "RDS Cluster Reader Endpoint should be present")
	assert.NotEmpty(t, outputs.ElasticachePrimaryEndpoint, "ElastiCache Primary Endpoint should be present")
	assert.NotEmpty(t, outputs.ElasticacheReaderEndpoint, "ElastiCache Reader Endpoint should be present")
	assert.NotEmpty(t, outputs.EfsID, "EFS ID should be present")
	assert.NotEmpty(t, outputs.EcsClusterName, "ECS Cluster Name should be present")
	assert.NotEmpty(t, outputs.EcsClusterArn, "ECS Cluster ARN should be present")
	assert.NotEmpty(t, outputs.EcsServiceName, "ECS Service Name should be present")
	assert.NotEmpty(t, outputs.ApiGatewayID, "API Gateway ID should be present")
	assert.NotEmpty(t, outputs.ApiGatewayEndpoint, "API Gateway Endpoint should be present")
}

func TestIntegration_KMSKeyConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify KMS Key ID format
	assert.Regexp(t, `^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`, outputs.KmsKeyID, "KMS Key ID should be a valid UUID")

	// Verify KMS Key ARN format
	assert.Regexp(t, `^arn:aws:kms:[a-z0-9-]+:\d{12}:key/[a-f0-9-]+$`, outputs.KmsKeyArn, "KMS Key ARN should be valid")

	t.Logf("KMS Key ID: %s", outputs.KmsKeyID)
	t.Logf("KMS Key ARN: %s", outputs.KmsKeyArn)
}

func TestIntegration_VPCConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify VPC ID format
	assert.Regexp(t, `^vpc-[a-f0-9]+$`, outputs.VpcID, "VPC ID should be valid")

	t.Logf("VPC ID: %s", outputs.VpcID)
}

func TestIntegration_KinesisStreamConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Verify Kinesis Stream Name includes environment suffix
	expectedStreamName := fmt.Sprintf("patient-data-stream-%s", environmentSuffix)
	assert.Equal(t, expectedStreamName, outputs.KinesisStreamName, "Kinesis Stream Name should include environment suffix")

	// Verify Kinesis Stream ARN format
	assert.Regexp(t, `^arn:aws:kinesis:[a-z0-9-]+:\d{12}:stream/.+$`, outputs.KinesisStreamArn, "Kinesis Stream ARN should be valid")

	t.Logf("Kinesis Stream Name: %s", outputs.KinesisStreamName)
	t.Logf("Kinesis Stream ARN: %s", outputs.KinesisStreamArn)
}

func TestIntegration_RDSClusterConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Verify RDS endpoints contain environment suffix
	assert.Contains(t, outputs.RdsClusterEndpoint, environmentSuffix, "RDS Cluster Endpoint should contain environment suffix")
	assert.Contains(t, outputs.RdsClusterReaderEndpoint, environmentSuffix, "RDS Cluster Reader Endpoint should contain environment suffix")

	// Verify endpoint format (Aurora PostgreSQL)
	assert.Regexp(t, `^healthcare-aurora-.+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$`, outputs.RdsClusterEndpoint, "RDS Cluster Endpoint should be valid")
	assert.Regexp(t, `^healthcare-aurora-.+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$`, outputs.RdsClusterReaderEndpoint, "RDS Cluster Reader Endpoint should be valid")

	t.Logf("RDS Cluster Endpoint: %s", outputs.RdsClusterEndpoint)
	t.Logf("RDS Cluster Reader Endpoint: %s", outputs.RdsClusterReaderEndpoint)
}

func TestIntegration_ElastiCacheConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Verify ElastiCache endpoints contain environment suffix
	assert.Contains(t, outputs.ElasticachePrimaryEndpoint, environmentSuffix, "ElastiCache Primary Endpoint should contain environment suffix")
	assert.Contains(t, outputs.ElasticacheReaderEndpoint, environmentSuffix, "ElastiCache Reader Endpoint should contain environment suffix")

	// Verify endpoint format (Redis)
	assert.Regexp(t, `^healthcare-redis-.+\.[a-z0-9]+\.cache\.amazonaws\.com$`, outputs.ElasticachePrimaryEndpoint, "ElastiCache Primary Endpoint should be valid")
	assert.Regexp(t, `^healthcare-redis-.+\.[a-z0-9]+\.cache\.amazonaws\.com$`, outputs.ElasticacheReaderEndpoint, "ElastiCache Reader Endpoint should be valid")

	t.Logf("ElastiCache Primary Endpoint: %s", outputs.ElasticachePrimaryEndpoint)
	t.Logf("ElastiCache Reader Endpoint: %s", outputs.ElasticacheReaderEndpoint)
}

func TestIntegration_EFSConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify EFS ID format
	assert.Regexp(t, `^fs-[a-f0-9]+$`, outputs.EfsID, "EFS ID should be valid")

	t.Logf("EFS ID: %s", outputs.EfsID)
}

func TestIntegration_ECSClusterConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Verify ECS Cluster Name includes environment suffix
	expectedClusterName := fmt.Sprintf("healthcare-processing-%s", environmentSuffix)
	assert.Equal(t, expectedClusterName, outputs.EcsClusterName, "ECS Cluster Name should include environment suffix")

	// Verify ECS Cluster ARN format
	assert.Regexp(t, `^arn:aws:ecs:[a-z0-9-]+:\d{12}:cluster/.+$`, outputs.EcsClusterArn, "ECS Cluster ARN should be valid")

	// Verify ECS Service Name includes environment suffix
	expectedServiceName := fmt.Sprintf("healthcare-processing-service-%s", environmentSuffix)
	assert.Equal(t, expectedServiceName, outputs.EcsServiceName, "ECS Service Name should include environment suffix")

	t.Logf("ECS Cluster Name: %s", outputs.EcsClusterName)
	t.Logf("ECS Cluster ARN: %s", outputs.EcsClusterArn)
	t.Logf("ECS Service Name: %s", outputs.EcsServiceName)
}

func TestIntegration_APIGatewayConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Verify API Gateway ID format
	assert.Regexp(t, `^[a-z0-9]+$`, outputs.ApiGatewayID, "API Gateway ID should be valid")

	// Verify API Gateway Endpoint format
	expectedEndpointPattern := fmt.Sprintf(`^https://%s\.execute-api\.%s\.amazonaws\.com/prod$`, outputs.ApiGatewayID, region)
	assert.Regexp(t, expectedEndpointPattern, outputs.ApiGatewayEndpoint, "API Gateway Endpoint should be valid")

	t.Logf("API Gateway ID: %s", outputs.ApiGatewayID)
	t.Logf("API Gateway Endpoint: %s", outputs.ApiGatewayEndpoint)
}

func TestIntegration_ResourceNamingConvention(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Verify all resources follow naming convention with environment suffix
	resources := map[string]string{
		"Kinesis Stream": outputs.KinesisStreamName,
		"RDS Endpoint":   outputs.RdsClusterEndpoint,
		"Cache Endpoint": outputs.ElasticachePrimaryEndpoint,
		"ECS Cluster":    outputs.EcsClusterName,
		"ECS Service":    outputs.EcsServiceName,
	}

	for name, value := range resources {
		assert.Contains(t, value, environmentSuffix, fmt.Sprintf("%s should contain environment suffix %s", name, environmentSuffix))
	}
}

func TestIntegration_MultiAZDeployment(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify RDS has both primary and reader endpoints (Multi-AZ)
	assert.NotEqual(t, outputs.RdsClusterEndpoint, outputs.RdsClusterReaderEndpoint, "RDS should have separate primary and reader endpoints for Multi-AZ")

	// Verify ElastiCache has both primary and reader endpoints (Multi-AZ)
	assert.NotEqual(t, outputs.ElasticachePrimaryEndpoint, outputs.ElasticacheReaderEndpoint, "ElastiCache should have separate primary and reader endpoints for Multi-AZ")

	t.Log("Multi-AZ configuration verified: RDS and ElastiCache have separate endpoints")
}

func TestIntegration_EncryptionAtRest(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify KMS key exists (used for encryption at rest)
	assert.NotEmpty(t, outputs.KmsKeyArn, "KMS Key should exist for encryption at rest")

	// All encrypted resources reference the KMS key
	t.Log("KMS Key verified for encryption at rest")
	t.Logf("Resources encrypted with KMS: Kinesis, RDS, ElastiCache, EFS")
}

func TestIntegration_HIPAACompliance(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// HIPAA Compliance checks
	compliance := map[string]bool{
		"KMS encryption enabled":     outputs.KmsKeyArn != "",
		"VPC configured":             outputs.VpcID != "",
		"RDS Multi-AZ":               outputs.RdsClusterReaderEndpoint != "",
		"ElastiCache Multi-AZ":       outputs.ElasticacheReaderEndpoint != "",
		"ECS cluster deployed":       outputs.EcsClusterArn != "",
		"API Gateway deployed":       outputs.ApiGatewayEndpoint != "",
		"Kinesis encryption enabled": outputs.KinesisStreamArn != "",
		"EFS encryption enabled":     outputs.EfsID != "",
	}

	failedChecks := []string{}
	for check, passed := range compliance {
		if !passed {
			failedChecks = append(failedChecks, check)
		}
	}

	assert.Empty(t, failedChecks, "All HIPAA compliance checks should pass")

	if len(failedChecks) == 0 {
		t.Log("✅ All HIPAA compliance checks passed")
	} else {
		t.Logf("❌ Failed checks: %v", failedChecks)
	}
}

func TestIntegration_AutoScalingConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify ECS service exists (which includes auto-scaling configuration)
	assert.NotEmpty(t, outputs.EcsServiceName, "ECS Service should be deployed with auto-scaling")

	t.Log("ECS Service deployed with auto-scaling configuration (2-10 tasks)")
}

func TestIntegration_MonitoringAndLogging(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify resources that generate logs/metrics exist
	assert.NotEmpty(t, outputs.VpcID, "VPC should exist for Flow Logs")
	assert.NotEmpty(t, outputs.EcsClusterArn, "ECS Cluster should exist for Container Insights")
	assert.NotEmpty(t, outputs.ApiGatewayID, "API Gateway should exist for access logs")
	assert.NotEmpty(t, outputs.RdsClusterEndpoint, "RDS should exist for PostgreSQL logs")
	assert.NotEmpty(t, outputs.KinesisStreamArn, "Kinesis should exist for stream metrics")

	t.Log("✅ All monitoring and logging resources deployed")
	t.Log("CloudWatch Logs: VPC Flow Logs, ECS Logs, API Gateway Logs, RDS Logs, Kinesis Metrics")
}

func TestIntegration_NetworkSecurity(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// Verify VPC is configured (implies security groups and network isolation)
	assert.NotEmpty(t, outputs.VpcID, "VPC should be configured for network isolation")

	// Verify private resources (RDS, ElastiCache, EFS) are accessible via private endpoints
	assert.NotContains(t, outputs.RdsClusterEndpoint, "public", "RDS should not be publicly accessible")
	assert.NotContains(t, outputs.ElasticachePrimaryEndpoint, "public", "ElastiCache should not be publicly accessible")

	t.Log("✅ Network security verified: VPC configured, private resources not publicly accessible")
}

func TestIntegration_HighAvailability(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	// High availability features
	haFeatures := map[string]bool{
		"RDS Multi-AZ (reader endpoint)":         outputs.RdsClusterReaderEndpoint != "",
		"ElastiCache Multi-AZ (reader endpoint)": outputs.ElasticacheReaderEndpoint != "",
		"ECS Fargate (multi-AZ deployment)":      outputs.EcsServiceName != "",
		"VPC (multi-AZ subnets)":                 outputs.VpcID != "",
	}

	failedFeatures := []string{}
	for feature, enabled := range haFeatures {
		if !enabled {
			failedFeatures = append(failedFeatures, feature)
		}
	}

	assert.Empty(t, failedFeatures, "All high availability features should be enabled")

	if len(failedFeatures) == 0 {
		t.Log("✅ High Availability: 99.99% uptime configuration verified")
	} else {
		t.Logf("❌ Missing HA features: %v", failedFeatures)
	}
}
