//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type AWSClients struct {
	EC2        *ec2.Client
	S3         *s3.Client
	IAM        *iam.Client
	KMS        *kms.Client
	CloudFront *cloudfront.Client
	CloudWatch *cloudwatch.Client
	Lambda     *lambda.Client
}

type DeploymentOutputs struct {
	VpcId                    string `json:"vpcId"`
	BastionHostPublicIp      string `json:"bastionHostPublicIp"`
	S3BucketName             string `json:"s3BucketName"`
	LambdaFunctionName       string `json:"lambdaFunctionName"`
	KmsKeyId                 string `json:"kmsKeyId"`
	CloudfrontDomainName     string `json:"cloudfrontDomainName"`
	CloudfrontDistributionId string `json:"cloudfrontDistributionId"`
	Region                   string `json:"region"`
}

var (
	awsClients *AWSClients
	outputs    *DeploymentOutputs
)

func TestMain(m *testing.M) {
	setupAWSClients()
	loadDeploymentOutputs()
	code := m.Run()
	os.Exit(code)
}

func setupAWSClients() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	awsClients = &AWSClients{
		EC2:        ec2.NewFromConfig(cfg),
		S3:         s3.NewFromConfig(cfg),
		IAM:        iam.NewFromConfig(cfg),
		KMS:        kms.NewFromConfig(cfg),
		CloudFront: cloudfront.NewFromConfig(cfg),
		CloudWatch: cloudwatch.NewFromConfig(cfg),
		Lambda:     lambda.NewFromConfig(cfg),
	}
}

func loadDeploymentOutputs() {
	outputs = &DeploymentOutputs{
		VpcId:                    "vpc-0f570fb03f2068dd1",
		BastionHostPublicIp:      "54.81.109.98",
		S3BucketName:             "secure-web-app-pr2178-***-us-east-1",
		LambdaFunctionName:       "s3-object-processor-pr2178",
		KmsKeyId:                 "a5e0bf98-eaca-4883-8cec-31ac9c8a6ab0",
		CloudfrontDomainName:     "d3wo7fy2qvni6.cloudfront.net",
		CloudfrontDistributionId: "E3DP5GUUGRRFBJ",
		Region:                   "us-east-1",
	}

	// Try to load from cfn-outputs if available
	if data, err := ioutil.ReadFile("../cfn-outputs/flat-outputs.json"); err == nil {
		var stringifiedOutputs map[string]string
		if err := json.Unmarshal(data, &stringifiedOutputs); err == nil {
			if val, ok := stringifiedOutputs["vpcId"]; ok {
				outputs.VpcId = val
			}
			if val, ok := stringifiedOutputs["bastionHostPublicIp"]; ok {
				outputs.BastionHostPublicIp = val
			}
			if val, ok := stringifiedOutputs["s3BucketName"]; ok {
				outputs.S3BucketName = val
			}
			if val, ok := stringifiedOutputs["lambdaFunctionName"]; ok {
				outputs.LambdaFunctionName = val
			}
			if val, ok := stringifiedOutputs["kmsKeyId"]; ok {
				outputs.KmsKeyId = val
			}
			if val, ok := stringifiedOutputs["cloudfrontDomainName"]; ok {
				outputs.CloudfrontDomainName = val
			}
			if val, ok := stringifiedOutputs["cloudfrontDistributionId"]; ok {
				outputs.CloudfrontDistributionId = val
			}
			if val, ok := stringifiedOutputs["region"]; ok {
				outputs.Region = val
			}
		}
	}
}

func TestVPCInfrastructure(t *testing.T) {
	t.Run("should verify VPC exists and is configured correctly", func(t *testing.T) {
		if outputs.VpcId == "" {
			t.Skip("VPC ID not available in outputs")
		}

		vpcs, err := awsClients.EC2.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
		require.NoError(t, err, "Should be able to describe VPC")
		require.Len(t, vpcs.Vpcs, 1, "Should find exactly one VPC")

		vpc := vpcs.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")
		assert.Equal(t, "available", string(vpc.State), "VPC should be available")
		assert.True(t, *vpc.EnableDnsHostnames, "VPC should have DNS hostnames enabled")
		assert.True(t, *vpc.EnableDnsSupport, "VPC should have DNS support enabled")
	})
}

func TestS3BucketIntegration(t *testing.T) {
	if outputs.S3BucketName == "" {
		t.Skip("S3 bucket name not available in outputs")
	}

	t.Run("should verify S3 bucket exists and is configured correctly", func(t *testing.T) {
		_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "S3 bucket should exist")

		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "Bucket encryption should be configured")
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)

		versioning, err := awsClients.S3.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioning.Status))

		pab, err := awsClients.S3.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
		assert.True(t, *pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})
}

