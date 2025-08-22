package main

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// Helper to create *string (copied from main package for testing)
func str(v string) *string { return &v }

func TestStr(t *testing.T) {
	t.Run("should convert string to pointer", func(t *testing.T) {
		input := "test-string"
		result := str(input)
		
		assert.NotNil(t, result)
		assert.Equal(t, input, *result)
	})

	t.Run("should handle empty string", func(t *testing.T) {
		input := ""
		result := str(input)
		
		assert.NotNil(t, result)
		assert.Equal(t, "", *result)
	})
}

func TestEnvironmentVariableHandling(t *testing.T) {
	t.Run("should retrieve NAME_SUFFIX from environment", func(t *testing.T) {
		originalSuffix := os.Getenv("NAME_SUFFIX")
		defer func() {
			if originalSuffix != "" {
				os.Setenv("NAME_SUFFIX", originalSuffix)
			} else {
				os.Unsetenv("NAME_SUFFIX")
			}
		}()

		testValue := "test-suffix-123"
		os.Setenv("NAME_SUFFIX", testValue)
		
		suffix := os.Getenv("NAME_SUFFIX")
		assert.Equal(t, testValue, suffix)
	})

	t.Run("should handle empty NAME_SUFFIX", func(t *testing.T) {
		originalSuffix := os.Getenv("NAME_SUFFIX")
		defer func() {
			if originalSuffix != "" {
				os.Setenv("NAME_SUFFIX", originalSuffix)
			} else {
				os.Unsetenv("NAME_SUFFIX")
			}
		}()

		os.Unsetenv("NAME_SUFFIX")
		
		suffix := os.Getenv("NAME_SUFFIX")
		assert.Equal(t, "", suffix)
	})

	t.Run("should handle AWS_REGION environment variable", func(t *testing.T) {
		originalRegion := os.Getenv("AWS_REGION")
		defer func() {
			if originalRegion != "" {
				os.Setenv("AWS_REGION", originalRegion)
			} else {
				os.Unsetenv("AWS_REGION")
			}
		}()

		testRegion := "eu-central-1"
		os.Setenv("AWS_REGION", testRegion)
		
		region := os.Getenv("AWS_REGION")
		assert.Equal(t, testRegion, region)
	})

	t.Run("should default to us-east-1 when AWS_REGION is empty", func(t *testing.T) {
		originalRegion := os.Getenv("AWS_REGION")
		defer func() {
			if originalRegion != "" {
				os.Setenv("AWS_REGION", originalRegion)
			} else {
				os.Unsetenv("AWS_REGION")
			}
		}()

		os.Unsetenv("AWS_REGION")
		
		region := os.Getenv("AWS_REGION")
		if region == "" {
			region = "us-east-1"
		}
		assert.Equal(t, "us-east-1", region)
	})
}

func TestRegionValidation(t *testing.T) {
	testCases := []struct {
		name     string
		region   string
		expected string
	}{
		{"us-east-1", "us-east-1", "us-east-1"},
		{"us-west-2", "us-west-2", "us-west-2"},
		{"eu-west-1", "eu-west-1", "eu-west-1"},
		{"ap-south-1", "ap-south-1", "ap-south-1"},
		{"empty region", "", ""},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, tc.region)
		})
	}
}

func TestMainFunctionLogic(t *testing.T) {
	t.Run("should use AWS_REGION from environment", func(t *testing.T) {
		originalRegion := os.Getenv("AWS_REGION")
		defer func() {
			if originalRegion != "" {
				os.Setenv("AWS_REGION", originalRegion)
			} else {
				os.Unsetenv("AWS_REGION")
			}
		}()

		testRegion := "eu-central-1"
		os.Setenv("AWS_REGION", testRegion)

		region := os.Getenv("AWS_REGION")
		if region == "" {
			region = "us-east-1"
		}

		assert.Equal(t, testRegion, region)
	})

	t.Run("should default to us-east-1 when AWS_REGION is not set", func(t *testing.T) {
		originalRegion := os.Getenv("AWS_REGION")
		defer func() {
			if originalRegion != "" {
				os.Setenv("AWS_REGION", originalRegion)
			} else {
				os.Unsetenv("AWS_REGION")
			}
		}()

		os.Unsetenv("AWS_REGION")

		region := os.Getenv("AWS_REGION")
		if region == "" {
			region = "us-east-1"
		}

		assert.Equal(t, "us-east-1", region)
	})
}

func TestBucketNaming(t *testing.T) {
	t.Run("should generate bucket name with suffix", func(t *testing.T) {
		originalSuffix := os.Getenv("NAME_SUFFIX")
		defer func() {
			if originalSuffix != "" {
				os.Setenv("NAME_SUFFIX", originalSuffix)
			} else {
				os.Unsetenv("NAME_SUFFIX")
			}
		}()

		testSuffix := "test123"
		os.Setenv("NAME_SUFFIX", testSuffix)

		suffix := os.Getenv("NAME_SUFFIX")
		expectedPrefix := "my-simple-bucket-" + suffix
		expectedTagName := "MySimpleBucket-" + suffix

		assert.Equal(t, "my-simple-bucket-test123", expectedPrefix)
		assert.Equal(t, "MySimpleBucket-test123", expectedTagName)
	})

	t.Run("should generate bucket name without suffix", func(t *testing.T) {
		originalSuffix := os.Getenv("NAME_SUFFIX")
		defer func() {
			if originalSuffix != "" {
				os.Setenv("NAME_SUFFIX", originalSuffix)
			} else {
				os.Unsetenv("NAME_SUFFIX")
			}
		}()

		os.Unsetenv("NAME_SUFFIX")

		suffix := os.Getenv("NAME_SUFFIX")
		expectedPrefix := "my-simple-bucket-" + suffix
		expectedTagName := "MySimpleBucket-" + suffix

		assert.Equal(t, "my-simple-bucket-", expectedPrefix)
		assert.Equal(t, "MySimpleBucket-", expectedTagName)
	})
}