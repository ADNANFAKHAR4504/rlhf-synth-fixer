package main

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack and returns the tf json path
func synthStack(t *testing.T, region string) string {
	t.Helper()
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("SimpleS3Stack"))
	BuildSimpleS3Stack(stack, region) // 👈 new function
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "SimpleS3Stack", "cdk.tf.json")
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

func Test_Synth_S3BucketPresent(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// S3 bucket
	s3bucket := asMap(asMap(resources["aws_s3_bucket"])["MySimpleBucket"])
	if s3bucket == nil {
		t.Fatalf("aws_s3_bucket.MySimpleBucket missing")
	}
	if prefix, ok := s3bucket["bucket_prefix"].(string); !ok || !strings.HasPrefix(prefix, "my-simple-bucket") {
		t.Fatalf("bucket_prefix must start with my-simple-bucket, got %v", s3bucket["bucket_prefix"])
	}
	if got := s3bucket["force_destroy"]; got != true {
		t.Fatalf("force_destroy = %v, want true", got)
	}

	// Versioning
	ver := asMap(asMap(resources["aws_s3_bucket_versioning"])["MySimpleBucketVersioning"])
	if ver == nil {
		t.Fatalf("aws_s3_bucket_versioning.MySimpleBucketVersioning missing")
	}

	// Public Access Block
	pab := asMap(asMap(resources["aws_s3_bucket_public_access_block"])["MySimpleBucketPAB"])
	if pab == nil {
		t.Fatalf("aws_s3_bucket_public_access_block.MySimpleBucketPAB missing")
	}
}

func Test_Synth_OutputPresent(t *testing.T) {
	tfPath := synthStack(t, "us-east-1")
	root := readTF(t, tfPath)
	out := asMap(root["output"])
	if out == nil {
		t.Fatalf("output block missing")
	}
	if asMap(out["bucket_name"]) == nil {
		t.Fatalf("output bucket_name missing")
	}
}

func Test_Main_SynthesizesTapStack(t *testing.T) {
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", "us-east-1")

	main()

	rootOut := filepath.Join("..", "cdktf.out")
	tfPath := filepath.Join(rootOut, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
}
