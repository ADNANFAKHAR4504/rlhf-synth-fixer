//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/ecs"
	"github.com/aws/aws-sdk-go/service/elasticache"
	"github.com/aws/aws-sdk-go/service/kinesis"
	"github.com/aws/aws-sdk-go/service/rds"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type OutputValues struct {
	VpcId             string `json:"vpcId"`
	KinesisStreamName string `json:"kinesisStreamName"`
	KinesisStreamArn  string `json:"kinesisStreamArn"`
	EcsClusterName    string `json:"ecsClusterName"`
	EcsClusterArn     string `json:"ecsClusterArn"`
	RdsEndpoint       string `json:"rdsEndpoint"`
	RdsDbName         string `json:"rdsDbName"`
	RedisEndpoint     string `json:"redisEndpoint"`
	EfsFileSystemId   string `json:"efsFileSystemId"`
	AlbDnsName        string `json:"albDnsName"`
	ApiGatewayUrl     string `json:"apiGatewayUrl"`
	EcrRepositoryUrl  string `json:"ecrRepositoryUrl"`
	SecretArn         string `json:"secretArn"`
}

func loadOutputs(t *testing.T) *OutputValues {
	// try a few locations for the outputs file so tests work regardless of
	// the working directory used when running `go test`.
	candidates := []string{
		"../cfn-outputs/flat-outputs.json",
		"../../cfn-outputs/flat-outputs.json",
		"cfn-outputs/flat-outputs.json",
		"../flat-outputs.json",
	}

	var data []byte
	var err error
	var foundPath string
	for _, p := range candidates {
		data, err = os.ReadFile(p)
		if err == nil {
			foundPath = p
			break
		}
	}
	require.NoError(t, err, "Failed to read outputs file from candidates: %v", candidates)

	var outputs OutputValues

	// First, try unmarshalling into the expected flat structure.
	if err = json.Unmarshal(data, &outputs); err == nil {
		return &outputs
	}

	// If that fails, try CloudFormation/all-outputs format where each key
	// has a nested object like { "value": ... }.
	var cf map[string]struct {
		Value interface{} `json:"value"`
	}
	if err = json.Unmarshal(data, &cf); err == nil {
		// helper to read string values safely
		getStr := func(key string) string {
			if v, ok := cf[key]; ok && v.Value != nil {
				switch vv := v.Value.(type) {
				case string:
					return vv
				default:
					b, _ := json.Marshal(vv)
					return string(b)
				}
			}
			return ""
		}

		outputs = OutputValues{
			VpcId:             getStr("vpcId"),
			KinesisStreamName: getStr("kinesisStreamName"),
			KinesisStreamArn:  getStr("kinesisStreamArn"),
			EcsClusterName:    getStr("ecsClusterName"),
			EcsClusterArn:     getStr("ecsClusterArn"),
			RdsEndpoint:       getStr("rdsEndpoint"),
			RdsDbName:         getStr("rdsDbName"),
			RedisEndpoint:     getStr("redisEndpoint"),
			EfsFileSystemId:   getStr("efsFileSystemId"),
			AlbDnsName:        getStr("albDnsName"),
			ApiGatewayUrl:     getStr("apiGatewayUrl"),
			EcrRepositoryUrl:  getStr("ecrRepositoryUrl"),
			SecretArn:         getStr("secretArn"),
		}

		return &outputs
	}

	// Otherwise fail with the original error
	require.NoError(t, err, "Failed to parse outputs JSON from %s", foundPath)
	return &outputs
}

func getAWSSession(t *testing.T) *session.Session {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("eu-central-2"),
	})
	require.NoError(t, err, "Failed to create AWS session")
	return sess
}

// shouldMock returns true when integration tests should run in mock/offline mode.
// Set INTEGRATION_TEST_MOCK=true to enable.
func shouldMock() bool {
	v := os.Getenv("INTEGRATION_TEST_MOCK")
	return v == "true" || v == "1"
}

func TestVPCExists(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping AWS VPC check")
		require.NotEmpty(t, outputs.VpcId)
		return
	}
	sess := getAWSSession(t)
	ec2Client := ec2.New(sess)

	input := &ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(outputs.VpcId)},
	}

	result, err := ec2Client.DescribeVpcs(input)
	require.NoError(t, err, "Failed to describe VPC")
	assert.Len(t, result.Vpcs, 1, "VPC should exist")
	assert.Equal(t, outputs.VpcId, *result.Vpcs[0].VpcId, "VPC ID should match")
}

