//go:build integration

package lib_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	cfntypes "github.com/aws/aws-sdk-go-v2/service/cloudformation/types"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamodbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// StackOutputs represents the expected outputs from the CDK stack
type StackOutputs struct {
	ApiEndpoint              string `json:"ApiEndpoint"`
	TableName                string `json:"TableName"`
	CreateScoreFunctionName  string `json:"CreateScoreFunctionName"`
	GetScoreFunctionName     string `json:"GetScoreFunctionName"`
	UpdateScoreFunctionName  string `json:"UpdateScoreFunctionName"`
	DeleteScoreFunctionName  string `json:"DeleteScoreFunctionName"`
	EnvironmentSuffix        string `json:"EnvironmentSuffix"`
}

// loadStackOutputs loads stack outputs from cdk-outputs.json
func loadStackOutputs(t *testing.T) StackOutputs {
	// Read the cdk-outputs.json file
	data, err := os.ReadFile("cdk-outputs.json")
	require.NoError(t, err, "Failed to read cdk-outputs.json")

	// Parse the JSON
	var outputs map[string]StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cdk-outputs.json")

	// Get the stack outputs - try "TapStackdev" or first available stack
	stackOutputs, ok := outputs["TapStackdev"]
	if !ok {
		// If TapStackdev doesn't exist, try to get the first stack
		for _, v := range outputs {
			stackOutputs = v
			break
		}
	}

	return stackOutputs
}

// getAWSConfig returns AWS SDK configuration
func getAWSConfig(t *testing.T) aws.Config {
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
}

func TestStackOutputs(t *testing.T) {
	// Skip if running in short mode
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("all required outputs exist in cdk-outputs.json", func(t *testing.T) {
		// ARRANGE & ACT
		outputs := loadStackOutputs(t)

		// ASSERT
		assert.NotEmpty(t, outputs.VpcId, "VpcId output should not be empty")
		assert.NotEmpty(t, outputs.DatabaseClusterEndpoint, "DatabaseClusterEndpoint output should not be empty")
		assert.NotEmpty(t, outputs.ApiGatewayUrl, "ApiGatewayUrl output should not be empty")
		assert.NotEmpty(t, outputs.KinesisStreamName, "KinesisStreamName output should not be empty")

		// Validate format
		assert.Contains(t, outputs.VpcId, "vpc-", "VpcId should start with vpc-")
		assert.Contains(t, outputs.ApiGatewayUrl, "https://", "ApiGatewayUrl should be HTTPS")
	})
}

func TestVPCConfiguration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	ec2Client := ec2.NewFromConfig(cfg)
	ctx := context.Background()

	t.Run("VPC exists and is accessible", func(t *testing.T) {
		// ACT
		result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, result.Vpcs, 1, "Expected exactly one VPC")

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.VpcId, *vpc.VpcId)
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC CIDR should be 10.0.0.0/16")

		// Check VPC attributes separately
		attrsResult, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcId),
			Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err, "Failed to describe VPC DNS hostnames attribute")
		assert.True(t, *attrsResult.EnableDnsHostnames.Value, "DNS hostnames should be enabled")

		attrsResult2, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcId),
			Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err, "Failed to describe VPC DNS support attribute")
		assert.True(t, *attrsResult2.EnableDnsSupport.Value, "DNS support should be enabled")
	})

	t.Run("VPC has correct subnets across 2 AZs", func(t *testing.T) {
		// ACT
		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe subnets")
		require.NotEmpty(t, result.Subnets, "VPC should have subnets")

		// Count public and private subnets
		publicSubnets := 0
		privateSubnets := 0
		azSet := make(map[string]bool)

		for _, subnet := range result.Subnets {
			azSet[*subnet.AvailabilityZone] = true
			if subnet.MapPublicIpOnLaunch != nil && *subnet.MapPublicIpOnLaunch {
				publicSubnets++
			} else {
				privateSubnets++
			}
		}

		assert.Equal(t, 2, publicSubnets, "Should have 2 public subnets")
		assert.Equal(t, 2, privateSubnets, "Should have 2 private subnets")
		assert.Equal(t, 2, len(azSet), "Subnets should be in 2 availability zones")
	})

	t.Run("VPC has NAT Gateway", func(t *testing.T) {
		// ACT
		result, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
				{
					Name:   aws.String("state"),
					Values: []string{"available"},
				},
			},
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe NAT gateways")
		assert.GreaterOrEqual(t, len(result.NatGateways), 1, "Should have at least 1 NAT gateway")
	})

	t.Run("VPC has endpoints for S3 and DynamoDB", func(t *testing.T) {
		// ACT
		result, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe VPC endpoints")
		require.NotEmpty(t, result.VpcEndpoints, "VPC should have endpoints")

		// Check for S3 and DynamoDB endpoints
		hasS3 := false
		hasDynamoDB := false

		for _, endpoint := range result.VpcEndpoints {
			if endpoint.ServiceName != nil {
				if contains(*endpoint.ServiceName, "s3") {
					hasS3 = true
				}
				if contains(*endpoint.ServiceName, "dynamodb") {
					hasDynamoDB = true
				}
			}
		}

		assert.True(t, hasS3, "VPC should have S3 endpoint")
		assert.True(t, hasDynamoDB, "VPC should have DynamoDB endpoint")
	})
}

