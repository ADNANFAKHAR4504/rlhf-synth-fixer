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

	awscdktf "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	s3 "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	s3pab "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	s3ver "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
)

func Test_Synth_TapStackExists(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", "us-east-1")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	_ = cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
}

// synthStackFull mirrors the resources in tap_stack.go and returns the tf json path
func synthStackFull(t *testing.T, region string) string {
	t.Helper()
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	if region == "" {
		if env := os.Getenv("AWS_REGION"); env != "" {
			region = env
		} else {
			region = "us-east-1"
		}
	}

	// Provider
	awscdktf.NewAwsProvider(stack, jsii.String("aws"), &awscdktf.AwsProviderConfig{Region: &region})

	suffix := os.Getenv("NAME_SUFFIX")

	// Bucket
	bucket := s3.NewS3Bucket(stack, jsii.String("MySimpleBucket"), &s3.S3BucketConfig{
		BucketPrefix: jsii.String(fmt.Sprintf("my-simple-bucket-%s", suffix)),
		ForceDestroy: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("MySimpleBucket-%s", suffix)),
			"Environment": jsii.String("Dev"),
		},
	})

	// Versioning
	s3ver.NewS3BucketVersioningA(stack, jsii.String("MySimpleBucketVersioning"), &s3ver.S3BucketVersioningAConfig{
		Bucket:                  bucket.Id(),
		VersioningConfiguration: &s3ver.S3BucketVersioningVersioningConfiguration{Status: jsii.String("Enabled")},
	})

	// Public Access Block
	s3pab.NewS3BucketPublicAccessBlock(stack, jsii.String("MySimpleBucketPAB"), &s3pab.S3BucketPublicAccessBlockConfig{
		Bucket:                bucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Output
	cdktf.NewTerraformOutput(stack, jsii.String("bucket_name"), &cdktf.TerraformOutputConfig{Value: bucket.Id()})

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

func Test_Synth_S3BucketPresent(t *testing.T) {
	tfPath := synthStackFull(t, "us-east-1")
	root := readTF(t, tfPath)

	resources := asMap(root["resource"])
	if resources == nil {
		t.Fatalf("resource block missing")
	}

	// S3 bucket exists and has expected fields
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

	// Versioning exists
	ver := asMap(asMap(resources["aws_s3_bucket_versioning"])["MySimpleBucketVersioning"])
	if ver == nil {
		t.Fatalf("aws_s3_bucket_versioning.MySimpleBucketVersioning missing")
	}

	// Public Access Block exists
	pab := asMap(asMap(resources["aws_s3_bucket_public_access_block"])["MySimpleBucketPAB"])
	if pab == nil {
		t.Fatalf("aws_s3_bucket_public_access_block.MySimpleBucketPAB missing")
	}
}

func Test_Synth_OutputPresent(t *testing.T) {
	tfPath := synthStackFull(t, "us-east-1")
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
