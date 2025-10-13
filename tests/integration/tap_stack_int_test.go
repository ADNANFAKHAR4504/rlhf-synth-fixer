//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	kmstypes "github.com/aws/aws-sdk-go-v2/service/kms/types"
)

type StackOutputs struct {
	VpcId                 string `json:"vpcId"`
	VpcCidr               string `json:"vpcCidr"`
	PublicSubnet1Id       string `json:"publicSubnet1Id"`
	PublicSubnet2Id       string `json:"publicSubnet2Id"`
	PrivateSubnet1Id      string `json:"privateSubnet1Id"`
	PrivateSubnet2Id      string `json:"privateSubnet2Id"`
	KmsKeyId              string `json:"kmsKeyId"`
	KmsKeyArn             string `json:"kmsKeyArn"`
	KinesisStreamName     string `json:"kinesisStreamName"`
	KinesisStreamArn      string `json:"kinesisStreamArn"`
	RdsEndpoint           string `json:"rdsEndpoint"`
	RdsInstanceId         string `json:"rdsInstanceId"`
	RdsInstanceArn        string `json:"rdsInstanceArn"`
	DbSecretArn           string `json:"dbSecretArn"`
	EcsClusterName        string `json:"ecsClusterName"`
	EcsClusterArn         string `json:"ecsClusterArn"`
	EcsTaskDefinitionArn  string `json:"ecsTaskDefinitionArn"`
	ApiGatewayId          string `json:"apiGatewayId"`
	ApiGatewayUrl         string `json:"apiGatewayUrl"`
	ApiGatewayEndpoint    string `json:"apiGatewayEndpoint"`
}

func loadStackOutputs(t *testing.T) *StackOutputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var outputs StackOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs JSON: %v", err)
	}

	return &outputs
}

func getAWSConfig(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("Failed to load AWS config: %v", err)
	}
	return cfg
}

// Test 1: VPC Configuration
func TestVPCConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := ec2.NewFromConfig(cfg)

	vpcResult, err := client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	if err != nil {
		t.Fatalf("Failed to describe VPC: %v", err)
	}

	if len(vpcResult.Vpcs) != 1 {
		t.Fatalf("Expected 1 VPC, got %d", len(vpcResult.Vpcs))
	}

	vpc := vpcResult.Vpcs[0]
	if *vpc.CidrBlock != outputs.VpcCidr {
		t.Errorf("VPC CIDR mismatch: got %s, expected %s", *vpc.CidrBlock, outputs.VpcCidr)
	}
}

// Test 2: Subnet Configuration
func TestSubnetConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := ec2.NewFromConfig(cfg)

	subnetIds := []string{
		outputs.PublicSubnet1Id,
		outputs.PublicSubnet2Id,
		outputs.PrivateSubnet1Id,
		outputs.PrivateSubnet2Id,
	}

	subnetsResult, err := client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		SubnetIds: subnetIds,
	})
	if err != nil {
		t.Fatalf("Failed to describe subnets: %v", err)
	}

	if len(subnetsResult.Subnets) != 4 {
		t.Fatalf("Expected 4 subnets, got %d", len(subnetsResult.Subnets))
	}

	for _, subnet := range subnetsResult.Subnets {
		if *subnet.VpcId != outputs.VpcId {
			t.Errorf("Subnet %s does not belong to VPC %s", *subnet.SubnetId, outputs.VpcId)
		}
	}
}

