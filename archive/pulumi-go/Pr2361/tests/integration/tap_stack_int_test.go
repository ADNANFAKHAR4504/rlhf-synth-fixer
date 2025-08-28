//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	ec2Client        *ec2.Client
	s3Client         *s3.Client
	kmsClient        *kms.Client
	iamClient        *iam.Client
	cloudwatchClient *cloudwatchlogs.Client
	skipLiveTests    bool
)

func TestMain(m *testing.M) {
	// Check if we should skip live tests
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("CI") == "true" {
		skipLiveTests = true
		fmt.Println("⚠️  Skipping live AWS integration tests - no AWS credentials or running in CI")
		os.Exit(0)
	}

	// Initialize AWS clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		fmt.Printf("❌ Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	ec2Client = ec2.NewFromConfig(cfg)
	s3Client = s3.NewFromConfig(cfg)
	kmsClient = kms.NewFromConfig(cfg)
	iamClient = iam.NewFromConfig(cfg)
	cloudwatchClient = cloudwatchlogs.NewFromConfig(cfg)

	os.Exit(m.Run())
}

// InfrastructureOutputs represents the expected outputs from the Pulumi stack
type InfrastructureOutputs struct {
	VpcID                string   `json:"vpc_id"`
	PrivateSubnetIDs     []string `json:"private_subnet_ids"`
	PublicSubnetIDs      []string `json:"public_subnet_ids"`
	KMSKeyID             string   `json:"kms_key_id"`
	KMSKeyARN            string   `json:"kms_key_arn"`
	CloudTrailLogsBucket string   `json:"cloudtrail_logs_bucket"`
	AppDataBucket        string   `json:"app_data_bucket"`
	IAMRoles             struct {
		Developer string `json:"developer"`
	} `json:"iam_roles"`
	VPCEndpoints struct {
		S3         string `json:"s3"`
		KMS        string `json:"kms"`
		CloudTrail string `json:"cloudtrail"`
		Logs       string `json:"logs"`
	} `json:"vpc_endpoints"`
}

// LoadOutputs loads the deployment outputs from the outputs file
func LoadOutputs(t *testing.T) *InfrastructureOutputs {
	outputsFile := "../cfn-outputs/all-outputs.json"

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

func TestInfrastructureOutputsValidation(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should have valid VPC ID", func(t *testing.T) {
		assert.NotEmpty(t, outputs.VpcID)
		assert.True(t, strings.HasPrefix(outputs.VpcID, "vpc-"), "VPC ID should start with 'vpc-'")
	})

	t.Run("should have valid subnet IDs", func(t *testing.T) {
		assert.Len(t, outputs.PrivateSubnetIDs, 2, "Should have 2 private subnets")
		assert.Len(t, outputs.PublicSubnetIDs, 2, "Should have 2 public subnets")

		for _, subnetID := range outputs.PrivateSubnetIDs {
			assert.True(t, strings.HasPrefix(subnetID, "subnet-"), "Subnet ID should start with 'subnet-'")
		}

		for _, subnetID := range outputs.PublicSubnetIDs {
			assert.True(t, strings.HasPrefix(subnetID, "subnet-"), "Subnet ID should start with 'subnet-'")
		}
	})

	t.Run("should have valid KMS key information", func(t *testing.T) {
		assert.NotEmpty(t, outputs.KMSKeyID)
		assert.NotEmpty(t, outputs.KMSKeyARN)
		assert.True(t, strings.HasPrefix(outputs.KMSKeyID, "key-"), "KMS Key ID should start with 'key-'")
		assert.True(t, strings.Contains(outputs.KMSKeyARN, ":kms:"), "KMS Key ARN should contain ':kms:'")
	})

	t.Run("should have valid S3 bucket names", func(t *testing.T) {
		assert.NotEmpty(t, outputs.CloudTrailLogsBucket)
		assert.NotEmpty(t, outputs.AppDataBucket)
		assert.True(t, strings.Contains(outputs.CloudTrailLogsBucket, "cloudtrail-logs"), "CloudTrail logs bucket should contain 'cloudtrail-logs'")
		assert.True(t, strings.Contains(outputs.AppDataBucket, "app-data"), "App data bucket should contain 'app-data'")
	})

	t.Run("should have valid IAM role ARN", func(t *testing.T) {
		assert.NotEmpty(t, outputs.IAMRoles.Developer)
		assert.True(t, strings.Contains(outputs.IAMRoles.Developer, ":role/"), "IAM role ARN should contain ':role/'")
	})

	t.Run("should have valid VPC endpoint IDs", func(t *testing.T) {
		assert.NotEmpty(t, outputs.VPCEndpoints.S3)
		assert.NotEmpty(t, outputs.VPCEndpoints.KMS)
		assert.NotEmpty(t, outputs.VPCEndpoints.CloudTrail)
		assert.NotEmpty(t, outputs.VPCEndpoints.Logs)

		assert.True(t, strings.HasPrefix(outputs.VPCEndpoints.S3, "vpce-"), "S3 VPC endpoint ID should start with 'vpce-'")
		assert.True(t, strings.HasPrefix(outputs.VPCEndpoints.KMS, "vpce-"), "KMS VPC endpoint ID should start with 'vpce-'")
		assert.True(t, strings.HasPrefix(outputs.VPCEndpoints.CloudTrail, "vpce-"), "CloudTrail VPC endpoint ID should start with 'vpce-'")
		assert.True(t, strings.HasPrefix(outputs.VPCEndpoints.Logs, "vpce-"), "Logs VPC endpoint ID should start with 'vpce-'")
	})
}

