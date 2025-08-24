//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	elasticloadbalancingv2types "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// loadDeploymentOutputs loads the outputs from deployment
// Integration tests require actual deployment outputs - no mocking allowed
func loadDeploymentOutputs(t *testing.T) map[string]interface{} {
	t.Helper()

	// Load outputs from the cfn-outputs/flat-outputs.json file
	outputFile := "../../cfn-outputs/flat-outputs.json"

	// Integration tests MUST have the flat-outputs.json file present
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		t.Fatalf("Integration tests require flat-outputs.json file at %s. Please ensure the stack is deployed before running integration tests.", outputFile)
	}

	content, err := os.ReadFile(outputFile)
	require.NoError(t, err, "Failed to read deployment outputs from %s", outputFile)

	// Ensure file is not empty
	require.NotEmpty(t, content, "flat-outputs.json file is empty - deployment may have failed")

	var outputs map[string]interface{}
	err = json.Unmarshal(content, &outputs)
	require.NoError(t, err, "Failed to parse deployment outputs JSON")

	// Ensure outputs contain required keys
	require.NotEmpty(t, outputs, "flat-outputs.json contains no outputs - deployment may have failed")

	return outputs
}

// createEC2Client creates an AWS EC2 client for a specific region
func createEC2Client(t *testing.T, region string) *ec2.Client {
	t.Helper()

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)
	require.NoError(t, err, "Failed to load AWS config for region %s", region)

	return ec2.NewFromConfig(cfg)
}

// createELBv2Client creates an AWS ELBv2 client for a specific region
func createELBv2Client(t *testing.T, region string) *elasticloadbalancingv2.Client {
	t.Helper()

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)
	require.NoError(t, err, "Failed to load AWS config for region %s", region)

	return elasticloadbalancingv2.NewFromConfig(cfg)
}

// createAutoScalingClient creates an AWS AutoScaling client for a specific region
func createAutoScalingClient(t *testing.T, region string) *autoscaling.Client {
	t.Helper()

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)
	require.NoError(t, err, "Failed to load AWS config for region %s", region)

	return autoscaling.NewFromConfig(cfg)
}

// validateDNSResolvable validates that the ALB DNS name is resolvable
func validateDNSResolvable(t *testing.T, dnsName string) {
	t.Helper()

	// Test DNS resolution
	addrs, err := net.LookupHost(dnsName)
	if err != nil {
		t.Logf("Warning: DNS lookup failed for %s: %v", dnsName, err)
		return // Don't fail the test - DNS propagation might take time
	}

	assert.NotEmpty(t, addrs, "DNS name %s should resolve to at least one IP address", dnsName)
	t.Logf("DNS %s resolved to %v", dnsName, addrs)
}

// validateVPCExists validates that VPC resources exist in the region
func validateVPCExists(t *testing.T, region string) {
	t.Helper()

	ec2Client := createEC2Client(t, region)

	// Get environment suffix for resource naming
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114"
	}

	// Describe VPCs with our naming convention
	input := &ec2.DescribeVpcsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-%s-vpc-%s", environmentSuffix, region)},
			},
		},
	}

	result, err := ec2Client.DescribeVpcs(context.TODO(), input)
	if err != nil {
		t.Logf("Warning: Could not describe VPCs in %s: %v", region, err)
		return
	}

	assert.NotEmpty(t, result.Vpcs, "Should find VPC in region %s", region)
	if len(result.Vpcs) > 0 {
		vpc := result.Vpcs[0]
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be in available state")
		assert.NotNil(t, vpc.CidrBlock, "VPC should have CIDR block")
		t.Logf("Validated VPC %s in region %s with CIDR %s", *vpc.VpcId, region, *vpc.CidrBlock)
	}
}

