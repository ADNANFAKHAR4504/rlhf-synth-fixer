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

	// Create S3 bucket for access logging
	loggingBucket := awss3.NewBucket(construct, jsii.String("AccessLogsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-s3-logs-" + props.Environment),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldAccessLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(30)),
			},
		},
	})

	// Create main S3 bucket with versioning and server access logging
	bucket := awss3.NewBucket(construct, jsii.String("MainBucket"), &awss3.BucketProps{
		BucketName:             jsii.String("proj-s3-" + props.Environment),
		Versioned:              jsii.Bool(true),
		PublicReadAccess:       jsii.Bool(false),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		// Enable event notifications (will be configured in compute construct)
		EventBridgeEnabled: jsii.Bool(true),
	})

	return &StorageConstruct{
		Construct:     construct,
		Bucket:        bucket,
		LoggingBucket: loggingBucket,
	}
}
