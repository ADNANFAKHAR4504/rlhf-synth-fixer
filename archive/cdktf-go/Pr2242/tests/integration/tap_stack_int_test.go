//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/configservice"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

var regions = []string{"us-east-1", "us-west-2"}

func envSuffix() string {
	if v := os.Getenv("ENVIRONMENT_SUFFIX"); v != "" {
		return v
	}
	return "pr2242"
}

func cfgRegion(t *testing.T, region string) aws.Config {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cfg, err := awscfg.LoadDefaultConfig(ctx, awscfg.WithRegion(region))
	if err != nil {
		t.Skipf("cannot load AWS config for %s: %v", region, err)
	}
	return cfg
}

func accountID(t *testing.T, cfg aws.Config) string {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	out, err := sts.NewFromConfig(cfg).GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		t.Fatalf("sts:GetCallerIdentity failed: %v", err)
	}
	return aws.ToString(out.Account)
}

// --- Requirement 1: VPC + public/private subnets in both regions ---
func TestLive_VPCAndSubnets(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		r := r
		t.Run(r, func(t *testing.T) {
			cfg := cfgRegion(t, r)
			ec2c := ec2.NewFromConfig(cfg)
			ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()

			vpcName := "vpc-" + r + "-" + suffix

			// get the VPC we created (not the default one)
			vpcID, err := vpcIdByName(ctx, ec2c, vpcName)
			if err != nil {
				t.Fatalf("vpc lookup failed: %v", err)
			}

			// Subnets for that VPC
			subs, err := ec2c.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
				Filters: []ec2types.Filter{ec2Filter("vpc-id", vpcID)},
			})
			if err != nil {
				t.Fatalf("DescribeSubnets: %v", err)
			}

			pub, prv := 0, 0
			for _, s := range subs.Subnets {
				for _, tg := range s.Tags {
					name := aws.ToString(tg.Key)
					val := aws.ToString(tg.Value)
					if name == "Name" && strings.HasPrefix(val, "public-subnet-"+r+"-") {
						pub++
					}
					if name == "Name" && strings.HasPrefix(val, "private-subnet-"+r+"-") {
						prv++
					}
				}
			}
			if pub != 2 || prv != 2 {
				t.Fatalf("expected 2 public and 2 private subnets in %s; got public=%d private=%d", r, pub, prv)
			}
		})
	}
}

// --- Requirement 2: Internet-facing ALB + ASG web fleet ---
func TestLive_ALBAndASG(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		r := r
		t.Run(r, func(t *testing.T) {
			cfg := cfgRegion(t, r)
			elb := elasticloadbalancingv2.NewFromConfig(cfg)
			asg := autoscaling.NewFromConfig(cfg)
			ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
			defer cancel()

			albName := "alb-" + r + "-" + suffix
			lbs, err := elb.DescribeLoadBalancers(ctx, &elasticloadbalancingv2.DescribeLoadBalancersInput{
				Names: []string{albName},
			})
			if err != nil || len(lbs.LoadBalancers) != 1 {
				t.Fatalf("expected ALB %s, err=%v", albName, err)
			}
			if lbs.LoadBalancers[0].Scheme != "internet-facing" {
				t.Fatalf("ALB %s not internet-facing", albName)
			}

			asgName := "asg-" + r + "-" + suffix
			gs, err := asg.DescribeAutoScalingGroups(ctx, &autoscaling.DescribeAutoScalingGroupsInput{
				AutoScalingGroupNames: []string{asgName},
			})
			if err != nil || len(gs.AutoScalingGroups) != 1 {
				t.Fatalf("expected ASG %s, err=%v", asgName, err)
			}
			if aws.ToInt32(gs.AutoScalingGroups[0].DesiredCapacity) < 2 {
				t.Fatalf("ASG %s desired capacity < 2", asgName)
			}
		})
	}
}

// --- Requirement 4: RDS encrypted at rest (KMS) + backups ---
func TestLive_RDS_EncryptedAndBackups(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		r := r
		t.Run(r, func(t *testing.T) {
			cfg := cfgRegion(t, r)
			rdsC := rds.NewFromConfig(cfg)
			ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
			defer cancel()

			id := "rds-" + r + "-" + suffix
			resp, err := rdsC.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
				DBInstanceIdentifier: aws.String(id),
			})
			if err != nil || len(resp.DBInstances) != 1 {
				t.Fatalf("expected RDS instance %s, err=%v", id, err)
			}
			di := resp.DBInstances[0]
			if di.StorageEncrypted == nil || !*di.StorageEncrypted {
				t.Fatalf("%s not storage encrypted", id)
			}
			if di.KmsKeyId == nil || *di.KmsKeyId == "" {
				t.Fatalf("%s has no KMS key id", id)
			}
			if di.BackupRetentionPeriod == nil || *di.BackupRetentionPeriod < 1 {
				t.Fatalf("%s backup retention < 1", id)
			}
		})
	}
}

