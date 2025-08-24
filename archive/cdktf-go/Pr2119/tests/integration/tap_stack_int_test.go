//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// This integration test runs a full synth and validates the generated Terraform plan JSON content and outputs structure.
// It does not call AWS APIs or run terraform apply.
func Test_Synth_EndToEndOutputsAndResources(t *testing.T) {
	// Use a deterministic outdir per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Region for provider and URL expectations
	_ = os.Setenv("AWS_REGION", "us-east-1")
	defer os.Unsetenv("AWS_REGION")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildServerlessImageStack(stack, "us-east-1")
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
	mustHave := []struct{ typeName, name string }{
		{"aws_s3_bucket", "ImageBucket"},
		{"aws_s3_bucket_public_access_block", "ImageBucketPublicAccessBlock"},
		{"aws_s3_bucket_versioning", "ImageBucketVersioning"},
		{"aws_s3_bucket_server_side_encryption_configuration", "ImageBucketEncryption"},
		{"aws_cloudwatch_log_group", "LambdaLogGroup"},
		{"aws_iam_role", "LambdaExecutionRole"},
		{"aws_iam_policy", "LambdaS3CloudWatchPolicy"},
		{"aws_iam_role_policy_attachment", "LambdaS3CloudWatchPolicyAttachment"},
		{"aws_lambda_function", "ImageThumbnailProcessor"},
		{"aws_lambda_permission", "S3InvokeLambdaPermission"},
		{"aws_s3_bucket_notification", "S3BucketNotification"},
	}
	for _, r := range mustHave {
		if _, ok := resource[r.typeName].(map[string]any)[r.name]; !ok {
			t.Fatalf("missing resource %s.%s", r.typeName, r.name)
		}
	}

	// Validate outputs present and have values/tokens
	out, ok := root["output"].(map[string]any)
	if !ok {
		t.Fatalf("output block missing")
	}
	for _, k := range []string{"bucket_name", "lambda_function_name", "lambda_function_arn"} {
		if _, ok := out[k].(map[string]any); !ok {
			t.Fatalf("missing output %s", k)
		}
	}
}
