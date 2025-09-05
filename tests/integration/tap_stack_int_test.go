//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
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

// ======== outputs ========

type flatOutputs struct {
	StackName          string `json:"StackName"`
	Region             string `json:"Region"`
	VPCId              string `json:"VPCId"`
	ALBDNSName         string `json:"ALBDNSName"`
	ASGName            string `json:"ASGName"`
	EnvironmentSuffix  string `json:"EnvironmentSuffix"`
	PublicSubnetIds    string `json:"PublicSubnetIds"`  // optional CSV
	PrivateSubnetIds   string `json:"PrivateSubnetIds"` // optional CSV
	BastionSecurityGID string `json:"BastionSecurityGroupId"`
}

// tryRead returns first successful read
func tryRead(paths []string) ([]byte, string, error) {
	for _, p := range paths {
		if strings.TrimSpace(p) == "" {
			continue
		}
		b, err := ioutil.ReadFile(p) //nolint:gosec
		if err == nil {
			return b, p, nil
		}
		if !errors.Is(err, fs.ErrNotExist) {
			// Different error (permission, etc.) — surface it
			return nil, p, err
		}
	}
	return nil, "", fs.ErrNotExist
}

func loadFlatOutputs(t *testing.T) flatOutputs {
	t.Helper()

	candidatePaths := []string{
		os.Getenv("CFN_FLAT_OUTPUTS"),
		"cfn-outputs/flat-outputs.json",
		"./cfn-outputs/flat-outputs.json",
		"../cfn-outputs/flat-outputs.json",
	}

	data, usedPath, err := tryRead(candidatePaths)
	require.NoErrorf(t, err, "Failed reading outputs file. Tried: %s", strings.Join(candidatePaths, ", "))

	var out flatOutputs
	require.NoErrorf(t, json.Unmarshal(data, &out), "Failed parsing outputs JSON at %s", usedPath)

	require.NotEmpty(t, out.VPCId, "VPCId is required in outputs")
	require.NotEmpty(t, out.ALBDNSName, "ALBDNSName is required in outputs")
	require.NotEmpty(t, out.ASGName, "ASGName is required in outputs")
	return out
}

// cfgForRegion prefers outputs.Region, else default provider config
func cfgForRegion(ctx context.Context, t *testing.T, regionHint string) aws.Config {
	var (
		cfg aws.Config
		err error
	)
	if strings.TrimSpace(regionHint) != "" {
		cfg, err = config.LoadDefaultConfig(ctx, config.WithRegion(regionHint))
	} else {
		cfg, err = config.LoadDefaultConfig(ctx)
	}
	require.NoError(t, err, "Failed to load AWS config")
	return cfg
}

// Finds IGW ID attached to the VPC (first one)
func igwIDForVPC(ctx context.Context, t *testing.T, ec2Client *ec2.Client, vpcID string) string {
	igwOut, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		Filters: []ec2types.Filter{{Name: aws.String("attachment.vpc-id"), Values: []string{vpcID}}},
	})
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(igwOut.InternetGateways), 1, "Expected an Internet Gateway")
	return aws.ToString(igwOut.InternetGateways[0].InternetGatewayId)
}

// Determines if a subnet is "public" by checking if any associated RT has 0.0.0.0/0 to the VPC's IGW
func subnetIsPublic(ctx context.Context, t *testing.T, ec2Client *ec2.Client, vpcID, subnetID, igwID string) bool {
	// First, RTs explicitly associated to this subnet
	rtOut, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
		Filters: []ec2types.Filter{
			{Name: aws.String("vpc-id"), Values: []string{vpcID}},
			{Name: aws.String("association.subnet-id"), Values: []string{subnetID}},
		},
	})
	require.NoError(t, err)

	candidates := rtOut.RouteTables

	// If none, fall back to the main route table for the VPC
	if len(candidates) == 0 {
		rtMain, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
			Filters: []ec2types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{vpcID}},
				{Name: aws.String("association.main"), Values: []string{"true"}},
			},
		})
		require.NoError(t, err)
		candidates = append(candidates, rtMain.RouteTables...)
	}

	for _, rt := range candidates {
		for _, r := range rt.Routes {
			if r.DestinationCidrBlock != nil && *r.DestinationCidrBlock == "0.0.0.0/0" &&
				r.GatewayId != nil && *r.GatewayId == igwID {
				return true
			}
		}
	}
	return false
}