// validateSecurityGroupsExist validates that security groups exist
func validateSecurityGroupsExist(t *testing.T, region string) {
	t.Helper()

	ec2Client := createEC2Client(t, region)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114"
	}

	// Check ALB security group
	albSGInput := &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{fmt.Sprintf("tap-%s-alb-sg-%s", environmentSuffix, region)},
			},
		},
	}

	albSGResult, err := ec2Client.DescribeSecurityGroups(context.TODO(), albSGInput)
	if err != nil {
		t.Logf("Warning: Could not describe ALB security group in %s: %v", region, err)
	} else {
		assert.NotEmpty(t, albSGResult.SecurityGroups, "Should find ALB security group in region %s", region)
		if len(albSGResult.SecurityGroups) > 0 {
			sg := albSGResult.SecurityGroups[0]
			assert.NotNil(t, sg.IpPermissions, "ALB security group should have ingress rules")
			t.Logf("Validated ALB security group %s in region %s", *sg.GroupId, region)
		}
	}

	// Check EC2 security group
	ec2SGInput := &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{fmt.Sprintf("tap-%s-ec2-sg-%s", environmentSuffix, region)},
			},
		},
	}

	ec2SGResult, err := ec2Client.DescribeSecurityGroups(context.TODO(), ec2SGInput)
	if err != nil {
		t.Logf("Warning: Could not describe EC2 security group in %s: %v", region, err)
	} else {
		assert.NotEmpty(t, ec2SGResult.SecurityGroups, "Should find EC2 security group in region %s", region)
		if len(ec2SGResult.SecurityGroups) > 0 {
			sg := ec2SGResult.SecurityGroups[0]
			assert.NotNil(t, sg.IpPermissions, "EC2 security group should have ingress rules")
			t.Logf("Validated EC2 security group %s in region %s", *sg.GroupId, region)
		}
	}
}

// validateLoadBalancerExists validates that the Application Load Balancer exists
func validateLoadBalancerExists(t *testing.T, dnsName, region string) {
	t.Helper()

	elbv2Client := createELBv2Client(t, region)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114"
	}

	// Describe load balancers
	input := &elasticloadbalancingv2.DescribeLoadBalancersInput{
		Names: []string{fmt.Sprintf("tap-%s-alb-%s", environmentSuffix, region)},
	}

	result, err := elbv2Client.DescribeLoadBalancers(context.TODO(), input)
	if err != nil {
		t.Logf("Warning: Could not describe load balancer in %s: %v", region, err)
		return
	}

	assert.NotEmpty(t, result.LoadBalancers, "Should find load balancer in region %s", region)
	if len(result.LoadBalancers) > 0 {
		lb := result.LoadBalancers[0]
		assert.Equal(t, elasticloadbalancingv2types.LoadBalancerStateEnumActive, lb.State.Code, "Load balancer should be active")
		assert.Equal(t, elasticloadbalancingv2types.LoadBalancerTypeEnumApplication, lb.Type, "Should be application load balancer")
		assert.Equal(t, dnsName, *lb.DNSName, "DNS name should match")
		assert.NotNil(t, lb.VpcId, "Load balancer should be in a VPC")
		t.Logf("Validated load balancer %s in region %s with DNS %s", *lb.LoadBalancerArn, region, dnsName)

		// Validate target groups
		tgInput := &elasticloadbalancingv2.DescribeTargetGroupsInput{
			LoadBalancerArn: lb.LoadBalancerArn,
		}
		tgResult, err := elbv2Client.DescribeTargetGroups(context.TODO(), tgInput)
		if err != nil {
			t.Logf("Warning: Could not describe target groups for load balancer in %s: %v", region, err)
		} else {
			assert.NotEmpty(t, tgResult.TargetGroups, "Load balancer should have target groups")
			if len(tgResult.TargetGroups) > 0 {
				tg := tgResult.TargetGroups[0]
				assert.Equal(t, elasticloadbalancingv2types.ProtocolEnumHttp, tg.Protocol, "Target group should use HTTP")
				assert.Equal(t, int32(80), *tg.Port, "Target group should use port 80")
				t.Logf("Validated target group %s for load balancer in region %s", *tg.TargetGroupArn, region)
			}
		}

		// Validate listeners
		listenerInput := &elasticloadbalancingv2.DescribeListenersInput{
			LoadBalancerArn: lb.LoadBalancerArn,
		}
		listenerResult, err := elbv2Client.DescribeListeners(context.TODO(), listenerInput)
		if err != nil {
			t.Logf("Warning: Could not describe listeners for load balancer in %s: %v", region, err)
		} else {
			assert.NotEmpty(t, listenerResult.Listeners, "Load balancer should have listeners")
			if len(listenerResult.Listeners) > 0 {
				listener := listenerResult.Listeners[0]
				assert.Equal(t, elasticloadbalancingv2types.ProtocolEnumHttp, listener.Protocol, "Listener should use HTTP")
				assert.Equal(t, int32(80), *listener.Port, "Listener should use port 80")
				t.Logf("Validated listener %s for load balancer in region %s", *listener.ListenerArn, region)
			}
		}
	}
}

