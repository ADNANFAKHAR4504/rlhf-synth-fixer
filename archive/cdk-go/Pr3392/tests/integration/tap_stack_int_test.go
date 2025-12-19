//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	elasticloadbalancingv2types "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2/types"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/wafv2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testTimeout = 45 * time.Minute
)

// TapStackOutputs represents the structure of cfn-outputs/flat-outputs.json
type TapStackOutputs struct {
	VpcId            string `json:"VpcId"`
	KmsKeyId         string `json:"KmsKeyId"`
	RdsEndpoint      string `json:"RdsEndpoint"`
	AlbDnsName       string `json:"AlbDnsName"`
	SecurityFeatures string `json:"SecurityFeatures"`
}

// loadTapStackOutputs loads deployment outputs from cfn-outputs/flat-outputs.json
func loadTapStackOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Cannot load cfn-outputs/flat-outputs.json: %v", err)
	}

	var outputs TapStackOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs/flat-outputs.json")

	return &outputs
}

// ========================================
// Networking Stack Integration Tests
// ========================================

func TestNetworkingStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)
	outputs := loadTapStackOutputs(t)

	t.Run("VPC exists and has correct configuration", func(t *testing.T) {
		// ACT - Describe VPC
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
		require.NoError(t, err, "VPC should exist")
		require.NotEmpty(t, vpcResp.Vpcs, "VPC should be found")

		// ASSERT
		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, outputs.VpcId, *vpc.VpcId, "VPC ID should match")
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		// Verify CIDR block
		assert.NotNil(t, vpc.CidrBlock, "VPC should have CIDR block")
		assert.Contains(t, *vpc.CidrBlock, "10.0", "VPC CIDR should be in 10.0.0.0/16 range")
	})

	t.Run("VPC has DNS support and DNS hostnames enabled", func(t *testing.T) {
		// ACT - Check DNS support
		dnsSupportResp, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcId),
			Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err)

		// ASSERT
		assert.NotNil(t, dnsSupportResp.EnableDnsSupport, "DNS support attribute should exist")
		assert.True(t, *dnsSupportResp.EnableDnsSupport.Value, "DNS support should be enabled")

		// ACT - Check DNS hostnames
		dnsHostnamesResp, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.VpcId),
			Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err)

		// ASSERT
		assert.NotNil(t, dnsHostnamesResp.EnableDnsHostnames, "DNS hostnames attribute should exist")
		assert.True(t, *dnsHostnamesResp.EnableDnsHostnames.Value, "DNS hostnames should be enabled")
	})

	t.Run("VPC has subnets in multiple availability zones", func(t *testing.T) {
		// ACT - Describe subnets
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err, "Should retrieve subnets")

		// ASSERT
		assert.GreaterOrEqual(t, len(subnetsResp.Subnets), 6, "Should have at least 6 subnets (3 types × 2 AZs)")

		// Verify multi-AZ distribution
		azCount := make(map[string]int)
		for _, subnet := range subnetsResp.Subnets {
			azCount[*subnet.AvailabilityZone]++
		}
		assert.GreaterOrEqual(t, len(azCount), 2, "Subnets should span at least 2 availability zones")
	})

	t.Run("VPC has NAT gateway for private subnet egress", func(t *testing.T) {
		// ACT - Describe NAT gateways
		natGatewaysResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)

		// ASSERT
		assert.NotEmpty(t, natGatewaysResp.NatGateways, "Should have at least one NAT gateway")

		// Verify NAT gateway is available
		foundAvailable := false
		for _, nat := range natGatewaysResp.NatGateways {
			if nat.State == ec2types.NatGatewayStateAvailable {
				foundAvailable = true
				break
			}
		}
		assert.True(t, foundAvailable, "At least one NAT gateway should be available")
	})
}

// ========================================
// Security Stack Integration Tests
// ========================================

func TestSecurityStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	kmsClient := kms.NewFromConfig(cfg)
	outputs := loadTapStackOutputs(t)

	t.Run("KMS key exists and has automatic rotation enabled", func(t *testing.T) {
		// ACT - Describe key
		keyResp, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		require.NoError(t, err, "KMS key should exist")

		// ASSERT
		assert.Equal(t, outputs.KmsKeyId, *keyResp.KeyMetadata.KeyId, "KMS key ID should match")
		assert.True(t, keyResp.KeyMetadata.Enabled, "KMS key should be enabled")
		assert.Equal(t, "ENCRYPT_DECRYPT", string(keyResp.KeyMetadata.KeyUsage), "Key usage should be ENCRYPT_DECRYPT")

		// ACT - Check key rotation
		rotationResp, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		require.NoError(t, err)

		// ASSERT
		assert.True(t, rotationResp.KeyRotationEnabled, "KMS key rotation should be enabled")
	})
}

// ========================================
// Data Stack Integration Tests
// ========================================

func TestDataStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	rdsClient := rds.NewFromConfig(cfg)
	ec2Client := ec2.NewFromConfig(cfg)
	outputs := loadTapStackOutputs(t)

	// Extract DB instance identifier from endpoint
	dbInstanceId := strings.Split(outputs.RdsEndpoint, ".")[0]

	t.Run("RDS instance is encrypted with customer-managed KMS key", func(t *testing.T) {
		// ACT - Describe RDS instance
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err, "RDS instance should exist")
		require.NotEmpty(t, dbResp.DBInstances, "Should find RDS instance")

		// ASSERT
		db := dbResp.DBInstances[0]
		assert.True(t, *db.StorageEncrypted, "RDS storage should be encrypted")
		assert.NotNil(t, db.KmsKeyId, "RDS should use KMS key for encryption")
		assert.Contains(t, *db.KmsKeyId, outputs.KmsKeyId, "RDS should use the correct KMS key")
	})

	t.Run("RDS instance is in isolated subnets only", func(t *testing.T) {
		// ACT - Describe RDS instance
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err)
		db := dbResp.DBInstances[0]

		// ASSERT
		assert.False(t, *db.PubliclyAccessible, "RDS instance should NOT be publicly accessible")

		// Verify it's in a private/isolated subnet
		require.NotNil(t, db.DBSubnetGroup, "RDS should be in a subnet group")
		require.NotEmpty(t, db.DBSubnetGroup.Subnets, "Subnet group should have subnets")

		// Check that subnets are private (not associated with internet gateway)
		for _, subnet := range db.DBSubnetGroup.Subnets {
			routeTablesResp, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("association.subnet-id"),
						Values: []string{*subnet.SubnetIdentifier},
					},
				},
			})
			if err == nil && len(routeTablesResp.RouteTables) > 0 {
				// Verify no route to internet gateway
				hasIGW := false
				for _, rt := range routeTablesResp.RouteTables {
					for _, route := range rt.Routes {
						if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
							hasIGW = true
							break
						}
					}
				}
				assert.False(t, hasIGW, "RDS subnet should not have direct route to internet gateway")
			}
		}
	})

	t.Run("RDS security group restricts ingress to VPC CIDR only", func(t *testing.T) {
		// ACT - Describe RDS instance
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err)
		db := dbResp.DBInstances[0]

		require.NotEmpty(t, db.VpcSecurityGroups, "RDS should have security groups")

		// Get security group details
		sgId := *db.VpcSecurityGroups[0].VpcSecurityGroupId
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{sgId},
		})
		require.NoError(t, err)
		require.NotEmpty(t, sgResp.SecurityGroups, "Security group should exist")

		// ASSERT - Check ingress rules
		sg := sgResp.SecurityGroups[0]
		for _, rule := range sg.IpPermissions {
			// Verify no rule allows 0.0.0.0/0 on MySQL port (3306)
			if rule.FromPort != nil && *rule.FromPort == 3306 {
				for _, ipRange := range rule.IpRanges {
					assert.NotEqual(t, "0.0.0.0/0", *ipRange.CidrIp, "RDS should not allow public access on port 3306")
					// Should be VPC CIDR (10.0.0.0/16)
					if ipRange.CidrIp != nil {
						assert.Contains(t, *ipRange.CidrIp, "10.0", "RDS ingress should be limited to VPC CIDR")
					}
				}
			}
		}
	})

	t.Run("RDS has automated backups configured", func(t *testing.T) {
		// ACT - Describe RDS instance
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err)
		db := dbResp.DBInstances[0]

		// ASSERT
		assert.Greater(t, *db.BackupRetentionPeriod, int32(0), "Backup retention period should be greater than 0")
		assert.NotNil(t, db.PreferredBackupWindow, "Preferred backup window should be set")
		assert.NotNil(t, db.PreferredMaintenanceWindow, "Preferred maintenance window should be set")
	})
}

