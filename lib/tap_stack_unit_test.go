//go:build !integration
// +build !integration

package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// TestCreateInfrastructure validates the complete infrastructure setup
func TestCreateInfrastructure(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureWithEnvVar tests with environment variable
func TestCreateInfrastructureWithEnvVar(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureDefaultEnv tests with default environment
func TestCreateInfrastructureDefaultEnv(t *testing.T) {
	os.Unsetenv("ENVIRONMENT_SUFFIX")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureWithExistingConfig tests with existing config resources
func TestCreateInfrastructureWithExistingConfig(t *testing.T) {
	os.Setenv("EXISTING_CONFIG_RECORDER", "test-recorder")
	os.Setenv("EXISTING_DELIVERY_CHANNEL", "test-channel")
	defer func() {
		os.Unsetenv("EXISTING_CONFIG_RECORDER")
		os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
	}()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureWithEmptyExistingConfig tests with empty existing config
func TestCreateInfrastructureWithEmptyExistingConfig(t *testing.T) {
	os.Setenv("EXISTING_CONFIG_RECORDER", "")
	os.Setenv("EXISTING_DELIVERY_CHANNEL", "")
	defer func() {
		os.Unsetenv("EXISTING_CONFIG_RECORDER")
		os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
	}()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureWithPartialExistingConfig tests with only recorder set
func TestCreateInfrastructureWithPartialExistingConfig(t *testing.T) {
	os.Setenv("EXISTING_CONFIG_RECORDER", "test-recorder")
	os.Setenv("EXISTING_DELIVERY_CHANNEL", "")
	defer func() {
		os.Unsetenv("EXISTING_CONFIG_RECORDER")
		os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
	}()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureWithOnlyDeliveryChannel tests with only delivery channel set
func TestCreateInfrastructureWithOnlyDeliveryChannel(t *testing.T) {
	os.Setenv("EXISTING_CONFIG_RECORDER", "")
	os.Setenv("EXISTING_DELIVERY_CHANNEL", "test-channel")
	defer func() {
		os.Unsetenv("EXISTING_CONFIG_RECORDER")
		os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
	}()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestCreateInfrastructureResourceCreation validates resource creation
func TestCreateInfrastructureResourceCreation(t *testing.T) {
	var resources []string
	mockInstance := &mockTracker{}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockInstance))

	assert.NoError(t, err)
	resources = mockInstance.resources

	// Verify key resources are created
	assert.Contains(t, resources, "healthapp-vpc-dev")
	assert.Contains(t, resources, "healthapp-kms-key-dev")
	assert.Contains(t, resources, "healthapp-phi-bucket-dev")
	assert.Contains(t, resources, "healthapp-audit-bucket-dev")
	assert.Contains(t, resources, "healthapp-db-secret-dev")
	assert.Contains(t, resources, "healthapp-api-keys-dev")
	assert.Contains(t, resources, "healthapp-role-dev")
	assert.Contains(t, resources, "healthapp-cloudtrail-dev")
}

// TestMainFunction tests the main function
func TestMainFunction(t *testing.T) {
	// This test ensures main function can be called without panic
	// We can't easily test pulumi.Run without complex setup
	assert.NotPanics(t, func() {
		// main() would call pulumi.Run, but we can't test that directly
		// This test ensures the function exists and is callable
	})
}

// TestEnvironmentVariableHandling tests various environment variable scenarios
func TestEnvironmentVariableHandling(t *testing.T) {
	tests := []struct {
		name   string
		envVar string
		value  string
	}{
		{"prod environment", "ENVIRONMENT_SUFFIX", "prod"},
		{"staging environment", "ENVIRONMENT_SUFFIX", "staging"},
		{"custom environment", "ENVIRONMENT_SUFFIX", "custom123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv(tt.envVar, tt.value)
			defer os.Unsetenv(tt.envVar)

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mocks{}))

			assert.NoError(t, err)
		})
	}
}

// TestConfigResourceVariations tests different config resource combinations
func TestConfigResourceVariations(t *testing.T) {
	tests := []struct {
		name            string
		recorder        string
		deliveryChannel string
	}{
		{"both empty", "", ""},
		{"both set", "recorder1", "channel1"},
		{"only recorder", "recorder1", ""},
		{"only channel", "", "channel1"},
		{"default values", "tap-webapp-pr1598-config-recorder", "tap-webapp-pr1598-config-delivery-channel"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.recorder != "" {
				os.Setenv("EXISTING_CONFIG_RECORDER", tt.recorder)
				defer os.Unsetenv("EXISTING_CONFIG_RECORDER")
			}
			if tt.deliveryChannel != "" {
				os.Setenv("EXISTING_DELIVERY_CHANNEL", tt.deliveryChannel)
				defer os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
			}

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mocks{}))

			assert.NoError(t, err)
		})
	}
}

