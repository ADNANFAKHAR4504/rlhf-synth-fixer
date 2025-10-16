package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// getEnvironmentSuffix returns the environment suffix from environment variables
func getEnvironmentSuffix() string {
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = "dev"
	}
	return suffix
}

// getRegion returns the AWS region from environment variables
func getRegion() string {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-southeast-1"
	}
	return region
}

// getAccountID returns the AWS account ID
func getAccountID(ctx *pulumi.Context) pulumi.StringOutput {
	caller, err := aws.GetCallerIdentity(ctx, nil, nil)
	if err != nil {
		return pulumi.String("").ToStringOutput()
	}
	return pulumi.String(caller.AccountId).ToStringOutput()
}

// KMSComponent represents KMS encryption resources
type KMSComponent struct {
	Key   *kms.Key
	Alias *kms.Alias
}

// IAMComponent represents IAM roles and policies
type IAMComponent struct {
	FirehoseRole   *iam.Role
	FirehosePolicy *iam.RolePolicy
}

// StorageComponent represents S3 storage resources
type StorageComponent struct {
	TransactionBucket *s3.BucketV2
	LoggingBucket     *s3.BucketV2
}

// StreamingComponent represents Kinesis streaming resources
type StreamingComponent struct {
	DataStream     *kinesis.Stream
	DeliveryStream *kinesis.FirehoseDeliveryStream
}

// MonitoringComponent represents CloudWatch monitoring resources
type MonitoringComponent struct {
	KinesisLogGroup  *cloudwatch.LogGroup
	FirehoseLogGroup *cloudwatch.LogGroup
	ThrottleAlarm    *cloudwatch.MetricAlarm
	FailureAlarm     *cloudwatch.MetricAlarm
}

// DataPipelineStack represents the complete data pipeline infrastructure
type DataPipelineStack struct {
	KMS        *KMSComponent
	IAM        *IAMComponent
	Storage    *StorageComponent
	Streaming  *StreamingComponent
	Monitoring *MonitoringComponent
}