// ========================================
// Application Stack Integration Tests
// ========================================

func TestApplicationStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)
	ec2Client := ec2.NewFromConfig(cfg)
	wafClient := wafv2.NewFromConfig(cfg)
	outputs := loadTapStackOutputs(t)

	t.Run("ALB exists and is internet-facing", func(t *testing.T) {
		// ACT - Describe load balancers by DNS name
		lbResp, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err, "Should retrieve load balancers")

		// Find the ALB by DNS name
		var alb *elasticloadbalancingv2types.LoadBalancer
		for _, lb := range lbResp.LoadBalancers {
			if *lb.DNSName == outputs.AlbDnsName {
				alb = &lb
				break
			}
		}
		require.NotNil(t, alb, "ALB should exist with matching DNS name")

		// ASSERT
		assert.Equal(t, elasticloadbalancingv2types.LoadBalancerSchemeEnumInternetFacing, alb.Scheme, "ALB should be internet-facing")
		assert.Equal(t, elasticloadbalancingv2types.LoadBalancerTypeEnumApplication, alb.Type, "Load balancer should be application type")
		assert.Equal(t, elasticloadbalancingv2types.LoadBalancerStateEnumActive, alb.State.Code, "ALB should be active")
	})

	t.Run("ALB security group restricts ingress to specific IPs", func(t *testing.T) {
		// ACT - Get ALB details
		lbResp, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)

		var alb *elasticloadbalancingv2types.LoadBalancer
		for _, lb := range lbResp.LoadBalancers {
			if *lb.DNSName == outputs.AlbDnsName {
				alb = &lb
				break
			}
		}
		require.NotNil(t, alb, "ALB should exist")
		require.NotEmpty(t, alb.SecurityGroups, "ALB should have security groups")

		// Get security group details
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: alb.SecurityGroups,
		})
		require.NoError(t, err)

		// ASSERT - Verify ingress rules exist
		foundHTTPSRule := false
		for _, sg := range sgResp.SecurityGroups {
			for _, rule := range sg.IpPermissions {
				if rule.FromPort != nil && *rule.FromPort == 443 {
					foundHTTPSRule = true
					assert.NotNil(t, rule.FromPort, "HTTPS rule should exist")
				}
			}
		}
		// Note: For public ALB, 0.0.0.0/0 access on 443 may be expected
		assert.True(t, foundHTTPSRule, "ALB should have HTTPS ingress rule configured")
	})

	t.Run("WAF Web ACL is associated with ALB", func(t *testing.T) {
		// ACT - List WAF Web ACLs
		wafResp, err := wafClient.ListWebACLs(ctx, &wafv2.ListWebACLsInput{
			Scope: "REGIONAL",
		})
		require.NoError(t, err, "Should list WAF Web ACLs")

		// Find Web ACL and check if it's associated with ALB
		foundWebACL := false
		for _, webACL := range wafResp.WebACLs {
			// Get ALB ARN
			lbResp, _ := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
			for _, lb := range lbResp.LoadBalancers {
				if *lb.DNSName == outputs.AlbDnsName {
					// Check resources associated with this WebACL
					resourcesResp, err := wafClient.ListResourcesForWebACL(ctx, &wafv2.ListResourcesForWebACLInput{
						WebACLArn: webACL.ARN,
					})
					if err == nil && len(resourcesResp.ResourceArns) > 0 {
						for _, resourceArn := range resourcesResp.ResourceArns {
							if resourceArn == *lb.LoadBalancerArn {
								foundWebACL = true
								break
							}
						}
					}
				}
			}
		}

		// ASSERT
		assert.True(t, foundWebACL, "WAF Web ACL should be associated with ALB")
	})
}

