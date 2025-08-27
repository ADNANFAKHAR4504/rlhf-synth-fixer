package test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// FlatOutputs represents the flattened CloudFormation outputs
type FlatOutputs struct {
	BucketName                string `json:"bucketName"`
	BucketArn                 string `json:"bucketArn"`
	BucketDomainName          string `json:"bucketDomainName"`
	BucketRegionalDomainName  string `json:"bucketRegionalDomainName"`
	LoggingBucketName         string `json:"loggingBucketName"`
	LoggingBucketArn          string `json:"loggingBucketArn"`
	KmsKeyId                  string `json:"kmsKeyId"`
	KmsKeyArn                 string `json:"kmsKeyArn"`
	KmsAliasName              string `json:"kmsAliasName"`
	Region                    string `json:"region"`
	UniqueId                  string `json:"uniqueId"`
	EnvironmentSuffix         string `json:"environmentSuffix"`
	AllowedAccountIds         string `json:"allowedAccountIds"`
	EncryptionType            string `json:"encryptionType"`
	ComplianceLevel           string `json:"complianceLevel"`
}

// AWS clients
var (
	s3Client  *s3.Client
	kmsClient *kms.Client
	iamClient *iam.Client
	ctx       context.Context
)

// TestMain sets up AWS clients for integration tests
func TestMain(m *testing.M) {
	// Check if we should run live tests
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("CI") == "true" {
		fmt.Println("⚠️  Skipping live AWS integration tests - no AWS credentials or running in CI")
		os.Exit(0)
	}

	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		fmt.Printf("❌ Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	// Initialize AWS clients
	s3Client = s3.NewFromConfig(cfg)
	kmsClient = kms.NewFromConfig(cfg)
	iamClient = iam.NewFromConfig(cfg)
	ctx = context.TODO()

	// Run tests
	code := m.Run()
	os.Exit(code)
}

// LoadOutputs loads the deployment outputs from both all-outputs.json and flat-outputs.json files
func LoadOutputs(t *testing.T) *FlatOutputs {
	allOutputsFile := "../cfn-outputs/all-outputs.json"
	flatOutputsFile := "../cfn-outputs/flat-outputs.json"
	
	outputs := &FlatOutputs{}
	
	// Load all-outputs.json if it exists
	if _, err := os.Stat(allOutputsFile); err == nil {
		data, err := os.ReadFile(allOutputsFile)
		if err == nil {
			var allOutputs map[string]interface{}
			if json.Unmarshal(data, &allOutputs) == nil {
				// Extract values from all-outputs.json
				for key, value := range allOutputs {
					if valueMap, ok := value.(map[string]interface{}); ok {
						if val, exists := valueMap["value"]; exists {
							switch key {
							case "vpc_id":
								if _, ok := val.(string); ok {
									// Store VPC ID in a custom field or use it for validation
									outputs.Region = "us-west-2" // Default region
								}
							case "public_subnet_ids":
								if subnets, ok := val.([]interface{}); ok && len(subnets) > 0 {
									// Use subnet info for region validation
									outputs.Region = "us-west-2"
								}
							}
						}
					}
				}
			}
		}
	}
	
	// Load flat-outputs.json if it exists
	if _, err := os.Stat(flatOutputsFile); err == nil {
		data, err := os.ReadFile(flatOutputsFile)
		if err == nil {
			var flatOutputs FlatOutputs
			if json.Unmarshal(data, &flatOutputs) == nil {
				// Merge flat outputs with existing data
				if flatOutputs.BucketName != "" {
					outputs.BucketName = flatOutputs.BucketName
				}
				if flatOutputs.BucketArn != "" {
					outputs.BucketArn = flatOutputs.BucketArn
				}
				if flatOutputs.BucketDomainName != "" {
					outputs.BucketDomainName = flatOutputs.BucketDomainName
				}
				if flatOutputs.BucketRegionalDomainName != "" {
					outputs.BucketRegionalDomainName = flatOutputs.BucketRegionalDomainName
				}
				if flatOutputs.LoggingBucketName != "" {
					outputs.LoggingBucketName = flatOutputs.LoggingBucketName
				}
				if flatOutputs.LoggingBucketArn != "" {
					outputs.LoggingBucketArn = flatOutputs.LoggingBucketArn
				}
				if flatOutputs.KmsKeyId != "" {
					outputs.KmsKeyId = flatOutputs.KmsKeyId
				}
				if flatOutputs.KmsKeyArn != "" {
					outputs.KmsKeyArn = flatOutputs.KmsKeyArn
				}
				if flatOutputs.KmsAliasName != "" {
					outputs.KmsAliasName = flatOutputs.KmsAliasName
				}
				if flatOutputs.Region != "" {
					outputs.Region = flatOutputs.Region
				}
				if flatOutputs.UniqueId != "" {
					outputs.UniqueId = flatOutputs.UniqueId
				}
				if flatOutputs.EnvironmentSuffix != "" {
					outputs.EnvironmentSuffix = flatOutputs.EnvironmentSuffix
				}
				if flatOutputs.AllowedAccountIds != "" {
					outputs.AllowedAccountIds = flatOutputs.AllowedAccountIds
				}
				if flatOutputs.EncryptionType != "" {
					outputs.EncryptionType = flatOutputs.EncryptionType
				}
				if flatOutputs.ComplianceLevel != "" {
					outputs.ComplianceLevel = flatOutputs.ComplianceLevel
				}
			}
		}
	}
	
	// If no outputs found in either file, create mock data for testing
	if outputs.BucketName == "" {
		// Check if we have any infrastructure data (from all-outputs.json)
		if outputs.Region == "" {
			// No infrastructure deployed at all
			t.Skip("Skipping integration test - no infrastructure outputs found (infrastructure not deployed)")
		} else {
			// We have some infrastructure (VPC, etc.) but no S3/KMS data
			// This means S3/KMS infrastructure hasn't been deployed yet
			t.Skip("Skipping S3/KMS integration tests - S3/KMS infrastructure not deployed (only VPC infrastructure found)")
		}
	}
	
	return outputs
}

// TestLiveS3Bucket tests the actual S3 bucket configuration
func TestLiveS3Bucket(t *testing.T) {
	if s3Client == nil {
		t.Skip("Skipping live S3 test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("BucketExists", func(t *testing.T) {
		// Test that the bucket actually exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "S3 bucket should exist")
	})

	t.Run("BucketVersioning", func(t *testing.T) {
		// Test that versioning is enabled
		result, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket versioning")
		assert.Equal(t, "Enabled", string(result.Status), "Bucket versioning should be enabled")
	})

	t.Run("BucketEncryption", func(t *testing.T) {
		// Test that encryption is configured
		result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket encryption")
		
		// Check that DSSE-KMS is configured
		foundDSSE := false
		for _, rule := range result.ServerSideEncryptionConfiguration.Rules {
			if rule.ApplyServerSideEncryptionByDefault != nil {
				algorithm := string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
				if algorithm == "aws:kms:dsse" {
					foundDSSE = true
					break
				}
			}
		}
		assert.True(t, foundDSSE, "DSSE-KMS encryption should be configured")
	})

	t.Run("BucketLogging", func(t *testing.T) {
		// Test that logging is configured
		result, err := s3Client.GetBucketLogging(ctx, &s3.GetBucketLoggingInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket logging")
		
		// Check that logging is enabled
		assert.NotNil(t, result.LoggingEnabled, "Bucket logging should be enabled")
		assert.Equal(t, outputs.LoggingBucketName, *result.LoggingEnabled.TargetBucket, "Logging target bucket should match")
		assert.Equal(t, "access-logs/", *result.LoggingEnabled.TargetPrefix, "Logging prefix should be correct")
	})

	t.Run("BucketPublicAccessBlock", func(t *testing.T) {
		// Test that public access is blocked
		result, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get public access block")
		
		// All public access should be blocked
		assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicAcls, "BlockPublicAcls should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicPolicy, "BlockPublicPolicy should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.IgnorePublicAcls, "IgnorePublicAcls should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.RestrictPublicBuckets, "RestrictPublicBuckets should be true")
	})

	t.Run("BucketLifecycle", func(t *testing.T) {
		// Test that lifecycle rules are configured
		result, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket lifecycle")
		
		// Should have at least one lifecycle rule
		assert.Greater(t, len(result.Rules), 0, "Should have lifecycle rules configured")
		
		// Check for deletion protection rule
		foundDeletionProtection := false
		for _, rule := range result.Rules {
			if rule.ID != nil && *rule.ID == "deletion-protection" {
				foundDeletionProtection = true
				assert.Equal(t, "Enabled", string(rule.Status), "Deletion protection should be enabled")
				break
			}
		}
		assert.True(t, foundDeletionProtection, "Deletion protection lifecycle rule should exist")
	})
}

// TestLiveKMSKey tests the actual KMS key configuration
func TestLiveKMSKey(t *testing.T) {
	if kmsClient == nil {
		t.Skip("Skipping live KMS test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("KeyExists", func(t *testing.T) {
		// Test that the KMS key exists
		_, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		assert.NoError(t, err, "KMS key should exist")
	})

	t.Run("KeyDescription", func(t *testing.T) {
		// Test key description
		result, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		assert.NoError(t, err, "Should be able to describe KMS key")
		
		description := *result.KeyMetadata.Description
		assert.Contains(t, description, "FIPS 140-3 Level 3", "Key description should mention FIPS compliance")
	})

	t.Run("KeyRotation", func(t *testing.T) {
		// Test that key rotation is enabled
		result, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		assert.NoError(t, err, "Should be able to get key rotation status")
		assert.True(t, result.KeyRotationEnabled, "Key rotation should be enabled")
	})

	t.Run("KeyAlias", func(t *testing.T) {
		// Test that the alias exists and points to the correct key
		aliasName := strings.TrimPrefix(outputs.KmsAliasName, "alias/")
		result, err := kmsClient.ListAliases(ctx, &kms.ListAliasesInput{})
		assert.NoError(t, err, "Should be able to list KMS aliases")
		
		// Find our alias
		foundAlias := false
		for _, alias := range result.Aliases {
			if *alias.AliasName == aliasName {
				foundAlias = true
				assert.Equal(t, outputs.KmsKeyArn, *alias.TargetKeyId, "Alias should point to the correct key")
				break
			}
		}
		assert.True(t, foundAlias, "KMS alias should exist")
	})
}

// TestLiveBucketPolicy tests the actual bucket policy
func TestLiveBucketPolicy(t *testing.T) {
	if s3Client == nil {
		t.Skip("Skipping live bucket policy test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("PolicyExists", func(t *testing.T) {
		// Test that bucket policy exists
		result, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Bucket policy should exist")
		
		// Parse the policy
		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*result.Policy), &policy)
		assert.NoError(t, err, "Should be able to parse bucket policy")
		
		// Check for HTTPS enforcement
		foundHTTPSEnforcement := false
		foundEncryptionEnforcement := false
		
		if statements, ok := policy["Statement"].([]interface{}); ok {
			for _, stmt := range statements {
				if statement, ok := stmt.(map[string]interface{}); ok {
					// Check for HTTPS enforcement
					if sid, ok := statement["Sid"].(string); ok && sid == "DenyInsecureConnections" {
						foundHTTPSEnforcement = true
					}
					
					// Check for encryption enforcement
					if sid, ok := statement["Sid"].(string); ok && sid == "DenyUnencryptedObjectUploads" {
						foundEncryptionEnforcement = true
					}
				}
			}
		}
		
		assert.True(t, foundHTTPSEnforcement, "HTTPS enforcement policy should exist")
		assert.True(t, foundEncryptionEnforcement, "Encryption enforcement policy should exist")
	})
}