// buildKMSComponent creates KMS key for encryption
func buildKMSComponent(ctx *pulumi.Context, environmentSuffix string, region string, accountID pulumi.StringOutput) (*KMSComponent, error) {
	// Create KMS key policy
	keyPolicy := pulumi.All(accountID).ApplyT(func(args []interface{}) string {
		accID := args[0].(string)
		return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::%s:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Kinesis to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "kinesis.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow Firehose to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "firehose.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow S3 to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.%s.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "ArnLike": {
          "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:%s:%s:*"
        }
      }
    }
  ]
}`, accID, region, region, accID)
	}).(pulumi.StringOutput)

	// Create KMS key
	key, err := kms.NewKey(ctx, "PaymentDataKey", &kms.KeyArgs{
		Description:          pulumi.String(fmt.Sprintf("KMS key for payment data encryption - %s", environmentSuffix)),
		DeletionWindowInDays: pulumi.Int(7),
		EnableKeyRotation:    pulumi.Bool(true),
		Policy:               keyPolicy,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("payment-data-key-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("payment-data-encryption"),
			"Compliance":  pulumi.String("PCI-DSS"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating KMS key: %v", err)
	}

	// Create KMS alias
	alias, err := kms.NewAlias(ctx, "PaymentDataKeyAlias", &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/payment-data-%s", environmentSuffix)),
		TargetKeyId: key.KeyId,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating KMS alias: %v", err)
	}

	return &KMSComponent{
		Key:   key,
		Alias: alias,
	}, nil
}

// buildStorageComponent creates S3 buckets for data storage
func buildStorageComponent(ctx *pulumi.Context, environmentSuffix string, region string, accountID pulumi.StringOutput, kmsKey *kms.Key) (*StorageComponent, error) {
	// Create logging bucket first
	loggingBucket, err := s3.NewBucketV2(ctx, "LoggingBucket", &s3.BucketV2Args{
		Bucket: pulumi.String(fmt.Sprintf("ecommerce-access-logs-%s", environmentSuffix)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecommerce-access-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("access-logging"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating logging bucket: %v", err)
	}

	// Configure logging bucket ownership controls to allow ACLs
	loggingBucketOwnership, err := s3.NewBucketOwnershipControls(ctx, "LoggingBucketOwnership", &s3.BucketOwnershipControlsArgs{
		Bucket: loggingBucket.ID(),
		Rule: &s3.BucketOwnershipControlsRuleArgs{
			ObjectOwnership: pulumi.String("BucketOwnerPreferred"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error configuring logging bucket ownership: %v", err)
	}

	// Configure logging bucket ACL (depends on ownership controls being set first)
	_, err = s3.NewBucketAclV2(ctx, "LoggingBucketAcl", &s3.BucketAclV2Args{
		Bucket: loggingBucket.ID(),
		Acl:    pulumi.String("log-delivery-write"),
	}, pulumi.DependsOn([]pulumi.Resource{loggingBucketOwnership}))
	if err != nil {
		return nil, fmt.Errorf("error configuring logging bucket ACL: %v", err)
	}

	// Block public access on logging bucket
	_, err = s3.NewBucketPublicAccessBlock(ctx, "LoggingBucketPublicAccess", &s3.BucketPublicAccessBlockArgs{
		Bucket:                loggingBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(false), // Must be false to allow log-delivery-write ACL
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(false), // Must be false to allow log-delivery-write ACL
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("error blocking public access on logging bucket: %v", err)
	}

	// Create transaction data bucket
	transactionBucket, err := s3.NewBucketV2(ctx, "TransactionBucket", &s3.BucketV2Args{
		Bucket: pulumi.String(fmt.Sprintf("ecommerce-transactions-%s", environmentSuffix)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecommerce-transactions-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("transaction-data"),
			"Compliance":  pulumi.String("PCI-DSS"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating transaction bucket: %v", err)
	}

	// Enable versioning
	_, err = s3.NewBucketVersioningV2(ctx, "TransactionBucketVersioning", &s3.BucketVersioningV2Args{
		Bucket: transactionBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling versioning: %v", err)
	}

	// Enable server-side encryption with KMS
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "TransactionBucketEncryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: transactionBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm:   pulumi.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn,
				},
				BucketKeyEnabled: pulumi.Bool(true),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling encryption: %v", err)
	}

	// Block all public access
	_, err = s3.NewBucketPublicAccessBlock(ctx, "TransactionBucketPublicAccess", &s3.BucketPublicAccessBlockArgs{
		Bucket:                transactionBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("error blocking public access: %v", err)
	}

	// Enable access logging
	_, err = s3.NewBucketLoggingV2(ctx, "TransactionBucketLogging", &s3.BucketLoggingV2Args{
		Bucket:       transactionBucket.ID(),
		TargetBucket: loggingBucket.ID(),
		TargetPrefix: pulumi.String("transaction-bucket-logs/"),
	})
	if err != nil {
		return nil, fmt.Errorf("error enabling access logging: %v", err)
	}

	// Add bucket policy to enforce SSL/TLS
	bucketPolicy := pulumi.All(transactionBucket.Arn).ApplyT(func(args []interface{}) string {
		bucketArn := args[0].(string)
		return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "%s",
        "%s/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}`, bucketArn, bucketArn)
	}).(pulumi.StringOutput)

	_, err = s3.NewBucketPolicy(ctx, "TransactionBucketPolicy", &s3.BucketPolicyArgs{
		Bucket: transactionBucket.ID(),
		Policy: bucketPolicy,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating bucket policy: %v", err)
	}

	// Configure lifecycle policy
	_, err = s3.NewBucketLifecycleConfigurationV2(ctx, "TransactionBucketLifecycle", &s3.BucketLifecycleConfigurationV2Args{
		Bucket: transactionBucket.ID(),
		Rules: s3.BucketLifecycleConfigurationV2RuleArray{
			&s3.BucketLifecycleConfigurationV2RuleArgs{
				Id:     pulumi.String("transition-to-ia"),
				Status: pulumi.String("Enabled"),
				Transitions: s3.BucketLifecycleConfigurationV2RuleTransitionArray{
					&s3.BucketLifecycleConfigurationV2RuleTransitionArgs{
						Days:         pulumi.Int(90),
						StorageClass: pulumi.String("STANDARD_IA"),
					},
				},
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating lifecycle policy: %v", err)
	}

	return &StorageComponent{
		TransactionBucket: transactionBucket,
		LoggingBucket:     loggingBucket,
	}, nil
}

// buildIAMComponent creates IAM roles for Firehose
func buildIAMComponent(ctx *pulumi.Context, environmentSuffix string, transactionBucket *s3.BucketV2, kinesisStream *kinesis.Stream, kmsKey *kms.Key) (*IAMComponent, error) {
	// Create Firehose assume role policy
	firehoseAssumeRole := `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "firehose.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`

	// Create Firehose role
	firehoseRole, err := iam.NewRole(ctx, "FirehoseRole", &iam.RoleArgs{
		Name:             pulumi.String(fmt.Sprintf("firehose-delivery-role-%s", environmentSuffix)),
		AssumeRolePolicy: pulumi.String(firehoseAssumeRole),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("firehose-delivery-role-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("firehose-delivery"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Firehose role: %v", err)
	}

	// Create Firehose policy with least privilege
	firehosePolicyDoc := pulumi.All(
		transactionBucket.Arn,
		kinesisStream.Arn,
		kmsKey.Arn,
	).ApplyT(func(args []interface{}) string {
		bucketArn := args[0].(string)
		streamArn := args[1].(string)
		keyArn := args[2].(string)
		return fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:PutObject"
      ],
      "Resource": [
        "%s",
        "%s/*"
      ]
    },
    {
      "Sid": "KinesisAccess",
      "Effect": "Allow",
      "Action": [
        "kinesis:DescribeStream",
        "kinesis:GetShardIterator",
        "kinesis:GetRecords",
        "kinesis:ListShards"
      ],
      "Resource": "%s"
    },
    {
      "Sid": "KMSAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "%s"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:PutLogEvents",
        "logs:CreateLogStream"
      ],
      "Resource": "*"
    }
  ]
}`, bucketArn, bucketArn, streamArn, keyArn)
	}).(pulumi.StringOutput)

	firehosePolicy, err := iam.NewRolePolicy(ctx, "FirehosePolicy", &iam.RolePolicyArgs{
		Name:   pulumi.String(fmt.Sprintf("firehose-delivery-policy-%s", environmentSuffix)),
		Role:   firehoseRole.ID(),
		Policy: firehosePolicyDoc,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Firehose policy: %v", err)
	}

	return &IAMComponent{
		FirehoseRole:   firehoseRole,
		FirehosePolicy: firehosePolicy,
	}, nil
}

// BuildDataPipelineStack creates the complete secure data pipeline
func BuildDataPipelineStack(ctx *pulumi.Context) (*DataPipelineStack, error) {
	environmentSuffix := getEnvironmentSuffix()
	region := getRegion()
	accountID := getAccountID(ctx)

	// Build components in dependency order

	// 1. Create KMS key first (needed by other components)
	kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
	if err != nil {
		return nil, fmt.Errorf("error building KMS component: %v", err)
	}

	// 2. Create storage buckets
	storageComponent, err := buildStorageComponent(ctx, environmentSuffix, region, accountID, kmsComponent.Key)
	if err != nil {
		return nil, fmt.Errorf("error building storage component: %v", err)
	}

	// 3. Create monitoring log groups (needed before Firehose)
	kinesisLogGroup, err := cloudwatch.NewLogGroup(ctx, "KinesisLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/kinesis/transaction-stream-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("kinesis-logging"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Kinesis log group: %v", err)
	}

	firehoseLogGroup, err := cloudwatch.NewLogGroup(ctx, "FirehoseLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/kinesisfirehose/transaction-delivery-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("firehose-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("firehose-logging"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Firehose log group: %v", err)
	}

	// 4. Create Kinesis stream first (needed for IAM policy)
	dataStream, err := kinesis.NewStream(ctx, "TransactionStream", &kinesis.StreamArgs{
		Name:            pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
		ShardCount:      pulumi.Int(2),
		RetentionPeriod: pulumi.Int(24),
		StreamModeDetails: &kinesis.StreamStreamModeDetailsArgs{
			StreamMode: pulumi.String("PROVISIONED"),
		},
		ShardLevelMetrics: pulumi.StringArray{
			pulumi.String("IncomingBytes"),
			pulumi.String("IncomingRecords"),
			pulumi.String("OutgoingBytes"),
			pulumi.String("OutgoingRecords"),
			pulumi.String("WriteProvisionedThroughputExceeded"),
			pulumi.String("ReadProvisionedThroughputExceeded"),
		},
		EncryptionType: pulumi.String("KMS"),
		KmsKeyId:       kmsComponent.Key.Arn,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("transaction-ingestion"),
			"Compliance":  pulumi.String("PCI-DSS"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Kinesis stream: %v", err)
	}

	// 5. Create IAM role for Firehose
	iamComponent, err := buildIAMComponent(ctx, environmentSuffix, storageComponent.TransactionBucket, dataStream, kmsComponent.Key)
	if err != nil {
		return nil, fmt.Errorf("error building IAM component: %v", err)
	}

	// 6. Create Firehose delivery stream
	firehoseLogStream, err := cloudwatch.NewLogStream(ctx, "FirehoseLogStream", &cloudwatch.LogStreamArgs{
		Name:         pulumi.String("S3Delivery"),
		LogGroupName: firehoseLogGroup.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Firehose log stream: %v", err)
	}

	deliveryStream, err := kinesis.NewFirehoseDeliveryStream(ctx, "TransactionDeliveryStream", &kinesis.FirehoseDeliveryStreamArgs{
		Name:        pulumi.String(fmt.Sprintf("transaction-delivery-%s", environmentSuffix)),
		Destination: pulumi.String("extended_s3"),
		KinesisSourceConfiguration: &kinesis.FirehoseDeliveryStreamKinesisSourceConfigurationArgs{
			KinesisStreamArn: dataStream.Arn,
			RoleArn:          iamComponent.FirehoseRole.Arn,
		},
		ExtendedS3Configuration: &kinesis.FirehoseDeliveryStreamExtendedS3ConfigurationArgs{
			RoleArn:           iamComponent.FirehoseRole.Arn,
			BucketArn:         storageComponent.TransactionBucket.Arn,
			Prefix:            pulumi.String("transactions/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"),
			ErrorOutputPrefix: pulumi.String("errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"),
			BufferingSize:     pulumi.Int(5),
			BufferingInterval: pulumi.Int(300),
			CompressionFormat: pulumi.String("GZIP"),
			KmsKeyArn:         kmsComponent.Key.Arn,
			CloudwatchLoggingOptions: &kinesis.FirehoseDeliveryStreamExtendedS3ConfigurationCloudwatchLoggingOptionsArgs{
				Enabled:       pulumi.Bool(true),
				LogGroupName:  firehoseLogGroup.Name,
				LogStreamName: firehoseLogStream.Name,
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("transaction-delivery-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Purpose":     pulumi.String("transaction-delivery"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Firehose delivery stream: %v", err)
	}

	// 7. Create alarms with actual stream references
	throttleAlarm, err := cloudwatch.NewMetricAlarm(ctx, "KinesisThrottleAlarm", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("kinesis-throttle-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("WriteProvisionedThroughputExceeded"),
		Namespace:          pulumi.String("AWS/Kinesis"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.Float64(1),
		AlarmDescription:   pulumi.String("Alert when Kinesis stream is throttled"),
		Dimensions: pulumi.StringMap{
			"StreamName": dataStream.Name,
		},
		TreatMissingData: pulumi.String("notBreaching"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-throttle-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating throttle alarm: %v", err)
	}

	failureAlarm, err := cloudwatch.NewMetricAlarm(ctx, "FirehoseFailureAlarm", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("firehose-delivery-failure-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("DeliveryToS3.DataFreshness"),
		Namespace:          pulumi.String("AWS/Firehose"),
		Period:             pulumi.Int(900),
		Statistic:          pulumi.String("Maximum"),
		Threshold:          pulumi.Float64(900),
		AlarmDescription:   pulumi.String("Alert when Firehose delivery is delayed"),
		Dimensions: pulumi.StringMap{
			"DeliveryStreamName": deliveryStream.Name,
		},
		TreatMissingData: pulumi.String("notBreaching"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("firehose-failure-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating failure alarm: %v", err)
	}

	// Export outputs
	ctx.Export("kinesis_stream_name", dataStream.Name)
	ctx.Export("kinesis_stream_arn", dataStream.Arn)
	ctx.Export("firehose_delivery_stream_name", deliveryStream.Name)
	ctx.Export("firehose_delivery_stream_arn", deliveryStream.Arn)
	ctx.Export("transaction_bucket_name", storageComponent.TransactionBucket.ID())
	ctx.Export("transaction_bucket_arn", storageComponent.TransactionBucket.Arn)
	ctx.Export("logging_bucket_name", storageComponent.LoggingBucket.ID())
	ctx.Export("kms_key_id", kmsComponent.Key.KeyId)
	ctx.Export("kms_key_arn", kmsComponent.Key.Arn)
	ctx.Export("kms_key_alias", kmsComponent.Alias.Name)
	ctx.Export("firehose_role_arn", iamComponent.FirehoseRole.Arn)
	ctx.Export("kinesis_log_group_name", kinesisLogGroup.Name)
	ctx.Export("firehose_log_group_name", firehoseLogGroup.Name)

	return &DataPipelineStack{
		KMS:     kmsComponent,
		IAM:     iamComponent,
		Storage: storageComponent,
		Streaming: &StreamingComponent{
			DataStream:     dataStream,
			DeliveryStream: deliveryStream,
		},
		Monitoring: &MonitoringComponent{
			KinesisLogGroup:  kinesisLogGroup,
			FirehoseLogGroup: firehoseLogGroup,
			ThrottleAlarm:    throttleAlarm,
			FailureAlarm:     failureAlarm,
		},
	}, nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		_, err := BuildDataPipelineStack(ctx)
		if err != nil {
			return fmt.Errorf("error building data pipeline: %v", err)
		}
		return nil
	})
}
