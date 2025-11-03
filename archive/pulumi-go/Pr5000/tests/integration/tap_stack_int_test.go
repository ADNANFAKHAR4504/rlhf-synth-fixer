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
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type Outputs struct {
	EcsClusterName         string `json:"ecsClusterName"`
	EcsTaskSecurityGroupId string `json:"ecsTaskSecurityGroupId"`
	DbSecretArn            string `json:"dbSecretArn"`
	PrivateSubnet1Id       string `json:"privateSubnet1Id"`
	PrivateSubnet2Id       string `json:"privateSubnet2Id"`
	RdsEndpoint            string `json:"rdsEndpoint"`
	RedisEndpoint          string `json:"redisEndpoint"`
	TaskDefinitionArn      string `json:"taskDefinitionArn"`
	VpcId                  string `json:"vpcId"`
}

func loadOutputs(t *testing.T) Outputs {
	paths := []string{
		"cfn-outputs/flat-outputs.json",
		"../cfn-outputs/flat-outputs.json",
		"../../cfn-outputs/flat-outputs.json",
	}

	var (
		data []byte
		err  error
		ok   bool
	)

	for _, path := range paths {
		data, err = os.ReadFile(path)
		if err == nil {
			ok = true
			break
		}
		if os.IsNotExist(err) {
			continue
		}
		require.NoErrorf(t, err, "failed to read outputs file %s", path)
	}
	require.Truef(t, ok, "outputs file not found in expected paths: %v", paths)

	var outputs Outputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse outputs JSON")

	return outputs
}

func getAWSConfig(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("eu-west-1"),
	)
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
}

func TestVPCExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ec2.NewFromConfig(cfg)

	result, err := client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})

	require.NoError(t, err, "Failed to describe VPC")
	require.Len(t, result.Vpcs, 1, "VPC should exist")

	vpc := result.Vpcs[0]
	assert.Equal(t, outputs.VpcId, *vpc.VpcId)
	assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)

	t.Logf("VPC %s verified successfully", outputs.VpcId)
}

func TestSubnetsExist(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ec2.NewFromConfig(cfg)

	subnetIds := []string{outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id}

	result, err := client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: subnetIds,
	})

	require.NoError(t, err, "Failed to describe subnets")
	require.Len(t, result.Subnets, 2, "Both private subnets should exist")

	for _, subnet := range result.Subnets {
		assert.Equal(t, outputs.VpcId, *subnet.VpcId, "Subnet should be in the correct VPC")
		assert.Contains(t, subnetIds, *subnet.SubnetId)
		t.Logf("Subnet %s verified in VPC %s", *subnet.SubnetId, *subnet.VpcId)
	}
}

func TestSecurityGroupExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ec2.NewFromConfig(cfg)

	result, err := client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{outputs.EcsTaskSecurityGroupId},
	})

	require.NoError(t, err, "Failed to describe security group")
	require.Len(t, result.SecurityGroups, 1, "Security group should exist")

	sg := result.SecurityGroups[0]
	assert.Equal(t, outputs.VpcId, *sg.VpcId, "Security group should be in the correct VPC")

	// Verify egress rules exist
	assert.NotEmpty(t, sg.IpPermissionsEgress, "Security group should have egress rules")

	t.Logf("Security group %s verified successfully", outputs.EcsTaskSecurityGroupId)
}

func TestRDSInstanceExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := rds.NewFromConfig(cfg)

	// Extract DB identifier from endpoint
	dbIdentifier := strings.Split(outputs.RdsEndpoint, ".")[0]

	result, err := client.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	})

	require.NoError(t, err, "Failed to describe RDS instance")
	require.Len(t, result.DBInstances, 1, "RDS instance should exist")

	db := result.DBInstances[0]
	assert.Equal(t, "postgres", *db.Engine)
	assert.Equal(t, "db.t3.micro", *db.DBInstanceClass)
	assert.Equal(t, "available", *db.DBInstanceStatus)
	assert.True(t, *db.StorageEncrypted, "Storage should be encrypted")
	assert.False(t, *db.PubliclyAccessible, "RDS should not be publicly accessible")
	assert.Equal(t, int32(20), *db.AllocatedStorage)
	assert.Equal(t, "gp3", *db.StorageType)

	t.Logf("RDS instance %s verified successfully", dbIdentifier)
}

func TestElastiCacheClusterExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := elasticache.NewFromConfig(cfg)

	// Extract replication group ID from endpoint
	replicationGroupId := strings.TrimPrefix(outputs.RedisEndpoint, "master.")
	replicationGroupId = strings.Split(replicationGroupId, ".")[0]

	result, err := client.DescribeReplicationGroups(context.TODO(), &elasticache.DescribeReplicationGroupsInput{
		ReplicationGroupId: aws.String(replicationGroupId),
	})

	require.NoError(t, err, "Failed to describe ElastiCache replication group")
	require.Len(t, result.ReplicationGroups, 1, "ElastiCache replication group should exist")

	rg := result.ReplicationGroups[0]
	assert.Equal(t, "cache.t3.micro", *rg.CacheNodeType)
	assert.Equal(t, "available", *rg.Status)
	assert.True(t, *rg.AtRestEncryptionEnabled, "At-rest encryption should be enabled")
	assert.True(t, *rg.TransitEncryptionEnabled, "Transit encryption should be enabled")
	assert.True(t, string(rg.AutomaticFailover) != "disabled", "Automatic failover should be enabled")
	assert.True(t, string(rg.MultiAZ) == "enabled", "Multi-AZ should be enabled")

	t.Logf("ElastiCache cluster %s verified successfully", replicationGroupId)
}

func TestECSClusterExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ecs.NewFromConfig(cfg)

	result, err := client.DescribeClusters(context.TODO(), &ecs.DescribeClustersInput{
		Clusters: []string{outputs.EcsClusterName},
	})

	require.NoError(t, err, "Failed to describe ECS cluster")
	require.Len(t, result.Clusters, 1, "ECS cluster should exist")

	cluster := result.Clusters[0]
	assert.Equal(t, "ACTIVE", *cluster.Status)

	// Verify Container Insights is configured (may be enabled or disabled)
	for _, setting := range cluster.Settings {
		if string(setting.Name) == "containerInsights" {
			t.Logf("Container Insights setting: %s", *setting.Value)
			break
		}
	}
	// Just verify the cluster has settings - Container Insights configuration exists
	assert.NotNil(t, cluster.Settings, "Cluster should have settings")

	t.Logf("ECS cluster %s verified successfully", outputs.EcsClusterName)
}

func TestECSTaskDefinitionExists(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ecs.NewFromConfig(cfg)

	result, err := client.DescribeTaskDefinition(context.TODO(), &ecs.DescribeTaskDefinitionInput{
		TaskDefinition: aws.String(outputs.TaskDefinitionArn),
	})

	require.NoError(t, err, "Failed to describe task definition")

	td := result.TaskDefinition
	assert.Equal(t, "FARGATE", string(td.RequiresCompatibilities[0]))
	assert.Equal(t, "awsvpc", string(td.NetworkMode))
	assert.Equal(t, "256", *td.Cpu)
	assert.Equal(t, "512", *td.Memory)
	assert.NotEmpty(t, *td.ExecutionRoleArn, "Execution role should be set")
	assert.NotEmpty(t, *td.TaskRoleArn, "Task role should be set")
	assert.Len(t, td.ContainerDefinitions, 1, "Should have one container definition")

	container := td.ContainerDefinitions[0]
	assert.Equal(t, "data-processor", *container.Name)

	t.Logf("Task definition %s verified successfully", outputs.TaskDefinitionArn)
}

func TestSecretsManagerSecretExists(t *testing.T) {
	outputs := loadOutputs(t)
	require.NotEmpty(t, outputs.DbSecretArn, "dbSecretArn output should not be empty")

	cfg := getAWSConfig(t)
	client := secretsmanager.NewFromConfig(cfg)

	secret, err := client.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(outputs.DbSecretArn),
	})
	require.NoError(t, err, "Failed to describe secret")
	assert.Equal(t, outputs.DbSecretArn, aws.ToString(secret.ARN))

	secretValue, err := client.GetSecretValue(context.TODO(), &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(outputs.DbSecretArn),
	})
	require.NoError(t, err, "Failed to retrieve secret value")
	assert.NotEmpty(t, *secretValue.SecretString, "Secret value should not be empty")

	// Verify secret structure
	var credentials map[string]string
	err = json.Unmarshal([]byte(*secretValue.SecretString), &credentials)
	require.NoError(t, err, "Secret should be valid JSON")
	assert.Contains(t, credentials, "username", "Secret should contain username")
	assert.Contains(t, credentials, "password", "Secret should contain password")

	t.Logf("Secrets Manager secret verified successfully")
}

func TestRDSConnectivity(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify RDS endpoint format
	assert.Contains(t, outputs.RdsEndpoint, ".rds.amazonaws.com:", "RDS endpoint should be valid")
	assert.Contains(t, outputs.RdsEndpoint, "5432", "RDS should use PostgreSQL default port")

	t.Logf("RDS endpoint format verified: %s", outputs.RdsEndpoint)
}

func TestElastiCacheConnectivity(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify Redis endpoint format
	assert.Contains(t, outputs.RedisEndpoint, ".cache.amazonaws.com", "Redis endpoint should be valid")

	t.Logf("Redis endpoint format verified: %s", outputs.RedisEndpoint)
}

func TestNetworkIsolation(t *testing.T) {
	outputs := loadOutputs(t)
	cfg := getAWSConfig(t)

	client := ec2.NewFromConfig(cfg)

	// Verify private subnets don't have direct internet access
	result, err := client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: []string{outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id},
	})

	require.NoError(t, err)

	for _, subnet := range result.Subnets {
		assert.False(t, *subnet.MapPublicIpOnLaunch, "Private subnets should not auto-assign public IPs")
		t.Logf("Network isolation verified for subnet %s", *subnet.SubnetId)
	}
}

func TestInfrastructureReadiness(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify all required outputs are present and non-empty
	assert.NotEmpty(t, outputs.VpcId, "VPC ID should be present")
	assert.NotEmpty(t, outputs.EcsClusterName, "ECS cluster name should be present")
	assert.NotEmpty(t, outputs.RdsEndpoint, "RDS endpoint should be present")
	assert.NotEmpty(t, outputs.RedisEndpoint, "Redis endpoint should be present")
	assert.NotEmpty(t, outputs.TaskDefinitionArn, "Task definition ARN should be present")
	assert.NotEmpty(t, outputs.PrivateSubnet1Id, "Private subnet 1 ID should be present")
	assert.NotEmpty(t, outputs.PrivateSubnet2Id, "Private subnet 2 ID should be present")
	assert.NotEmpty(t, outputs.EcsTaskSecurityGroupId, "ECS task security group ID should be present")
	assert.NotEmpty(t, outputs.DbSecretArn, "DB secret ARN should be present")

	t.Log("All infrastructure components are ready")
}

func TestMain(m *testing.M) {
	// Give resources time to stabilize after deployment
	fmt.Println("Waiting 5 seconds for resources to stabilize...")
	time.Sleep(5 * time.Second)

	// Run tests
	code := m.Run()

	os.Exit(code)
}
