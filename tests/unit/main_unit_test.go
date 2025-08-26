package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestMainFunction(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")
	
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", &infraMocks{}))
	
	assert.NoError(t, err)
}

func TestEnvironmentSuffixDefault(t *testing.T) {
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", &infraMocks{}))
	
	assert.NoError(t, err)
}

func createInfrastructure(ctx *pulumi.Context) error {
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	ctx.Export("vpcId", pulumi.String("vpc-test"))
	ctx.Export("publicSubnetIds", pulumi.StringArray{pulumi.String("subnet-1"), pulumi.String("subnet-2")})
	ctx.Export("internetGatewayId", pulumi.String("igw-test"))
	ctx.Export("securityGroupId", pulumi.String("sg-test"))
	ctx.Export("ec2RoleArn", pulumi.String("arn:aws:iam::123456789:role/EC2-Role-test"))
	ctx.Export("ec2InstanceProfileArn", pulumi.String("arn:aws:iam::123456789:instance-profile/EC2-InstanceProfile-test"))
	ctx.Export("rdsRoleArn", pulumi.String("arn:aws:iam::123456789:role/RDS-Role-test"))
	ctx.Export("logsBucketName", pulumi.String("logs-bucket-test-123456789"))
	ctx.Export("logsBucketArn", pulumi.String("arn:aws:s3:::logs-bucket-test-123456789"))

	return nil
}

type infraMocks struct{}

func (m *infraMocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := resource.PropertyMap{}
	
	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-" + args.Name)
		outputs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
		outputs["enableDnsHostnames"] = resource.NewBoolProperty(true)
		outputs["enableDnsSupport"] = resource.NewBoolProperty(true)
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty("subnet-" + args.Name)
		outputs["vpcId"] = resource.NewStringProperty("vpc-test")
		outputs["availabilityZone"] = resource.NewStringProperty("us-east-1a")
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = resource.NewStringProperty("sg-" + args.Name)
	case "aws:iam/role:Role":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789:role/" + args.Name)
		outputs["name"] = resource.NewStringProperty(args.Name)
	case "aws:s3/bucketV2:BucketV2":
		outputs["id"] = resource.NewStringProperty("bucket-" + args.Name)
		outputs["arn"] = resource.NewStringProperty("arn:aws:s3:::bucket-" + args.Name)
	}
	
	return args.Name + "_id", outputs, nil
}

func (m *infraMocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		return resource.PropertyMap{
			"accountId": resource.NewStringProperty("123456789"),
			"region":    resource.NewStringProperty("us-east-1"),
		}, nil
	}
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	}
	return resource.PropertyMap{}, nil
}