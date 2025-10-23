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
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the structure of our infrastructure outputs
type StackOutputs struct {
	KmsKeyID           string `json:"kms_key_id"`
	KmsKeyArn          string `json:"kms_key_arn"`
	VpcID              string `json:"vpc_id"`
	PublicSubnet1ID    string `json:"public_subnet_1_id"`
	PublicSubnet2ID    string `json:"public_subnet_2_id"`
	PrivateSubnet1ID   string `json:"private_subnet_1_id"`
	PrivateSubnet2ID   string `json:"private_subnet_2_id"`
	ApiGatewayID       string `json:"api_gateway_id"`
	ApiGatewayEndpoint string `json:"api_gateway_endpoint"`
	ApiGatewayStageURL string `json:"api_gateway_stage_url"`
	ReadOnlyApiKey     string `json:"read_only_api_key"`
	AdminApiKey        string `json:"admin_api_key"`
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
	assert.NotEmpty(t, outputs.PublicSubnet1ID, "Public Subnet 1 ID should be present")
	assert.NotEmpty(t, outputs.PublicSubnet2ID, "Public Subnet 2 ID should be present")
	assert.NotEmpty(t, outputs.PrivateSubnet1ID, "Private Subnet 1 ID should be present")
	assert.NotEmpty(t, outputs.PrivateSubnet2ID, "Private Subnet 2 ID should be present")
	assert.NotEmpty(t, outputs.ApiGatewayID, "API Gateway ID should be present")
	assert.NotEmpty(t, outputs.ApiGatewayEndpoint, "API Gateway Endpoint should be present")
	assert.NotEmpty(t, outputs.ApiGatewayStageURL, "API Gateway Stage URL should be present")
	assert.NotEmpty(t, outputs.ReadOnlyApiKey, "Read-only API Key should be present")
	assert.NotEmpty(t, outputs.AdminApiKey, "Admin API Key should be present")
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
	assert.True(t, *result.KeyMetadata.Enabled, "KMS key should be enabled")
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
	assert.Equal(t, "172.31.0.0/16", *vpcResult.Vpcs[0].CidrBlock, "VPC should have correct CIDR")

	// Check subnets
	subnets := []struct {
		id   string
		cidr string
		name string
	}{
		{outputs.PublicSubnet1ID, "172.31.80.0/24", "public-1"},
		{outputs.PublicSubnet2ID, "172.31.81.0/24", "public-2"},
		{outputs.PrivateSubnet1ID, "172.31.82.0/24", "private-1"},
		{outputs.PrivateSubnet2ID, "172.31.83.0/24", "private-2"},
	}

	for _, subnet := range subnets {
		subnetInput := &ec2.DescribeSubnetsInput{
			SubnetIds: []string{subnet.id},
		}
		subnetResult, err := ec2Client.DescribeSubnets(context.Background(), subnetInput)
		require.NoError(t, err, fmt.Sprintf("Failed to describe subnet %s", subnet.name))
		assert.Equal(t, 1, len(subnetResult.Subnets), fmt.Sprintf("Subnet %s should exist", subnet.name))
		assert.Equal(t, subnet.cidr, *subnetResult.Subnets[0].CidrBlock,
			fmt.Sprintf("Subnet %s should have correct CIDR", subnet.name))
	}
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

	// Verify API Keys exist and are enabled
	apiKeys := []string{outputs.ReadOnlyApiKey, outputs.AdminApiKey}
	for _, keyId := range apiKeys {
		keyInput := &apigateway.GetApiKeyInput{
			ApiKey: aws.String(keyId),
		}
		keyResult, err := apiClient.GetApiKey(context.Background(), keyInput)
		require.NoError(t, err, "Failed to get API key")
		assert.True(t, *keyResult.Enabled, "API key should be enabled")
	}

	// Verify stage URL is accessible
	assert.True(t, strings.HasPrefix(outputs.ApiGatewayStageURL, "https://"),
		"Stage URL should be HTTPS")
	assert.True(t, strings.Contains(outputs.ApiGatewayStageURL, outputs.ApiGatewayID),
		"Stage URL should contain API ID")
}