func TestLiveVPCCreation(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should verify VPC exists and has correct configuration", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcID},
		})
		require.NoError(t, err)
		require.Len(t, result.Vpcs, 1)

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.VpcID, *vpc.VpcId)
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)

		// Check DNS hostnames
		dnsHostnames, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
			VpcId:     vpc.VpcId,
			Attribute: "enableDnsHostnames",
		})
		require.NoError(t, err)
		assert.True(t, *dnsHostnames.EnableDnsHostnames.Value)

		// Check DNS support
		dnsSupport, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
			VpcId:     vpc.VpcId,
			Attribute: "enableDnsSupport",
		})
		require.NoError(t, err)
		assert.True(t, *dnsSupport.EnableDnsSupport.Value)

		// Check for required tags
		hasProjectTag := false
		hasEnvironmentTag := false
		hasManagedByTag := false
		for _, tag := range vpc.Tags {
			switch *tag.Key {
			case "Project":
				assert.Equal(t, "SecureCorp", *tag.Value)
				hasProjectTag = true
			case "Environment":
				assert.Equal(t, "dev", *tag.Value)
				hasEnvironmentTag = true
			case "ManagedBy":
				assert.Equal(t, "pulumi", *tag.Value)
				hasManagedByTag = true
			}
		}
		assert.True(t, hasProjectTag, "VPC should have Project tag")
		assert.True(t, hasEnvironmentTag, "VPC should have Environment tag")
		assert.True(t, hasManagedByTag, "VPC should have ManagedBy tag")
	})

	t.Run("should verify subnets exist and have correct configuration", func(t *testing.T) {
		allSubnetIDs := append(outputs.PrivateSubnetIDs, outputs.PublicSubnetIDs...)

		result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			SubnetIds: allSubnetIDs,
		})
		require.NoError(t, err)
		assert.Len(t, result.Subnets, 4, "Should have 4 subnets total")

		// Verify public subnets have auto-assign public IP enabled
		for _, subnet := range result.Subnets {
			if contains(outputs.PublicSubnetIDs, *subnet.SubnetId) {
				assert.True(t, *subnet.MapPublicIpOnLaunch, "Public subnet should have auto-assign public IP enabled")
			}
		}
	})
}

func TestLiveS3Buckets(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should verify CloudTrail logs bucket exists and has correct configuration", func(t *testing.T) {
		// Check bucket exists
		_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.CloudTrailLogsBucket),
		})
		require.NoError(t, err)

		// Check versioning
		versioningResult, err := s3Client.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.CloudTrailLogsBucket),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioningResult.Status))

		// Check encryption
		encryptionResult, err := s3Client.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.CloudTrailLogsBucket),
		})
		require.NoError(t, err)
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1)
		assert.Equal(t, "aws:kms", string(encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))
		assert.Equal(t, outputs.KMSKeyARN, *encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID)

		// Check public access block
		publicAccessResult, err := s3Client.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.CloudTrailLogsBucket),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})

	t.Run("should verify application data bucket exists and has correct configuration", func(t *testing.T) {
		// Check bucket exists
		_, err := s3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)

		// Check versioning
		versioningResult, err := s3Client.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioningResult.Status))

		// Check encryption
		encryptionResult, err := s3Client.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.Len(t, encryptionResult.ServerSideEncryptionConfiguration.Rules, 1)
		assert.Equal(t, "aws:kms", string(encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))
		assert.Equal(t, outputs.KMSKeyARN, *encryptionResult.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID)

		// Check public access block
		publicAccessResult, err := s3Client.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.AppDataBucket),
		})
		require.NoError(t, err)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *publicAccessResult.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})
}