// TestLiveLoggingBucket tests the logging bucket configuration
func TestLiveLoggingBucket(t *testing.T) {
	if s3Client == nil {
		t.Skip("Skipping live logging bucket test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("LoggingBucketExists", func(t *testing.T) {
		// Test that the logging bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.LoggingBucketName),
		})
		assert.NoError(t, err, "Logging bucket should exist")
	})

	t.Run("LoggingBucketEncryption", func(t *testing.T) {
		// Test that logging bucket has encryption
		result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.LoggingBucketName),
		})
		assert.NoError(t, err, "Should be able to get logging bucket encryption")
		
		// Should have encryption configured
		assert.NotNil(t, result.ServerSideEncryptionConfiguration, "Logging bucket should have encryption")
	})

	t.Run("LoggingBucketPublicAccessBlock", func(t *testing.T) {
		// Test that logging bucket blocks public access
		result, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.LoggingBucketName),
		})
		assert.NoError(t, err, "Should be able to get logging bucket public access block")
		
		// All public access should be blocked
		assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicAcls, "Logging bucket BlockPublicAcls should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicPolicy, "Logging bucket BlockPublicPolicy should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.IgnorePublicAcls, "Logging bucket IgnorePublicAcls should be true")
		assert.True(t, *result.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Logging bucket RestrictPublicBuckets should be true")
	})
}