func TestKinesisStreamExists(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping Kinesis check")
		require.NotEmpty(t, outputs.KinesisStreamName)
		return
	}
	sess := getAWSSession(t)
	kinesisClient := kinesis.New(sess)

	input := &kinesis.DescribeStreamInput{
		StreamName: aws.String(outputs.KinesisStreamName),
	}

	result, err := kinesisClient.DescribeStream(input)
	require.NoError(t, err, "Failed to describe Kinesis stream")
	assert.Equal(t, outputs.KinesisStreamName, *result.StreamDescription.StreamName)
	assert.Equal(t, "ACTIVE", *result.StreamDescription.StreamStatus, "Stream should be active")
	assert.NotNil(t, result.StreamDescription.EncryptionType, "Stream should have encryption enabled")
}

func TestRDSInstanceExists(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping RDS check")
		require.NotEmpty(t, outputs.RdsEndpoint)
		return
	}
	sess := getAWSSession(t)
	rdsClient := rds.New(sess)

	// Extract DB identifier from endpoint
	dbIdentifier := outputs.RdsEndpoint[:len(outputs.RdsEndpoint)-22] // Remove .rds.amazonaws.com:5432

	input := &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	}

	result, err := rdsClient.DescribeDBInstances(input)
	require.NoError(t, err, "Failed to describe RDS instance")
	assert.Len(t, result.DBInstances, 1, "RDS instance should exist")

	dbInstance := result.DBInstances[0]
	assert.True(t, *dbInstance.MultiAZ, "RDS should be Multi-AZ")
	assert.True(t, *dbInstance.StorageEncrypted, "RDS should have storage encryption")
	assert.Equal(t, "available", *dbInstance.DBInstanceStatus, "RDS should be available")
}

func TestElastiCacheClusterExists(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping ElastiCache check")
		require.NotEmpty(t, outputs.RedisEndpoint)
		return
	}
	sess := getAWSSession(t)
	elasticacheClient := elasticache.New(sess)

	// Extract replication group ID from endpoint
	replicationGroupId := outputs.RedisEndpoint[:len(outputs.RedisEndpoint)-23] // Remove .cache.amazonaws.com

	input := &elasticache.DescribeReplicationGroupsInput{
		ReplicationGroupId: aws.String(replicationGroupId),
	}

	result, err := elasticacheClient.DescribeReplicationGroups(input)
	require.NoError(t, err, "Failed to describe ElastiCache replication group")
	assert.Len(t, result.ReplicationGroups, 1, "Redis cluster should exist")

	cluster := result.ReplicationGroups[0]
	assert.True(t, *cluster.AtRestEncryptionEnabled, "Redis should have at-rest encryption")
	assert.True(t, *cluster.TransitEncryptionEnabled, "Redis should have in-transit encryption")
	assert.True(t, *cluster.AutomaticFailover != "disabled", "Redis should have automatic failover")
}

func TestECSClusterExists(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping ECS cluster check")
		require.NotEmpty(t, outputs.EcsClusterArn)
		return
	}
	sess := getAWSSession(t)
	ecsClient := ecs.New(sess)

	input := &ecs.DescribeClustersInput{
		Clusters: []*string{aws.String(outputs.EcsClusterArn)},
	}

	result, err := ecsClient.DescribeClusters(input)
	require.NoError(t, err, "Failed to describe ECS cluster")
	assert.Len(t, result.Clusters, 1, "ECS cluster should exist")
	assert.Equal(t, "ACTIVE", *result.Clusters[0].Status, "ECS cluster should be active")
}

func TestECSServiceRunning(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping ECS services check")
		require.NotEmpty(t, outputs.EcsClusterArn)
		return
	}
	sess := getAWSSession(t)
	ecsClient := ecs.New(sess)

	input := &ecs.ListServicesInput{
		Cluster: aws.String(outputs.EcsClusterArn),
	}

	result, err := ecsClient.ListServices(input)
	require.NoError(t, err, "Failed to list ECS services")
	assert.NotEmpty(t, result.ServiceArns, "ECS cluster should have services")

	describeInput := &ecs.DescribeServicesInput{
		Cluster:  aws.String(outputs.EcsClusterArn),
		Services: result.ServiceArns,
	}

	describeResult, err := ecsClient.DescribeServices(describeInput)
	require.NoError(t, err, "Failed to describe ECS services")

	for _, service := range describeResult.Services {
		assert.Equal(t, "ACTIVE", *service.Status, "Service should be active")
		assert.True(t, *service.DesiredCount > 0, "Service should have desired tasks")
	}
}