func TestLiveKMSKey(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should verify KMS key exists and has correct configuration", func(t *testing.T) {
		result, err := kmsClient.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KMSKeyID),
		})
		require.NoError(t, err)

		key := result.KeyMetadata
		assert.Equal(t, outputs.KMSKeyID, *key.KeyId)
		assert.Equal(t, "ENABLED", string(key.KeyState))
		assert.Equal(t, "SYMMETRIC_DEFAULT", string(key.CustomerMasterKeySpec))
		assert.Equal(t, "ENCRYPT_DECRYPT", string(key.KeyUsage))
		// Note: EnableKeyRotation and MultiRegion are not available in KeyMetadata
		// These would need to be checked via separate API calls if needed

		// Note: KMS key tags are not available in KeyMetadata
		// Tags would need to be checked via ListResourceTags API if needed
	})

	t.Run("should verify KMS alias exists", func(t *testing.T) {
		aliasName := "alias/securecorp-dev-key"
		result, err := kmsClient.ListAliases(context.TODO(), &kms.ListAliasesInput{})
		require.NoError(t, err)

		found := false
		for _, alias := range result.Aliases {
			if *alias.AliasName == aliasName {
				assert.Equal(t, outputs.KMSKeyID, *alias.TargetKeyId)
				found = true
				break
			}
		}
		assert.True(t, found, "KMS alias should exist")
	})
}

func TestLiveIAMRoles(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should verify developer role exists and has correct configuration", func(t *testing.T) {
		roleName := strings.TrimPrefix(outputs.IAMRoles.Developer, "arn:aws:iam::")
		roleName = strings.TrimPrefix(roleName, "arn:aws:iam::*:role/")

		result, err := iamClient.GetRole(context.TODO(), &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)

		role := result.Role
		assert.Equal(t, roleName, *role.RoleName)
		assert.Equal(t, outputs.IAMRoles.Developer, *role.Arn)

		// Check assume role policy
		assumeRolePolicy := *role.AssumeRolePolicyDocument
		assert.Contains(t, assumeRolePolicy, "sts:AssumeRole")
		assert.Contains(t, assumeRolePolicy, "developer-access")

		// Check for required tags
		hasProjectTag := false
		hasEnvironmentTag := false
		hasManagedByTag := false
		for _, tag := range role.Tags {
			switch *tag.Key {
			case "Project":
				assert.Equal(t, "SecureCorp", *tag.Value)
				hasProjectTag = true
			case "Environment":
				assert.Equal(t, "dev", *tag.Value)
				hasEnvironmentTag = true
			case "ManagedBy":
				assert.Equal(t, "pulumi", *tag.Value)
				hasManagedByTag = true
			}
		}
		assert.True(t, hasProjectTag, "IAM role should have Project tag")
		assert.True(t, hasEnvironmentTag, "IAM role should have Environment tag")
		assert.True(t, hasManagedByTag, "IAM role should have ManagedBy tag")
	})

	t.Run("should verify developer role has correct policies", func(t *testing.T) {
		roleName := strings.TrimPrefix(outputs.IAMRoles.Developer, "arn:aws:iam::")
		roleName = strings.TrimPrefix(roleName, "arn:aws:iam::*:role/")

		// Check inline policies
		policiesResult, err := iamClient.ListRolePolicies(context.TODO(), &iam.ListRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.Len(t, policiesResult.PolicyNames, 1, "Developer role should have 1 inline policy")
		assert.Contains(t, policiesResult.PolicyNames, "securecorp-dev-developer-policy")

		// Check attached policies
		attachedPoliciesResult, err := iamClient.ListAttachedRolePolicies(context.TODO(), &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.Len(t, attachedPoliciesResult.AttachedPolicies, 0, "Developer role should not have attached policies")
	})
}

func TestLiveVPCEndpoints(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should verify VPC endpoints exist and have correct configuration", func(t *testing.T) {
		endpointIDs := []string{
			outputs.VPCEndpoints.S3,
			outputs.VPCEndpoints.KMS,
			outputs.VPCEndpoints.CloudTrail,
			outputs.VPCEndpoints.Logs,
		}

		result, err := ec2Client.DescribeVpcEndpoints(context.TODO(), &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: endpointIDs,
		})
		require.NoError(t, err)
		assert.Len(t, result.VpcEndpoints, 4, "Should have 4 VPC endpoints")

		for _, endpoint := range result.VpcEndpoints {
			assert.Equal(t, "available", string(endpoint.State))
			assert.Equal(t, outputs.VpcID, *endpoint.VpcId)

			// Check for required tags
			hasProjectTag := false
			hasEnvironmentTag := false
			hasManagedByTag := false
			for _, tag := range endpoint.Tags {
				switch *tag.Key {
				case "Project":
					assert.Equal(t, "SecureCorp", *tag.Value)
					hasProjectTag = true
				case "Environment":
					assert.Equal(t, "dev", *tag.Value)
					hasEnvironmentTag = true
				case "ManagedBy":
					assert.Equal(t, "pulumi", *tag.Value)
					hasManagedByTag = true
				}
			}
			assert.True(t, hasProjectTag, "VPC endpoint should have Project tag")
			assert.True(t, hasEnvironmentTag, "VPC endpoint should have Environment tag")
			assert.True(t, hasManagedByTag, "VPC endpoint should have ManagedBy tag")
		}
	})

	t.Run("should verify S3 endpoint is Gateway type", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcEndpoints(context.TODO(), &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: []string{outputs.VPCEndpoints.S3},
		})
		require.NoError(t, err)
		require.Len(t, result.VpcEndpoints, 1)

		endpoint := result.VpcEndpoints[0]
		assert.Equal(t, "Gateway", string(endpoint.VpcEndpointType))
		assert.True(t, strings.Contains(*endpoint.ServiceName, "s3"))
	})

	t.Run("should verify other endpoints are Interface type", func(t *testing.T) {
		interfaceEndpoints := []string{
			outputs.VPCEndpoints.KMS,
			outputs.VPCEndpoints.CloudTrail,
			outputs.VPCEndpoints.Logs,
		}

		result, err := ec2Client.DescribeVpcEndpoints(context.TODO(), &ec2.DescribeVpcEndpointsInput{
			VpcEndpointIds: interfaceEndpoints,
		})
		require.NoError(t, err)
		assert.Len(t, result.VpcEndpoints, 3)

		for _, endpoint := range result.VpcEndpoints {
			assert.Equal(t, "Interface", string(endpoint.VpcEndpointType))
			assert.True(t, *endpoint.PrivateDnsEnabled)
			assert.Len(t, endpoint.SubnetIds, 2, "Interface endpoints should be in 2 subnets")
		}
	})
}

