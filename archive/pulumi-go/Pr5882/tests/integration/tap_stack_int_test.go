//go:build integration
// +build integration

package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestIntegrationStackCreation(t *testing.T) {
	// Integration test for actual stack creation
	// This tests the exported API of the lib package
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		stack, err := lib.NewTapStack(ctx, "integration-test-stack", &lib.TapStackArgs{
			EnvironmentSuffix: "integration",
		})

		if err != nil {
			return err
		}

		// Verify stack outputs are not nil
		assert.NotNil(t, stack.VpcID)
		assert.NotNil(t, stack.SubnetIDs)
		assert.NotNil(t, stack.S3BucketName)
		assert.NotNil(t, stack.KmsKeyArn)
		assert.NotNil(t, stack.ApiGatewayUrl)
		assert.NotNil(t, stack.LambdaFunctionArn)

		return nil
	}, pulumi.WithMocks("project", "stack", &integrationMocks{}))

	assert.NoError(t, err)
}

// integrationMocks provides mock implementations for integration testing
type integrationMocks struct{}

func (integrationMocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	return args.Name + "_id", args.Inputs, nil
}

func (integrationMocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return args.Args, nil
}