func TestSecurityGroupsConfigured(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping security groups check")
		require.NotEmpty(t, outputs.VpcId)
		return
	}
	sess := getAWSSession(t)
	ec2Client := ec2.New(sess)

	input := &ec2.DescribeSecurityGroupsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(outputs.VpcId)},
			},
		},
	}

	result, err := ec2Client.DescribeSecurityGroups(input)
	require.NoError(t, err, "Failed to describe security groups")
	assert.NotEmpty(t, result.SecurityGroups, "VPC should have security groups")

	// Verify security group rules follow PCI-DSS compliance
	for _, sg := range result.SecurityGroups {
		// Check that security groups don't allow unrestricted access to sensitive ports
		for _, rule := range sg.IpPermissions {
			if rule.FromPort != nil && *rule.FromPort == 5432 { // PostgreSQL port
				for _, ipRange := range rule.IpRanges {
					assert.NotEqual(t, "0.0.0.0/0", *ipRange.CidrIp, "Database should not be accessible from internet")
				}
			}
			if rule.FromPort != nil && *rule.FromPort == 6379 { // Redis port
				for _, ipRange := range rule.IpRanges {
					assert.NotEqual(t, "0.0.0.0/0", *ipRange.CidrIp, "Redis should not be accessible from internet")
				}
			}
		}
	}
}

func TestSubnetsInMultipleAZs(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping subnets/AZ check")
		require.NotEmpty(t, outputs.VpcId)
		return
	}
	sess := getAWSSession(t)
	ec2Client := ec2.New(sess)

	input := &ec2.DescribeSubnetsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(outputs.VpcId)},
			},
		},
	}

	result, err := ec2Client.DescribeSubnets(input)
	require.NoError(t, err, "Failed to describe subnets")
	assert.NotEmpty(t, result.Subnets, "VPC should have subnets")

	// Verify subnets span multiple AZs
	azMap := make(map[string]bool)
	for _, subnet := range result.Subnets {
		azMap[*subnet.AvailabilityZone] = true
	}
	assert.GreaterOrEqual(t, len(azMap), 2, "Subnets should span at least 2 availability zones")
}

func TestLoadBalancerAccessible(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify ALB DNS name is set and has correct format
	assert.NotEmpty(t, outputs.AlbDnsName, "ALB DNS name should be set")
	assert.Contains(t, outputs.AlbDnsName, ".elb.amazonaws.com", "ALB DNS should have correct format")
}

func TestAPIGatewayEndpoint(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify API Gateway URL is set and has correct format
	assert.NotEmpty(t, outputs.ApiGatewayUrl, "API Gateway URL should be set")
	assert.Contains(t, outputs.ApiGatewayUrl, "execute-api", "API Gateway URL should have correct format")
	assert.Contains(t, outputs.ApiGatewayUrl, "eu-central-2", "API Gateway should be in correct region")
}

func TestEncryptionAtRest(t *testing.T) {
	outputs := loadOutputs(t)
	if shouldMock() {
		t.Log("Running in mock mode: skipping encryption at rest checks")
		require.NotEmpty(t, outputs.RdsEndpoint)
		require.NotEmpty(t, outputs.KinesisStreamName)
		return
	}
	sess := getAWSSession(t)

	// Test RDS encryption
	rdsClient := rds.New(sess)
	dbIdentifier := outputs.RdsEndpoint[:len(outputs.RdsEndpoint)-22]

	rdsInput := &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbIdentifier),
	}

	rdsResult, err := rdsClient.DescribeDBInstances(rdsInput)
	require.NoError(t, err, "Failed to describe RDS instance")
	assert.True(t, *rdsResult.DBInstances[0].StorageEncrypted, "RDS storage must be encrypted for PCI-DSS compliance")

	// Test Kinesis encryption
	kinesisClient := kinesis.New(sess)
	kinesisInput := &kinesis.DescribeStreamInput{
		StreamName: aws.String(outputs.KinesisStreamName),
	}

	kinesisResult, err := kinesisClient.DescribeStream(kinesisInput)
	require.NoError(t, err, "Failed to describe Kinesis stream")
	assert.NotEqual(t, "NONE", *kinesisResult.StreamDescription.EncryptionType, "Kinesis stream must be encrypted for PCI-DSS compliance")
}
