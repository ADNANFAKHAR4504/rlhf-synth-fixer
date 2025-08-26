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

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	asgtypes "github.com/aws/aws-sdk-go-v2/service/autoscaling/types"

	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	cwtypes "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"

	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"

	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	elbv2types "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2/types"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// flatOutputs mirrors the flattened JSON produced by your deploy step.
type flatOutputs struct {
	StackName          string `json:"StackName"`
	Region             string `json:"Region"`
	VPCId              string `json:"VPCId"`
	ALBDNSName         string `json:"ALBDNSName"`
	ALBArn             string `json:"ALBArn"`
	Listener80Arn      string `json:"Listener80Arn"`
	ASGName            string `json:"ASGName"`
	EnvironmentSuffix  string `json:"EnvironmentSuffix"`
	PublicSubnetIds    string `json:"PublicSubnetIds"`  // comma-separated
	PrivateSubnetIds   string `json:"PrivateSubnetIds"` // comma-separated
	BastionSecurityGID string `json:"BastionSecurityGroupId"`
}

// loadFlatOutputs reads cfn-outputs/flat-outputs.json (default path)
func loadFlatOutputs(t *testing.T) flatOutputs {
	t.Helper()
	path := "cfn-outputs/flat-outputs.json"
	if v := os.Getenv("CFN_FLAT_OUTPUTS"); v != "" {
		path = v
	}
	data, err := ioutil.ReadFile(path)
	require.NoError(t, err, "failed reading outputs file at %s", path)

	var out flatOutputs
	require.NoError(t, json.Unmarshal(data, &out), "failed to parse outputs JSON")
	return out
}

func splitCSV(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		pp := strings.TrimSpace(p)
		if pp != "" {
			res = append(res, pp)
		}
	}
	return res
}