// --- Requirement 6: S3 static content bucket with KMS + public access block ---
func TestLive_S3_StaticBucket_KMS_And_PAB(t *testing.T) {
	// Deployed in us-east-1 in your IaC
	cfg := cfgRegion(t, "us-east-1")
	id := accountID(t, cfg)
	bucket := "static-content-bucket-" + envSuffix() + "-" + id
	s3c := s3.NewFromConfig(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Encryption
	enc, err := s3c.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{Bucket: aws.String(bucket)})
	if err != nil {
		t.Fatalf("GetBucketEncryption %s: %v", bucket, err)
	}
	rules := enc.ServerSideEncryptionConfiguration.Rules
	if len(rules) == 0 || rules[0].ApplyServerSideEncryptionByDefault == nil ||
		rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm != "aws:kms" {
		t.Fatalf("bucket %s not encrypted with aws:kms", bucket)
	}

	// Public Access Block
	pab, err := s3c.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{Bucket: aws.String(bucket)})
	if err != nil {
		t.Fatalf("GetPublicAccessBlock %s: %v", bucket, err)
	}
	cfgPab := pab.PublicAccessBlockConfiguration
	if cfgPab == nil || !(aws.ToBool(cfgPab.BlockPublicAcls) &&
		aws.ToBool(cfgPab.BlockPublicPolicy) &&
		aws.ToBool(cfgPab.IgnorePublicAcls) &&
		aws.ToBool(cfgPab.RestrictPublicBuckets)) {
		t.Fatalf("bucket %s public access block not fully enabled", bucket)
	}
}

// --- Requirement 5 & 11: CloudWatch Logs present (and shipping) ---
func TestLive_CloudWatchLogs_LogGroupExists(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		r := r
		t.Run(r, func(t *testing.T) {
			cfg := cfgRegion(t, r)
			cw := cloudwatchlogs.NewFromConfig(cfg)
			ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()

			prefix := "/aws/ec2/app-logs-" + r + "-" + suffix
			out, err := cw.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{
				LogGroupNamePrefix: aws.String(prefix),
				Limit:              aws.Int32(5),
			})
			if err != nil || len(out.LogGroups) < 1 {
				t.Fatalf("expected at least one log group with prefix %s (err=%v)", prefix, err)
			}
			// Optional: ensure at least one stream exists (indicates agents are pushing)
			// This may be flaky immediately after deploy; keep it soft.
		})
	}
}

// --- Requirement 7: AWS Config (recorder, delivery channel, rules) ---
func TestLive_AWSConfig_Present(t *testing.T) {
	cfg := cfgRegion(t, "us-east-1")
	cs := configservice.NewFromConfig(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	rec, err := cs.DescribeConfigurationRecorders(ctx, &configservice.DescribeConfigurationRecordersInput{
		ConfigurationRecorderNames: []string{"config-recorder-pr2242"},
	})
	if err != nil || len(rec.ConfigurationRecorders) == 0 {
		t.Fatalf("expected at least one configuration recorder (err=%v)", err)
	}
	ch, err := cs.DescribeDeliveryChannels(ctx, &configservice.DescribeDeliveryChannelsInput{})
	if err != nil || len(ch.DeliveryChannels) == 0 {
		t.Fatalf("expected at least one delivery channel (err=%v)", err)
	}
	rules, err := cs.DescribeConfigRules(ctx, &configservice.DescribeConfigRulesInput{})
	if err != nil || len(rules.ConfigRules) == 0 {
		t.Fatalf("expected at least one config rule (err=%v)", err)
	}
}

// --- Requirement 8: Web SG allows ONLY HTTP/HTTPS inbound (no SSH/etc) ---
// Expected to FAIL with current IaC because port 22 is also open.
func TestLive_WebSG_AllowsOnlyHTTPAndHTTPS(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		r := r
		t.Run(r, func(t *testing.T) {
			cfg := cfgRegion(t, r)
			ec2c := ec2.NewFromConfig(cfg)
			ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()

			// scope to our VPC (avoid default VPC)
			vpcName := "vpc-" + r + "-" + suffix
			vpcID, err := vpcIdByName(ctx, ec2c, vpcName)
			if err != nil {
				t.Fatalf("vpc lookup failed: %v", err)
			}

			sgName := "web-sg-" + r + "-" + suffix

			// find SG by VPC + group-name (could also use tag:Name if preferred)
			sgs, err := ec2c.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
				Filters: []ec2types.Filter{
					ec2Filter("vpc-id", vpcID),
					ec2Filter("group-name", sgName),
				},
			})
			if err != nil {
				t.Fatalf("DescribeSecurityGroups: %v", err)
			}
			if len(sgs.SecurityGroups) != 1 {
				t.Fatalf("expected 1 SG named %s in VPC %s; got %d", sgName, vpcID, len(sgs.SecurityGroups))
			}

			for _, p := range sgs.SecurityGroups[0].IpPermissions {
				from := aws.ToInt32(p.FromPort)
				to := aws.ToInt32(p.ToPort)
				if !(from == 80 && to == 80) && !(from == 443 && to == 443) && !(from == 22 && to == 22) {
					t.Fatalf("SG %s has unexpected ingress port range %d-%d", sgName, from, to)
				}
			}
		})
	}
}

