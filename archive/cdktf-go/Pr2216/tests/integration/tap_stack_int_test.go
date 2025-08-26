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
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type TapStackOutputs struct {
	KMSKeyId           string `json:"kms_key_id"`
	LambdaFunctionName string `json:"lambda_function_name"`
	PrivateSubnetIds   string `json:"private_subnet_ids"`
	PublicSubnetIds    string `json:"public_subnet_ids"`
	S3BucketName       string `json:"s3_bucket_name"`
	VPCId              string `json:"vpc_id"`
}

func loadOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	// Parse as map and get the first key
	var rawOutputs map[string]TapStackOutputs
	if err := json.Unmarshal(data, &rawOutputs); err != nil {
		t.Fatalf("Failed to parse outputs: %v", err)
	}

	// Return the first key's outputs
	for _, outputs := range rawOutputs {
		return &outputs
	}

	t.Fatal("No outputs found in file")
	return nil
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

		// Check VPC exists
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

	// Test Subnets exist and are properly configured
	t.Run("SubnetConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Test private subnets
		privateSubnets := strings.Split(outputs.PrivateSubnetIds, ",")
		for _, subnetId := range privateSubnets {
			subnetId = strings.TrimSpace(subnetId)
			subnetOutput, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				SubnetIds: []string{subnetId},
			})
			if err != nil {
				t.Errorf("failed to describe private subnet %s: %v", subnetId, err)
				continue
			}

			if len(subnetOutput.Subnets) == 0 {
				t.Errorf("Private subnet %s should exist", subnetId)
				continue
			}

			subnet := subnetOutput.Subnets[0]
			if *subnet.VpcId != outputs.VPCId {
				t.Errorf("Private subnet %s should be in VPC %s, got %s", subnetId, outputs.VPCId, *subnet.VpcId)
			}
		}

		// Test public subnets
		publicSubnets := strings.Split(outputs.PublicSubnetIds, ",")
		for _, subnetId := range publicSubnets {
			subnetId = strings.TrimSpace(subnetId)
			subnetOutput, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				SubnetIds: []string{subnetId},
			})
			if err != nil {
				t.Errorf("failed to describe public subnet %s: %v", subnetId, err)
				continue
			}

			if len(subnetOutput.Subnets) == 0 {
				t.Errorf("Public subnet %s should exist", subnetId)
				continue
			}

			subnet := subnetOutput.Subnets[0]
			if *subnet.VpcId != outputs.VPCId {
				t.Errorf("Public subnet %s should be in VPC %s, got %s", subnetId, outputs.VPCId, *subnet.VpcId)
			}
		}
	})

	// Test S3 Bucket exists and is configured securely
	t.Run("S3BucketSecurity", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket exists
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
				if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls) {
					t.Error("Expected IgnorePublicAcls to be true")
				}
				if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets) {
					t.Error("Expected RestrictPublicBuckets to be true")
				}
			}
		}

		// Check encryption
		encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to get encryption configuration: %v", err)
		} else {
			if encryption.ServerSideEncryptionConfiguration == nil ||
				len(encryption.ServerSideEncryptionConfiguration.Rules) == 0 {
				t.Error("Expected encryption to be configured")
			}
		}

		// Check versioning
		versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Logf("Versioning configuration may not be set: %v", err)
		} else {
			if versioning.Status != "Enabled" {
				t.Logf("Versioning status: %v (not enabled)", versioning.Status)
			}
		}
	})

	// Test Lambda Function exists and is configured correctly
	t.Run("LambdaFunctionConfiguration", func(t *testing.T) {
		lambdaClient := lambda.NewFromConfig(cfg)

		// Check function exists
		functionOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		if err != nil {
			t.Errorf("failed to get Lambda function: %v", err)
		} else {
			if functionOutput.Configuration == nil {
				t.Error("Lambda function configuration should not be nil")
			} else {
				// Check function is in the correct VPC
				if functionOutput.Configuration.VpcConfig != nil {
					if *functionOutput.Configuration.VpcConfig.VpcId != outputs.VPCId {
						t.Errorf("Expected Lambda to be in VPC %s, got %s", outputs.VPCId, *functionOutput.Configuration.VpcConfig.VpcId)
					}
				}

				// Check runtime and other basic configurations
				if string(functionOutput.Configuration.State) != "Active" {
					t.Errorf("Expected Lambda state to be Active, got %s", string(functionOutput.Configuration.State))
				}
			}
		}

		// Check function policy/permissions
		policy, err := lambdaClient.GetPolicy(ctx, &lambda.GetPolicyInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		if err == nil && policy.Policy != nil {
			// Basic validation that policy exists
			policyDoc := *policy.Policy
			if !strings.Contains(policyDoc, "lambda:InvokeFunction") {
				t.Log("Lambda function policy may not contain invoke permissions")
			}
		}
	})

	// Test KMS Key exists and is configured correctly
	t.Run("KMSKeyConfiguration", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		// Check key exists and get details
		keyOutput, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KMSKeyId),
		})
		if err != nil {
			t.Errorf("failed to describe KMS key: %v", err)
		} else {
			if keyOutput.KeyMetadata == nil {
				t.Error("KMS key metadata should not be nil")
			} else {
				// Check key is enabled
				if !keyOutput.KeyMetadata.Enabled {
					t.Error("Expected KMS key to be enabled")
				}

				// Check key usage
				if keyOutput.KeyMetadata.KeyUsage != "ENCRYPT_DECRYPT" {
					t.Errorf("Expected KMS key usage to be ENCRYPT_DECRYPT, got %v", keyOutput.KeyMetadata.KeyUsage)
				}
			}
		}

		// Check key policy
		keyPolicy, err := kmsClient.GetKeyPolicy(ctx, &kms.GetKeyPolicyInput{
			KeyId:      aws.String(outputs.KMSKeyId),
			PolicyName: aws.String("default"),
		})
		if err != nil {
			t.Errorf("failed to get KMS key policy: %v", err)
		} else {
			if keyPolicy.Policy == nil {
				t.Error("KMS key should have a policy")
			}
		}
	})
}

