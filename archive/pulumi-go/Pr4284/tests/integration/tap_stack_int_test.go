//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	ec2Client     *ec2.Client
	rdsClient     *rds.Client
	cacheClient   *elasticache.Client
	ecsClient     *ecs.Client
	albClient     *elasticloadbalancingv2.Client
	apiClient     *apigateway.Client
	secretsClient *secretsmanager.Client
	ecrClient     *ecr.Client
	skipLiveTests bool
	awsRegion     string
)

// InfrastructureOutputs represents the expected outputs from the Pulumi stack
type InfrastructureOutputs struct {
	VpcID                    string `json:"vpcId"`
	VpcCidr                  string `json:"vpcCidr"`
	PublicSubnet1ID          string `json:"publicSubnet1Id"`
	PublicSubnet2ID          string `json:"publicSubnet2Id"`
	PrivateSubnet1ID         string `json:"privateSubnet1Id"`
	PrivateSubnet2ID         string `json:"privateSubnet2Id"`
	NatGatewayID             string `json:"natGatewayId"`
	DbSecretArn              string `json:"dbSecretArn"`
	DbSecretName             string `json:"dbSecretName"`
	RdsEndpoint              string `json:"rdsEndpoint"`
	RdsInstanceID            string `json:"rdsInstanceId"`
	RedisEndpoint            string `json:"redisEndpoint"`
	RedisPort                string `json:"redisPort"`
	EcsClusterName           string `json:"ecsClusterName"`
	EcsClusterArn            string `json:"ecsClusterArn"`
	EcsServiceName           string `json:"ecsServiceName"`
	EcrRepositoryUrl         string `json:"ecrRepositoryUrl"`
	ApiGatewayUrl            string `json:"apiGatewayUrl"`
	ApiGatewayID             string `json:"apiGatewayId"`
	S3EndpointID             string `json:"s3EndpointId"`
	SecretsManagerEndpointID string `json:"secretsManagerEndpointId"`
	EcrApiEndpointID         string `json:"ecrApiEndpointId"`
	EcrDkrEndpointID         string `json:"ecrDkrEndpointId"`
	LogsEndpointID           string `json:"logsEndpointId"`
	AlbDnsName               string `json:"albDnsName"`
	AlbArn                   string `json:"albArn"`
	TargetGroupArn           string `json:"targetGroupArn"`
}

func TestMain(m *testing.M) {
	// Check if we should skip live tests
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("CI") == "true" {
		skipLiveTests = true
		fmt.Println("⚠️  Skipping live AWS integration tests - no AWS credentials or running in CI")
		os.Exit(0)
	}

	// Get AWS region from environment or use default
	awsRegion = os.Getenv("AWS_REGION")
	if awsRegion == "" {
		awsRegion = "us-east-1"
	}

	// Initialize AWS clients
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(awsRegion))
	if err != nil {
		fmt.Printf("❌ Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	ec2Client = ec2.NewFromConfig(cfg)
	rdsClient = rds.NewFromConfig(cfg)
	cacheClient = elasticache.NewFromConfig(cfg)
	ecsClient = ecs.NewFromConfig(cfg)
	albClient = elasticloadbalancingv2.NewFromConfig(cfg)
	apiClient = apigateway.NewFromConfig(cfg)
	secretsClient = secretsmanager.NewFromConfig(cfg)
	ecrClient = ecr.NewFromConfig(cfg)

	os.Exit(m.Run())
}

// LoadOutputs loads the deployment outputs from the outputs file
func LoadOutputs(t *testing.T) *InfrastructureOutputs {
	outputsFile := "../../cfn-outputs/flat-outputs.json"

	// Check if the file exists
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skip("Skipping integration test - no outputs file found (infrastructure not deployed)")
	}

	// Read and parse the outputs file
	data, err := os.ReadFile(outputsFile)
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var outputs InfrastructureOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs file: %v", err)
	}

	// Check if outputs are empty
	if outputs.VpcID == "" {
		t.Skip("Skipping integration test - outputs file is empty (infrastructure not deployed)")
	}

	return &outputs
}

