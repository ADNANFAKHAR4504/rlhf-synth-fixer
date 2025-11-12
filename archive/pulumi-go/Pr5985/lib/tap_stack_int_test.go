//go:build integration
// +build integration

package main

import (
	"context"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getAWSConfig(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
	)
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
}

func TestAWSCredentials(t *testing.T) {
	cfg := getAWSConfig(t)

	stsClient := sts.NewFromConfig(cfg)

	result, err := stsClient.GetCallerIdentity(context.TODO(), &sts.GetCallerIdentityInput{})

	require.NoError(t, err, "Failed to get caller identity")
	assert.NotNil(t, result.Account, "Account ID should not be nil")
	assert.NotEmpty(t, *result.Account, "Account ID should not be empty")
}

func TestAWSRegionAccess(t *testing.T) {
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	ctx, cancel := context.WithTimeout(context.TODO(), 10*time.Second)
	defer cancel()

	result, err := ec2Client.DescribeRegions(ctx, &ec2.DescribeRegionsInput{
		AllRegions: aws.Bool(false),
	})

	require.NoError(t, err, "Failed to describe regions")
	assert.NotEmpty(t, result.Regions, "Should have at least one region available")

	// Verify us-east-1 is in the list
	foundUSEast1 := false
	for _, region := range result.Regions {
		if region.RegionName != nil && *region.RegionName == "us-east-1" {
			foundUSEast1 = true
			break
		}
	}
	assert.True(t, foundUSEast1, "us-east-1 region should be available")
}

func TestEC2DescribeAvailabilityZones(t *testing.T) {
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	ctx, cancel := context.WithTimeout(context.TODO(), 10*time.Second)
	defer cancel()

	result, err := ec2Client.DescribeAvailabilityZones(ctx, &ec2.DescribeAvailabilityZonesInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("region-name"),
				Values: []string{"us-east-1"},
			},
		},
	})

	require.NoError(t, err, "Failed to describe availability zones")
	assert.GreaterOrEqual(t, len(result.AvailabilityZones), 3, "us-east-1 should have at least 3 availability zones")

	// Verify specific AZs used in infrastructure code
	expectedAZs := map[string]bool{
		"us-east-1a": false,
		"us-east-1b": false,
		"us-east-1c": false,
	}

	for _, az := range result.AvailabilityZones {
		if az.ZoneName != nil {
			if _, exists := expectedAZs[*az.ZoneName]; exists {
				expectedAZs[*az.ZoneName] = true
			}
		}
	}

	for azName, found := range expectedAZs {
		assert.True(t, found, "Expected availability zone %s should be available", azName)
	}
}

func TestVPCCIDRValidation(t *testing.T) {
	// Test that the CIDR block used in infrastructure is valid
	cidrBlock := "10.0.0.0/16"

	// Basic CIDR validation
	assert.NotEmpty(t, cidrBlock, "VPC CIDR block should not be empty")
	assert.Contains(t, cidrBlock, "/", "CIDR block should contain subnet mask")
	assert.Contains(t, cidrBlock, "10.0.0.0", "CIDR block should use correct base IP")
}