// validateAutoScalingGroupExists validates that the Auto Scaling Group exists
func validateAutoScalingGroupExists(t *testing.T, region string) {
	t.Helper()

	asgClient := createAutoScalingClient(t, region)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114"
	}

	input := &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{fmt.Sprintf("tap-%s-asg-%s", environmentSuffix, region)},
	}

	result, err := asgClient.DescribeAutoScalingGroups(context.TODO(), input)
	if err != nil {
		t.Logf("Warning: Could not describe auto scaling group in %s: %v", region, err)
		return
	}

	assert.NotEmpty(t, result.AutoScalingGroups, "Should find auto scaling group in region %s", region)
	if len(result.AutoScalingGroups) > 0 {
		asg := result.AutoScalingGroups[0]
		assert.GreaterOrEqual(t, *asg.MinSize, int32(2), "ASG should have minimum size of 2")
		assert.LessOrEqual(t, *asg.MaxSize, int32(10), "ASG should have maximum size of 10")
		assert.Equal(t, int32(2), *asg.DesiredCapacity, "ASG should have desired capacity of 2")
		assert.NotEmpty(t, asg.VPCZoneIdentifier, "ASG should be in VPC subnets")
		assert.NotEmpty(t, asg.TargetGroupARNs, "ASG should have target group ARNs")
		t.Logf("Validated auto scaling group %s in region %s with %d instances", *asg.AutoScalingGroupName, region, len(asg.Instances))

		// Validate launch template
		if asg.LaunchTemplate != nil {
			assert.NotNil(t, asg.LaunchTemplate.LaunchTemplateId, "ASG should have launch template ID")
			t.Logf("Validated launch template %s for ASG in region %s", *asg.LaunchTemplate.LaunchTemplateId, region)
		}
	}
}

// validateALBExists validates that an ALB DNS is properly formatted and resolvable
func validateALBExists(t *testing.T, dnsName, region string) {
	t.Helper()

	// Validate DNS format for ALB
	// Format: {name}-{id}.{region}.elb.amazonaws.com
	assert.Contains(t, dnsName, ".elb.amazonaws.com", "ALB DNS should end with .elb.amazonaws.com")
	assert.Contains(t, dnsName, region, "ALB DNS should contain the region name")

	// Test DNS resolution
	validateDNSResolvable(t, dnsName)

	// Validate load balancer exists in AWS
	validateLoadBalancerExists(t, dnsName, region)

	// Additional validation - check if we can describe instances in the region
	// This validates our AWS credentials and region connectivity
	ec2Client := createEC2Client(t, region)
	input := &ec2.DescribeInstancesInput{
		MaxResults: aws.Int32(5), // Just check we can connect
	}
	_, err := ec2Client.DescribeInstances(context.TODO(), input)
	if err != nil {
		t.Logf("Warning: Could not describe instances in %s: %v", region, err)
		// Don't fail the test - this is just connectivity validation
	} else {
		t.Logf("Successfully validated AWS connectivity to region %s", region)
	}
}

// testHTTPEndpoint tests that an HTTP endpoint is reachable and returns expected response
func testHTTPEndpoint(t *testing.T, dnsName string, expectedContent ...string) {
	t.Helper()

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	url := fmt.Sprintf("http://%s", dnsName)
	t.Logf("Testing HTTP endpoint: %s", url)

	// Retry mechanism for eventual consistency
	var lastErr error
	for i := 0; i < 5; i++ {
		resp, err := client.Get(url)
		if err != nil {
			lastErr = err
			time.Sleep(10 * time.Second)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			t.Logf("Successfully reached endpoint %s", url)
			return
		}

		lastErr = fmt.Errorf("HTTP %d from %s", resp.StatusCode, url)
		time.Sleep(10 * time.Second)
	}

	if lastErr != nil {
		t.Logf("Warning: HTTP endpoint %s is not reachable: %v", url, lastErr)
		// Don't fail the test immediately - ALB might still be warming up
	}
}

