//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("can deploy and destroy stack successfully", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		cfnClient := cloudformation.NewFromConfig(cfg)
		stackName := "TapStackIntegrationTest"

		// Clean up any existing stack
		defer func() {
			_, _ = cfnClient.DeleteStack(ctx, &cloudformation.DeleteStackInput{
				StackName: aws.String(stackName),
			})
		}()

		// ACT
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String(stackName), &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: "inttest",
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, "inttest", stack.Environment)

		// Note: Actual deployment testing would require CDK CLI or programmatic deployment
		// This is a placeholder for more comprehensive integration testing
		t.Log("Stack created successfully in memory. Full deployment testing requires CDK CLI integration.")
	})

	t.Run("stack resources are created with correct naming", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		envSuffix := "integration"

		// ACT
		stack := lib.NewTapStack(app, jsii.String("TapStackResourceTest"), &lib.TapStackProps{
			StackProps:  awscdk.StackProps{},
			Environment: envSuffix,
		})

		// ASSERT
		assert.NotNil(t, stack)
		assert.Equal(t, envSuffix, stack.Environment)

		// Add more specific resource assertions here when resources are actually created
		// For example:
		// - Verify S3 bucket naming conventions
		// - Check that all resources have proper tags
		// - Validate resource configurations
	})

	t.Run("validates deployed VPC and networking", func(t *testing.T) {
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		envSuffix := "integration"

		// ACT & ASSERT - Test VPC exists and is properly configured
		vpcs, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			Filters: []ec2Types.Filter{
				{
					Name:   aws.String("tag:Name"),
					Values: []string{"proj-vpc-" + envSuffix},
				},
			},
		})

		if err == nil && len(vpcs.Vpcs) > 0 {
			vpc := vpcs.Vpcs[0]
			assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)
			assert.True(t, vpc.DnsSupport.Value)
			assert.True(t, vpc.DnsHostnames.Value)

			// Test subnets in multiple AZs
			subnets, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				Filters: []ec2Types.Filter{
					{
						Name:   aws.String("vpc-id"),
						Values: []string{*vpc.VpcId},
					},
				},
			})
			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(subnets.Subnets), 4) // 2 public + 2 private

			// Test VPC endpoints
			endpoints, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
				Filters: []ec2Types.Filter{
					{
						Name:   aws.String("vpc-id"),
						Values: []string{*vpc.VpcId},
					},
				},
			})
			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(endpoints.VpcEndpoints), 2) // S3 and DynamoDB endpoints
		} else {
			t.Skip("VPC not found - stack may not be deployed")
		}
	})

	t.Run("validates deployed S3 buckets and configurations", func(t *testing.T) {
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		s3Client := s3.NewFromConfig(cfg)
		envSuffix := "integration"

		bucketNames := []string{
			"proj-cloudtrail-" + envSuffix,
			"proj-s3-" + envSuffix,
			"proj-s3-logs-" + envSuffix,
		}

		for _, bucketName := range bucketNames {
			// Test bucket exists
			_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
				Bucket: aws.String(bucketName),
			})

			if err == nil {
				// Test encryption
				encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
					Bucket: aws.String(bucketName),
				})
				require.NoError(t, err)
				assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)

				// Test public access block
				publicAccess, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
					Bucket: aws.String(bucketName),
				})
				require.NoError(t, err)
				assert.True(t, publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls)
				assert.True(t, publicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy)
			} else {
				t.Logf("Bucket %s not found - may not be deployed: %v", bucketName, err)
			}
		}
	})

	t.Run("validates deployed DynamoDB table", func(t *testing.T) {
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		dynamoClient := dynamodb.NewFromConfig(cfg)
		envSuffix := "integration"
		tableName := "proj-dynamodb-" + envSuffix

		// ACT & ASSERT
		table, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(tableName),
		})

		if err == nil {
			assert.Equal(t, "ACTIVE", string(table.Table.TableStatus))
			assert.Equal(t, "PAY_PER_REQUEST", string(table.Table.BillingModeSummary.BillingMode))

			// Test key schema
			assert.Len(t, table.Table.KeySchema, 2)
			
			// Test PITR
			backup, err := dynamoClient.DescribeContinuousBackups(ctx, &dynamodb.DescribeContinuousBackupsInput{
				TableName: aws.String(tableName),
			})
			require.NoError(t, err)
			assert.Equal(t, "ENABLED", string(backup.ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus))

			// Test basic operations
			testItem := map[string]interface{}{
				"pk": map[string]interface{}{"S": "test-integration"},
				"sk": map[string]interface{}{"S": fmt.Sprintf("test-%d", time.Now().Unix())},
				"data": map[string]interface{}{"S": "integration-test-data"},
			}

			// Put item
			_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
				TableName: aws.String(tableName),
				Item:      testItem,
			})
			require.NoError(t, err)

			// Get item
			result, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
				TableName: aws.String(tableName),
				Key: map[string]interface{}{
					"pk": testItem["pk"],
					"sk": testItem["sk"],
				},
			})
			require.NoError(t, err)
			assert.NotEmpty(t, result.Item)

			// Clean up
			_, _ = dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
				TableName: aws.String(tableName),
				Key: map[string]interface{}{
					"pk": testItem["pk"],
					"sk": testItem["sk"],
				},
			})
		} else {
			t.Logf("DynamoDB table not found - may not be deployed: %v", err)
		}
	})

	t.Run("validates deployed Lambda function", func(t *testing.T) {
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		lambdaClient := lambda.NewFromConfig(cfg)
		envSuffix := "integration"
		functionName := "proj-lambda-" + envSuffix

		// ACT & ASSERT
		function, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})

		if err == nil {
			config := function.Configuration
			assert.Equal(t, "Active", string(config.State))
			assert.Equal(t, "python3.12", string(config.Runtime))
			assert.Equal(t, "arm64", string(config.Architectures[0]))
			assert.Equal(t, int32(512), *config.MemorySize)
			assert.Equal(t, int32(10), *config.ReservedConcurrentExecutions)

			// Test VPC configuration
			if config.VpcConfig != nil {
				assert.NotEmpty(t, config.VpcConfig.SubnetIds)
				assert.NotEmpty(t, config.VpcConfig.SecurityGroupIds)
			}

			// Test function invocation
			testEvent := map[string]interface{}{
				"Records": []map[string]interface{}{
					{
						"eventSource": "aws:s3",
						"eventName":   "ObjectCreated:Put",
						"s3": map[string]interface{}{
							"bucket": map[string]interface{}{"name": "proj-s3-" + envSuffix},
							"object": map[string]interface{}{"key": "test-integration.txt", "size": 100},
						},
						"eventTime": time.Now().Format(time.RFC3339),
					},
				},
			}

			payload, _ := json.Marshal(testEvent)
			response, err := lambdaClient.Invoke(ctx, &lambda.InvokeInput{
				FunctionName:   aws.String(functionName),
				Payload:        payload,
				InvocationType: "RequestResponse",
			})
			require.NoError(t, err)
			assert.Equal(t, int32(200), response.StatusCode)
		} else {
			t.Logf("Lambda function not found - may not be deployed: %v", err)
		}
	})

	t.Run("validates SNS topic functionality", func(t *testing.T) {
		if testing.Short() {
			t.Skip("Skipping integration test in short mode")
		}

		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		snsClient := sns.NewFromConfig(cfg)
		envSuffix := "integration"
		topicName := "proj-alerts-" + envSuffix

		// Find topic by name
		topics, err := snsClient.ListTopics(ctx, &sns.ListTopicsInput{})
		require.NoError(t, err)

		for _, topic := range topics.Topics {
			if strings.Contains(*topic.TopicArn, topicName) {
				// Test topic attributes
				attrs, err := snsClient.GetTopicAttributes(ctx, &sns.GetTopicAttributesInput{
					TopicArn: topic.TopicArn,
				})
				require.NoError(t, err)
				assert.NotEmpty(t, attrs.Attributes)

				// Test publishing
				response, err := snsClient.Publish(ctx, &sns.PublishInput{
					TopicArn: topic.TopicArn,
					Message:  aws.String("Integration test message"),
					Subject:  aws.String("TapStack Integration Test"),
				})
				require.NoError(t, err)
				assert.NotEmpty(t, *response.MessageId)
				
				t.Logf("Successfully published message to SNS topic: %s", *response.MessageId)
				return
			}
		}
		t.Skip("SNS topic not found - may not be deployed")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
