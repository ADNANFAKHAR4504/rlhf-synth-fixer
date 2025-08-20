package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSynthEnsuresServerlessResources asserts key resources appear in synthesized JSON
func TestSynthEnsuresServerlessResources(t *testing.T) {
	os.Setenv("AWS_REGION", "us-east-1")
	app := BuildApp()

	// synth with default outdir (cdktf.out)
	app.Synth()

	tfjson := filepath.Join("cdktf.out", "stacks", "TapStack", "cdk.tf.json")
	data, err := os.ReadFile(tfjson)
	if err != nil {
		t.Fatalf("failed reading synthesized file: %v", err)
	}
	content := string(data)

	// Expect resource types present
	mustContainStr(t, content, "aws_s3_bucket")
	mustContainStr(t, content, "aws_s3_bucket_versioning")
	mustContainStr(t, content, "aws_s3_bucket_public_access_block")
	mustContainStr(t, content, "aws_s3_bucket_server_side_encryption_configuration")
	mustContainStr(t, content, "aws_cloudwatch_log_group")
	mustContainStr(t, content, "aws_iam_role")
	mustContainStr(t, content, "aws_iam_policy")
	mustContainStr(t, content, "aws_iam_role_policy_attachment")
	mustContainStr(t, content, "aws_lambda_function")
	mustContainStr(t, content, "aws_lambda_permission")
	mustContainStr(t, content, "aws_s3_bucket_notification")
}

func mustContainStr(t *testing.T, s, needle string) {
	t.Helper()
	if !strings.Contains(s, needle) {
		t.Fatalf("expected synthesized plan to contain %q", needle)
	}
}
