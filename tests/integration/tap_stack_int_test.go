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
	KMSKeyId               string `json:"kms_key_id"`
	LambdaFunctionName     string `json:"lambda_function_name"`
	LambdaFunctionArn      string `json:"lambda_function_arn"`
	PrivateSubnetIds       string `json:"private_subnet_ids"`
	PublicSubnetIds        string `json:"public_subnet_ids"`
	PublicSubnet1Id        string `json:"public_subnet_1_id"`
	PublicSubnet2Id        string `json:"public_subnet_2_id"`
	S3BucketName           string `json:"s3_bucket_name"`
	VPCId                  string `json:"vpc_id"`
	BastionInstanceId      string `json:"bastion_instance_id"`
	WebServer1Id           string `json:"web_server_1_id"`
	WebServer2Id           string `json:"web_server_2_id"`
	BastionSecurityGroupId string `json:"bastion_security_group_id"`
	LambdaSecurityGroupId  string `json:"lambda_security_group_id"`
	NatGateway1Id          string `json:"nat_gateway_1_id"`
	NatGateway2Id          string `json:"nat_gateway_2_id"`
	InternetGatewayId      string `json:"internet_gateway_id"`
}

type AWSClients struct {
	EC2        *ec2.Client
	S3         *s3.Client
	Lambda     *lambda.Client
	KMS        *kms.Client
	CloudWatch *cloudwatch.Client
}

func loadOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/all-outputs.json")
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

		if val, ok := stackOutputs["kms_key_id"].(string); ok {
			outputs.KMSKeyId = val
		}
		if val, ok := stackOutputs["s3_bucket_name"].(string); ok {
			outputs.S3BucketName = val
		}
		if val, ok := stackOutputs["vpc_id"].(string); ok {
			outputs.VPCId = val
		}
		if val, ok := stackOutputs["lambda_function_name"].(string); ok {
			outputs.LambdaFunctionName = val
		}
		if val, ok := stackOutputs["bastion_instance_id"].(string); ok {
			outputs.BastionInstanceId = val
		}
		if val, ok := stackOutputs["web_server_1_id"].(string); ok {
			outputs.WebServer1Id = val
		}
		if val, ok := stackOutputs["web_server_2_id"].(string); ok {
			outputs.WebServer2Id = val
		}

		// Handle comma-separated subnet IDs
		if privateSubnetsStr, ok := stackOutputs["private_subnet_ids"].(string); ok {
			outputs.PrivateSubnetIds = privateSubnetsStr
		}
		if publicSubnetsStr, ok := stackOutputs["public_subnet_ids"].(string); ok {
			outputs.PublicSubnetIds = publicSubnetsStr
			// Split comma-separated values for individual subnet IDs
			if subnets := strings.Split(publicSubnetsStr, ","); len(subnets) >= 2 {
				outputs.PublicSubnet1Id = subnets[0]
				outputs.PublicSubnet2Id = subnets[1]
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

func TestSecurityGroupsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("should verify bastion security group", func(t *testing.T) {
		if outputs.BastionSecurityGroupId == "" {
			t.Skip("Bastion security group ID not available")
		}

		sg, err := awsClients.EC2.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.BastionSecurityGroupId},
		})
		require.NoError(t, err)
		require.Len(t, sg.SecurityGroups, 1)

		bastionSg := sg.SecurityGroups[0]
		assert.Equal(t, outputs.VPCId, *bastionSg.VpcId)
		assert.NotEmpty(t, bastionSg.IpPermissions)
	})

	t.Run("should verify lambda security group", func(t *testing.T) {
		if outputs.LambdaSecurityGroupId == "" {
			t.Skip("Lambda security group ID not available")
		}

		sg, err := awsClients.EC2.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.LambdaSecurityGroupId},
		})
		require.NoError(t, err)
		require.Len(t, sg.SecurityGroups, 1)

		lambdaSg := sg.SecurityGroups[0]
		assert.Equal(t, outputs.VPCId, *lambdaSg.VpcId)
	})
}

func TestLambdaFunctionIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	if outputs.LambdaFunctionArn == "" {
		t.Skip("Lambda function ARN not available")
	}

	t.Run("should verify Lambda function configuration", func(t *testing.T) {
		functionName := extractFunctionNameFromArn(outputs.LambdaFunctionArn)
		function, err := awsClients.Lambda.GetFunction(context.TODO(), &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		assert.Equal(t, "python3.9", string(function.Configuration.Runtime))
		assert.Equal(t, int32(30), *function.Configuration.Timeout)
		assert.Equal(t, int32(256), *function.Configuration.MemorySize)
		assert.NotNil(t, function.Configuration.Environment)
		assert.Contains(t, function.Configuration.Environment.Variables, "BUCKET_NAME")
		assert.Contains(t, function.Configuration.Environment.Variables, "KMS_KEY_ID")
	})
}

func TestNATGatewaysIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	if outputs.NatGateway1Id == "" || outputs.NatGateway2Id == "" {
		t.Skip("NAT Gateway IDs not available")
	}

	t.Run("should verify NAT gateways exist", func(t *testing.T) {
		natGws, err := awsClients.EC2.DescribeNatGateways(context.TODO(), &ec2.DescribeNatGatewaysInput{
			NatGatewayIds: []string{outputs.NatGateway1Id, outputs.NatGateway2Id},
		})
		require.NoError(t, err)
		require.Len(t, natGws.NatGateways, 2)

		for _, natGw := range natGws.NatGateways {
			assert.Equal(t, "available", string(natGw.State))
			assert.NotEmpty(t, natGw.NatGatewayAddresses)
		}
	})
}

func TestInternetGatewayIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	if outputs.InternetGatewayId == "" {
		t.Skip("Internet Gateway ID not available")
	}

	t.Run("should verify internet gateway is attached to VPC", func(t *testing.T) {
		igws, err := awsClients.EC2.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
			InternetGatewayIds: []string{outputs.InternetGatewayId},
		})
		require.NoError(t, err)
		require.Len(t, igws.InternetGateways, 1)

		igw := igws.InternetGateways[0]
		require.NotEmpty(t, igw.Attachments)
		assert.Equal(t, outputs.VPCId, *igw.Attachments[0].VpcId)
		assert.Equal(t, "available", string(igw.Attachments[0].State))
	})
}

func TestCloudWatchAlarmsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("should verify CloudWatch alarms exist", func(t *testing.T) {
		alarms, err := awsClients.CloudWatch.DescribeAlarms(context.TODO(), &cloudwatch.DescribeAlarmsInput{
			AlarmNamePrefix: aws.String("healthapp"),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, alarms.MetricAlarms)

		lambdaErrorAlarmFound := false
		s3UnauthorizedAlarmFound := false

		for _, alarm := range alarms.MetricAlarms {
			if strings.Contains(*alarm.AlarmName, "lambda-errors") {
				lambdaErrorAlarmFound = true
				assert.Equal(t, "AWS/Lambda", *alarm.Namespace)
				assert.Equal(t, "Errors", *alarm.MetricName)
			}
			if strings.Contains(*alarm.AlarmName, "s3-unauthorized") {
				s3UnauthorizedAlarmFound = true
				assert.Equal(t, "AWS/S3", *alarm.Namespace)
				assert.Equal(t, "4xxErrors", *alarm.MetricName)
			}
		}

		assert.True(t, lambdaErrorAlarmFound, "Lambda error alarm should exist")
		assert.True(t, s3UnauthorizedAlarmFound, "S3 unauthorized access alarm should exist")
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

func TestE2ELambdaVPCIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	if outputs.LambdaFunctionArn == "" {
		t.Skip("Lambda function ARN not available")
	}

	t.Run("e2e: should deploy Lambda in VPC with proper security", func(t *testing.T) {
		functionName := extractFunctionNameFromArn(outputs.LambdaFunctionArn)
		function, err := awsClients.Lambda.GetFunction(context.TODO(), &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		assert.NotNil(t, function.Configuration.VpcConfig)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SubnetIds)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SecurityGroupIds)
		assert.Equal(t, outputs.VPCId, *function.Configuration.VpcConfig.VpcId)
	})
}
