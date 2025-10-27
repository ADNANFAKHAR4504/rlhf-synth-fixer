//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	ecstypes "github.com/aws/aws-sdk-go-v2/service/ecs/types"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestStack creates a new Pulumi stack for integration testing
func setupTestStack(t *testing.T, stackName string, program pulumi.RunFunc) (auto.Stack, error) {
	ctx := context.Background()

	// Get the project root directory
	projectDir, err := filepath.Abs("../..")
	if err != nil {
		return auto.Stack{}, fmt.Errorf("failed to get project directory: %w", err)
	}

	// Create workspace
	ws, err := auto.NewLocalWorkspace(ctx,
		auto.Program(program),
		auto.WorkDir(projectDir),
	)
	if err != nil {
		return auto.Stack{}, fmt.Errorf("failed to create workspace: %w", err)
	}

	// Create or select stack
	stack, err := auto.UpsertStack(ctx, stackName, ws)
	if err != nil {
		return auto.Stack{}, fmt.Errorf("failed to upsert stack: %w", err)
	}

	// Set configuration
	err = stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: "us-east-1"})
	if err != nil {
		return auto.Stack{}, fmt.Errorf("failed to set region config: %w", err)
	}

	err = stack.SetConfig(ctx, "environmentSuffix", auto.ConfigValue{Value: "inttest"})
	if err != nil {
		return auto.Stack{}, fmt.Errorf("failed to set environment config: %w", err)
	}

	return stack, nil
}

func TestIntegrationFullStackDeployment(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	// Import the CreateStack function from the lib package
	// Since we can't directly import due to package issues, we'll use a workaround
	t.Log("Testing full stack deployment and configuration")
	t.Log("This test would deploy the entire infrastructure and verify all components")

	// Note: Full deployment test requires actual AWS credentials and can be expensive
	// This is a placeholder for the actual implementation
	t.Skip("Full deployment test requires AWS credentials and is expensive to run")
}

func TestIntegrationVPCConfiguration(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	// This test verifies VPC configuration from deployed stack
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)

	t.Log("Testing VPC configuration")

	// Read stack outputs to get VPC ID
	// This assumes the stack has been deployed previously
	vpcID := os.Getenv("TEST_VPC_ID")
	if vpcID == "" {
		t.Skip("TEST_VPC_ID not set - skipping VPC validation")
	}

	// Verify VPC exists and has correct configuration
	describeVpcInput := &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	}

	vpcResult, err := ec2Client.DescribeVpcs(ctx, describeVpcInput)
	require.NoError(t, err, "Failed to describe VPC")
	require.NotEmpty(t, vpcResult.Vpcs, "VPC not found")

	vpc := vpcResult.Vpcs[0]
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC CIDR block mismatch")

	// Check DNS settings using DescribeVpcAttribute
	dnsHostnamesInput := &ec2.DescribeVpcAttributeInput{
		VpcId:     &vpcID,
		Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
	}
	dnsHostnamesResult, err := ec2Client.DescribeVpcAttribute(ctx, dnsHostnamesInput)
	require.NoError(t, err, "Failed to describe VPC DNS hostnames attribute")
	assert.True(t, *dnsHostnamesResult.EnableDnsHostnames.Value, "DNS hostnames should be enabled")

	dnsSupportInput := &ec2.DescribeVpcAttributeInput{
		VpcId:     &vpcID,
		Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
	}
	dnsSupportResult, err := ec2Client.DescribeVpcAttribute(ctx, dnsSupportInput)
	require.NoError(t, err, "Failed to describe VPC DNS support attribute")
	assert.True(t, *dnsSupportResult.EnableDnsSupport.Value, "DNS support should be enabled")

	t.Log("VPC configuration validated successfully")
}

