package main

import (
	"fmt"
	"os"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	awscdktf "github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	s3 "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	s3pab "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketpublicaccessblock"
	s3ver "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketversioning"
)

// Helper to create *string
func str(v string) *string { return &v }

// Entrypoint
func main() {
	app := cdktf.NewApp(nil)
	stack := cdktf.NewTerraformStack(app, str("TapStack"))

	// Pick AWS region (fallback = us-east-1)
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

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

	app.Synth()
}
