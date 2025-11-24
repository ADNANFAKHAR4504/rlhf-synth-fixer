package test

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
	"github.com/aws/aws-sdk-go/service/route53"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs structure matches cfn-outputs/flat-outputs.json
type DeploymentOutputs struct {
	DevPrivateSubnetIDs  []string `json:"dev_private_subnet_ids"`
	DevTGWAttachmentID   string   `json:"dev_tgw_attachment_id"`
	DevVPCCIDR           string   `json:"dev_vpc_cidr"`
	DevVPCID             string   `json:"dev_vpc_id"`
	FlowLogsS3Bucket     string   `json:"flow_logs_s3_bucket"`
	HubNATGatewayIDs     []string `json:"hub_nat_gateway_ids"`
	HubPrivateSubnetIDs  []string `json:"hub_private_subnet_ids"`
	HubTGWAttachmentID   string   `json:"hub_tgw_attachment_id"`
	HubVPCCIDR           string   `json:"hub_vpc_cidr"`
	HubVPCID             string   `json:"hub_vpc_id"`
	ProdPrivateSubnetIDs []string `json:"prod_private_subnet_ids"`
	ProdTGWAttachmentID  string   `json:"prod_tgw_attachment_id"`
	ProdVPCCIDR          string   `json:"prod_vpc_cidr"`
	ProdVPCID            string   `json:"prod_vpc_id"`
	Route53ZoneID        string   `json:"route53_zone_id"`
	Route53ZoneName      string   `json:"route53_zone_name"`
	TransitGatewayARN    string   `json:"transit_gateway_arn"`
	TransitGatewayID     string   `json:"transit_gateway_id"`
}

// Load deployment outputs from flat-outputs.json
func loadDeploymentOutputs(t *testing.T) *DeploymentOutputs {
	outputsFile := "../cfn-outputs/flat-outputs.json"
	data, err := os.ReadFile(outputsFile)
	require.NoError(t, err, "Failed to read deployment outputs file")

	var outputs DeploymentOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse deployment outputs")

	return &outputs
}

// TestIntegrationDeploymentOutputs validates that all outputs are present
func TestIntegrationDeploymentOutputs(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	t.Run("VPC_IDs_Present", func(t *testing.T) {
		assert.NotEmpty(t, outputs.HubVPCID, "Hub VPC ID should be present")
		assert.NotEmpty(t, outputs.ProdVPCID, "Production VPC ID should be present")
		assert.NotEmpty(t, outputs.DevVPCID, "Development VPC ID should be present")
	})

	t.Run("VPC_CIDRs_Correct", func(t *testing.T) {
		assert.Equal(t, "10.0.0.0/16", outputs.HubVPCCIDR, "Hub VPC CIDR should be 10.0.0.0/16")
		assert.Equal(t, "10.1.0.0/16", outputs.ProdVPCCIDR, "Production VPC CIDR should be 10.1.0.0/16")
		assert.Equal(t, "10.2.0.0/16", outputs.DevVPCCIDR, "Development VPC CIDR should be 10.2.0.0/16")
	})

	t.Run("Transit_Gateway_Present", func(t *testing.T) {
		assert.NotEmpty(t, outputs.TransitGatewayID, "Transit Gateway ID should be present")
		assert.NotEmpty(t, outputs.TransitGatewayARN, "Transit Gateway ARN should be present")
		assert.Contains(t, outputs.TransitGatewayARN, outputs.TransitGatewayID, "ARN should contain Transit Gateway ID")
	})

	t.Run("NAT_Gateways_Present", func(t *testing.T) {
		assert.Len(t, outputs.HubNATGatewayIDs, 2, "Should have 2 NAT Gateways in hub VPC")
	})

	t.Run("Subnets_Present", func(t *testing.T) {
		assert.Len(t, outputs.HubPrivateSubnetIDs, 2, "Should have 2 private subnets in hub VPC")
		assert.Len(t, outputs.ProdPrivateSubnetIDs, 2, "Should have 2 private subnets in production VPC")
		assert.Len(t, outputs.DevPrivateSubnetIDs, 2, "Should have 2 private subnets in development VPC")
	})

	t.Run("Route53_Zone_Present", func(t *testing.T) {
		assert.NotEmpty(t, outputs.Route53ZoneID, "Route53 Zone ID should be present")
		assert.NotEmpty(t, outputs.Route53ZoneName, "Route53 Zone Name should be present")
		assert.Contains(t, outputs.Route53ZoneName, "internal", "Route53 zone should be for internal DNS")
	})

	t.Run("Flow_Logs_Bucket_Present", func(t *testing.T) {
		assert.NotEmpty(t, outputs.FlowLogsS3Bucket, "Flow Logs S3 bucket should be present")
	})
}

