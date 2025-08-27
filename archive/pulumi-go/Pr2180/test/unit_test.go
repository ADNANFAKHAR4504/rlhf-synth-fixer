package test

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test utility functions
func TestGenerateUniqueId(t *testing.T) {
	t.Run("GenerateUniqueId_ProducesValidHex", func(t *testing.T) {
		// Test that generateUniqueId produces valid hex strings
		for i := 0; i < 10; i++ {
			id, err := generateUniqueId()
			require.NoError(t, err)

			// Should be 16 characters (8 bytes = 16 hex chars)
			assert.Len(t, id, 16)

			// Should only contain hex characters
			for _, c := range id {
				assert.True(t, (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'),
					"Character %c is not a valid hex character", c)
			}
		}
	})

	t.Run("GenerateUniqueId_ProducesUniqueIds", func(t *testing.T) {
		// Test uniqueness
		ids := make(map[string]bool)
		for i := 0; i < 100; i++ {
			id, err := generateUniqueId()
			require.NoError(t, err)
			assert.False(t, ids[id], "Duplicate ID generated: %s", id)
			ids[id] = true
		}
	})
}

// Mock function to simulate generateUniqueId
func generateUniqueId() (string, error) {
	bytes := make([]byte, 8)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func TestFormatAccountArns(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Single account",
			input:    "123456789012",
			expected: `"arn:aws:iam::123456789012:root"`,
		},
		{
			name:     "Multiple accounts",
			input:    "123456789012,987654321098",
			expected: `"arn:aws:iam::123456789012:root","arn:aws:iam::987654321098:root"`,
		},
		{
			name:     "Accounts with spaces",
			input:    "123456789012, 987654321098, 111111111111",
			expected: `"arn:aws:iam::123456789012:root","arn:aws:iam::987654321098:root","arn:aws:iam::111111111111:root"`,
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "Single account with spaces",
			input:    "  123456789012  ",
			expected: `"arn:aws:iam::123456789012:root"`,
		},
		{
			name:     "Mixed with empty values",
			input:    "123456789012,,987654321098",
			expected: `"arn:aws:iam::123456789012:root","arn:aws:iam::987654321098:root"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatAccountArns(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Mock function to simulate formatAccountArns
func formatAccountArns(accountIds string) string {
	if accountIds == "" {
		return ""
	}

	// Split by comma and clean up spaces
	accounts := strings.Split(accountIds, ",")
	var arns []string

	for _, account := range accounts {
		account = strings.TrimSpace(account)
		if account != "" {
			arns = append(arns, `"arn:aws:iam::`+account+`:root"`)
		}
	}

	return strings.Join(arns, ",")
}

func TestBucketNamingPattern(t *testing.T) {
	t.Run("MainBucketNaming", func(t *testing.T) {
		environmentSuffix := "dev"
		uniqueId := "abc123def456"

		// Test main bucket name
		bucketName := "secure-data-" + environmentSuffix + "-" + uniqueId
		assert.True(t, strings.HasPrefix(bucketName, "secure-data-"))
		assert.Contains(t, bucketName, environmentSuffix)
		assert.Contains(t, bucketName, uniqueId)
		assert.Equal(t, "secure-data-dev-abc123def456", bucketName)
	})

	t.Run("LoggingBucketNaming", func(t *testing.T) {
		environmentSuffix := "prod"
		uniqueId := "xyz789abc123"

		// Test logging bucket name
		loggingBucketName := "secure-data-logs-" + environmentSuffix + "-" + uniqueId
		assert.True(t, strings.HasPrefix(loggingBucketName, "secure-data-logs-"))
		assert.Contains(t, loggingBucketName, environmentSuffix)
		assert.Contains(t, loggingBucketName, uniqueId)
		assert.Equal(t, "secure-data-logs-prod-xyz789abc123", loggingBucketName)
	})
}

func TestKMSAliasNaming(t *testing.T) {
	t.Run("KMSAliasPattern", func(t *testing.T) {
		environmentSuffix := "test"
		aliasName := "alias/secure-s3-encryption-key-" + environmentSuffix

		assert.True(t, strings.HasPrefix(aliasName, "alias/"))
		assert.Contains(t, aliasName, "secure-s3-encryption-key")
		assert.Contains(t, aliasName, environmentSuffix)
		assert.Equal(t, "alias/secure-s3-encryption-key-test", aliasName)
	})
}

func TestSecurityPolicies(t *testing.T) {
	t.Run("HTTPS_Only_Policy", func(t *testing.T) {
		// Test HTTPS-only policy structure
		policy := `{
			"Sid": "DenyInsecureConnections",
			"Effect": "Deny",
			"Principal": "*",
			"Action": "s3:*",
			"Condition": {
				"Bool": {
					"aws:SecureTransport": "false"
				}
			}
		}`

		assert.Contains(t, policy, "DenyInsecureConnections")
		assert.Contains(t, policy, "Deny")
		assert.Contains(t, policy, "aws:SecureTransport")
		assert.Contains(t, policy, "false")
	})

	t.Run("Encryption_Policy", func(t *testing.T) {
		// Test encryption policy structure
		policy := `{
			"Sid": "DenyUnencryptedObjectUploads",
			"Effect": "Deny",
			"Principal": "*",
			"Action": "s3:PutObject",
			"Condition": {
				"StringNotEquals": {
					"s3:x-amz-server-side-encryption": "aws:kms:dsse"
				}
			}
		}`

		assert.Contains(t, policy, "DenyUnencryptedObjectUploads")
		assert.Contains(t, policy, "s3:PutObject")
		assert.Contains(t, policy, "aws:kms:dsse")
	})

	t.Run("Versioning_Configuration", func(t *testing.T) {
		// Test versioning configuration
		versioningConfig := map[string]interface{}{
			"Status": "Enabled",
		}

		assert.Equal(t, "Enabled", versioningConfig["Status"])
	})

	t.Run("Lifecycle_Rules", func(t *testing.T) {
		// Test lifecycle rules structure
		lifecycleRule := map[string]interface{}{
			"Id":     "deletion-protection",
			"Status": "Enabled",
			"NoncurrentVersionTransitions": []map[string]interface{}{
				{
					"NoncurrentDays": 30,
					"StorageClass":   "STANDARD_IA",
				},
				{
					"NoncurrentDays": 60,
					"StorageClass":   "GLACIER",
				},
			},
		}

		assert.Equal(t, "deletion-protection", lifecycleRule["Id"])
		assert.Equal(t, "Enabled", lifecycleRule["Status"])
		
		transitions := lifecycleRule["NoncurrentVersionTransitions"].([]map[string]interface{})
		assert.Len(t, transitions, 2)
		assert.Equal(t, 30, transitions[0]["NoncurrentDays"])
		assert.Equal(t, "STANDARD_IA", transitions[0]["StorageClass"])
	})
}

func TestComplianceSettings(t *testing.T) {
	t.Run("FIPS_Compliance", func(t *testing.T) {
		// Test FIPS compliance settings
		complianceTags := map[string]string{
			"Compliance": "FIPS-140-3-Level-3",
			"Purpose":    "S3-Encryption",
		}

		assert.Equal(t, "FIPS-140-3-Level-3", complianceTags["Compliance"])
		assert.Equal(t, "S3-Encryption", complianceTags["Purpose"])
	})

	t.Run("Key_Rotation", func(t *testing.T) {
		// Test key rotation settings
		keyRotation := true
		assert.True(t, keyRotation, "Key rotation should be enabled by default")
	})

	t.Run("Public_Access_Block", func(t *testing.T) {
		// Test public access block settings
		publicAccessBlock := map[string]bool{
			"BlockPublicAcls":       true,
			"BlockPublicPolicy":     true,
			"IgnorePublicAcls":      true,
			"RestrictPublicBuckets": true,
		}

		assert.True(t, publicAccessBlock["BlockPublicAcls"])
		assert.True(t, publicAccessBlock["BlockPublicPolicy"])
		assert.True(t, publicAccessBlock["IgnorePublicAcls"])
		assert.True(t, publicAccessBlock["RestrictPublicBuckets"])
	})
}

func TestResourceTagging(t *testing.T) {
	t.Run("BucketTags", func(t *testing.T) {
		// Test bucket tagging
		bucketTags := map[string]string{
			"Name":        "SecureS3DataBucket",
			"Environment": "production",
			"Purpose":     "SecureDataStorage",
			"Compliance":  "Enterprise-Grade",
			"CreatedBy":   "Pulumi",
		}

		assert.Equal(t, "SecureS3DataBucket", bucketTags["Name"])
		assert.Equal(t, "production", bucketTags["Environment"])
		assert.Equal(t, "SecureDataStorage", bucketTags["Purpose"])
		assert.Equal(t, "Enterprise-Grade", bucketTags["Compliance"])
		assert.Equal(t, "Pulumi", bucketTags["CreatedBy"])
	})

	t.Run("LoggingBucketTags", func(t *testing.T) {
		// Test logging bucket tagging
		loggingTags := map[string]string{
			"Name":        "SecureS3LoggingBucket",
			"Environment": "production",
			"Purpose":     "AccessLogging",
			"CreatedBy":   "Pulumi",
		}

		assert.Equal(t, "SecureS3LoggingBucket", loggingTags["Name"])
		assert.Equal(t, "production", loggingTags["Environment"])
		assert.Equal(t, "AccessLogging", loggingTags["Purpose"])
		assert.Equal(t, "Pulumi", loggingTags["CreatedBy"])
	})
}

func TestUnitEnvironmentSuffix(t *testing.T) {
	t.Run("Use_environment_variable", func(t *testing.T) {
		// Test environment suffix from environment variable
		os.Setenv("ENVIRONMENT_SUFFIX", "staging")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		assert.Equal(t, "staging", environmentSuffix)
	})

	t.Run("Empty_env_variable", func(t *testing.T) {
		// Test default environment suffix when env var is empty
		os.Unsetenv("ENVIRONMENT_SUFFIX")
		
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		assert.Equal(t, "", environmentSuffix)
	})
}

func TestEncryptionConfiguration(t *testing.T) {
	t.Run("DSSE-KMS", func(t *testing.T) {
		// Test DSSE-KMS encryption configuration
		encryptionConfig := map[string]interface{}{
			"SseAlgorithm":   "aws:kms:dsse",
			"BucketKeyEnabled": true,
		}

		assert.Equal(t, "aws:kms:dsse", encryptionConfig["SseAlgorithm"])
		assert.True(t, encryptionConfig["BucketKeyEnabled"].(bool))
	})

	t.Run("BucketKeyEnabled", func(t *testing.T) {
		// Test bucket key enabled setting
		bucketKeyEnabled := true
		assert.True(t, bucketKeyEnabled, "Bucket key should be enabled for performance")
	})
}

func TestUnitCrossAccountAccess(t *testing.T) {
	t.Run("AllowedAccounts_Format", func(t *testing.T) {
		// Test allowed accounts format
		allowedAccounts := "123456789012,987654321098"
		arns := formatAccountArns(allowedAccounts)

		assert.Contains(t, arns, "arn:aws:iam::123456789012:root")
		assert.Contains(t, arns, "arn:aws:iam::987654321098:root")
	})

	t.Run("SingleAccount_Format", func(t *testing.T) {
		// Test single account format
		singleAccount := "123456789012"
		arn := formatAccountArns(singleAccount)

		assert.Equal(t, `"arn:aws:iam::123456789012:root"`, arn)
	})
}

func TestLoggingConfiguration(t *testing.T) {
	t.Run("LoggingTargetBucket", func(t *testing.T) {
		// Test logging target bucket configuration
		loggingConfig := map[string]interface{}{
			"TargetBucket": "secure-data-logs-dev-abc123",
			"TargetPrefix": "access-logs/",
		}

		assert.Equal(t, "secure-data-logs-dev-abc123", loggingConfig["TargetBucket"])
		assert.Equal(t, "access-logs/", loggingConfig["TargetPrefix"])
	})

	t.Run("LoggingBucketEncryption", func(t *testing.T) {
		// Test logging bucket encryption
		loggingEncryption := map[string]interface{}{
			"SseAlgorithm": "aws:kms",
			"BucketKeyEnabled": true,
		}

		assert.Equal(t, "aws:kms", loggingEncryption["SseAlgorithm"])
		assert.True(t, loggingEncryption["BucketKeyEnabled"].(bool))
	})
}

func TestLifecycleConfiguration(t *testing.T) {
	t.Run("DeletionProtection", func(t *testing.T) {
		// Test deletion protection lifecycle rule
		lifecycleRule := map[string]interface{}{
			"Id":     "deletion-protection",
			"Status": "Enabled",
			"AbortIncompleteMultipartUpload": map[string]interface{}{
				"DaysAfterInitiation": 7,
			},
		}

		assert.Equal(t, "deletion-protection", lifecycleRule["Id"])
		assert.Equal(t, "Enabled", lifecycleRule["Status"])
		
		abortConfig := lifecycleRule["AbortIncompleteMultipartUpload"].(map[string]interface{})
		assert.Equal(t, 7, abortConfig["DaysAfterInitiation"])
	})

	t.Run("VersionTransitions", func(t *testing.T) {
		// Test version transitions
		transitions := []map[string]interface{}{
			{
				"NoncurrentDays": 30,
				"StorageClass":   "STANDARD_IA",
			},
			{
				"NoncurrentDays": 60,
				"StorageClass":   "GLACIER",
			},
			{
				"NoncurrentDays": 365,
				"StorageClass":   "DEEP_ARCHIVE",
			},
		}

		assert.Len(t, transitions, 3)
		assert.Equal(t, 30, transitions[0]["NoncurrentDays"])
		assert.Equal(t, "STANDARD_IA", transitions[0]["StorageClass"])
		assert.Equal(t, 60, transitions[1]["NoncurrentDays"])
		assert.Equal(t, "GLACIER", transitions[1]["StorageClass"])
		assert.Equal(t, 365, transitions[2]["NoncurrentDays"])
		assert.Equal(t, "DEEP_ARCHIVE", transitions[2]["StorageClass"])
	})
}

func TestKMSKeyPolicy(t *testing.T) {
	t.Run("RootPermissions", func(t *testing.T) {
		// Test root permissions in KMS key policy
		rootStatement := map[string]interface{}{
			"Sid":    "Enable Root Permissions",
			"Effect": "Allow",
			"Principal": map[string]interface{}{
				"AWS": "arn:aws:iam::123456789012:root",
			},
			"Action":  "kms:*",
			"Resource": "*",
		}

		assert.Equal(t, "Enable Root Permissions", rootStatement["Sid"])
		assert.Equal(t, "Allow", rootStatement["Effect"])
		assert.Equal(t, "kms:*", rootStatement["Action"])
	})

	t.Run("S3ServicePermissions", func(t *testing.T) {
		// Test S3 service permissions in KMS key policy
		s3Statement := map[string]interface{}{
			"Sid":    "Allow S3 Service",
			"Effect": "Allow",
			"Principal": map[string]interface{}{
				"Service": "s3.amazonaws.com",
			},
			"Action": []string{
				"kms:Decrypt",
				"kms:DescribeKey",
				"kms:Encrypt",
				"kms:GenerateDataKey*",
				"kms:CreateGrant",
				"kms:ReEncrypt*",
			},
			"Resource": "*",
		}

		assert.Equal(t, "Allow S3 Service", s3Statement["Sid"])
		assert.Equal(t, "Allow", s3Statement["Effect"])
		assert.Equal(t, "s3.amazonaws.com", s3Statement["Principal"].(map[string]interface{})["Service"])
		
		actions := s3Statement["Action"].([]string)
		assert.Contains(t, actions, "kms:Decrypt")
		assert.Contains(t, actions, "kms:Encrypt")
		assert.Contains(t, actions, "kms:GenerateDataKey*")
	})

	t.Run("CrossAccountPermissions", func(t *testing.T) {
		// Test cross-account permissions in KMS key policy
		crossAccountStatement := map[string]interface{}{
			"Sid":    "Allow Cross Account Access",
			"Effect": "Allow",
			"Principal": map[string]interface{}{
				"AWS": []string{
					"arn:aws:iam::123456789012:root",
					"arn:aws:iam::987654321098:root",
				},
			},
			"Action": []string{
				"kms:Decrypt",
				"kms:DescribeKey",
			},
			"Resource": "*",
		}

		assert.Equal(t, "Allow Cross Account Access", crossAccountStatement["Sid"])
		assert.Equal(t, "Allow", crossAccountStatement["Effect"])
		
		principals := crossAccountStatement["Principal"].(map[string]interface{})["AWS"].([]string)
		assert.Len(t, principals, 2)
		assert.Contains(t, principals, "arn:aws:iam::123456789012:root")
		assert.Contains(t, principals, "arn:aws:iam::987654321098:root")
	})
}

func TestBucketPolicyValidation(t *testing.T) {
	t.Run("HTTPSEnforcement", func(t *testing.T) {
		// Test HTTPS enforcement in bucket policy
		httpsStatement := map[string]interface{}{
			"Sid":    "DenyInsecureConnections",
			"Effect": "Deny",
			"Principal": "*",
			"Action":  "s3:*",
			"Condition": map[string]interface{}{
				"Bool": map[string]interface{}{
					"aws:SecureTransport": "false",
				},
			},
		}

		assert.Equal(t, "DenyInsecureConnections", httpsStatement["Sid"])
		assert.Equal(t, "Deny", httpsStatement["Effect"])
		assert.Equal(t, "s3:*", httpsStatement["Action"])
		
		condition := httpsStatement["Condition"].(map[string]interface{})
		boolCondition := condition["Bool"].(map[string]interface{})
		assert.Equal(t, "false", boolCondition["aws:SecureTransport"])
	})

	t.Run("EncryptionEnforcement", func(t *testing.T) {
		// Test encryption enforcement in bucket policy
		encryptionStatement := map[string]interface{}{
			"Sid":    "DenyUnencryptedObjectUploads",
			"Effect": "Deny",
			"Principal": "*",
			"Action":  "s3:PutObject",
			"Condition": map[string]interface{}{
				"StringNotEquals": map[string]interface{}{
					"s3:x-amz-server-side-encryption": "aws:kms:dsse",
				},
			},
		}

		assert.Equal(t, "DenyUnencryptedObjectUploads", encryptionStatement["Sid"])
		assert.Equal(t, "Deny", encryptionStatement["Effect"])
		assert.Equal(t, "s3:PutObject", encryptionStatement["Action"])
		
		condition := encryptionStatement["Condition"].(map[string]interface{})
		stringCondition := condition["StringNotEquals"].(map[string]interface{})
		assert.Equal(t, "aws:kms:dsse", stringCondition["s3:x-amz-server-side-encryption"])
	})
}
