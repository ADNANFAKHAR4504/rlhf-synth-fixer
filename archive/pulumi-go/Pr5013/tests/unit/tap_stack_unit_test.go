//go:build !integration
// +build !integration

package main

import (
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	return args.Name + "_id", args.Inputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := resource.PropertyMap{}
	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		outputs["accountId"] = resource.NewStringProperty("123456789012")
	}
	return outputs, nil
}

func TestKMSKeyCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		key, err := kms.NewKey(ctx, "test-kms", &kms.KeyArgs{
			Description:          pulumi.String("Test KMS key"),
			DeletionWindowInDays: pulumi.Int(7),
			EnableKeyRotation:    pulumi.Bool(true),
		})
		assert.NoError(t, err)
		assert.NotNil(t, key)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestVPCCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		vpc, err := ec2.NewVpc(ctx, "test-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
		})
		assert.NoError(t, err)
		assert.NotNil(t, vpc)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestSubnetCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		vpc, _ := ec2.NewVpc(ctx, "test-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		})

		subnet, err := ec2.NewSubnet(ctx, "test-subnet", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.1.0/24"),
			AvailabilityZone: pulumi.String("eu-west-2a"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, subnet)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestKinesisStreamCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		stream, err := kinesis.NewStream(ctx, "test-stream", &kinesis.StreamArgs{
			Name:            pulumi.String("test-patient-data-stream"),
			ShardCount:      pulumi.Int(4),
			RetentionPeriod: pulumi.Int(24),
			EncryptionType:  pulumi.String("KMS"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, stream)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestRDSClusterCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		cluster, err := rds.NewCluster(ctx, "test-cluster", &rds.ClusterArgs{
			ClusterIdentifier: pulumi.String("test-aurora-cluster"),
			Engine:            pulumi.String("aurora-postgresql"),
			EngineMode:        pulumi.String("provisioned"),
			EngineVersion:     pulumi.String("15.4"),
			StorageEncrypted:  pulumi.Bool(true),
			SkipFinalSnapshot: pulumi.Bool(true),
			Serverlessv2ScalingConfiguration: &rds.ClusterServerlessv2ScalingConfigurationArgs{
				MaxCapacity: pulumi.Float64(2.0),
				MinCapacity: pulumi.Float64(0.5),
			},
		})
		assert.NoError(t, err)
		assert.NotNil(t, cluster)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestRDSClusterInstanceCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		cluster, _ := rds.NewCluster(ctx, "test-cluster", &rds.ClusterArgs{
			ClusterIdentifier: pulumi.String("test-aurora-cluster"),
			Engine:            pulumi.String("aurora-postgresql"),
			SkipFinalSnapshot: pulumi.Bool(true),
		})

		instance, err := rds.NewClusterInstance(ctx, "test-instance", &rds.ClusterInstanceArgs{
			Identifier:        pulumi.String("test-aurora-instance"),
			ClusterIdentifier: cluster.ID(),
			InstanceClass:     pulumi.String("db.serverless"),
			Engine:            pulumi.String("aurora-postgresql"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, instance)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestElastiCacheReplicationGroupCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		cache, err := elasticache.NewReplicationGroup(ctx, "test-cache", &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String("test-redis-cache"),
			Description:              pulumi.String("Test Redis cache"),
			Engine:                   pulumi.String("redis"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			AutomaticFailoverEnabled: pulumi.Bool(true),
			MultiAzEnabled:           pulumi.Bool(true),
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
		})
		assert.NoError(t, err)
		assert.NotNil(t, cache)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestECSClusterCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		cluster, err := ecs.NewCluster(ctx, "test-ecs-cluster", &ecs.ClusterArgs{
			Name: pulumi.String("test-healthcare-processing"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, cluster)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestECSTaskDefinitionCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		taskDef, err := ecs.NewTaskDefinition(ctx, "test-task", &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String("test-family"),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("512"),
			Memory:                  pulumi.String("1024"),
			ContainerDefinitions:    pulumi.String(`[{"name":"test","image":"nginx"}]`),
		})
		assert.NoError(t, err)
		assert.NotNil(t, taskDef)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestAPIGatewayCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		api, err := apigateway.NewRestApi(ctx, "test-api", &apigateway.RestApiArgs{
			Name:        pulumi.String("test-healthcare-api"),
			Description: pulumi.String("Test API Gateway"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, api)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

func TestSecurityGroupCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		vpc, _ := ec2.NewVpc(ctx, "test-vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		})

		sg, err := ec2.NewSecurityGroup(ctx, "test-sg", &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Test security group"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, sg)
		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}
