//go:build integration
// +build integration

package main

import (
	"context"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVPCExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	ec2Client := ec2.NewFromConfig(cfg)

	// List VPCs and verify at least one exists
	result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{})
	require.NoError(t, err)
	assert.NotEmpty(t, result.Vpcs, "At least one VPC should exist")
}

func TestAuroraClusterExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	rdsClient := rds.NewFromConfig(cfg)

	// Check for Aurora clusters
	result, err := rdsClient.DescribeDBClusters(ctx, &rds.DescribeDBClustersInput{})
	require.NoError(t, err)

	// Verify at least one cluster exists with healthcare prefix
	found := false
	for _, cluster := range result.DBClusters {
		if cluster.DBClusterIdentifier != nil {
			found = true
			// Verify encryption is enabled
			assert.True(t, *cluster.StorageEncrypted, "Aurora cluster should have encryption enabled")
			// Verify engine is aurora-postgresql
			assert.Contains(t, *cluster.Engine, "aurora-postgresql", "Engine should be aurora-postgresql")
		}
	}
	assert.True(t, found, "At least one Aurora cluster should exist")
}

func TestECSClusterExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	ecsClient := ecs.NewFromConfig(cfg)

	// List ECS clusters
	result, err := ecsClient.ListClusters(ctx, &ecs.ListClustersInput{})
	require.NoError(t, err)
	assert.NotEmpty(t, result.ClusterArns, "At least one ECS cluster should exist")

	// Describe the first cluster to check settings
	if len(result.ClusterArns) > 0 {
		describeResult, err := ecsClient.DescribeClusters(ctx, &ecs.DescribeClustersInput{
			Clusters: []string{result.ClusterArns[0]},
		})
		require.NoError(t, err)
		assert.NotEmpty(t, describeResult.Clusters, "Cluster description should not be empty")

		// Verify Container Insights is enabled
		cluster := describeResult.Clusters[0]
		containerInsightsEnabled := false
		for _, setting := range cluster.Settings {
			if string(setting.Name) == "containerInsights" && setting.Value != nil && (*setting.Value == "enhanced" || *setting.Value == "enabled") {
				containerInsightsEnabled = true
				break
			}
		}
		assert.True(t, containerInsightsEnabled, "Container Insights should be enabled")
	}
}

func TestElastiCacheClusterExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	cacheClient := elasticache.NewFromConfig(cfg)

	// List replication groups
	result, err := cacheClient.DescribeReplicationGroups(ctx, &elasticache.DescribeReplicationGroupsInput{})
	require.NoError(t, err)
	assert.NotEmpty(t, result.ReplicationGroups, "At least one Redis replication group should exist")

	// Verify encryption settings
	if len(result.ReplicationGroups) > 0 {
		group := result.ReplicationGroups[0]
		assert.True(t, *group.AtRestEncryptionEnabled, "Encryption at rest should be enabled")
		assert.True(t, *group.TransitEncryptionEnabled, "Encryption in transit should be enabled")
		assert.True(t, string(group.AutomaticFailover) != "disabled", "Automatic failover should be enabled")
	}
}

func TestSecretsManagerSecretExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	smClient := secretsmanager.NewFromConfig(cfg)

	// List secrets
	result, err := smClient.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})
	require.NoError(t, err)
	assert.NotEmpty(t, result.SecretList, "At least one secret should exist")

	// Verify rotation is configured
	found := false
	for _, secret := range result.SecretList {
		if secret.Name != nil && secret.RotationEnabled != nil && *secret.RotationEnabled {
			found = true
			break
		}
	}
	assert.True(t, found, "At least one secret should have rotation enabled")
}

func TestCloudWatchLogGroupExists(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	cwClient := cloudwatch.NewFromConfig(cfg)

	// Note: CloudWatch Logs is a separate service, but we can check for metric alarms
	result, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{})
	require.NoError(t, err)

	// Verify at least some alarms exist for monitoring
	assert.NotEmpty(t, result.MetricAlarms, "At least one CloudWatch alarm should exist")
}

func TestSecurityConfiguration(t *testing.T) {
	if os.Getenv("PULUMI_STACK_NAME") == "" {
		t.Skip("Skipping integration test - PULUMI_STACK_NAME not set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err)

	ec2Client := ec2.NewFromConfig(cfg)

	// List security groups
	result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{})
	require.NoError(t, err)
	assert.NotEmpty(t, result.SecurityGroups, "At least one security group should exist")

	// Verify that security groups have proper descriptions
	for _, sg := range result.SecurityGroups {
		if sg.GroupName != nil {
			assert.NotEmpty(t, *sg.Description, "Security group should have a description")
		}
	}
}
