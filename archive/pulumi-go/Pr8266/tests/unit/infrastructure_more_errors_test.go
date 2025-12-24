package main

import (
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestCreateS3BucketLoggingErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-bucket-logging")
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
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateSubnetsGetAvailabilityZonesErrorPath(t *testing.T) {
	resetCalls := setMockFailCallTokenPrefixes("aws:index/getAvailabilityZones:getAvailabilityZones")
	defer resetCalls()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-az-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "az-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateSubnets("us-east-1", vpc, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked call failure")
}

func TestCreateRDSInstanceErrorOnNewInstance(t *testing.T) {
	reset := setMockFailNamePrefixes("test-database-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-rds-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		// Minimal dependencies; we only care that CreateRDSInstance reaches rds.NewInstance.
		vpc, err := ec2.NewVpc(ctx, "rds-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		subnet1, err := ec2.NewSubnet(ctx, "rds-fail-subnet-1", &ec2.SubnetArgs{
			VpcId:     vpc.ID(),
			CidrBlock: pulumi.String("10.0.10.0/24"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		subnet2, err := ec2.NewSubnet(ctx, "rds-fail-subnet-2", &ec2.SubnetArgs{
			VpcId:     vpc.ID(),
			CidrBlock: pulumi.String("10.0.11.0/24"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		sg, err := ec2.NewSecurityGroup(ctx, "rds-fail-sg", &ec2.SecurityGroupArgs{
			VpcId: vpc.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		kmsKey, err := kms.NewKey(ctx, "rds-fail-kms-key", &kms.KeyArgs{
			Description: pulumi.String("Test KMS key"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		monitoringRole, err := iam.NewRole(ctx, "rds-fail-monitoring-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version": "2012-10-17", "Statement": [{"Action": "sts:AssumeRole", "Effect": "Allow", "Principal": {"Service": "monitoring.rds.amazonaws.com"}}]}`),
		})
		if err != nil {
			return err
		}

		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "rds-fail-db-subnet-group", &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateRDSInstance("us-east-1", dbSubnetGroup, sg, kmsKey, monitoringRole, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}
