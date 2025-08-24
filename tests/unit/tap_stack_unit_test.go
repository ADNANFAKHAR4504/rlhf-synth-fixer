//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, environment string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set environment for configuration
	old := os.Getenv("ENVIRONMENT")
	t.Cleanup(func() { _ = os.Setenv("ENVIRONMENT", old) })
	_ = os.Setenv("ENVIRONMENT", environment)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	cfg, err := GetConfig(environment)
	if err != nil {
		t.Fatalf("failed to get config: %v", err)
	}

	BuildInfrastructureStack(stack, cfg)
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

func readTF(t *testing.T, path string) map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read tf json: %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("unmarshal tf json: %v", err)
	}
	return m
}

func asMap(v any) map[string]any {
	if v == nil {
		return nil
	}
	if m, ok := v.(map[string]any); ok {
		return m
	}
	return nil
}

func Test_Synth_VPCResourcesPresentAndConfigured(t *testing.T) {
	tfPath := synthStack(t, "dev")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// VPC
	vpc := asMap(asMap(resources["aws_vpc"])["MainVPC"])
	if vpc == nil {
		t.Fatalf("aws_vpc.MainVPC missing")
	}
	if vpc["cidr_block"] != "10.0.0.0/16" {
		t.Fatalf("vpc cidr_block = %v, want 10.0.0.0/16", vpc["cidr_block"])
	}
	if vpc["enable_dns_hostnames"] != true {
		t.Fatalf("enable_dns_hostnames = %v, want true", vpc["enable_dns_hostnames"])
	}
	if vpc["enable_dns_support"] != true {
		t.Fatalf("enable_dns_support = %v, want true", vpc["enable_dns_support"])
	}

	// Internet Gateway
	igw := asMap(asMap(resources["aws_internet_gateway"])["InternetGateway"])
	if igw == nil {
		t.Fatalf("aws_internet_gateway.InternetGateway missing")
	}

	// Public Subnets
	publicSubnet0 := asMap(asMap(resources["aws_subnet"])["PublicSubnet0"])
	if publicSubnet0 == nil {
		t.Fatalf("aws_subnet.PublicSubnet0 missing")
	}
	if publicSubnet0["cidr_block"] != "10.0.1.0/24" {
		t.Fatalf("public subnet 0 cidr_block = %v, want 10.0.1.0/24", publicSubnet0["cidr_block"])
	}
	if publicSubnet0["map_public_ip_on_launch"] != true {
		t.Fatalf("map_public_ip_on_launch = %v, want true", publicSubnet0["map_public_ip_on_launch"])
	}

	publicSubnet1 := asMap(asMap(resources["aws_subnet"])["PublicSubnet1"])
	if publicSubnet1 == nil {
		t.Fatalf("aws_subnet.PublicSubnet1 missing")
	}
	if publicSubnet1["cidr_block"] != "10.0.2.0/24" {
		t.Fatalf("public subnet 1 cidr_block = %v, want 10.0.2.0/24", publicSubnet1["cidr_block"])
	}

	// Private Subnets
	privateSubnet0 := asMap(asMap(resources["aws_subnet"])["PrivateSubnet0"])
	if privateSubnet0 == nil {
		t.Fatalf("aws_subnet.PrivateSubnet0 missing")
	}
	if privateSubnet0["cidr_block"] != "10.0.10.0/24" {
		t.Fatalf("private subnet 0 cidr_block = %v, want 10.0.10.0/24", privateSubnet0["cidr_block"])
	}

	privateSubnet1 := asMap(asMap(resources["aws_subnet"])["PrivateSubnet1"])
	if privateSubnet1 == nil {
		t.Fatalf("aws_subnet.PrivateSubnet1 missing")
	}
	if privateSubnet1["cidr_block"] != "10.0.20.0/24" {
		t.Fatalf("private subnet 1 cidr_block = %v, want 10.0.20.0/24", privateSubnet1["cidr_block"])
	}

	// NAT Gateways
	natGw0 := asMap(asMap(resources["aws_nat_gateway"])["NatGateway0"])
	if natGw0 == nil {
		t.Fatalf("aws_nat_gateway.NatGateway0 missing")
	}

	natGw1 := asMap(asMap(resources["aws_nat_gateway"])["NatGateway1"])
	if natGw1 == nil {
		t.Fatalf("aws_nat_gateway.NatGateway1 missing")
	}

	// EIPs for NAT Gateways
	eip0 := asMap(asMap(resources["aws_eip"])["NatEIP0"])
	if eip0 == nil {
		t.Fatalf("aws_eip.NatEIP0 missing")
	}
	if eip0["domain"] != "vpc" {
		t.Fatalf("eip domain = %v, want vpc", eip0["domain"])
	}

	// Route Tables
	publicRT := asMap(asMap(resources["aws_route_table"])["PublicRouteTable"])
	if publicRT == nil {
		t.Fatalf("aws_route_table.PublicRouteTable missing")
	}

	privateRT0 := asMap(asMap(resources["aws_route_table"])["PrivateRouteTable0"])
	if privateRT0 == nil {
		t.Fatalf("aws_route_table.PrivateRouteTable0 missing")
	}

	privateRT1 := asMap(asMap(resources["aws_route_table"])["PrivateRouteTable1"])
	if privateRT1 == nil {
		t.Fatalf("aws_route_table.PrivateRouteTable1 missing")
	}
}

