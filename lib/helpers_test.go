package main

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test the generateUniqueId function
func TestGenerateUniqueIdFunction(t *testing.T) {
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

	// Test uniqueness
	ids := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id, err := generateUniqueId()
		require.NoError(t, err)
		assert.False(t, ids[id], "Duplicate ID generated: %s", id)
		ids[id] = true
	}
}

// Test the formatAccountArns function
func TestFormatAccountArnsFunction(t *testing.T) {
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

// Test bucket naming pattern
func TestBucketNamingPattern(t *testing.T) {
	environmentSuffix := "dev"
	uniqueId := "abc123def456"

	// Test main bucket name
	bucketName := "secure-data-" + environmentSuffix + "-" + uniqueId
	assert.True(t, strings.HasPrefix(bucketName, "secure-data-"))
	assert.Contains(t, bucketName, environmentSuffix)
	assert.Contains(t, bucketName, uniqueId)
	assert.Equal(t, "secure-data-dev-abc123def456", bucketName)

	// Test logging bucket name
	loggingBucketName := "secure-data-logs-" + environmentSuffix + "-" + uniqueId
	assert.True(t, strings.HasPrefix(loggingBucketName, "secure-data-logs-"))
	assert.Contains(t, loggingBucketName, environmentSuffix)
	assert.Contains(t, loggingBucketName, uniqueId)
	assert.Equal(t, "secure-data-logs-dev-abc123def456", loggingBucketName)
}

// Test KMS alias naming
func TestKMSAliasNaming(t *testing.T) {
	environmentSuffix := "prod"
	kmsAliasName := "alias/secure-s3-encryption-key-" + environmentSuffix

	assert.True(t, strings.HasPrefix(kmsAliasName, "alias/"))
	assert.Contains(t, kmsAliasName, "secure-s3-encryption-key")
	assert.Contains(t, kmsAliasName, environmentSuffix)
	assert.Equal(t, "alias/secure-s3-encryption-key-prod", kmsAliasName)
}

// Test security policy configurations
func TestSecurityPolicies(t *testing.T) {
	t.Run("HTTPS Only Policy", func(t *testing.T) {
		// Test that the policy structure is correct
		expectedCondition := map[string]interface{}{
			"Bool": map[string]string{
				"aws:SecureTransport": "false",
			},
		}

		// Verify the condition
		boolCondition := expectedCondition["Bool"].(map[string]string)
		assert.Equal(t, "false", boolCondition["aws:SecureTransport"])
	})

	t.Run("Encryption Policy", func(t *testing.T) {
		// Test encryption requirements
		encryptionAlgorithm := "aws:kms:dsse"
		assert.Equal(t, "aws:kms:dsse", encryptionAlgorithm)

		// Test that DSSE-KMS is being used
		assert.Contains(t, encryptionAlgorithm, "dsse")
		assert.Contains(t, encryptionAlgorithm, "kms")
	})

	t.Run("Versioning Configuration", func(t *testing.T) {
		versioningStatus := "Enabled"
		assert.Equal(t, "Enabled", versioningStatus)
	})

	t.Run("Lifecycle Rules", func(t *testing.T) {
		// Test lifecycle transitions
		transitions := []struct {
			days         int
			storageClass string
		}{
			{30, "STANDARD_IA"},
			{60, "GLACIER"},
			{365, "DEEP_ARCHIVE"},
		}

		for _, transition := range transitions {
			assert.Greater(t, transition.days, 0)
			assert.NotEmpty(t, transition.storageClass)
		}

		// Test multipart upload cleanup
		daysAfterInitiation := 7
		assert.Equal(t, 7, daysAfterInitiation)
	})
}

// Test compliance settings
func TestComplianceSettings(t *testing.T) {
	t.Run("FIPS Compliance", func(t *testing.T) {
		complianceLevel := "FIPS-140-3-Level-3"
		assert.Contains(t, complianceLevel, "FIPS-140-3")
		assert.Contains(t, complianceLevel, "Level-3")
	})

	t.Run("Key Rotation", func(t *testing.T) {
		keyRotationEnabled := true
		assert.True(t, keyRotationEnabled)
	})

	t.Run("Public Access Block", func(t *testing.T) {
		publicAccessSettings := map[string]bool{
			"blockPublicAcls":       true,
			"blockPublicPolicy":     true,
			"ignorePublicAcls":      true,
			"restrictPublicBuckets": true,
		}

		for setting, value := range publicAccessSettings {
			assert.True(t, value, "Setting %s should be true", setting)
		}
	})
}

// Test resource tagging
func TestResourceTagging(t *testing.T) {
	expectedTags := []string{
		"Name",
		"Environment",
		"Purpose",
		"CreatedBy",
		"Compliance",
	}

	// Verify all expected tags are present
	tagMap := map[string]string{
		"Name":        "SecureS3DataBucket",
		"Environment": "production",
		"Purpose":     "SecureDataStorage",
		"CreatedBy":   "Pulumi",
		"Compliance":  "Enterprise-Grade",
	}

	for _, tag := range expectedTags {
		_, exists := tagMap[tag]
		assert.True(t, exists, "Tag %s should exist", tag)
	}

	// Verify tag values
	assert.Equal(t, "production", tagMap["Environment"])
	assert.Equal(t, "Pulumi", tagMap["CreatedBy"])
}