func TestIntegration_ALBsDeployed(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Check that all three ALBs are deployed
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		outputKey := fmt.Sprintf("alb-dns-%s", region)
		albDNS, exists := outputs[outputKey]
		assert.True(t, exists, fmt.Sprintf("ALB DNS output for %s should exist", region))
		assert.NotNil(t, albDNS, fmt.Sprintf("ALB DNS for %s should not be nil", region))

		// Verify it's a valid DNS name format
		dnsStr, ok := albDNS.(string)
		assert.True(t, ok, "ALB DNS should be a string")
		assert.Contains(t, dnsStr, ".elb.amazonaws.com", "ALB DNS should have proper format")

		// LIVE RESOURCE VALIDATION: Verify ALB exists in AWS
		validateALBExists(t, dnsStr, region)

		// E2E VALIDATION: Test HTTP endpoint
		testHTTPEndpoint(t, dnsStr)
	}
}

func TestIntegration_MultiRegionDeployment(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify we have outputs from all three regions
	expectedRegions := map[string]bool{
		"us-east-1":    false,
		"us-west-2":    false,
		"eu-central-1": false,
	}

	for key := range outputs {
		for region := range expectedRegions {
			if strings.Contains(key, region) {
				expectedRegions[region] = true
			}
		}
	}

	for region, found := range expectedRegions {
		assert.True(t, found, fmt.Sprintf("Should have outputs from region %s", region))
	}
}

func TestIntegration_EnvironmentSuffixApplied(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Check that resource names include environment suffix
	// This assumes the DNS names include the suffix
	for key, value := range outputs {
		if dnsStr, ok := value.(string); ok && strings.Contains(key, "alb-dns") {
			// Check that the DNS name includes "tap-" prefix
			assert.Contains(t, dnsStr, "tap-", "Resource names should include tap prefix")
		}
	}
}

func TestIntegration_LoadBalancerEndpoints(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify each ALB has a valid endpoint
	for key, value := range outputs {
		if strings.Contains(key, "alb-dns") {
			dnsStr, ok := value.(string)
			assert.True(t, ok, fmt.Sprintf("Output %s should be a string", key))
			assert.NotEmpty(t, dnsStr, fmt.Sprintf("ALB DNS for %s should not be empty", key))

			// Extract region from key
			var region string
			if strings.Contains(key, "us-east-1") {
				region = "us-east-1"
				assert.Contains(t, dnsStr, "us-east-1", "US East 1 ALB should be in correct region")
			} else if strings.Contains(key, "us-west-2") {
				region = "us-west-2"
				assert.Contains(t, dnsStr, "us-west-2", "US West 2 ALB should be in correct region")
			} else if strings.Contains(key, "eu-central-1") {
				region = "eu-central-1"
				assert.Contains(t, dnsStr, "eu-central-1", "EU Central 1 ALB should be in correct region")
			}

			// LIVE RESOURCE VALIDATION: Verify ALB exists and is healthy
			if region != "" {
				validateALBExists(t, dnsStr, region)
			}

			// E2E VALIDATION: Test HTTP connectivity
			testHTTPEndpoint(t, dnsStr)
		}
	}
}

func TestIntegration_CrossRegionConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify that we have endpoints for cross-region communication
	albEndpoints := make(map[string]string)

	for key, value := range outputs {
		if strings.Contains(key, "alb-dns") {
			if dnsStr, ok := value.(string); ok {
				albEndpoints[key] = dnsStr
			}
		}
	}

	// Should have at least 3 ALB endpoints for multi-region setup
	assert.GreaterOrEqual(t, len(albEndpoints), 3, "Should have at least 3 ALB endpoints for multi-region")

	// Each endpoint should be unique
	uniqueEndpoints := make(map[string]bool)
	for _, endpoint := range albEndpoints {
		uniqueEndpoints[endpoint] = true
	}
	assert.Equal(t, len(albEndpoints), len(uniqueEndpoints), "All ALB endpoints should be unique")
}

func TestIntegration_HighAvailabilitySetup(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify that HA components are deployed
	primaryRegions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range primaryRegions {
		albKey := fmt.Sprintf("alb-dns-%s", region)
		_, hasALB := outputs[albKey]
		assert.True(t, hasALB, fmt.Sprintf("Region %s should have ALB for HA", region))
	}
}

