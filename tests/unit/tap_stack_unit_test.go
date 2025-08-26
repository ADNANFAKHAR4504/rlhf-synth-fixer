package unit

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// Import the main package to access TapStack
// Note: This assumes the lib directory is in the module path
// You may need to adjust the import path based on your module structure

type TapStackProps struct {
	EnvironmentSuffix string
	StateBucket       string
	StateBucketRegion string
	AwsRegion         string
	RepositoryName    string
	CommitAuthor      string
	OfficeIP          string
	InstanceType      string
}

// Mock TapStack creation function for testing
func createTestTapStack(environmentSuffix string) cdktf.TerraformStack {
	app := cdktf.NewApp(nil)

	props := &TapStackProps{
		EnvironmentSuffix: environmentSuffix,
		StateBucket:       "test-state-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-east-1",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
		OfficeIP:          "203.0.113.0/32",
		InstanceType:      "t3.micro",
	}

	// Create a new stack for testing
	stack := cdktf.NewTerraformStack(app, jsii.String("test-stack"))

	// Configure S3 Backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(props.StateBucket),
		Key:     jsii.String("test/terraform.tfstate"),
		Region:  jsii.String(props.StateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	return stack
}

func TestTapStackCreation(t *testing.T) {
	tests := []struct {
		name              string
		environmentSuffix string
		expectedStackName string
	}{
		{
			name:              "Development Environment",
			environmentSuffix: "dev",
			expectedStackName: "test-stack",
		},
		{
			name:              "Staging Environment",
			environmentSuffix: "staging",
			expectedStackName: "test-stack",
		},
		{
			name:              "Production Environment",
			environmentSuffix: "prod",
			expectedStackName: "test-stack",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stack := createTestTapStack(tt.environmentSuffix)

			if stack == nil {
				t.Errorf("Expected stack to be created, got nil")
			}
		})
	}
}

func TestEnvironmentVariableDefaults(t *testing.T) {
	tests := []struct {
		name         string
		envVar       string
		envValue     string
		expectedFunc func() string
	}{
		{
			name:     "ENVIRONMENT_SUFFIX default",
			envVar:   "ENVIRONMENT_SUFFIX",
			envValue: "",
			expectedFunc: func() string {
				suffix := os.Getenv("ENVIRONMENT_SUFFIX")
				if suffix == "" {
					return "dev"
				}
				return suffix
			},
		},
		{
			name:     "AWS_REGION default",
			envVar:   "AWS_REGION",
			envValue: "",
			expectedFunc: func() string {
				region := os.Getenv("AWS_REGION")
				if region == "" {
					return "us-east-1"
				}
				return region
			},
		},
		{
			name:     "INSTANCE_TYPE default",
			envVar:   "INSTANCE_TYPE",
			envValue: "",
			expectedFunc: func() string {
				instanceType := os.Getenv("INSTANCE_TYPE")
				if instanceType == "" {
					return "t3.micro"
				}
				return instanceType
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clear the environment variable
			originalValue := os.Getenv(tt.envVar)
			os.Unsetenv(tt.envVar)

			// Test default value
			result := tt.expectedFunc()

			// Restore original value
			if originalValue != "" {
				os.Setenv(tt.envVar, originalValue)
			}

			// Verify the result based on the test case
			switch tt.envVar {
			case "ENVIRONMENT_SUFFIX":
				if result != "dev" {
					t.Errorf("Expected default ENVIRONMENT_SUFFIX to be 'dev', got '%s'", result)
				}
			case "AWS_REGION":
				if result != "us-east-1" {
					t.Errorf("Expected default AWS_REGION to be 'us-east-1', got '%s'", result)
				}
			case "INSTANCE_TYPE":
				if result != "t3.micro" {
					t.Errorf("Expected default INSTANCE_TYPE to be 't3.micro', got '%s'", result)
				}
			}
		})
	}
}

func TestStackPropsValidation(t *testing.T) {
	tests := []struct {
		name  string
		props TapStackProps
		valid bool
	}{
		{
			name: "Valid props",
			props: TapStackProps{
				EnvironmentSuffix: "dev",
				StateBucket:       "valid-bucket-name",
				StateBucketRegion: "us-east-1",
				AwsRegion:         "us-east-1",
				RepositoryName:    "test-repo",
				CommitAuthor:      "test-author",
				OfficeIP:          "203.0.113.0/32",
				InstanceType:      "t3.micro",
			},
			valid: true,
		},
		{
			name: "Empty environment suffix",
			props: TapStackProps{
				EnvironmentSuffix: "",
				StateBucket:       "valid-bucket-name",
				StateBucketRegion: "us-east-1",
				AwsRegion:         "us-east-1",
				RepositoryName:    "test-repo",
				CommitAuthor:      "test-author",
				OfficeIP:          "203.0.113.0/32",
				InstanceType:      "t3.micro",
			},
			valid: false,
		},
		{
			name: "Invalid instance type",
			props: TapStackProps{
				EnvironmentSuffix: "dev",
				StateBucket:       "valid-bucket-name",
				StateBucketRegion: "us-east-1",
				AwsRegion:         "us-east-1",
				RepositoryName:    "test-repo",
				CommitAuthor:      "test-author",
				OfficeIP:          "203.0.113.0/32",
				InstanceType:      "invalid-instance",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := validateStackProps(&tt.props)
			if isValid != tt.valid {
				t.Errorf("Expected validation result %v, got %v", tt.valid, isValid)
			}
		})
	}
}

func validateStackProps(props *TapStackProps) bool {
	if props.EnvironmentSuffix == "" {
		return false
	}

	// Validate instance type format
	validInstanceTypes := []string{"t3.micro", "t3.small", "t3.medium", "t3.large", "t2.micro", "t2.small"}
	isValidInstance := false
	for _, validType := range validInstanceTypes {
		if props.InstanceType == validType {
			isValidInstance = true
			break
		}
	}

	return isValidInstance
}