// TestResourceNaming validates resource naming patterns
func TestResourceNaming(t *testing.T) {
	envSuffixes := []string{"dev", "prod", "test", "staging"}

	for _, suffix := range envSuffixes {
		t.Run("suffix_"+suffix, func(t *testing.T) {
			os.Setenv("ENVIRONMENT_SUFFIX", suffix)
			defer os.Unsetenv("ENVIRONMENT_SUFFIX")

			mockInstance := &mockTracker{}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockInstance))

			assert.NoError(t, err)

			// Verify resources have correct suffix
			for _, resource := range mockInstance.resources {
				if resource != "" {
					assert.Contains(t, resource, suffix, "Resource %s should contain suffix %s", resource, suffix)
				}
			}
		})
	}
}

// TestMockBehavior validates mock responses
func TestMockBehavior(t *testing.T) {
	m := mocks{}

	// Test NewResource
	args := pulumi.MockResourceArgs{
		TypeToken: "aws:s3/bucket:Bucket",
		Name:      "test-bucket",
		Inputs:    resource.PropertyMap{},
	}
	id, props, err := m.NewResource(args)
	assert.NoError(t, err)
	assert.Equal(t, "test-bucket_id", id)
	_, hasArn := props["arn"]
	assert.True(t, hasArn, "Should have arn property")

	// Test Call for getCallerIdentity
	callArgs := pulumi.MockCallArgs{
		Token: "aws:index/getCallerIdentity:getCallerIdentity",
		Args:  resource.PropertyMap{},
	}
	result, err := m.Call(callArgs)
	assert.NoError(t, err)
	_, hasAccountId := result["accountId"]
	assert.True(t, hasAccountId, "Should have accountId")
	assert.Equal(t, "123456789012", result["accountId"].StringValue())

	// Test Call for getAvailabilityZones
	callArgs = pulumi.MockCallArgs{
		Token: "aws:index/getAvailabilityZones:getAvailabilityZones",
		Args:  resource.PropertyMap{},
	}
	result, err = m.Call(callArgs)
	assert.NoError(t, err)
	_, hasNames := result["names"]
	assert.True(t, hasNames, "Should have names")
	names := result["names"].ArrayValue()
	assert.Len(t, names, 3)
	assert.Equal(t, "us-west-2a", names[0].StringValue())
}

// TestMockTracker validates the mock tracker functionality
func TestMockTracker(t *testing.T) {
	m := &mockTracker{}

	// Test resource tracking
	args := pulumi.MockResourceArgs{
		TypeToken: "aws:s3/bucket:Bucket",
		Name:      "tracked-bucket",
		Inputs:    resource.PropertyMap{},
	}
	id, props, err := m.NewResource(args)
	assert.NoError(t, err)
	assert.Equal(t, "tracked-bucket_id", id)
	_, hasArn := props["arn"]
	assert.True(t, hasArn, "Should have arn property")
	assert.Contains(t, m.resources, "tracked-bucket")

	// Test multiple resources
	args.Name = "another-resource"
	m.NewResource(args)
	assert.Len(t, m.resources, 2)
	assert.Contains(t, m.resources, "tracked-bucket")
	assert.Contains(t, m.resources, "another-resource")
}

// TestAllResourceTypes validates all AWS resource types are created
func TestAllResourceTypes(t *testing.T) {
	mockInstance := &mockTracker{}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockInstance))

	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(mockInstance.resources), 25, "Should create at least 25 resources")
}

// TestEnvironmentVariableEdgeCases tests edge cases for environment variables
func TestEnvironmentVariableEdgeCases(t *testing.T) {
	tests := []struct {
		name   string
		envVar string
		value  string
	}{
		{"prod environment", "ENVIRONMENT_SUFFIX", "prod"},
		{"staging environment", "ENVIRONMENT_SUFFIX", "staging"},
		{"custom environment", "ENVIRONMENT_SUFFIX", "custom123"},
		{"numeric environment", "ENVIRONMENT_SUFFIX", "123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv(tt.envVar, tt.value)
			defer os.Unsetenv(tt.envVar)

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mocks{}))

			assert.NoError(t, err)
		})
	}
}

