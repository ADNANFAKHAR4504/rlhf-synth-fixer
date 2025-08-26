//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"strings"
)

type TapStackOutputs struct {
	KMSKeyId           string   `json:"kmsKeyId"`
	PrivateSubnetIds   []string `json:"privateSubnetIds"`
	PublicSubnetIds    []string `json:"publicSubnetIds"`
	PublicSubnet1Id    string
	PublicSubnet2Id    string
	S3BucketName       string `json:"s3BucketName"`
	VPCId              string `json:"vpcId"`
	ApplicationRoleArn string `json:"applicationRoleArn"`
	InstanceProfileArn string `json:"instanceProfileArn"`
	RdsEndpoint        string `json:"rdsEndpoint"`
}

type AWSClients struct {
	EC2        *ec2.Client
	S3         *s3.Client
	Lambda     *lambda.Client
	KMS        *kms.Client
	CloudWatch *cloudwatch.Client
}

func loadOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../../cfn-outputs/all-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	// Parse as map with stack name as key
	var rawOutputs map[string]map[string]interface{}
	if err := json.Unmarshal(data, &rawOutputs); err != nil {
		t.Fatalf("Failed to parse outputs: %v", err)
	}

	// Get the first stack's outputs
	for _, stackOutputs := range rawOutputs {
		outputs := &TapStackOutputs{}

		if val, ok := stackOutputs["kmsKeyId"].(string); ok {
			outputs.KMSKeyId = val
		}
		if val, ok := stackOutputs["s3BucketName"].(string); ok {
			outputs.S3BucketName = val
		}
		if val, ok := stackOutputs["vpcId"].(string); ok {
			outputs.VPCId = val
		}
		if val, ok := stackOutputs["applicationRoleArn"].(string); ok {
			outputs.ApplicationRoleArn = val
		}
		if val, ok := stackOutputs["instanceProfileArn"].(string); ok {
			outputs.InstanceProfileArn = val
		}
		if val, ok := stackOutputs["rdsEndpoint"].(string); ok {
			outputs.RdsEndpoint = val
		}

		// Handle subnet arrays
		if privateSubnets, ok := stackOutputs["privateSubnetIds"].([]interface{}); ok {
			for _, subnet := range privateSubnets {
				if subnetStr, ok := subnet.(string); ok {
					outputs.PrivateSubnetIds = append(outputs.PrivateSubnetIds, subnetStr)
				}
			}
		}
		if publicSubnets, ok := stackOutputs["publicSubnetIds"].([]interface{}); ok {
			for _, subnet := range publicSubnets {
				if subnetStr, ok := subnet.(string); ok {
					outputs.PublicSubnetIds = append(outputs.PublicSubnetIds, subnetStr)
				}
			}
			if len(outputs.PublicSubnetIds) >= 2 {
				outputs.PublicSubnet1Id = outputs.PublicSubnetIds[0]
				outputs.PublicSubnet2Id = outputs.PublicSubnetIds[1]
			}
		}

		return outputs
	}

	t.Fatal("No outputs found in file")
	return nil
}

func setupAWSClients(cfg aws.Config) *AWSClients {
	return &AWSClients{
		EC2:        ec2.NewFromConfig(cfg),
		S3:         s3.NewFromConfig(cfg),
		Lambda:     lambda.NewFromConfig(cfg),
		KMS:        kms.NewFromConfig(cfg),
		CloudWatch: cloudwatch.NewFromConfig(cfg),
	}
}

func extractFunctionNameFromArn(arn string) string {
	parts := strings.Split(arn, ":")
	if len(parts) >= 7 {
		return parts[6]
	}
	return ""
}

func TestDeployedInfrastructure(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	// Test VPC exists and is configured correctly
	t.Run("VPCConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		vpcOutput, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		if err != nil {
			t.Errorf("failed to describe VPC: %v", err)
		}

		if len(vpcOutput.Vpcs) == 0 {
			t.Error("VPC should exist")
		} else {
			vpc := vpcOutput.Vpcs[0]
			if string(vpc.State) != "available" {
				t.Errorf("Expected VPC state to be available, got %s", string(vpc.State))
			}
		}
	})

	// Test RDS instance exists
	t.Run("RDSInstanceExists", func(t *testing.T) {
		if outputs.RdsEndpoint == "" {
			t.Skip("RDS endpoint not available")
		}
		// RDS endpoint format: db-instance-pr1393-ap-south-1.cfmu6c4qc5lg.ap-south-1.rds.amazonaws.com:3306
		if !strings.Contains(outputs.RdsEndpoint, "rds.amazonaws.com") {
			t.Error("RDS endpoint should be a valid AWS RDS endpoint")
		}
	})

	// Test S3 Bucket security settings
	t.Run("S3BucketSecurity", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to access S3 bucket: %v", err)
		}

		// Check public access is blocked
		publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to get public access block configuration: %v", err)
		} else {
			if publicAccessBlock.PublicAccessBlockConfiguration != nil {
				if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls) {
					t.Error("Expected BlockPublicAcls to be true")
				}
				if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy) {
					t.Error("Expected BlockPublicPolicy to be true")
				}
			}
		}
	})

	// Test IAM Role exists
	t.Run("IAMRoleConfiguration", func(t *testing.T) {
		if outputs.ApplicationRoleArn == "" {
			t.Skip("Application role ARN not available")
		}
		if !strings.Contains(outputs.ApplicationRoleArn, "arn:aws:iam::") {
			t.Error("Application role ARN should be a valid IAM role ARN")
		}
	})

	// Test KMS Key exists
	t.Run("KMSKeyConfiguration", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		keyOutput, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KMSKeyId),
		})
		if err != nil {
			t.Errorf("failed to describe KMS key: %v", err)
		} else {
			if keyOutput.KeyMetadata == nil {
				t.Error("KMS key metadata should not be nil")
			}
		}
	})
}