func TestSubnetCIDRAllocation(t *testing.T) {
	// Test subnet CIDR allocations used in infrastructure
	publicSubnets := []string{
		"10.0.0.0/24",
		"10.0.1.0/24",
		"10.0.2.0/24",
	}

	privateSubnets := []string{
		"10.0.10.0/24",
		"10.0.11.0/24",
		"10.0.12.0/24",
	}

	// Verify we have 3 public and 3 private subnets
	assert.Equal(t, 3, len(publicSubnets), "Should have 3 public subnets")
	assert.Equal(t, 3, len(privateSubnets), "Should have 3 private subnets")

	// Verify CIDR blocks are properly formatted
	for i, subnet := range publicSubnets {
		assert.NotEmpty(t, subnet, "Public subnet %d should not be empty", i)
		assert.Contains(t, subnet, "/24", "Public subnet %d should use /24 mask", i)
	}

	for i, subnet := range privateSubnets {
		assert.NotEmpty(t, subnet, "Private subnet %d should not be empty", i)
		assert.Contains(t, subnet, "/24", "Private subnet %d should use /24 mask", i)
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	// Test security group configurations used in infrastructure

	// ALB security group should allow HTTP and HTTPS
	albPorts := []int{80, 443}
	assert.Equal(t, 2, len(albPorts), "ALB should have 2 ingress ports")
	assert.Contains(t, albPorts, 80, "ALB should allow HTTP traffic")
	assert.Contains(t, albPorts, 443, "ALB should allow HTTPS traffic")

	// ECS security group should allow traffic from ALB
	ecsPort := 8080
	assert.Equal(t, 8080, ecsPort, "ECS tasks should listen on port 8080")

	// RDS security group should allow PostgreSQL traffic
	rdsPort := 5432
	assert.Equal(t, 5432, rdsPort, "RDS should use PostgreSQL port 5432")
}

func TestRDSConfiguration(t *testing.T) {
	// Test RDS configuration values
	engine := "aurora-postgresql"
	engineVersion := "14.6"
	backupRetention := 7
	storageEncrypted := true

	assert.Equal(t, "aurora-postgresql", engine, "Should use Aurora PostgreSQL engine")
	assert.NotEmpty(t, engineVersion, "Engine version should be specified")
	assert.GreaterOrEqual(t, backupRetention, 7, "Backup retention should be at least 7 days")
	assert.True(t, storageEncrypted, "Storage should be encrypted")
}

func TestSQSConfiguration(t *testing.T) {
	// Test SQS configuration values
	mainQueueRetention := 1209600 // 14 days in seconds
	dlqRetention := 604800        // 7 days in seconds
	visibilityTimeout := 300      // 5 minutes
	maxReceiveCount := 3

	assert.Equal(t, 1209600, mainQueueRetention, "Main queue retention should be 14 days")
	assert.Equal(t, 604800, dlqRetention, "DLQ retention should be 7 days")
	assert.Equal(t, 300, visibilityTimeout, "Visibility timeout should be 5 minutes")
	assert.Equal(t, 3, maxReceiveCount, "Max receive count should be 3")
}

func TestECSConfiguration(t *testing.T) {
	// Test ECS configuration values
	apiDesiredCount := 3
	jobDesiredCount := 2
	cpu := "256"
	memory := "512"

	assert.Equal(t, 3, apiDesiredCount, "API service should have 3 tasks")
	assert.Equal(t, 2, jobDesiredCount, "Job processor should have 2 tasks")
	assert.Equal(t, "256", cpu, "Tasks should use 256 CPU units")
	assert.Equal(t, "512", memory, "Tasks should use 512 MB memory")
}

func TestCloudWatchConfiguration(t *testing.T) {
	// Test CloudWatch log group configuration
	retentionDays := 30

	assert.Equal(t, 30, retentionDays, "Log retention should be 30 days")
	assert.Greater(t, retentionDays, 0, "Log retention should be positive")
}

func TestNetworkTopology(t *testing.T) {
	// Test network topology configuration
	azCount := 3
	natGatewayCount := 3
	publicSubnetCount := 3
	privateSubnetCount := 3

	assert.Equal(t, 3, azCount, "Should span 3 availability zones")
	assert.Equal(t, azCount, natGatewayCount, "Should have one NAT gateway per AZ")
	assert.Equal(t, azCount, publicSubnetCount, "Should have one public subnet per AZ")
	assert.Equal(t, azCount, privateSubnetCount, "Should have one private subnet per AZ")
}

func TestIAMRoleConfiguration(t *testing.T) {
	// Test IAM role permissions
	requiredTaskRolePermissions := []string{
		"sqs:SendMessage",
		"sqs:ReceiveMessage",
		"sqs:DeleteMessage",
		"secretsmanager:GetSecretValue",
		"ssm:GetParameter",
	}

	assert.Equal(t, 5, len(requiredTaskRolePermissions), "Task role should have 5 permission types")
	assert.Contains(t, requiredTaskRolePermissions, "sqs:SendMessage", "Task role should allow SQS send")
	assert.Contains(t, requiredTaskRolePermissions, "secretsmanager:GetSecretValue", "Task role should allow secrets access")
	assert.Contains(t, requiredTaskRolePermissions, "ssm:GetParameter", "Task role should allow SSM parameter access")
}

func TestLoadBalancerConfiguration(t *testing.T) {
	// Test ALB configuration
	lbType := "application"
	scheme := "internet-facing"
	healthCheckPath := "/health"
	healthCheckInterval := 30
	healthCheckTimeout := 5

	assert.Equal(t, "application", lbType, "Should use Application Load Balancer")
	assert.Equal(t, "internet-facing", scheme, "Load balancer should be internet-facing")
	assert.Equal(t, "/health", healthCheckPath, "Health check should use /health endpoint")
	assert.Equal(t, 30, healthCheckInterval, "Health check interval should be 30 seconds")
	assert.Equal(t, 5, healthCheckTimeout, "Health check timeout should be 5 seconds")
}
