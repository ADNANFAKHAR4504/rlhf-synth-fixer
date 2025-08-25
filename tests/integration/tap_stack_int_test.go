package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Integration tests require actual AWS deployment
// These tests validate deployed infrastructure components

func TestTapStackIntegrationDeployment(t *testing.T) {
	// Skip if not in integration test environment
	if os.Getenv("RUN_INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration tests - set RUN_INTEGRATION_TESTS=1 to run")
	}

	// Setup AWS clients
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)
	kmsClient := kms.NewFromConfig(cfg)
	cwClient := cloudwatch.NewFromConfig(cfg)

	// Test environment suffix
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "integration-test"
	}

	// Integration Test 1: Verify S3 bucket exists and is encrypted
	t.Run("S3BucketEncryption", func(t *testing.T) {
		bucketName := fmt.Sprintf("secure-webapp-storage-%s-", envSuffix)

		// List buckets to find our bucket (bucket name is generated with random suffix)
		listOutput, err := s3Client.ListBuckets(ctx, &s3.ListBucketsInput{})
		require.NoError(t, err, "Failed to list S3 buckets")

		var targetBucket string
		for _, bucket := range listOutput.Buckets {
			if len(*bucket.Name) > len(bucketName) && (*bucket.Name)[:len(bucketName)] == bucketName {
				targetBucket = *bucket.Name
				break
			}
		}
		require.NotEmpty(t, targetBucket, "Should find deployed S3 bucket with prefix: %s", bucketName)

		// Check bucket encryption
		encryptionOutput, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: &targetBucket,
		})
		require.NoError(t, err, "Failed to get bucket encryption")
		require.NotEmpty(t, encryptionOutput.ServerSideEncryptionConfiguration.Rules, "Bucket should have encryption rules")

		// Verify KMS encryption is used
		rule := encryptionOutput.ServerSideEncryptionConfiguration.Rules[0]
		assert.Equal(t, "aws:kms", string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm),
			"Bucket should use KMS encryption")
		assert.NotEmpty(t, *rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID,
			"Bucket should use customer-managed KMS key")

		// Test bucket public access block
		publicAccessOutput, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: &targetBucket,
		})
		require.NoError(t, err, "Failed to get public access block")

		assert.True(t, *publicAccessOutput.PublicAccessBlockConfiguration.BlockPublicAcls,
			"Should block public ACLs")
		assert.True(t, *publicAccessOutput.PublicAccessBlockConfiguration.BlockPublicPolicy,
			"Should block public bucket policies")
		assert.True(t, *publicAccessOutput.PublicAccessBlockConfiguration.IgnorePublicAcls,
			"Should ignore public ACLs")
		assert.True(t, *publicAccessOutput.PublicAccessBlockConfiguration.RestrictPublicBuckets,
			"Should restrict public buckets")
	})

	// Integration Test 2: Verify KMS key exists and has proper configuration
	t.Run("KMSKeyConfiguration", func(t *testing.T) {
		keyAlias := fmt.Sprintf("alias/s3-webapp-encryp-key-%s", envSuffix)

		// Find the KMS key by alias
		aliasOutput, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: &keyAlias,
		})
		require.NoError(t, err, "Should find KMS key by alias")

		keyMetadata := aliasOutput.KeyMetadata
		assert.Equal(t, "SYMMETRIC_DEFAULT", string(keyMetadata.KeyUsage), "Key should be for symmetric encryption")
		assert.Equal(t, "ENCRYPT_DECRYPT", string(keyMetadata.KeySpec), "Key should be for encryption/decryption")
		assert.True(t, *keyMetadata.Enabled, "KMS key should be enabled")

		// Check key rotation
		rotationOutput, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: keyMetadata.KeyId,
		})
		require.NoError(t, err, "Should get key rotation status")
		assert.True(t, *rotationOutput.KeyRotationEnabled, "KMS key rotation should be enabled")

		// Check key policy
		policyOutput, err := kmsClient.GetKeyPolicy(ctx, &kms.GetKeyPolicyInput{
			KeyId:      keyMetadata.KeyId,
			PolicyName: &[]string{"default"}[0],
		})
		require.NoError(t, err, "Should get key policy")

		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*policyOutput.Policy), &policy)
		require.NoError(t, err, "Should parse key policy JSON")

		statements := policy["Statement"].([]interface{})
		assert.NotEmpty(t, statements, "Key policy should have statements")
	})

	// Integration Test 3: Verify CloudWatch alarms exist
	t.Run("CloudWatchAlarms", func(t *testing.T) {
		alarmName := fmt.Sprintf("SecurityViolation-%s", envSuffix)

		// Check if alarm exists
		alarmsOutput, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
			AlarmNames: []string{alarmName},
		})
		require.NoError(t, err, "Should describe CloudWatch alarms")
		require.Len(t, alarmsOutput.MetricAlarms, 1, "Should find the security violation alarm")

		alarm := alarmsOutput.MetricAlarms[0]
		assert.Equal(t, alarmName, *alarm.AlarmName, "Alarm name should match")
		assert.Equal(t, "GreaterThanThreshold", string(alarm.ComparisonOperator),
			"Alarm should use GreaterThanThreshold comparison")
		assert.Equal(t, "CloudTrailMetrics", *alarm.Namespace,
			"Alarm should monitor CloudTrail metrics")
		assert.Equal(t, "UnauthorizedAPICallsAttempt", *alarm.MetricName,
			"Alarm should monitor unauthorized API calls")
	})
}