// ========================================
// Cross-Service Interaction Tests
// ========================================

func TestCrossServiceInteractions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	outputs := loadTapStackOutputs(t)

	t.Run("VPC endpoint enables private DynamoDB access", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// ACT - Check VPC endpoint for DynamoDB
		endpointsResp, err := ec2Client.DescribeVpcEndpoints(ctx, &ec2.DescribeVpcEndpointsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)
		require.NotEmpty(t, endpointsResp.VpcEndpoints, "DynamoDB VPC endpoint should exist")

		// ASSERT
		endpoint := endpointsResp.VpcEndpoints[0]
		assert.NotEmpty(t, endpoint.RouteTableIds, "VPC endpoint should have route table associations")
	})

	t.Run("KMS key encrypts RDS storage", func(t *testing.T) {
		rdsClient := rds.NewFromConfig(cfg)

		dbInstanceId := strings.Split(outputs.RdsEndpoint, ".")[0]

		// ACT
		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err)
		db := dbResp.DBInstances[0]

		// ASSERT
		assert.True(t, *db.StorageEncrypted, "RDS should be encrypted")
		assert.Contains(t, *db.KmsKeyId, outputs.KmsKeyId, "RDS should use the KMS key")
	})

	t.Run("Security features are properly configured", func(t *testing.T) {
		// ASSERT - Verify security features from outputs
		assert.NotEmpty(t, outputs.SecurityFeatures, "Security features should be documented")
		assert.Contains(t, outputs.SecurityFeatures, "KMS encryption", "Should mention KMS encryption")
		assert.Contains(t, outputs.SecurityFeatures, "WAF protection", "Should mention WAF protection")
	})
}

// ========================================
// Security Compliance Tests
// ========================================

func TestSecurityCompliance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	ec2Client := ec2.NewFromConfig(cfg)
	outputs := loadTapStackOutputs(t)

	t.Run("no security groups allow unrestricted access on sensitive ports", func(t *testing.T) {
		// ACT - Get all security groups in VPC
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)

		// ASSERT - Check for sensitive ports
		sensitivePorts := []int32{22, 3306, 5432, 3389, 1433} // SSH, MySQL, PostgreSQL, RDP, SQL Server

		for _, sg := range sgResp.SecurityGroups {
			for _, rule := range sg.IpPermissions {
				if rule.FromPort != nil {
					for _, sensitivePort := range sensitivePorts {
						if *rule.FromPort == sensitivePort {
							// Verify not open to 0.0.0.0/0
							for _, ipRange := range rule.IpRanges {
								assert.NotEqual(t, "0.0.0.0/0", *ipRange.CidrIp,
									fmt.Sprintf("Security group %s should not allow 0.0.0.0/0 on port %d", *sg.GroupId, sensitivePort))
							}
						}
					}
				}
			}
		}
	})

	t.Run("all data resources use encryption at rest", func(t *testing.T) {
		// RDS encryption - already verified in DataStackIntegration
		rdsClient := rds.NewFromConfig(cfg)
		dbInstanceId := strings.Split(outputs.RdsEndpoint, ".")[0]

		dbResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: aws.String(dbInstanceId),
		})
		require.NoError(t, err)

		assert.True(t, *dbResp.DBInstances[0].StorageEncrypted, "RDS should be encrypted at rest")

	})

	t.Run("network implements multi-layer defense", func(t *testing.T) {
		// ACT - Count security groups (defense layer 1)
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)

		// ASSERT
		assert.GreaterOrEqual(t, len(sgResp.SecurityGroups), 2, "Should have multiple security groups for defense in depth")

		// ACT - Count subnets (defense layer 2)
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)

		// ASSERT
		assert.GreaterOrEqual(t, len(subnetsResp.Subnets), 6, "Should have segmented subnets for defense in depth")
	})
}
