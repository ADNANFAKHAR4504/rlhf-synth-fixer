//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ec2"
)

// loadDeploymentOutputs loads the deployment outputs from flat-outputs.json
func loadDeploymentOutputs(t *testing.T) map[string]string {
	t.Helper()

	outputsPath := "../cfn-outputs/flat-outputs.json"
	data, err := os.ReadFile(outputsPath)
	if err != nil {
		t.Fatalf("failed to read deployment outputs: %v", err)
	}

	// First try to parse as nested structure (CDKTF format)
	var nestedOutputs map[string]map[string]interface{}
	if err := json.Unmarshal(data, &nestedOutputs); err == nil {
		// Find the first stack and return its outputs, converting interface{} to string
		for stackName, stackOutputs := range nestedOutputs {
			t.Logf("Loading outputs from stack: %s", stackName)
			result := make(map[string]string)
			for key, value := range stackOutputs {
				// Convert interface{} to string
				switch v := value.(type) {
				case string:
					result[key] = v
				case float64:
					result[key] = fmt.Sprintf("%.0f", v)
				case int:
					result[key] = fmt.Sprintf("%d", v)
				case bool:
					result[key] = fmt.Sprintf("%t", v)
				default:
					// For complex types like arrays, convert to JSON string
					jsonBytes, _ := json.Marshal(v)
					result[key] = string(jsonBytes)
				}
			}
			return result
		}
	}

	// Fallback to flat structure
	var outputs map[string]string
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("failed to parse deployment outputs: %v", err)
	}

	return outputs
}

// createAWSSession creates an AWS session for testing
func createAWSSession(t *testing.T) *session.Session {
	t.Helper()

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"),
	})
	if err != nil {
		t.Fatalf("failed to create AWS session: %v", err)
	}

	return sess
}

func TestVPCExists(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID, ok := outputs["vpcId"]
	if !ok {
		t.Fatal("vpcId not found in outputs")
	}

	// Describe VPC
	result, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(vpcID)},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	if len(result.Vpcs) == 0 {
		t.Fatal("VPC not found")
	}

	vpc := result.Vpcs[0]

	// Verify VPC configuration
	if *vpc.CidrBlock != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR 10.0.0.0/16, got %s", *vpc.CidrBlock)
	}

	// Check VPC state
	if *vpc.State != "available" {
		t.Errorf("expected VPC state to be available, got %s", *vpc.State)
	}

	// Check VPC tags
	foundEnvironmentTag := false
	foundProjectTag := false
	foundOwnerTag := false
	foundManagedByTag := false

	for _, tag := range vpc.Tags {
		switch *tag.Key {
		case "Environment":
			if *tag.Value == "Development" {
				foundEnvironmentTag = true
			}
			t.Logf("Found VPC Environment tag: %s", *tag.Value)
		case "Project":
			if *tag.Value == "MyProject" {
				foundProjectTag = true
			}
			t.Logf("Found VPC Project tag: %s", *tag.Value)
		case "Owner":
			if *tag.Value == "devops-team" {
				foundOwnerTag = true
			}
			t.Logf("Found VPC Owner tag: %s", *tag.Value)
		case "ManagedBy":
			if *tag.Value == "cdktf" {
				foundManagedByTag = true
			}
			t.Logf("Found VPC ManagedBy tag: %s", *tag.Value)
		}
	}

	if !foundEnvironmentTag {
		t.Error("VPC Environment tag not found or incorrect")
	}
	if !foundProjectTag {
		t.Error("VPC Project tag not found or incorrect")
	}
	if !foundOwnerTag {
		t.Error("VPC Owner tag not found or incorrect")
	}
	if !foundManagedByTag {
		t.Error("VPC ManagedBy tag not found or incorrect")
	}

	t.Logf("VPC %s verified successfully", vpcID)
}

func TestSubnetsConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	// Parse subnet IDs from JSON array
	subnetIDsStr := outputs["subnetIds"]
	var subnetIDs []string
	if err := json.Unmarshal([]byte(subnetIDsStr), &subnetIDs); err != nil {
		t.Fatalf("failed to parse subnet IDs: %v", err)
	}

	if len(subnetIDs) != 2 {
		t.Fatalf("expected 2 subnets, got %d", len(subnetIDs))
	}

	expectedCIDRs := []string{"10.0.0.0/24", "10.0.1.0/24"}
	expectedAZs := []string{"us-west-2a", "us-west-2b"}

	// Test each subnet
	for i, subnetID := range subnetIDs {
		result, err := ec2Client.DescribeSubnets(&ec2.DescribeSubnetsInput{
			SubnetIds: []*string{aws.String(subnetID)},
		})
		if err != nil {
			t.Fatalf("failed to describe subnet %d: %v", i+1, err)
		}

		if len(result.Subnets) == 0 {
			t.Fatalf("subnet %d not found", i+1)
		}

		subnet := result.Subnets[0]

		// Verify CIDR block
		if *subnet.CidrBlock != expectedCIDRs[i] {
			t.Errorf("subnet %d expected CIDR %s, got %s", i+1, expectedCIDRs[i], *subnet.CidrBlock)
		}

		// Verify availability zone
		if *subnet.AvailabilityZone != expectedAZs[i] {
			t.Errorf("subnet %d expected AZ %s, got %s", i+1, expectedAZs[i], *subnet.AvailabilityZone)
		}

		// Verify subnet state
		if *subnet.State != "available" {
			t.Errorf("subnet %d expected state available, got %s", i+1, *subnet.State)
		}
	}
}

func TestInternetGateway(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpcId"]

	// Find Internet Gateway attached to our VPC
	result, err := ec2Client.DescribeInternetGateways(&ec2.DescribeInternetGatewaysInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("attachment.vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe internet gateways: %v", err)
	}

	if len(result.InternetGateways) == 0 {
		t.Fatal("no internet gateway found attached to VPC")
	}

	if len(result.InternetGateways) > 1 {
		t.Fatal("multiple internet gateways found attached to VPC")
	}

	igw := result.InternetGateways[0]

	// Verify attachment
	if len(igw.Attachments) == 0 {
		t.Fatal("internet gateway has no attachments")
	}

	attachment := igw.Attachments[0]
	if *attachment.VpcId != vpcID {
		t.Errorf("internet gateway attached to wrong VPC: expected %s, got %s", vpcID, *attachment.VpcId)
	}

	if *attachment.State != "available" {
		t.Errorf("internet gateway attachment state should be available, got %s", *attachment.State)
	}

	// Check IGW tags
	foundNameTag := false
	for _, tag := range igw.Tags {
		if *tag.Key == "Name" && *tag.Value == "dev-igw" {
			foundNameTag = true
			t.Logf("Found IGW Name tag: %s", *tag.Value)
			break
		}
	}
	if !foundNameTag {
		t.Error("Internet Gateway missing correct Name tag")
	}

	t.Logf("Internet Gateway %s verified successfully", *igw.InternetGatewayId)
}

func TestRouteTables(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpcId"]
	subnetIDsStr := outputs["subnetIds"]
	var subnetIDs []string
	if err := json.Unmarshal([]byte(subnetIDsStr), &subnetIDs); err != nil {
		t.Fatalf("failed to parse subnet IDs: %v", err)
	}

	// Find route tables associated with our subnets
	result, err := ec2Client.DescribeRouteTables(&ec2.DescribeRouteTablesInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe route tables: %v", err)
	}

	// Filter out the main route table and find our custom route tables
	var customRouteTables []*ec2.RouteTable
	for _, rt := range result.RouteTables {
		isMain := false
		for _, assoc := range rt.Associations {
			if assoc.Main != nil && *assoc.Main {
				isMain = true
				break
			}
		}
		if !isMain {
			customRouteTables = append(customRouteTables, rt)
		}
	}

	if len(customRouteTables) != 2 {
		t.Fatalf("expected 2 custom route tables, found %d", len(customRouteTables))
	}

	// Verify each route table
	for i, rt := range customRouteTables {
		// Check for internet gateway route
		hasIGWRoute := false
		for _, route := range rt.Routes {
			if route.DestinationCidrBlock != nil && *route.DestinationCidrBlock == "0.0.0.0/0" {
				if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
					hasIGWRoute = true
					break
				}
			}
		}
		if !hasIGWRoute {
			t.Errorf("route table %d missing internet gateway route", i+1)
		}

		// Verify subnet association
		hasSubnetAssociation := false
		for _, assoc := range rt.Associations {
			if assoc.SubnetId != nil {
				for _, subnetID := range subnetIDs {
					if *assoc.SubnetId == subnetID {
						hasSubnetAssociation = true
						t.Logf("Route table %d associated with subnet %s", i+1, subnetID)
						break
					}
				}
				if hasSubnetAssociation {
					break
				}
			}
		}
		if !hasSubnetAssociation {
			t.Errorf("route table %d not associated with any of our subnets", i+1)
		}

		t.Logf("Route table %d (%s) verified successfully", i+1, *rt.RouteTableId)
	}
}