// TestIntegrationVPCConfiguration validates VPC configuration in AWS
func TestIntegrationVPCConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)

	t.Run("Hub_VPC_Configuration", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
			VpcIds: []*string{aws.String(outputs.HubVPCID)},
		})
		require.NoError(t, err, "Failed to describe hub VPC")
		require.Len(t, result.Vpcs, 1, "Hub VPC should exist")

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.HubVPCCIDR, *vpc.CidrBlock, "Hub VPC CIDR should match")

		// Verify DNS settings via VPC attributes
		attribResult, err := ec2Client.DescribeVpcAttribute(&ec2.DescribeVpcAttributeInput{
			VpcId:     aws.String(outputs.HubVPCID),
			Attribute: aws.String("enableDnsHostnames"),
		})
		require.NoError(t, err, "Failed to get DNS hostnames attribute")
		assert.True(t, *attribResult.EnableDnsHostnames.Value, "DNS hostnames should be enabled")
	})

	t.Run("Production_VPC_Configuration", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
			VpcIds: []*string{aws.String(outputs.ProdVPCID)},
		})
		require.NoError(t, err, "Failed to describe production VPC")
		require.Len(t, result.Vpcs, 1, "Production VPC should exist")

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.ProdVPCCIDR, *vpc.CidrBlock, "Production VPC CIDR should match")
	})

	t.Run("Development_VPC_Configuration", func(t *testing.T) {
		result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
			VpcIds: []*string{aws.String(outputs.DevVPCID)},
		})
		require.NoError(t, err, "Failed to describe development VPC")
		require.Len(t, result.Vpcs, 1, "Development VPC should exist")

		vpc := result.Vpcs[0]
		assert.Equal(t, outputs.DevVPCCIDR, *vpc.CidrBlock, "Development VPC CIDR should match")
	})
}

// TestIntegrationTransitGateway validates Transit Gateway configuration
func TestIntegrationTransitGateway(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)

	t.Run("Transit_Gateway_Exists", func(t *testing.T) {
		result, err := ec2Client.DescribeTransitGateways(&ec2.DescribeTransitGatewaysInput{
			TransitGatewayIds: []*string{aws.String(outputs.TransitGatewayID)},
		})
		require.NoError(t, err, "Failed to describe Transit Gateway")
		require.Len(t, result.TransitGateways, 1, "Transit Gateway should exist")

		tgw := result.TransitGateways[0]
		assert.Equal(t, "available", *tgw.State, "Transit Gateway should be available")

		// Verify DNS support is enabled
		options := tgw.Options
		assert.Equal(t, "enable", *options.DnsSupport, "DNS support should be enabled")
		assert.Equal(t, "disable", *options.DefaultRouteTableAssociation, "Default route table association should be disabled")
		assert.Equal(t, "disable", *options.DefaultRouteTablePropagation, "Default route table propagation should be disabled")
	})

	t.Run("Transit_Gateway_Attachments", func(t *testing.T) {
		result, err := ec2Client.DescribeTransitGatewayVpcAttachments(&ec2.DescribeTransitGatewayVpcAttachmentsInput{
			Filters: []*ec2.Filter{
				{
					Name:   aws.String("transit-gateway-id"),
					Values: []*string{aws.String(outputs.TransitGatewayID)},
				},
			},
		})
		require.NoError(t, err, "Failed to describe Transit Gateway attachments")

		// Should have 3 attachments (hub, prod, dev)
		assert.GreaterOrEqual(t, len(result.TransitGatewayVpcAttachments), 3, "Should have at least 3 VPC attachments")

		// Verify attachments are available
		for _, attachment := range result.TransitGatewayVpcAttachments {
			assert.Equal(t, "available", *attachment.State, "Attachment should be available")
		}
	})

	t.Run("Transit_Gateway_Route_Tables", func(t *testing.T) {
		result, err := ec2Client.DescribeTransitGatewayRouteTables(&ec2.DescribeTransitGatewayRouteTablesInput{
			Filters: []*ec2.Filter{
				{
					Name:   aws.String("transit-gateway-id"),
					Values: []*string{aws.String(outputs.TransitGatewayID)},
				},
			},
		})
		require.NoError(t, err, "Failed to describe Transit Gateway route tables")

		// Should have 3 route tables (hub, prod, dev)
		assert.GreaterOrEqual(t, len(result.TransitGatewayRouteTables), 3, "Should have at least 3 Transit Gateway route tables")

		// Verify route tables are available
		for _, rt := range result.TransitGatewayRouteTables {
			assert.Equal(t, "available", *rt.State, "Route table should be available")
		}
	})
}

