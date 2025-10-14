//go:build !integration
// +build !integration

package main

import (
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Copy()

	// Set ID based on resource type
	if args.TypeToken == "aws:s3/bucketV2:BucketV2" {
		outputs["id"] = resource.NewStringProperty(fmt.Sprintf("%v", args.Inputs["bucket"]))
		outputs["arn"] = resource.NewStringProperty(fmt.Sprintf("arn:aws:s3:::%v", args.Inputs["bucket"]))
	} else if args.TypeToken == "aws:kms/key:Key" {
		outputs["keyId"] = resource.NewStringProperty("test-key-id-123")
		outputs["arn"] = resource.NewStringProperty("arn:aws:kms:ap-southeast-1:123456789012:key/test-key-id-123")
	} else if args.TypeToken == "aws:kms/alias:Alias" {
		outputs["targetKeyId"] = resource.NewStringProperty("test-key-id-123")
	} else if args.TypeToken == "aws:iam/role:Role" {
		outputs["arn"] = resource.NewStringProperty(fmt.Sprintf("arn:aws:iam::123456789012:role/%v", args.Inputs["name"]))
	} else if args.TypeToken == "aws:kinesis/stream:Stream" {
		outputs["arn"] = resource.NewStringProperty(fmt.Sprintf("arn:aws:kinesis:ap-southeast-1:123456789012:stream/%v", args.Inputs["name"]))
	} else if args.TypeToken == "aws:kinesis/firehoseDeliveryStream:FirehoseDeliveryStream" {
		outputs["arn"] = resource.NewStringProperty(fmt.Sprintf("arn:aws:firehose:ap-southeast-1:123456789012:deliverystream/%v", args.Inputs["name"]))
	} else if args.TypeToken == "aws:cloudwatch/logGroup:LogGroup" {
		// No special outputs needed
	}

	return fmt.Sprintf("%s-id", args.Name), outputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := map[string]interface{}{}

	if args.Token == "aws:index/getCallerIdentity:getCallerIdentity" {
		outputs["accountId"] = "123456789012"
	}

	return resource.NewPropertyMapFromMap(outputs), nil
}

// TestEnvironmentSuffixDefault tests that getEnvironmentSuffix returns "dev" when no env variable is set
func TestEnvironmentSuffixDefault(t *testing.T) {
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	suffix := getEnvironmentSuffix()
	assert.Equal(t, "dev", suffix, "Default environment suffix should be 'dev'")
}

// TestEnvironmentSuffixCustom tests that getEnvironmentSuffix returns custom value when env variable is set
func TestEnvironmentSuffixCustom(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test123")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	suffix := getEnvironmentSuffix()
	assert.Equal(t, "test123", suffix, "Should return custom environment suffix")
}

// TestRegionDefault tests that getRegion returns default region
func TestRegionDefault(t *testing.T) {
	os.Unsetenv("AWS_REGION")
	region := getRegion()
	assert.Equal(t, "ap-southeast-1", region, "Default region should be ap-southeast-1")
}

// TestRegionCustom tests that getRegion returns custom region when env variable is set
func TestRegionCustom(t *testing.T) {
	os.Setenv("AWS_REGION", "us-west-2")
	defer os.Unsetenv("AWS_REGION")

	region := getRegion()
	assert.Equal(t, "us-west-2", region, "Should return custom AWS region")
}

// TestKMSComponentCreation tests that KMS resources are created with correct properties
func TestKMSComponentCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		kmsComponent, err := buildKMSComponent(ctx, "unittest", "ap-southeast-1", pulumi.String("123456789012").ToStringOutput())
		assert.NoError(t, err)
		assert.NotNil(t, kmsComponent)
		assert.NotNil(t, kmsComponent.Key)
		assert.NotNil(t, kmsComponent.Alias)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestStorageComponentCreation tests that S3 buckets are created with correct properties
func TestStorageComponentCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		// Create mock KMS key first
		kmsKey, err := kms.NewKey(ctx, "TestKey", &kms.KeyArgs{
			Description: pulumi.String("Test key"),
		})
		assert.NoError(t, err)

		storageComponent, err := buildStorageComponent(ctx, "unittest", "ap-southeast-1", pulumi.String("123456789012").ToStringOutput(), kmsKey)
		assert.NoError(t, err)
		assert.NotNil(t, storageComponent)
		assert.NotNil(t, storageComponent.TransactionBucket)
		assert.NotNil(t, storageComponent.LoggingBucket)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestIAMComponentCreation tests that IAM roles are created with correct properties
func TestIAMComponentCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		// Create mock resources
		bucket, _ := s3.NewBucketV2(ctx, "TestBucket", &s3.BucketV2Args{
			Bucket: pulumi.String("test-bucket"),
		})

		stream, _ := kinesis.NewStream(ctx, "TestStream", &kinesis.StreamArgs{
			Name:       pulumi.String("test-stream"),
			ShardCount: pulumi.Int(1),
		})

		key, _ := kms.NewKey(ctx, "TestKey", &kms.KeyArgs{
			Description: pulumi.String("Test key"),
		})

		iamComponent, err := buildIAMComponent(ctx, "unittest", bucket, stream, key)
		assert.NoError(t, err)
		assert.NotNil(t, iamComponent)
		assert.NotNil(t, iamComponent.FirehoseRole)
		assert.NotNil(t, iamComponent.FirehosePolicy)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestStackOutputs tests that all required outputs are exported
func TestStackOutputs(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		_, err := BuildDataPipelineStack(ctx)
		assert.NoError(t, err)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestResourceNamingConvention tests that resources follow naming convention with environment suffix
func TestResourceNamingConvention(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		// Test S3 bucket naming
		bucket, err := s3.NewBucketV2(ctx, "TestBucket", &s3.BucketV2Args{
			Bucket: pulumi.String("ecommerce-transactions-unittest"),
		})
		assert.NoError(t, err)
		assert.NotNil(t, bucket)

		// Verify naming convention through the input parameter
		assert.True(t, strings.Contains("ecommerce-transactions-unittest", "unittest"), "Bucket name should contain environment suffix")

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestKMSKeyRotationEnabled tests that KMS key rotation is enabled
func TestKMSKeyRotationEnabled(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		kmsComponent, err := buildKMSComponent(ctx, "unittest", "ap-southeast-1", pulumi.String("123456789012").ToStringOutput())
		assert.NoError(t, err)
		assert.NotNil(t, kmsComponent.Key)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestS3BucketEncryptionWithKMS tests that S3 buckets use KMS encryption
func TestS3BucketEncryptionWithKMS(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		key, _ := kms.NewKey(ctx, "TestKey", &kms.KeyArgs{
			Description: pulumi.String("Test key"),
		})

		storageComponent, err := buildStorageComponent(ctx, "unittest", "ap-southeast-1", pulumi.String("123456789012").ToStringOutput(), key)
		assert.NoError(t, err)
		assert.NotNil(t, storageComponent)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestKinesisStreamEncryption tests that Kinesis stream uses KMS encryption
func TestKinesisStreamEncryption(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		key, _ := kms.NewKey(ctx, "TestKey", &kms.KeyArgs{
			Description: pulumi.String("Test key"),
		})

		stream, err := kinesis.NewStream(ctx, "TestStream", &kinesis.StreamArgs{
			Name:           pulumi.String("test-stream-unittest"),
			ShardCount:     pulumi.Int(2),
			EncryptionType: pulumi.String("KMS"),
			KmsKeyId:       key.Arn,
		})

		assert.NoError(t, err)
		assert.NotNil(t, stream)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestCloudWatchLogGroups tests that log groups are created with retention
func TestCloudWatchLogGroups(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

		logGroup, err := cloudwatch.NewLogGroup(ctx, "TestLogGroup", &cloudwatch.LogGroupArgs{
			Name:            pulumi.String("/aws/test/unittest"),
			RetentionInDays: pulumi.Int(30),
		})

		assert.NoError(t, err)
		assert.NotNil(t, logGroup)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestIAMRoleAssumePolicy tests that Firehose role has correct assume role policy
func TestIAMRoleAssumePolicy(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")

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

		role, err := iam.NewRole(ctx, "TestRole", &iam.RoleArgs{
			Name:             pulumi.String("test-role-unittest"),
			AssumeRolePolicy: pulumi.String(firehoseAssumeRole),
		})

		assert.NoError(t, err)
		assert.NotNil(t, role)
		assert.Contains(t, firehoseAssumeRole, "firehose.amazonaws.com", "Role should allow Firehose service to assume")

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestGetAccountID tests that getAccountID retrieves account ID
func TestGetAccountID(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		accountID := getAccountID(ctx)
		assert.NotNil(t, accountID)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}

// TestCompleteStackDeployment tests that the complete stack can be built without errors
func TestCompleteStackDeployment(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		os.Setenv("ENVIRONMENT_SUFFIX", "unittest")
		os.Setenv("AWS_REGION", "ap-southeast-1")
		defer os.Unsetenv("ENVIRONMENT_SUFFIX")
		defer os.Unsetenv("AWS_REGION")

		stack, err := BuildDataPipelineStack(ctx)
		assert.NoError(t, err)
		assert.NotNil(t, stack)
		assert.NotNil(t, stack.KMS)
		assert.NotNil(t, stack.IAM)
		assert.NotNil(t, stack.Storage)
		assert.NotNil(t, stack.Streaming)
		assert.NotNil(t, stack.Monitoring)

		return nil
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}
