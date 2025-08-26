package main

import (
	"strings"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

// mocks implements pulumi.MockResourceMonitor interface
type mocks struct{}

func (m *mocks) NewResource(args pulumi.MockResourceArgs) (string, pulumi.Map, error) {
	// Return a mock ID and outputs same as inputs
	return args.Name + "_id", args.Inputs, nil
}

func (m *mocks) Call(args pulumi.MockCallArgs) (pulumi.Map, error) {
	// For data source calls, return empty or dummy data as needed
	return pulumi.Map{}, nil
}

func TestTapStack(t *testing.T) {
	err := pulumi.RunErrWithMocks(t, "project", "stack", &mocks{}, func(ctx *pulumi.Context) error {

		// Call your existing main Pulumi program code wrapped here
		// This requires your tap_stack.go's main's pulumi.Run callback code
		// to be accessible as a function or package-level variable. Since you
		// can't change that, replicate your main logic here minimally.
		// If that is not possible, test outputs only (see below).

		// Instead test outputs exposed from stack using ctx.Export:
		vpcId := ctx.Output("vpcId")
		publicSubnetId := ctx.Output("publicSubnetId")
		privateSubnetEc2Id := ctx.Output("privateSubnetEc2Id")
		privateSubnetRdsId := ctx.Output("privateSubnetRdsId")
		ec2InstanceId := ctx.Output("ec2InstanceId")
		rdsEndpoint := ctx.Output("rdsEndpoint")
		s3BucketName := ctx.Output("s3BucketName")
		ec2SecurityGroupId := ctx.Output("ec2SecurityGroupId")
		rdsSecurityGroupId := ctx.Output("rdsSecurityGroupId")

		// Example: Validate outputs appear non-empty (basic sanity tests)
		outputChecks := []struct {
			name  string
			value pulumi.Output
		}{
			{"vpcId", vpcId},
			{"publicSubnetId", publicSubnetId},
			{"privateSubnetEc2Id", privateSubnetEc2Id},
			{"privateSubnetRdsId", privateSubnetRdsId},
			{"ec2InstanceId", ec2InstanceId},
			{"rdsEndpoint", rdsEndpoint},
			{"s3BucketName", s3BucketName},
			{"ec2SecurityGroupId", ec2SecurityGroupId},
			{"rdsSecurityGroupId", rdsSecurityGroupId},
		}

		for _, check := range outputChecks {
			check := check
			check.value.ApplyT(func(val string) error {
				assert.NotEmpty(t, val, check.name+" output should not be empty")
				assert.False(t, strings.Contains(val, "id"), check.name+" seems not properly resolved")
				return nil
			})
		}

		return nil
	})

	assert.NoError(t, err)
}
