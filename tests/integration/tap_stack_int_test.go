//go:build integration
// +build integration

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

// This integration test runs a full synth and validates the generated Terraform plan JSON content and outputs structure.
// It does not call AWS APIs or run terraform apply.
func Test_Synth_EndToEndInfrastructureAndOutputs(t *testing.T) {
	// Use a deterministic outdir per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Environment for provider and configuration expectations
	_ = os.Setenv("ENVIRONMENT", "dev")
	defer os.Unsetenv("ENVIRONMENT")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	cfg, err := GetConfig("dev")
	if err != nil {
		t.Fatalf("failed to get config: %v", err)
	}

	BuildInfrastructureStack(stack, cfg)
	app.Synth()

	// Load synthesized Terraform json
	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("read tf json: %v", err)
	}
	var root map[string]any
	if err := json.Unmarshal(data, &root); err != nil {
		t.Fatalf("unmarshal tf json: %v", err)
	}

	// Validate resources present
	resource, ok := root["resource"].(map[string]any)
	if !ok {
		t.Fatalf("resource block missing")
	}

	// VPC Infrastructure
	mustHaveVPC := []struct{ typeName, name string }{
		{"aws_vpc", "MainVPC"},
		{"aws_internet_gateway", "InternetGateway"},
		{"aws_subnet", "PublicSubnet0"},
		{"aws_subnet", "PublicSubnet1"},
		{"aws_subnet", "PrivateSubnet0"},
		{"aws_subnet", "PrivateSubnet1"},
		{"aws_eip", "NatEIP0"},
		{"aws_eip", "NatEIP1"},
		{"aws_nat_gateway", "NatGateway0"},
		{"aws_nat_gateway", "NatGateway1"},
		{"aws_route_table", "PublicRouteTable"},
		{"aws_route_table", "PrivateRouteTable0"},
		{"aws_route_table", "PrivateRouteTable1"},
		{"aws_route", "PublicRoute"},
		{"aws_route", "PrivateRoute0"},
		{"aws_route", "PrivateRoute1"},
		{"aws_route_table_association", "PublicRouteTableAssociation0"},
		{"aws_route_table_association", "PublicRouteTableAssociation1"},
		{"aws_route_table_association", "PrivateRouteTableAssociation0"},
		{"aws_route_table_association", "PrivateRouteTableAssociation1"},
	}

	// IAM Infrastructure
	mustHaveIAM := []struct{ typeName, name string }{
		{"aws_iam_role", "EC2Role"},
		{"aws_iam_role", "LambdaRole"},
		{"aws_iam_policy", "S3CrossAccountPolicy"},
		{"aws_iam_role_policy_attachment", "EC2SSMPolicy"},
		{"aws_iam_role_policy_attachment", "LambdaBasicPolicy"},
		{"aws_iam_role_policy_attachment", "EC2S3PolicyAttachment"},
		{"aws_iam_role_policy_attachment", "LambdaS3PolicyAttachment"},
	}

	// S3 Infrastructure
	mustHaveS3 := []struct{ typeName, name string }{
		{"aws_s3_bucket", "LoggingBucket"},
		{"aws_s3_bucket", "ReplicationBucket"},
		{"aws_s3_bucket_versioning", "LoggingBucketVersioning"},
		{"aws_s3_bucket_versioning", "ReplicationBucketVersioning"},
		{"aws_s3_bucket_server_side_encryption_configuration", "LoggingBucketEncryption"},
		{"aws_s3_bucket_server_side_encryption_configuration", "ReplicationBucketEncryption"},
		{"aws_s3_bucket_public_access_block", "LoggingBucketPAB"},
		{"aws_s3_bucket_public_access_block", "ReplicationBucketPAB"},
		{"aws_s3_bucket_policy", "LoggingBucketPolicy"},
	}

	allMustHave := append(mustHaveVPC, mustHaveIAM...)
	allMustHave = append(allMustHave, mustHaveS3...)

	for _, r := range allMustHave {
		if _, ok := resource[r.typeName].(map[string]any)[r.name]; !ok {
			t.Fatalf("missing resource %s.%s", r.typeName, r.name)
		}
	}

	// Validate outputs present and have values/tokens
	out, ok := root["output"].(map[string]any)
	if !ok {
		t.Fatalf("output block missing")
	}
	expectedOutputs := []string{
		"vpc_id", "public_subnet_ids", "private_subnet_ids",
		"logging_bucket_name", "replication_bucket_name",
		"ec2_role_arn", "lambda_role_arn",
	}
	for _, k := range expectedOutputs {
		if _, ok := out[k].(map[string]any); !ok {
			t.Fatalf("missing output %s", k)
		}
	}
}

