//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Verifies real AWS resources exist after a live apply. Optional: runs only with LIVE_APPLY=1.
func Test_Live_Verify_ResourcesExist(t *testing.T) {
	if os.Getenv("LIVE_APPLY") != "1" {
		t.Skip("LIVE_APPLY != 1; skipping live resource verification test")
	}
	if _, err := exec.LookPath("terraform"); err != nil {
		t.Skip("terraform not found; skipping live resource verification test")
	}
	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("AWS_SECRET_ACCESS_KEY") == "" {
		t.Skip("AWS credentials not set; skipping live resource verification test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	_ = os.Setenv("AWS_REGION", "us-east-1")
	defer os.Unsetenv("AWS_REGION")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))
	BuildServerlessImageStack(stack, "us-east-1")
	app.Synth()

	stackDir := filepath.Join(outdir, "stacks", "TapStack")

	run := func(ctx context.Context, args ...string) ([]byte, error) {
		cmd := exec.CommandContext(ctx, "terraform", append([]string{"-chdir=" + stackDir}, args...)...)
		cmd.Env = os.Environ()
		return cmd.CombinedOutput()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
	defer cancel()

	if out, err := run(ctx, "init", "-input=false", "-no-color"); err != nil {
		t.Fatalf("terraform init failed: %v\n%s", err, string(out))
	}

	if out, err := run(ctx, "apply", "-input=false", "-auto-approve", "-no-color"); err != nil {
		t.Fatalf("terraform apply failed: %v\n%s", err, string(out))
	}
	// Always destroy at the end
	defer func() {
		if out, err := run(context.Background(), "destroy", "-auto-approve", "-no-color"); err != nil {
			t.Fatalf("terraform destroy failed: %v\n%s", err, string(out))
		}
	}()

	// Read outputs
	outJSON, err := run(ctx, "output", "-json")
	if err != nil {
		t.Fatalf("terraform output failed: %v", err)
	}
	var outputs map[string]struct{ Value any }
	if err := json.Unmarshal(outJSON, &outputs); err != nil {
		t.Fatalf("parse outputs json: %v", err)
	}
	bucketName, _ := outputs["bucket_name"].Value.(string)
	lambdaName, _ := outputs["lambda_function_name"].Value.(string)
	lambdaArn, _ := outputs["lambda_function_arn"].Value.(string)
	if bucketName == "" || lambdaName == "" || lambdaArn == "" {
		t.Fatalf("missing required outputs: bucket=%q name=%q arn=%q", bucketName, lambdaName, lambdaArn)
	}

	// AWS SDK clients
	cfg, err := awscfg.LoadDefaultConfig(ctx)
	if err != nil {
		t.Fatalf("load AWS config: %v", err)
	}
	s3c := s3.NewFromConfig(cfg)
	lambdac := lambda.NewFromConfig(cfg)
	logsc := cloudwatchlogs.NewFromConfig(cfg)

	// 1) S3 bucket exists
	if _, err := s3c.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &bucketName}); err != nil {
		t.Fatalf("S3 bucket not accessible: %v", err)
	}

	// 2) Lambda function exists
	gf, err := lambdac.GetFunction(ctx, &lambda.GetFunctionInput{FunctionName: &lambdaName})
	if err != nil {
		t.Fatalf("lambda GetFunction failed: %v", err)
	}
	if gf.Configuration == nil || gf.Configuration.FunctionName == nil || *gf.Configuration.FunctionName != lambdaName {
		t.Fatalf("unexpected lambda configuration: %+v", gf.Configuration)
	}

	// 3) CloudWatch log group exists (/aws/lambda/<name>)
	lgName := fmt.Sprintf("/aws/lambda/%s", lambdaName)
	lgr, err := logsc.DescribeLogGroups(ctx, &cloudwatchlogs.DescribeLogGroupsInput{LogGroupNamePrefix: &lgName})
	if err != nil {
		t.Fatalf("DescribeLogGroups failed: %v", err)
	}
	found := false
	for _, lg := range lgr.LogGroups {
		if lg.LogGroupName != nil && *lg.LogGroupName == lgName {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("log group %s not found", lgName)
	}

	// 4) S3 -> Lambda notification configured
	notif, err := s3c.GetBucketNotificationConfiguration(ctx, &s3.GetBucketNotificationConfigurationInput{Bucket: &bucketName})
	if err != nil {
		t.Fatalf("GetBucketNotificationConfiguration failed: %v", err)
	}
	if len(notif.LambdaFunctionConfigurations) == 0 {
		t.Fatalf("no LambdaFunctionConfigurations on bucket notification")
	}
	hasMatch := false
	for _, c := range notif.LambdaFunctionConfigurations {
		if c.LambdaFunctionArn != nil && *c.LambdaFunctionArn == lambdaArn {
			hasMatch = true
			break
		}
	}
	if !hasMatch {
		t.Fatalf("no bucket notification targets match lambda arn %s", lambdaArn)
	}
}
