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
	BastionInstanceId  string `json:"bastion_instance_id"`
	WebServer1Id       string `json:"web_server_1_id"`
	WebServer2Id       string `json:"web_server_2_id"`
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

	// Test EC2 instances exist
	t.Run("EC2InstancesExist", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Test bastion host
		bastionOutput, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.BastionInstanceId},
		})
		if err != nil {
			t.Errorf("failed to describe bastion instance: %v", err)
		} else {
			if len(bastionOutput.Reservations) == 0 || len(bastionOutput.Reservations[0].Instances) == 0 {
				t.Error("Bastion instance should exist")
			}
		}

		// Test web servers
		webServerIds := []string{outputs.WebServer1Id, outputs.WebServer2Id}
		for i, instanceId := range webServerIds {
			webOutput, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
				InstanceIds: []string{instanceId},
			})
			if err != nil {
				t.Errorf("failed to describe web server %d: %v", i+1, err)
			} else {
				if len(webOutput.Reservations) == 0 || len(webOutput.Reservations[0].Instances) == 0 {
					t.Errorf("Web server %d should exist", i+1)
				}
			}
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

	// Test Lambda Function exists
	t.Run("LambdaFunctionConfiguration", func(t *testing.T) {
		lambdaClient := lambda.NewFromConfig(cfg)

		functionOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		if err != nil {
			t.Errorf("failed to get Lambda function: %v", err)
		} else {
			if functionOutput.Configuration == nil {
				t.Error("Lambda function configuration should not be nil")
			}
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

// Test CloudWatch alarms for EC2 instances
func TestCloudWatchAlarmsConfiguration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("EC2CPUUtilizationAlarms", func(t *testing.T) {
		cloudwatchClient := cloudwatch.NewFromConfig(cfg)

		instanceIds := []string{outputs.BastionInstanceId, outputs.WebServer1Id, outputs.WebServer2Id}

		alarmsOutput, err := cloudwatchClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{})
		if err != nil {
			t.Errorf("failed to describe CloudWatch alarms: %v", err)
			return
		}

		cpuAlarmsFound := 0
		for _, alarm := range alarmsOutput.MetricAlarms {
			if alarm.MetricName != nil && *alarm.MetricName == "CPUUtilization" {
				if alarm.Namespace != nil && *alarm.Namespace == "AWS/EC2" {
					for _, dimension := range alarm.Dimensions {
						if dimension.Name != nil && *dimension.Name == "InstanceId" {
							for _, instanceId := range instanceIds {
								if dimension.Value != nil && *dimension.Value == instanceId {
									cpuAlarmsFound++
								}
							}
						}
					}
				}
			}
		}

		if cpuAlarmsFound == 0 {
			t.Error("Expected CPU utilization alarms for EC2 instances")
		}
	})
}

// Test bastion host security
func TestBastionHostSecurity(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("BastionSSHRestriction", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Get bastion instance security groups
		bastionOutput, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.BastionInstanceId},
		})
		if err != nil {
			t.Errorf("failed to describe bastion instance: %v", err)
			return
		}

		if len(bastionOutput.Reservations) == 0 || len(bastionOutput.Reservations[0].Instances) == 0 {
			t.Error("Bastion instance not found")
			return
		}

		bastionInstance := bastionOutput.Reservations[0].Instances[0]
		bastionSecurityGroups := make([]string, 0)
		for _, sg := range bastionInstance.SecurityGroups {
			bastionSecurityGroups = append(bastionSecurityGroups, *sg.GroupId)
		}

		// Check security group rules
		sgOutput, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: bastionSecurityGroups,
		})
		if err != nil {
			t.Errorf("failed to describe security groups: %v", err)
			return
		}

		for _, sg := range sgOutput.SecurityGroups {
			for _, rule := range sg.IpPermissions {
				if rule.FromPort != nil && *rule.FromPort == 22 {
					for _, ipRange := range rule.IpRanges {
						if ipRange.CidrIp != nil && *ipRange.CidrIp == "0.0.0.0/0" {
							t.Error("Bastion host SSH access should not allow 0.0.0.0/0 - should be restricted to specific IP ranges")
						}
					}
				}
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
			"BastionInstanceId":  outputs.BastionInstanceId,
			"WebServer1Id":       outputs.WebServer1Id,
			"WebServer2Id":       outputs.WebServer2Id,
		}

		for outputName, outputValue := range requiredOutputs {
			if outputValue == "" {
				t.Errorf("Output %s is empty", outputName)
			}
		}
	})
}