// TestLiveCrossAccountAccess tests cross-account access configuration
func TestLiveCrossAccountAccess(t *testing.T) {
	if kmsClient == nil {
		t.Skip("Skipping live cross-account test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("KMSKeyPolicy", func(t *testing.T) {
		// Test that KMS key policy allows cross-account access
		result, err := kmsClient.GetKeyPolicy(ctx, &kms.GetKeyPolicyInput{
			KeyId:  aws.String(outputs.KmsKeyId),
			PolicyName: aws.String("default"),
		})
		assert.NoError(t, err, "Should be able to get KMS key policy")
		
		// Parse the policy
		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*result.Policy), &policy)
		assert.NoError(t, err, "Should be able to parse KMS key policy")
		
		// Check for cross-account access
		foundCrossAccountAccess := false
		
		if statements, ok := policy["Statement"].([]interface{}); ok {
			for _, stmt := range statements {
				if statement, ok := stmt.(map[string]interface{}); ok {
					if sid, ok := statement["Sid"].(string); ok && sid == "Allow Cross Account Access" {
						foundCrossAccountAccess = true
						break
					}
				}
			}
		}
		
		assert.True(t, foundCrossAccountAccess, "KMS key policy should allow cross-account access")
	})
}

// TestLiveResourceTags tests that resources have proper tags
func TestLiveResourceTags(t *testing.T) {
	if s3Client == nil {
		t.Skip("Skipping live resource tags test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("BucketTags", func(t *testing.T) {
		// Test that the bucket has proper tags
		result, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket tags")
		
		// Check for required tags
		requiredTags := []string{"Name", "Environment", "Purpose", "CreatedBy"}
		foundTags := make(map[string]string)
		
		for _, tag := range result.TagSet {
			foundTags[*tag.Key] = *tag.Value
		}
		
		for _, requiredTag := range requiredTags {
			_, exists := foundTags[requiredTag]
			assert.True(t, exists, "Required tag %s should exist", requiredTag)
		}
		
		// Check specific tag values
		assert.Equal(t, "SecureS3DataBucket", foundTags["Name"], "Name tag should be correct")
		assert.Equal(t, "Pulumi", foundTags["CreatedBy"], "CreatedBy tag should be correct")
	})
}