// Test resource naming conventions
func TestNamingConventions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("ResourceNaming", func(t *testing.T) {
		// Check S3 bucket name follows convention
		if !strings.Contains(outputs.S3BucketName, "security-logs-bucket") {
			t.Errorf("S3 bucket name should contain 'security-logs-bucket', got %s", outputs.S3BucketName)
		}

		// Check Lambda function name follows convention
		if !strings.Contains(outputs.LambdaFunctionName, "vpc-logging-function") {
			t.Errorf("Lambda function name should contain 'vpc-logging-function', got %s", outputs.LambdaFunctionName)
		}

		// Check VPC ID format
		if !strings.HasPrefix(outputs.VPCId, "vpc-") {
			t.Errorf("VPC ID should start with 'vpc-', got %s", outputs.VPCId)
		}

		// Check subnet ID formats
		privateSubnets := strings.Split(outputs.PrivateSubnetIds, ",")
		for _, subnetId := range privateSubnets {
			subnetId = strings.TrimSpace(subnetId)
			if !strings.HasPrefix(subnetId, "subnet-") {
				t.Errorf("Private subnet ID should start with 'subnet-', got %s", subnetId)
			}
		}

		publicSubnets := strings.Split(outputs.PublicSubnetIds, ",")
		for _, subnetId := range publicSubnets {
			subnetId = strings.TrimSpace(subnetId)
			if !strings.HasPrefix(subnetId, "subnet-") {
				t.Errorf("Public subnet ID should start with 'subnet-', got %s", subnetId)
			}
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
			"LambdaFunctionName": outputs.LambdaFunctionName,
			"PrivateSubnetIds":   outputs.PrivateSubnetIds,
			"PublicSubnetIds":    outputs.PublicSubnetIds,
			"S3BucketName":       outputs.S3BucketName,
			"VPCId":              outputs.VPCId,
		}

		for outputName, outputValue := range requiredOutputs {
			if outputValue == "" {
				t.Errorf("Output %s is empty", outputName)
			}
		}
	})

	t.Run("OutputFormats", func(t *testing.T) {
		// Validate subnet IDs format (comma-separated)
		if !strings.Contains(outputs.PrivateSubnetIds, ",") && len(strings.Split(outputs.PrivateSubnetIds, ",")) < 2 {
			t.Log("Private subnets should typically have multiple subnets")
		}

		if !strings.Contains(outputs.PublicSubnetIds, ",") && len(strings.Split(outputs.PublicSubnetIds, ",")) < 2 {
			t.Log("Public subnets should typically have multiple subnets")
		}

		// Validate KMS key ID format (UUID)
		if len(outputs.KMSKeyId) != 36 || strings.Count(outputs.KMSKeyId, "-") != 4 {
			t.Errorf("KMS Key ID should be a UUID format, got %s", outputs.KMSKeyId)
		}
	})
}

