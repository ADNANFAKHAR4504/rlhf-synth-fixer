//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the structure of our infrastructure outputs
type StackOutputs struct {
	KmsKeyID                    string `json:"kmsKeyId" jsonschema:"kmsKeyId"`
	KmsKeyArn                   string `json:"kmsKeyArn" jsonschema:"kmsKeyArn"`
	VpcID                       string `json:"vpcId" jsonschema:"vpcId"`
	ApiGatewayID                string `json:"apiGatewayId" jsonschema:"apiGatewayId"`
	ApiGatewayURL               string `json:"apiGatewayUrl" jsonschema:"apiGatewayUrl"`
	AuroraClusterEndpoint       string `json:"auroraClusterEndpoint" jsonschema:"auroraClusterEndpoint"`
	AuroraClusterReaderEndpoint string `json:"auroraClusterReaderEndpoint" jsonschema:"auroraClusterReaderEndpoint"`
	DbSecretArn                 string `json:"dbSecretArn" jsonschema:"dbSecretArn"`
	RedisClusterEndpoint        string `json:"redisClusterEndpoint" jsonschema:"redisClusterEndpoint"`
	RedisClusterPort            string `json:"redisClusterPort" jsonschema:"redisClusterPort"`
	UsagePlanID                 string `json:"usagePlanId" jsonschema:"usagePlanId"`
}

var outputs StackOutputs

// loadStackOutputs reads outputs from cfn-outputs/flat-outputs.json into the global `outputs` variable.
func loadStackOutputs(t *testing.T) {
	outputsPath := filepath.Join("..", "cfn-outputs", "flat-outputs.json")
	data, err := os.ReadFile(outputsPath)
	if err != nil {
		t.Fatalf("failed to read outputs file %s: %v", outputsPath, err)
	}

	// flat-outputs.json may contain a top-level map[string]StackOutputs or a single object.
	// Try to unmarshal into a map first and fall back to single object.
	var maybeMap map[string]StackOutputs
	if err := json.Unmarshal(data, &maybeMap); err == nil {
		// pick the first element in the map
		for _, v := range maybeMap {
			outputs = v
			break
		}
		return
	}

	// Try single object
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("failed to unmarshal outputs JSON: %v", err)
	}
}

// TestMain ensures outputs are loaded before running integration tests.
func TestMain(m *testing.M) {
	// Try several likely locations for flat-outputs.json (relative to this test file and repo root).
	candidates := []string{
		filepath.Join("..", "cfn-outputs", "flat-outputs.json"), // tests/integration -> repo/tests/integration/../cfn-outputs
		filepath.Join("..", "..", "cfn-outputs", "flat-outputs.json"),
		filepath.Join("cfn-outputs", "flat-outputs.json"),
		filepath.Join("..", "cdk.out", "cfn-outputs", "flat-outputs.json"),
	}

	var data []byte
	var found string
	for _, p := range candidates {
		if b, err := os.ReadFile(p); err == nil {
			data = b
			found = p
			break
		}
	}

	if data == nil {
		// No outputs file found; skip integration tests by exiting 0.
		fmt.Fprintf(os.Stderr, "no cfn-outputs/flat-outputs.json found in candidates; skipping integration tests\n")
		os.Exit(0)
	}

	var maybeMap map[string]StackOutputs
	if err := json.Unmarshal(data, &maybeMap); err == nil {
		for _, v := range maybeMap {
			outputs = v
			break
		}
	} else {
		if err := json.Unmarshal(data, &outputs); err != nil {
			fmt.Fprintf(os.Stderr, "failed to unmarshal outputs JSON from %s: %v\n", found, err)
			os.Exit(1)
		}
	}

	os.Exit(m.Run())
}

// load AWS config and verify credentials; skip test if credentials are not valid
func getAWSConfigOrSkip(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		t.Skipf("Failed to load AWS config: %v", err)
	}

	// Validate credentials with STS
	stsClient := sts.NewFromConfig(cfg)
	_, err = stsClient.GetCallerIdentity(context.Background(), &sts.GetCallerIdentityInput{})
	if err != nil {
		t.Skipf("AWS credentials invalid or not configured: %v", err)
	}

	return cfg
}