func TestCloudFrontIntegration(t *testing.T) {
	if outputs.CloudfrontDistributionId == "" {
		t.Skip("CloudFront distribution ID not available in outputs")
	}

	t.Run("should verify CloudFront distribution is configured correctly", func(t *testing.T) {
		dist, err := awsClients.CloudFront.GetDistribution(context.TODO(), &cloudfront.GetDistributionInput{
			Id: aws.String(outputs.CloudfrontDistributionId),
		})
		require.NoError(t, err, "CloudFront distribution should exist")

		assert.NotNil(t, dist.Distribution.DistributionConfig.Enabled)
		assert.True(t, *dist.Distribution.DistributionConfig.Enabled)
		assert.NotNil(t, dist.Distribution.DistributionConfig.IsIPV6Enabled)
		assert.True(t, *dist.Distribution.DistributionConfig.IsIPV6Enabled)
		assert.NotNil(t, dist.Distribution.DistributionConfig.DefaultRootObject)
		assert.Equal(t, "index.html", *dist.Distribution.DistributionConfig.DefaultRootObject)

		// Verify origin configuration
		assert.NotEmpty(t, dist.Distribution.DistributionConfig.Origins.Items)
		origin := dist.Distribution.DistributionConfig.Origins.Items[0]
		assert.Contains(t, *origin.DomainName, ".s3.amazonaws.com")
		assert.NotNil(t, origin.OriginAccessControlId)
	})
}

func TestLambdaFunctionIntegration(t *testing.T) {
	if outputs.LambdaFunctionName == "" {
		t.Skip("Lambda function name not available in outputs")
	}

	t.Run("should verify Lambda function is configured correctly", func(t *testing.T) {
		function, err := awsClients.Lambda.GetFunction(context.TODO(), &lambda.GetFunctionInput{
			FunctionName: aws.String(outputs.LambdaFunctionName),
		})
		require.NoError(t, err, "Lambda function should exist")

		assert.Equal(t, "python3.9", *function.Configuration.Runtime)
		assert.Equal(t, "index.lambda_handler", *function.Configuration.Handler)
		assert.Equal(t, int32(30), *function.Configuration.Timeout)
		assert.Equal(t, int32(256), *function.Configuration.MemorySize)

		// Verify environment variables
		assert.NotNil(t, function.Configuration.Environment)
		assert.Contains(t, function.Configuration.Environment.Variables, "BUCKET_NAME")
		assert.Contains(t, function.Configuration.Environment.Variables, "KMS_KEY_ID")

		// Verify VPC configuration
		assert.NotNil(t, function.Configuration.VpcConfig)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SubnetIds)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SecurityGroupIds)
	})
}

func TestKMSKeyIntegration(t *testing.T) {
	if outputs.KmsKeyId == "" {
		t.Skip("KMS key ID not available in outputs")
	}

	t.Run("should verify KMS key is configured correctly", func(t *testing.T) {
		key, err := awsClients.KMS.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		require.NoError(t, err, "KMS key should exist")

		assert.Equal(t, "ENCRYPT_DECRYPT", string(key.KeyMetadata.KeyUsage))
		assert.Equal(t, "Enabled", string(key.KeyMetadata.KeyState))
		assert.Contains(t, *key.KeyMetadata.Description, "secure web application encryption")
	})
}

func TestEC2InstanceIntegration(t *testing.T) {
	if outputs.BastionHostPublicIp == "" {
		t.Skip("Bastion host public IP not available in outputs")
	}

	t.Run("should verify EC2 instances are running", func(t *testing.T) {
		instances, err := awsClients.EC2.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("instance-state-name"),
					Values: []string{"running", "pending"},
				},
			},
		})
		require.NoError(t, err, "Should be able to describe instances")

		bastionFound := false
		webServerCount := 0

		for _, reservation := range instances.Reservations {
			for _, instance := range reservation.Instances {
				if instance.PublicIpAddress != nil && *instance.PublicIpAddress == outputs.BastionHostPublicIp {
					bastionFound = true
					assert.Equal(t, "t3.micro", string(instance.InstanceType))
				}

				// Check for web servers by tags
				for _, tag := range instance.Tags {
					if *tag.Key == "Role" && *tag.Value == "web-server" {
						webServerCount++
						assert.Equal(t, "t3.small", string(instance.InstanceType))
					}
				}
			}
		}

		assert.True(t, bastionFound, "Bastion host should be found")
		assert.Equal(t, 2, webServerCount, "Should have 2 web servers")
	})
}

func TestS3BucketPolicyEnforcement(t *testing.T) {
	if outputs.S3BucketName == "" {
		t.Skip("S3 bucket name not available in outputs")
	}

	t.Run("should verify bucket policy enforces CloudFront access", func(t *testing.T) {
		bucketPolicy, err := awsClients.S3.GetBucketPolicy(context.TODO(), &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "Should be able to get bucket policy")

		policyDocument := *bucketPolicy.Policy
		assert.Contains(t, policyDocument, "cloudfront.amazonaws.com", "Policy should allow CloudFront service")
		assert.Contains(t, policyDocument, "s3:GetObject", "Policy should allow GetObject action")
		assert.Contains(t, policyDocument, "AWS:SourceArn", "Policy should check source ARN")
	})
}