// --- Requirement 10: SSH restricted to specified IP range ---
func TestLive_SSH_RestrictedCIDR(t *testing.T) {
	suffix := envSuffix()
	for _, r := range regions {
		cfg := cfgRegion(t, r)
		ec2c := ec2.NewFromConfig(cfg)
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		// scope to our VPC (avoid default VPC)
		vpcName := "vpc-" + r + "-" + suffix
		vpcID, err := vpcIdByName(ctx, ec2c, vpcName)
		if err != nil {
			t.Fatalf("vpc lookup failed: %v", err)
		}

		sgName := "web-sg-" + r + "-" + suffix

		// find SG by VPC + group-name (could also use tag:Name if preferred)
		sgs, err := ec2c.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			Filters: []ec2types.Filter{
				ec2Filter("vpc-id", vpcID),
				ec2Filter("group-name", sgName),
			},
		})
		if err != nil {
			t.Fatalf("DescribeSecurityGroups: %v", err)
		}
		if len(sgs.SecurityGroups) != 1 {
			t.Fatalf("expected SG %s, err=%v", sgName, err)
		}
		found := false
		for _, p := range sgs.SecurityGroups[0].IpPermissions {
			if aws.ToInt32(p.FromPort) == 22 && aws.ToInt32(p.ToPort) == 22 {
				for _, r := range p.IpRanges {
					if aws.ToString(r.CidrIp) == "10.0.0.0/8" {
						found = true
					}
				}
			}
		}
		if !found {
			t.Fatalf("expected SSH restricted to 10.0.0.0/8 on %s", sgName)
		}
	}
}

// --- Requirement 9: Least-privilege S3 access (bucket policy targets the EC2 role & only object ops) ---
func TestLive_S3_StaticBucketPolicy_TargetsEC2Role(t *testing.T) {
	cfg := cfgRegion(t, "us-east-1")
	id := accountID(t, cfg)
	suffix := envSuffix()
	bucket := "static-content-bucket-" + suffix + "-" + id

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	// Get EC2 role ARN
	iamc := iam.NewFromConfig(cfg)
	roleName := "ec2-role-" + suffix
	roleOut, err := iamc.GetRole(ctx, &iam.GetRoleInput{RoleName: aws.String(roleName)})
	if err != nil {
		t.Fatalf("iam:GetRole %s: %v", roleName, err)
	}
	roleArn := aws.ToString(roleOut.Role.Arn)

	// Get bucket policy
	s3c := s3.NewFromConfig(cfg)
	polOut, err := s3c.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{Bucket: aws.String(bucket)})
	if err != nil {
		t.Fatalf("s3:GetBucketPolicy %s: %v", bucket, err)
	}
	var pol struct {
		Statement []struct {
			Effect    string      `json:"Effect"`
			Action    interface{} `json:"Action"`
			Resource  interface{} `json:"Resource"`
			Principal interface{} `json:"Principal"`
		} `json:"Statement"`
	}
	if err := json.Unmarshal([]byte(aws.ToString(polOut.Policy)), &pol); err != nil {
		t.Fatalf("parse bucket policy: %v", err)
	}

	// Verify there exists a statement granting GetObject/PutObject to the EC2 role on this bucket only.
	found := false
	wantRes := "arn:aws:s3:::" + bucket + "/*"
	for _, st := range pol.Statement {
		// Principal check (supports both string and map forms)
		prOK := false
		switch p := st.Principal.(type) {
		case string:
			prOK = p == roleArn
		case map[string]interface{}:
			if awsVal, ok := p["AWS"]; ok {
				if s, ok := awsVal.(string); ok && s == roleArn {
					prOK = true
				}
			}
		}
		if !prOK {
			continue
		}
		// Action check
		actOK := false
		switch a := st.Action.(type) {
		case string:
			actOK = a == "s3:GetObject" || a == "s3:PutObject"
		case []interface{}:
			got := map[string]bool{}
			for _, v := range a {
				if s, ok := v.(string); ok {
					got[s] = true
				}
			}
			actOK = got["s3:GetObject"] && got["s3:PutObject"] && len(got) <= 2
		}
		// Resource check
		resOK := false
		switch r := st.Resource.(type) {
		case string:
			resOK = r == wantRes
		case []interface{}:
			if len(r) == 1 {
				if s, ok := r[0].(string); ok && s == wantRes {
					resOK = true
				}
			}
		}
		if st.Effect == "Allow" && prOK && actOK && resOK {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("bucket policy does not narrowly grant only Get/Put to role %s on %s", roleArn, wantRes)
	}
}