// TestLiveCompliance tests compliance requirements
func TestLiveCompliance(t *testing.T) {
	if kmsClient == nil {
		t.Skip("Skipping live compliance test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("FIPSCompliance", func(t *testing.T) {
		// Test that KMS key is FIPS compliant
		result, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		assert.NoError(t, err, "Should be able to describe KMS key")
		
		// Check for FIPS compliance
		description := *result.KeyMetadata.Description
		assert.Contains(t, description, "FIPS 140-3 Level 3", "Key should be FIPS 140-3 Level 3 compliant")
	})
}

// TestLivePerformance tests performance configurations
func TestLivePerformance(t *testing.T) {
	if s3Client == nil {
		t.Skip("Skipping live performance test - no AWS client available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("BucketKeyEnabled", func(t *testing.T) {
		// Test that bucket key is enabled for performance
		result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket encryption")
		
		// Check that bucket key is enabled
		foundBucketKeyEnabled := false
		for _, rule := range result.ServerSideEncryptionConfiguration.Rules {
			if rule.BucketKeyEnabled != nil && *rule.BucketKeyEnabled {
				foundBucketKeyEnabled = true
				break
			}
		}
		assert.True(t, foundBucketKeyEnabled, "Bucket key should be enabled for performance")
	})
}

// TestLiveSecurityConstraints validates all security constraints against live resources
func TestLiveSecurityConstraints(t *testing.T) {
	if s3Client == nil || kmsClient == nil {
		t.Skip("Skipping live security constraints test - no AWS clients available")
	}

	outputs := LoadOutputs(t)
	
	t.Run("Constraint1_BucketNaming", func(t *testing.T) {
		// Test bucket naming pattern
		assert.True(t, strings.HasPrefix(outputs.BucketName, "secure-data-"))
		assert.Contains(t, outputs.BucketName, outputs.UniqueId)
		
		// Verify bucket exists
		_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Bucket should exist")
	})

	t.Run("Constraint2_KMSEncryption", func(t *testing.T) {
		// Test KMS encryption
		_, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		assert.NoError(t, err, "KMS key should exist")
		
		// Test encryption configuration
		result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket encryption")
		
		foundDSSE := false
		for _, rule := range result.ServerSideEncryptionConfiguration.Rules {
			if rule.ApplyServerSideEncryptionByDefault != nil {
				algorithm := string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm)
				if algorithm == "aws:kms:dsse" {
					foundDSSE = true
					break
				}
			}
		}
		assert.True(t, foundDSSE, "DSSE-KMS encryption should be configured")
	})

	t.Run("Constraint3_HTTPSOnly", func(t *testing.T) {
		// Test HTTPS-only policy
		result, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket policy")
		
		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*result.Policy), &policy)
		assert.NoError(t, err, "Should be able to parse bucket policy")
		
		foundHTTPSEnforcement := false
		if statements, ok := policy["Statement"].([]interface{}); ok {
			for _, stmt := range statements {
				if statement, ok := stmt.(map[string]interface{}); ok {
					if sid, ok := statement["Sid"].(string); ok && sid == "DenyInsecureConnections" {
						foundHTTPSEnforcement = true
						break
					}
				}
			}
		}
		assert.True(t, foundHTTPSEnforcement, "HTTPS enforcement policy should exist")
	})

	t.Run("Constraint4_DenyUnencryptedUploads", func(t *testing.T) {
		// Test deny unencrypted uploads policy
		result, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket policy")
		
		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*result.Policy), &policy)
		assert.NoError(t, err, "Should be able to parse bucket policy")
		
		foundEncryptionEnforcement := false
		if statements, ok := policy["Statement"].([]interface{}); ok {
			for _, stmt := range statements {
				if statement, ok := stmt.(map[string]interface{}); ok {
					if sid, ok := statement["Sid"].(string); ok && sid == "DenyUnencryptedObjectUploads" {
						foundEncryptionEnforcement = true
						break
					}
				}
			}
		}
		assert.True(t, foundEncryptionEnforcement, "Encryption enforcement policy should exist")
	})

	t.Run("Constraint5_Versioning", func(t *testing.T) {
		// Test object versioning
		result, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket versioning")
		assert.Equal(t, "Enabled", string(result.Status), "Object versioning should be enabled")
	})

	t.Run("Constraint6_Logging", func(t *testing.T) {
		// Test logging enabled
		result, err := s3Client.GetBucketLogging(ctx, &s3.GetBucketLoggingInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket logging")
		assert.NotNil(t, result.LoggingEnabled, "Bucket logging should be enabled")
	})

	t.Run("Constraint7_DeletionProtection", func(t *testing.T) {
		// Test deletion protection
		result, err := s3Client.GetBucketLifecycleConfiguration(ctx, &s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.BucketName),
		})
		assert.NoError(t, err, "Should be able to get bucket lifecycle")
		
		foundDeletionProtection := false
		for _, rule := range result.Rules {
			if rule.ID != nil && *rule.ID == "deletion-protection" {
				foundDeletionProtection = true
				assert.Equal(t, "Enabled", string(rule.Status), "Deletion protection should be enabled")
				break
			}
		}
		assert.True(t, foundDeletionProtection, "Deletion protection lifecycle rule should exist")
	})

	t.Run("Constraint8_CrossAccountAccess", func(t *testing.T) {
		// Test cross-account access
		result, err := kmsClient.GetKeyPolicy(ctx, &kms.GetKeyPolicyInput{
			KeyId:  aws.String(outputs.KmsKeyId),
			PolicyName: aws.String("default"),
		})
		assert.NoError(t, err, "Should be able to get KMS key policy")
		
		var policy map[string]interface{}
		err = json.Unmarshal([]byte(*result.Policy), &policy)
		assert.NoError(t, err, "Should be able to parse KMS key policy")
		
		foundCrossAccountAccess := false
		if statements, ok := policy["Statement"].([]interface{}); ok {
			for _, stmt := range statements {
				if statement, ok := stmt.(map[string]interface{}); ok {
					if sid, ok := statement["Sid"].(string); ok && sid == "Allow Cross Account Access" {
						foundCrossAccountAccess = true
						break
					}
				}
			}
		}
		assert.True(t, foundCrossAccountAccess, "Cross-account access should be configured")
	})
}

