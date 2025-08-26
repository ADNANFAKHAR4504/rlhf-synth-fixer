//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type FlatOutputs struct {
	VPCId      string `json:"VPCId"`
	ALBDNSName string `json:"ALBDNSName"`
	ASGName    string `json:"ASGName"`
}

func loadFlatOutputs(t *testing.T) *FlatOutputs {
	outputsPath := "cfn-outputs/flat-outputs.json"
	if _, err := os.Stat(outputsPath); os.IsNotExist(err) {
		t.Skipf("Integration test outputs not found at %s. Run deployment first.", outputsPath)
	}

	data, err := ioutil.ReadFile(outputsPath)
	require.NoError(t, err, "Failed to read flat-outputs.json")

	var outputs FlatOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse flat-outputs.json")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials or in short mode
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	// Load deployment outputs for testing real AWS resources
	outputs := loadFlatOutputs(t)
	require.NotEmpty(t, outputs.VPCId, "VPCId output is required")
	require.NotEmpty(t, outputs.ALBDNSName, "ALBDNSName output is required")
	require.NotEmpty(t, outputs.ASGName, "ASGName output is required")

	t.Run("VPC Infrastructure Validation", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Test VPC exists and has correct configuration
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "available", string(vpc.State), "VPC should be available")
		assert.NotEmpty(t, *vpc.CidrBlock, "VPC should have a CIDR block")

		// Test subnets - expect 6 subnets (3 public + 3 private) across 3 AZs
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")
		assert.GreaterOrEqual(t, len(subnetsResp.Subnets), 6, "Expected at least 6 subnets (3 public + 3 private)")

		// Verify we have both public and private subnets
		publicSubnets := 0
		privateSubnets := 0
		azCount := make(map[string]bool)

		for _, subnet := range subnetsResp.Subnets {
			azCount[*subnet.AvailabilityZone] = true

			// Check if subnet is public by looking for internet gateway route
			routeTablesResp, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
				Filters: []ec2types.Filter{
					{
						Name:   aws.String("association.subnet-id"),
						Values: []string{*subnet.SubnetId},
					},
				},
			})
			if err == nil && len(routeTablesResp.RouteTables) > 0 {
				hasInternetGateway := false
				for _, route := range routeTablesResp.RouteTables[0].Routes {
					if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
						hasInternetGateway = true
						break
					}
				}
				if hasInternetGateway {
					publicSubnets++
				} else {
					privateSubnets++
				}
			}
		}

		assert.GreaterOrEqual(t, len(azCount), 3, "Expected subnets across at least 3 availability zones")
		assert.GreaterOrEqual(t, publicSubnets, 3, "Expected at least 3 public subnets")
		assert.GreaterOrEqual(t, privateSubnets, 3, "Expected at least 3 private subnets")
	})

	t.Run("Application Load Balancer Validation", func(t *testing.T) {
		elbv2Client := elasticloadbalancingv2.NewFromConfig(cfg)

		// Test ALB exists and is configured correctly
		lbResp, err := elbv2Client.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{
			Names: []string{},
		})
		require.NoError(t, err, "Failed to describe load balancers")

		// Find our ALB by DNS name
		var targetLB *elbv2types.LoadBalancer
		for _, lb := range lbResp.LoadBalancers {
			if *lb.DNSName == outputs.ALBDNSName {
				targetLB = &lb
				break
			}
		}
		require.NotNil(t, targetLB, "ALB not found with expected DNS name")

		// Validate ALB configuration
		assert.Equal(t, "active", string(targetLB.State.Code), "ALB should be active")
		assert.Equal(t, "application", string(targetLB.Type), "Should be application load balancer")
		assert.Equal(t, "internet-facing", string(targetLB.Scheme), "ALB should be internet-facing")
		assert.GreaterOrEqual(t, len(targetLB.AvailabilityZones), 3, "ALB should span at least 3 AZs")

		// Test listeners exist
		listenersResp, err := elbv2Client.DescribeListeners(ctx, &elasticloadbalancingv2.DescribeListenersInput{
			LoadBalancerArn: targetLB.LoadBalancerArn,
		})
		require.NoError(t, err, "Failed to describe listeners")
		assert.GreaterOrEqual(t, len(listenersResp.Listeners), 1, "Expected at least one listener on port 80")

		// Validate HTTP listener on port 80
		httpListener := false
		for _, listener := range listenersResp.Listeners {
			if *listener.Port == 80 && listener.Protocol == elbv2types.ProtocolEnumHttp {
				httpListener = true
				break
			}
		}
		assert.True(t, httpListener, "Expected HTTP listener on port 80")
	})

	t.Run("Auto Scaling Group Validation", func(t *testing.T) {
		asgClient := autoscaling.NewFromConfig(cfg)

		// Test ASG exists and has correct configuration
		asgResp, err := asgClient.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{
			AutoScalingGroupNames: []string{outputs.ASGName},
		})
		require.NoError(t, err, "Failed to describe ASG")
		require.Len(t, asgResp.AutoScalingGroups, 1, "Expected exactly one ASG")

		asg := asgResp.AutoScalingGroups[0]
		assert.Equal(t, int32(2), *asg.MinSize, "Expected minimum capacity of 2")
		assert.Equal(t, int32(2), *asg.DesiredCapacity, "Expected desired capacity of 2")
		assert.Equal(t, int32(6), *asg.MaxSize, "Expected maximum capacity of 6")
		assert.GreaterOrEqual(t, len(asg.AvailabilityZones), 3, "ASG should span at least 3 AZs")

		// Validate instances are running
		assert.GreaterOrEqual(t, len(asg.Instances), 2, "Expected at least 2 running instances")
		for _, instance := range asg.Instances {
			assert.Contains(t, []string{"InService", "Pending"}, *instance.LifecycleState,
				"Instance should be InService or Pending")
		}

		// Verify instance type from launch template or launch configuration
		if asg.LaunchTemplate != nil {
			ec2Client := ec2.NewFromConfig(cfg)
			ltResp, err := ec2Client.DescribeLaunchTemplateVersions(ctx, &ec2.DescribeLaunchTemplateVersionsInput{
				LaunchTemplateId: asg.LaunchTemplate.LaunchTemplateId,
				Versions:         []string{*asg.LaunchTemplate.Version},
			})
			if err == nil && len(ltResp.LaunchTemplateVersions) > 0 {
				assert.Equal(t, "t3.medium", string(ltResp.LaunchTemplateVersions[0].LaunchTemplateData.InstanceType),
					"Expected t3.medium instance type")
			}
		}
	})

	t.Run("CloudWatch Monitoring Validation", func(t *testing.T) {
		cwClient := cloudwatch.NewFromConfig(cfg)

		// Test CloudWatch alarms exist for the ASG
		alarmsResp, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{
			AlarmNamePrefix: aws.String("TapStack"),
		})
		require.NoError(t, err, "Failed to describe CloudWatch alarms")

		// Look for CPU utilization alarm
		cpuAlarmExists := false
		for _, alarm := range alarmsResp.MetricAlarms {
			if strings.Contains(strings.ToLower(*alarm.AlarmName), "cpu") ||
				strings.Contains(strings.ToLower(*alarm.AlarmDescription), "cpu") {
				cpuAlarmExists = true
				assert.Equal(t, float64(70), *alarm.Threshold, "Expected CPU alarm threshold of 70%")
				assert.Equal(t, types.ComparisonOperatorGreaterThanThreshold, alarm.ComparisonOperator,
					"Expected GreaterThanThreshold comparison")
				break
			}
		}
		assert.True(t, cpuAlarmExists, "Expected to find CPU utilization alarm")

		// Test scaling policies exist
		asgClient := autoscaling.NewFromConfig(cfg)
		policiesResp, err := asgClient.DescribePolicies(ctx, &autoscaling.DescribePoliciesInput{
			AutoScalingGroupName: &outputs.ASGName,
		})
		require.NoError(t, err, "Failed to describe scaling policies")
		assert.GreaterOrEqual(t, len(policiesResp.ScalingPolicies), 1, "Expected at least one scaling policy")
	})

	t.Run("End-to-End Application Connectivity", func(t *testing.T) {
		// Test HTTP connectivity to the ALB
		url := fmt.Sprintf("http://%s", outputs.ALBDNSName)
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		// Retry logic for eventual consistency
		var resp *http.Response
		var err error
		for i := 0; i < 10; i++ {
			resp, err = client.Get(url)
			if err == nil {
				break
			}
			time.Sleep(30 * time.Second) // Wait for instances to become healthy
		}
		require.NoError(t, err, "Failed to connect to ALB after retries")
		defer resp.Body.Close()

		// Verify successful HTTP response
		assert.Equal(t, http.StatusOK, resp.StatusCode, "Expected HTTP 200 response")

		// Read response body to verify it contains expected content
		body, err := ioutil.ReadAll(resp.Body)
		require.NoError(t, err, "Failed to read response body")
		bodyStr := string(body)

		// Verify the response contains expected HTML content from user data script
		assert.Contains(t, bodyStr, "<h1>Hello from", "Response should contain greeting from instance")
		assert.Contains(t, strings.ToLower(bodyStr), "html", "Response should be HTML content")
	})

	t.Run("Security Group Configuration", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Get security groups associated with the VPC
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe security groups")

		// Look for ALB security group (should allow HTTP/HTTPS from anywhere)
		albSGFound := false
		instanceSGFound := false

		for _, sg := range sgResp.SecurityGroups {
			// Skip default security group
			if *sg.GroupName == "default" {
				continue
			}

			// Check if this looks like an ALB security group
			hasHttpIngress := false
			hasHttpsIngress := false
			for _, rule := range sg.IpPermissions {
				if rule.FromPort != nil && rule.ToPort != nil {
					if *rule.FromPort == 80 && *rule.ToPort == 80 {
						hasHttpIngress = true
					}
					if *rule.FromPort == 443 && *rule.ToPort == 443 {
						hasHttpsIngress = true
					}
				}
			}

			if hasHttpIngress && hasHttpsIngress {
				albSGFound = true
			} else if hasHttpIngress {
				// This might be instance security group that allows HTTP from ALB
				instanceSGFound = true
			}
		}

		assert.True(t, albSGFound || instanceSGFound, "Expected to find security groups for ALB or instances")
	})

	t.Run("Resource Tagging Validation", func(t *testing.T) {
		ec2Client := ec2.NewFromConfig(cfg)

		// Check VPC tags
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		// Verify required tags exist
		tags := make(map[string]string)
		for _, tag := range vpcResp.Vpcs[0].Tags {
			tags[*tag.Key] = *tag.Value
		}

		// Check for expected tags (Environment and Team from the stack)
		assert.Contains(t, tags, "Environment", "VPC should have Environment tag")
		assert.Contains(t, tags, "Team", "VPC should have Team tag")
		if env, exists := tags["Environment"]; exists {
			assert.Equal(t, "Production", env, "Environment tag should be Production")
		}
		if team, exists := tags["Team"]; exists {
			assert.Equal(t, "DevOps", team, "Team tag should be DevOps")
		}
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}

// TestTapStackSynthesis tests CDK synthesis without actual deployment
func TestTapStackSynthesis(t *testing.T) {
	defer jsii.Close()

	t.Run("stack synthesizes without errors", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		stack := lib.NewTapStack(app, jsii.String("TestTapStack"), &lib.TapStackProps{
			StackProps: &awscdk.StackProps{
				Env: &awscdk.Environment{
					Account: jsii.String("123456789012"),
					Region:  jsii.String("us-east-1"),
				},
			},
			EnvironmentSuffix: jsii.String("test"),
		})

		assert.NotNil(t, stack)
		assert.Equal(t, "test", *stack.EnvironmentSuffix)

		// Synthesize the stack - this should not throw any errors
		cloudAssembly := app.Synth(nil)
		assert.NotNil(t, cloudAssembly, "Cloud assembly should be created")

		// Verify stack template is generated
		stackArtifacts := cloudAssembly.Stacks()
		assert.GreaterOrEqual(t, len(*stackArtifacts), 1, "Should have at least one stack artifact")
	})

	t.Run("stack handles different environment suffixes", func(t *testing.T) {
		estCases := []string{"dev", "staging", "prod", "test123"}

		for _, envSuffix := range testCases {
			t.Run(fmt.Sprintf("environment_%s", envSuffix), func(t *testing.T) {
				app := awscdk.NewApp(nil)
				stack := lib.NewTapStack(app, jsii.String(fmt.Sprintf("TestTapStack%s", envSuffix)), &lib.TapStackProps{
					StackProps: &awscdk.StackProps{
						Env: &awscdk.Environment{
							Account: jsii.String("123456789012"),
							Region:  jsii.String("us-east-1"),
						},
					},
					EnvironmentSuffix: jsii.String(envSuffix),
				})

				assert.NotNil(t, stack)
				assert.Equal(t, envSuffix, *stack.EnvironmentSuffix)

				// Should synthesize without errors
				cloudAssembly := app.Synth(nil)
				assert.NotNil(t, cloudAssembly)
			})
		}
	})
}