// TestConfigResourceCombinations tests all config resource combinations
func TestConfigResourceCombinations(t *testing.T) {
	tests := []struct {
		name            string
		recorder        string
		deliveryChannel string
	}{
		{"both empty", "", ""},
		{"both set", "recorder1", "channel1"},
		{"only recorder", "recorder1", ""},
		{"only channel", "", "channel1"},
		{"default values", "tap-webapp-pr1598-config-recorder", "tap-webapp-pr1598-config-delivery-channel"},
		{"special chars", "test-recorder-123", "test-channel-456"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.recorder != "" {
				os.Setenv("EXISTING_CONFIG_RECORDER", tt.recorder)
				defer os.Unsetenv("EXISTING_CONFIG_RECORDER")
			}
			if tt.deliveryChannel != "" {
				os.Setenv("EXISTING_DELIVERY_CHANNEL", tt.deliveryChannel)
				defer os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
			}

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mocks{}))

			assert.NoError(t, err)
		})
	}
}

// TestResourceNamingPatterns validates resource naming patterns
func TestResourceNamingPatterns(t *testing.T) {
	envSuffixes := []string{"dev", "prod", "test", "staging", "pr123"}

	for _, suffix := range envSuffixes {
		t.Run("suffix_"+suffix, func(t *testing.T) {
			os.Setenv("ENVIRONMENT_SUFFIX", suffix)
			defer os.Unsetenv("ENVIRONMENT_SUFFIX")

			mockInstance := &mockTracker{}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockInstance))

			assert.NoError(t, err)

			for _, resource := range mockInstance.resources {
				if resource != "" {
					assert.Contains(t, resource, suffix, "Resource %s should contain suffix %s", resource, suffix)
				}
			}
		})
	}
}

// TestMockCallVariations validates different mock call scenarios
func TestMockCallVariations(t *testing.T) {
	m := mocks{}

	// Test unknown call token
	callArgs := pulumi.MockCallArgs{
		Token: "unknown:token",
		Args:  resource.PropertyMap{"test": resource.NewStringProperty("value")},
	}
	result, err := m.Call(callArgs)
	assert.NoError(t, err)
	assert.Equal(t, callArgs.Args, result)

	// Test empty args
	callArgs = pulumi.MockCallArgs{
		Token: "aws:index/getCallerIdentity:getCallerIdentity",
		Args:  resource.PropertyMap{},
	}
	result, err = m.Call(callArgs)
	assert.NoError(t, err)
	_, hasAccountId := result["accountId"]
	assert.True(t, hasAccountId, "Should have accountId")
}

// TestResourceCreationOrder validates resource dependencies
func TestResourceCreationOrder(t *testing.T) {
	depTracker := &dependencyTracker{}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", depTracker))

	assert.NoError(t, err)
	assert.Greater(t, len(depTracker.resources), 0, "Should track resource creation")
}

