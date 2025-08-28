package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticache"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix     *string
	Vpc                   awsec2.IVpc
	DatabaseSecurityGroup awsec2.ISecurityGroup
}

type StorageStack struct {
	awscdk.NestedStack
	Database     awsrds.IDatabaseCluster
	S3Bucket     awss3.IBucket
	RedisCluster awselasticache.CfnCacheCluster
}

func NewStorageStack(scope constructs.Construct, id *string, props *StorageStackProps) *StorageStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Get environment suffix with fallback
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil && *props.EnvironmentSuffix != "" {
		envSuffix = *props.EnvironmentSuffix
	}

	// S3 Bucket for static assets
	bucket := awss3.NewBucket(nestedStack, jsii.String("AssetsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("tap-assets-" + envSuffix),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		IntelligentTieringConfigurations: &[]*awss3.IntelligentTieringConfiguration{
			{
				Name:                      jsii.String("EntireBucket"),
				ArchiveAccessTierTime:     awscdk.Duration_Days(jsii.Number(90)),
				DeepArchiveAccessTierTime: awscdk.Duration_Days(jsii.Number(180)),
			},
		},
	})

	// Aurora Serverless v2 Database
	cluster := awsrds.NewDatabaseCluster(nestedStack, jsii.String("AuroraCluster"), &awsrds.DatabaseClusterProps{
		Engine: awsrds.DatabaseClusterEngine_AuroraMysql(&awsrds.AuroraMysqlClusterEngineProps{
			Version: awsrds.AuroraMysqlEngineVersion_VER_3_07_0(),
		}),
		Writer: awsrds.ClusterInstance_ServerlessV2(jsii.String("writer"), &awsrds.ServerlessV2ClusterInstanceProps{
			ScaleWithWriter: jsii.Bool(true),
		}),
		Readers: &[]awsrds.IClusterInstance{
			awsrds.ClusterInstance_ServerlessV2(jsii.String("reader"), &awsrds.ServerlessV2ClusterInstanceProps{
				ScaleWithWriter: jsii.Bool(false),
			}),
		},
		ServerlessV2MinCapacity: jsii.Number(0.5),
		ServerlessV2MaxCapacity: jsii.Number(16),
		Vpc:                     props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
		SecurityGroups:      &[]awsec2.ISecurityGroup{props.DatabaseSecurityGroup},
		DefaultDatabaseName: jsii.String("tapdb"),
		RemovalPolicy:       awscdk.RemovalPolicy_DESTROY,
		DeletionProtection:  jsii.Bool(false),
	})

	// ElastiCache Redis Subnet Group
	subnetGroup := awselasticache.NewCfnSubnetGroup(nestedStack, jsii.String("RedisSubnetGroup"), &awselasticache.CfnSubnetGroupProps{
		Description: jsii.String("Subnet group for Redis cluster"),
		SubnetIds: props.Vpc.SelectSubnets(&awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		}).SubnetIds,
	})

	// ElastiCache Redis Cluster
	redisCluster := awselasticache.NewCfnCacheCluster(nestedStack, jsii.String("RedisCluster"), &awselasticache.CfnCacheClusterProps{
		CacheNodeType:        jsii.String("cache.t3.micro"),
		Engine:               jsii.String("redis"),
		NumCacheNodes:        jsii.Number(1),
		CacheSubnetGroupName: subnetGroup.Ref(),
		VpcSecurityGroupIds:  &[]*string{props.DatabaseSecurityGroup.SecurityGroupId()},
	})

	return &StorageStack{
		NestedStack:  nestedStack,
		Database:     cluster,
		S3Bucket:     bucket,
		RedisCluster: redisCluster,
	}
}