// TestIntegrationNATGateways validates NAT Gateway configuration
func TestIntegrationNATGateways(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)

	t.Run("NAT_Gateways_Available", func(t *testing.T) {
		for i, natGatewayID := range outputs.HubNATGatewayIDs {
			result, err := ec2Client.DescribeNatGateways(&ec2.DescribeNatGatewaysInput{
				NatGatewayIds: []*string{aws.String(natGatewayID)},
			})
			require.NoError(t, err, fmt.Sprintf("Failed to describe NAT Gateway %d", i+1))
			require.Len(t, result.NatGateways, 1, fmt.Sprintf("NAT Gateway %d should exist", i+1))

			natGw := result.NatGateways[0]
			assert.Equal(t, "available", *natGw.State, fmt.Sprintf("NAT Gateway %d should be available", i+1))
			assert.Equal(t, outputs.HubVPCID, *natGw.VpcId, fmt.Sprintf("NAT Gateway %d should be in hub VPC", i+1))
		}
	})

	t.Run("NAT_Gateways_Have_Elastic_IPs", func(t *testing.T) {
		for i, natGatewayID := range outputs.HubNATGatewayIDs {
			result, err := ec2Client.DescribeNatGateways(&ec2.DescribeNatGatewaysInput{
				NatGatewayIds: []*string{aws.String(natGatewayID)},
			})
			require.NoError(t, err, fmt.Sprintf("Failed to describe NAT Gateway %d", i+1))

			natGw := result.NatGateways[0]
			assert.NotEmpty(t, natGw.NatGatewayAddresses, fmt.Sprintf("NAT Gateway %d should have addresses", i+1))
			assert.NotEmpty(t, *natGw.NatGatewayAddresses[0].PublicIp, fmt.Sprintf("NAT Gateway %d should have public IP", i+1))
		}
	})
}

// TestIntegrationVPCFlowLogs validates VPC Flow Logs configuration
func TestIntegrationVPCFlowLogs(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)
	s3Client := s3.New(sess)

	t.Run("S3_Bucket_Exists", func(t *testing.T) {
		_, err := s3Client.HeadBucket(&s3.HeadBucketInput{
			Bucket: aws.String(outputs.FlowLogsS3Bucket),
		})
		assert.NoError(t, err, "Flow Logs S3 bucket should exist")
	})

	t.Run("S3_Bucket_Lifecycle_Policy", func(t *testing.T) {
		result, err := s3Client.GetBucketLifecycleConfiguration(&s3.GetBucketLifecycleConfigurationInput{
			Bucket: aws.String(outputs.FlowLogsS3Bucket),
		})
		require.NoError(t, err, "Failed to get lifecycle configuration")
		assert.NotEmpty(t, result.Rules, "Lifecycle rules should be configured")

		// Verify Glacier transition
		found := false
		for _, rule := range result.Rules {
			if *rule.Status == "Enabled" {
				for _, transition := range rule.Transitions {
					if *transition.StorageClass == "GLACIER" {
						assert.Equal(t, int64(30), *transition.Days, "Should transition to Glacier after 30 days")
						found = true
					}
				}
			}
		}
		assert.True(t, found, "Should have GLACIER transition rule")
	})

	t.Run("Flow_Logs_Enabled_For_All_VPCs", func(t *testing.T) {
		vpcIDs := []string{outputs.HubVPCID, outputs.ProdVPCID, outputs.DevVPCID}

		for _, vpcID := range vpcIDs {
			result, err := ec2Client.DescribeFlowLogs(&ec2.DescribeFlowLogsInput{
				Filter: []*ec2.Filter{
					{
						Name:   aws.String("resource-id"),
						Values: []*string{aws.String(vpcID)},
					},
				},
			})
			require.NoError(t, err, fmt.Sprintf("Failed to describe flow logs for VPC %s", vpcID))
			assert.NotEmpty(t, result.FlowLogs, fmt.Sprintf("Flow logs should be enabled for VPC %s", vpcID))

			// Verify flow log configuration
			for _, flowLog := range result.FlowLogs {
				assert.Equal(t, "ALL", *flowLog.TrafficType, "Should capture all traffic")
				assert.Equal(t, "s3", *flowLog.LogDestinationType, "Should use S3")
			}
		}
	})
}

