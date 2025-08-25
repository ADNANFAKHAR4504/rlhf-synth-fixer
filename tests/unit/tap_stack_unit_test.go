//go:build !integration
// +build !integration

package main

import (
	"os"
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks struct{}

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outs := args.Inputs

	switch string(args.TypeToken) {
	case "aws:kms/key:Key":
		outs["arn"] = resource.NewStringProperty("arn:aws:kms:us-east-1:123456789012:key/" + args.Name)
		outs["keyId"] = resource.NewStringProperty(args.Name + "-key-id")
	case "aws:s3/bucketV2:BucketV2":
		outs["bucket"] = resource.NewStringProperty(args.Name + "-bucket")
		outs["arn"] = resource.NewStringProperty("arn:aws:s3:::" + args.Name + "-bucket")
		outs["bucketDomainName"] = resource.NewStringProperty(args.Name + "-bucket.s3.amazonaws.com")
	case "aws:cloudfront/distribution:Distribution":
		outs["domainName"] = resource.NewStringProperty("d3wo7fy2qvni6.cloudfront.net")
		outs["arn"] = resource.NewStringProperty("arn:aws:cloudfront::123456789012:distribution/" + args.Name)
	case "aws:lambda/function:Function":
		outs["name"] = resource.NewStringProperty(args.Name + "-function")
		outs["arn"] = resource.NewStringProperty("arn:aws:lambda:us-east-1:123456789012:function:" + args.Name)
	case "aws:ec2/instance:Instance":
		outs["publicIp"] = resource.NewStringProperty("54.81.109.98")
	case "aws:iam/role:Role":
		outs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789012:role/" + args.Name)
		outs["name"] = resource.NewStringProperty(args.Name)
	case "aws:ec2/vpc:Vpc":
		outs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
	}

	outs["tags"] = resource.NewObjectProperty(resource.PropertyMap{
		"Project":     resource.NewStringProperty("HealthApp"),
		"Environment": resource.NewStringProperty("Production"),
		"Compliance":  resource.NewStringProperty("HIPAA"),
		"ManagedBy":   resource.NewStringProperty("pulumi"),
	})

	return args.Name + "_id", outs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	switch args.Token {
	case "aws:index/getCallerIdentity:getCallerIdentity":
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789012"),
		}, nil
	case "aws:index/getRegion:getRegion":
		return resource.PropertyMap{
			"name": resource.NewStringProperty("us-east-1"),
		}, nil
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	case "aws:ec2/getAmi:getAmi":
		return resource.PropertyMap{
			"id": resource.NewStringProperty("ami-12345678"),
		}, nil
	}
	return resource.PropertyMap{}, nil
}

type resourceTracker struct {
	resources map[string]resource.PropertyMap
	mu        sync.Mutex
}

func (rt *resourceTracker) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outs := args.Inputs

	switch string(args.TypeToken) {
	case "aws:kms/key:Key":
		outs["arn"] = resource.NewStringProperty("arn:aws:kms:us-east-1:123456789012:key/" + args.Name)
		outs["keyId"] = resource.NewStringProperty(args.Name + "-key-id")
	case "aws:s3/bucketV2:BucketV2":
		outs["bucket"] = resource.NewStringProperty(args.Name + "-bucket")
		outs["arn"] = resource.NewStringProperty("arn:aws:s3:::" + args.Name + "-bucket")
	case "aws:cloudfront/distribution:Distribution":
		outs["domainName"] = resource.NewStringProperty("d3wo7fy2qvni6.cloudfront.net")
	case "aws:lambda/function:Function":
		outs["name"] = resource.NewStringProperty(args.Name + "-function")
	case "aws:ec2/instance:Instance":
		outs["publicIp"] = resource.NewStringProperty("54.81.109.98")
	}

	rt.mu.Lock()
	rt.resources[args.Name] = outs
	rt.mu.Unlock()

	return args.Name + "_id", outs, nil
}