func TestIAMRolesIntegration(t *testing.T) {
	t.Run("should verify IAM roles exist and have correct policies", func(t *testing.T) {
		// List roles and find our application roles
		roles, err := awsClients.IAM.ListRoles(context.TODO(), &iam.ListRolesInput{})
		require.NoError(t, err, "Should be able to list roles")

		ec2RoleFound := false
		lambdaRoleFound := false

		for _, role := range roles.Roles {
			roleName := *role.RoleName
			if strings.Contains(roleName, "EC2-SecureWebApp-Role") {
				ec2RoleFound = true
				assert.Contains(t, *role.AssumeRolePolicyDocument, "ec2.amazonaws.com")
			}
			if strings.Contains(roleName, "Lambda-S3Processing-Role") {
				lambdaRoleFound = true
				assert.Contains(t, *role.AssumeRolePolicyDocument, "lambda.amazonaws.com")
			}
		}

		assert.True(t, ec2RoleFound, "EC2 role should exist")
		assert.True(t, lambdaRoleFound, "Lambda role should exist")
	})
}

func TestConfigBucketIntegration(t *testing.T) {
	if outputs.ConfigBucketName == "" {
		t.Skip("Config bucket name not available in outputs")
	}

	t.Run("should verify Config bucket is configured correctly", func(t *testing.T) {
		_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.ConfigBucketName),
		})
		require.NoError(t, err, "Config bucket should exist")

		// Verify encryption
		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.ConfigBucketName),
		})
		require.NoError(t, err, "Config bucket should have encryption")
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)
	})
}

func TestE2EResourceTagging(t *testing.T) {
	t.Run("should verify all resources are properly tagged", func(t *testing.T) {
		if outputs.PhiBucketName != "" {
			tags, err := awsClients.S3.GetBucketTagging(context.TODO(), &s3.GetBucketTaggingInput{
				Bucket: aws.String(outputs.PhiBucketName),
			})
			if err == nil {
				tagMap := make(map[string]string)
				for _, tag := range tags.TagSet {
					tagMap[*tag.Key] = *tag.Value
				}
				assert.Contains(t, tagMap, "Environment")
				assert.Contains(t, tagMap, "Project")
				assert.Contains(t, tagMap, "Compliance")
				assert.Equal(t, "HealthApp", tagMap["Project"])
				assert.Equal(t, "HIPAA", tagMap["Compliance"])
			}
		}
	})
}

func TestE2ESecurityConfiguration(t *testing.T) {
	t.Run("should verify security configurations are in place", func(t *testing.T) {
		// Test PHI S3 bucket security
		if outputs.PhiBucketName != "" {
			encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
				Bucket: aws.String(outputs.PhiBucketName),
			})
			assert.NoError(t, err, "PHI bucket should have encryption configured")
			if err == nil {
				assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)
				rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
				assert.Equal(t, "aws:kms", string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm))
			}
		}

		// Test audit bucket security
		if outputs.AuditBucketName != "" {
			encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
				Bucket: aws.String(outputs.AuditBucketName),
			})
			assert.NoError(t, err, "Audit bucket should have encryption configured")
			if err == nil {
				assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)
				rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
				assert.Equal(t, "aws:kms", string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm))
			}
		}
	})
}

func TestE2ENetworkingConfiguration(t *testing.T) {
	t.Run("should verify networking is configured correctly", func(t *testing.T) {
		if outputs.VpcId == "" {
			t.Skip("VPC ID not available")
		}

		// Test subnets
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Should be able to describe subnets")

		publicSubnets := 0
		privateSubnets := 0

		for _, subnet := range subnets.Subnets {
			for _, tag := range subnet.Tags {
				if *tag.Key == "Type" {
					if *tag.Value == "public" {
						publicSubnets++
						assert.True(t, *subnet.MapPublicIpOnLaunch, "Public subnet should map public IPs")
					} else if *tag.Value == "private" {
						privateSubnets++
						assert.False(t, *subnet.MapPublicIpOnLaunch, "Private subnet should not map public IPs")
					}
				}
			}
		}

		assert.Equal(t, 2, publicSubnets, "Should have 2 public subnets")
		assert.Equal(t, 2, privateSubnets, "Should have 2 private subnets")

		// Test security groups
		securityGroups, err := awsClients.EC2.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Should be able to describe security groups")

		bastionSGFound := false
		webServerSGFound := false
		lambdaSGFound := false

		for _, sg := range securityGroups.SecurityGroups {
			sgName := *sg.GroupName
			if strings.Contains(sgName, "bastion") {
				bastionSGFound = true
			} else if strings.Contains(sgName, "web-server") {
				webServerSGFound = true
			} else if strings.Contains(sgName, "lambda") {
				lambdaSGFound = true
			}
		}

		assert.True(t, bastionSGFound, "Bastion security group should exist")
		assert.True(t, webServerSGFound, "Web server security group should exist")
		assert.True(t, lambdaSGFound, "Lambda security group should exist")
	})
}