// TestIntegrationRoute53 validates Route53 configuration
func TestIntegrationRoute53(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	route53Client := route53.New(sess)

	t.Run("Private_Hosted_Zone_Exists", func(t *testing.T) {
		result, err := route53Client.GetHostedZone(&route53.GetHostedZoneInput{
			Id: aws.String(outputs.Route53ZoneID),
		})
		require.NoError(t, err, "Failed to get hosted zone")

		// Route53 adds trailing dot to zone names
		expectedName := outputs.Route53ZoneName
		if expectedName[len(expectedName)-1] != '.' {
			expectedName += "."
		}
		assert.Equal(t, expectedName, *result.HostedZone.Name, "Hosted zone name should match")
		assert.True(t, *result.HostedZone.Config.PrivateZone, "Zone should be private")
	})

	t.Run("Zone_Associated_With_VPCs", func(t *testing.T) {
		result, err := route53Client.GetHostedZone(&route53.GetHostedZoneInput{
			Id: aws.String(outputs.Route53ZoneID),
		})
		require.NoError(t, err, "Failed to get hosted zone")

		// Should be associated with at least hub VPC (prod and dev associations may show separately)
		assert.NotEmpty(t, result.VPCs, "Zone should be associated with VPCs")

		// Verify at least one VPC association
		vpcAssociated := false
		for _, vpc := range result.VPCs {
			if *vpc.VPCId == outputs.HubVPCID || *vpc.VPCId == outputs.ProdVPCID || *vpc.VPCId == outputs.DevVPCID {
				vpcAssociated = true
				break
			}
		}
		assert.True(t, vpcAssociated, "Zone should be associated with at least one of the VPCs")
	})
}

// TestIntegrationNetworkConnectivity validates network connectivity
func TestIntegrationNetworkConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)

	t.Run("Route_Tables_Configuration", func(t *testing.T) {
		// Verify prod VPC has routes to Transit Gateway
		result, err := ec2Client.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
			Filters: []*ec2.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []*string{aws.String(outputs.ProdVPCID)},
				},
			},
		})
		require.NoError(t, err, "Failed to describe route tables for production VPC")

		// Check for Transit Gateway routes
		tgwRouteFound := false
		for _, rt := range result.RouteTables {
			for _, route := range rt.Routes {
				if route.TransitGatewayId != nil && *route.TransitGatewayId == outputs.TransitGatewayID {
					tgwRouteFound = true
					break
				}
			}
		}
		assert.True(t, tgwRouteFound, "Production VPC should have routes to Transit Gateway")
	})
}

// TestIntegrationResourceTagging validates resource tagging
func TestIntegrationResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	require.NoError(t, err, "Failed to create AWS session")

	ec2Client := ec2.New(sess)

	t.Run("VPC_Tags", func(t *testing.T) {
		vpcIDs := []string{outputs.HubVPCID, outputs.ProdVPCID, outputs.DevVPCID}

		for _, vpcID := range vpcIDs {
			result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
				VpcIds: []*string{aws.String(vpcID)},
			})
			require.NoError(t, err, fmt.Sprintf("Failed to describe VPC %s", vpcID))
			require.Len(t, result.Vpcs, 1, "VPC should exist")

			tags := result.Vpcs[0].Tags
			foundManagedBy := false
			for _, tag := range tags {
				if *tag.Key == "ManagedBy" {
					assert.Equal(t, "Terraform", *tag.Value, "ManagedBy tag should be Terraform")
					foundManagedBy = true
				}
			}
			assert.True(t, foundManagedBy, fmt.Sprintf("VPC %s should have ManagedBy tag", vpcID))
		}
	})

	t.Run("Transit_Gateway_Tags", func(t *testing.T) {
		result, err := ec2Client.DescribeTransitGateways(&ec2.DescribeTransitGatewaysInput{
			TransitGatewayIds: []*string{aws.String(outputs.TransitGatewayID)},
		})
		require.NoError(t, err, "Failed to describe Transit Gateway")
		require.Len(t, result.TransitGateways, 1, "Transit Gateway should exist")

		tags := result.TransitGateways[0].Tags
		foundManagedBy := false
		for _, tag := range tags {
			if *tag.Key == "ManagedBy" {
				assert.Equal(t, "Terraform", *tag.Value, "ManagedBy tag should be Terraform")
				foundManagedBy = true
			}
		}
		assert.True(t, foundManagedBy, "Transit Gateway should have ManagedBy tag")
	})
}