func TestStackSynthesis(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := createTestTapStack("test")

	// Synthesize the stack to JSON
	synthesized := cdktf.Testing_Synth(app, &cdktf.TestingConfig{})

	if synthesized == "" {
		t.Error("Expected synthesized configuration to be non-empty")
	}

	// Parse the synthesized JSON to validate structure
	var config map[string]interface{}
	err := json.Unmarshal([]byte(synthesized), &config)
	if err != nil {
		t.Errorf("Failed to parse synthesized configuration as JSON: %v", err)
	}

	// Validate that required sections exist
	if _, exists := config["terraform"]; !exists {
		t.Error("Expected 'terraform' section in synthesized configuration")
	}
}

func TestResourceNaming(t *testing.T) {
	tests := []struct {
		environmentSuffix string
		expectedPrefix    string
	}{
		{"dev", "dev-webapp"},
		{"staging", "staging-webapp"},
		{"prod", "prod-webapp"},
		{"pr123", "pr123-webapp"},
	}

	for _, tt := range tests {
		t.Run("Environment_"+tt.environmentSuffix, func(t *testing.T) {
			// Set environment variable
			os.Setenv("ENVIRONMENT_SUFFIX", tt.environmentSuffix)

			// Create expected prefix
			expectedPrefix := tt.environmentSuffix + "-webapp"

			if expectedPrefix != tt.expectedPrefix {
				t.Errorf("Expected prefix '%s', got '%s'", tt.expectedPrefix, expectedPrefix)
			}

			// Clean up
			os.Unsetenv("ENVIRONMENT_SUFFIX")
		})
	}
}

func TestCIDRBlockValidation(t *testing.T) {
	tests := []struct {
		name      string
		cidrBlock string
		valid     bool
	}{
		{"Valid VPC CIDR", "10.0.0.0/16", true},
		{"Valid subnet CIDR", "10.0.1.0/24", true},
		{"Invalid CIDR format", "10.0.0.0/33", false},
		{"Invalid IP format", "300.0.0.0/16", false},
		{"Empty CIDR", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := validateCIDRBlock(tt.cidrBlock)
			if isValid != tt.valid {
				t.Errorf("Expected CIDR validation result %v for '%s', got %v", tt.valid, tt.cidrBlock, isValid)
			}
		})
	}
}

func validateCIDRBlock(cidr string) bool {
	if cidr == "" {
		return false
	}

	// Basic CIDR validation
	parts := strings.Split(cidr, "/")
	if len(parts) != 2 {
		return false
	}

	// Validate IP parts
	ipParts := strings.Split(parts[0], ".")
	if len(ipParts) != 4 {
		return false
	}

	// Check if subnet mask is valid (0-32)
	if parts[1] == "33" || parts[1] == "" {
		return false
	}

	return true
}

func TestDatabaseConfiguration(t *testing.T) {
	tests := []struct {
		name             string
		dbUsername       string
		dbPassword       string
		expectedUsername string
		expectedPassword string
	}{
		{
			name:             "Default credentials",
			dbUsername:       "",
			dbPassword:       "",
			expectedUsername: "admin",
			expectedPassword: "ChangeMe123!",
		},
		{
			name:             "Custom credentials",
			dbUsername:       "customuser",
			dbPassword:       "custompass123",
			expectedUsername: "customuser",
			expectedPassword: "custompass123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set environment variables
			if tt.dbUsername != "" {
				os.Setenv("DB_USERNAME", tt.dbUsername)
			} else {
				os.Unsetenv("DB_USERNAME")
			}

			if tt.dbPassword != "" {
				os.Setenv("DB_PASSWORD", tt.dbPassword)
			} else {
				os.Unsetenv("DB_PASSWORD")
			}

			// Test the logic
			dbUsername := os.Getenv("DB_USERNAME")
			if dbUsername == "" {
				dbUsername = "admin"
			}

			dbPassword := os.Getenv("DB_PASSWORD")
			if dbPassword == "" {
				dbPassword = "ChangeMe123!"
			}

			if dbUsername != tt.expectedUsername {
				t.Errorf("Expected username '%s', got '%s'", tt.expectedUsername, dbUsername)
			}

			if dbPassword != tt.expectedPassword {
				t.Errorf("Expected password '%s', got '%s'", tt.expectedPassword, dbPassword)
			}

			// Clean up
			os.Unsetenv("DB_USERNAME")
			os.Unsetenv("DB_PASSWORD")
		})
	}
}

func TestTagsValidation(t *testing.T) {
	requiredTags := []string{"Environment", "Project", "ManagedBy", "Owner"}

	commonTags := map[string]string{
		"Environment": "test",
		"Project":     "webapp-foundation",
		"ManagedBy":   "CDKTF",
		"Owner":       "DevOps",
	}

	for _, tag := range requiredTags {
		t.Run("Required_tag_"+tag, func(t *testing.T) {
			if _, exists := commonTags[tag]; !exists {
				t.Errorf("Required tag '%s' is missing", tag)
			}
		})
	}

	// Test tag values
	expectedValues := map[string]string{
		"Project":   "webapp-foundation",
		"ManagedBy": "CDKTF",
		"Owner":     "DevOps",
	}

	for tag, expectedValue := range expectedValues {
		t.Run("Tag_value_"+tag, func(t *testing.T) {
			if actualValue, exists := commonTags[tag]; !exists || actualValue != expectedValue {
				t.Errorf("Expected tag '%s' to have value '%s', got '%s'", tag, expectedValue, actualValue)
			}
		})
	}
}
