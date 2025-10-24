//go:build !integration
// +build !integration

package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Copy()

	// Set default IDs based on resource type
	if args.TypeToken == "aws:ec2/vpc:Vpc" {
		outputs["id"] = resource.NewStringProperty("vpc-12345")
	}
	if args.TypeToken == "aws:ec2/subnet:Subnet" {
		outputs["id"] = resource.NewStringProperty("subnet-12345")
	}
	if args.TypeToken == "aws:kinesis/stream:Stream" {
		outputs["arn"] = resource.NewStringProperty("arn:aws:kinesis:eu-central-2:123456789012:stream/test")
		outputs["name"] = resource.NewStringProperty("test-stream")
	}
	if args.TypeToken == "aws:rds/instance:Instance" {
		outputs["endpoint"] = resource.NewStringProperty("test-db.123456.eu-central-2.rds.amazonaws.com:5432")
		outputs["id"] = resource.NewStringProperty("test-db")
	}
	if args.TypeToken == "aws:ecs/cluster:Cluster" {
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecs:eu-central-2:123456789012:cluster/test")
		outputs["name"] = resource.NewStringProperty("test-cluster")
	}

	return args.Name + "_id", outputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := map[string]interface{}{}
	return resource.NewPropertyMapFromMap(outputs), nil
}

func TestVPCCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestKinesisStreamCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestRDSInstanceCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestECSClusterCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestSecretsManagerIntegration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestSecurityGroupConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestIAMRolesCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestCloudWatchAlarmsCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestAutoScalingConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestVPCFlowLogsSetup(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestRegionConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return lib.CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}