// Test VPC Flow Logs and CloudWatch integration
func TestVPCLoggingConfiguration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("VPCFlowLogsEnabled", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Check VPC Flow Logs are enabled
		flowLogsOutput, err := ec2Client.DescribeFlowLogs(ctx, &ec2.DescribeFlowLogsInput{
			Filter: []ec2types.Filter{
				{
					Name:   aws.String("resource-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		if err != nil {
			t.Errorf("failed to describe flow logs: %v", err)
		} else {
			if len(flowLogsOutput.FlowLogs) == 0 {
				t.Error("Expected VPC Flow Logs to be enabled")
			} else {
				for _, flowLog := range flowLogsOutput.FlowLogs {
					if *flowLog.FlowLogStatus != "ACTIVE" {
						t.Errorf("Expected flow log status to be ACTIVE, got %s", *flowLog.FlowLogStatus)
					}
				}
			}
		}
	})
}

// Test Lambda function environment and permissions
func TestLambdaSecurityConfiguration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("LambdaEnvironmentVariables", func(t *testing.T) {
		lambdaClient := lambda.NewFromConfig(cfg)

		functionOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		if err != nil {
			t.Errorf("failed to get Lambda function: %v", err)
		} else {
			if functionOutput.Configuration.Environment != nil {
				envVars := functionOutput.Configuration.Environment.Variables
				if bucketName, exists := envVars["S3_BUCKET_NAME"]; exists {
					if bucketName != outputs.S3BucketName {
						t.Errorf("Expected S3_BUCKET_NAME env var to be %s, got %s", outputs.S3BucketName, bucketName)
					}
				}
			}
		}
	})

	t.Run("LambdaExecutionRole", func(t *testing.T) {
		lambdaClient := lambda.NewFromConfig(cfg)

		functionOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		if err != nil {
			t.Errorf("failed to get Lambda function: %v", err)
		} else {
			if functionOutput.Configuration.Role == nil {
				t.Error("Lambda function should have an execution role")
			} else {
				roleArn := *functionOutput.Configuration.Role
				if !strings.Contains(roleArn, "arn:aws:iam::") {
					t.Errorf("Invalid IAM role ARN format: %s", roleArn)
				}
			}
		}
	})
}

// Test network security and routing
func TestNetworkSecurity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("InternetGatewayConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Check for Internet Gateway
		igwOutput, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		if err != nil {
			t.Errorf("failed to describe internet gateways: %v", err)
		} else {
			if len(igwOutput.InternetGateways) == 0 {
				t.Error("Expected Internet Gateway to be attached to VPC")
			}
		}
	})

	t.Run("NATGatewayConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Check for NAT Gateways in public subnets
		publicSubnets := strings.Split(outputs.PublicSubnetIds, ",")
		for _, subnetId := range publicSubnets {
			subnetId = strings.TrimSpace(subnetId)
			natOutput, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
				Filter: []ec2types.Filter{
					{
						Name:   aws.String("subnet-id"),
						Values: []string{subnetId},
					},
				},
			})
			if err != nil {
				t.Errorf("failed to describe NAT gateways: %v", err)
			} else {
				if len(natOutput.NatGateways) > 0 {
					for _, natGw := range natOutput.NatGateways {
						if natGw.State != "available" {
							t.Errorf("Expected NAT Gateway state to be available, got %s", natGw.State)
						}
					}
				}
			}
		}
	})

	t.Run("RouteTableConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Check route tables for subnets
		routeTablesOutput, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		if err != nil {
			t.Errorf("failed to describe route tables: %v", err)
		} else {
			if len(routeTablesOutput.RouteTables) == 0 {
				t.Error("Expected route tables to exist for VPC")
			}
		}
	})
}

// Test S3 bucket policies and CloudTrail integration
func TestS3SecurityPolicies(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("S3BucketPolicy", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket policy exists
		bucketPolicy, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Logf("Bucket policy may not be configured: %v", err)
		} else {
			if bucketPolicy.Policy == nil {
				t.Log("Bucket policy may not be configured")
			} else {
				policyDoc := *bucketPolicy.Policy
				if !strings.Contains(policyDoc, "aws:SecureTransport") {
					t.Log("Bucket policy may not enforce HTTPS")
				}
			}
		}
	})

	t.Run("S3BucketNotification", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket notifications
		_, err := s3Client.GetBucketNotificationConfiguration(ctx, &s3.GetBucketNotificationConfigurationInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Logf("Bucket notification configuration may not be set: %v", err)
		} else {
			t.Log("Bucket notification configuration retrieved successfully")
		}
	})
}

// Test KMS key rotation and aliases
func TestKMSKeyManagement(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("KMSKeyRotation", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		// Check key rotation status
		rotationOutput, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: aws.String(outputs.KMSKeyId),
		})
		if err != nil {
			t.Errorf("failed to get key rotation status: %v", err)
		} else {
			if !rotationOutput.KeyRotationEnabled {
				t.Log("KMS key rotation is not enabled")
			}
		}
	})

	t.Run("KMSKeyAliases", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)

		// List aliases for the key
		aliasesOutput, err := kmsClient.ListAliases(ctx, &kms.ListAliasesInput{
			KeyId: aws.String(outputs.KMSKeyId),
		})
		if err != nil {
			t.Errorf("failed to list key aliases: %v", err)
		} else {
			if len(aliasesOutput.Aliases) == 0 {
				t.Log("KMS key has no aliases configured")
			}
		}
	})
}
