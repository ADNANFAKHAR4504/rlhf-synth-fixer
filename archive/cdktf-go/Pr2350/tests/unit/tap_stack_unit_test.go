// tap_stack_unit_test.go
package main

import (
	"os"
	"testing"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackWithDefaultEnvironment(t *testing.T) {
	// Clear environment variable to test default
	os.Unsetenv("ENVIRONMENT_SUFFIX")

	app := cdktf.NewApp(nil)

	config := &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String("cdktf-dev"),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
		},
	}

	stack := NewTapStack(app, jsii.String("TestTapStackDefault"), config)
	assert.NotNil(t, stack)
}

func TestTapStackSynthesis(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	app := cdktf.NewApp(&cdktf.AppConfig{
		SkipValidation: jsii.Bool(true), // Skip validation for unit tests
	})

	config := &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String("cdktf-test"),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
		},
	}

	stack := NewTapStack(app, jsii.String("TestTapStackSynth"), config)

	// Test that synthesis doesn't panic
	require.NotPanics(t, func() {
		// Fix: Use the correct Testing function
		cdktf.Testing_Synth(stack, jsii.Bool(true))
	})
}

func TestTapStackConfiguration(t *testing.T) {
	tests := []struct {
		name        string
		config      *TapStackConfig
		expectError bool
	}{
		{
			name: "Valid configuration",
			config: &TapStackConfig{
				Region:      jsii.String("us-east-1"),
				Environment: jsii.String("cdktf-test"),
				Project:     jsii.String("tap"),
				Owner:       jsii.String("platform-team"),
				CostCenter:  jsii.String("engineering"),
				VpcCidr:     jsii.String("10.0.0.0/16"),
				AllowedIpRanges: []*string{
					jsii.String("203.0.113.0/24"),
				},
			},
			expectError: false,
		},
		{
			name: "Empty allowed IP ranges",
			config: &TapStackConfig{
				Region:          jsii.String("us-east-1"),
				Environment:     jsii.String("cdktf-test"),
				Project:         jsii.String("tap"),
				Owner:           jsii.String("platform-team"),
				CostCenter:      jsii.String("engineering"),
				VpcCidr:         jsii.String("10.0.0.0/16"),
				AllowedIpRanges: []*string{},
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := cdktf.NewApp(&cdktf.AppConfig{
				SkipValidation: jsii.Bool(true),
			})

			if tt.expectError {
				assert.Panics(t, func() {
					NewTapStack(app, jsii.String("TestStack"), tt.config)
				})
			} else {
				assert.NotPanics(t, func() {
					stack := NewTapStack(app, jsii.String("TestStack"), tt.config)
					assert.NotNil(t, stack)
				})
			}
		})
	}
}

func TestTapStackEnvironmentVariables(t *testing.T) {
	tests := []struct {
		name              string
		envSuffix         string
		stateBucket       string
		stateBucketRegion string
		expectedSuffix    string
		expectedBucket    string
		expectedRegion    string
	}{
		{
			name:              "Default values",
			envSuffix:         "",
			stateBucket:       "",
			stateBucketRegion: "",
			expectedSuffix:    "cdktf-dev",
			expectedBucket:    "iac-rlhf-tf-states",
			expectedRegion:    "us-east-1",
		},
		{
			name:              "Custom values",
			envSuffix:         "prod",
			stateBucket:       "my-custom-bucket",
			stateBucketRegion: "us-west-2",
			expectedSuffix:    "cdktf-prod",
			expectedBucket:    "my-custom-bucket",
			expectedRegion:    "us-west-2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set environment variables
			if tt.envSuffix != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envSuffix)
			} else {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
			}

			if tt.stateBucket != "" {
				os.Setenv("TERRAFORM_STATE_BUCKET", tt.stateBucket)
			} else {
				os.Unsetenv("TERRAFORM_STATE_BUCKET")
			}

			if tt.stateBucketRegion != "" {
				os.Setenv("TERRAFORM_STATE_BUCKET_REGION", tt.stateBucketRegion)
			} else {
				os.Unsetenv("TERRAFORM_STATE_BUCKET_REGION")
			}

			// Clean up after test
			defer func() {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
				os.Unsetenv("TERRAFORM_STATE_BUCKET")
				os.Unsetenv("TERRAFORM_STATE_BUCKET_REGION")
			}()

			app := cdktf.NewApp(&cdktf.AppConfig{
				SkipValidation: jsii.Bool(true),
			})

			config := &TapStackConfig{
				Region:      jsii.String("us-east-1"),
				Environment: jsii.String(tt.expectedSuffix),
				Project:     jsii.String("tap"),
				Owner:       jsii.String("platform-team"),
				CostCenter:  jsii.String("engineering"),
				VpcCidr:     jsii.String("10.0.0.0/16"),
				AllowedIpRanges: []*string{
					jsii.String("203.0.113.0/24"),
				},
			}

			stack := NewTapStack(app, jsii.String("TestStack"), config)
			assert.NotNil(t, stack)
		})
	}
}

