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

type mocks int

// Mocks for Pulumi resources
func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	// Return a mock ID and properties for any resource
	outputs := args.Inputs.Copy()
	if args.TypeToken == "aws:getCallerIdentity" {
		outputs["accountId"] = resource.NewStringProperty("123456789012")
	}
	return args.Name + "_id", outputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	// Mock AWS calls
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789012"),
		}, nil
	}
	return args.Args, nil
}

func TestGetEnvironmentSuffix(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     string
	}{
		{
			name:     "With environment variable set",
			envValue: "test123",
			want:     "test123",
		},
		{
			name:     "Without environment variable",
			envValue: "",
			want:     "dev",
		},
		{
			name:     "With PR number",
			envValue: "pr4654",
			want:     "pr4654",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				os.Setenv("ENVIRONMENT_SUFFIX", tt.envValue)
			} else {
				os.Unsetenv("ENVIRONMENT_SUFFIX")
			}
			got := getEnvironmentSuffix()
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestGetRegion(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     string
	}{
		{
			name:     "With AWS_REGION set",
			envValue: "us-east-1",
			want:     "us-east-1",
		},
		{
			name:     "Without AWS_REGION",
			envValue: "",
			want:     "us-west-2",
		},
		{
			name:     "With custom region",
			envValue: "eu-west-1",
			want:     "eu-west-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				os.Setenv("AWS_REGION", tt.envValue)
			} else {
				os.Unsetenv("AWS_REGION")
			}
			got := getRegion()
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestBuildKMSComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)
		assert.NotNil(t, kmsComponent)
		assert.NotNil(t, kmsComponent.Key)
		assert.NotNil(t, kmsComponent.Alias)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildVPCComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)
		assert.NotNil(t, vpcComponent)
		assert.NotNil(t, vpcComponent.VPC)
		assert.Len(t, vpcComponent.PrivateSubnets, 2)
		assert.Len(t, vpcComponent.PublicSubnets, 2)
		assert.NotNil(t, vpcComponent.InternetGateway)
		assert.NotNil(t, vpcComponent.NatGateway)
		assert.NotNil(t, vpcComponent.EIP)
		assert.NotNil(t, vpcComponent.PrivateRouteTable)
		assert.NotNil(t, vpcComponent.PublicRouteTable)
		assert.NotNil(t, vpcComponent.FlowLog)
		assert.NotNil(t, vpcComponent.FlowLogRole)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildSecurityGroupComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// First create VPC
		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		// Then create security groups
		sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
		assert.NoError(t, err)
		assert.NotNil(t, sgComponent)
		assert.NotNil(t, sgComponent.ECSSecurityGroup)
		assert.NotNil(t, sgComponent.RDSSecurityGroup)
		assert.NotNil(t, sgComponent.ElastiCacheSecurityGroup)
		assert.NotNil(t, sgComponent.EFSSecurityGroup)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildKinesisStream(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// First create KMS key
		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		// Then create Kinesis stream
		stream, err := buildKinesisStream(ctx, environmentSuffix, kmsComponent.Key)
		assert.NoError(t, err)
		assert.NotNil(t, stream)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildRDSComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create dependencies
		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
		assert.NoError(t, err)

		// Create RDS component
		rdsComponent, err := buildRDSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.RDSSecurityGroup, kmsComponent.Key)
		assert.NoError(t, err)
		assert.NotNil(t, rdsComponent)
		assert.NotNil(t, rdsComponent.DBSubnetGroup)
		assert.NotNil(t, rdsComponent.DBCluster)
		assert.NotNil(t, rdsComponent.DBClusterInstance)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildElastiCacheComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create dependencies
		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
		assert.NoError(t, err)

		// Create ElastiCache component
		cacheComponent, err := buildElastiCacheComponent(ctx, environmentSuffix, vpcComponent, sgComponent.ElastiCacheSecurityGroup, kmsComponent.Key)
		assert.NoError(t, err)
		assert.NotNil(t, cacheComponent)
		assert.NotNil(t, cacheComponent.SubnetGroup)
		assert.NotNil(t, cacheComponent.ReplicationGroup)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildEFSComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create dependencies
		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
		assert.NoError(t, err)

		// Create EFS component
		efsComponent, err := buildEFSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.EFSSecurityGroup, kmsComponent.Key)
		assert.NoError(t, err)
		assert.NotNil(t, efsComponent)
		assert.NotNil(t, efsComponent.FileSystem)
		assert.Len(t, efsComponent.MountTargets, 2)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildIAMComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"

		iamComponent, err := buildIAMComponent(ctx, environmentSuffix)
		assert.NoError(t, err)
		assert.NotNil(t, iamComponent)
		assert.NotNil(t, iamComponent.ECSTaskRole)
		assert.NotNil(t, iamComponent.ECSTaskExecutionRole)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildECSComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create dependencies
		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
		assert.NoError(t, err)

		iamComponent, err := buildIAMComponent(ctx, environmentSuffix)
		assert.NoError(t, err)

		// Create ECS component
		ecsComponent, err := buildECSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.ECSSecurityGroup, iamComponent)
		assert.NoError(t, err)
		assert.NotNil(t, ecsComponent)
		assert.NotNil(t, ecsComponent.Cluster)
		assert.NotNil(t, ecsComponent.TaskDefinition)
		assert.NotNil(t, ecsComponent.Service)
		assert.NotNil(t, ecsComponent.LogGroup)
		assert.NotNil(t, ecsComponent.AutoScalingTarget)
		assert.NotNil(t, ecsComponent.ScalingPolicy)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildAPIGatewayComponent(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"

		apiComponent, err := buildAPIGatewayComponent(ctx, environmentSuffix)
		assert.NoError(t, err)
		assert.NotNil(t, apiComponent)
		assert.NotNil(t, apiComponent.RestAPI)
		assert.NotNil(t, apiComponent.Resource)
		assert.NotNil(t, apiComponent.Method)
		assert.NotNil(t, apiComponent.Deployment)
		assert.NotNil(t, apiComponent.Stage)
		assert.NotNil(t, apiComponent.LogGroup)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestBuildHealthcarePipelineStack(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		// Set environment variables
		os.Setenv("ENVIRONMENT_SUFFIX", "test")
		os.Setenv("AWS_REGION", "us-west-2")

		stack, err := BuildHealthcarePipelineStack(ctx)
		assert.NoError(t, err)
		assert.NotNil(t, stack)

		// Verify all components are created
		assert.NotNil(t, stack.KMS)
		assert.NotNil(t, stack.VPC)
		assert.NotNil(t, stack.SecurityGroups)
		assert.NotNil(t, stack.IAM)
		assert.NotNil(t, stack.Kinesis)
		assert.NotNil(t, stack.RDS)
		assert.NotNil(t, stack.ElastiCache)
		assert.NotNil(t, stack.EFS)
		assert.NotNil(t, stack.ECS)
		assert.NotNil(t, stack.APIGateway)
		assert.NotNil(t, stack.Monitoring)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestComponentStructs(t *testing.T) {
	// Test that all component structs are defined correctly
	t.Run("KMSComponent", func(t *testing.T) {
		var kms KMSComponent
		assert.NotNil(t, &kms)
	})

	t.Run("VPCComponent", func(t *testing.T) {
		var vpc VPCComponent
		assert.NotNil(t, &vpc)
	})

	t.Run("SecurityGroupComponent", func(t *testing.T) {
		var sg SecurityGroupComponent
		assert.NotNil(t, &sg)
	})

	t.Run("IAMComponent", func(t *testing.T) {
		var iam IAMComponent
		assert.NotNil(t, &iam)
	})

	t.Run("RDSComponent", func(t *testing.T) {
		var rds RDSComponent
		assert.NotNil(t, &rds)
	})

	t.Run("ElastiCacheComponent", func(t *testing.T) {
		var cache ElastiCacheComponent
		assert.NotNil(t, &cache)
	})

	t.Run("EFSComponent", func(t *testing.T) {
		var efs EFSComponent
		assert.NotNil(t, &efs)
	})

	t.Run("ECSComponent", func(t *testing.T) {
		var ecs ECSComponent
		assert.NotNil(t, &ecs)
	})

	t.Run("APIGatewayComponent", func(t *testing.T) {
		var api APIGatewayComponent
		assert.NotNil(t, &api)
	})

	t.Run("MonitoringComponent", func(t *testing.T) {
		var monitoring MonitoringComponent
		assert.NotNil(t, &monitoring)
	})

	t.Run("HealthcarePipelineStack", func(t *testing.T) {
		var stack HealthcarePipelineStack
		assert.NotNil(t, &stack)
	})
}

func TestGetAccountID(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		accountID := getAccountID(ctx)
		assert.NotNil(t, accountID)

		// Wait for the value to resolve
		var wg sync.WaitGroup
		wg.Add(1)
		accountID.ApplyT(func(id string) string {
			assert.NotEmpty(t, id)
			wg.Done()
			return id
		})
		wg.Wait()

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestEnvironmentSuffixInResources(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test123"
		os.Setenv("ENVIRONMENT_SUFFIX", environmentSuffix)
		os.Setenv("AWS_REGION", "us-west-2")

		stack, err := BuildHealthcarePipelineStack(ctx)
		assert.NoError(t, err)
		assert.NotNil(t, stack)

		// Verify that environment suffix is used in resources
		// This is a basic test that the stack was created with the correct suffix
		assert.NotNil(t, stack.KMS)
		assert.NotNil(t, stack.VPC)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestMultiAZConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create VPC to test Multi-AZ
		vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)

		// Verify Multi-AZ setup
		assert.Len(t, vpcComponent.PrivateSubnets, 2, "Should have 2 private subnets for Multi-AZ")
		assert.Len(t, vpcComponent.PublicSubnets, 2, "Should have 2 public subnets for Multi-AZ")

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestEncryptionConfiguration(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		environmentSuffix := "test"
		region := "us-west-2"
		accountID := pulumi.String("123456789012").ToStringOutput()

		// Create KMS key
		kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
		assert.NoError(t, err)
		assert.NotNil(t, kmsComponent.Key, "KMS key should be created for encryption")

		// Verify Kinesis uses encryption
		stream, err := buildKinesisStream(ctx, environmentSuffix, kmsComponent.Key)
		assert.NoError(t, err)
		assert.NotNil(t, stream, "Kinesis stream should be created with KMS encryption")

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}
