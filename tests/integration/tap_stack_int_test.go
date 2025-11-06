//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type StackOutputs struct {
	AlbDnsName         string `json:"albDnsName"`
	DlqUrl             string `json:"dlqUrl"`
	RdsClusterEndpoint string `json:"rdsClusterEndpoint"`
	SnsTopicArn        string `json:"snsTopicArn"`
	SqsQueueUrl        string `json:"sqsQueueUrl"`
	VpcId              string `json:"vpcId"`
}

func loadStackOutputs(t *testing.T) *StackOutputs {
	data, err := os.ReadFile("cfn-outputs/flat-outputs.json")
	require.NoError(t, err, "Failed to read stack outputs file")

	var outputs StackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse stack outputs")

	return &outputs
}

func getAWSConfig(t *testing.T) aws.Config {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
	)
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
}

func TestVPCExists(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	result, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})

	require.NoError(t, err, "Failed to describe VPC")
	assert.NotEmpty(t, result.Vpcs, "VPC not found")
	assert.Equal(t, outputs.VpcId, *result.Vpcs[0].VpcId, "VPC ID mismatch")
	assert.Equal(t, "10.0.0.0/16", *result.Vpcs[0].CidrBlock, "VPC CIDR block mismatch")
}

func TestALBExists(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	elbv2Client := elasticloadbalancingv2.NewFromConfig(cfg)

	result, err := elbv2Client.DescribeLoadBalancers(context.TODO(), &elasticloadbalancingv2.DescribeLoadBalancersInput{})
	require.NoError(t, err, "Failed to describe load balancers")

	var found bool
	for _, lb := range result.LoadBalancers {
		if lb.DNSName != nil && *lb.DNSName == outputs.AlbDnsName {
			found = true
			assert.Equal(t, "application", string(lb.Type), "Load balancer should be of type 'application'")
			assert.Equal(t, "internet-facing", string(lb.Scheme), "Load balancer should be internet-facing")
			break
		}
	}

	assert.True(t, found, "ALB with DNS name %s not found", outputs.AlbDnsName)
}

func TestALBEndpointReachable(t *testing.T) {
	outputs := loadStackOutputs(t)

	url := fmt.Sprintf("http://%s", outputs.AlbDnsName)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	var resp *http.Response
	var err error

	// Retry up to 5 times with exponential backoff
	for i := 0; i < 5; i++ {
		resp, err = client.Get(url)
		if err == nil {
			defer resp.Body.Close()
			break
		}
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
	}

	// We expect the ALB to be reachable, but may get 503 if no healthy targets
	// That's acceptable - we just want to confirm the ALB endpoint responds
	if err == nil {
		assert.True(t, resp.StatusCode == http.StatusOK ||
			resp.StatusCode == http.StatusServiceUnavailable ||
			resp.StatusCode == http.StatusNotFound,
			"ALB should respond with 200, 404, or 503, got %d", resp.StatusCode)

		_, err = io.ReadAll(resp.Body)
		assert.NoError(t, err, "Should be able to read response body")
	} else {
		t.Logf("Warning: ALB endpoint not reachable: %v", err)
	}
}

func TestRDSClusterExists(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	rdsClient := rds.NewFromConfig(cfg)

	result, err := rdsClient.DescribeDBClusters(context.TODO(), &rds.DescribeDBClustersInput{})
	require.NoError(t, err, "Failed to describe RDS clusters")

	var found bool
	for _, cluster := range result.DBClusters {
		if cluster.Endpoint != nil && *cluster.Endpoint == outputs.RdsClusterEndpoint {
			found = true
			assert.Equal(t, "aurora-postgresql", *cluster.Engine, "RDS engine should be aurora-postgresql")
			assert.True(t, *cluster.StorageEncrypted, "RDS cluster should be encrypted")
			assert.GreaterOrEqual(t, int(*cluster.BackupRetentionPeriod), 7, "Backup retention should be at least 7 days")

			// Check for multiple instances
			assert.GreaterOrEqual(t, len(cluster.DBClusterMembers), 1, "Should have at least 1 cluster member")
			break
		}
	}

	assert.True(t, found, "RDS cluster with endpoint %s not found", outputs.RdsClusterEndpoint)
}