// Test 3: KMS Key Configuration
func TestKMSKeyConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := kms.NewFromConfig(cfg)

	keyResult, err := client.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
		KeyId: &outputs.KmsKeyId,
	})
	if err != nil {
		t.Fatalf("Failed to describe KMS key: %v", err)
	}

	if keyResult.KeyMetadata.KeyState != kmstypes.KeyStateEnabled {
		t.Errorf("KMS key is not enabled: %s", keyResult.KeyMetadata.KeyState)
	}

	rotationResult, err := client.GetKeyRotationStatus(context.TODO(), &kms.GetKeyRotationStatusInput{
		KeyId: &outputs.KmsKeyId,
	})
	if err != nil {
		t.Fatalf("Failed to get key rotation status: %v", err)
	}

	if !rotationResult.KeyRotationEnabled {
		t.Error("KMS key rotation is not enabled")
	}

	policyResult, err := client.GetKeyPolicy(context.TODO(), &kms.GetKeyPolicyInput{
		KeyId:      &outputs.KmsKeyId,
		PolicyName: aws.String("default"),
	})
	if err != nil {
		t.Fatalf("Failed to get key policy: %v", err)
	}

	if !strings.Contains(*policyResult.Policy, "logs.us-east-1.amazonaws.com") {
		t.Error("KMS key policy does not contain CloudWatch Logs service permission")
	}
}

// Test 4: Kinesis Stream Configuration
func TestKinesisStreamConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := kinesis.NewFromConfig(cfg)

	streamResult, err := client.DescribeStream(context.TODO(), &kinesis.DescribeStreamInput{
		StreamName: &outputs.KinesisStreamName,
	})
	if err != nil {
		t.Fatalf("Failed to describe Kinesis stream: %v", err)
	}

	stream := streamResult.StreamDescription
	if string(stream.StreamStatus) != "ACTIVE" {
		t.Errorf("Kinesis stream is not active: %s", stream.StreamStatus)
	}

	if stream.EncryptionType != "KMS" {
		t.Errorf("Kinesis stream encryption is not KMS: %s", stream.EncryptionType)
	}

	if *stream.RetentionPeriodHours != 24 {
		t.Errorf("Kinesis stream retention period is %d hours, expected 24", *stream.RetentionPeriodHours)
	}
}

// Test 5: RDS Instance Configuration
func TestRDSInstanceConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := rds.NewFromConfig(cfg)

	dbInstancesResult, err := client.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{})
	if err != nil {
		t.Fatalf("Failed to describe RDS instances: %v", err)
	}

	found := false
	for _, instance := range dbInstancesResult.DBInstances {
		if instance.Endpoint != nil && strings.Contains(outputs.RdsEndpoint, *instance.Endpoint.Address) {
			found = true
			if *instance.PubliclyAccessible {
				t.Error("RDS instance is publicly accessible, should be private")
			}
			if !*instance.StorageEncrypted {
				t.Error("RDS instance storage is not encrypted")
			}
			if !strings.HasPrefix(*instance.Engine, "postgres") {
				t.Errorf("RDS engine is %s, expected postgres", *instance.Engine)
			}
			break
		}
	}

	if !found {
		t.Error("RDS instance not found or endpoint does not match")
	}
}

// Test 6: Secrets Manager Configuration
func TestSecretsManagerConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := secretsmanager.NewFromConfig(cfg)

	secretResult, err := client.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
		SecretId: &outputs.DbSecretArn,
	})
	if err != nil {
		t.Fatalf("Failed to describe secret: %v", err)
	}

	if secretResult.KmsKeyId == nil {
		t.Error("Secret is not encrypted with KMS")
	}

	valueResult, err := client.GetSecretValue(context.TODO(), &secretsmanager.GetSecretValueInput{
		SecretId: &outputs.DbSecretArn,
	})
	if err != nil {
		t.Fatalf("Failed to get secret value: %v", err)
	}

	var secretData map[string]interface{}
	if err := json.Unmarshal([]byte(*valueResult.SecretString), &secretData); err != nil {
		t.Fatalf("Failed to parse secret JSON: %v", err)
	}

	requiredFields := []string{"username", "password", "engine", "host", "port", "dbname"}
	for _, field := range requiredFields {
		if _, ok := secretData[field]; !ok {
			t.Errorf("Secret missing required field: %s", field)
		}
	}
}

