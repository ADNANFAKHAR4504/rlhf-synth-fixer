//go:build integration
// +build integration

package integration

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	awscdktf "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	s3 "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	s3pab "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	s3ver "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	awscdktf "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	s3 "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	s3pab "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	s3ver "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
)

// Helper to create *string
func str(v string) *string { return &v }

// BuildSimpleS3Stack constructs the stack (reusable in unit/integration tests)
func BuildSimpleS3Stack(app cdktf.App, region string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(app, str("TapStack"))

	// Provider setup
	awscdktf.NewAwsProvider(stack, str("aws"), &awscdktf.AwsProviderConfig{
		Region: &region,
	})

	// Optional suffix to avoid collisions
	suffix := os.Getenv("NAME_SUFFIX")

	// Create S3 bucket
	bucket := s3.NewS3Bucket(stack, str("MySimpleBucket"), &s3.S3BucketConfig{
		BucketPrefix: str(fmt.Sprintf("my-simple-bucket-%s", suffix)),
		ForceDestroy: jsii.Bool(true), // allow destroy even if non-empty
		Tags: &map[string]*string{
			"Name":        str(fmt.Sprintf("MySimpleBucket-%s", suffix)),
			"Environment": str("Dev"),
		},
	})

	// Add versioning
	s3ver.NewS3BucketVersioningA(stack, str("MySimpleBucketVersioning"), &s3ver.S3BucketVersioningAConfig{
		Bucket: bucket.Id(),
		VersioningConfiguration: &s3ver.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Block public access
	s3pab.NewS3BucketPublicAccessBlock(stack, str("MySimpleBucketPAB"), &s3pab.S3BucketPublicAccessBlockConfig{
		Bucket:                bucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Output bucket name
	cdktf.NewTerraformOutput(stack, str("bucket_name"), &cdktf.TerraformOutputConfig{
		Value: bucket.Id(),
	})

	return stack
}

// This integration test runs a full synth and validates the generated Terraform plan JSON content.
// It ensures the expected bucket + related resources are present, but does not call AWS APIs or run terraform apply.
func Test_Synth_EndToEnd_BucketResourcesAndOutputs(t *testing.T) {
	// Use a deterministic outdir per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Region for provider
	_ = os.Setenv("AWS_REGION", "us-east-1")
	defer os.Unsetenv("AWS_REGION")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	region := "us-east-1"
	awscdktf.NewAwsProvider(stack, jsii.String("aws"), &awscdktf.AwsProviderConfig{Region: &region})

	suffix := os.Getenv("NAME_SUFFIX")

	bucket := s3.NewS3Bucket(stack, jsii.String("MySimpleBucket"), &s3.S3BucketConfig{
		BucketPrefix: jsii.String(fmt.Sprintf("my-simple-bucket-%s", suffix)),
		ForceDestroy: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("MySimpleBucket-%s", suffix)),
			"Environment": jsii.String("Dev"),
		},
	})

	s3ver.NewS3BucketVersioningA(stack, jsii.String("MySimpleBucketVersioning"), &s3ver.S3BucketVersioningAConfig{
		Bucket:                  bucket.Id(),
		VersioningConfiguration: &s3ver.S3BucketVersioningVersioningConfiguration{Status: jsii.String("Enabled")},
	})

	s3pab.NewS3BucketPublicAccessBlock(stack, jsii.String("MySimpleBucketPAB"), &s3pab.S3BucketPublicAccessBlockConfig{
		Bucket:                bucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("bucket_name"), &cdktf.TerraformOutputConfig{Value: bucket.Id()})

	app.Synth()

	// Load synthesized Terraform JSON
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
		{"aws_s3_bucket", "MySimpleBucket"},
		{"aws_s3_bucket_versioning", "MySimpleBucketVersioning"},
		{"aws_s3_bucket_public_access_block", "MySimpleBucketPAB"},
	}
	for _, r := range mustHave {
		if _, ok := resource[r.typeName].(map[string]any)[r.name]; !ok {
			t.Fatalf("missing resource %s.%s", r.typeName, r.name)
		}
	}

	// Validate outputs present
	out, ok := root["output"].(map[string]any)
	if !ok {
		t.Fatalf("output block missing")
	}
	if _, ok := out["bucket_name"].(map[string]any); !ok {
		t.Fatalf("missing output bucket_name")
	}
}
