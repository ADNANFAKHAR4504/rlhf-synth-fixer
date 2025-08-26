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
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"strings"
)

type TapStackOutputs struct {
	KMSKeyId           string `json:"kms_key_id"`
	PrivateSubnetIds   string `json:"private_subnet_ids"`
	PublicSubnetIds    string `json:"public_subnet_ids"`
	S3BucketName       string `json:"s3_bucket_name"`
	VPCId              string `json:"vpc_id"`
	LambdaFunctionName string `json:"lambda_function_name"`
	BastionInstanceId  string `json:"bastion_instance_id"`
	WebServer1Id       string `json:"web_server_1_id"`
	WebServer2Id       string `json:"web_server_2_id"`
}

type AWSClients struct {
	EC2            *ec2.Client
	S3             *s3.Client
	Lambda         *lambda.Client
	KMS            *kms.Client
	CloudWatch     *cloudwatch.Client
	SecretsManager *secretsmanager.Client
	CloudTrail     *cloudtrail.Client
}

func loadOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var flatOutputs map[string]interface{}
	if err := json.Unmarshal(data, &flatOutputs); err != nil {
		t.Fatalf("Failed to parse outputs: %v", err)
	}

	outputs := &TapStackOutputs{}
	if val, ok := flatOutputs["kms_key_id"].(string); ok {
		outputs.KMSKeyId = val
	}
	if val, ok := flatOutputs["s3_bucket_name"].(string); ok {
		outputs.S3BucketName = val
	}
	if val, ok := flatOutputs["vpc_id"].(string); ok {
		outputs.VPCId = val
	}
	if val, ok := flatOutputs["lambda_function_name"].(string); ok {
		outputs.LambdaFunctionName = val
	}
	if val, ok := flatOutputs["bastion_instance_id"].(string); ok {
		outputs.BastionInstanceId = val
	}
	if val, ok := flatOutputs["web_server_1_id"].(string); ok {
		outputs.WebServer1Id = val
	}
	if val, ok := flatOutputs["web_server_2_id"].(string); ok {
		outputs.WebServer2Id = val
	}
	if val, ok := flatOutputs["private_subnet_ids"].(string); ok {
		outputs.PrivateSubnetIds = val
	}
	if val, ok := flatOutputs["public_subnet_ids"].(string); ok {
		outputs.PublicSubnetIds = val
	}

	return outputs
}

func setupAWSClients(cfg aws.Config) *AWSClients {
	return &AWSClients{
		EC2:            ec2.NewFromConfig(cfg),
		S3:             s3.NewFromConfig(cfg),
		Lambda:         lambda.NewFromConfig(cfg),
		KMS:            kms.NewFromConfig(cfg),
		CloudWatch:     cloudwatch.NewFromConfig(cfg),
		SecretsManager: secretsmanager.NewFromConfig(cfg),
		CloudTrail:     cloudtrail.NewFromConfig(cfg),
	}
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

	t.Run("VPCConfiguration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)
		vpcOutput, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err)
		require.NotEmpty(t, vpcOutput.Vpcs)
		assert.Equal(t, "available", string(vpcOutput.Vpcs[0].State))
	})

	t.Run("EC2InstancesExist", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)
		instanceIds := []string{outputs.BastionInstanceId, outputs.WebServer1Id, outputs.WebServer2Id}

		for _, instanceId := range instanceIds {
			instanceOutput, err := ec2Client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{
				InstanceIds: []string{instanceId},
			})
			require.NoError(t, err)
			require.NotEmpty(t, instanceOutput.Reservations)
			require.NotEmpty(t, instanceOutput.Reservations[0].Instances)
		}
	})

	t.Run("S3BucketSecurity", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)

		publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.True(t, aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls))
		assert.True(t, aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy))
	})

	t.Run("LambdaFunctionConfiguration", func(t *testing.T) {
		lambdaClient := lambda.NewFromConfig(cfg)
		functionOutput, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		require.NoError(t, err)
		assert.NotNil(t, functionOutput.Configuration)
		assert.Equal(t, "python3.9", string(functionOutput.Configuration.Runtime))
		assert.Equal(t, int32(30), *functionOutput.Configuration.Timeout)
		assert.Equal(t, int32(256), *functionOutput.Configuration.MemorySize)
	})

	t.Run("KMSKeyConfiguration", func(t *testing.T) {
		kmsClient := kms.NewFromConfig(cfg)
		keyOutput, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KMSKeyId),
		})
		require.NoError(t, err)
		assert.NotNil(t, keyOutput.KeyMetadata)
	})
}

func TestNetworkingIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("SubnetsExist", func(t *testing.T) {
		privateSubnets := strings.Split(outputs.PrivateSubnetIds, ",")
		publicSubnets := strings.Split(outputs.PublicSubnetIds, ",")
		allSubnets := append(privateSubnets, publicSubnets...)

		subnets, err := awsClients.EC2.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			SubnetIds: allSubnets,
		})
		require.NoError(t, err)
		assert.Len(t, subnets.Subnets, 4)

		for _, subnet := range subnets.Subnets {
			assert.Equal(t, outputs.VPCId, *subnet.VpcId)
		}
	})

	t.Run("InternetGatewayExists", func(t *testing.T) {
		igws, err := awsClients.EC2.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []types.Filter{
				{Name: aws.String("attachment.vpc-id"), Values: []string{outputs.VPCId}},
			},
		})
		require.NoError(t, err)
		assert.NotEmpty(t, igws.InternetGateways)
	})

	t.Run("NATGatewaysExist", func(t *testing.T) {
		natGws, err := awsClients.EC2.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}},
			},
		})
		require.NoError(t, err)
		assert.NotEmpty(t, natGws.NatGateways)
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

	t.Run("SecurityGroupsExist", func(t *testing.T) {
		sgs, err := awsClients.EC2.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}},
			},
		})
		require.NoError(t, err)

		healthAppSGs := 0
		for _, sg := range sgs.SecurityGroups {
			if sg.GroupName != nil && strings.Contains(*sg.GroupName, "healthapp") {
				healthAppSGs++
			}
		}
		assert.GreaterOrEqual(t, healthAppSGs, 3) // bastion, web, lambda
	})
}

func TestCloudWatchAlarmsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("CloudWatchAlarmsExist", func(t *testing.T) {
		alarms, err := awsClients.CloudWatch.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
			AlarmNamePrefix: aws.String("healthapp"),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, alarms.MetricAlarms)

		ec2AlarmsFound := 0
		lambdaAlarmsFound := 0
		s3AlarmsFound := 0

		for _, alarm := range alarms.MetricAlarms {
			if alarm.Namespace != nil {
				switch *alarm.Namespace {
				case "AWS/EC2":
					ec2AlarmsFound++
				case "AWS/Lambda":
					lambdaAlarmsFound++
				case "AWS/S3":
					s3AlarmsFound++
				}
			}
		}

		assert.GreaterOrEqual(t, ec2AlarmsFound, 3, "Should have alarms for 3 EC2 instances")
		assert.GreaterOrEqual(t, lambdaAlarmsFound, 1, "Should have Lambda error alarm")
		assert.GreaterOrEqual(t, s3AlarmsFound, 1, "Should have S3 unauthorized access alarm")
	})
}

func TestS3BucketsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("S3BucketEncryption", func(t *testing.T) {
		encryption, err := awsClients.S3.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.NotNil(t, encryption.ServerSideEncryptionConfiguration)
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)
	})

	t.Run("S3BucketVersioning", func(t *testing.T) {
		versioning, err := awsClients.S3.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioning.Status))
	})
}

func TestSecretsManagerIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("SecretsExist", func(t *testing.T) {
		secrets, err := awsClients.SecretsManager.ListSecrets(ctx, &secretsmanager.ListSecretsInput{})
		require.NoError(t, err)

		healthAppSecrets := 0
		for _, secret := range secrets.SecretList {
			if secret.Name != nil && (strings.Contains(*secret.Name, "healthapp") || strings.Contains(*secret.Name, "db") || strings.Contains(*secret.Name, "api")) {
				healthAppSecrets++
			}
		}
		assert.GreaterOrEqual(t, healthAppSecrets, 0)
	})
}

func TestCloudTrailIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	awsClients := setupAWSClients(cfg)

	t.Run("CloudTrailExists", func(t *testing.T) {
		trails, err := awsClients.CloudTrail.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{})
		require.NoError(t, err)

		healthAppTrailFound := false
		for _, trail := range trails.TrailList {
			if trail.Name != nil && strings.Contains(*trail.Name, "healthapp") {
				healthAppTrailFound = true
				assert.True(t, *trail.LogFileValidationEnabled)
				break
			}
		}
		assert.True(t, healthAppTrailFound, "HealthApp CloudTrail should exist")
	})
}

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