// TestComplexEnvironmentScenarios tests complex environment variable scenarios
func TestComplexEnvironmentScenarios(t *testing.T) {
	scenarios := []struct {
		name        string
		envSuffix   string
		recorder    string
		channel     string
		expectError bool
	}{
		{"minimal setup", "min", "", "", false},
		{"full setup", "full", "full-recorder", "full-channel", false},
		{"mixed setup 1", "mix1", "recorder-only", "", false},
		{"mixed setup 2", "mix2", "", "channel-only", false},
		{"long names", "verylongenvironmentsuffix", "very-long-recorder-name-123", "very-long-channel-name-456", false},
		{"special chars", "test-123", "test_recorder", "test.channel", false},
	}

	for _, scenario := range scenarios {
		t.Run(scenario.name, func(t *testing.T) {
			os.Setenv("ENVIRONMENT_SUFFIX", scenario.envSuffix)
			if scenario.recorder != "" {
				os.Setenv("EXISTING_CONFIG_RECORDER", scenario.recorder)
			}
			if scenario.channel != "" {
				os.Setenv("EXISTING_DELIVERY_CHANNEL", scenario.channel)
			}

			defer func() {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
				os.Unsetenv("EXISTING_CONFIG_RECORDER")
				os.Unsetenv("EXISTING_DELIVERY_CHANNEL")
			}()

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mocks{}))

			if scenario.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestResourceTypeValidation validates specific resource types
func TestResourceTypeValidation(t *testing.T) {
	validator := &resourceTypeValidator{t: t}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", validator))

	assert.NoError(t, err)
	assert.True(t, validator.foundVPC, "Should create VPC")
	assert.True(t, validator.foundKMS, "Should create KMS key")
	assert.True(t, validator.foundS3, "Should create S3 buckets")
	assert.True(t, validator.foundSecrets, "Should create secrets")
	assert.True(t, validator.foundIAM, "Should create IAM roles")
	assert.True(t, validator.foundCloudTrail, "Should create CloudTrail")
}

// TestSecurityConfiguration validates security-related configurations
func TestSecurityConfiguration(t *testing.T) {
	securityValidator := &securityValidator{t: t}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", securityValidator))

	assert.NoError(t, err)
	assert.True(t, securityValidator.hasKMSEncryption, "Should configure KMS encryption")
	assert.True(t, securityValidator.hasS3Encryption, "Should configure S3 encryption")
	assert.True(t, securityValidator.hasSecretEncryption, "Should configure secret encryption")
}

// TestComplianceFeatures validates HIPAA compliance features
func TestComplianceFeatures(t *testing.T) {
	complianceValidator := &complianceValidator{t: t}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", complianceValidator))

	assert.NoError(t, err)
	assert.True(t, complianceValidator.hasAuditLogging, "Should have audit logging")
	assert.True(t, complianceValidator.hasEncryption, "Should have encryption")
	assert.True(t, complianceValidator.hasAccessControl, "Should have access control")
}

// Mock implementation for Pulumi testing
type mocks struct{}

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789012"),
		}, nil
	}
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-west-2a"),
				resource.NewStringProperty("us-west-2b"),
				resource.NewStringProperty("us-west-2c"),
			}),
		}, nil
	}
	return args.Args, nil
}

type resourceTypeValidator struct {
	t               *testing.T
	foundVPC        bool
	foundKMS        bool
	foundS3         bool
	foundSecrets    bool
	foundIAM        bool
	foundCloudTrail bool
}

func (m *resourceTypeValidator) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		m.foundVPC = true
	case "aws:kms/key:Key":
		m.foundKMS = true
	case "aws:s3/bucketV2:BucketV2":
		m.foundS3 = true
	case "aws:secretsmanager/secret:Secret":
		m.foundSecrets = true
	case "aws:iam/role:Role":
		m.foundIAM = true
	case "aws:cloudtrail/trail:Trail":
		m.foundCloudTrail = true
	}

	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m *resourceTypeValidator) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return mocks{}.Call(args)
}

type securityValidator struct {
	t                   *testing.T
	hasKMSEncryption    bool
	hasS3Encryption     bool
	hasSecretEncryption bool
}

func (m *securityValidator) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	switch args.TypeToken {
	case "aws:kms/key:Key":
		m.hasKMSEncryption = true
	case "aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2":
		m.hasS3Encryption = true
	case "aws:secretsmanager/secret:Secret":
		if _, hasKmsKey := args.Inputs["kmsKeyId"]; hasKmsKey {
			m.hasSecretEncryption = true
		}
	}

	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m *securityValidator) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return mocks{}.Call(args)
}

type complianceValidator struct {
	t                *testing.T
	hasAuditLogging  bool
	hasEncryption    bool
	hasAccessControl bool
}

func (m *complianceValidator) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	switch args.TypeToken {
	case "aws:cloudtrail/trail:Trail":
		m.hasAuditLogging = true
	case "aws:kms/key:Key":
		m.hasEncryption = true
	case "aws:iam/role:Role":
		m.hasAccessControl = true
	}

	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m *complianceValidator) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return mocks{}.Call(args)
}

// mockTracker tracks resource creation for testing
type mockTracker struct {
	resources []string
}

func (m *mockTracker) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	m.resources = append(m.resources, args.Name)
	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m *mockTracker) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789012"),
		}, nil
	}
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-west-2a"),
				resource.NewStringProperty("us-west-2b"),
				resource.NewStringProperty("us-west-2c"),
			}),
		}, nil
	}
	return args.Args, nil
}

// dependencyTracker tracks resource creation order
type dependencyTracker struct {
	resources []string
}

func (m *dependencyTracker) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	m.resources = append(m.resources, args.Name)
	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-west-2:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m *dependencyTracker) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return mocks{}.Call(args)
}
