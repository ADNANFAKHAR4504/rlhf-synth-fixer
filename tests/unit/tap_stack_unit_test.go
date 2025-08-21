//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// synthStack writes the synthesized Terraform JSON to a temp dir and returns its path
func synthStack(t *testing.T, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	t.Cleanup(func() { _ = os.Chdir(cwd) })
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("chdir temp: %v", err)
	}

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := BuildApp()
	// This generates cdktf.out/stacks/TapStack/cdk.tf.json under tmpDir
	app.Synth()
	tfPath := filepath.Join(tmpDir, "cdktf.out", "stacks", "TapStack", "cdk.tf.json")
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

func Test_Synth_ResourcesPresentAndConfigured(t *testing.T) {
	tfPath := synthStack(t, "us-west-2")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// S3 bucket
	s3bucket := asMap(asMap(resources["aws_s3_bucket"])["ImageBucket"])
	if s3bucket == nil {
		t.Fatalf("aws_s3_bucket.ImageBucket missing")
	}
	if got := s3bucket["bucket_prefix"]; got != "serverless-image-processing" {
		t.Fatalf("bucket_prefix = %v, want serverless-image-processing", got)
	}
	if got := s3bucket["force_destroy"]; got != true {
		t.Fatalf("force_destroy = %v, want true", got)
	}

	// Versioning
	ver := asMap(asMap(resources["aws_s3_bucket_versioning"])["ImageBucketVersioning"])
	if ver == nil {
		t.Fatalf("aws_s3_bucket_versioning.ImageBucketVersioning missing")
	}
	if vc, ok := ver["versioning_configuration"].([]any); !ok || len(vc) == 0 || asMap(vc[0])["status"] != "Enabled" {
		t.Fatalf("versioning_configuration missing or status != Enabled: %v", ver["versioning_configuration"])
	}

	// Public access block
	pab := asMap(asMap(resources["aws_s3_bucket_public_access_block"])["ImageBucketPublicAccessBlock"])
	if pab == nil {
		t.Fatalf("aws_s3_bucket_public_access_block.ImageBucketPublicAccessBlock missing")
	}
	for _, k := range []string{"block_public_acls", "block_public_policy", "ignore_public_acls", "restrict_public_buckets"} {
		if pab[k] != true {
			t.Fatalf("%s must be true", k)
		}
	}

	// SSE
	sse := asMap(asMap(resources["aws_s3_bucket_server_side_encryption_configuration"])["ImageBucketEncryption"])
	if sse == nil {
		t.Fatalf("aws_s3_bucket_server_side_encryption_configuration.ImageBucketEncryption missing")
	}
	rule, ok := sse["rule"].([]any)
	if !ok || len(rule) == 0 {
		t.Fatalf("sse rule missing: %v", sse["rule"])
	}
	apply := asMap(asMap(rule[0])["apply_server_side_encryption_by_default"])
	if apply == nil || apply["sse_algorithm"] != "AES256" {
		t.Fatalf("sse_algorithm must be AES256, got: %v", apply)
	}

	// IAM Role + Policy + Attachment
	role := asMap(asMap(resources["aws_iam_role"])["LambdaExecutionRole"])
	if role == nil {
		t.Fatalf("aws_iam_role.LambdaExecutionRole missing")
	}
	assume, _ := role["assume_role_policy"].(string)
	if !strings.Contains(assume, "lambda.amazonaws.com") {
		t.Fatalf("assume_role_policy must mention lambda.amazonaws.com, got: %s", assume)
	}
	pol := asMap(asMap(resources["aws_iam_policy"])["LambdaS3CloudWatchPolicy"])
	if pol == nil {
		t.Fatalf("aws_iam_policy.LambdaS3CloudWatchPolicy missing")
	}
	if _, ok := pol["policy"].(string); !ok {
		t.Fatalf("policy must be a JSON string")
	}
	attach := asMap(asMap(resources["aws_iam_role_policy_attachment"])["LambdaS3CloudWatchPolicyAttachment"])
	if attach == nil {
		t.Fatalf("aws_iam_role_policy_attachment.LambdaS3CloudWatchPolicyAttachment missing")
	}

	// Log group
	lg := asMap(asMap(resources["aws_cloudwatch_log_group"])["LambdaLogGroup"])
	if lg == nil {
		t.Fatalf("aws_cloudwatch_log_group.LambdaLogGroup missing")
	}
	if lg["name"] != "/aws/lambda/image-thumbnail-processor" {
		t.Fatalf("log group name = %v, want /aws/lambda/image-thumbnail-processor", lg["name"])
	}
	if lg["retention_in_days"] != float64(30) { // JSON numbers decode as float64
		t.Fatalf("retention_in_days = %v, want 30", lg["retention_in_days"])
	}

	// Lambda function
	fn := asMap(asMap(resources["aws_lambda_function"])["ImageThumbnailProcessor"])
	if fn == nil {
		t.Fatalf("aws_lambda_function.ImageThumbnailProcessor missing")
	}
	if fn["runtime"] != "python3.12" {
		t.Fatalf("runtime = %v, want python3.12", fn["runtime"])
	}
	if fn["handler"] != "lambda_function.lambda_handler" {
		t.Fatalf("handler = %v, want lambda_function.lambda_handler", fn["handler"])
	}
	if env := asMap(asMap(fn["environment"])["variables"]); env == nil {
		t.Fatalf("lambda environment variables missing")
	} else {
		// Key presence only; values may be tokens
		for _, k := range []string{"BUCKET_NAME", "PROCESSOR_TYPE", "MAX_FILE_SIZE", "LOG_LEVEL"} {
			if _, ok := env[k]; !ok {
				t.Fatalf("lambda env %s missing", k)
			}
		}
	}

	// Lambda permission
	perm := asMap(asMap(resources["aws_lambda_permission"])["S3InvokeLambdaPermission"])
	if perm == nil {
		t.Fatalf("aws_lambda_permission.S3InvokeLambdaPermission missing")
	}
	if perm["principal"] != "s3.amazonaws.com" {
		t.Fatalf("principal = %v, want s3.amazonaws.com", perm["principal"])
	}

	// S3 bucket notification with lambda trigger
	notif := asMap(asMap(resources["aws_s3_bucket_notification"])["S3BucketNotification"])
	if notif == nil {
		t.Fatalf("aws_s3_bucket_notification.S3BucketNotification missing")
	}
	lf, ok := notif["lambda_function"].([]any)
	if !ok || len(lf) == 0 {
		t.Fatalf("lambda_function notification missing: %v", notif["lambda_function"])
	}
	if events := asMap(lf[0])["events"]; events == nil {
		t.Fatalf("notification events missing")
	}
}

func Test_Synth_OutputsPresent(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)
	out := asMap(root["output"])
	if out == nil {
		t.Fatalf("output block missing")
	}
	for _, k := range []string{"bucket_name", "lambda_function_name", "lambda_function_arn"} {
		if asMap(out[k]) == nil {
			t.Fatalf("output %s missing", k)
		}
	}
}
