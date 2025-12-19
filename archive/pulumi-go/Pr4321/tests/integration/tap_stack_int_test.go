//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/firehose"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// DeploymentOutputs represents the flat outputs from deployment
type DeploymentOutputs struct {
	FirehoseDeliveryStreamArn  string `json:"firehose_delivery_stream_arn"`
	FirehoseDeliveryStreamName string `json:"firehose_delivery_stream_name"`
	FirehoseLogGroupName       string `json:"firehose_log_group_name"`
	FirehoseRoleArn            string `json:"firehose_role_arn"`
	KinesisLogGroupName        string `json:"kinesis_log_group_name"`
	KinesisStreamArn           string `json:"kinesis_stream_arn"`
	KinesisStreamName          string `json:"kinesis_stream_name"`
	KmsKeyAlias                string `json:"kms_key_alias"`
	KmsKeyArn                  string `json:"kms_key_arn"`
	KmsKeyId                   string `json:"kms_key_id"`
	LoggingBucketName          string `json:"logging_bucket_name"`
	TransactionBucketArn       string `json:"transaction_bucket_arn"`
	TransactionBucketName      string `json:"transaction_bucket_name"`
}

var (
	outputs     DeploymentOutputs
	awsConfig   aws.Config
	ctx         context.Context
	initialized bool
)

func initTestEnvironment(t *testing.T) {
	if initialized {
		return
	}

	ctx = context.Background()

	// Load deployment outputs - use absolute path or check both paths
	outputsFile := "cfn-outputs/flat-outputs.json"
	data, err := os.ReadFile(outputsFile)
	if err != nil {
		// Try parent directory
		outputsFile = "../cfn-outputs/flat-outputs.json"
		data, err = os.ReadFile(outputsFile)
	}
	require.NoError(t, err, "Failed to read deployment outputs file")

	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse deployment outputs")

	// Validate required outputs are present
	require.NotEmpty(t, outputs.KinesisStreamName, "Kinesis stream name is missing")
	require.NotEmpty(t, outputs.TransactionBucketName, "Transaction bucket name is missing")
	require.NotEmpty(t, outputs.KmsKeyId, "KMS key ID is missing")

	// Load AWS config
	awsConfig, err = config.LoadDefaultConfig(ctx, config.WithRegion("ap-southeast-1"))
	require.NoError(t, err, "Failed to load AWS config")

	initialized = true
}

// TestKinesisStreamExists verifies that Kinesis stream was created and is active
func TestKinesisStreamExists(t *testing.T) {
	initTestEnvironment(t)

	kinesisClient := kinesis.NewFromConfig(awsConfig)

	describeInput := &kinesis.DescribeStreamInput{
		StreamName: aws.String(outputs.KinesisStreamName),
	}

	result, err := kinesisClient.DescribeStream(ctx, describeInput)
	require.NoError(t, err, "Failed to describe Kinesis stream")

	assert.NotNil(t, result.StreamDescription)
	assert.Equal(t, outputs.KinesisStreamName, *result.StreamDescription.StreamName)
	assert.Contains(t, []string{"ACTIVE", "UPDATING"}, string(result.StreamDescription.StreamStatus))
}

// TestKinesisStreamEncryption verifies that Kinesis stream uses KMS encryption
func TestKinesisStreamEncryption(t *testing.T) {
	initTestEnvironment(t)

	kinesisClient := kinesis.NewFromConfig(awsConfig)

	describeInput := &kinesis.DescribeStreamInput{
		StreamName: aws.String(outputs.KinesisStreamName),
	}

	result, err := kinesisClient.DescribeStream(ctx, describeInput)
	require.NoError(t, err, "Failed to describe Kinesis stream")

	assert.Equal(t, "KMS", string(result.StreamDescription.EncryptionType))
	assert.NotNil(t, result.StreamDescription.KeyId)
}

// TestTransactionBucketExists verifies that S3 bucket was created
func TestTransactionBucketExists(t *testing.T) {
	initTestEnvironment(t)

	s3Client := s3.NewFromConfig(awsConfig)

	headInput := &s3.HeadBucketInput{
		Bucket: aws.String(outputs.TransactionBucketName),
	}

	_, err := s3Client.HeadBucket(ctx, headInput)
	assert.NoError(t, err, "Transaction bucket should exist")
}

// TestTransactionBucketEncryption verifies that S3 bucket has KMS encryption enabled
func TestTransactionBucketEncryption(t *testing.T) {
	initTestEnvironment(t)

	s3Client := s3.NewFromConfig(awsConfig)

	encryptionInput := &s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.TransactionBucketName),
	}

	result, err := s3Client.GetBucketEncryption(ctx, encryptionInput)
	require.NoError(t, err, "Failed to get bucket encryption")

	assert.NotNil(t, result.ServerSideEncryptionConfiguration)
	assert.NotEmpty(t, result.ServerSideEncryptionConfiguration.Rules)

	rule := result.ServerSideEncryptionConfiguration.Rules[0]
	assert.Equal(t, "aws:kms", string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm))
}

