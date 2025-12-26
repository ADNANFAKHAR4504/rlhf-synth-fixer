package main

import (
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestCreateKMSKeyErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-encryption-key")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		infra := NewMultiRegionInfrastructure(ctx, config)
		_, err := infra.CreateKMSKey()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateS3BucketErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-static-assets")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateS3Bucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudFrontDistributionErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-distribution")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		bucket, err := infra.CreateS3Bucket(key)
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudFrontDistribution(bucket)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateIAMResourcesErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-ec2-role")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		_, err := infra.CreateIAMResources()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestDeployRegionalResourcesErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("provider-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudTrailBucketErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-cloudtrail-logs")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudTrailBucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateCloudTrailErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-cloudtrail")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		infra := NewMultiRegionInfrastructure(ctx, config)
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		bucket, err := infra.CreateCloudTrailBucket(key)
		if err != nil {
			return err
		}
		return infra.CreateCloudTrail(bucket)
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestDeployErrorOnKMSKey(t *testing.T) {
	reset := setMockFailNamePrefixes("test-encryption-key")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestDeployErrorOnS3Bucket(t *testing.T) {
	reset := setMockFailNamePrefixes("test-static-assets")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestDeployErrorOnCloudFront(t *testing.T) {
	reset := setMockFailNamePrefixes("test-distribution")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestDeployErrorOnIAM(t *testing.T) {
	reset := setMockFailNamePrefixes("test-ec2-role")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestDeployErrorOnRegionalResources(t *testing.T) {
	reset := setMockFailNamePrefixes("provider-fail-region")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Regions = []string{"fail-region"}
		infra := NewMultiRegionInfrastructure(ctx, config)
		return infra.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestCreateKMSAliasErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-encryption-key-alias")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		_, err := infra.CreateKMSKey()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestS3BucketEncryptionErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-bucket-encryption")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateS3Bucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestS3BucketVersioningErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-bucket-versioning")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateS3Bucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestS3BucketPublicAccessBlockErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-bucket-pab")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateS3Bucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestS3AccessLogBucketErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-access-logs")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateS3Bucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestCloudFrontDistributionPolicyErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-bucket-policy")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		bucket, err := infra.CreateS3Bucket(key)
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudFrontDistribution(bucket)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestIAMRolePolicyErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-ec2-policy")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		_, err := infra.CreateIAMResources()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestIAMInstanceProfileErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-ec2-profile")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		_, err := infra.CreateIAMResources()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestRDSMonitoringRoleErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-rds-monitoring-role")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		_, err := infra.CreateIAMResources()
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestVPCCreationErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-vpc-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestRegionalKMSKeyErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-kms-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestSubnetCreationErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-public-1-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestSecurityGroupErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-db-sg-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestRDSSubnetGroupErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-db-subnet-group-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestLogGroupErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-app-logs-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestDashboardErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-dashboard-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestCloudTrailBucketEncryptionErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-cloudtrail-bucket-encryption")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudTrailBucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestCloudTrailBucketPABErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-cloudtrail-bucket-pab")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudTrailBucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestCloudTrailBucketPolicyErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-cloudtrail-bucket-policy")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		if err != nil {
			return err
		}
		_, err = infra.CreateCloudTrailBucket(key)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestInternetGatewayErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-igw-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestRouteTableErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-public-rt-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}

func TestRouteTableAssociationErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-public-1-rta-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		if err != nil {
			return err
		}
		_, err = infra.DeployRegionalResources("us-east-1", roles)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.Error(t, err)
}