func Test_Synth_IAMResourcesPresentAndConfigured(t *testing.T) {
	tfPath := synthStack(t, "dev")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// EC2 Role
	ec2Role := asMap(asMap(resources["aws_iam_role"])["EC2Role"])
	if ec2Role == nil {
		t.Fatalf("aws_iam_role.EC2Role missing")
	}
	assume, _ := ec2Role["assume_role_policy"].(string)
	if !strings.Contains(assume, "ec2.amazonaws.com") {
		t.Fatalf("assume_role_policy must mention ec2.amazonaws.com, got: %s", assume)
	}

	// Lambda Role
	lambdaRole := asMap(asMap(resources["aws_iam_role"])["LambdaRole"])
	if lambdaRole == nil {
		t.Fatalf("aws_iam_role.LambdaRole missing")
	}
	lambdaAssume, _ := lambdaRole["assume_role_policy"].(string)
	if !strings.Contains(lambdaAssume, "lambda.amazonaws.com") {
		t.Fatalf("assume_role_policy must mention lambda.amazonaws.com, got: %s", lambdaAssume)
	}

	// S3 Cross Account Policy
	s3Policy := asMap(asMap(resources["aws_iam_policy"])["S3CrossAccountPolicy"])
	if s3Policy == nil {
		t.Fatalf("aws_iam_policy.S3CrossAccountPolicy missing")
	}
	if _, ok := s3Policy["policy"].(string); !ok {
		t.Fatalf("policy must be a JSON string")
	}

	// Policy Attachments
	ec2SSMAttach := asMap(asMap(resources["aws_iam_role_policy_attachment"])["EC2SSMPolicy"])
	if ec2SSMAttach == nil {
		t.Fatalf("aws_iam_role_policy_attachment.EC2SSMPolicy missing")
	}

	lambdaBasicAttach := asMap(asMap(resources["aws_iam_role_policy_attachment"])["LambdaBasicPolicy"])
	if lambdaBasicAttach == nil {
		t.Fatalf("aws_iam_role_policy_attachment.LambdaBasicPolicy missing")
	}

	ec2S3Attach := asMap(asMap(resources["aws_iam_role_policy_attachment"])["EC2S3PolicyAttachment"])
	if ec2S3Attach == nil {
		t.Fatalf("aws_iam_role_policy_attachment.EC2S3PolicyAttachment missing")
	}

	lambdaS3Attach := asMap(asMap(resources["aws_iam_role_policy_attachment"])["LambdaS3PolicyAttachment"])
	if lambdaS3Attach == nil {
		t.Fatalf("aws_iam_role_policy_attachment.LambdaS3PolicyAttachment missing")
	}
}