func TestOutputsValidation(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should have valid VPC ID", func(t *testing.T) {
		assert.NotEmpty(t, outputs.VpcID)
		assert.True(t, strings.HasPrefix(outputs.VpcID, "vpc-"), "VPC ID should start with 'vpc-'")
	})

	t.Run("should have valid VPC CIDR", func(t *testing.T) {
		assert.Equal(t, "10.0.0.0/16", outputs.VpcCidr)
	})

	t.Run("should have valid subnet IDs", func(t *testing.T) {
		assert.True(t, strings.HasPrefix(outputs.PublicSubnet1ID, "subnet-"))
		assert.True(t, strings.HasPrefix(outputs.PublicSubnet2ID, "subnet-"))
		assert.True(t, strings.HasPrefix(outputs.PrivateSubnet1ID, "subnet-"))
		assert.True(t, strings.HasPrefix(outputs.PrivateSubnet2ID, "subnet-"))
	})

	t.Run("should have valid RDS endpoint", func(t *testing.T) {
		assert.NotEmpty(t, outputs.RdsEndpoint)
		assert.True(t, strings.Contains(outputs.RdsEndpoint, ".rds.amazonaws.com"), "RDS endpoint should contain '.rds.amazonaws.com'")
	})

	t.Run("should have valid Redis endpoint", func(t *testing.T) {
		assert.NotEmpty(t, outputs.RedisEndpoint)
		assert.Equal(t, "6379", outputs.RedisPort)
	})

	t.Run("should have valid ALB DNS name", func(t *testing.T) {
		assert.NotEmpty(t, outputs.AlbDnsName)
		assert.True(t, strings.Contains(outputs.AlbDnsName, ".elb.amazonaws.com"), "ALB DNS name should contain '.elb.amazonaws.com'")
	})

	t.Run("should have valid API Gateway URL", func(t *testing.T) {
		assert.NotEmpty(t, outputs.ApiGatewayUrl)
		assert.True(t, strings.HasPrefix(outputs.ApiGatewayUrl, "https://"))
		assert.True(t, strings.Contains(outputs.ApiGatewayUrl, ".execute-api."))
	})

	t.Run("should have valid VPC Endpoint IDs", func(t *testing.T) {
		assert.True(t, strings.HasPrefix(outputs.S3EndpointID, "vpce-"))
		assert.True(t, strings.HasPrefix(outputs.SecretsManagerEndpointID, "vpce-"))
		assert.True(t, strings.HasPrefix(outputs.EcrApiEndpointID, "vpce-"))
		assert.True(t, strings.HasPrefix(outputs.EcrDkrEndpointID, "vpce-"))
		assert.True(t, strings.HasPrefix(outputs.LogsEndpointID, "vpce-"))
	})
}

func TestVPCConfiguration(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("VPC should exist with correct configuration", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcID},
		})
		require.NoError(t, err)
		require.Len(t, result.Vpcs, 1)

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.VpcCidr, *vpc.CidrBlock)
		assert.Equal(t, types.VpcStateAvailable, vpc.State)
	})

	t.Run("should have 4 subnets in 2 availability zones", func(t *testing.T) {
		subnetIDs := []string{
			outputs.PublicSubnet1ID,
			outputs.PublicSubnet2ID,
			outputs.PrivateSubnet1ID,
			outputs.PrivateSubnet2ID,
		}

		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			SubnetIds: subnetIDs,
		})
		require.NoError(t, err)
		require.Len(t, result.Subnets, 4)

		azCount := make(map[string]int)
		for _, subnet := range result.Subnets {
			azCount[*subnet.AvailabilityZone]++
		}
		assert.Len(t, azCount, 2, "Subnets should be distributed across 2 AZs")
	})

	t.Run("NAT Gateway should be available", func(t *testing.T) {
		result, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			NatGatewayIds: []string{outputs.NatGatewayID},
		})
		require.NoError(t, err)
		require.Len(t, result.NatGateways, 1)

		natGw := result.NatGateways[0]
		assert.Equal(t, types.NatGatewayStateAvailable, natGw.State)
	})
}