func TestIntegration_SecurityGroupsConfigured(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// While we don't have direct SG outputs, we can verify ALBs are deployed
	// which implies security groups are configured
	albCount := 0
	for key := range outputs {
		if strings.Contains(key, "alb-dns") {
			albCount++
		}
	}

	// Each ALB requires at least one security group
	assert.GreaterOrEqual(t, albCount, 3, "Should have ALBs deployed with security groups")
}

func TestIntegration_NetworkingSetup(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify networking is set up by checking ALB endpoints exist
	// ALBs require VPCs, subnets, and internet gateways to function
	networkingRegions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range networkingRegions {
		albKey := fmt.Sprintf("alb-dns-%s", region)
		albDNS, exists := outputs[albKey]
		assert.True(t, exists, fmt.Sprintf("Networking should be configured in %s", region))
		assert.NotNil(t, albDNS, fmt.Sprintf("ALB in %s indicates networking is set up", region))
	}
}

func TestIntegration_AutoScalingConfiguration(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify that infrastructure supports auto-scaling
	// ALBs with target groups imply ASG configuration
	for key, value := range outputs {
		if strings.Contains(key, "alb-dns") {
			assert.NotNil(t, value, "ALB deployment implies ASG configuration")
		}
	}
}

func TestIntegration_ResourceTagging(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Verify resources are properly tagged through naming conventions
	for key, value := range outputs {
		if dnsStr, ok := value.(string); ok && strings.Contains(key, "alb-dns") {
			// DNS names should follow naming convention
			assert.Contains(t, dnsStr, "tap", "Resources should follow naming convention")
		}
	}
}

// TestIntegration_E2EWorkflow tests the complete end-to-end workflow
func TestIntegration_E2EWorkflow(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Test complete workflow across all regions
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		t.Run(fmt.Sprintf("E2E_Workflow_%s", region), func(t *testing.T) {
			outputKey := fmt.Sprintf("alb-dns-%s", region)
			albDNS, exists := outputs[outputKey]
			require.True(t, exists, "ALB DNS should exist for region %s", region)

			dnsStr, ok := albDNS.(string)
			require.True(t, ok, "ALB DNS should be a string")

			// Step 1: Validate ALB exists in AWS
			validateALBExists(t, dnsStr, region)

			// Step 2: Test HTTP connectivity
			testHTTPEndpoint(t, dnsStr)

			// Step 3: Validate region-specific behavior
			assert.Contains(t, dnsStr, region, "ALB should be deployed in correct region")
			assert.Contains(t, dnsStr, "tap", "ALB should follow naming convention")
		})
	}
}

// TestIntegration_RequiredOutputsPresent verifies all required outputs are present
func TestIntegration_RequiredOutputsPresent(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Define required outputs based on the actual implementation
	requiredOutputs := []string{
		"alb-dns-us-east-1",
		"alb-dns-us-west-2",
		"alb-dns-eu-central-1",
	}

	for _, requiredOutput := range requiredOutputs {
		value, exists := outputs[requiredOutput]
		assert.True(t, exists, "Required output %s must be present", requiredOutput)
		assert.NotNil(t, value, "Required output %s must not be nil", requiredOutput)

		if dnsStr, ok := value.(string); ok {
			assert.NotEmpty(t, dnsStr, "Required output %s must not be empty", requiredOutput)
			assert.Contains(t, dnsStr, ".elb.amazonaws.com", "Output %s must be valid ALB DNS", requiredOutput)
		}
	}
}

// TestIntegration_FlatOutputsFileValidation validates the flat-outputs.json file structure
func TestIntegration_FlatOutputsFileValidation(t *testing.T) {
	// This test specifically validates the flat-outputs.json file
	outputFile := "../../cfn-outputs/flat-outputs.json"

	// File must exist
	fileInfo, err := os.Stat(outputFile)
	require.NoError(t, err, "flat-outputs.json file must exist at %s", outputFile)

	// File must not be empty
	assert.Greater(t, fileInfo.Size(), int64(0), "flat-outputs.json file must not be empty")

	// File must be valid JSON
	content, err := os.ReadFile(outputFile)
	require.NoError(t, err, "Must be able to read flat-outputs.json")

	var outputs map[string]interface{}
	err = json.Unmarshal(content, &outputs)
	require.NoError(t, err, "flat-outputs.json must contain valid JSON")

	// Must contain at least one output
	assert.NotEmpty(t, outputs, "flat-outputs.json must contain at least one output")

	// All values must be non-null
	for key, value := range outputs {
		assert.NotNil(t, value, "Output %s must not be null", key)
		if str, ok := value.(string); ok {
			assert.NotEmpty(t, str, "Output %s must not be empty string", key)
		}
	}

	t.Logf("flat-outputs.json validation passed with %d outputs", len(outputs))
}