func TestIntegration_StackOutputsExist(t *testing.T) {
	// Verify all required outputs are present
	assert.NotEmpty(t, outputs.KmsKeyID, "KMS Key ID should be present")
	assert.NotEmpty(t, outputs.KmsKeyArn, "KMS Key ARN should be present")
	assert.NotEmpty(t, outputs.VpcID, "VPC ID should be present")
	assert.NotEmpty(t, outputs.ApiGatewayID, "API Gateway ID should be present")
	assert.NotEmpty(t, outputs.ApiGatewayURL, "API Gateway URL should be present")
	assert.NotEmpty(t, outputs.AuroraClusterEndpoint, "Aurora Cluster Endpoint should be present")
	assert.NotEmpty(t, outputs.AuroraClusterReaderEndpoint, "Aurora Cluster Reader Endpoint should be present")
	assert.NotEmpty(t, outputs.DbSecretArn, "DB Secret ARN should be present")
	assert.NotEmpty(t, outputs.RedisClusterEndpoint, "Redis Cluster Endpoint should be present")
	assert.NotEmpty(t, outputs.RedisClusterPort, "Redis Cluster Port should be present")
	assert.NotEmpty(t, outputs.UsagePlanID, "Usage Plan ID should be present")
}

func TestIntegration_KMSKeyConfiguration(t *testing.T) {
	cfg := getAWSConfigOrSkip(t)
	kmsClient := kms.NewFromConfig(cfg)

	// Get KMS key details
	input := &kms.DescribeKeyInput{
		KeyId: aws.String(outputs.KmsKeyID),
	}
	result, err := kmsClient.DescribeKey(context.Background(), input)
	require.NoError(t, err, "Failed to describe KMS key")

	// Verify key properties
	assert.True(t, result.KeyMetadata.Enabled, "KMS key should be enabled")
	assert.Equal(t, "SYMMETRIC_DEFAULT", string(result.KeyMetadata.KeySpec), "Key should be symmetric")
	assert.Equal(t, "ENCRYPT_DECRYPT", string(result.KeyMetadata.KeyUsage), "Key usage should be ENCRYPT_DECRYPT")

	// Verify key tags
	tagsInput := &kms.ListResourceTagsInput{
		KeyId: aws.String(outputs.KmsKeyID),
	}
	tagsResult, err := kmsClient.ListResourceTags(context.Background(), tagsInput)
	require.NoError(t, err, "Failed to list KMS key tags")

	hasComplianceTag := false
	for _, tag := range tagsResult.Tags {
		if *tag.TagKey == "Compliance" && *tag.TagValue == "HIPAA" {
			hasComplianceTag = true
			break
		}
	}
	assert.True(t, hasComplianceTag, "KMS key should have HIPAA compliance tag")
}

func TestIntegration_VPCConfiguration(t *testing.T) {
	cfg := getAWSConfigOrSkip(t)
	ec2Client := ec2.NewFromConfig(cfg)

	// Check VPC
	vpcInput := &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcID},
	}
	vpcResult, err := ec2Client.DescribeVpcs(context.Background(), vpcInput)
	require.NoError(t, err, "Failed to describe VPC")
	assert.Equal(t, 1, len(vpcResult.Vpcs), "VPC should exist")

	// Verify VPC has a CIDR block
	assert.NotNil(t, vpcResult.Vpcs[0].CidrBlock, "VPC should have a CIDR block")
}