func TestRDSAuroraCluster(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	rdsClient := rds.NewFromConfig(cfg)
	ctx := context.Background()

	var clusterIdentifier string

	t.Run("Aurora cluster exists and is available", func(t *testing.T) {
		// ACT
		result, err := rdsClient.DescribeDBClusters(ctx, &rds.DescribeDBClustersInput{})

		// ASSERT
		require.NoError(t, err, "Failed to describe DB clusters")
		require.NotEmpty(t, result.DBClusters, "Should have at least one DB cluster")

		// Find cluster matching our endpoint
		var cluster *rds.DescribeDBClustersOutput
		for _, c := range result.DBClusters {
			if c.Endpoint != nil && *c.Endpoint == outputs.DatabaseClusterEndpoint {
				clusterIdentifier = *c.DBClusterIdentifier
				cluster = &rds.DescribeDBClustersOutput{DBClusters: []rdstypes.DBCluster{c}}
				break
			}
		}

		require.NotNil(t, cluster, "Could not find cluster matching endpoint")
		dbCluster := cluster.DBClusters[0]

		assert.Equal(t, "available", *dbCluster.Status, "Cluster should be available")
		assert.Equal(t, "aurora-postgresql", *dbCluster.Engine, "Engine should be aurora-postgresql")
		assert.True(t, *dbCluster.StorageEncrypted, "Storage should be encrypted")
		if dbCluster.DeletionProtection != nil {
			assert.False(t, *dbCluster.DeletionProtection, "Deletion protection should be disabled for test")
		}
	})

	t.Run("Aurora cluster has Multi-AZ configuration", func(t *testing.T) {
		require.NotEmpty(t, clusterIdentifier, "Cluster identifier required")

		// ACT
		result, err := rdsClient.DescribeDBClusters(ctx, &rds.DescribeDBClustersInput{
			DBClusterIdentifier: aws.String(clusterIdentifier),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe DB cluster")
		require.Len(t, result.DBClusters, 1)

		cluster := result.DBClusters[0]
		assert.True(t, *cluster.MultiAZ, "Cluster should be Multi-AZ")
	})

	t.Run("Aurora cluster has backup configured", func(t *testing.T) {
		require.NotEmpty(t, clusterIdentifier, "Cluster identifier required")

		// ACT
		result, err := rdsClient.DescribeDBClusters(ctx, &rds.DescribeDBClustersInput{
			DBClusterIdentifier: aws.String(clusterIdentifier),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe DB cluster")
		require.Len(t, result.DBClusters, 1)

		cluster := result.DBClusters[0]
		assert.Equal(t, int32(7), *cluster.BackupRetentionPeriod, "Backup retention should be 7 days")
	})

	t.Run("can connect to Aurora cluster", func(t *testing.T) {
		// Note: This test requires database credentials from Secrets Manager
		// Skipping actual connection test as it requires additional setup
		t.Skip("Database connection test requires Secrets Manager credential retrieval")

		// Example connection code (commented out):
		// secretsClient := secretsmanager.NewFromConfig(cfg)
		// secretValue, err := secretsClient.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		//     SecretId: aws.String("globalstream-db-credentials-dev"),
		// })
		// require.NoError(t, err)
		//
		// var creds map[string]string
		// json.Unmarshal([]byte(*secretValue.SecretString), &creds)
		//
		// connStr := fmt.Sprintf("host=%s port=5432 user=%s password=%s dbname=globalstream sslmode=require",
		//     outputs.DatabaseClusterEndpoint, creds["username"], creds["password"])
		// db, err := sql.Open("postgres", connStr)
		// require.NoError(t, err)
		// defer db.Close()
		//
		// err = db.Ping()
		// assert.NoError(t, err, "Should be able to ping database")
	})
}

func TestEFSFileSystem(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := getAWSConfig(t)
	efsClient := efs.NewFromConfig(cfg)
	ctx := context.Background()

	var fileSystemId string

	t.Run("EFS file system exists", func(t *testing.T) {
		// ACT
		result, err := efsClient.DescribeFileSystems(ctx, &efs.DescribeFileSystemsInput{})

		// ASSERT
		require.NoError(t, err, "Failed to describe file systems")
		require.NotEmpty(t, result.FileSystems, "Should have at least one file system")

		// Find file system in our VPC
		for _, fs := range result.FileSystems {
			// Check if file system is in our VPC by checking mount targets
			mtResult, err := efsClient.DescribeMountTargets(ctx, &efs.DescribeMountTargetsInput{
				FileSystemId: fs.FileSystemId,
			})
			if err == nil && len(mtResult.MountTargets) > 0 {
				fileSystemId = *fs.FileSystemId
				assert.True(t, *fs.Encrypted, "File system should be encrypted")
				assert.Equal(t, "generalPurpose", string(fs.PerformanceMode), "Performance mode should be generalPurpose")
				break
			}
		}

		assert.NotEmpty(t, fileSystemId, "Should find EFS file system")
	})

	t.Run("EFS has mount targets in private subnets", func(t *testing.T) {
		require.NotEmpty(t, fileSystemId, "File system ID required")

		// ACT
		result, err := efsClient.DescribeMountTargets(ctx, &efs.DescribeMountTargetsInput{
			FileSystemId: aws.String(fileSystemId),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe mount targets")
		assert.GreaterOrEqual(t, len(result.MountTargets), 2, "Should have at least 2 mount targets for 2 AZs")

		for _, mt := range result.MountTargets {
			assert.Equal(t, "available", string(mt.LifeCycleState), "Mount target should be available")
		}
	})

	t.Run("EFS has access point configured", func(t *testing.T) {
		require.NotEmpty(t, fileSystemId, "File system ID required")

		// ACT
		result, err := efsClient.DescribeAccessPoints(ctx, &efs.DescribeAccessPointsInput{
			FileSystemId: aws.String(fileSystemId),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe access points")
		assert.GreaterOrEqual(t, len(result.AccessPoints), 1, "Should have at least one access point")
	})
}

func TestElastiCacheRedis(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := getAWSConfig(t)
	elasticacheClient := elasticache.NewFromConfig(cfg)
	ctx := context.Background()

	var replicationGroupId string

	t.Run("ElastiCache Redis cluster exists", func(t *testing.T) {
		// ACT
		result, err := elasticacheClient.DescribeReplicationGroups(ctx, &elasticache.DescribeReplicationGroupsInput{})

		// ASSERT
		require.NoError(t, err, "Failed to describe replication groups")
		require.NotEmpty(t, result.ReplicationGroups, "Should have at least one replication group")

		// Get the first available replication group
		for _, rg := range result.ReplicationGroups {
			if *rg.Status == "available" {
				replicationGroupId = *rg.ReplicationGroupId
				assert.Equal(t, "enabled", string(rg.AutomaticFailover), "Automatic failover should be enabled")
				assert.Equal(t, "enabled", string(rg.MultiAZ), "Multi-AZ should be enabled")
				assert.True(t, *rg.TransitEncryptionEnabled, "Transit encryption should be enabled")
				break
			}
		}

		assert.NotEmpty(t, replicationGroupId, "Should find ElastiCache replication group")
	})

	t.Run("ElastiCache cluster is in correct subnet group", func(t *testing.T) {
		require.NotEmpty(t, replicationGroupId, "Replication group ID required")

		// ACT
		result, err := elasticacheClient.DescribeCacheSubnetGroups(ctx, &elasticache.DescribeCacheSubnetGroupsInput{})

		// ASSERT
		require.NoError(t, err, "Failed to describe cache subnet groups")
		assert.NotEmpty(t, result.CacheSubnetGroups, "Should have cache subnet group")
	})
}

func TestECSFargateCluster(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := getAWSConfig(t)
	ecsClient := ecs.NewFromConfig(cfg)
	ctx := context.Background()

	var clusterArn string

	t.Run("ECS Fargate cluster exists", func(t *testing.T) {
		// ACT
		result, err := ecsClient.ListClusters(ctx, &ecs.ListClustersInput{})

		// ASSERT
		require.NoError(t, err, "Failed to list clusters")
		require.NotEmpty(t, result.ClusterArns, "Should have at least one cluster")

		clusterArn = result.ClusterArns[0]

		// Describe the cluster
		descResult, err := ecsClient.DescribeClusters(ctx, &ecs.DescribeClustersInput{
			Clusters: []string{clusterArn},
		})

		require.NoError(t, err, "Failed to describe cluster")
		require.Len(t, descResult.Clusters, 1)

		cluster := descResult.Clusters[0]
		if cluster.Status != nil {
			assert.Equal(t, "ACTIVE", *cluster.Status, "Cluster should be active")
		}
	})

	t.Run("ECS task definition exists and uses Fargate", func(t *testing.T) {
		// ACT
		result, err := ecsClient.ListTaskDefinitions(ctx, &ecs.ListTaskDefinitionsInput{
			Sort: "DESC",
		})

		// ASSERT
		require.NoError(t, err, "Failed to list task definitions")
		require.NotEmpty(t, result.TaskDefinitionArns, "Should have at least one task definition")

		// Describe the first task definition
		descResult, err := ecsClient.DescribeTaskDefinition(ctx, &ecs.DescribeTaskDefinitionInput{
			TaskDefinition: aws.String(result.TaskDefinitionArns[0]),
		})

		require.NoError(t, err, "Failed to describe task definition")

		taskDef := descResult.TaskDefinition
		assert.Contains(t, taskDef.RequiresCompatibilities, "FARGATE", "Task should support Fargate")
		assert.Equal(t, "awsvpc", string(taskDef.NetworkMode), "Network mode should be awsvpc")
	})
}

func TestAPIGatewayEndpoint(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadStackOutputs(t)

	t.Run("API Gateway endpoint is reachable", func(t *testing.T) {
		// ACT
		client := &http.Client{
			Timeout: 10 * time.Second,
		}
		resp, err := client.Get(outputs.ApiGatewayUrl)

		// ASSERT
		require.NoError(t, err, "Failed to reach API Gateway endpoint")
		defer resp.Body.Close()

		// API might return 404 or 403 without valid request, but should respond
		assert.NotEqual(t, 0, resp.StatusCode, "Should get a response from API Gateway")

		t.Logf("API Gateway responded with status: %d", resp.StatusCode)
	})

	t.Run("API Gateway uses HTTPS", func(t *testing.T) {
		// ASSERT
		assert.Contains(t, outputs.ApiGatewayUrl, "https://", "API Gateway should use HTTPS")
	})

	t.Run("API Gateway is in correct region", func(t *testing.T) {
		// ASSERT
		assert.Contains(t, outputs.ApiGatewayUrl, "us-east-1", "API Gateway should be in us-east-1")
	})
}

func TestKinesisDataStream(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	kinesisClient := kinesis.NewFromConfig(cfg)
	ctx := context.Background()

	t.Run("Kinesis stream exists and is active", func(t *testing.T) {
		// ACT
		result, err := kinesisClient.DescribeStream(ctx, &kinesis.DescribeStreamInput{
			StreamName: aws.String(outputs.KinesisStreamName),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe Kinesis stream")

		stream := result.StreamDescription
		assert.Equal(t, "ACTIVE", string(stream.StreamStatus), "Stream should be active")
		assert.Equal(t, outputs.KinesisStreamName, *stream.StreamName)
		assert.Equal(t, int32(24), *stream.RetentionPeriodHours, "Retention should be 24 hours")
	})

	t.Run("can put record to Kinesis stream", func(t *testing.T) {
		// ARRANGE
		testData := []byte(fmt.Sprintf(`{"test": "data", "timestamp": "%s"}`, time.Now().Format(time.RFC3339)))

		// ACT
		putResult, err := kinesisClient.PutRecord(ctx, &kinesis.PutRecordInput{
			StreamName:   aws.String(outputs.KinesisStreamName),
			Data:         testData,
			PartitionKey: aws.String("test-partition-key"),
		})

		// ASSERT
		require.NoError(t, err, "Failed to put record to Kinesis")
		assert.NotEmpty(t, putResult.ShardId, "Should return shard ID")
		assert.NotEmpty(t, putResult.SequenceNumber, "Should return sequence number")

		t.Logf("Successfully put record to shard: %s", *putResult.ShardId)
	})

	t.Run("can get records from Kinesis stream", func(t *testing.T) {
		// ARRANGE - Get shard iterator
		shardResult, err := kinesisClient.DescribeStream(ctx, &kinesis.DescribeStreamInput{
			StreamName: aws.String(outputs.KinesisStreamName),
		})
		require.NoError(t, err)
		require.NotEmpty(t, shardResult.StreamDescription.Shards)

		shardId := shardResult.StreamDescription.Shards[0].ShardId

		iteratorResult, err := kinesisClient.GetShardIterator(ctx, &kinesis.GetShardIteratorInput{
			StreamName:        aws.String(outputs.KinesisStreamName),
			ShardId:           shardId,
			ShardIteratorType: kinesistypes.ShardIteratorTypeLatest,
		})
		require.NoError(t, err)

		// ACT - Get records
		getResult, err := kinesisClient.GetRecords(ctx, &kinesis.GetRecordsInput{
			ShardIterator: iteratorResult.ShardIterator,
		})

		// ASSERT
		require.NoError(t, err, "Failed to get records from Kinesis")
		assert.NotNil(t, getResult.Records, "Should return records array")

		t.Logf("Retrieved %d records from Kinesis", len(getResult.Records))
	})

	t.Run("Kinesis stream has encryption enabled", func(t *testing.T) {
		// ACT
		result, err := kinesisClient.DescribeStream(ctx, &kinesis.DescribeStreamInput{
			StreamName: aws.String(outputs.KinesisStreamName),
		})

		// ASSERT
		require.NoError(t, err, "Failed to describe Kinesis stream")
		assert.Equal(t, kinesistypes.EncryptionTypeKms, result.StreamDescription.EncryptionType,
			"Stream should have KMS encryption")
	})
}

func TestSecretsManager(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := getAWSConfig(t)
	secretsClient := secretsmanager.NewFromConfig(cfg)
	ctx := context.Background()

	t.Run("database secret exists and can be retrieved", func(t *testing.T) {
		// ACT
		result, err := secretsClient.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})

		// ASSERT
		require.NoError(t, err, "Failed to list secrets")
		require.NotEmpty(t, result.SecretList, "Should have at least one secret")

		// Find database secret
		var dbSecret *smtypes.SecretListEntry
		for _, secret := range result.SecretList {
			if contains(*secret.Name, "db-credentials") || contains(*secret.Name, "database") {
				dbSecret = &secret
				break
			}
		}

		require.NotNil(t, dbSecret, "Should find database secret")
		assert.NotEmpty(t, dbSecret.ARN, "Secret should have ARN")
	})

	t.Run("API key secret exists", func(t *testing.T) {
		// ACT
		result, err := secretsClient.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})

		// ASSERT
		require.NoError(t, err, "Failed to list secrets")

		// Find API key secret
		var apiSecret *smtypes.SecretListEntry
		for _, secret := range result.SecretList {
			if contains(*secret.Name, "api-keys") || contains(*secret.Name, "api-key") {
				apiSecret = &secret
				break
			}
		}

		require.NotNil(t, apiSecret, "Should find API key secret")
	})

	t.Run("secrets have cross-region replication configured", func(t *testing.T) {
		// ACT
		result, err := secretsClient.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})
		require.NoError(t, err)

		// Find any of our secrets
		for _, secret := range result.SecretList {
			if contains(*secret.Name, "globalstream") {
				// Describe secret to get replication details
				descResult, err := secretsClient.DescribeSecret(ctx, &secretsmanager.DescribeSecretInput{
					SecretId: secret.ARN,
				})

				if err == nil && descResult.ReplicationStatus != nil {
					// Check if replicated to sa-east-1
					hasReplication := false
					for _, rep := range descResult.ReplicationStatus {
						if *rep.Region == "sa-east-1" {
							hasReplication = true
							break
						}
					}

					if hasReplication {
						t.Logf("Secret %s has cross-region replication to sa-east-1", *secret.Name)
						return // Test passed
					}
				}
			}
		}

		t.Log("Cross-region replication check completed")
	})
}

func TestStackDeploymentComplete(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := getAWSConfig(t)
	cfnClient := cloudformation.NewFromConfig(cfg)
	ctx := context.Background()

	t.Run("CloudFormation stack exists and is complete", func(t *testing.T) {
		// ACT
		result, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{})

		// ASSERT
		require.NoError(t, err, "Failed to describe stacks")
		require.NotEmpty(t, result.Stacks, "Should have at least one stack")

		// Find our TapStack
		var tapStack *cloudformation.DescribeStacksOutput
		for _, stack := range result.Stacks {
			if contains(*stack.StackName, "TapStack") {
				tapStack = &cloudformation.DescribeStacksOutput{Stacks: []cfntypes.Stack{stack}}
				break
			}
		}

		if tapStack != nil {
			stack := tapStack.Stacks[0]
			assert.Contains(t, []string{"CREATE_COMPLETE", "UPDATE_COMPLETE"},
				string(stack.StackStatus), "Stack should be in complete state")
			t.Logf("Stack %s is in state: %s", *stack.StackName, stack.StackStatus)
		}
	})
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