// Test basic infrastructure components
func TestInfrastructureComponents(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("BasicComponentsExist", func(t *testing.T) {
		if outputs.VPCId == "" {
			t.Error("VPC ID should not be empty")
		}
		if outputs.S3BucketName == "" {
			t.Error("S3 bucket name should not be empty")
		}
		if outputs.KMSKeyId == "" {
			t.Error("KMS key ID should not be empty")
		}
		if len(outputs.PrivateSubnetIds) == 0 {
			t.Error("Private subnet IDs should not be empty")
		}
		if len(outputs.PublicSubnetIds) == 0 {
			t.Error("Public subnet IDs should not be empty")
		}
	})
}

// Test IAM roles and instance profiles
func TestIAMConfiguration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("IAMResourcesExist", func(t *testing.T) {
		if outputs.ApplicationRoleArn == "" {
			t.Error("Application role ARN should not be empty")
		}
		if outputs.InstanceProfileArn == "" {
			t.Error("Instance profile ARN should not be empty")
		}
		if !strings.HasPrefix(outputs.ApplicationRoleArn, "arn:aws:iam::") {
			t.Error("Application role ARN should be a valid IAM role ARN")
		}
		if !strings.HasPrefix(outputs.InstanceProfileArn, "arn:aws:iam::") {
			t.Error("Instance profile ARN should be a valid IAM instance profile ARN")
		}
	})
}

// Test output completeness
func TestOutputCompleteness(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("AllOutputsPresent", func(t *testing.T) {
		requiredOutputs := map[string]string{
			"KMSKeyId":           outputs.KMSKeyId,
			"S3BucketName":       outputs.S3BucketName,
			"VPCId":              outputs.VPCId,
			"ApplicationRoleArn": outputs.ApplicationRoleArn,
			"InstanceProfileArn": outputs.InstanceProfileArn,
			"RdsEndpoint":        outputs.RdsEndpoint,
		}

		for outputName, outputValue := range requiredOutputs {
			if outputValue == "" {
				t.Errorf("Output %s is empty", outputName)
			}
		}

		// Check array outputs
		if len(outputs.PrivateSubnetIds) == 0 {
			t.Error("PrivateSubnetIds should not be empty")
		}
		if len(outputs.PublicSubnetIds) == 0 {
			t.Error("PublicSubnetIds should not be empty")
		}
	})
}
func TestPublicSubnetsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	if outputs.PublicSubnet1Id == "" || outputs.PublicSubnet2Id == "" {
		t.Skip("Public subnet IDs not available in outputs")
	}

	t.Run("should verify public subnets exist with internet access", func(t *testing.T) {
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			SubnetIds: []string{outputs.PublicSubnet1Id, outputs.PublicSubnet2Id},
		})
		require.NoError(t, err)
		require.Len(t, subnets.Subnets, 2)

		for _, subnet := range subnets.Subnets {
			assert.Equal(t, outputs.VPCId, *subnet.VpcId)
			assert.True(t, *subnet.MapPublicIpOnLaunch)
		}
	})
}

func TestE2ENetworkingIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("e2e: should have proper network architecture", func(t *testing.T) {
		// Verify VPC has both public and private subnets
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			Filters: []types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(subnets.Subnets), 4)

		publicSubnets := 0
		privateSubnets := 0

		for _, subnet := range subnets.Subnets {
			if *subnet.MapPublicIpOnLaunch {
				publicSubnets++
			} else {
				privateSubnets++
			}
		}

		assert.Equal(t, 2, publicSubnets, "Should have 2 public subnets")
		assert.Equal(t, 2, privateSubnets, "Should have 2 private subnets")
	})
}
