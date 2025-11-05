# StreamSecure Media Processing Infrastructure

This implementation provides a secure media processing platform using AWS CDK with Go.

## File: lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsefs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticache"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskinesis"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	*awscdk.StackProps
	EnvironmentSuffix *string
}

type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Create VPC
	vpc := awsec2.NewVpc(stack, jsii.String("StreamSecureVPC"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(2),
		NatGateways: jsii.Number(1),
	})

	// Create ECS Cluster
	cluster := awsecs.NewCluster(stack, jsii.String("MediaCluster"), &awsecs.ClusterProps{
		Vpc: vpc,
		ClusterName: jsii.String(fmt.Sprintf("streamsecure-cluster-%s", environmentSuffix)),
	})

	// Create EFS FileSystem
	fileSystem := awsefs.NewFileSystem(stack, jsii.String("SharedStorage"), &awsefs.FileSystemProps{
		Vpc: vpc,
		Encrypted: jsii.Bool(true),
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Aurora Database
	dbCluster := awsrds.NewDatabaseCluster(stack, jsii.String("MediaDB"), &awsrds.DatabaseClusterProps{
		Engine: awsrds.DatabaseClusterEngine_AuroraPostgres(&awsrds.AuroraPostgresClusterEngineProps{
			Version: awsrds.AuroraPostgresEngineVersion_VER_13_7(),
		}),
		Instances: jsii.Number(2),
		DefaultDatabaseName: jsii.String("streamsecure"),
		Vpc: vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// Create ElastiCache Redis
	subnetGroup := awselasticache.NewCfnSubnetGroup(stack, jsii.String("RedisSubnetGroup"), &awselasticache.CfnSubnetGroupProps{
		Description: jsii.String("Subnet group for Redis"),
		SubnetIds: vpc.PrivateSubnets(),
	})

	redis := awselasticache.NewCfnReplicationGroup(stack, jsii.String("SessionCache"), &awselasticache.CfnReplicationGroupProps{
		ReplicationGroupDescription: jsii.String("Redis cluster for sessions"),
		Engine: jsii.String("redis"),
		CacheNodeType: jsii.String("cache.t3.micro"),
		NumCacheClusters: jsii.Number(2),
		AutomaticFailoverEnabled: jsii.Bool(true),
		CacheSubnetGroupName: subnetGroup.Ref(),
	})

	// Create Kinesis Stream
	stream := awskinesis.NewStream(stack, jsii.String("AnalyticsStream"), &awskinesis.StreamProps{
		StreamName: jsii.String(fmt.Sprintf("streamsecure-analytics-%s", environmentSuffix)),
		ShardCount: jsii.Number(2),
	})

	// Create API Gateway
	api := awsapigateway.NewRestApi(stack, jsii.String("MediaAPI"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("streamsecure-api-%s", environmentSuffix)),
		Description: jsii.String("Media processing API"),
	})

	// Create Secrets Manager secret
	secret := awssecretsmanager.NewSecret(stack, jsii.String("DBCredentials"), &awssecretsmanager.SecretProps{
		SecretName: jsii.String(fmt.Sprintf("streamsecure-db-creds-%s", environmentSuffix)),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "admin"}`),
			GenerateStringKey: jsii.String("password"),
		},
	})

	// Output important values
	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value: vpc.VpcId(),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ClusterName"), &awscdk.CfnOutputProps{
		Value: cluster.ClusterName(),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DBEndpoint"), &awscdk.CfnOutputProps{
		Value: dbCluster.ClusterEndpoint().Hostname(),
	})

	awscdk.NewCfnOutput(stack, jsii.String("StreamName"), &awscdk.CfnOutputProps{
		Value: stream.StreamName(),
	})

	awscdk.NewCfnOutput(stack, jsii.String("APIEndpoint"), &awscdk.CfnOutputProps{
		Value: api.Url(),
	})

	return &TapStack{
		Stack: stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
```

## Summary

This implementation creates the core infrastructure components for the StreamSecure media processing platform:

- VPC with public and private subnets
- ECS cluster for container workloads
- EFS file system for shared storage
- Aurora PostgreSQL database cluster
- ElastiCache Redis for caching
- Kinesis Data Stream for analytics
- API Gateway for REST API
- Secrets Manager for credentials

The infrastructure uses the environment suffix for naming resources and is designed to be deployed in the eu-central-1 region.