func TestNetworkACL(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpcId"]

	// Find custom Network ACLs (excluding default)
	result, err := ec2Client.DescribeNetworkAcls(&ec2.DescribeNetworkAclsInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
			{
				Name:   aws.String("default"),
				Values: []*string{aws.String("false")},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe network ACLs: %v", err)
	}

	if len(result.NetworkAcls) == 0 {
		t.Fatal("no custom network ACL found")
	}

	nacl := result.NetworkAcls[0]

	// Verify ingress rules
	expectedIngressRules := map[int64]map[string]interface{}{
		100: {"protocol": "6", "from_port": int64(80), "to_port": int64(80), "action": "allow"},
		200: {"protocol": "6", "from_port": int64(443), "to_port": int64(443), "action": "allow"},
	}

	for _, entry := range nacl.Entries {
		if !*entry.Egress { // Ingress rules
			if expectedRule, exists := expectedIngressRules[*entry.RuleNumber]; exists {
				if *entry.Protocol != expectedRule["protocol"].(string) {
					t.Errorf("ingress rule %d: expected protocol %s, got %s", *entry.RuleNumber, expectedRule["protocol"].(string), *entry.Protocol)
				}
				if entry.PortRange != nil {
					if *entry.PortRange.From != expectedRule["from_port"].(int64) {
						t.Errorf("ingress rule %d: expected from port %d, got %d", *entry.RuleNumber, expectedRule["from_port"].(int64), *entry.PortRange.From)
					}
					if *entry.PortRange.To != expectedRule["to_port"].(int64) {
						t.Errorf("ingress rule %d: expected to port %d, got %d", *entry.RuleNumber, expectedRule["to_port"].(int64), *entry.PortRange.To)
					}
				}
				if *entry.RuleAction != expectedRule["action"].(string) {
					t.Errorf("ingress rule %d: expected action %s, got %s", *entry.RuleNumber, expectedRule["action"].(string), *entry.RuleAction)
				}
				t.Logf("Verified ingress rule %d: %s port %d-%d", *entry.RuleNumber, *entry.RuleAction, *entry.PortRange.From, *entry.PortRange.To)
			}
		}
	}

	// Verify egress rules
	expectedEgressRules := map[int64]map[string]interface{}{
		100: {"protocol": "6", "from_port": int64(80), "to_port": int64(80), "action": "allow"},
		200: {"protocol": "6", "from_port": int64(443), "to_port": int64(443), "action": "allow"},
	}

	for _, entry := range nacl.Entries {
		if *entry.Egress { // Egress rules
			if expectedRule, exists := expectedEgressRules[*entry.RuleNumber]; exists {
				if *entry.Protocol != expectedRule["protocol"].(string) {
					t.Errorf("egress rule %d: expected protocol %s, got %s", *entry.RuleNumber, expectedRule["protocol"].(string), *entry.Protocol)
				}
				if entry.PortRange != nil {
					if *entry.PortRange.From != expectedRule["from_port"].(int64) {
						t.Errorf("egress rule %d: expected from port %d, got %d", *entry.RuleNumber, expectedRule["from_port"].(int64), *entry.PortRange.From)
					}
					if *entry.PortRange.To != expectedRule["to_port"].(int64) {
						t.Errorf("egress rule %d: expected to port %d, got %d", *entry.RuleNumber, expectedRule["to_port"].(int64), *entry.PortRange.To)
					}
				}
				if *entry.RuleAction != expectedRule["action"].(string) {
					t.Errorf("egress rule %d: expected action %s, got %s", *entry.RuleNumber, expectedRule["action"].(string), *entry.RuleAction)
				}
				t.Logf("Verified egress rule %d: %s port %d-%d", *entry.RuleNumber, *entry.RuleAction, *entry.PortRange.From, *entry.PortRange.To)
			}
		}
	}

	t.Logf("Network ACL %s verified successfully", *nacl.NetworkAclId)
}

func TestEC2Instances(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpcId"]
	subnetIDsStr := outputs["subnetIds"]
	var subnetIDs []string
	if err := json.Unmarshal([]byte(subnetIDsStr), &subnetIDs); err != nil {
		t.Fatalf("failed to parse subnet IDs: %v", err)
	}

	// Find EC2 instances in our VPC
	result, err := ec2Client.DescribeInstances(&ec2.DescribeInstancesInput{
		Filters: []*ec2.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []*string{aws.String(vpcID)},
			},
			{
				Name:   aws.String("instance-state-name"),
				Values: []*string{aws.String("running"), aws.String("pending")},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe instances: %v", err)
	}

	var instances []*ec2.Instance
	for _, reservation := range result.Reservations {
		instances = append(instances, reservation.Instances...)
	}

	if len(instances) != 2 {
		t.Fatalf("expected 2 EC2 instances, found %d", len(instances))
	}

	// Verify each instance
	for i, instance := range instances {
		// Verify instance type
		if *instance.InstanceType != "t2.micro" {
			t.Errorf("instance %d: expected type t2.micro, got %s", i+1, *instance.InstanceType)
		}

		// Verify key name
		if instance.KeyName == nil || *instance.KeyName != "rlhf-iac-team2-key" {
			t.Errorf("instance %d: expected key name rlhf-iac-team2-key, got %v", i+1, instance.KeyName)
		}

		// Verify monitoring
		if instance.Monitoring == nil || *instance.Monitoring.State != "enabled" {
			t.Errorf("instance %d: monitoring should be enabled", i+1)
		}

		// Verify subnet
		subnetFound := false
		for _, subnetID := range subnetIDs {
			if *instance.SubnetId == subnetID {
				subnetFound = true
				break
			}
		}
		if !subnetFound {
			t.Errorf("instance %d: not in expected subnets", i+1)
		}

		// Verify public IP assignment
		if instance.PublicIpAddress == nil {
			t.Errorf("instance %d: should have public IP address", i+1)
		}
	}
}

func TestResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	sess := createAWSSession(t)
	ec2Client := ec2.New(sess)

	vpcID := outputs["vpcId"]

	// Check VPC tags
	vpcResult, err := ec2Client.DescribeVpcs(&ec2.DescribeVpcsInput{
		VpcIds: []*string{aws.String(vpcID)},
	})
	if err != nil {
		t.Fatalf("failed to describe VPC: %v", err)
	}

	if len(vpcResult.Vpcs) > 0 {
		checkRequiredTags(t, vpcResult.Vpcs[0].Tags, "VPC")
	}

	t.Log("Resource tagging verified")
}

func checkRequiredTags(t *testing.T, tags []*ec2.Tag, resourceType string) {
	t.Helper()

	requiredTags := map[string]string{
		"Environment": "Development",
		"Project":     "MyProject",
		"Owner":       "devops-team",
		"CostCenter":  "CC123",
		"ManagedBy":   "cdktf",
	}

	for requiredKey, expectedValue := range requiredTags {
		found := false
		for _, tag := range tags {
			if *tag.Key == requiredKey && *tag.Value == expectedValue {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("%s missing required tag %s=%s", resourceType, requiredKey, expectedValue)
		}
	}
}

func TestStackOutputs(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify required outputs exist
	requiredOutputs := []string{"vpcId", "subnetIds"}

	for _, output := range requiredOutputs {
		if _, exists := outputs[output]; !exists {
			t.Errorf("required output %s not found", output)
		} else {
			t.Logf("Found output %s: %s", output, outputs[output])
		}
	}

	// Verify subnet IDs format
	subnetIDsStr := outputs["subnetIds"]
	var subnetIDs []string
	if err := json.Unmarshal([]byte(subnetIDsStr), &subnetIDs); err != nil {
		t.Fatalf("failed to parse subnet IDs: %v", err)
	}

	if len(subnetIDs) != 2 {
		t.Errorf("expected 2 subnet IDs, got %d", len(subnetIDs))
	}

	for i, subnetID := range subnetIDs {
		if !strings.HasPrefix(subnetID, "subnet-") {
			t.Errorf("subnet ID %d has invalid format: %s", i+1, subnetID)
		}
	}

	// Verify VPC ID format
	vpcID := outputs["vpcId"]
	if !strings.HasPrefix(vpcID, "vpc-") {
		t.Errorf("VPC ID has invalid format: %s", vpcID)
	}

	t.Log("All stack outputs verified successfully")
}