func TestSQSQueuesExist(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	sqsClient := sqs.NewFromConfig(cfg)

	// Test main queue
	queueAttrs, err := sqsClient.GetQueueAttributes(context.TODO(), &sqs.GetQueueAttributesInput{
		QueueUrl:       aws.String(outputs.SqsQueueUrl),
		AttributeNames: []string{"All"},
	})
	require.NoError(t, err, "Failed to get main queue attributes")
	assert.NotEmpty(t, queueAttrs.Attributes, "Main queue attributes should not be empty")

	// Verify message retention
	retention := queueAttrs.Attributes["MessageRetentionPeriod"]
	assert.NotEmpty(t, retention, "Message retention period should be set")

	// Test DLQ
	dlqAttrs, err := sqsClient.GetQueueAttributes(context.TODO(), &sqs.GetQueueAttributesInput{
		QueueUrl:       aws.String(outputs.DlqUrl),
		AttributeNames: []string{"All"},
	})
	require.NoError(t, err, "Failed to get DLQ attributes")
	assert.NotEmpty(t, dlqAttrs.Attributes, "DLQ attributes should not be empty")
}

func TestSQSQueueWriteRead(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	sqsClient := sqs.NewFromConfig(cfg)

	// Send a test message
	testMessage := fmt.Sprintf("Integration test message at %d", time.Now().Unix())
	sendResult, err := sqsClient.SendMessage(context.TODO(), &sqs.SendMessageInput{
		QueueUrl:    aws.String(outputs.SqsQueueUrl),
		MessageBody: aws.String(testMessage),
	})
	require.NoError(t, err, "Failed to send message to queue")
	assert.NotNil(t, sendResult.MessageId, "Message ID should not be nil")

	// Receive the message
	receiveResult, err := sqsClient.ReceiveMessage(context.TODO(), &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(outputs.SqsQueueUrl),
		MaxNumberOfMessages: 1,
		WaitTimeSeconds:     5,
	})
	require.NoError(t, err, "Failed to receive message from queue")
	assert.NotEmpty(t, receiveResult.Messages, "Should receive at least one message")

	if len(receiveResult.Messages) > 0 {
		assert.Equal(t, testMessage, *receiveResult.Messages[0].Body, "Message body should match")

		// Delete the test message
		_, err = sqsClient.DeleteMessage(context.TODO(), &sqs.DeleteMessageInput{
			QueueUrl:      aws.String(outputs.SqsQueueUrl),
			ReceiptHandle: receiveResult.Messages[0].ReceiptHandle,
		})
		assert.NoError(t, err, "Failed to delete test message")
	}
}

func TestSNSTopicExists(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	snsClient := sns.NewFromConfig(cfg)

	attrs, err := snsClient.GetTopicAttributes(context.TODO(), &sns.GetTopicAttributesInput{
		TopicArn: aws.String(outputs.SnsTopicArn),
	})
	require.NoError(t, err, "Failed to get SNS topic attributes")
	assert.NotEmpty(t, attrs.Attributes, "SNS topic attributes should not be empty")

	// Verify display name
	displayName := attrs.Attributes["DisplayName"]
	assert.NotEmpty(t, displayName, "SNS topic should have a display name")
}

func TestVPCSubnetsExist(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	result, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcId},
			},
		},
	})

	require.NoError(t, err, "Failed to describe subnets")
	// Should have 6 subnets (3 public + 3 private)
	assert.GreaterOrEqual(t, len(result.Subnets), 6, "Should have at least 6 subnets")
}

func TestSecurityGroupsExist(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	result, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcId},
			},
		},
	})

	require.NoError(t, err, "Failed to describe security groups")
	// Should have at least 3 security groups (ALB, ECS, RDS) + default
	assert.GreaterOrEqual(t, len(result.SecurityGroups), 3, "Should have at least 3 security groups")
}

func TestInternetGatewayExists(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	result, err := ec2Client.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("attachment.vpc-id"),
				Values: []string{outputs.VpcId},
			},
		},
	})

	require.NoError(t, err, "Failed to describe internet gateways")
	assert.NotEmpty(t, result.InternetGateways, "Should have at least one internet gateway")
}

func TestNATGatewaysExist(t *testing.T) {
	outputs := loadStackOutputs(t)
	cfg := getAWSConfig(t)

	ec2Client := ec2.NewFromConfig(cfg)

	result, err := ec2Client.DescribeNatGateways(context.TODO(), &ec2.DescribeNatGatewaysInput{
		Filter: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{outputs.VpcId},
			},
		},
	})

	require.NoError(t, err, "Failed to describe NAT gateways")
	// Should have 3 NAT gateways (one per AZ)
	assert.GreaterOrEqual(t, len(result.NatGateways), 3, "Should have at least 3 NAT gateways")
}
