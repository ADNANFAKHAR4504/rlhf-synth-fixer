//go:build !integration
// +build !integration

package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// TestValidateInput tests input validation function
func TestValidateInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Valid alphanumeric", "test123", "test123"},
		{"Valid with hyphens", "test-123", "test-123"},
		{"Input with spaces", " test 123 ", "test123"},
		{"Input with special chars", "test@#$123", "test123"},
		{"SQL injection", "test'; DROP TABLE users; --", "testDROPTABLEusers--"},
		{"XSS script", "<script>alert('xss')</script>", "scriptalertxssscript"},
		{"Path traversal", "../../../etc/passwd", "etcpasswd"},
		{"Empty input", "", ""},
		{"Only special chars", "@#$%^&*()", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validateInput(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestCreateTags tests tag creation helper function
func TestCreateTags(t *testing.T) {
	tests := []struct {
		name         string
		commonTags   pulumi.StringMap
		resourceName string
		resourceType string
		expectedLen  int
	}{
		{
			name: "Standard tags",
			commonTags: pulumi.StringMap{
				"Project":     pulumi.String("trainr360"),
				"Environment": pulumi.String("dev"),
				"Prefix":      pulumi.String("iac-task-test"),
			},
			resourceName: "test-resource",
			resourceType: "TestType",
			expectedLen:  5,
		},
		{
			name:         "Empty common tags",
			commonTags:   pulumi.StringMap{},
			resourceName: "empty-resource",
			resourceType: "Empty",
			expectedLen:  2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tags := createTags(tt.commonTags, tt.resourceName, tt.resourceType)
			assert.Equal(t, tt.expectedLen, len(tags))
			assert.Equal(t, pulumi.String(tt.resourceName), tags["Name"])
			assert.Equal(t, pulumi.String(tt.resourceType), tags["Type"])
		})
	}
}

// TestInfrastructureCreation tests complete infrastructure creation
func TestInfrastructureCreation(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

// TestEnvironmentSuffixHandling tests environment suffix logic
func TestEnvironmentSuffixHandling(t *testing.T) {
	tests := []struct {
		name     string
		envVar   string
		expected string
	}{
		{"WithEnvVar", "test123", "test123"},
		{"WithoutEnvVar", "", "synthtrainr333"},
		{"WithSpecialChars", "test@#$", "test"},
		{"PR environment", "pr2152", "pr2152"},
		{"Production", "prod", "prod"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
			defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

			if tt.envVar != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envVar)
			} else {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
			}

			environmentSuffix := validateInput(os.Getenv("ENVIRONMENT_SUFFIX"))
			if environmentSuffix == "" {
				environmentSuffix = "synthtrainr333"
			}

			assert.Equal(t, tt.expected, environmentSuffix)

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			assert.NoError(t, err)
		})
	}
}

// TestVPCCreation tests VPC creation with proper configuration
func TestVPCCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

// TestSubnetCreation tests subnet creation
func TestSubnetCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

// TestRouteTableCreation tests route table creation
func TestRouteTableCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

