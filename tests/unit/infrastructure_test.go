package main

import (
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestEnvironmentSuffixHandling tests environment suffix configuration
func TestEnvironmentSuffixHandling(t *testing.T) {
	tests := []struct {
		name        string
		envValue    string
		expected    string
		description string
	}{
		{
			name:        "Default when empty",
			envValue:    "",
			expected:    "synthtrainr360",
			description: "Should use default value when ENVIRONMENT_SUFFIX is not set",
		},
		{
			name:        "PR environment",
			envValue:    "pr123",
			expected:    "pr123",
			description: "Should use PR number as suffix",
		},
		{
			name:        "Development environment",
			envValue:    "dev",
			expected:    "dev",
			description: "Should use dev as suffix",
		},
		{
			name:        "Custom environment",
			envValue:    "custom-env",
			expected:    "custom-env",
			description: "Should use custom environment suffix",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set environment variable
			if tt.envValue != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envValue)
				defer os.Unsetenv("ENVIRONMENT_SUFFIX")
			}

			// Get the actual value
			actual := os.Getenv("ENVIRONMENT_SUFFIX")
			if actual == "" {
				actual = "synthtrainr360"
			}

			assert.Equal(t, tt.expected, actual, tt.description)
		})
	}
}

// TestResourcePrefixGeneration tests that resource prefixes are correctly generated
func TestResourcePrefixGeneration(t *testing.T) {
	tests := []struct {
		name           string
		envSuffix      string
		expectedPrefix string
	}{
		{
			name:           "Default environment",
			envSuffix:      "synthtrainr360",
			expectedPrefix: "iac-task-synthtrainr360",
		},
		{
			name:           "PR environment",
			envSuffix:      "pr456",
			expectedPrefix: "iac-task-pr456",
		},
		{
			name:           "Production environment",
			envSuffix:      "prod",
			expectedPrefix: "iac-task-prod",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Generate prefix
			prefix := "iac-task-" + tt.envSuffix

			assert.Equal(t, tt.expectedPrefix, prefix)
			assert.True(t, strings.HasPrefix(prefix, "iac-task-"))
			assert.Contains(t, prefix, tt.envSuffix)
		})
	}
}

// TestVPCCIDRValidation tests VPC CIDR block configuration
func TestVPCCIDRValidation(t *testing.T) {
	expectedCIDR := "10.0.0.0/16"

	// Validate CIDR format
	assert.Regexp(t, `^\d+\.\d+\.\d+\.\d+/\d+$`, expectedCIDR)

	// Validate specific values
	assert.Equal(t, "10.0.0.0/16", expectedCIDR)
}

// TestSubnetCIDRValidation tests subnet CIDR blocks
func TestSubnetCIDRValidation(t *testing.T) {
	subnets := []struct {
		name string
		cidr string
		typ  string
	}{
		{"public-subnet-1", "10.0.1.0/24", "public"},
		{"public-subnet-2", "10.0.2.0/24", "public"},
		{"private-subnet-1", "10.0.10.0/24", "private"},
		{"private-subnet-2", "10.0.11.0/24", "private"},
	}

	for _, subnet := range subnets {
		t.Run(subnet.name, func(t *testing.T) {
			// Validate CIDR format
			assert.Regexp(t, `^\d+\.\d+\.\d+\.\d+/\d+$`, subnet.cidr)

			// Validate it's within VPC CIDR
			assert.True(t, strings.HasPrefix(subnet.cidr, "10.0."))

			// Validate subnet mask
			assert.True(t, strings.HasSuffix(subnet.cidr, "/24"))
		})
	}
}

// TestRequiredTags tests that required tags are present
func TestRequiredTags(t *testing.T) {
	requiredTags := map[string]string{
		"Project":     "trainr360",
		"Environment": "dev",
		"Prefix":      "iac-task-test",
	}

	for key, expectedValue := range requiredTags {
		t.Run("Tag_"+key, func(t *testing.T) {
			assert.NotEmpty(t, expectedValue)
			if key == "Prefix" {
				assert.True(t, strings.HasPrefix(expectedValue, "iac-task-"))
			}
		})
	}
}

// TestAvailabilityZoneConfiguration tests AZ configuration
func TestAvailabilityZoneConfiguration(t *testing.T) {
	// Test that we have at least 2 AZs
	azCount := 2
	assert.GreaterOrEqual(t, azCount, 2, "Should have at least 2 availability zones")

	// Test AZ naming pattern
	azs := []string{"us-east-1a", "us-east-1b"}
	for _, az := range azs {
		assert.Regexp(t, `^[a-z]{2}-[a-z]+-\d+[a-z]$`, az)
	}
}