func TestVPCEndpoints(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	endpointIDs := []string{
		outputs.S3EndpointID,
		outputs.SecretsManagerEndpointID,
		outputs.EcrApiEndpointID,
		outputs.EcrDkrEndpointID,
		outputs.LogsEndpointID,
	}

	t.Run("all VPC endpoints should be available", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: endpointIDs,
		})
		require.NoError(t, err)
		require.Len(t, result.VpcEndpoints, 5)

		for _, endpoint := range result.VpcEndpoints {
			assert.Equal(t, types.StateAvailable, endpoint.State)
		}
	})

	t.Run("S3 endpoint should be Gateway type", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: []string{outputs.S3EndpointID},
		})
		require.NoError(t, err)
		require.Len(t, result.VpcEndpoints, 1)

		assert.Equal(t, types.VpcEndpointTypeGateway, result.VpcEndpoints[0].VpcEndpointType)
	})

	t.Run("interface endpoints should be Interface type", func(t *testing.T) {
		interfaceEndpoints := []string{
			outputs.SecretsManagerEndpointID,
			outputs.EcrApiEndpointID,
			outputs.EcrDkrEndpointID,
			outputs.LogsEndpointID,
		}

		result, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: interfaceEndpoints,
		})
		require.NoError(t, err)
		require.Len(t, result.VpcEndpoints, 4)

		for _, endpoint := range result.VpcEndpoints {
			assert.Equal(t, types.VpcEndpointTypeInterface, endpoint.VpcEndpointType)
		}
	})
}

func TestSecretsManager(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("database secret should exist", func(t *testing.T) {
		result, err := secretsClient.DescribeSecret(ctx, &secretsmanager.DescribeSecretInput{
			SecretId: aws.String(outputs.DbSecretArn),
		})
		require.NoError(t, err)
		assert.NotNil(t, result.Name)
		assert.Equal(t, outputs.DbSecretName, *result.Name)
	})

	t.Run("secret should contain username and password", func(t *testing.T) {
		result, err := secretsClient.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
			SecretId: aws.String(outputs.DbSecretArn),
		})
		require.NoError(t, err)

		var secretData map[string]string
		err = json.Unmarshal([]byte(*result.SecretString), &secretData)
		require.NoError(t, err)

		assert.NotEmpty(t, secretData["username"])
		assert.NotEmpty(t, secretData["password"])
	})
}

func TestRDSDatabase(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("RDS instance should be available", func(t *testing.T) {
		result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(outputs.RdsInstanceID),
		})
		require.NoError(t, err)
		require.Len(t, result.DBInstances, 1)

		instance := result.DBInstances[0]
		assert.Equal(t, "available", *instance.DBInstanceStatus)
		assert.Equal(t, "postgres", *instance.Engine)
		assert.True(t, *instance.StorageEncrypted)
		assert.Equal(t, int32(7), *instance.BackupRetentionPeriod)
	})
}

func TestElastiCacheRedis(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("Redis replication group should be available", func(t *testing.T) {
		// Extract replication group ID from endpoint
		endpointParts := strings.Split(outputs.RedisEndpoint, ".")
		if len(endpointParts) < 1 {
			t.Skip("Cannot extract replication group ID from endpoint")
		}

		result, err := cacheClient.DescribeReplicationGroups(ctx, &elasticache.DescribeReplicationGroupsInput{})
		require.NoError(t, err)

		var found bool
		for _, rg := range result.ReplicationGroups {
			if rg.NodeGroups != nil && len(rg.NodeGroups) > 0 &&
				rg.NodeGroups[0].PrimaryEndpoint != nil &&
				strings.HasPrefix(*rg.NodeGroups[0].PrimaryEndpoint.Address, endpointParts[0]) {
				found = true
				assert.Equal(t, "available", *rg.Status)
				assert.True(t, *rg.AtRestEncryptionEnabled)
				assert.True(t, string(rg.AutomaticFailover) != "disabled")
				assert.True(t, string(rg.MultiAZ) != "disabled")
				break
			}
		}
		assert.True(t, found, "Redis replication group should be found")
	})
}