func Test_Synth_S3ResourcesPresentAndConfigured(t *testing.T) {
	tfPath := synthStack(t, "dev")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// Logging Bucket
	loggingBucket := asMap(asMap(resources["aws_s3_bucket"])["LoggingBucket"])
	if loggingBucket == nil {
		t.Fatalf("aws_s3_bucket.LoggingBucket missing")
	}
	bucketName, ok := loggingBucket["bucket"].(string)
	if !ok {
		t.Fatalf("bucket name is not a string: %v", loggingBucket["bucket"])
	}
	// Check that bucket name follows the new pattern: logs-{accountID}-{suffix}-{randomSuffix}
	// Get the actual config to determine the expected prefix
	cfg, err := GetConfig("dev")
	if err != nil {
		t.Fatalf("failed to get config: %v", err)
	}
	expectedPrefix := fmt.Sprintf("logs-%s-%s-", cfg.AccountID, cfg.Suffix)
	if !strings.HasPrefix(bucketName, expectedPrefix) {
		t.Fatalf("bucket name = %v, want prefix %s", bucketName, expectedPrefix)
	}

	// Replication Bucket
	replicationBucket := asMap(asMap(resources["aws_s3_bucket"])["ReplicationBucket"])
	if replicationBucket == nil {
		t.Fatalf("aws_s3_bucket.ReplicationBucket missing")
	}
	replicationBucketName, ok := replicationBucket["bucket"].(string)
	if !ok {
		t.Fatalf("replication bucket name is not a string: %v", replicationBucket["bucket"])
	}
	// Check that replication bucket name follows the new pattern: logs-replica-{accountID}-{suffix}-{randomSuffix}
	expectedReplicationPrefix := fmt.Sprintf("logs-replica-%s-%s-", cfg.AccountID, cfg.Suffix)
	if !strings.HasPrefix(replicationBucketName, expectedReplicationPrefix) {
		t.Fatalf("replication bucket name = %v, want prefix %s", replicationBucketName, expectedReplicationPrefix)
	}

	// Versioning
	loggingVer := asMap(asMap(resources["aws_s3_bucket_versioning"])["LoggingBucketVersioning"])
	if loggingVer == nil {
		t.Fatalf("aws_s3_bucket_versioning.LoggingBucketVersioning missing")
	}
	vcVal := loggingVer["versioning_configuration"]
	switch vv := vcVal.(type) {
	case []any:
		if len(vv) == 0 || asMap(vv[0])["status"] != "Enabled" {
			t.Fatalf("versioning_configuration missing or status != Enabled: %v", vcVal)
		}
	case map[string]any:
		if vv["status"] != "Enabled" {
			t.Fatalf("versioning_configuration status != Enabled: %v", vcVal)
		}
	default:
		t.Fatalf("unexpected versioning_configuration type: %T", vcVal)
	}

	// Public Access Block
	loggingPAB := asMap(asMap(resources["aws_s3_bucket_public_access_block"])["LoggingBucketPAB"])
	if loggingPAB == nil {
		t.Fatalf("aws_s3_bucket_public_access_block.LoggingBucketPAB missing")
	}
	for _, k := range []string{"block_public_acls", "block_public_policy", "ignore_public_acls", "restrict_public_buckets"} {
		if loggingPAB[k] != true {
			t.Fatalf("%s must be true", k)
		}
	}

	// SSE
	loggingSSE := asMap(asMap(resources["aws_s3_bucket_server_side_encryption_configuration"])["LoggingBucketEncryption"])
	if loggingSSE == nil {
		t.Fatalf("aws_s3_bucket_server_side_encryption_configuration.LoggingBucketEncryption missing")
	}
	rule, ok := loggingSSE["rule"].([]any)
	if !ok || len(rule) == 0 {
		t.Fatalf("sse rule missing: %v", loggingSSE["rule"])
	}
	apply := asMap(asMap(rule[0])["apply_server_side_encryption_by_default"])
	if apply == nil || apply["sse_algorithm"] != "AES256" {
		t.Fatalf("sse_algorithm must be AES256, got: %v", apply)
	}

	// Bucket Policy
	loggingPolicy := asMap(asMap(resources["aws_s3_bucket_policy"])["LoggingBucketPolicy"])
	if loggingPolicy == nil {
		t.Fatalf("aws_s3_bucket_policy.LoggingBucketPolicy missing")
	}
	if _, ok := loggingPolicy["policy"].(string); !ok {
		t.Fatalf("policy must be a JSON string")
	}
}

func Test_Synth_OutputsPresent(t *testing.T) {
	tfPath := synthStack(t, "dev")
	root := readTF(t, tfPath)
	out := asMap(root["output"])
	if out == nil {
		t.Fatalf("output block missing")
	}
	expectedOutputs := []string{
		"vpc_id", "public_subnet_ids", "private_subnet_ids",
		"logging_bucket_name", "replication_bucket_name",
		"ec2_role_arn", "lambda_role_arn",
	}
	for _, k := range expectedOutputs {
		if asMap(out[k]) == nil {
			t.Fatalf("output %s missing", k)
		}
	}
}

func Test_Provider_Region_SetProperly(t *testing.T) {
	tfPath := synthStack(t, "staging")
	root := readTF(t, tfPath)
	prov := asMap(root["provider"])
	if prov == nil {
		t.Fatalf("provider block missing")
	}
	// provider.aws can be a list or map depending on emitter; handle common list form
	v := prov["aws"]
	switch vv := v.(type) {
	case []any:
		if len(vv) == 0 || asMap(vv[0])["region"] != "us-east-2" {
			t.Fatalf("aws provider region not set to us-east-2: %v", v)
		}
	case map[string]any:
		if vv["region"] != "us-east-2" {
			t.Fatalf("aws provider region not set to us-east-2: %v", v)
		}
	default:
		t.Fatalf("unexpected provider.aws type: %T", v)
	}
}