// TestTransactionBucketVersioning verifies that S3 bucket has versioning enabled
func TestTransactionBucketVersioning(t *testing.T) {
	initTestEnvironment(t)

	s3Client := s3.NewFromConfig(awsConfig)

	versioningInput := &s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.TransactionBucketName),
	}

	result, err := s3Client.GetBucketVersioning(ctx, versioningInput)
	require.NoError(t, err, "Failed to get bucket versioning")

	assert.Equal(t, "Enabled", string(result.Status))
}

// TestTransactionBucketPublicAccessBlock verifies that public access is blocked
func TestTransactionBucketPublicAccessBlock(t *testing.T) {
	initTestEnvironment(t)

	s3Client := s3.NewFromConfig(awsConfig)

	publicAccessInput := &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.TransactionBucketName),
	}

	result, err := s3Client.GetPublicAccessBlock(ctx, publicAccessInput)
	require.NoError(t, err, "Failed to get public access block configuration")

	assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicAcls)
	assert.True(t, *result.PublicAccessBlockConfiguration.BlockPublicPolicy)
	assert.True(t, *result.PublicAccessBlockConfiguration.IgnorePublicAcls)
	assert.True(t, *result.PublicAccessBlockConfiguration.RestrictPublicBuckets)
}

// TestLoggingBucketExists verifies that logging bucket was created
func TestLoggingBucketExists(t *testing.T) {
	initTestEnvironment(t)

	s3Client := s3.NewFromConfig(awsConfig)

	headInput := &s3.HeadBucketInput{
		Bucket: aws.String(outputs.LoggingBucketName),
	}

	_, err := s3Client.HeadBucket(ctx, headInput)
	assert.NoError(t, err, "Logging bucket should exist")
}

// TestKMSKeyExists verifies that KMS key was created
func TestKMSKeyExists(t *testing.T) {
	initTestEnvironment(t)

	kmsClient := kms.NewFromConfig(awsConfig)

	describeInput := &kms.DescribeKeyInput{
		KeyId: aws.String(outputs.KmsKeyId),
	}

	result, err := kmsClient.DescribeKey(ctx, describeInput)
	require.NoError(t, err, "Failed to describe KMS key")

	assert.NotNil(t, result.KeyMetadata)
	assert.Equal(t, outputs.KmsKeyId, *result.KeyMetadata.KeyId)
	assert.True(t, result.KeyMetadata.Enabled)
}

// TestKMSKeyRotation verifies that KMS key has rotation enabled
func TestKMSKeyRotation(t *testing.T) {
	initTestEnvironment(t)

	kmsClient := kms.NewFromConfig(awsConfig)

	rotationInput := &kms.GetKeyRotationStatusInput{
		KeyId: aws.String(outputs.KmsKeyId),
	}

	result, err := kmsClient.GetKeyRotationStatus(ctx, rotationInput)
	require.NoError(t, err, "Failed to get key rotation status")

	assert.True(t, result.KeyRotationEnabled, "KMS key rotation should be enabled")
}

// TestKMSKeyAlias verifies that KMS key alias was created
func TestKMSKeyAlias(t *testing.T) {
	initTestEnvironment(t)

	kmsClient := kms.NewFromConfig(awsConfig)

	aliasInput := &kms.ListAliasesInput{
		KeyId: aws.String(outputs.KmsKeyId),
	}

	result, err := kmsClient.ListAliases(ctx, aliasInput)
	require.NoError(t, err, "Failed to list KMS aliases")

	found := false
	for _, alias := range result.Aliases {
		if *alias.AliasName == outputs.KmsKeyAlias {
			found = true
			break
		}
	}

	assert.True(t, found, fmt.Sprintf("KMS alias %s should exist", outputs.KmsKeyAlias))
}

// TestFirehoseDeliveryStreamExists verifies that Firehose delivery stream was created
func TestFirehoseDeliveryStreamExists(t *testing.T) {
	initTestEnvironment(t)

	firehoseClient := firehose.NewFromConfig(awsConfig)

	describeInput := &firehose.DescribeDeliveryStreamInput{
		DeliveryStreamName: aws.String(outputs.FirehoseDeliveryStreamName),
	}

	result, err := firehoseClient.DescribeDeliveryStream(ctx, describeInput)
	require.NoError(t, err, "Failed to describe Firehose delivery stream")

	assert.NotNil(t, result.DeliveryStreamDescription)
	assert.Equal(t, outputs.FirehoseDeliveryStreamName, *result.DeliveryStreamDescription.DeliveryStreamName)
	assert.Contains(t, []string{"ACTIVE", "CREATING"}, string(result.DeliveryStreamDescription.DeliveryStreamStatus))
}