func TestTapStackNetworkConnectivity(t *testing.T) {
	// Skip if not in integration test environment
	if os.Getenv("RUN_INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration tests - set RUN_INTEGRATION_TESTS=1 to run")
	}

	// This test would verify network connectivity and security group rules
	// For now, we'll test the synthesized configuration
	t.Run("SecurityGroupsConfiguration", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		config := &TapStackConfig{
			Region:            "us-east-1",
			EnvironmentSuffix: "connectivity-test",
		}

		stack := NewTapStack(app, "ConnectivityTestStack", config)
		manifest := cdktf.Testing_Synth(stack, &cdktf.TestingConfig{})

		var tfConfig map[string]interface{}
		err := json.Unmarshal([]byte(*manifest), &tfConfig)
		require.NoError(t, err, "Should parse Terraform JSON")

		resources := tfConfig["resource"].(map[string]interface{})
		securityGroups := resources["aws_security_group"].(map[string]interface{})

		// Verify ALB security group allows only HTTPS
		var albSgFound bool
		for _, sgConfig := range securityGroups {
			sgMap := sgConfig.(map[string]interface{})
			if name, hasName := sgMap["name"]; hasName {
				if nameStr := name.(string); len(nameStr) > 16 && nameStr[:16] == "alb-security-group" {
					albSgFound = true

					// Check ingress rules
					if ingress, hasIngress := sgMap["ingress"]; hasIngress {
						ingressRules := ingress.([]interface{})
						for _, rule := range ingressRules {
							ruleMap := rule.(map[string]interface{})
							assert.Equal(t, float64(443), ruleMap["from_port"].(float64),
								"ALB should only accept HTTPS traffic")
							assert.Equal(t, float64(443), ruleMap["to_port"].(float64),
								"ALB should only accept HTTPS traffic")
							assert.Equal(t, "tcp", ruleMap["protocol"].(string),
								"ALB should use TCP protocol")
						}
					}
				}
			}
		}
		assert.True(t, albSgFound, "Should find ALB security group")
	})
}

func TestTapStackIAMCompliance(t *testing.T) {
	// Skip if not in integration test environment
	if os.Getenv("RUN_INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration tests - set RUN_INTEGRATION_TESTS=1 to run")
	}

	t.Run("IAMLeastPrivilege", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		config := &TapStackConfig{
			Region:            "us-east-1",
			EnvironmentSuffix: "iam-test",
		}

		stack := NewTapStack(app, "IAMTestStack", config)
		manifest := cdktf.Testing_Synth(stack, &cdktf.TestingConfig{})

		var tfConfig map[string]interface{}
		err := json.Unmarshal([]byte(*manifest), &tfConfig)
		require.NoError(t, err, "Should parse Terraform JSON")

		resources := tfConfig["resource"].(map[string]interface{})

		// Test IAM roles
		iamRoles := resources["aws_iam_role"].(map[string]interface{})
		for _, roleConfig := range iamRoles {
			roleMap := roleConfig.(map[string]interface{})
			assumeRolePolicy := roleMap["assume_role_policy"].(string)

			var policy map[string]interface{}
			err = json.Unmarshal([]byte(assumeRolePolicy), &policy)
			require.NoError(t, err, "Should parse assume role policy")

			statements := policy["Statement"].([]interface{})
			for _, stmt := range statements {
				stmtMap := stmt.(map[string]interface{})
				assert.Equal(t, "Allow", stmtMap["Effect"].(string), "Role should allow assumption")

				// Check that only specific services can assume the role
				if principal, hasPrincipal := stmtMap["Principal"]; hasPrincipal {
					principalMap := principal.(map[string]interface{})
					if service, hasService := principalMap["Service"]; hasService {
						serviceStr := service.(string)
						assert.Contains(t, []string{"ec2.amazonaws.com"}, serviceStr,
							"Only specific AWS services should be able to assume roles")
					}
				}
			}
		}

		// Test IAM policies
		iamPolicies := resources["aws_iam_policy"].(map[string]interface{})
		for _, policyConfig := range iamPolicies {
			policyMap := policyConfig.(map[string]interface{})
			policyJSON := policyMap["policy"].(string)

			var policy map[string]interface{}
			err = json.Unmarshal([]byte(policyJSON), &policy)
			require.NoError(t, err, "Should parse IAM policy")

			statements := policy["Statement"].([]interface{})
			for _, stmt := range statements {
				stmtMap := stmt.(map[string]interface{})

				// Check that policies don't grant overly broad permissions
				if actions, hasActions := stmtMap["Action"]; hasActions {
					actionsList := actions.([]interface{})
					for _, action := range actionsList {
						actionStr := action.(string)
						// Should not allow all actions on all services
						assert.NotEqual(t, "*", actionStr, "Policies should not grant all permissions")
					}
				}
			}
		}
	})
}