func Test_Environment_Specific_Configuration(t *testing.T) {
	tests := []struct {
		env             string
		expectedRegion  string
		expectedVPCCidr string
	}{
		{"dev", "us-east-1", "10.0.0.0/16"},
		{"staging", "us-east-2", "10.1.0.0/16"},
		{"prod", "us-west-1", "10.2.0.0/16"},
	}

	for _, tt := range tests {
		t.Run(tt.env, func(t *testing.T) {
			tfPath := synthStack(t, tt.env)
			root := readTF(t, tfPath)

			// Get the actual config to determine expected values
			cfg, err := GetConfig(tt.env)
			if err != nil {
				t.Fatalf("failed to get config: %v", err)
			}

			// Check provider region
			prov := asMap(root["provider"])
			if prov == nil {
				t.Fatalf("provider block missing")
			}
			v := prov["aws"]
			switch vv := v.(type) {
			case []any:
				if len(vv) == 0 || asMap(vv[0])["region"] != tt.expectedRegion {
					t.Fatalf("aws provider region not set to %s: %v", tt.expectedRegion, v)
				}
			case map[string]any:
				if vv["region"] != tt.expectedRegion {
					t.Fatalf("aws provider region not set to %s: %v", tt.expectedRegion, v)
				}
			}

			// Check VPC CIDR
			resources := asMap(root["resource"])
			vpc := asMap(asMap(resources["aws_vpc"])["MainVPC"])
			if vpc["cidr_block"] != tt.expectedVPCCidr {
				t.Fatalf("vpc cidr_block = %v, want %s", vpc["cidr_block"], tt.expectedVPCCidr)
			}

			// Check bucket name follows new pattern with dynamic suffix
			bucket := asMap(asMap(resources["aws_s3_bucket"])["LoggingBucket"])
			bucketName, ok := bucket["bucket"].(string)
			if !ok {
				t.Fatalf("bucket name is not a string: %v", bucket["bucket"])
			}
			expectedBucketPrefix := fmt.Sprintf("logs-%s-%s-", cfg.AccountID, cfg.Suffix)
			if !strings.HasPrefix(bucketName, expectedBucketPrefix) {
				t.Fatalf("bucket name = %v, want prefix %s", bucketName, expectedBucketPrefix)
			}
		})
	}
}

func Test_S3Policy_CrossAccountAccess(t *testing.T) {
	tfPath := synthStack(t, "dev")
	root := readTF(t, tfPath)
	resources := asMap(root["resource"])
	pol := asMap(asMap(resources["aws_iam_policy"])["S3CrossAccountPolicy"])
	policyStr, _ := pol["policy"].(string)
	if policyStr == "" {
		t.Fatalf("policy JSON missing")
	}
	var p map[string]any
	if err := json.Unmarshal([]byte(policyStr), &p); err != nil {
		t.Fatalf("policy JSON invalid: %v", err)
	}
	stmts, _ := p["Statement"].([]any)
	if len(stmts) == 0 {
		t.Fatalf("policy has no statements")
	}

	// Get the actual bucket names from the resources to validate policy references
	loggingBucket := asMap(asMap(resources["aws_s3_bucket"])["LoggingBucket"])
	replicationBucket := asMap(asMap(resources["aws_s3_bucket"])["ReplicationBucket"])
	loggingBucketName, _ := loggingBucket["bucket"].(string)
	replicationBucketName, _ := replicationBucket["bucket"].(string)

	var hasGetPut, hasListBucket bool
	for _, s := range stmts {
		sm := asMap(s)
		// actions
		var acts []string
		switch a := sm["Action"].(type) {
		case []any:
			for _, v := range a {
				if vv, ok := v.(string); ok {
					acts = append(acts, vv)
				}
			}
		case string:
			acts = []string{a}
		}
		// resources
		var res []string
		switch r := sm["Resource"].(type) {
		case []any:
			for _, v := range r {
				if vv, ok := v.(string); ok {
					res = append(res, vv)
				}
			}
		case string:
			res = []string{r}
		}
		// checks
		for _, a := range acts {
			if a == "s3:GetObject" || a == "s3:PutObject" || a == "s3:DeleteObject" {
				hasGetPut = true
				// ensure access is scoped to specific buckets (check for either bucket name)
				for _, r := range res {
					if !strings.Contains(r, loggingBucketName) && !strings.Contains(r, replicationBucketName) {
						t.Fatalf("S3 object actions should be scoped to specific buckets, got: %v, expected to contain %s or %s", res, loggingBucketName, replicationBucketName)
					}
				}
			}
			if a == "s3:ListBucket" {
				hasListBucket = true
				// ensure list is scoped to specific buckets (check for either bucket name)
				for _, r := range res {
					if !strings.Contains(r, loggingBucketName) && !strings.Contains(r, replicationBucketName) {
						t.Fatalf("S3 list actions should be scoped to specific buckets, got: %v, expected to contain %s or %s", res, loggingBucketName, replicationBucketName)
					}
				}
			}
		}
	}
	if !hasGetPut {
		t.Fatalf("missing s3 object permissions")
	}
	if !hasListBucket {
		t.Fatalf("missing s3 list permissions")
	}
}