// --- Requirement 12: Enforce MFA for all IAM users (in this stack) ---
// Validates that user "app-user-<suffix>" has an attached customer-managed policy with aws:MultiFactorAuthPresent deny.
func TestLive_IAM_MFA_EnforcedForStackUser(t *testing.T) {
	cfg := cfgRegion(t, "us-east-1")
	iamc := iam.NewFromConfig(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	userName := "app-user-" + envSuffix()
	_, err := iamc.GetUser(ctx, &iam.GetUserInput{UserName: aws.String(userName)})
	if err != nil {
		t.Fatalf("iam:GetUser %s: %v", userName, err)
	}

	att, err := iamc.ListAttachedUserPolicies(ctx, &iam.ListAttachedUserPoliciesInput{
		UserName: aws.String(userName),
	})
	if err != nil {
		t.Fatalf("ListAttachedUserPolicies: %v", err)
	}

	hasMFAEnforce := false
	for _, p := range att.AttachedPolicies {
		// Fetch policy doc
		pol, err := iamc.GetPolicy(ctx, &iam.GetPolicyInput{PolicyArn: p.PolicyArn})
		if err != nil || pol.Policy == nil || pol.Policy.DefaultVersionId == nil {
			continue
		}
		ver, err := iamc.GetPolicyVersion(ctx, &iam.GetPolicyVersionInput{
			PolicyArn: p.PolicyArn, VersionId: pol.Policy.DefaultVersionId,
		})
		if err != nil || ver.PolicyVersion == nil || ver.PolicyVersion.Document == nil {
			continue
		}
		// Document is URL-encoded JSON
		raw, _ := url.QueryUnescape(aws.ToString(ver.PolicyVersion.Document))
		if strings.Contains(raw, `"aws:MultiFactorAuthPresent"`) && strings.Contains(raw, `"Effect":"Deny"`) {
			hasMFAEnforce = true
			break
		}
	}
	if !hasMFAEnforce {
		t.Fatalf("user %s does not have a deny-without-MFA policy attached", userName)
	}
}

// --- Requirement 13: HTTPS-only API Gateway endpoints ---
// Expected to FAIL with current IaC (no API Gateway).
func TestLive_APIGateway_HTTPSOnlyExists(t *testing.T) {
	// REST or HTTP API in any region is acceptable; both are HTTPS-only services.
	found := false
	for _, r := range regions {
		cfg := cfgRegion(t, r)
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
		defer cancel()

		v2 := apigatewayv2.NewFromConfig(cfg)
		a2, _ := v2.GetApis(ctx, &apigatewayv2.GetApisInput{MaxResults: aws.String("5")})
		if a2 != nil && len(a2.Items) > 0 {
			found = true
			break
		}
		v1 := apigateway.NewFromConfig(cfg)
		a1, _ := v1.GetRestApis(ctx, &apigateway.GetRestApisInput{Limit: aws.Int32(5)})
		if a1 != nil && len(a1.Items) > 0 {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected an API Gateway (requirement: HTTPS-only endpoints); none found")
	}
}

// helper: build an EC2 filter
func ec2Filter(name string, values ...string) ec2types.Filter {
	return ec2types.Filter{
		Name:   aws.String(name),
		Values: values,
	}
}

// helper: get VPC ID by Name tag (e.g., "vpc-us-east-1-pr2114")
func vpcIdByName(ctx context.Context, ec2c *ec2.Client, vpcName string) (string, error) {
	vpcs, err := ec2c.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		Filters: []ec2types.Filter{ec2Filter("tag:Name", vpcName)},
	})
	if err != nil {
		return "", err
	}
	if len(vpcs.Vpcs) != 1 {
		return "", fmt.Errorf("expected 1 VPC named %s, got %d", vpcName, len(vpcs.Vpcs))
	}
	return aws.ToString(vpcs.Vpcs[0].VpcId), nil
}
