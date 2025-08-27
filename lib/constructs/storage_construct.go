package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageConstructProps struct {
	Environment string
}

type StorageConstruct struct {
	constructs.Construct
	Bucket        awss3.IBucket
	LoggingBucket awss3.IBucket
}

func NewStorageConstruct(scope constructs.Construct, id string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Enhanced logging bucket
	loggingBucket := awss3.NewBucket(construct, jsii.String("AccessLogsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-s3-logs-" + props.Environment),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldAccessLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:    awss3.StorageClass_INFREQUENT_ACCESS(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
					},
				},
			},
		},
	})

	// Enhanced main bucket with SSL-only policy and Transfer Acceleration
	bucket := awss3.NewBucket(construct, jsii.String("MainBucket"), &awss3.BucketProps{
		BucketName:             jsii.String("proj-s3-" + props.Environment),
		Versioned:              jsii.Bool(true),
		PublicReadAccess:       jsii.Bool(false),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:             jsii.Bool(true),
		TransferAcceleration:   jsii.Bool(true),
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		EventBridgeEnabled:     jsii.Bool(true),
		// Note: IntelligentTiering configuration removed for CDK Go compatibility
	})

	// Note: SSL-only policy configuration simplified for CDK Go compatibility
	// The EnforceSSL: true property above provides the same security benefit

	return &StorageConstruct{
		Construct:     construct,
		Bucket:        bucket,
		LoggingBucket: loggingBucket,
	}
}