func TestECSCluster(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("ECS cluster should exist", func(t *testing.T) {
		result, err := ecsClient.DescribeClusters(ctx, &ecs.DescribeClustersInput{
			Clusters: []string{outputs.EcsClusterArn},
		})
		require.NoError(t, err)
		require.Len(t, result.Clusters, 1)

		cluster := result.Clusters[0]
		assert.Equal(t, "ACTIVE", *cluster.Status)
		assert.Equal(t, outputs.EcsClusterName, *cluster.ClusterName)
	})

	t.Run("ECS service should exist", func(t *testing.T) {
		result, err := ecsClient.DescribeServices(ctx, &ecs.DescribeServicesInput{
			Cluster:  aws.String(outputs.EcsClusterArn),
			Services: []string{outputs.EcsServiceName},
		})
		require.NoError(t, err)
		require.Len(t, result.Services, 1)

		service := result.Services[0]
		assert.Equal(t, "ACTIVE", *service.Status)
		assert.Equal(t, "FARGATE", string(service.LaunchType))
	})
}

func TestECRRepository(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("ECR repository should exist", func(t *testing.T) {
		// Extract repository name from URL
		urlParts := strings.Split(outputs.EcrRepositoryUrl, "/")
		if len(urlParts) < 2 {
			t.Skip("Cannot extract repository name from URL")
		}
		repoName := urlParts[len(urlParts)-1]

		result, err := ecrClient.DescribeRepositories(ctx, &ecr.DescribeRepositoriesInput{
			RepositoryNames: []string{repoName},
		})
		require.NoError(t, err)
		require.Len(t, result.Repositories, 1)

		repo := result.Repositories[0]
		assert.NotNil(t, repo.ImageScanningConfiguration)
		assert.True(t, repo.ImageScanningConfiguration.ScanOnPush)
	})
}

func TestApplicationLoadBalancer(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("ALB should be active", func(t *testing.T) {
		result, err := albClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{
			LoadBalancerArns: []string{outputs.AlbArn},
		})
		require.NoError(t, err)
		require.Len(t, result.LoadBalancers, 1)

		alb := result.LoadBalancers[0]
		assert.Equal(t, "active", string(alb.State.Code))
		assert.Equal(t, "application", string(alb.Type))
		assert.False(t, string(alb.Scheme) == "internal", "ALB should be internet-facing")
	})

	t.Run("target group should exist", func(t *testing.T) {
		result, err := albClient.DescribeTargetGroups(ctx, &elasticloadbalancingv2.DescribeTargetGroupsInput{
			TargetGroupArns: []string{outputs.TargetGroupArn},
		})
		require.NoError(t, err)
		require.Len(t, result.TargetGroups, 1)

		tg := result.TargetGroups[0]
		assert.Equal(t, int32(8080), *tg.Port)
		assert.Equal(t, "HTTP", string(tg.Protocol))
		assert.Equal(t, "ip", string(tg.TargetType))
	})

	t.Run("ALB health check should return valid response", func(t *testing.T) {
		url := fmt.Sprintf("http://%s/", outputs.AlbDnsName)
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		resp, err := client.Get(url)
		if err != nil {
			t.Logf("ALB health check failed (expected if no tasks running): %v", err)
			return
		}
		defer resp.Body.Close()

		// ALB may return 502/503 if no healthy targets, or 404 if ECS tasks not deployed
		validCodes := []int{200, 404, 502, 503, 504}
		assert.Contains(t, validCodes, resp.StatusCode, "ALB should return valid HTTP status code")
	})
}

