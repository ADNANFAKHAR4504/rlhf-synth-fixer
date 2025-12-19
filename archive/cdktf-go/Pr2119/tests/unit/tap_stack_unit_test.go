//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildServerlessImageStack(stack, region)
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
	if prefix, ok := s3bucket["bucket_prefix"].(string); !ok || !strings.HasPrefix(prefix, "serverless-image-processing") {
		t.Fatalf("bucket_prefix must start with serverless-image-processing, got %v", s3bucket["bucket_prefix"])
	}
	if got := s3bucket["force_destroy"]; got != true {
		t.Fatalf("force_destroy = %v, want true", got)
	}

	// Versioning
	ver := asMap(asMap(resources["aws_s3_bucket_versioning"])["ImageBucketVersioning"])
	if ver == nil {
		t.Fatalf("aws_s3_bucket_versioning.ImageBucketVersioning missing")
	}
	vcVal := ver["versioning_configuration"]
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
	if name, ok := lg["name"].(string); !ok || !strings.HasPrefix(name, "/aws/lambda/image-thumbnail-processor") {
		t.Fatalf("log group name must start with /aws/lambda/image-thumbnail-processor, got %v", lg["name"])
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

func Test_IAMPolicy_LeastPrivilegeJSON(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)
	resources := asMap(root["resource"])
	pol := asMap(asMap(resources["aws_iam_policy"])["LambdaS3CloudWatchPolicy"])
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
	var hasGet, hasPut, logsScoped bool
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
			if a == "s3:GetObject" || a == "s3:GetObjectVersion" {
				hasGet = true
			}
			if a == "s3:PutObject" || a == "s3:PutObjectAcl" {
				hasPut = true
				// ensure put is restricted to thumbnails/ or errors/
				okPrefix := false
				for _, r := range res {
					if strings.Contains(r, "/thumbnails/*") || strings.Contains(r, "/errors/*") {
						okPrefix = true
					}
				}
				if !okPrefix {
					t.Fatalf("Put actions are not restricted to thumbnails/ or errors/: %v", res)
				}
			}
			if a == "logs:CreateLogStream" || a == "logs:PutLogEvents" {
				// ensure not wildcard across all logs
				for _, r := range res {
					if r == "*" || strings.HasPrefix(r, "arn:aws:logs:*") {
						t.Fatalf("logs permissions are too broad: %v", res)
					} else {
						logsScoped = true
					}
				}
			}
		}
	}
	if !hasGet {
		t.Fatalf("missing s3 get permissions")
	}
	if !hasPut {
		t.Fatalf("missing s3 put permissions")
	}
	if !logsScoped {
		t.Fatalf("logs permissions not scoped to log group")
	}
}

func Test_Provider_Region_SetProperly(t *testing.T) {
	tfPath := synthStack(t, "eu-west-1")
	root := readTF(t, tfPath)
	prov := asMap(root["provider"])
	if prov == nil {
		t.Fatalf("provider block missing")
	}
	// provider.aws can be a list or map depending on emitter; handle common list form
	v := prov["aws"]
	switch vv := v.(type) {
	case []any:
		if len(vv) == 0 || asMap(vv[0])["region"] != "eu-west-1" {
			t.Fatalf("aws provider region not set to eu-west-1: %v", v)
		}
	case map[string]any:
		if vv["region"] != "eu-west-1" {
			t.Fatalf("aws provider region not set to eu-west-1: %v", v)
		}
	default:
		t.Fatalf("unexpected provider.aws type: %T", v)
	}
}

func Test_Names_With_Suffix(t *testing.T) {
	old := os.Getenv("NAME_SUFFIX")
	t.Cleanup(func() { _ = os.Setenv("NAME_SUFFIX", old) })
	_ = os.Setenv("NAME_SUFFIX", "test")

	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)
	resources := asMap(root["resource"])

	fn := asMap(asMap(resources["aws_lambda_function"])["ImageThumbnailProcessor"])
	if fn["function_name"] != "image-thumbnail-processor-test" {
		t.Fatalf("function_name = %v, want image-thumbnail-processor-test", fn["function_name"])
	}
	role := asMap(asMap(resources["aws_iam_role"])["LambdaExecutionRole"])
	if role["name"] != "image-thumbnail-processor-role-test" {
		t.Fatalf("role name = %v, want image-thumbnail-processor-role-test", role["name"])
	}
	lg := asMap(asMap(resources["aws_cloudwatch_log_group"])["LambdaLogGroup"])
	name, _ := lg["name"].(string)
	if !strings.HasSuffix(name, "image-thumbnail-processor-test") {
		t.Fatalf("log group name should include suffix, got %v", name)
	}
}

func Test_Lambda_Settings_SourceCodeHash_Concurrency(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)
	resources := asMap(root["resource"])
	fn := asMap(asMap(resources["aws_lambda_function"])["ImageThumbnailProcessor"])
	if fn["source_code_hash"] == nil {
		t.Fatalf("source_code_hash missing")
	}
	if fn["reserved_concurrent_executions"] != float64(10) {
		t.Fatalf("reserved_concurrent_executions = %v, want 10", fn["reserved_concurrent_executions"])
	}
	if fn["memory_size"] != float64(256) {
		t.Fatalf("memory_size = %v, want 256", fn["memory_size"])
	}
}