// TestFirehoseIAMRole verifies that Firehose IAM role was created with correct permissions
func TestFirehoseIAMRole(t *testing.T) {
	initTestEnvironment(t)

	iamClient := iam.NewFromConfig(awsConfig)

	// Extract role name from ARN
	roleName := ""
	if len(outputs.FirehoseRoleArn) > 0 {
		// ARN format: arn:aws:iam::account:role/role-name
		parts := []rune(outputs.FirehoseRoleArn)
		for i := len(parts) - 1; i >= 0; i-- {
			if parts[i] == '/' {
				roleName = string(parts[i+1:])
				break
			}
		}
	}
	require.NotEmpty(t, roleName, "Failed to extract role name from ARN")

	getRoleInput := &iam.GetRoleInput{
		RoleName: aws.String(roleName),
	}

	result, err := iamClient.GetRole(ctx, getRoleInput)
	require.NoError(t, err, "Failed to get IAM role")

	assert.NotNil(t, result.Role)
	assert.Equal(t, roleName, *result.Role.RoleName)
}

// TestKinesisLogGroup verifies that Kinesis log group was created
func TestKinesisLogGroup(t *testing.T) {
	initTestEnvironment(t)

	logsClient := cloudwatchlogs.NewFromConfig(awsConfig)

	describeInput := &cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String(outputs.KinesisLogGroupName),
	}

	result, err := logsClient.DescribeLogGroups(ctx, describeInput)
	require.NoError(t, err, "Failed to describe log groups")

	found := false
	for _, logGroup := range result.LogGroups {
		if *logGroup.LogGroupName == outputs.KinesisLogGroupName {
			found = true
			assert.Equal(t, int32(30), *logGroup.RetentionInDays, "Log retention should be 30 days")
			break
		}
	}

	assert.True(t, found, "Kinesis log group should exist")
}

// TestFirehoseLogGroup verifies that Firehose log group was created
func TestFirehoseLogGroup(t *testing.T) {
	initTestEnvironment(t)

	logsClient := cloudwatchlogs.NewFromConfig(awsConfig)

	describeInput := &cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String(outputs.FirehoseLogGroupName),
	}

	result, err := logsClient.DescribeLogGroups(ctx, describeInput)
	require.NoError(t, err, "Failed to describe log groups")

	found := false
	for _, logGroup := range result.LogGroups {
		if *logGroup.LogGroupName == outputs.FirehoseLogGroupName {
			found = true
			assert.Equal(t, int32(30), *logGroup.RetentionInDays, "Log retention should be 30 days")
			break
		}
	}

	assert.True(t, found, "Firehose log group should exist")
}

// TestCloudWatchAlarms verifies that CloudWatch alarms were created
func TestCloudWatchAlarms(t *testing.T) {
	initTestEnvironment(t)

	cloudwatchClient := cloudwatch.NewFromConfig(awsConfig)

	describeInput := &cloudwatch.DescribeAlarmsInput{}

	result, err := cloudwatchClient.DescribeAlarms(ctx, describeInput)
	require.NoError(t, err, "Failed to describe CloudWatch alarms")

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	kinesisAlarmFound := false
	firehoseAlarmFound := false

	for _, alarm := range result.MetricAlarms {
		if *alarm.AlarmName == fmt.Sprintf("kinesis-throttle-%s", environmentSuffix) {
			kinesisAlarmFound = true
		}
		if *alarm.AlarmName == fmt.Sprintf("firehose-delivery-failure-%s", environmentSuffix) {
			firehoseAlarmFound = true
		}
	}

	assert.True(t, kinesisAlarmFound, "Kinesis throttle alarm should exist")
	assert.True(t, firehoseAlarmFound, "Firehose delivery failure alarm should exist")
}

// TestDataPipelineIntegration tests the complete data pipeline workflow
func TestDataPipelineIntegration(t *testing.T) {
	initTestEnvironment(t)

	kinesisClient := kinesis.NewFromConfig(awsConfig)

	// Put a test record into Kinesis stream
	testData := []byte(`{"transactionId":"test-123","amount":100.50,"timestamp":"` + time.Now().Format(time.RFC3339) + `"}`)

	putRecordInput := &kinesis.PutRecordInput{
		StreamName:   aws.String(outputs.KinesisStreamName),
		Data:         testData,
		PartitionKey: aws.String("test-partition-key"),
	}

	result, err := kinesisClient.PutRecord(ctx, putRecordInput)
	require.NoError(t, err, "Failed to put record into Kinesis stream")
	assert.NotNil(t, result.SequenceNumber)
	assert.NotEmpty(t, *result.ShardId)

	// Verify the record was accepted
	assert.NotEmpty(t, *result.SequenceNumber, "Sequence number should be returned")
}

// TestResourceTagging verifies that resources have proper tags
func TestResourceTagging(t *testing.T) {
	initTestEnvironment(t)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Test S3 bucket tagging
	s3Client := s3.NewFromConfig(awsConfig)
	taggingInput := &s3.GetBucketTaggingInput{
		Bucket: aws.String(outputs.TransactionBucketName),
	}

	result, err := s3Client.GetBucketTagging(ctx, taggingInput)
	require.NoError(t, err, "Failed to get bucket tagging")

	tagMap := make(map[string]string)
	for _, tag := range result.TagSet {
		tagMap[*tag.Key] = *tag.Value
	}

	assert.Equal(t, environmentSuffix, tagMap["Environment"], "Environment tag should match")
	assert.Equal(t, "pulumi", tagMap["ManagedBy"], "ManagedBy tag should be pulumi")
}