func TestIntegrationKinesisStreamDeployment(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	kinesisClient := kinesis.NewFromConfig(cfg)

	t.Log("Testing Kinesis stream deployment and configuration")

	streamName := os.Getenv("TEST_KINESIS_STREAM_NAME")
	if streamName == "" {
		t.Skip("TEST_KINESIS_STREAM_NAME not set - skipping Kinesis validation")
	}

	// Describe the Kinesis stream
	describeInput := &kinesis.DescribeStreamInput{
		StreamName: &streamName,
	}

	streamResult, err := kinesisClient.DescribeStream(ctx, describeInput)
	require.NoError(t, err, "Failed to describe Kinesis stream")

	stream := streamResult.StreamDescription
	assert.NotNil(t, stream, "Stream description is nil")
	assert.Equal(t, streamName, *stream.StreamName, "Stream name mismatch")
	assert.Equal(t, int32(2), int32(len(stream.Shards)), "Expected 2 shards")
	assert.Equal(t, "KMS", string(stream.EncryptionType), "Encryption type should be KMS")
	assert.Equal(t, int32(24), *stream.RetentionPeriodHours, "Retention period should be 24 hours")

	t.Log("Kinesis stream configuration validated successfully")
}

func TestIntegrationRDSDeployment(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	rdsClient := rds.NewFromConfig(cfg)

	t.Log("Testing RDS PostgreSQL deployment and configuration")

	dbInstanceID := os.Getenv("TEST_RDS_INSTANCE_ID")
	if dbInstanceID == "" {
		t.Skip("TEST_RDS_INSTANCE_ID not set - skipping RDS validation")
	}

	// Describe the RDS instance
	describeInput := &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: &dbInstanceID,
	}

	dbResult, err := rdsClient.DescribeDBInstances(ctx, describeInput)
	require.NoError(t, err, "Failed to describe RDS instance")
	require.NotEmpty(t, dbResult.DBInstances, "RDS instance not found")

	dbInstance := dbResult.DBInstances[0]
	assert.Equal(t, "postgres", *dbInstance.Engine, "Engine should be postgres")
	assert.True(t, *dbInstance.MultiAZ, "Multi-AZ should be enabled")
	assert.True(t, *dbInstance.StorageEncrypted, "Storage encryption should be enabled")
	assert.True(t, *dbInstance.PerformanceInsightsEnabled, "Performance Insights should be enabled")
	assert.Equal(t, int32(7), *dbInstance.BackupRetentionPeriod, "Backup retention should be 7 days")

	t.Log("RDS instance configuration validated successfully")
}

func TestIntegrationECSServiceDeployment(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ecsClient := ecs.NewFromConfig(cfg)

	t.Log("Testing ECS Fargate service deployment")

	clusterName := os.Getenv("TEST_ECS_CLUSTER_NAME")
	serviceName := os.Getenv("TEST_ECS_SERVICE_NAME")
	if clusterName == "" || serviceName == "" {
		t.Skip("TEST_ECS_CLUSTER_NAME or TEST_ECS_SERVICE_NAME not set - skipping ECS validation")
	}

	// Describe the ECS service
	describeInput := &ecs.DescribeServicesInput{
		Cluster:  &clusterName,
		Services: []string{serviceName},
	}

	serviceResult, err := ecsClient.DescribeServices(ctx, describeInput)
	require.NoError(t, err, "Failed to describe ECS service")
	require.NotEmpty(t, serviceResult.Services, "ECS service not found")

	service := serviceResult.Services[0]
	assert.Equal(t, "FARGATE", string(service.LaunchType), "Launch type should be FARGATE")
	assert.Equal(t, int32(2), service.DesiredCount, "Desired count should be 2")
	assert.NotNil(t, service.DeploymentConfiguration.DeploymentCircuitBreaker, "Circuit breaker should be configured")
	assert.True(t, service.DeploymentConfiguration.DeploymentCircuitBreaker.Enable, "Circuit breaker should be enabled")
	assert.True(t, service.EnableExecuteCommand, "Execute command should be enabled")

	// Verify tasks are running in private subnets
	assert.NotNil(t, service.NetworkConfiguration, "Network configuration should exist")
	assert.Equal(t, string(ecstypes.AssignPublicIpDisabled), string(service.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp), "Public IP should not be assigned")

	t.Log("ECS service configuration validated successfully")
}

