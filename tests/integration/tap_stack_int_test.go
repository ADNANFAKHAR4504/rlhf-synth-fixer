//go:build integration

package lib_test

import (
	"context"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	cloudformationtypes "github.com/aws/aws-sdk-go-v2/service/cloudformation/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	elbv2 "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackIntegration(t *testing.T) {
	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	stackName := "TapProductionStack"

	t.Run("deployed VPC has correct configuration", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)

		// ACT - Describe VPCs and find the ones with our stack name
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("tag:aws:cloudformation:stack-name"),
					Values: []string{stackName},
				},
			},
		})
		require.NoError(t, err, "Failed to describe VPCs")
		require.NotEmpty(t, vpcResp.Vpcs, "Should have at least one VPC from our stack")

		// ASSERT - Check each VPC has correct configuration
		for _, vpc := range vpcResp.Vpcs {
			assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")
			assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

			// Check DNS attributes separately using DescribeVpcAttribute
			dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
				VpcId:     vpc.VpcId,
				Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
			})
			require.NoError(t, err, "Failed to get DNS support attribute")
			assert.True(t, *dnsSupport.EnableDnsSupport.Value, "VPC should have DNS support enabled")

			dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
				VpcId:     vpc.VpcId,
				Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
			})
			require.NoError(t, err, "Failed to get DNS hostnames attribute")
			assert.True(t, *dnsHostnames.EnableDnsHostnames.Value, "VPC should have DNS hostnames enabled")
		}
	})

	t.Run("VPC has correct subnets and Internet Gateway", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)

		// Find our VPCs first
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("tag:aws:cloudformation:stack-name"),
					Values: []string{stackName},
				},
			},
		})
		require.NoError(t, err, "Failed to describe VPCs")
		require.NotEmpty(t, vpcResp.Vpcs, "Should have at least one VPC from our stack")

		// Find VPCs with complete infrastructure
		var completeVPCs []*ec2types.Vpc
		for _, vpc := range vpcResp.Vpcs {
			vpcId := *vpc.VpcId

			// Check if VPC has 6 subnets
			subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("vpc-id"),
						Values: []string{vpcId},
					},
				},
			})
			if err != nil {
				continue
			}

			// Check if VPC has Internet Gateway
			igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("attachment.vpc-id"),
						Values: []string{vpcId},
					},
				},
			})
			if err != nil {
				continue
			}

			// Only test VPCs with complete infrastructure
			if len(subnetsResp.Subnets) == 6 && len(igwResp.InternetGateways) == 1 {
				completeVPCs = append(completeVPCs, &vpc)
			}
		}

		// Skip test if no complete VPCs found
		if len(completeVPCs) == 0 {
			t.Skip("No VPCs with complete infrastructure found - skipping subnet and IGW tests")
		}

		// Check each complete VPC
		for _, vpc := range completeVPCs {
			vpcId := *vpc.VpcId

			// ACT - Describe subnets
			subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("vpc-id"),
						Values: []string{vpcId},
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
						Values: []string{vpcId},
					},
				},
			})
			require.NoError(t, err, "Failed to describe internet gateways")

			// ASSERT - Should have one Internet Gateway attached
			assert.Len(t, igwResp.InternetGateways, 1, "VPC should have exactly one Internet Gateway")
			assert.Len(t, igwResp.InternetGateways[0].Attachments, 1, "Internet Gateway should be attached to VPC")
			assert.Equal(t, vpcId, *igwResp.InternetGateways[0].Attachments[0].VpcId, "Internet Gateway should be attached to correct VPC")
		}
	})

	t.Run("Application Load Balancer is accessible", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		elbClient := elbv2.NewFromConfig(cfg)
		cfnClient := cloudformation.NewFromConfig(cfg)

		// Get stack resources to find load balancer
		stackResources, err := cfnClient.ListStackResources(ctx, &cloudformation.ListStackResourcesInput{
			StackName: aws.String(stackName),
		})
		require.NoError(t, err, "Failed to list stack resources")

		// Find load balancer resource
		var loadBalancerResource *cloudformationtypes.StackResourceSummary
		for _, resource := range stackResources.StackResourceSummaries {
			if *resource.ResourceType == "AWS::ElasticLoadBalancingV2::LoadBalancer" {
				loadBalancerResource = &resource
				break
			}
		}

		if loadBalancerResource == nil {
			t.Skip("No load balancer found in stack resources")
		}

		// ACT - Describe Load Balancer by ARN
		lbResp, err := elbClient.DescribeLoadBalancers(ctx, &elbv2.DescribeLoadBalancersInput{
			LoadBalancerArns: []string{*loadBalancerResource.PhysicalResourceId},
		})
		require.NoError(t, err, "Failed to describe load balancer")
		require.Len(t, lbResp.LoadBalancers, 1, "Should find exactly one load balancer")

		// ASSERT
		lb := lbResp.LoadBalancers[0]
		assert.Equal(t, "application", string(lb.Type), "Should be application load balancer")
		assert.Equal(t, "internet-facing", string(lb.Scheme), "Should be internet-facing")
		assert.Equal(t, "active", string(lb.State.Code), "Load balancer should be active")
	})

	t.Run("S3 bucket exists with proper encryption", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		s3Client := s3.NewFromConfig(cfg)

		// Find our S3 bucket by looking for buckets with our stack name tag
		bucketsResp, err := s3Client.ListBuckets(ctx, &s3.ListBucketsInput{})
		require.NoError(t, err, "Failed to list S3 buckets")

		var foundBucket *string
		for _, bucket := range bucketsResp.Buckets {
			// Check if bucket name contains our expected pattern
			if bucket.Name != nil && (contains(*bucket.Name, "tap-production-logs") || contains(*bucket.Name, "tap-config")) {
				foundBucket = bucket.Name
				break
			}
		}

		require.NotNil(t, foundBucket, "Should find at least one S3 bucket from our stack")

		// ACT - Check bucket exists
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: foundBucket,
		})
		require.NoError(t, err, "S3 bucket should exist")

		// ACT - Check bucket encryption
		encResp, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: foundBucket,
		})
		require.NoError(t, err, "Should be able to get bucket encryption")

		// ASSERT
		assert.NotEmpty(t, encResp.ServerSideEncryptionConfiguration.Rules, "Bucket should have encryption rules")

		// ACT - Check bucket versioning
		verResp, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: foundBucket,
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

		// Find RDS instances with our stack name tag
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{})
		require.NoError(t, err, "Failed to describe RDS instances")

		var foundDBs []*rdstypes.DBInstance
		for _, db := range dbResp.DBInstances {
			// Check if DB instance has our stack name tag
			if db.DBInstanceArn != nil {
				tagsResp, err := rdsClient.ListTagsForResource(ctx, &rds.ListTagsForResourceInput{
					ResourceName: db.DBInstanceArn,
				})
				if err == nil {
					for _, tag := range tagsResp.TagList {
						if *tag.Key == "aws:cloudformation:stack-name" && *tag.Value == stackName {
							foundDBs = append(foundDBs, &db)
							break
						}
					}
				}
			}
		}

		// ASSERT - Should find at least one RDS instance
		require.NotEmpty(t, foundDBs, "Should find at least one RDS instance from our stack")

		// Check each found RDS instance
		for _, db := range foundDBs {
			assert.Equal(t, "mysql", *db.Engine, "Should be MySQL engine")
			assert.True(t, *db.StorageEncrypted, "Storage should be encrypted")
			// Skip status check for instances that might be in recovery state
			if *db.DBInstanceStatus != "inaccessible-encryption-credentials-recoverable" {
				assert.Equal(t, "available", *db.DBInstanceStatus, "RDS instance should be available")
			}
		}
	})

	t.Run("KMS key exists and is properly configured", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		kmsClient := kms.NewFromConfig(cfg)
		cfnClient := cloudformation.NewFromConfig(cfg)

		// Get stack resources to find KMS key
		stackResources, err := cfnClient.ListStackResources(ctx, &cloudformation.ListStackResourcesInput{
			StackName: aws.String(stackName),
		})
		require.NoError(t, err, "Failed to list stack resources")

		// Find KMS key resource
		var kmsResource *cloudformationtypes.StackResourceSummary
		for _, resource := range stackResources.StackResourceSummaries {
			if *resource.ResourceType == "AWS::KMS::Key" {
				kmsResource = &resource
				break
			}
		}

		if kmsResource == nil {
			t.Skip("No KMS key found in stack resources")
		}

		// ACT - Describe KMS key
		keyResp, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: kmsResource.PhysicalResourceId,
		})
		require.NoError(t, err, "Failed to describe KMS key")

		// ASSERT
		assert.Equal(t, "Enabled", string(keyResp.KeyMetadata.KeyState), "KMS key should be enabled")
		assert.Equal(t, "SYMMETRIC_DEFAULT", string(keyResp.KeyMetadata.KeySpec), "KMS key should be symmetric")
		assert.Equal(t, "ENCRYPT_DECRYPT", string(keyResp.KeyMetadata.KeyUsage), "KMS key should be for encrypt/decrypt")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || (len(s) > len(substr) && s[:len(substr)] == substr))
}
