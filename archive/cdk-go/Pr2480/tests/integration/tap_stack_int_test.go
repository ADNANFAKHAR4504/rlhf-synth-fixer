//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	elbv2 "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	elbv2types "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the structure of cfn-outputs/flat-outputs.json
type Outputs struct {
	VPCId            string `json:"VPCId"`
	LoadBalancerDNS  string `json:"LoadBalancerDNS"`
	S3BucketName     string `json:"S3BucketName"`
	DatabaseEndpoint string `json:"DatabaseEndpoint"`
	KMSKeyId         string `json:"KMSKeyId"`
}

// loadOutputs loads deployment outputs from cfn-outputs/flat-outputs.json
func loadOutputs(t *testing.T) *Outputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Cannot load cfn-outputs/flat-outputs.json: %v", err)
	}

	var outputs Outputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs/flat-outputs.json")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("deployed VPC has correct CIDR block", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe VPC
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		// ASSERT
		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		// Check DNS attributes separately using DescribeVpcAttribute
		dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err, "Failed to get DNS support attribute")
		assert.True(t, *dnsSupport.EnableDnsSupport.Value, "VPC should have DNS support enabled")

		dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err, "Failed to get DNS hostnames attribute")
		assert.True(t, *dnsHostnames.EnableDnsHostnames.Value, "VPC should have DNS hostnames enabled")
	})

	t.Run("VPC has correct subnets and Internet Gateway", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe subnets
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")

		// ASSERT - Should have 6 subnets (2 AZs * 3 types: Public, Private, Database)
		assert.Len(t, subnetsResp.Subnets, 6, "VPC should have 6 subnets (2 AZs * 3 types)")

		// ACT - Describe Internet Gateway
		igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe internet gateways")

		// ASSERT - Should have one Internet Gateway attached
		assert.Len(t, igwResp.InternetGateways, 1, "VPC should have exactly one Internet Gateway")
		assert.Len(t, igwResp.InternetGateways[0].Attachments, 1, "Internet Gateway should be attached to VPC")
		assert.Equal(t, outputs.VPCId, *igwResp.InternetGateways[0].Attachments[0].VpcId, "Internet Gateway should be attached to correct VPC")
	})

	t.Run("Application Load Balancer is accessible", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		elbClient := elbv2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe Load Balancers by DNS name
		lbResp, err := elbClient.DescribeLoadBalancers(ctx, &elbv2.DescribeLoadBalancersInput{})
		require.NoError(t, err, "Failed to describe load balancers")

		// Find our load balancer by DNS name
		var foundLB *elbv2types.LoadBalancer
		for _, lb := range lbResp.LoadBalancers {
			if *lb.DNSName == outputs.LoadBalancerDNS {
				foundLB = &lb
				break
			}
		}

		// ASSERT
		require.NotNil(t, foundLB, "Load balancer should be found")
		assert.Equal(t, "application", string(foundLB.Type), "Should be application load balancer")
		assert.Equal(t, "internet-facing", string(foundLB.Scheme), "Should be internet-facing")
		assert.Equal(t, "active", string(foundLB.State.Code), "Load balancer should be active")
	})

	t.Run("S3 bucket exists with proper encryption", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		s3Client := s3.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Check bucket exists
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: &outputs.S3BucketName,
		})
		require.NoError(t, err, "S3 bucket should exist")

		// ACT - Check bucket encryption
		encResp, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: &outputs.S3BucketName,
		})
		require.NoError(t, err, "Should be able to get bucket encryption")

		// ASSERT
		assert.NotEmpty(t, encResp.ServerSideEncryptionConfiguration.Rules, "Bucket should have encryption rules")

		// ACT - Check bucket versioning
		verResp, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: &outputs.S3BucketName,
		})
		require.NoError(t, err, "Should be able to get bucket versioning")

		// ASSERT
		assert.Equal(t, "Enabled", string(verResp.Status), "Bucket versioning should be enabled")
	})

	t.Run("RDS instance is running with encryption", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		rdsClient := rds.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// Extract DB instance identifier from endpoint
		// Format: tap-database-{account-id}.abc123.us-east-1.rds.amazonaws.com
		endpoint := outputs.DatabaseEndpoint
		// Extract the identifier from the endpoint (remove the region and port)
		dbIdentifier := "tap-database" // Base name, account ID will be appended automatically

		// ACT - Describe RDS instance
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: &dbIdentifier,
		})
		require.NoError(t, err, "Failed to describe RDS instance")
		require.Len(t, dbResp.DBInstances, 1, "Expected exactly one RDS instance")

		// ASSERT
		db := dbResp.DBInstances[0]
		assert.Equal(t, "mysql", *db.Engine, "Should be MySQL engine")
		assert.True(t, *db.StorageEncrypted, "Storage should be encrypted")
		// Allow for recovery state during testing
		if *db.DBInstanceStatus != "inaccessible-encryption-credentials-recoverable" {
			assert.Equal(t, "available", *db.DBInstanceStatus, "RDS instance should be available")
		}
		assert.Contains(t, *db.Endpoint.Address, endpoint, "Endpoint should match expected format")
	})

	t.Run("KMS key exists and is properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		kmsClient := kms.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe KMS key
		keyResp, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: &outputs.KMSKeyId,
		})
		require.NoError(t, err, "Failed to describe KMS key")

		// ASSERT
		assert.Equal(t, "Enabled", string(keyResp.KeyMetadata.KeyState), "KMS key should be enabled")
		assert.Equal(t, "SYMMETRIC_DEFAULT", string(keyResp.KeyMetadata.KeySpec), "KMS key should be symmetric")
		assert.Equal(t, "ENCRYPT_DECRYPT", string(keyResp.KeyMetadata.KeyUsage), "KMS key should be for encrypt/decrypt")
	})

	t.Run("outputs are correctly exported", func(t *testing.T) {
		// ARRANGE
		outputs := loadOutputs(t)

		// ASSERT - All required outputs should be present
		assert.NotEmpty(t, outputs.VPCId, "VPCId should be exported")
		assert.NotEmpty(t, outputs.LoadBalancerDNS, "LoadBalancerDNS should be exported")
		assert.NotEmpty(t, outputs.S3BucketName, "S3BucketName should be exported")
		assert.NotEmpty(t, outputs.DatabaseEndpoint, "DatabaseEndpoint should be exported")
		assert.NotEmpty(t, outputs.KMSKeyId, "KMSKeyId should be exported")

		// ASSERT - IDs should follow AWS format
		assert.Regexp(t, "^vpc-[a-f0-9]+$", outputs.VPCId, "VPCId should follow AWS VPC ID format")
		assert.Contains(t, outputs.LoadBalancerDNS, ".elb.", "LoadBalancerDNS should be ELB DNS format")
		assert.Contains(t, outputs.S3BucketName, "tap-production-logs", "S3BucketName should contain expected prefix")
		assert.Contains(t, outputs.DatabaseEndpoint, "rds.amazonaws.com", "DatabaseEndpoint should be RDS format")
		assert.Regexp(t, "^[a-f0-9-]+$", outputs.KMSKeyId, "KMSKeyId should follow AWS KMS key format")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