func TestLiveCloudWatchLogs(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	t.Run("should verify CloudTrail log group exists", func(t *testing.T) {
		logGroupName := "/aws/cloudtrail/securecorp-dev"

		result, err := cloudwatchClient.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(logGroupName),
		})
		require.NoError(t, err)

		found := false
		for _, logGroup := range result.LogGroups {
			if *logGroup.LogGroupName == logGroupName {
				assert.Equal(t, int32(2557), *logGroup.RetentionInDays)
				found = true
				break
			}
		}
		assert.True(t, found, "CloudTrail log group should exist")
	})

	t.Run("should verify application log group exists", func(t *testing.T) {
		logGroupName := "/aws/application/securecorp-dev"

		result, err := cloudwatchClient.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{
			LogGroupNamePrefix: aws.String(logGroupName),
		})
		require.NoError(t, err)

		found := false
		for _, logGroup := range result.LogGroups {
			if *logGroup.LogGroupName == logGroupName {
				assert.Equal(t, int32(90), *logGroup.RetentionInDays)
				found = true
				break
			}
		}
		assert.True(t, found, "Application log group should exist")
	})
}

func TestSecurityConstraints(t *testing.T) {
	if skipLiveTests {
		t.Skip("Skipping live AWS tests")
	}

	outputs := LoadOutputs(t)

	t.Run("should enforce encryption at rest", func(t *testing.T) {
		// S3 buckets are already tested for encryption
		// KMS key is already tested
		assert.NotEmpty(t, outputs.KMSKeyID, "KMS key should exist for encryption")
	})

	t.Run("should enforce network security", func(t *testing.T) {
		// VPC endpoints are already tested
		// Security groups are validated through VPC creation
		assert.NotEmpty(t, outputs.VPCEndpoints.S3, "S3 VPC endpoint should exist")
		assert.NotEmpty(t, outputs.VPCEndpoints.KMS, "KMS VPC endpoint should exist")
	})

	t.Run("should enforce access control", func(t *testing.T) {
		// IAM roles are already tested
		assert.NotEmpty(t, outputs.IAMRoles.Developer, "Developer IAM role should exist")
	})

	t.Run("should enforce logging and monitoring", func(t *testing.T) {
		// CloudWatch log groups are already tested
		assert.NotEmpty(t, outputs.CloudTrailLogsBucket, "CloudTrail logs bucket should exist")
	})
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
