package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the GlobalStream DR solution.
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack and orchestrates all infrastructure components.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Create Secrets Manager secrets first (needed by other resources)
	secrets := NewSecretsConstruct(stack, jsii.String("Secrets"), &SecretsConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create network infrastructure (VPC, subnets, security groups)
	network := NewNetworkConstruct(stack, jsii.String("Network"), &NetworkConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create RDS Aurora Serverless v2 cluster
	database := NewDatabaseConstruct(stack, jsii.String("Database"), &DatabaseConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               network.Vpc,
		DatabaseSecret:    secrets.DatabaseSecret,
	})

	// Create EFS file system for content storage
	storage := NewStorageConstruct(stack, jsii.String("Storage"), &StorageConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               network.Vpc,
	})

	// Create ElastiCache Redis cluster for session management
	_ = NewCacheConstruct(stack, jsii.String("Cache"), &CacheConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               network.Vpc,
	})

	// Create ECS Fargate cluster for media processing
	compute := NewComputeConstruct(stack, jsii.String("Compute"), &ComputeConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               network.Vpc,
		FileSystem:        storage.FileSystem,
		AccessPoint:       storage.AccessPoint,
		EfsSecurityGroup:  storage.SecurityGroup,
	})

	// Create Kinesis Data Stream for real-time analytics
	analytics := NewAnalyticsConstruct(stack, jsii.String("Analytics"), &AnalyticsConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create API Gateway for content delivery
	api := NewApiConstruct(stack, jsii.String("Api"), &ApiConstructProps{
		EnvironmentSuffix: jsii.String(environmentSuffix),
		EcsCluster:        compute.Cluster,
		KinesisStream:     analytics.Stream,
	})

	// Output important resource identifiers
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       network.Vpc.VpcId(),
		Description: jsii.String("VPC ID for the DR infrastructure"),
		ExportName:  jsii.String("VpcId-" + environmentSuffix),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseClusterEndpoint"), &awscdk.CfnOutputProps{
		Value:       database.Cluster.ClusterEndpoint().Hostname(),
		Description: jsii.String("Aurora Serverless v2 cluster endpoint"),
		ExportName:  jsii.String("DatabaseEndpoint-" + environmentSuffix),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ApiGatewayUrl"), &awscdk.CfnOutputProps{
		Value:       api.RestApi.Url(),
		Description: jsii.String("API Gateway URL for content delivery"),
		ExportName:  jsii.String("ApiUrl-" + environmentSuffix),
	})

	awscdk.NewCfnOutput(stack, jsii.String("KinesisStreamName"), &awscdk.CfnOutputProps{
		Value:       analytics.Stream.StreamName(),
		Description: jsii.String("Kinesis Data Stream name for analytics"),
		ExportName:  jsii.String("KinesisStream-" + environmentSuffix),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