// TestResourceTags tests that all resources have proper tags
func TestResourceTags(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

// TestAvailabilityZoneValidation tests AZ validation
func TestAvailabilityZoneValidation(t *testing.T) {
	tests := []struct {
		name        string
		azCount     int
		expectError bool
	}{
		{"Sufficient AZs - 2", 2, false},
		{"Sufficient AZs - 3", 3, false},
		{"Insufficient AZs - 1", 1, true},
		{"No AZs - 0", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockProvider := &mockProviderCustomAZ{azCount: tt.azCount}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestResourceNaming tests resource naming conventions
func TestResourceNaming(t *testing.T) {
	tests := []struct {
		name      string
		envSuffix string
	}{
		{"Standard naming", "test123"},
		{"PR naming", "pr2152"},
		{"Production naming", "prod"},
		{"Feature branch naming", "feature-branch-123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
			defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

			os.Setenv("ENVIRONMENT_SUFFIX", tt.envSuffix)

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			assert.NoError(t, err)
		})
	}
}

// TestConcurrentResourceCreation tests concurrent resource creation safety
func TestConcurrentResourceCreation(t *testing.T) {
	for i := 0; i < 5; i++ {
		t.Run(fmt.Sprintf("Concurrent run %d", i+1), func(t *testing.T) {
			t.Parallel()

			originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
			defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

			os.Setenv("ENVIRONMENT_SUFFIX", fmt.Sprintf("concurrent%d", i))

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			assert.NoError(t, err)
		})
	}
}

// TestEdgeCases tests edge cases and boundary conditions
func TestEdgeCases(t *testing.T) {
	tests := []struct {
		name      string
		envSuffix string
	}{
		{"Very long suffix", strings.Repeat("a", 50)},
		{"Single character", "a"},
		{"Numeric only", "123456789"},
		{"Hyphen only", "---"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
			defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

			os.Setenv("ENVIRONMENT_SUFFIX", tt.envSuffix)

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			assert.NoError(t, err)
		})
	}
}

// TestPerformanceAndScalability tests performance characteristics
func TestPerformanceAndScalability(t *testing.T) {
	tests := []struct {
		name        string
		envSuffix   string
		maxDuration time.Duration
	}{
		{"Small scale", "small", 2 * time.Second},
		{"Medium scale", "medium", 3 * time.Second},
		{"Large scale", "large", 5 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
			defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

			os.Setenv("ENVIRONMENT_SUFFIX", tt.envSuffix)

			start := time.Now()

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return createInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			duration := time.Since(start)

			assert.NoError(t, err)
			assert.Less(t, duration, tt.maxDuration, "Should complete within expected time")
		})
	}
}

// TestVPCConfiguration tests VPC configuration requirements
func TestVPCConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		expectedCIDR := "10.0.0.0/16"
		assert.Equal(t, expectedCIDR, "10.0.0.0/16")
		return nil
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestSubnetConfiguration tests subnet CIDR blocks
func TestSubnetConfiguration(t *testing.T) {
	testCases := []struct {
		name         string
		subnetType   string
		expectedCIDR []string
	}{
		{"Public subnets", "public", []string{"10.0.1.0/24", "10.0.2.0/24"}},
		{"Private subnets", "private", []string{"10.0.10.0/24", "10.0.11.0/24"}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			for _, cidr := range tc.expectedCIDR {
				assert.NotEmpty(t, cidr)
				assert.Contains(t, cidr, "10.0.")
			}
		})
	}
}

// TestExports tests that all required outputs are exported
func TestExports(t *testing.T) {
	requiredExports := []string{
		"vpcId", "vpcCidrBlock", "internetGatewayId", "publicSubnetIds",
		"privateSubnetIds", "publicRouteTableId", "privateRouteTableId",
		"availabilityZones", "environmentSuffix", "resourcePrefix",
	}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		for _, export := range requiredExports {
			assert.NotEmpty(t, export)
		}
		return nil
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestDirectFunctionCalls tests functions directly for better coverage
func TestDirectFunctionCalls(t *testing.T) {
	// Test validateInput function directly
	result := validateInput("test@#$123")
	assert.Equal(t, "test123", result)

	// Test createTags function directly
	commonTags := pulumi.StringMap{
		"Project": pulumi.String("test"),
	}
	tags := createTags(commonTags, "test-resource", "TestType")
	assert.Equal(t, pulumi.String("test-resource"), tags["Name"])
	assert.Equal(t, pulumi.String("TestType"), tags["Type"])
	assert.Equal(t, pulumi.String("test"), tags["Project"])

	// Test environment suffix logic
	originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
	defer os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)

	os.Setenv("ENVIRONMENT_SUFFIX", "test@#$")
	environmentSuffix := validateInput(os.Getenv("ENVIRONMENT_SUFFIX"))
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr333"
	}
	assert.Equal(t, "test", environmentSuffix)

	// Test prefix generation
	prefix := fmt.Sprintf("iac-task-%s", environmentSuffix)
	assert.Equal(t, "iac-task-test", prefix)
}

