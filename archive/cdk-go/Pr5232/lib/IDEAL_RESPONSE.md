# StreamSecure Media Processing Infrastructure - Production Ready

This document contains the exact Go implementation for `lib/tap_stack.go` so the IDEAL_RESPONSE is an authoritative representation of the repository implementation.

## File: lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsefs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticache"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskinesis"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the StreamSecure media processing platform.
//
// This stack creates a complete, production-ready secure media processing infrastructure
// with all required AWS services properly configured with encryption, multi-AZ deployment,
// and security best practices.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack with complete infrastructure.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance with all required infrastructure components.
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

	// =====================================================================
	// ENCRYPTION KEYS - Customer-managed KMS keys with automatic rotation
	// =====================================================================

	// KMS key for RDS encryption
	rdsKey := awskms.NewKey(stack, jsii.String("RDSEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String(fmt.Sprintf("KMS key for RDS Aurora encryption - %s", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		Alias:             jsii.String(fmt.Sprintf("alias/streamsecure-rds-%s", environmentSuffix)),
	})

	// KMS key for EFS encryption
	efsKey := awskms.NewKey(stack, jsii.String("EFSEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String(fmt.Sprintf("KMS key for EFS encryption - %s", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		Alias:             jsii.String(fmt.Sprintf("alias/streamsecure-efs-%s", environmentSuffix)),
	})

	// KMS key for Secrets Manager encryption
	secretsKey := awskms.NewKey(stack, jsii.String("SecretsEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String(fmt.Sprintf("KMS key for Secrets Manager encryption - %s", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		Alias:             jsii.String(fmt.Sprintf("alias/streamsecure-secrets-%s", environmentSuffix)),
	})

	// KMS key for Kinesis encryption
	kinesisKey := awskms.NewKey(stack, jsii.String("KinesisEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String(fmt.Sprintf("KMS key for Kinesis encryption - %s", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		Alias:             jsii.String(fmt.Sprintf("alias/streamsecure-kinesis-%s", environmentSuffix)),
	})

	// =====================================================================
	// VPC AND NETWORKING - Multi-AZ VPC with public and private subnets
	// =====================================================================

	// Create VPC with proper subnet configuration
	vpc := awsec2.NewVpc(stack, jsii.String("StreamSecureVPC"), &awsec2.VpcProps{
		VpcName:     jsii.String(fmt.Sprintf("streamsecure-vpc-%s", environmentSuffix)),
		MaxAzs:      jsii.Number(2),
		NatGateways: jsii.Number(2), // One NAT Gateway per AZ for high availability
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// =====================================================================
	// SECURITY GROUPS - Least privilege access controls
	// =====================================================================

	// Security group for ECS tasks
	ecsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ECSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for ECS tasks"),
		SecurityGroupName: jsii.String(fmt.Sprintf("streamsecure-ecs-sg-%s", environmentSuffix)),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Security group for RDS
	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("RDSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for RDS Aurora cluster"),
		SecurityGroupName: jsii.String(fmt.Sprintf("streamsecure-rds-sg-%s", environmentSuffix)),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow ECS tasks to connect to RDS on PostgreSQL port
	rdsSecurityGroup.AddIngressRule(
		ecsSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL access from ECS tasks"),
		jsii.Bool(false),
	)

	// Security group for ElastiCache
	cacheSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("CacheSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for ElastiCache Redis cluster"),
		SecurityGroupName: jsii.String(fmt.Sprintf("streamsecure-cache-sg-%s", environmentSuffix)),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow ECS tasks to connect to Redis
	cacheSecurityGroup.AddIngressRule(
		ecsSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(6379)),
		jsii.String("Allow Redis access from ECS tasks"),
		jsii.Bool(false),
	)

	// Security group for EFS
	efsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("EFSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		Description:       jsii.String("Security group for EFS file system"),
		SecurityGroupName: jsii.String(fmt.Sprintf("streamsecure-efs-sg-%s", environmentSuffix)),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow ECS tasks to access EFS
	efsSecurityGroup.AddIngressRule(
		ecsSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(2049)),
		jsii.String("Allow NFS access from ECS tasks"),
		jsii.Bool(false),
	)

	// =====================================================================
	// ECS CLUSTER AND EFS - Container orchestration with shared storage
	// =====================================================================

	// Create ECS Cluster
	cluster := awsecs.NewCluster(stack, jsii.String("MediaCluster"), &awsecs.ClusterProps{
		Vpc:               vpc,
		ClusterName:       jsii.String(fmt.Sprintf("streamsecure-cluster-%s", environmentSuffix)),
		ContainerInsights: jsii.Bool(true), // Enable Container Insights for monitoring
	})

	// Create EFS FileSystem with encryption
	fileSystem := awsefs.NewFileSystem(stack, jsii.String("SharedStorage"), &awsefs.FileSystemProps{
		Vpc:             vpc,
		FileSystemName:  jsii.String(fmt.Sprintf("streamsecure-efs-%s", environmentSuffix)),
		Encrypted:       jsii.Bool(true),
		KmsKey:          efsKey,
		PerformanceMode: awsefs.PerformanceMode_GENERAL_PURPOSE,
		ThroughputMode:  awsefs.ThroughputMode_BURSTING,
		RemovalPolicy:   awscdk.RemovalPolicy_DESTROY,
		SecurityGroup:   efsSecurityGroup,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
	})

	// Create IAM role for ECS task execution
	_ = awsiam.NewRole(stack, jsii.String("ECSTaskExecutionRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ecs-tasks.amazonaws.com"), nil),
		RoleName:  jsii.String(fmt.Sprintf("streamsecure-ecs-exec-role-%s", environmentSuffix)),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AmazonECSTaskExecutionRolePolicy")),
		},
	})

	// Create IAM role for ECS tasks
	ecsTaskRole := awsiam.NewRole(stack, jsii.String("ECSTaskRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ecs-tasks.amazonaws.com"), nil),
		RoleName:  jsii.String(fmt.Sprintf("streamsecure-ecs-task-role-%s", environmentSuffix)),
	})

	// Grant ECS task role access to Kinesis
	ecsTaskRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: jsii.Strings(
			"kinesis:PutRecord",
			"kinesis:PutRecords",
			"kinesis:DescribeStream",
		),
		Resources: jsii.Strings(*awskinesis.NewStream(stack, jsii.String("TempStreamRef"), &awskinesis.StreamProps{}).StreamArn()),
	}))

	// =====================================================================
	// DATABASE - Aurora PostgreSQL with Multi-AZ and encryption
	// =====================================================================

	// Create database credentials in Secrets Manager
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("DBCredentials"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String(fmt.Sprintf("streamsecure-db-creds-%s", environmentSuffix)),
		Description: jsii.String("Database credentials for Aurora PostgreSQL"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "dbadmin"}`),
			GenerateStringKey:    jsii.String("password"),
			PasswordLength:       jsii.Number(32),
			ExcludeCharacters:    jsii.String("\"@/\\"),
			ExcludePunctuation:   jsii.Bool(true),
		},
		EncryptionKey: secretsKey,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Aurora PostgreSQL cluster with Multi-AZ
	dbCluster := awsrds.NewDatabaseCluster(stack, jsii.String("MediaDB"), &awsrds.DatabaseClusterProps{
		Engine: awsrds.DatabaseClusterEngine_AuroraPostgres(&awsrds.AuroraPostgresClusterEngineProps{
			Version: awsrds.AuroraPostgresEngineVersion_VER_14_6(),
		}),
		ClusterIdentifier:   jsii.String(fmt.Sprintf("streamsecure-db-%s", environmentSuffix)),
		Credentials:         awsrds.Credentials_FromSecret(dbSecret, jsii.String("dbadmin")),
		DefaultDatabaseName: jsii.String("streamsecure"),
		Instances:           jsii.Number(2), // Multi-AZ deployment with 2 instances
		InstanceProps: &awsrds.InstanceProps{
			InstanceType: awsec2.InstanceType_Of(
				awsec2.InstanceClass_BURSTABLE3,
				awsec2.InstanceSize_MEDIUM,
			),
			Vpc: vpc,
			VpcSubnets: &awsec2.SubnetSelection{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
			SecurityGroups: &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		},
		StorageEncrypted:     jsii.Bool(true),
		StorageEncryptionKey: rdsKey,
		Backup: &awsrds.BackupProps{
			Retention:       awscdk.Duration_Days(jsii.Number(7)),
			PreferredWindow: jsii.String("03:00-04:00"),
		},
		PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
		CloudwatchLogsExports:      jsii.Strings("postgresql"),
		CloudwatchLogsRetention:    awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy:              awscdk.RemovalPolicy_DESTROY,
	})

	// Grant ECS task role access to database secret
	dbSecret.GrantRead(ecsTaskRole, nil)

	// =====================================================================
	// ELASTICACHE REDIS - Session management and caching
	// =====================================================================

	// Create subnet group for ElastiCache
	privateSubnetIds := make([]*string, 0)
	for _, subnet := range *vpc.PrivateSubnets() {
		privateSubnetIds = append(privateSubnetIds, subnet.SubnetId())
	}

	cacheSubnetGroup := awselasticache.NewCfnSubnetGroup(stack, jsii.String("RedisSubnetGroup"), &awselasticache.CfnSubnetGroupProps{
		Description:          jsii.String("Subnet group for ElastiCache Redis cluster"),
		SubnetIds:            &privateSubnetIds,
		CacheSubnetGroupName: jsii.String(fmt.Sprintf("streamsecure-redis-subnet-%s", environmentSuffix)),
	})

	// Create ElastiCache Redis replication group with encryption
	redis := awselasticache.NewCfnReplicationGroup(stack, jsii.String("SessionCache"), &awselasticache.CfnReplicationGroupProps{
		ReplicationGroupId:          jsii.String(fmt.Sprintf("streamsecure-redis-%s", environmentSuffix)),
		ReplicationGroupDescription: jsii.String("Redis cluster for session management and caching"),
		Engine:                      jsii.String("redis"),
		EngineVersion:               jsii.String("7.0"),
		CacheNodeType:               jsii.String("cache.t3.micro"),
		NumCacheClusters:            jsii.Number(2), // Multi-node for high availability
		AutomaticFailoverEnabled:    jsii.Bool(true),
		MultiAzEnabled:              jsii.Bool(true),
		AtRestEncryptionEnabled:     jsii.Bool(true),
		TransitEncryptionEnabled:    jsii.Bool(true),
		CacheSubnetGroupName:        cacheSubnetGroup.CacheSubnetGroupName(),
		SecurityGroupIds:            jsii.Strings(*cacheSecurityGroup.SecurityGroupId()),
		Port:                        jsii.Number(6379),
		SnapshotRetentionLimit:      jsii.Number(5),
		SnapshotWindow:              jsii.String("03:00-05:00"),
		PreferredMaintenanceWindow:  jsii.String("sun:05:00-sun:07:00"),
	})
	redis.AddDependency(cacheSubnetGroup)

	// =====================================================================
	// KINESIS DATA STREAMS - Real-time analytics pipeline
	// =====================================================================

	// Create Kinesis Data Stream with encryption
	stream := awskinesis.NewStream(stack, jsii.String("AnalyticsStream"), &awskinesis.StreamProps{
		ShardCount:      jsii.Number(2),
		Encryption:      awskinesis.StreamEncryption_KMS,
		EncryptionKey:   kinesisKey,
		RetentionPeriod: awscdk.Duration_Hours(jsii.Number(24)),
	})

	// Create IAM role for Kinesis producers
	kinesisProducerRole := awsiam.NewRole(stack, jsii.String("KinesisProducerRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		RoleName:  jsii.String(fmt.Sprintf("streamsecure-kinesis-producer-%s", environmentSuffix)),
	})

	stream.GrantWrite(kinesisProducerRole)

	// =====================================================================
	// API GATEWAY - RESTful API with rate limiting
	// =====================================================================

	// Create CloudWatch log group for API Gateway
	apiLogGroup := awslogs.NewLogGroup(stack, jsii.String("APIGatewayLogs"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/apigateway/streamsecure-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create API Gateway with proper configuration
	api := awsapigateway.NewRestApi(stack, jsii.String("MediaAPI"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("streamsecure-api-%s", environmentSuffix)),
		Description: jsii.String("StreamSecure media processing API"),
		DeployOptions: &awsapigateway.StageOptions{
			StageName:            jsii.String("prod"),
			ThrottlingRateLimit:  jsii.Number(1000),
			ThrottlingBurstLimit: jsii.Number(2000),
			LoggingLevel:         awsapigateway.MethodLoggingLevel_INFO,
			DataTraceEnabled:     jsii.Bool(true),
			AccessLogDestination: awsapigateway.NewLogGroupLogDestination(apiLogGroup),
			AccessLogFormat:      awsapigateway.AccessLogFormat_JsonWithStandardFields(nil),
		},
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
		},
	})

	// Create API key for authentication
	apiKey := api.AddApiKey(jsii.String("APIKey"), &awsapigateway.ApiKeyOptions{
		ApiKeyName:  jsii.String(fmt.Sprintf("streamsecure-api-key-%s", environmentSuffix)),
		Description: jsii.String("API key for StreamSecure API"),
	})

	// Create usage plan with throttling and quota
	usagePlan := api.AddUsagePlan(jsii.String("UsagePlan"), &awsapigateway.UsagePlanProps{
		Name:        jsii.String(fmt.Sprintf("streamsecure-usage-plan-%s", environmentSuffix)),
		Description: jsii.String("Usage plan for StreamSecure API"),
		Throttle: &awsapigateway.ThrottleSettings{
			RateLimit:  jsii.Number(500),
			BurstLimit: jsii.Number(1000),
		},
		Quota: &awsapigateway.QuotaSettings{
			Limit:  jsii.Number(100000),
			Period: awsapigateway.Period_MONTH,
		},
	})

	usagePlan.AddApiKey(apiKey, nil)
	usagePlan.AddApiStage(&awsapigateway.UsagePlanPerApiStage{
		Api:   api,
		Stage: api.DeploymentStage(),
	})

	// Add health check endpoint
	health := api.Root().AddResource(jsii.String("health"), nil)
	health.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.IntegrationOptions{
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseTemplates: &map[string]*string{
					"application/json": jsii.String(`{"status": "healthy"}`),
				},
			},
		},
		PassthroughBehavior: awsapigateway.PassthroughBehavior_NEVER,
		RequestTemplates: &map[string]*string{
			"application/json": jsii.String(`{"statusCode": 200}`),
		},
	}), &awsapigateway.MethodOptions{
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
			},
		},
	})

	// =====================================================================
	// ADDITIONAL SECRETS - Encryption keys and API credentials
	// =====================================================================

	// Create secret for API encryption keys
	_ = awssecretsmanager.NewSecret(stack, jsii.String("APIEncryptionKeys"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String(fmt.Sprintf("streamsecure-api-keys-%s", environmentSuffix)),
		Description: jsii.String("Encryption keys for API data"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"api_key": "placeholder"}`),
			GenerateStringKey:    jsii.String("encryption_key"),
			PasswordLength:       jsii.Number(64),
		},
		EncryptionKey: secretsKey,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// =====================================================================
	// OUTPUTS - Export important values
	// =====================================================================

	awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-VPC-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ClusterName"), &awscdk.CfnOutputProps{
		Value:       cluster.ClusterName(),
		Description: jsii.String("ECS Cluster Name"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-Cluster-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("FileSystemId"), &awscdk.CfnOutputProps{
		Value:       fileSystem.FileSystemId(),
		Description: jsii.String("EFS File System ID"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-EFS-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DBEndpoint"), &awscdk.CfnOutputProps{
		Value:       dbCluster.ClusterEndpoint().Hostname(),
		Description: jsii.String("Aurora Database Endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-DB-Endpoint-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DBSecretArn"), &awscdk.CfnOutputProps{
		Value:       dbSecret.SecretArn(),
		Description: jsii.String("Database Credentials Secret ARN"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-DB-Secret-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("RedisEndpoint"), &awscdk.CfnOutputProps{
		Value:       redis.AttrPrimaryEndPointAddress(),
		Description: jsii.String("ElastiCache Redis Primary Endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-Redis-Endpoint-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("StreamName"), &awscdk.CfnOutputProps{
		Value:       stream.StreamName(),
		Description: jsii.String("Kinesis Data Stream Name"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-Stream-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("StreamArn"), &awscdk.CfnOutputProps{
		Value:       stream.StreamArn(),
		Description: jsii.String("Kinesis Data Stream ARN"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-Stream-ARN-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("APIEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway Endpoint URL"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-API-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("APIKeyId"), &awscdk.CfnOutputProps{
		Value:       apiKey.KeyId(),
		Description: jsii.String("API Key ID"),
		ExportName:  jsii.String(fmt.Sprintf("StreamSecure-APIKey-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("RDSKMSKeyArn"), &awscdk.CfnOutputProps{
		Value:       rdsKey.KeyArn(),
		Description: jsii.String("RDS KMS Key ARN"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("EFSKMSKeyArn"), &awscdk.CfnOutputProps{
		Value:       efsKey.KeyArn(),
		Description: jsii.String("EFS KMS Key ARN"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("SecretsKMSKeyArn"), &awscdk.CfnOutputProps{
		Value:       secretsKey.KeyArn(),
		Description: jsii.String("Secrets Manager KMS Key ARN"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("KinesisKMSKeyArn"), &awscdk.CfnOutputProps{
		Value:       kinesisKey.KeyArn(),
		Description: jsii.String("Kinesis KMS Key ARN"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}

```

## Summary

This `IDEAL_RESPONSE.md` now contains the authoritative, verbatim contents of `lib/tap_stack.go`. It documents the resources created (VPC, ECS cluster, EFS, Aurora, ElastiCache, Kinesis, API Gateway, Secrets Manager) and reflects the implementation choices:

- Kinesis stream is created with construct id `AnalyticsStream` and no explicit StreamName (AWS will assign a name).
- An auxiliary `TempStreamRef` is used in an IAM policy statement to provide a stream ARN in the policy (this is present in the implementation and may be refactored to use the main `stream` variable if desired).

If you'd like, I can implement the recommended code refactor to remove the `TempStreamRef` and point the IAM policy at the real `stream` (low-risk code change). Otherwise this file now satisfies the documentation parity requirement.
