package main

import (
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestCreateSubnets_PublicSubnet2ErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-public-2-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-public2-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "public2-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateSubnets("us-east-1", vpc, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateSubnets_PrivateSubnet1ErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-private-1-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-private1-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "private1-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateSubnets("us-east-1", vpc, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateSubnets_PrivateSubnet2ErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-private-2-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-private2-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "private2-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateSubnets("us-east-1", vpc, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}

func TestCreateSubnets_RouteTableAssociation2ErrorPath(t *testing.T) {
	reset := setMockFailNamePrefixes("test-public-2-rta-us-east-1")
	defer reset()

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())

		provider, err := aws.NewProvider(ctx, "provider-us-east-1-rta2-fail", &aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
		if err != nil {
			return err
		}

		vpc, err := ec2.NewVpc(ctx, "rta2-fail-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = infra.CreateSubnets("us-east-1", vpc, provider)
		return err
	}, pulumi.WithMocks("proj", "stack", mocks{}))

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mocked failure")
}