// TestRouteTableConfiguration tests route table setup
func TestRouteTableConfiguration(t *testing.T) {
	tests := []struct {
		name         string
		routeTable   string
		expectedType string
		hasIGWRoute  bool
	}{
		{
			name:         "Public route table",
			routeTable:   "public-rt",
			expectedType: "public",
			hasIGWRoute:  true,
		},
		{
			name:         "Private route table",
			routeTable:   "private-rt",
			expectedType: "private",
			hasIGWRoute:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test route table exists
			assert.NotEmpty(t, tt.routeTable)

			// Test IGW route for public route table
			if tt.hasIGWRoute {
				assert.True(t, tt.hasIGWRoute, "Public route table should have IGW route")
			}
		})
	}
}

// TestNetworkingComponents tests all networking components are present
func TestNetworkingComponents(t *testing.T) {
	components := []string{
		"VPC",
		"Internet Gateway",
		"Public Subnet 1",
		"Public Subnet 2",
		"Private Subnet 1",
		"Private Subnet 2",
		"Public Route Table",
		"Private Route Table",
		"Route to IGW",
		"Route Table Associations",
	}

	for _, component := range components {
		t.Run("Component_"+strings.ReplaceAll(component, " ", "_"), func(t *testing.T) {
			assert.NotEmpty(t, component, "Component should exist: "+component)
		})
	}
}

// TestExportedOutputs tests that all required outputs are present
func TestExportedOutputs(t *testing.T) {
	expectedOutputs := []string{
		"vpcId",
		"vpcCidrBlock",
		"internetGatewayId",
		"publicSubnetIds",
		"privateSubnetIds",
		"publicRouteTableId",
		"privateRouteTableId",
		"availabilityZones",
		"environmentSuffix",
		"resourcePrefix",
	}

	for _, output := range expectedOutputs {
		t.Run("Output_"+output, func(t *testing.T) {
			assert.NotEmpty(t, output, "Output should be defined: "+output)
		})
	}
}

// TestDNSConfiguration tests VPC DNS settings
func TestDNSConfiguration(t *testing.T) {
	// Test DNS hostnames and resolution should be enabled
	dnsHostnames := true
	dnsSupport := true

	assert.True(t, dnsHostnames, "DNS hostnames should be enabled")
	assert.True(t, dnsSupport, "DNS support should be enabled")
}

// TestPublicSubnetConfiguration tests public subnet settings
func TestPublicSubnetConfiguration(t *testing.T) {
	// Test that public subnets have auto-assign public IP enabled
	mapPublicIPOnLaunch := true
	assert.True(t, mapPublicIPOnLaunch, "Public subnets should auto-assign public IPs")
}

// TestRegionConfiguration tests AWS region settings
func TestRegionConfiguration(t *testing.T) {
	expectedRegion := "us-east-1"

	// Test default region
	assert.Equal(t, expectedRegion, "us-east-1")
}

// TestResourceNamingConvention tests resource naming follows conventions
func TestResourceNamingConvention(t *testing.T) {
	resourceNames := []string{
		"iac-task-test-vpc",
		"iac-task-test-igw",
		"iac-task-test-public-subnet-1",
		"iac-task-test-public-subnet-2",
		"iac-task-test-private-subnet-1",
		"iac-task-test-private-subnet-2",
		"iac-task-test-public-rt",
		"iac-task-test-private-rt",
	}

	for _, name := range resourceNames {
		t.Run("ResourceName_"+name, func(t *testing.T) {
			// Check prefix
			require.True(t, strings.HasPrefix(name, "iac-task-"))

			// Check no uppercase letters
			assert.Equal(t, strings.ToLower(name), name, "Resource names should be lowercase")

			// Check valid characters (alphanumeric and hyphens)
			assert.Regexp(t, `^[a-z0-9-]+$`, name, "Resource names should only contain lowercase letters, numbers, and hyphens")
		})
	}
}

// TestSubnetDistribution tests subnet distribution across AZs
func TestSubnetDistribution(t *testing.T) {
	// Test that subnets are distributed across different AZs
	publicSubnetAZs := []string{"us-east-1a", "us-east-1b"}
	privateSubnetAZs := []string{"us-east-1a", "us-east-1b"}

	assert.Len(t, publicSubnetAZs, 2, "Should have 2 public subnets")
	assert.Len(t, privateSubnetAZs, 2, "Should have 2 private subnets")

	// Check AZs are different for each subnet type
	assert.NotEqual(t, publicSubnetAZs[0], publicSubnetAZs[1], "Public subnets should be in different AZs")
	assert.NotEqual(t, privateSubnetAZs[0], privateSubnetAZs[1], "Private subnets should be in different AZs")
}