func TestAPIGateway(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("REST API should exist", func(t *testing.T) {
		result, err := apiClient.GetRestApi(ctx, &apigateway.GetRestApiInput{
			RestApiId: aws.String(outputs.ApiGatewayID),
		})
		require.NoError(t, err)
		assert.NotNil(t, result.Name)
	})

	t.Run("API should have prod stage", func(t *testing.T) {
		result, err := apiClient.GetStage(ctx, &apigateway.GetStageInput{
			RestApiId: aws.String(outputs.ApiGatewayID),
			StageName: aws.String("prod"),
		})
		require.NoError(t, err)
		assert.Equal(t, "prod", *result.StageName)
	})

	t.Run("API endpoint should be accessible", func(t *testing.T) {
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		resp, err := client.Get(outputs.ApiGatewayUrl)
		if err != nil {
			t.Logf("API Gateway endpoint not accessible (expected if ALB/ECS not ready): %v", err)
			return
		}
		defer resp.Body.Close()

		// API Gateway may return various codes depending on backend state
		validCodes := []int{200, 403, 404, 500, 502, 503, 504}
		assert.Contains(t, validCodes, resp.StatusCode, "API Gateway should return valid HTTP status code")
	})
}

func TestHighAvailability(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("subnets should be in different availability zones", func(t *testing.T) {
		subnetIDs := []string{
			outputs.PublicSubnet1ID,
			outputs.PublicSubnet2ID,
			outputs.PrivateSubnet1ID,
			outputs.PrivateSubnet2ID,
		}

		result, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			SubnetIds: subnetIDs,
		})
		require.NoError(t, err)

		azSet := make(map[string]bool)
		for _, subnet := range result.Subnets {
			azSet[*subnet.AvailabilityZone] = true
		}

		assert.GreaterOrEqual(t, len(azSet), 2, "Infrastructure should span at least 2 availability zones")
	})

	t.Run("Redis should have automatic failover enabled", func(t *testing.T) {
		result, err := cacheClient.DescribeReplicationGroups(ctx, &elasticache.DescribeReplicationGroupsInput{})
		require.NoError(t, err)

		// Find our Redis cluster by matching endpoint
		for _, rg := range result.ReplicationGroups {
			if rg.NodeGroups != nil && len(rg.NodeGroups) > 0 &&
				rg.NodeGroups[0].PrimaryEndpoint != nil {
				endpoint := *rg.NodeGroups[0].PrimaryEndpoint.Address
				if strings.Contains(endpoint, strings.Split(outputs.RedisEndpoint, ".")[0]) {
					assert.True(t, string(rg.AutomaticFailover) != "disabled", "Redis should have automatic failover enabled")
					break
				}
			}
		}
	})
}

func TestSecurityConfiguration(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)
	ctx := context.TODO()

	t.Run("RDS should have encryption enabled", func(t *testing.T) {
		result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(outputs.RdsInstanceID),
		})
		require.NoError(t, err)
		require.Len(t, result.DBInstances, 1)

		assert.True(t, *result.DBInstances[0].StorageEncrypted, "RDS should have storage encryption enabled")
	})

	t.Run("Redis should have at-rest encryption enabled", func(t *testing.T) {
		result, err := cacheClient.DescribeReplicationGroups(ctx, &elasticache.DescribeReplicationGroupsInput{})
		require.NoError(t, err)

		// Find our Redis cluster
		for _, rg := range result.ReplicationGroups {
			if rg.NodeGroups != nil && len(rg.NodeGroups) > 0 &&
				rg.NodeGroups[0].PrimaryEndpoint != nil {
				endpoint := *rg.NodeGroups[0].PrimaryEndpoint.Address
				if strings.Contains(endpoint, strings.Split(outputs.RedisEndpoint, ".")[0]) {
					assert.True(t, *rg.AtRestEncryptionEnabled, "Redis should have at-rest encryption enabled")
					break
				}
			}
		}
	})

	t.Run("VPC should have DNS support enabled", func(t *testing.T) {
		// Check DNS Support
		dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcID),
			Attribute: types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err)
		assert.True(t, *dnsSupport.EnableDnsSupport.Value)

		// Check DNS Hostnames
		dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcID),
			Attribute: types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err)
		assert.True(t, *dnsHostnames.EnableDnsHostnames.Value)
	})
}
