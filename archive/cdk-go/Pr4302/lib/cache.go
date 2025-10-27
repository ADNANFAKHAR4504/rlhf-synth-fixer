package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticache"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// CacheConstructProps defines properties for the cache construct.
type CacheConstructProps struct {
	EnvironmentSuffix *string
	Vpc               awsec2.Vpc
}

// CacheConstruct represents the ElastiCache Redis infrastructure.
type CacheConstruct struct {
	constructs.Construct
	ReplicationGroup awselasticache.CfnReplicationGroup
}

// NewCacheConstruct creates ElastiCache Redis cluster for session management.
func NewCacheConstruct(scope constructs.Construct, id *string, props *CacheConstructProps) *CacheConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create security group for Redis cluster
	cacheSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("CacheSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("globalstream-redis-sg-%s", environmentSuffix)),
		Description:       jsii.String("Security group for ElastiCache Redis cluster"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Allow inbound Redis traffic from VPC
	cacheSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(props.Vpc.VpcCidrBlock()),
		awsec2.Port_Tcp(jsii.Number(6379)),
		jsii.String("Allow Redis from VPC"),
		jsii.Bool(false),
	)

	// Create CloudWatch log group for ElastiCache logs
	logGroup := awslogs.NewLogGroup(construct, jsii.String("RedisLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/elasticache/redis-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create subnet group for Multi-AZ deployment
	subnetGroup := awselasticache.NewCfnSubnetGroup(construct, jsii.String("RedisSubnetGroup"), &awselasticache.CfnSubnetGroupProps{
		CacheSubnetGroupName: jsii.String(fmt.Sprintf("globalstream-redis-subnet-%s", environmentSuffix)),
		Description:          jsii.String("Subnet group for Redis cluster"),
		SubnetIds: props.Vpc.SelectSubnets(&awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		}).SubnetIds,
	})

	// Create ElastiCache Redis replication group with cluster mode enabled
	replicationGroup := awselasticache.NewCfnReplicationGroup(construct, jsii.String("RedisCluster"), &awselasticache.CfnReplicationGroupProps{
		ReplicationGroupId:          jsii.String(fmt.Sprintf("globalstream-redis-%s", environmentSuffix)),
		ReplicationGroupDescription: jsii.String("Redis cluster for session management and caching"),
		Engine:                      jsii.String("redis"),
		EngineVersion:               jsii.String("7.0"),
		CacheNodeType:               jsii.String("cache.t3.micro"),
		// Enable Multi-AZ with automatic failover
		MultiAzEnabled:           jsii.Bool(true),
		AutomaticFailoverEnabled: jsii.Bool(true),
		// Number of node groups (shards)
		NumNodeGroups: jsii.Number(2),
		// Replicas per node group
		ReplicasPerNodeGroup: jsii.Number(1),
		// Enable encryption at rest (LGPD compliance)
		AtRestEncryptionEnabled: jsii.Bool(true),
		// Enable encryption in transit
		TransitEncryptionEnabled: jsii.Bool(true),
		TransitEncryptionMode:    jsii.String("required"),
		// Security and networking
		SecurityGroupIds:     &[]*string{cacheSecurityGroup.SecurityGroupId()},
		CacheSubnetGroupName: subnetGroup.CacheSubnetGroupName(),
		// Backup configuration
		SnapshotRetentionLimit: jsii.Number(7),
		SnapshotWindow:         jsii.String("03:00-05:00"),
		// Maintenance window
		PreferredMaintenanceWindow: jsii.String("sun:05:00-sun:07:00"),
		// CloudWatch logs
		LogDeliveryConfigurations: &[]interface{}{
			&awselasticache.CfnReplicationGroup_LogDeliveryConfigurationRequestProperty{
				DestinationType: jsii.String("cloudwatch-logs"),
				DestinationDetails: &awselasticache.CfnReplicationGroup_DestinationDetailsProperty{
					CloudWatchLogsDetails: &awselasticache.CfnReplicationGroup_CloudWatchLogsDestinationDetailsProperty{
						LogGroup: jsii.String(fmt.Sprintf("/aws/elasticache/redis-%s", environmentSuffix)),
					},
				},
				LogFormat: jsii.String("json"),
				LogType:   jsii.String("slow-log"),
			},
		},
	})

	replicationGroup.AddDependency(subnetGroup)
	replicationGroup.Node().AddDependency(logGroup)

	// Tag cluster for identification
	awscdk.Tags_Of(replicationGroup).Add(jsii.String("Purpose"), jsii.String("Session Management"), nil)
	awscdk.Tags_Of(replicationGroup).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)

	return &CacheConstruct{
		Construct:        construct,
		ReplicationGroup: replicationGroup,
	}
}