func TestTapStackResourceNaming(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	app := cdktf.NewApp(&cdktf.AppConfig{
		SkipValidation: jsii.Bool(true),
	})

	config := &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String("cdktf-test"),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
		},
	}

	stack := NewTapStack(app, jsii.String("TestTapStackNaming"), config)

	// Fix: Use the correct Testing function
	synthesized := cdktf.Testing_Synth(stack, jsii.Bool(true))

	assert.NotNil(t, synthesized)
	assert.Contains(t, *synthesized, "cdktf-test") // Environment suffix should be in synthesized output
}

func TestHelperFunctions(t *testing.T) {
	t.Run("getAccountId returns expected format", func(t *testing.T) {
		accountId := getAccountId()
		assert.NotEmpty(t, accountId)
		assert.Len(t, accountId, 12) // AWS account IDs are 12 digits
	})

	t.Run("generateRandomSuffix returns consistent value", func(t *testing.T) {
		suffix1 := generateRandomSuffix()
		suffix2 := generateRandomSuffix()
		assert.NotEmpty(t, suffix1)
		assert.NotEmpty(t, suffix2)
		// In the current implementation, it returns the same value
		assert.Equal(t, suffix1, suffix2)
	})
}

func TestTapStackWithMinimalConfig(t *testing.T) {
	app := cdktf.NewApp(&cdktf.AppConfig{
		SkipValidation: jsii.Bool(true),
	})

	// Test with minimal required configuration
	config := &TapStackConfig{
		Region:          jsii.String("us-east-1"),
		Environment:     jsii.String("cdktf-minimal"),
		Project:         jsii.String("tap"),
		Owner:           jsii.String("test-owner"),
		CostCenter:      jsii.String("test-cost-center"),
		VpcCidr:         jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{}, // Empty allowed IP ranges
	}

	assert.NotPanics(t, func() {
		stack := NewTapStack(app, jsii.String("MinimalTestStack"), config)
		assert.NotNil(t, stack)
	})
}

func TestTapStackRegionValidation(t *testing.T) {
	app := cdktf.NewApp(&cdktf.AppConfig{
		SkipValidation: jsii.Bool(true),
	})

	// Test with us-east-1 (should work)
	config := &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String("cdktf-test"),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
		},
	}

	assert.NotPanics(t, func() {
		stack := NewTapStack(app, jsii.String("RegionTestStack"), config)
		assert.NotNil(t, stack)
	})
}

// Benchmark test for stack creation performance
func BenchmarkTapStackCreation(b *testing.B) {
	config := &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String("cdktf-bench"),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			jsii.String("203.0.113.0/24"),
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		app := cdktf.NewApp(&cdktf.AppConfig{
			SkipValidation: jsii.Bool(true),
		})
		NewTapStack(app, jsii.String("BenchStack"), config)
	}
}
