package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// DatabaseConstructProps defines properties for the database construct.
type DatabaseConstructProps struct {
	EnvironmentSuffix *string
	Vpc               awsec2.Vpc
	DatabaseSecret    awssecretsmanager.Secret
}

// DatabaseConstruct represents the RDS Aurora Serverless infrastructure.
type DatabaseConstruct struct {
	constructs.Construct
	Cluster awsrds.DatabaseCluster
}

// NewDatabaseConstruct creates Aurora Serverless v2 cluster for user and content metadata.
func NewDatabaseConstruct(scope constructs.Construct, id *string, props *DatabaseConstructProps) *DatabaseConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create security group for Aurora cluster
	dbSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("globalstream-db-sg-%s", environmentSuffix)),
		Description:       jsii.String("Security group for Aurora Serverless cluster"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Allow inbound PostgreSQL traffic from VPC
	dbSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(props.Vpc.VpcCidrBlock()),
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL from VPC"),
		jsii.Bool(false),
	)

	// Create Aurora Serverless v2 cluster with PostgreSQL
	// Note: SubnetGroup is managed automatically via VpcSubnets
	cluster := awsrds.NewDatabaseCluster(construct, jsii.String("AuroraCluster"), &awsrds.DatabaseClusterProps{
		ClusterIdentifier: jsii.String(fmt.Sprintf("globalstream-aurora-%s", environmentSuffix)),
		Engine: awsrds.DatabaseClusterEngine_AuroraPostgres(&awsrds.AuroraPostgresClusterEngineProps{
			Version: awsrds.AuroraPostgresEngineVersion_VER_15_5(),
		}),
		Credentials: awsrds.Credentials_FromSecret(props.DatabaseSecret, jsii.String("globalstream_admin")),
		Writer: awsrds.ClusterInstance_ServerlessV2(jsii.String("Writer"), &awsrds.ServerlessV2ClusterInstanceProps{
			PubliclyAccessible: jsii.Bool(false),
		}),
		Readers: &[]awsrds.IClusterInstance{
			awsrds.ClusterInstance_ServerlessV2(jsii.String("Reader"), &awsrds.ServerlessV2ClusterInstanceProps{
				PubliclyAccessible: jsii.Bool(false),
				ScaleWithWriter:    jsii.Bool(true),
			}),
		},
		ServerlessV2MinCapacity: jsii.Number(0.5),
		ServerlessV2MaxCapacity: jsii.Number(2),
		Vpc:                     props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		SecurityGroups:      &[]awsec2.ISecurityGroup{dbSecurityGroup},
		DefaultDatabaseName: jsii.String("globalstream"),
		// Enable encryption at rest (LGPD compliance)
		StorageEncrypted: jsii.Bool(true),
		// Backup configuration for 15-minute RPO
		Backup: &awsrds.BackupProps{
			Retention:       awscdk.Duration_Days(jsii.Number(7)),
			PreferredWindow: jsii.String("03:00-04:00"),
		},
		// Enable CloudWatch logging
		CloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		CloudwatchLogsRetention: awslogs.RetentionDays_ONE_WEEK,
		// Enable deletion protection in production (set to false for synthetic tasks)
		DeletionProtection: jsii.Bool(false),
		RemovalPolicy:      awscdk.RemovalPolicy_DESTROY,
	})

	// Tag cluster for compliance
	awscdk.Tags_Of(cluster).Add(jsii.String("Purpose"), jsii.String("User and Content Metadata"), nil)
	awscdk.Tags_Of(cluster).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)
	awscdk.Tags_Of(cluster).Add(jsii.String("RPO"), jsii.String("15 minutes"), nil)
	awscdk.Tags_Of(cluster).Add(jsii.String("RTO"), jsii.String("1 hour"), nil)

	return &DatabaseConstruct{
		Construct: construct,
		Cluster:   cluster,
	}
}