func TestLive_AWS_Stack(t *testing.T) {
	// Skip in short mode or if creds missing
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" && os.Getenv("AWS_PROFILE") == "" {
		t.Skip("Skipping: no AWS credentials/profile set")
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	// Load deployment outputs (produced by your infra pipeline)
	outputs := loadFlatOutputs(t)
	require.NotEmpty(t, outputs.VPCId, "VPCId output is required")
	require.NotEmpty(t, outputs.ALBDNSName, "ALBDNSName output is required")
	require.NotEmpty(t, outputs.ASGName, "ASGName output is required")

	ec2Client := ec2.NewFromConfig(cfg)
	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)
	asgClient := autoscaling.NewFromConfig(cfg)
	cwClient := cloudwatch.NewFromConfig(cfg)
	cfnClient := cloudformation.NewFromConfig(cfg)

	t.Run("StackExistsAndStable", func(t *testing.T) {
		if outputs.StackName == "" {
			t.Skip("No stack name provided in outputs; skipping stack status check")
		}
		_, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
			StackName: aws.String(outputs.StackName),
		})
		require.NoError(t, err, "CloudFormation stack should exist")
	})

	t.Run("VPC_Has_Expected_Subnets", func(t *testing.T) {
		// Expect 6 subnets: 3 public + 3 private (per your spec)
		resp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err)

		var publicCount, privateCount int
		for _, s := range resp.Subnets {
			// heuristic: map-public-ip-on-launch generally true for public subnets
			attrResp, err := ec2Client.DescribeSubnetAttribute(ctx, &ec2.DescribeSubnetAttributeInput{
				SubnetId:  aws.String(*s.SubnetId),
				Attribute: ec2types.SubnetAttributeNameMapPublicIpOnLaunch,
			})
			require.NoError(t, err)

			if attrResp.MapPublicIpOnLaunch != nil && attrResp.MapPublicIpOnLaunch.Value != nil && *attrResp.MapPublicIpOnLaunch.Value {
				publicCount++
			} else {
				privateCount++
			}
		}
		assert.GreaterOrEqual(t, publicCount, 3, "expected at least 3 public subnets")
		assert.GreaterOrEqual(t, privateCount, 3, "expected at least 3 private subnets")
	})

	t.Run("ALB_Is_Reachable_And_Has_HTTP_Listener_80", func(t *testing.T) {
		// DNS should respond
		url := fmt.Sprintf("http://%s", outputs.ALBDNSName)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Get(url)
		require.NoError(t, err, "ALB DNS should resolve and respond (health page or default 200/4xx is fine)")
		_ = resp.Body.Close()

		// Verify listener on :80 HTTP
		lbs, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)

		var targetLBArn *string
		for _, lb := range lbs.LoadBalancers {
			if lb.DNSName != nil && *lb.DNSName == outputs.ALBDNSName {
				targetLBArn = lb.LoadBalancerArn
				break
			}
		}
		require.NotNil(t, targetLBArn, "Could not find ALB by DNS name")

		listeners, err := elbClient.DescribeListeners(ctx, &elasticloadbalancingv2.DescribeListenersInput{
			LoadBalancerArn: targetLBArn,
		})
		require.NoError(t, err)

		foundHTTP80 := false
		for _, l := range listeners.Listeners {
			if l.Port != nil && *l.Port == 80 && l.Protocol == elbv2types.ProtocolEnumHttp {
				foundHTTP80 = true
				break
			}
		}
		assert.True(t, foundHTTP80, "Expected an HTTP listener on port 80")
	})

	t.Run("ASG_Has_Min_2_Instances_InService_or_Pending", func(t *testing.T) {
		out, err := asgClient.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{
			AutoScalingGroupNames: []string{outputs.ASGName},
		})
		require.NoError(t, err)
		require.Greater(t, len(out.AutoScalingGroups), 0, "ASG not found")

		asg := out.AutoScalingGroups[0]
		assert.GreaterOrEqual(t, len(asg.Instances), 2, "Expected at least 2 instances in the ASG")

		validStates := map[asgtypes.LifecycleState]bool{
			asgtypes.LifecycleStateInService: true,
			asgtypes.LifecycleStatePending:   true,
		}
		for _, inst := range asg.Instances {
			// LifecycleState is an enum (string-like), do not deref as pointer
			_, ok := validStates[inst.LifecycleState]
			assert.Truef(t, ok, "Instance state should be InService or Pending, got %s", inst.LifecycleState)
		}
	})

	t.Run("CPU_Alarm_Exists_At_70_GreaterThanThreshold", func(t *testing.T) {
		alarms, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{})
		require.NoError(t, err)

		found := false
		for _, a := range alarms.MetricAlarms {
			name := strings.ToLower(aws.ToString(a.AlarmName))
			desc := strings.ToLower(aws.ToString(a.AlarmDescription))
			if strings.Contains(name, "cpu") || strings.Contains(desc, "cpu") {
				found = true
				// threshold 70 and operator GreaterThanThreshold
				if a.Threshold != nil {
					assert.Equal(t, float64(70), *a.Threshold)
				} else {
					assert.Fail(t, "CPU alarm threshold missing")
				}
				assert.Equal(t, cwtypes.ComparisonOperatorGreaterThanThreshold, a.ComparisonOperator)
				break
			}
		}
		assert.True(t, found, "Expected at least one CPU-related alarm")
	})

	t.Run("Bastion_SG_Allows_SSH_0.0.0.0/0_or_Configured_CIDR", func(t *testing.T) {
		// Look up SGs in this VPC and find the bastion SG by id (preferred) or by tag/name heuristic
		params := &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}},
			},
		}
		if outputs.BastionSecurityGID != "" {
			params.GroupIds = []string{outputs.BastionSecurityGID}
			params.Filters = nil
		}
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, params)
		require.NoError(t, err)
		require.Greater(t, len(sgResp.SecurityGroups), 0, "No security groups returned for VPC")

		foundSSH := false
		for _, sg := range sgResp.SecurityGroups {
			// Check ingress on tcp/22 from 0.0.0.0/0, or any explicit SSH CIDR
			for _, ip := range sg.IpPermissions {
				if ip.FromPort != nil && ip.ToPort != nil && *ip.FromPort == 22 && *ip.ToPort == 22 && ip.IpProtocol != nil && *ip.IpProtocol == "tcp" {
					for _, r := range ip.IpRanges {
						if r.CidrIp != nil {
							c := *r.CidrIp
							if c == "0.0.0.0/0" || strings.Contains(c, "/") {
								foundSSH = true
								break
							}
						}
					}
				}
				if foundSSH {
					break
				}
			}
			if foundSSH {
				break
			}
		}
		assert.True(t, foundSSH, "Expected a bastion SSH ingress rule")
	})

	t.Run("NAT_Gateways_Exist", func(t *testing.T) {
		ngwResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(ngwResp.NatGateways), 1, "Expected at least one NAT Gateway")
	})
}

func Test_Synth_Handles_Different_Environment_Suffixes(t *testing.T) {
	// This is a light sanity test that the CDK stack still synthesizes across env suffixes.
	testCases := []string{"dev", "staging", "prod", "test123"}

	for _, envSuffix := range testCases {
		t.Run(fmt.Sprintf("environment_%s", envSuffix), func(t *testing.T) {
			app := awscdk.NewApp(nil)

			stack := lib.NewTapStack(app, jsii.String(fmt.Sprintf("TestTapStack%s", envSuffix)), &lib.TapStackProps{
				EnvironmentSuffix: jsii.String(envSuffix),
			})
			assert.NotNil(t, stack)

			// should synth without error
			asm := app.Synth(nil)
			assert.NotNil(t, asm)
		})
	}
}