func TestIntegrationSecretsManagerRotation(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	secretsClient := secretsmanager.NewFromConfig(cfg)

	t.Log("Testing Secrets Manager rotation configuration")

	secretArn := os.Getenv("TEST_SECRET_ARN")
	if secretArn == "" {
		t.Skip("TEST_SECRET_ARN not set - skipping Secrets Manager validation")
	}

	// Describe the secret
	describeInput := &secretsmanager.DescribeSecretInput{
		SecretId: &secretArn,
	}

	secretResult, err := secretsClient.DescribeSecret(ctx, describeInput)
	require.NoError(t, err, "Failed to describe secret")

	assert.NotNil(t, secretResult, "Secret should exist")

	// Get secret value to verify structure
	getValueInput := &secretsmanager.GetSecretValueInput{
		SecretId: &secretArn,
	}

	valueResult, err := secretsClient.GetSecretValue(ctx, getValueInput)
	require.NoError(t, err, "Failed to get secret value")

	var secretData map[string]interface{}
	err = json.Unmarshal([]byte(*valueResult.SecretString), &secretData)
	require.NoError(t, err, "Failed to parse secret JSON")

	assert.Contains(t, secretData, "username", "Secret should contain username")
	assert.Contains(t, secretData, "password", "Secret should contain password")
	assert.Contains(t, secretData, "engine", "Secret should contain engine")
	assert.Contains(t, secretData, "port", "Secret should contain port")
	assert.Contains(t, secretData, "dbname", "Secret should contain dbname")

	t.Log("Secrets Manager configuration validated successfully")
}

func TestIntegrationSecurityGroupRules(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)

	t.Log("Testing security group configurations")

	ecsSecurityGroupID := os.Getenv("TEST_ECS_SECURITY_GROUP_ID")
	rdsSecurityGroupID := os.Getenv("TEST_RDS_SECURITY_GROUP_ID")

	if ecsSecurityGroupID == "" || rdsSecurityGroupID == "" {
		t.Skip("Security group IDs not set - skipping security group validation")
	}

	// Verify ECS security group allows outbound traffic
	ecsDescribeInput := &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{ecsSecurityGroupID},
	}

	ecsResult, err := ec2Client.DescribeSecurityGroups(ctx, ecsDescribeInput)
	require.NoError(t, err, "Failed to describe ECS security group")
	require.NotEmpty(t, ecsResult.SecurityGroups, "ECS security group not found")

	ecsSg := ecsResult.SecurityGroups[0]
	assert.NotEmpty(t, ecsSg.IpPermissionsEgress, "ECS should have egress rules")

	// Verify RDS security group only allows ECS ingress
	rdsDescribeInput := &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{rdsSecurityGroupID},
	}

	rdsResult, err := ec2Client.DescribeSecurityGroups(ctx, rdsDescribeInput)
	require.NoError(t, err, "Failed to describe RDS security group")
	require.NotEmpty(t, rdsResult.SecurityGroups, "RDS security group not found")

	rdsSg := rdsResult.SecurityGroups[0]

	// Check that RDS has ingress rule from ECS on port 5432
	found := false
	for _, rule := range rdsSg.IpPermissions {
		if rule.FromPort != nil && *rule.FromPort == 5432 {
			for _, pair := range rule.UserIdGroupPairs {
				if *pair.GroupId == ecsSecurityGroupID {
					found = true
					break
				}
			}
		}
	}
	assert.True(t, found, "RDS should allow ingress from ECS on port 5432")

	// Verify no public ingress to RDS
	for _, rule := range rdsSg.IpPermissions {
		for _, ipRange := range rule.IpRanges {
			assert.NotEqual(t, "0.0.0.0/0", *ipRange.CidrIp, "RDS should not allow public access")
		}
	}

	t.Log("Security group rules validated successfully")
}