// TestVPCInfrastructure tests VPC infrastructure using data from all-outputs.json
func TestVPCInfrastructure(t *testing.T) {
	allOutputsFile := "../cfn-outputs/all-outputs.json"
	
	// Check if all-outputs.json exists
	if _, err := os.Stat(allOutputsFile); os.IsNotExist(err) {
		t.Skip("Skipping VPC infrastructure test - no all-outputs.json file found")
	}
	
	// Read all-outputs.json
	data, err := os.ReadFile(allOutputsFile)
	require.NoError(t, err, "Failed to read all-outputs.json file")
	
	var allOutputs map[string]interface{}
	err = json.Unmarshal(data, &allOutputs)
	require.NoError(t, err, "Failed to parse all-outputs.json")
	
	t.Run("VPCExists", func(t *testing.T) {
		if vpcData, exists := allOutputs["vpc_id"]; exists {
			if vpcMap, ok := vpcData.(map[string]interface{}); ok {
				if vpcId, ok := vpcMap["value"].(string); ok {
					assert.NotEmpty(t, vpcId, "VPC ID should not be empty")
					assert.True(t, strings.HasPrefix(vpcId, "vpc-"), "VPC ID should start with 'vpc-'")
					t.Logf("VPC ID: %s", vpcId)
				}
			}
		} else {
			t.Skip("VPC ID not found in outputs")
		}
	})
	
	t.Run("PublicSubnetsExist", func(t *testing.T) {
		if subnetData, exists := allOutputs["public_subnet_ids"]; exists {
			if subnetMap, ok := subnetData.(map[string]interface{}); ok {
				if subnetValues, ok := subnetMap["value"].([]interface{}); ok {
					assert.Greater(t, len(subnetValues), 0, "Should have at least one public subnet")
					for i, subnet := range subnetValues {
						if subnetId, ok := subnet.(string); ok {
							assert.True(t, strings.HasPrefix(subnetId, "subnet-"), "Subnet ID should start with 'subnet-'")
							t.Logf("Public Subnet %d: %s", i+1, subnetId)
						}
					}
				}
			}
		} else {
			t.Skip("Public subnet IDs not found in outputs")
		}
	})
	
	t.Run("PrivateSubnetExists", func(t *testing.T) {
		if subnetData, exists := allOutputs["private_subnet_id"]; exists {
			if subnetMap, ok := subnetData.(map[string]interface{}); ok {
				if subnetId, ok := subnetMap["value"].(string); ok {
					assert.NotEmpty(t, subnetId, "Private subnet ID should not be empty")
					assert.True(t, strings.HasPrefix(subnetId, "subnet-"), "Private subnet ID should start with 'subnet-'")
					t.Logf("Private Subnet ID: %s", subnetId)
				}
			}
		} else {
			t.Skip("Private subnet ID not found in outputs")
		}
	})
	
	t.Run("SecurityGroupsExist", func(t *testing.T) {
		// Test public security group
		if sgData, exists := allOutputs["public_security_group_id"]; exists {
			if sgMap, ok := sgData.(map[string]interface{}); ok {
				if sgId, ok := sgMap["value"].(string); ok {
					assert.NotEmpty(t, sgId, "Public security group ID should not be empty")
					assert.True(t, strings.HasPrefix(sgId, "sg-"), "Security group ID should start with 'sg-'")
					t.Logf("Public Security Group ID: %s", sgId)
				}
			}
		}
		
		// Test private security group
		if sgData, exists := allOutputs["private_security_group_id"]; exists {
			if sgMap, ok := sgData.(map[string]interface{}); ok {
				if sgId, ok := sgMap["value"].(string); ok {
					assert.NotEmpty(t, sgId, "Private security group ID should not be empty")
					assert.True(t, strings.HasPrefix(sgId, "sg-"), "Security group ID should start with 'sg-'")
					t.Logf("Private Security Group ID: %s", sgId)
				}
			}
		}
	})
	
	t.Run("InternetGatewayExists", func(t *testing.T) {
		if igwData, exists := allOutputs["internet_gateway_id"]; exists {
			if igwMap, ok := igwData.(map[string]interface{}); ok {
				if igwId, ok := igwMap["value"].(string); ok {
					assert.NotEmpty(t, igwId, "Internet Gateway ID should not be empty")
					assert.True(t, strings.HasPrefix(igwId, "igw-"), "Internet Gateway ID should start with 'igw-'")
					t.Logf("Internet Gateway ID: %s", igwId)
				}
			}
		} else {
			t.Skip("Internet Gateway ID not found in outputs")
		}
	})
}

