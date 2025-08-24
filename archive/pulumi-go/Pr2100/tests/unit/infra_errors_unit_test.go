package main

import (
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestCreateKMSKeyErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-kms"
		infra := NewMultiRegionInfrastructure(ctx, config)
		_, _ = infra.CreateKMSKey()
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateS3BucketErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-s3"
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, _ := infra.CreateKMSKey()
		_, _ = infra.CreateS3Bucket(key)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudFrontDistributionErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-cloudfront"
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, _ := infra.CreateKMSKey()
		bucket, _ := infra.CreateS3Bucket(key)
		_, _ = infra.CreateCloudFrontDistribution(bucket)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateIAMResourcesErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-iam"
		infra := NewMultiRegionInfrastructure(ctx, config)
		_, _ = infra.CreateIAMResources()
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestDeployRegionalResourcesErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-region"
		infra := NewMultiRegionInfrastructure(ctx, config)
		roles, _ := infra.CreateIAMResources()
		_, _ = infra.DeployRegionalResources("fail-region", roles)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudTrailBucketErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-cloudtrail"
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, _ := infra.CreateKMSKey()
		_, _ = infra.CreateCloudTrailBucket(key)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudTrailErrorPath(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Environment = "fail-cloudtrail-create"
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, _ := infra.CreateKMSKey()
		bucket, _ := infra.CreateCloudTrailBucket(key)
		_ = infra.CreateCloudTrail(bucket)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}