// Test 7: ECS Cluster Configuration
func TestECSClusterConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := ecs.NewFromConfig(cfg)

	clusterResult, err := client.DescribeClusters(context.TODO(), &ecs.DescribeClustersInput{
		Clusters: []string{outputs.EcsClusterArn},
	})
	if err != nil {
		t.Fatalf("Failed to describe ECS cluster: %v", err)
	}

	if len(clusterResult.Clusters) != 1 {
		t.Fatalf("Expected 1 cluster, got %d", len(clusterResult.Clusters))
	}

	cluster := clusterResult.Clusters[0]
	if *cluster.Status != "ACTIVE" {
		t.Errorf("ECS cluster is not active: %s", *cluster.Status)
	}

	hasContainerInsights := false
	for _, setting := range cluster.Settings {
		if string(setting.Name) == "containerInsights" && *setting.Value == "enabled" {
			hasContainerInsights = true
			break
		}
	}
	if !hasContainerInsights {
		t.Error("Container Insights is not enabled on ECS cluster")
	}
}

// Test 8: ECS Service Configuration
func TestECSServiceConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := ecs.NewFromConfig(cfg)

	listResult, err := client.ListServices(context.TODO(), &ecs.ListServicesInput{
		Cluster: &outputs.EcsClusterArn,
	})
	if err != nil {
		t.Fatalf("Failed to list ECS services: %v", err)
	}

	if len(listResult.ServiceArns) == 0 {
		t.Fatal("No ECS services found in cluster")
	}

	servicesResult, err := client.DescribeServices(context.TODO(), &ecs.DescribeServicesInput{
		Cluster:  &outputs.EcsClusterArn,
		Services: listResult.ServiceArns,
	})
	if err != nil {
		t.Fatalf("Failed to describe ECS services: %v", err)
	}

	if len(servicesResult.Services) == 0 {
		t.Fatal("No ECS services found")
	}

	service := servicesResult.Services[0]
	if string(service.LaunchType) != "FARGATE" {
		t.Errorf("ECS service launch type is %s, expected FARGATE", service.LaunchType)
	}

	if service.DesiredCount != 1 {
		t.Errorf("ECS service desired count is %d, expected 1", service.DesiredCount)
	}
}

// Test 9: API Gateway Configuration
func TestAPIGatewayConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := apigateway.NewFromConfig(cfg)

	apiResult, err := client.GetRestApi(context.TODO(), &apigateway.GetRestApiInput{
		RestApiId: &outputs.ApiGatewayId,
	})
	if err != nil {
		t.Fatalf("Failed to get API Gateway: %v", err)
	}

	if len(apiResult.EndpointConfiguration.Types) == 0 || string(apiResult.EndpointConfiguration.Types[0]) != "REGIONAL" {
		t.Error("API Gateway endpoint type is not REGIONAL")
	}

	resourcesResult, err := client.GetResources(context.TODO(), &apigateway.GetResourcesInput{
		RestApiId: &outputs.ApiGatewayId,
	})
	if err != nil {
		t.Fatalf("Failed to get API Gateway resources: %v", err)
	}

	hasIngestResource := false
	for _, resource := range resourcesResult.Items {
		if *resource.Path == "/ingest" {
			hasIngestResource = true
			break
		}
	}
	if !hasIngestResource {
		t.Error("API Gateway /ingest resource not found")
	}
}

// Test 10: Security Groups Configuration
func TestSecurityGroupsConfiguration(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)
	client := ec2.NewFromConfig(cfg)

	sgResult, err := client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcId},
			},
		},
	})
	if err != nil {
		t.Fatalf("Failed to describe security groups: %v", err)
	}

	customSGs := 0
	for _, sg := range sgResult.SecurityGroups {
		if *sg.GroupName != "default" {
			customSGs++
		}
	}

	if customSGs < 3 {
		t.Errorf("Expected at least 3 custom security groups, got %d", customSGs)
	}
}
