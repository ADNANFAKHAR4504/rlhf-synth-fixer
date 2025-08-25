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