func Test_Synth_MultiEnvironment_ConfigurationDifferences(t *testing.T) {
	environments := []struct {
		env             string
		expectedRegion  string
		expectedVPCCidr string
	}{
		{"dev", "us-east-1", "10.0.0.0/16"},
		{"staging", "us-east-2", "10.1.0.0/16"},
		{"prod", "us-west-1", "10.2.0.0/16"},
	}

	for _, env := range environments {
		t.Run(env.env, func(t *testing.T) {
			tmpDir := t.TempDir()
			outdir := filepath.Join(tmpDir, "cdktf.out")

			_ = os.Setenv("ENVIRONMENT", env.env)
			defer os.Unsetenv("ENVIRONMENT")

			app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
			stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

			cfg, err := GetConfig(env.env)
			if err != nil {
				t.Fatalf("failed to get config: %v", err)
			}

			BuildInfrastructureStack(stack, cfg)
			app.Synth()

			tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
			data, err := os.ReadFile(tfPath)
			if err != nil {
				t.Fatalf("read tf json: %v", err)
			}
			var root map[string]any
			if err := json.Unmarshal(data, &root); err != nil {
				t.Fatalf("unmarshal tf json: %v", err)
			}

			// Validate provider region
			prov := root["provider"].(map[string]any)
			awsProv := prov["aws"]
			switch v := awsProv.(type) {
			case []any:
				if len(v) == 0 {
					t.Fatalf("aws provider config missing")
				}
				provConfig := v[0].(map[string]any)
				if provConfig["region"] != env.expectedRegion {
					t.Fatalf("provider region = %v, want %s", provConfig["region"], env.expectedRegion)
				}
			case map[string]any:
				if v["region"] != env.expectedRegion {
					t.Fatalf("provider region = %v, want %s", v["region"], env.expectedRegion)
				}
			}

			// Validate VPC CIDR
			resources := root["resource"].(map[string]any)
			vpc := resources["aws_vpc"].(map[string]any)["MainVPC"].(map[string]any)
			if vpc["cidr_block"] != env.expectedVPCCidr {
				t.Fatalf("vpc cidr = %v, want %s", vpc["cidr_block"], env.expectedVPCCidr)
			}

			// Get the actual config to determine expected values
			cfg, configErr := GetConfig(env.env)
			if configErr != nil {
				t.Fatalf("failed to get config: %v", configErr)
			}

			// Validate bucket names follow new pattern with dynamic suffix
			loggingBucket := resources["aws_s3_bucket"].(map[string]any)["LoggingBucket"].(map[string]any)
			bucketName, ok := loggingBucket["bucket"].(string)
			if !ok {
				t.Fatalf("bucket name is not a string: %v", loggingBucket["bucket"])
			}
			expectedBucketPrefix := fmt.Sprintf("logs-%s-%s-", cfg.AccountID, cfg.Suffix)
			if !strings.HasPrefix(bucketName, expectedBucketPrefix) {
				t.Fatalf("logging bucket = %v, want prefix %s", bucketName, expectedBucketPrefix)
			}

			// Validate role names contain environment prefix and random suffix
			ec2Role := resources["aws_iam_role"].(map[string]any)["EC2Role"].(map[string]any)
			ec2RoleName, ok := ec2Role["name"].(string)
			if !ok {
				t.Fatalf("ec2 role name is not a string: %v", ec2Role["name"])
			}
			expectedRolePrefix := fmt.Sprintf("%s-", cfg.Suffix)
			if !strings.HasPrefix(ec2RoleName, expectedRolePrefix) || !strings.HasSuffix(ec2RoleName, "-ec2-role") {
				t.Fatalf("ec2 role name = %v, want prefix %s and suffix -ec2-role", ec2RoleName, expectedRolePrefix)
			}

			lambdaRole := resources["aws_iam_role"].(map[string]any)["LambdaRole"].(map[string]any)
			lambdaRoleName, ok := lambdaRole["name"].(string)
			if !ok {
				t.Fatalf("lambda role name is not a string: %v", lambdaRole["name"])
			}
			if !strings.HasPrefix(lambdaRoleName, expectedRolePrefix) || !strings.HasSuffix(lambdaRoleName, "-lambda-role") {
				t.Fatalf("lambda role name = %v, want prefix %s and suffix -lambda-role", lambdaRoleName, expectedRolePrefix)
			}
		})
	}
}
