package main

import (
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// mocks implements pulumi.runtime.Mocks interface to fake resource provisioning
type mocks struct{}

func (m *mocks) NewResource(args pulumi.MockResourceArgs) (string, map[string]interface{}, error) {
	// Return a fake resource ID and pass through inputs as output state.
	return args.Name + "_id", args.Inputs, nil
}

func (m *mocks) Call(args pulumi.MockCallArgs) (map[string]interface{}, error) {
	return map[string]interface{}{}, nil
}

func TestTapStack(t *testing.T) {
	// Setup pulumi to use mocks for all resources during tests.
	pulumi.WithMocks(t, "project", "stack", &mocks{}, func(ctx *pulumi.Context) error {
		err := runStack(ctx)
		assert.NoError(t, err)

		// Test example: Verify VPC CIDR block is 10.0.0.0/16
		vpc := getResourceByName(t, ctx, "hipaa-vpc")
		assert.Equal(t, "10.0.0.0/16", vpc["cidrBlock"])

		// Test example: Verify public subnet has MapPublicIpOnLaunch enabled
		pubSubnet := getResourceByName(t, ctx, "hipaa-public-subnet")
		assert.Equal(t, true, pubSubnet["mapPublicIpOnLaunch"])

		// Test example: Verify S3 bucket has versioning enabled
		bucketVersioning := getResourceByName(t, ctx, "hipaa-bucket-versioning")
		versioningConfig := bucketVersioning["versioningConfiguration"].(map[string]interface{})
		assert.Equal(t, "Enabled", versioningConfig["status"])

		// Test example: Verify EC2 security group allows outbound internet
		ec2Sg := getResourceByName(t, ctx, "hipaa-ec2-sg")
		egress := ec2Sg["egress"].([]interface{})
		assert.NotEmpty(t, egress)

		// Add more tests following this style for critical resources and properties

		return nil
	})
}

// runStack calls the main stack function but refactored so reusable in tests
func runStack(ctx *pulumi.Context) error {
	// You should refactor your tap_stack.go main function to separate
	// the Pulumi Run logic and stack resource creation to enable testing here.
	// This is an example placeholder to indicate your stack creation logic.
	// Alternatively, call your stack creation code here instead of main().
	return nil
}

// getResourceByName is a helper to retrieve a resource's properties from context by its name
func getResourceByName(t *testing.T, ctx *pulumi.Context, name string) map[string]interface{} {
	var props map[string]interface{}
	found := false
	ctx.RegisterResourceOutputs(&pulumi.ResourceState{}, func(outputs map[string]interface{}) error {
		if outputs["urn"] == name {
			props = outputs
			found = true
		}
		return nil
	})
	assert.True(t, found, "Resource '%s' not found in stack", name)
	return props
}