func TestLive_AWS_Stack(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" && os.Getenv("AWS_PROFILE") == "" {
		t.Skip("Skipping: no AWS credentials/profile set")
	}

	ctx := context.Background()
	outputs := loadFlatOutputs(t)
	cfg := cfgForRegion(ctx, t, outputs.Region)

	ec2Client := ec2.NewFromConfig(cfg)
	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)
	asgClient := autoscaling.NewFromConfig(cfg)
	cwClient := cloudwatch.NewFromConfig(cfg)

	// --------- VPC & subnets (via RT to IGW) ----------
	t.Run("VPC_Has_AtLeast_3_Public_And_3_Private_Subnets", func(t *testing.T) {
		resp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}},
			},
		})
		require.NoError(t, err)

		igwID := igwIDForVPC(ctx, t, ec2Client, outputs.VPCId)

		var publicCount, privateCount int
		seenAZs := map[string]bool{}
		for _, s := range resp.Subnets {
			if s.AvailabilityZone != nil {
				seenAZs[*s.AvailabilityZone] = true
			}
			if subnetIsPublic(ctx, t, ec2Client, outputs.VPCId, aws.ToString(s.SubnetId), igwID) {
				publicCount++
			} else {
				privateCount++
			}
		}
		assert.GreaterOrEqual(t, len(seenAZs), 3, "Expected at least 3 AZs used")
		assert.GreaterOrEqual(t, publicCount, 3, "Expected at least 3 public subnets")
		assert.GreaterOrEqual(t, privateCount, 3, "Expected at least 3 private subnets")
	})

	// --------- IGW default routes for public subnets ----------
	t.Run("Public_Subnets_Have_Default_Route_To_IGW", func(t *testing.T) {
		igwId := igwIDForVPC(ctx, t, ec2Client, outputs.VPCId)

		// Enumerate subnets and check public ones have 0.0.0.0/0 -> IGW
		snOut, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}}},
		})
		require.NoError(t, err)

		for _, s := range snOut.Subnets {
			if subnetIsPublic(ctx, t, ec2Client, outputs.VPCId, aws.ToString(s.SubnetId), igwId) {
				// get route table(s) for this subnet
				rtOut, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
					Filters: []ec2types.Filter{
						{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}},
						{Name: aws.String("association.subnet-id"), Values: []string{aws.ToString(s.SubnetId)}},
					},
				})
				require.NoError(t, err)
				require.GreaterOrEqual(t, len(rtOut.RouteTables), 1, "Expected a route table associated with subnet %s", aws.ToString(s.SubnetId))

				hasDefaultToIGW := false
				for _, rt := range rtOut.RouteTables {
					for _, r := range rt.Routes {
						if r.DestinationCidrBlock != nil && *r.DestinationCidrBlock == "0.0.0.0/0" &&
							r.GatewayId != nil && *r.GatewayId == igwId {
							hasDefaultToIGW = true
						}
					}
				}
				assert.Truef(t, hasDefaultToIGW, "Public subnet %s should have default route to IGW", aws.ToString(s.SubnetId))
			}
		}
	})

	// --------- NAT Gateways ----------
	t.Run("NAT_Gateways_Exist", func(t *testing.T) {
		ngwResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
			Filter: []ec2types.Filter{{Name: aws.String("vpc-id"), Values: []string{outputs.VPCId}}},
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(ngwResp.NatGateways), 1, "Expected at least one NAT Gateway")
	})

	// --------- ALB reachability & HTTP listener ----------
	t.Run("ALB_Is_Reachable_And_Has_HTTP_80", func(t *testing.T) {
		url := fmt.Sprintf("http://%s", outputs.ALBDNSName)
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Get(url)
		require.NoError(t, err, "ALB DNS should resolve and respond")
		_ = resp.Body.Close()

		lbs, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)

		var lb *elbv2types.LoadBalancer
		for i := range lbs.LoadBalancers {
			if aws.ToString(lbs.LoadBalancers[i].DNSName) == outputs.ALBDNSName {
				lb = &lbs.LoadBalancers[i]
				break
			}
		}
		require.NotNil(t, lb, "Could not find ALB by DNS name")

		listeners, err := elbClient.DescribeListeners(ctx, &elasticloadbalancingv2.DescribeListenersInput{
			LoadBalancerArn: lb.LoadBalancerArn,
		})
		require.NoError(t, err)

		foundHTTP80 := false
		var listener80 *elbv2types.Listener
		for i := range listeners.Listeners {
			l := listeners.Listeners[i]
			if aws.ToInt32(l.Port) == 80 && l.Protocol == elbv2types.ProtocolEnumHttp {
				foundHTTP80 = true
				listener80 = &l
				break
			}
		}
		assert.True(t, foundHTTP80, "Expected an HTTP listener on port 80")

		// Validate target group health check path "/"
		if listener80 != nil {
			// pull target groups from default actions (forward)
			var tgArn string
			for _, a := range listener80.DefaultActions {
				if a.ForwardConfig != nil && len(a.ForwardConfig.TargetGroups) > 0 {
					tgArn = aws.ToString(a.ForwardConfig.TargetGroups[0].TargetGroupArn)
					break
				}
				if a.TargetGroupArn != nil {
					tgArn = aws.ToString(a.TargetGroupArn)
					break
				}
			}
			if tgArn != "" {
				tgs, err := elbClient.DescribeTargetGroups(ctx, &elasticloadbalancingv2.DescribeTargetGroupsInput{
					TargetGroupArns: []string{tgArn},
				})
				require.NoError(t, err)
				require.GreaterOrEqual(t, len(tgs.TargetGroups), 1, "Target group not found")
				hp := aws.ToString(tgs.TargetGroups[0].HealthCheckPath)
				if hp != "" { // if set
					assert.Equal(t, "/", hp, "Health check path should be '/'")
				}
			}
		}
	})

	// --------- ALB SG: 80/443 open to world ----------
	t.Run("ALB_SG_Allows_80_443_From_World", func(t *testing.T) {
		// find ALB and its SGs
		lbs, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)

		var lb *elbv2types.LoadBalancer
		for i := range lbs.LoadBalancers {
			if aws.ToString(lbs.LoadBalancers[i].DNSName) == outputs.ALBDNSName {
				lb = &lbs.LoadBalancers[i]
				break
			}
		}
		require.NotNil(t, lb)

		sgIDs := lb.SecurityGroups
		require.Greater(t, len(sgIDs), 0, "ALB should have at least one security group")

		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: sgIDs,
		})
		require.NoError(t, err)

		has80 := false
		has443 := false
		for _, sg := range sgResp.SecurityGroups {
			for _, p := range sg.IpPermissions {
				if p.FromPort != nil && p.ToPort != nil && p.IpProtocol != nil && *p.IpProtocol == "tcp" {
					if *p.FromPort == 80 && *p.ToPort == 80 {
						for _, r := range p.IpRanges {
							if aws.ToString(r.CidrIp) == "0.0.0.0/0" {
								has80 = true
							}
						}
						for _, r := range p.Ipv6Ranges {
							if aws.ToString(r.CidrIpv6) == "::/0" {
								has80 = true
							}
						}
					}
					if *p.FromPort == 443 && *p.ToPort == 443 {
						for _, r := range p.IpRanges {
							if aws.ToString(r.CidrIp) == "0.0.0.0/0" {
								has443 = true
							}
						}
						for _, r := range p.Ipv6Ranges {
							if aws.ToString(r.CidrIpv6) == "::/0" {
								has443 = true
							}
						}
					}
				}
			}
		}
		assert.True(t, has80, "Expected TCP/80 open from 0.0.0.0/0 or ::/0")
		assert.True(t, has443, "Expected TCP/443 open from 0.0.0.0/0 or ::/0")
	})

	// --------- Instance SG: 80 from ALB SG ----------
	t.Run("Instance_SG_Allows_80_From_ALB_SG", func(t *testing.T) {
		// Find ALB -> SG
		lbs, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)
		var lb *elbv2types.LoadBalancer
		for i := range lbs.LoadBalancers {
			if aws.ToString(lbs.LoadBalancers[i].DNSName) == outputs.ALBDNSName {
				lb = &lbs.LoadBalancers[i]
				break
			}
		}
		require.NotNil(t, lb)
		albSGs := lb.SecurityGroups

		// Find ASG LaunchTemplate/LaunchConfig -> instance SGs
		asgOut, err := asgClient.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{
			AutoScalingGroupNames: []string{outputs.ASGName},
		})
		require.NoError(t, err)
		require.Greater(t, len(asgOut.AutoScalingGroups), 0)
		asgDesc := asgOut.AutoScalingGroups[0]

		var instanceSGs []string
		if asgDesc.LaunchTemplate != nil && asgDesc.LaunchTemplate.LaunchTemplateId != nil {
			ltv, err := ec2Client.DescribeLaunchTemplateVersions(ctx, &ec2.DescribeLaunchTemplateVersionsInput{
				LaunchTemplateId: asgDesc.LaunchTemplate.LaunchTemplateId,
				Versions:         []string{aws.ToString(asgDesc.LaunchTemplate.Version)},
			})
			require.NoError(t, err)
			require.GreaterOrEqual(t, len(ltv.LaunchTemplateVersions), 1)
			instanceSGs = ltv.LaunchTemplateVersions[0].LaunchTemplateData.SecurityGroupIds
		} else if asgDesc.LaunchConfigurationName != nil {
			lcOut, err := asgClient.DescribeLaunchConfigurations(ctx, &autoscaling.DescribeLaunchConfigurationsInput{
				LaunchConfigurationNames: []string{aws.ToString(asgDesc.LaunchConfigurationName)},
			})
			require.NoError(t, err)
			require.GreaterOrEqual(t, len(lcOut.LaunchConfigurations), 1)
			instanceSGs = lcOut.LaunchConfigurations[0].SecurityGroups
		}
		require.GreaterOrEqual(t, len(instanceSGs), 1, "Could not resolve instance SecurityGroups from ASG")

		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: instanceSGs,
		})
		require.NoError(t, err)

		allows80FromALB := false
		for _, sg := range sgResp.SecurityGroups {
			for _, p := range sg.IpPermissions {
				if aws.ToString(p.IpProtocol) == "tcp" && aws.ToInt32(p.FromPort) == 80 && aws.ToInt32(p.ToPort) == 80 {
					for _, gp := range p.UserIdGroupPairs {
						for _, albsg := range albSGs {
							if aws.ToString(gp.GroupId) == albsg {
								allows80FromALB = true
							}
						}
					}
				}
			}
		}
		assert.True(t, allows80FromALB, "Expected instance SG to allow TCP/80 from ALB SG")
	})

	// --------- ASG size & instance type ----------
	t.Run("ASG_MinDesiredMax_And_InstanceType", func(t *testing.T) {
		out, err := asgClient.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{
			AutoScalingGroupNames: []string{outputs.ASGName},
		})
		require.NoError(t, err)
		require.Greater(t, len(out.AutoScalingGroups), 0, "ASG not found")

		asg := out.AutoScalingGroups[0]
		assert.EqualValues(t, 2, aws.ToInt32(asg.MinSize))
		assert.EqualValues(t, 2, aws.ToInt32(asg.DesiredCapacity))
		assert.EqualValues(t, 6, aws.ToInt32(asg.MaxSize))

		// instance type via launch template/config
		var iType string
		if asg.LaunchTemplate != nil && asg.LaunchTemplate.LaunchTemplateId != nil {
			ltv, err := ec2Client.DescribeLaunchTemplateVersions(ctx, &ec2.DescribeLaunchTemplateVersionsInput{
				LaunchTemplateId: asg.LaunchTemplate.LaunchTemplateId,
				Versions:         []string{aws.ToString(asg.LaunchTemplate.Version)},
			})
			require.NoError(t, err)
			require.GreaterOrEqual(t, len(ltv.LaunchTemplateVersions), 1)
			iType = string(ltv.LaunchTemplateVersions[0].LaunchTemplateData.InstanceType)
		} else if asg.LaunchConfigurationName != nil {
			lcOut, err := asgClient.DescribeLaunchConfigurations(ctx, &autoscaling.DescribeLaunchConfigurationsInput{
				LaunchConfigurationNames: []string{aws.ToString(asg.LaunchConfigurationName)},
			})
			require.NoError(t, err)
			require.GreaterOrEqual(t, len(lcOut.LaunchConfigurations), 1)
			iType = aws.ToString(lcOut.LaunchConfigurations[0].InstanceType)
		}
		assert.Equal(t, "t3.medium", iType, "Expected instance type t3.medium")
	})

	// --------- CPU alarm @ 70 ----------
	t.Run("CPU_Alarm_Exists_At_70_GreaterThanThreshold", func(t *testing.T) {
		alarms, err := cwClient.DescribeAlarms(ctx, &cloudwatch.DescribeAlarmsInput{})
		require.NoError(t, err)

		found := false
		for _, a := range alarms.MetricAlarms {
			name := strings.ToLower(aws.ToString(a.AlarmName))
			desc := strings.ToLower(aws.ToString(a.AlarmDescription))
			if strings.Contains(name, "cpu") || strings.Contains(desc, "cpu") {
				found = true
				if a.Threshold != nil {
					assert.GreaterOrEqual(t, *a.Threshold, float64(70), "Expected at Threashold to above 70")

				} else {
					assert.Fail(t, "CPU alarm threshold missing")
				}
				assert.Equal(t, cwtypes.ComparisonOperatorGreaterThanThreshold, a.ComparisonOperator)
				break
			}
		}
		assert.True(t, found, "Expected at least one CPU-related alarm at 70%")
	})

	// --------- Tags on ALB and VPC ----------
	t.Run("Tags_Environment_Production_And_Team_DevOps", func(t *testing.T) {
		// VPC tags
		tagOut, err := ec2Client.DescribeTags(ctx, &ec2.DescribeTagsInput{
			Filters: []ec2types.Filter{
				{Name: aws.String("resource-id"), Values: []string{outputs.VPCId}},
				{Name: aws.String("key"), Values: []string{"Environment", "Team"}},
			},
		})
		require.NoError(t, err)
		hasEnv := false
		hasTeam := false
		for _, ttag := range tagOut.Tags {
			if aws.ToString(ttag.Key) == "Environment" && aws.ToString(ttag.Value) == "Production" {
				hasEnv = true
			}
			if aws.ToString(ttag.Key) == "Team" && aws.ToString(ttag.Value) == "DevOps" {
				hasTeam = true
			}
		}
		assert.True(t, hasEnv, "VPC should have tag Environment=Production")
		assert.True(t, hasTeam, "VPC should have tag Team=DevOps")

		// ALB tags
		lbs, err := elbClient.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{})
		require.NoError(t, err)
		var lbArn string
		for _, lb := range lbs.LoadBalancers {
			if aws.ToString(lb.DNSName) == outputs.ALBDNSName {
				lbArn = aws.ToString(lb.LoadBalancerArn)
				break
			}
		}
		require.NotEmpty(t, lbArn, "Could not find ALB ARN")

		tagResp, err := elbClient.DescribeTags(ctx, &elasticloadbalancingv2.DescribeTagsInput{
			ResourceArns: []string{lbArn},
		})
		require.NoError(t, err)
		require.GreaterOrEqual(t, len(tagResp.TagDescriptions), 1)

		var envOK, teamOK bool
		for _, tag := range tagResp.TagDescriptions[0].Tags {
			if aws.ToString(tag.Key) == "Environment" && aws.ToString(tag.Value) == "Production" {
				envOK = true
			}
			if aws.ToString(tag.Key) == "Team" && aws.ToString(tag.Value) == "DevOps" {
				teamOK = true
			}
		}
		assert.True(t, envOK, "ALB should have tag Environment=Production")
		assert.True(t, teamOK, "ALB should have tag Team=DevOps")
	})

	// --------- Existing test: ASG instances state ----------
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
			_, ok := validStates[inst.LifecycleState]
			assert.Truef(t, ok, "Instance state should be InService or Pending, got %s", inst.LifecycleState)
		}
	})
}

// Keep a synth smoke test across several env suffixes
func Test_Synth_Handles_Different_Environment_Suffixes(t *testing.T) {
	testCases := []string{"dev", "staging", "prod", "test123"}
	for _, envSuffix := range testCases {
		t.Run(fmt.Sprintf("environment_%s", envSuffix), func(t *testing.T) {
			app := awscdk.NewApp(nil)
			stack := lib.NewTapStack(app, jsii.String(fmt.Sprintf("TestTapStack%s", envSuffix)), &lib.TapStackProps{
				EnvironmentSuffix: jsii.String(envSuffix),
			})
			assert.NotNil(t, stack)
			asm := app.Synth(nil)
			assert.NotNil(t, asm)
		})
	}
}
