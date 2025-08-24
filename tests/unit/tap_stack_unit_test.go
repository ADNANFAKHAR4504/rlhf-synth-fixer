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