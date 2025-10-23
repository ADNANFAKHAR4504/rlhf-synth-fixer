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
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the structure of our infrastructure outputs
type StackOutputs struct {
	KmsKeyID                    string `json:"kmsKeyId"`
	KmsKeyArn                   string `json:"kmsKeyArn"`
	VpcID                       string `json:"vpcId"`
	ApiGatewayID                string `json:"apiGatewayId"`
	ApiGatewayURL               string `json:"apiGatewayUrl"`
	AuroraClusterEndpoint       string `json:"auroraClusterEndpoint"`
	AuroraClusterReaderEndpoint string `json:"auroraClusterReaderEndpoint"`
	DbSecretArn                 string `json:"dbSecretArn"`
	RedisClusterEndpoint        string `json:"redisClusterEndpoint"`
	RedisClusterPort            string `json:"redisClusterPort"`
	UsagePlanID                 string `json:"usagePlanId"`
}

func loadStackOutputs(t *testing.T) *StackOutputs {
	outputFile := "../cfn-outputs/flat-outputs.json"

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

func getAWSConfig(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.Background())
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
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
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	cfg := getAWSConfig(t)
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
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	cfg := getAWSConfig(t)
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
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	cfg := getAWSConfig(t)
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

func TestIntegration_RedisClusterConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	cfg := getAWSConfig(t)
	redisClient := elasticache.NewFromConfig(cfg)

	// Extract cluster name from endpoint
	// Endpoint format: clustername.xxxxx.region.cache.amazonaws.com
	clusterName := strings.Split(outputs.RedisClusterEndpoint, ".")[0]

	// Get Redis cluster details
	input := &elasticache.DescribeCacheClustersInput{
		CacheClusterId:    aws.String(clusterName),
		ShowCacheNodeInfo: aws.Bool(true),
	}
	result, err := redisClient.DescribeCacheClusters(context.Background(), input)
	require.NoError(t, err, "Failed to describe Redis cluster")
	require.NotEmpty(t, result.CacheClusters, "Redis cluster should exist")

	cluster := result.CacheClusters[0]

	// Verify cluster properties
	assert.Equal(t, "redis", *cluster.Engine, "Engine should be redis")
	assert.True(t, strings.HasPrefix(*cluster.EngineVersion, "6."), "Engine version should be 6.x")
	assert.Equal(t, 3, len(cluster.CacheNodes), "Should have 3 cache nodes")
	assert.Equal(t, outputs.RedisClusterPort, fmt.Sprintf("%d", *cluster.ConfigurationEndpoint.Port),
		"Port should match the output")

	// Verify cluster tags
	tagsInput := &elasticache.ListTagsForResourceInput{
		ResourceName: cluster.ARN,
	}
	tagsResult, err := redisClient.ListTagsForResource(context.Background(), tagsInput)
	require.NoError(t, err, "Failed to list Redis cluster tags")

	hasComplianceTag := false
	for _, tag := range tagsResult.TagList {
		if *tag.Key == "Compliance" && *tag.Value == "HIPAA" {
			hasComplianceTag = true
			break
		}
	}
	assert.True(t, hasComplianceTag, "Redis cluster should have HIPAA compliance tag")
}

func TestIntegration_AuroraClusterConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	if outputs == nil {
		return
	}

	cfg := getAWSConfig(t)
	rdsClient := rds.NewFromConfig(cfg)

	// Extract cluster identifier from endpoint
	// Endpoint format: cluster-name.cluster-xxxxx.region.rds.amazonaws.com
	clusterIdentifier := strings.Split(strings.Split(outputs.AuroraClusterEndpoint, ".")[0], "cluster-")[1]

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
	assert.True(t, strings.HasPrefix(*cluster.EngineVersion, "13."), "Engine version should be 13.x")
	assert.Equal(t, "patient_records", *cluster.DatabaseName, "Database name should be patient_records")
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
		assert.Equal(t, "db.r5.large", *instance.DBInstanceClass, "Instance class should be db.r5.large")
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