func TestIntegration_APIGatewayConfiguration(t *testing.T) {
	cfg := getAWSConfigOrSkip(t)
	apiClient := apigateway.NewFromConfig(cfg)

	// Check API Gateway
	input := &apigateway.GetRestApiInput{
		RestApiId: aws.String(outputs.ApiGatewayID),
	}
	result, err := apiClient.GetRestApi(context.Background(), input)
	require.NoError(t, err, "Failed to get API Gateway")

	// Verify API Gateway properties
	assert.Equal(t, "REGIONAL", string(result.EndpointConfiguration.Types[0]),
		"API Gateway should be REGIONAL")

	// Verify API Gateway URL
	assert.True(t, strings.HasPrefix(outputs.ApiGatewayURL, "https://"),
		"API Gateway URL should be HTTPS")
	assert.True(t, strings.Contains(outputs.ApiGatewayURL, outputs.ApiGatewayID),
		"API Gateway URL should contain API ID")
}

func TestIntegration_AuroraClusterConfiguration(t *testing.T) {
	cfg := getAWSConfigOrSkip(t)
	rdsClient := rds.NewFromConfig(cfg)

	// Extract cluster identifier from endpoint
	// Examples:
	// tf-2025...cluster-covy6ema0nuv.us-east-1.rds.amazonaws.com
	// Or: <cluster-id>.cluster-<suffix>....
	// We'll take the first label (before the first dot) as the cluster identifier
	parts := strings.Split(outputs.AuroraClusterEndpoint, ".")
	if len(parts) == 0 {
		t.Fatalf("Aurora endpoint is malformed: %s", outputs.AuroraClusterEndpoint)
	}
	clusterIdentifier := parts[0]

	// Get Aurora cluster details
	input := &rds.DescribeDBClustersInput{
		DBClusterIdentifier: aws.String(clusterIdentifier),
	}
	result, err := rdsClient.DescribeDBClusters(context.Background(), input)
	require.NoError(t, err, "Failed to describe Aurora cluster")
	require.NotEmpty(t, result.DBClusters, "Aurora cluster should exist")

	cluster := result.DBClusters[0]

	// Verify cluster properties
	assert.Equal(t, "aurora-postgresql", *cluster.Engine, "Engine should be aurora-postgresql")
	// Version can vary, just verify it's PostgreSQL-compatible
	assert.True(t, strings.Contains(*cluster.EngineVersion, "."), "Should have a valid engine version")
	assert.Equal(t, "patientdb", *cluster.DatabaseName, "Database name should match configuration")
	assert.True(t, *cluster.StorageEncrypted, "Storage should be encrypted")
	assert.Equal(t, int32(7), *cluster.BackupRetentionPeriod, "Backup retention should be 7 days")
	assert.Equal(t, outputs.AuroraClusterEndpoint, *cluster.Endpoint, "Writer endpoint should match")
	assert.Equal(t, outputs.AuroraClusterReaderEndpoint, *cluster.ReaderEndpoint, "Reader endpoint should match")

	// Verify instances
	instanceInput := &rds.DescribeDBInstancesInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("db-cluster-id"),
				Values: []string{clusterIdentifier},
			},
		},
	}
	instanceResult, err := rdsClient.DescribeDBInstances(context.Background(), instanceInput)
	require.NoError(t, err, "Failed to describe Aurora instances")

	// Should have at least one instance
	assert.GreaterOrEqual(t, len(instanceResult.DBInstances), 1, "Should have at least one DB instance")

	// Verify instance properties
	for _, instance := range instanceResult.DBInstances {
		// Using serverless v2 instead of provisioned instances
		assert.Equal(t, "db.serverless", *instance.DBInstanceClass, "Instance class should be serverless")
		assert.False(t, *instance.PubliclyAccessible, "Instance should not be publicly accessible")
	}

	// Verify cluster tags
	tagsInput := &rds.ListTagsForResourceInput{
		ResourceName: cluster.DBClusterArn,
	}
	tagsResult, err := rdsClient.ListTagsForResource(context.Background(), tagsInput)
	require.NoError(t, err, "Failed to list Aurora cluster tags")

	hasComplianceTag := false
	for _, tag := range tagsResult.TagList {
		if *tag.Key == "Compliance" && *tag.Value == "HIPAA" {
			hasComplianceTag = true
			break
		}
	}
	assert.True(t, hasComplianceTag, "Aurora cluster should have HIPAA compliance tag")
}