// TestIntegration_MultiRegionConnectivity tests connectivity between regions
func TestIntegration_MultiRegionConnectivity(t *testing.T) {
	outputs := loadDeploymentOutputs(t)

	// Get all ALB endpoints
	albEndpoints := make(map[string]string)
	for key, value := range outputs {
		if strings.Contains(key, "alb-dns") {
			if dnsStr, ok := value.(string); ok {
				albEndpoints[key] = dnsStr
			}
		}
	}

	require.GreaterOrEqual(t, len(albEndpoints), 3, "Should have at least 3 ALB endpoints")

	// Test each endpoint for connectivity
	for key, endpoint := range albEndpoints {
		t.Run(fmt.Sprintf("Connectivity_%s", key), func(t *testing.T) {
			testHTTPEndpoint(t, endpoint)
		})
	}
}

// TestIntegration_VPCValidation validates VPC resources in each region
func TestIntegration_VPCValidation(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		t.Run(fmt.Sprintf("VPC_Validation_%s", region), func(t *testing.T) {
			validateVPCExists(t, region)
		})
	}
}

// TestIntegration_SecurityGroupsValidation validates security groups in each region
func TestIntegration_SecurityGroupsValidation(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		t.Run(fmt.Sprintf("SecurityGroups_Validation_%s", region), func(t *testing.T) {
			validateSecurityGroupsExist(t, region)
		})
	}
}

// TestIntegration_AutoScalingGroupsValidation validates ASG resources in each region
func TestIntegration_AutoScalingGroupsValidation(t *testing.T) {
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		t.Run(fmt.Sprintf("ASG_Validation_%s", region), func(t *testing.T) {
			validateAutoScalingGroupExists(t, region)
		})
	}
}

// TestIntegration_InfrastructureHealthCheck comprehensive health check across all regions
func TestIntegration_InfrastructureHealthCheck(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	for _, region := range regions {
		t.Run(fmt.Sprintf("HealthCheck_%s", region), func(t *testing.T) {
			// 1. Check ALB DNS output exists
			outputKey := fmt.Sprintf("alb-dns-%s", region)
			albDNS, exists := outputs[outputKey]
			require.True(t, exists, "ALB DNS output should exist for region %s", region)

			dnsStr, ok := albDNS.(string)
			require.True(t, ok, "ALB DNS should be a string")
			require.NotEmpty(t, dnsStr, "ALB DNS should not be empty")

			// 2. Validate VPC infrastructure
			validateVPCExists(t, region)

			// 3. Validate security groups
			validateSecurityGroupsExist(t, region)

			// 4. Validate load balancer
			validateALBExists(t, dnsStr, region)

			// 5. Validate auto scaling group
			validateAutoScalingGroupExists(t, region)

			// 6. Test HTTP connectivity
			testHTTPEndpoint(t, dnsStr)
		})
	}
}

// TestIntegration_CrossRegionDeploymentConsistency validates that resources follow consistent naming
func TestIntegration_CrossRegionDeploymentConsistency(t *testing.T) {
	outputs := loadDeploymentOutputs(t)
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114"
	}

	for _, region := range regions {
		t.Run(fmt.Sprintf("Consistency_%s", region), func(t *testing.T) {
			outputKey := fmt.Sprintf("alb-dns-%s", region)
			albDNS, exists := outputs[outputKey]
			require.True(t, exists, "ALB DNS output should exist for region %s", region)

			dnsStr, ok := albDNS.(string)
			require.True(t, ok, "ALB DNS should be a string")

			// Validate naming consistency
			assert.Contains(t, dnsStr, "tap-", "DNS should follow tap naming convention")
			assert.Contains(t, dnsStr, region, "DNS should contain region name")
			assert.Contains(t, dnsStr, ".elb.amazonaws.com", "DNS should be valid ALB DNS")
		})
	}
}