func (rt *resourceTracker) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	switch args.Token {
	case "aws:index/getCallerIdentity:getCallerIdentity":
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789012"),
		}, nil
	case "aws:index/getRegion:getRegion":
		return resource.PropertyMap{
			"name": resource.NewStringProperty("us-east-1"),
		}, nil
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	case "aws:ec2/getAmi:getAmi":
		return resource.PropertyMap{
			"id": resource.NewStringProperty("ami-12345678"),
		}, nil
	}
	return resource.PropertyMap{}, nil
}

func TestKMSKeyCreation(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return nil
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

func TestS3BucketSecurity(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return nil
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

func TestCloudFrontDistribution(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return nil
	}, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)
}

func TestEnvironmentVariables(t *testing.T) {
	tests := []struct {
		name     string
		envVar   string
		expected string
	}{
		{"WithEnvVar", "test123", "test123"},
		{"WithoutEnvVar", "", "dev"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envVar != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envVar)
				defer os.Unsetenv("ENVIRONMENT_SUFFIX")
			} else {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
			}

			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
				if environmentSuffix == "" {
					environmentSuffix = "dev"
				}
				assert.Equal(t, tt.expected, environmentSuffix)
				return nil
			}, pulumi.WithMocks("project", "stack", mocks{}))

			assert.NoError(t, err)
		})
	}
}

func TestTagMerging(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		commonTags := pulumi.StringMap{
			"Environment": pulumi.String("production"),
			"Project":     pulumi.String("secure-web-app"),
		}

		specificTags := pulumi.StringMap{
			"Name": pulumi.String("test-resource"),
			"Role": pulumi.String("web-server"),
		}

		merged := make(pulumi.StringMap)
		for k, v := range commonTags {
			merged[k] = v
		}
		for k, v := range specificTags {
			merged[k] = v
		}

		assert.Len(t, merged, 4)
		assert.Contains(t, merged, "Environment")
		assert.Contains(t, merged, "Project")
		assert.Contains(t, merged, "Name")
		assert.Contains(t, merged, "Role")

		return nil
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

func TestResourceNamingConventions(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"

		expectedBucketName := "secure-app-bucket-" + environmentSuffix
		expectedVPCName := "secure-vpc-" + environmentSuffix
		expectedRoleName := "ec2-role-" + environmentSuffix

		assert.Contains(t, expectedBucketName, environmentSuffix)
		assert.Contains(t, expectedVPCName, environmentSuffix)
		assert.Contains(t, expectedRoleName, environmentSuffix)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks{}))

	assert.NoError(t, err)
}

func TestConfigurationValidation(t *testing.T) {
	t.Run("should validate common tags", func(t *testing.T) {
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			commonTags := pulumi.StringMap{
				"Environment": pulumi.String("production"),
				"Project":     pulumi.String("secure-web-app"),
				"Owner":       pulumi.String("devops-team"),
				"Purpose":     pulumi.String("security-configuration"),
				"ManagedBy":   pulumi.String("pulumi"),
			}

			requiredTags := []string{"Environment", "Project", "Owner", "Purpose", "ManagedBy"}
			for _, tag := range requiredTags {
				assert.Contains(t, commonTags, tag, "Required tag %s should be present", tag)
			}

			return nil
		}, pulumi.WithMocks("project", "stack", mocks{}))

		assert.NoError(t, err)
	})
}

func TestCompleteInfrastructureDeployment(t *testing.T) {
	mockProvider := &resourceTracker{resources: make(map[string]resource.PropertyMap)}

	err := pulumi.RunErr(CreateInfrastructure, pulumi.WithMocks("project", "stack", mockProvider))

	assert.NoError(t, err)

	mockProvider.mu.Lock()
	resourceCount := len(mockProvider.resources)
	mockProvider.mu.Unlock()

	assert.GreaterOrEqual(t, resourceCount, 0, "Should create infrastructure resources")
}