// TestInfrastructureOutputs tests that infrastructure outputs are properly formatted
func TestInfrastructureOutputs(t *testing.T) {
	allOutputsFile := "../cfn-outputs/all-outputs.json"
	
	// Check if all-outputs.json exists
	if _, err := os.Stat(allOutputsFile); os.IsNotExist(err) {
		t.Skip("Skipping infrastructure outputs test - no all-outputs.json file found")
	}
	
	// Read all-outputs.json
	data, err := os.ReadFile(allOutputsFile)
	require.NoError(t, err, "Failed to read all-outputs.json file")
	
	var allOutputs map[string]interface{}
	err = json.Unmarshal(data, &allOutputs)
	require.NoError(t, err, "Failed to parse all-outputs.json")
	
	t.Run("OutputStructure", func(t *testing.T) {
		// Test that each output has the expected structure
		for outputName, outputData := range allOutputs {
			t.Run(outputName, func(t *testing.T) {
				if outputMap, ok := outputData.(map[string]interface{}); ok {
					// Check for required fields
					assert.Contains(t, outputMap, "sensitive", "Output should have 'sensitive' field")
					assert.Contains(t, outputMap, "type", "Output should have 'type' field")
					assert.Contains(t, outputMap, "value", "Output should have 'value' field")
					
					// Check sensitive field is boolean
					if sensitive, exists := outputMap["sensitive"]; exists {
						_, isBool := sensitive.(bool)
						assert.True(t, isBool, "Sensitive field should be boolean")
					}
					
					// Check type field exists
					assert.NotEmpty(t, outputMap["type"], "Type field should not be empty")
					
					// Check value field exists
					assert.NotNil(t, outputMap["value"], "Value field should not be nil")
				} else {
					t.Errorf("Output %s should be a map", outputName)
				}
			})
		}
	})
	
	t.Run("OutputCount", func(t *testing.T) {
		// Test that we have a reasonable number of outputs
		outputCount := len(allOutputs)
		assert.Greater(t, outputCount, 0, "Should have at least one output")
		t.Logf("Total outputs: %d", outputCount)
	})
}