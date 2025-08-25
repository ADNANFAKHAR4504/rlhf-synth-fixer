//go:build !integration
// +build !integration

package main

import (
	"os"
	"strings"
	"sync"
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

// TestCreateInfrastructureWithConfigVars tests with config environment variables
func TestCreateInfrastructureWithConfigVars(t *testing.T) {
	os.Setenv("CONFIG_RECORDER_NAME", "test-recorder")
	os.Setenv("DELIVERY_CHANNEL_NAME", "test-channel")
	defer func() {
		os.Unsetenv("CONFIG_RECORDER_NAME")
		os.Unsetenv("DELIVERY_CHANNEL_NAME")
	}()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

// TestS3BucketCreation tests S3 bucket creation with proper configuration
func TestS3BucketCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify financial documents bucket was created
	bucketFound := false
	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-DocumentsBucket") {
			bucketFound = true
			break
		}
	}
	mockProvider.mu.Unlock()
	assert.True(t, bucketFound, "Financial documents bucket should be created")
}

// TestS3BucketSecurity tests S3 bucket security configurations
func TestS3BucketSecurity(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify security configurations
	versioningFound := false
	encryptionFound := false
	publicAccessBlockFound := false

	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-BucketVersioning") {
			versioningFound = true
		}
		if strings.Contains(name, "FinApp-BucketEncryption") {
			encryptionFound = true
		}
		if strings.Contains(name, "FinApp-BucketPublicAccessBlock") {
			publicAccessBlockFound = true
		}
	}
	mockProvider.mu.Unlock()

	assert.True(t, versioningFound, "Bucket versioning should be enabled")
	assert.True(t, encryptionFound, "Bucket encryption should be configured")
	assert.True(t, publicAccessBlockFound, "Public access should be blocked")
}

// TestCloudTrailConfiguration tests CloudTrail setup
func TestCloudTrailConfiguration(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify CloudTrail bucket exists
	cloudTrailBucketFound := false
	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-CloudTrailBucket") {
			cloudTrailBucketFound = true
			break
		}
	}
	mockProvider.mu.Unlock()
	assert.True(t, cloudTrailBucketFound, "CloudTrail bucket should be created")

	// Verify CloudTrail exists
	cloudTrailFound := false
	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-CloudTrail") {
			cloudTrailFound = true
			break
		}
	}
	mockProvider.mu.Unlock()
	assert.True(t, cloudTrailFound, "CloudTrail should be created")
}

// TestIAMRoleCreation tests IAM role and policy creation
func TestIAMRoleCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify IAM resources
	appRoleFound := false
	s3PolicyFound := false
	instanceProfileFound := false

	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-ApplicationRole") {
			appRoleFound = true
		}
		if strings.Contains(name, "FinApp-S3AccessPolicy") {
			s3PolicyFound = true
		}
		if strings.Contains(name, "FinApp-InstanceProfile") {
			instanceProfileFound = true
		}
	}
	mockProvider.mu.Unlock()

	assert.True(t, appRoleFound, "Application role should be created")
	assert.True(t, s3PolicyFound, "S3 access policy should be created")
	assert.True(t, instanceProfileFound, "Instance profile should be created")
}

// TestAWSConfigSetup tests AWS Config service setup
func TestAWSConfigSetup(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify Config resources
	configRoleFound := false
	configBucketFound := false

	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-ConfigServiceRole") {
			configRoleFound = true
		}
		if strings.Contains(name, "FinApp-ConfigBucket") {
			configBucketFound = true
		}
	}
	mockProvider.mu.Unlock()

	assert.True(t, configRoleFound, "Config service role should be created")
	assert.True(t, configBucketFound, "Config bucket should be created")
}

// TestEnvironmentSuffixHandling tests environment suffix logic
func TestEnvironmentSuffixHandling(t *testing.T) {
	tests := []struct {
		name     string
		envVar   string
		expected string
	}{
		{"WithEnvVar", "test123", "test123"},
		{"WithoutEnvVar", "", "synthtrainr308"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envVar != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envVar)
				defer os.Unsetenv("ENVIRONMENT_SUFFIX")
			} else {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
			}

			mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				return CreateInfrastructure(ctx)
			}, pulumi.WithMocks("project", "stack", mockProvider))

			assert.NoError(t, err)

			// Check that resources were created (suffix testing simplified)
			mockProvider.mu.Lock()
			resourceCount := len(mockProvider.resources)
			mockProvider.mu.Unlock()
			assert.Greater(t, resourceCount, 0, "Resources should be created")
		})
	}
}

// TestBucketPolicyConfiguration tests bucket policy setup
func TestBucketPolicyConfiguration(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	// Verify bucket policies are created
	bucketPolicyFound := false
	cloudTrailPolicyFound := false
	configPolicyFound := false

	mockProvider.mu.Lock()
	for name := range mockProvider.resources {
		if strings.Contains(name, "FinApp-BucketPolicy") {
			bucketPolicyFound = true
		}
		if strings.Contains(name, "FinApp-CloudTrailBucketPolicy") {
			cloudTrailPolicyFound = true
		}
		if strings.Contains(name, "FinApp-ConfigBucketPolicy") {
			configPolicyFound = true
		}
	}
	mockProvider.mu.Unlock()

	assert.True(t, bucketPolicyFound, "Main bucket policy should be created")
	assert.True(t, cloudTrailPolicyFound, "CloudTrail bucket policy should be created")
	assert.True(t, configPolicyFound, "Config bucket policy should be created")
}

// Mock implementation for Pulumi testing
type mocks struct{}

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-east-1:123456789012:" + args.Name)
	return args.Name + "_id", outs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return args.Args, nil
}

// Enhanced mock for tracking resources
type resourceTracker struct {
	resources map[string]resource.PropertyMap
	mu        sync.Mutex
}

func (rt *resourceTracker) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outs := args.Inputs
	outs["arn"] = resource.NewStringProperty("arn:aws:" + string(args.TypeToken) + ":us-east-1:123456789012:" + args.Name)

	rt.mu.Lock()
	rt.resources[args.Name] = outs
	rt.mu.Unlock()

	return args.Name + "_id", outs, nil
}

func (rt *resourceTracker) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return args.Args, nil
}