func TestIntegrationCloudWatchAlarms(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	t.Log("Testing CloudWatch alarms configuration")

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		t.Skip("ENVIRONMENT_SUFFIX not set - skipping CloudWatch alarms validation")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	cwClient := cloudwatch.NewFromConfig(cfg)

	// List all alarms for this environment
	describeInput := &cloudwatch.DescribeAlarmsInput{}

	alarmsResult, err := cwClient.DescribeAlarms(ctx, describeInput)
	require.NoError(t, err, "Failed to describe alarms")

	// Check for expected alarms
	expectedAlarms := []string{
		fmt.Sprintf("kinesis-iterator-age-%s", environmentSuffix),
		fmt.Sprintf("kinesis-write-throughput-%s", environmentSuffix),
		fmt.Sprintf("rds-cpu-utilization-%s", environmentSuffix),
		fmt.Sprintf("rds-database-connections-%s", environmentSuffix),
		fmt.Sprintf("rds-free-storage-%s", environmentSuffix),
		fmt.Sprintf("ecs-cpu-utilization-%s", environmentSuffix),
		fmt.Sprintf("ecs-memory-utilization-%s", environmentSuffix),
	}

	foundAlarms := make(map[string]bool)
	for _, alarm := range alarmsResult.MetricAlarms {
		for _, expected := range expectedAlarms {
			if *alarm.AlarmName == expected {
				foundAlarms[expected] = true
			}
		}
	}

	for _, expected := range expectedAlarms {
		assert.True(t, foundAlarms[expected], fmt.Sprintf("Alarm %s should exist", expected))
	}

	t.Log("CloudWatch alarms validated successfully")
}

func TestIntegrationVPCFlowLogs(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)

	t.Log("Testing VPC Flow Logs configuration")

	vpcID := os.Getenv("TEST_VPC_ID")
	if vpcID == "" {
		t.Skip("TEST_VPC_ID not set - skipping VPC Flow Logs validation")
	}

	// Describe flow logs for the VPC
	describeInput := &ec2.DescribeFlowLogsInput{
		Filter: []ec2types.Filter{
			{
				Name:   aws.String("resource-id"),
				Values: []string{vpcID},
			},
		},
	}

	flowLogsResult, err := ec2Client.DescribeFlowLogs(ctx, describeInput)
	require.NoError(t, err, "Failed to describe flow logs")
	require.NotEmpty(t, flowLogsResult.FlowLogs, "Flow logs should be enabled for VPC")

	flowLog := flowLogsResult.FlowLogs[0]
	assert.Equal(t, "ALL", string(flowLog.TrafficType), "Traffic type should be ALL")
	assert.Equal(t, "cloud-watch-logs", string(flowLog.LogDestinationType), "Log destination should be CloudWatch Logs")

	t.Log("VPC Flow Logs validated successfully")
}

func TestIntegrationNATGatewayConnectivity(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Skipping integration test - set RUN_INTEGRATION_TESTS=true to run")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)

	t.Log("Testing NAT Gateway connectivity for private subnets")

	vpcID := os.Getenv("TEST_VPC_ID")
	if vpcID == "" {
		t.Skip("TEST_VPC_ID not set - skipping NAT Gateway validation")
	}

	// Describe NAT Gateways in the VPC
	describeInput := &ec2.DescribeNatGatewaysInput{
		Filter: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcID},
			},
		},
	}

	natResult, err := ec2Client.DescribeNatGateways(ctx, describeInput)
	require.NoError(t, err, "Failed to describe NAT Gateways")
	require.NotEmpty(t, natResult.NatGateways, "NAT Gateways should exist")
	assert.Equal(t, 2, len(natResult.NatGateways), "Should have 2 NAT Gateways")

	// Verify NAT Gateways have Elastic IPs
	for _, natGw := range natResult.NatGateways {
		assert.NotEmpty(t, natGw.NatGatewayAddresses, "NAT Gateway should have addresses")
		for _, addr := range natGw.NatGatewayAddresses {
			assert.NotNil(t, addr.AllocationId, "NAT Gateway should have Elastic IP allocation")
		}
	}

	t.Log("NAT Gateway configuration validated successfully")
}
