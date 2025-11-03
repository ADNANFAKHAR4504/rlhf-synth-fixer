package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
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
	if props != nil && props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if val := stack.Node().TryGetContext(jsii.String("environmentSuffix")); val != nil {
		if suffix, ok := val.(string); ok {
			environmentSuffix = suffix
		} else {
			environmentSuffix = "dev"
		}
	} else {
		environmentSuffix = "dev"
	}

	// Create VPC with 3 AZs
	vpc := awsec2.NewVpc(stack, jsii.String("PaymentDbVpc"), &awsec2.VpcProps{
		VpcName:     jsii.String(fmt.Sprintf("payment-db-vpc-%s", environmentSuffix)),
		MaxAzs:      jsii.Number(3),
		NatGateways: jsii.Number(1),
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

	// Create KMS key for encryption
	encryptionKey := awskms.NewKey(stack, jsii.String("AuroraEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String(fmt.Sprintf("KMS key for Aurora cluster encryption - %s", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})

	// Create database credentials secret
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("DBSecret"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String(fmt.Sprintf("payment-db-credentials-%s", environmentSuffix)),
		Description: jsii.String("Master credentials for Aurora PostgreSQL cluster"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "dbadmin"}`),
			GenerateStringKey:    jsii.String("password"),
			PasswordLength:       jsii.Number(32),
			ExcludePunctuation:   jsii.Bool(true),
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create parameter group for SSL enforcement
	parameterGroup := awsrds.NewParameterGroup(stack, jsii.String("AuroraParameterGroup"), &awsrds.ParameterGroupProps{
		Engine: awsrds.DatabaseClusterEngine_AuroraPostgres(&awsrds.AuroraPostgresClusterEngineProps{
			Version: awsrds.AuroraPostgresEngineVersion_VER_15_7(),
		}),
		Description: jsii.String(fmt.Sprintf("Parameter group for payment processing - %s", environmentSuffix)),
		Parameters: &map[string]*string{
			"rds.force_ssl": jsii.String("1"),
		},
	})

	// Create Aurora cluster
	cluster := awsrds.NewDatabaseCluster(stack, jsii.String("AuroraCluster"), &awsrds.DatabaseClusterProps{
		ClusterIdentifier: jsii.String(fmt.Sprintf("payment-db-cluster-%s", environmentSuffix)),
		Engine: awsrds.DatabaseClusterEngine_AuroraPostgres(&awsrds.AuroraPostgresClusterEngineProps{
			Version: awsrds.AuroraPostgresEngineVersion_VER_15_7(),
		}),
		Credentials: awsrds.Credentials_FromSecret(dbSecret, jsii.String("dbadmin")),
		Writer: awsrds.ClusterInstance_Provisioned(jsii.String("Writer"), &awsrds.ProvisionedClusterInstanceProps{
			InstanceType: awsec2.InstanceType_Of(
				awsec2.InstanceClass_BURSTABLE3,
				awsec2.InstanceSize_MEDIUM,
			),
			PubliclyAccessible:        jsii.Bool(false),
			EnablePerformanceInsights: jsii.Bool(true),
		}),
		Readers: &[]awsrds.IClusterInstance{
			awsrds.ClusterInstance_Provisioned(jsii.String("Reader1"), &awsrds.ProvisionedClusterInstanceProps{
				InstanceType: awsec2.InstanceType_Of(
					awsec2.InstanceClass_BURSTABLE3,
					awsec2.InstanceSize_MEDIUM,
				),
				PubliclyAccessible:        jsii.Bool(false),
				EnablePerformanceInsights: jsii.Bool(true),
			}),
			awsrds.ClusterInstance_Provisioned(jsii.String("Reader2"), &awsrds.ProvisionedClusterInstanceProps{
				InstanceType: awsec2.InstanceType_Of(
					awsec2.InstanceClass_BURSTABLE3,
					awsec2.InstanceSize_MEDIUM,
				),
				PubliclyAccessible:        jsii.Bool(false),
				EnablePerformanceInsights: jsii.Bool(true),
			}),
		},
		Vpc: vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		StorageEncrypted:     jsii.Bool(true),
		StorageEncryptionKey: encryptionKey,
		ParameterGroup:       parameterGroup,
		Backup: &awsrds.BackupProps{
			Retention:       awscdk.Duration_Days(jsii.Number(7)),
			PreferredWindow: jsii.String("03:00-04:00"),
		},
		CloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Enable Performance Insights
	cfnCluster := cluster.Node().DefaultChild().(awsrds.CfnDBCluster)
	cfnCluster.SetEnableCloudwatchLogsExports(&[]*string{
		jsii.String("postgresql"),
	})

	if cfn, ok := cluster.Node().DefaultChild().(awsrds.CfnDBCluster); ok {
		cfn.SetEnableCloudwatchLogsExports(&[]*string{
			jsii.String("postgresql"),
		})
	}

	// Create CloudWatch alarms for CPU
	awscloudwatch.NewAlarm(stack, jsii.String("ClusterCPUAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("payment-db-cpu-alarm-%s", environmentSuffix)),
		AlarmDescription: jsii.String("Alert when cluster CPU exceeds 80%"),
		Metric: cluster.MetricCPUUtilization(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(80),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	})

	// Create CloudWatch alarm for storage
	awscloudwatch.NewAlarm(stack, jsii.String("ClusterStorageAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("payment-db-storage-alarm-%s", environmentSuffix)),
		AlarmDescription: jsii.String("Alert when free local storage is critically low"),
		Metric: cluster.MetricFreeLocalStorage(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(10737418240), // 10 GB in bytes
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_LESS_THAN_THRESHOLD,
	})

	// Create rotation schedule for secrets
	// Use environmentSuffix in the construct ID so nested/hosted rotation stacks and their
	// generated resources are unique per deployment (avoids resource name collisions).
	rotationId := fmt.Sprintf("R-%s", environmentSuffix)
	dbSecret.AddRotationSchedule(jsii.String(rotationId), &awssecretsmanager.RotationScheduleOptions{
		AutomaticallyAfter: awscdk.Duration_Days(jsii.Number(30)),
		HostedRotation:     awssecretsmanager.HostedRotation_PostgreSqlSingleUser(nil),
	})

	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("ClusterEndpoint"), &awscdk.CfnOutputProps{
		Value:       cluster.ClusterEndpoint().SocketAddress(),
		Description: jsii.String("Aurora cluster writer endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("payment-db-cluster-endpoint-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ClusterReaderEndpoint"), &awscdk.CfnOutputProps{
		Value:       cluster.ClusterReadEndpoint().SocketAddress(),
		Description: jsii.String("Aurora cluster reader endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("payment-db-reader-endpoint-%s", environmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("SecretArn"), &awscdk.CfnOutputProps{
		Value:       dbSecret.SecretArn(),
		Description: jsii.String("ARN of the database credentials secret"),
		ExportName:  jsii.String(fmt.Sprintf("payment-db-secret-arn-%s", environmentSuffix)),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