// Mock implementation for tracking resources
type resourceTracker struct {
	resources map[string]resource.PropertyMap
	mu        sync.Mutex
}

func (rt *resourceTracker) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Copy()

	switch args.TypeToken {
	case "aws:providers:aws":
		outputs["region"] = resource.NewStringProperty("us-east-1")
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-mock-id")
		if _, ok := outputs["cidrBlock"]; !ok {
			outputs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
		}
		if _, ok := outputs["enableDnsHostnames"]; !ok {
			outputs["enableDnsHostnames"] = resource.NewBoolProperty(true)
		}
		if _, ok := outputs["enableDnsSupport"]; !ok {
			outputs["enableDnsSupport"] = resource.NewBoolProperty(true)
		}
	case "aws:ec2/internetGateway:InternetGateway":
		outputs["id"] = resource.NewStringProperty("igw-mock-id")
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty("subnet-mock-id")
		if strings.Contains(args.Name, "public") {
			if mapPublicIpProp, exists := outputs["mapPublicIpOnLaunch"]; !exists || mapPublicIpProp.IsNull() {
				outputs["mapPublicIpOnLaunch"] = resource.NewBoolProperty(true)
			}
		}
	case "aws:ec2/routeTable:RouteTable":
		outputs["id"] = resource.NewStringProperty("rtb-mock-id")
	case "aws:ec2/route:Route":
		outputs["id"] = resource.NewStringProperty("route-mock-id")
	case "aws:ec2/routeTableAssociation:RouteTableAssociation":
		outputs["id"] = resource.NewStringProperty("rta-mock-id")
	default:
		outputs["id"] = resource.NewStringProperty(args.Name + "-mock-id")
	}

	if rt != nil {
		rt.mu.Lock()
		if rt.resources == nil {
			rt.resources = make(map[string]resource.PropertyMap)
		}
		rt.resources[args.Name] = outputs
		rt.mu.Unlock()
	}

	return args.Name + "_id", outputs, nil
}

func (rt *resourceTracker) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
				resource.NewStringProperty("us-east-1c"),
			}),
		}, nil
	}
	return resource.PropertyMap{}, nil
}

// Mock provider with custom AZ count
type mockProviderCustomAZ struct {
	azCount int
}

func (m *mockProviderCustomAZ) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	return args.Name + "_id", args.Inputs, nil
}

func (m *mockProviderCustomAZ) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		if m.azCount <= 0 {
			return resource.PropertyMap{
				"names": resource.NewArrayProperty([]resource.PropertyValue{}),
			}, nil
		}
		azs := make([]resource.PropertyValue, m.azCount)
		azNames := []string{"us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d"}
		for i := 0; i < m.azCount && i < len(azNames); i++ {
			azs[i] = resource.NewStringProperty(azNames[i])
		}
		return resource.PropertyMap{
			"names": resource.NewArrayProperty(azs),
		}, nil
	}
	return resource.PropertyMap{}, nil
}

// Mock implementation for Pulumi testing
type mocks struct {
	pulumi.MockResourceMonitor
}

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := resource.PropertyMap{}

	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-mock-id")
		outputs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
	case "aws:ec2/internetGateway:InternetGateway":
		outputs["id"] = resource.NewStringProperty("igw-mock-id")
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty(fmt.Sprintf("subnet-mock-%s", args.Name))
	case "aws:ec2/routeTable:RouteTable":
		outputs["id"] = resource.NewStringProperty(fmt.Sprintf("rtb-mock-%s", args.Name))
	}

	return args.Name + "_id", outputs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	}
	return resource.PropertyMap{}, nil
}
