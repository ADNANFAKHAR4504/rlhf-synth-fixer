//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// Verifies real AWS resources exist after a live apply. Optional: runs only with LIVE_APPLY=1.
func Test_Live_Verify_InfrastructureResourcesExist(t *testing.T) {
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

	stackDir := filepath.Join(outdir, "stacks", "TapStack")

	run := func(ctx context.Context, args ...string) ([]byte, error) {
		cmd := exec.CommandContext(ctx, "terraform", append([]string{"-chdir=" + stackDir}, args...)...)
		cmd.Env = os.Environ()
		return cmd.CombinedOutput()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Minute)
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

	vpcID, _ := outputs["vpc_id"].Value.(string)
	loggingBucketName, _ := outputs["logging_bucket_name"].Value.(string)
	replicationBucketName, _ := outputs["replication_bucket_name"].Value.(string)
	ec2RoleArn, _ := outputs["ec2_role_arn"].Value.(string)
	lambdaRoleArn, _ := outputs["lambda_role_arn"].Value.(string)

	if vpcID == "" || loggingBucketName == "" || replicationBucketName == "" || ec2RoleArn == "" || lambdaRoleArn == "" {
		t.Fatalf("missing required outputs: vpc=%q logging=%q replication=%q ec2role=%q lambdarole=%q",
			vpcID, loggingBucketName, replicationBucketName, ec2RoleArn, lambdaRoleArn)
	}

	// AWS SDK clients
	awsCfg, err := awscfg.LoadDefaultConfig(ctx)
	if err != nil {
		t.Fatalf("load AWS config: %v", err)
	}
	ec2Client := ec2.NewFromConfig(awsCfg)
	s3Client := s3.NewFromConfig(awsCfg)
	iamClient := iam.NewFromConfig(awsCfg)

	// 1) VPC exists
	vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcID},
	})
	if err != nil {
		t.Fatalf("VPC describe failed: %v", err)
	}
	if len(vpcResp.Vpcs) == 0 {
		t.Fatalf("VPC %s not found", vpcID)
	}
	vpc := vpcResp.Vpcs[0]
	if *vpc.CidrBlock != "10.0.0.0/16" {
		t.Fatalf("VPC CIDR = %s, want 10.0.0.0/16", *vpc.CidrBlock)
	}

	// 2) Subnets exist
	subnetResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		Filters: []ec2types.Filter{
			{
				Name:   awsString("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("Subnets describe failed: %v", err)
	}
	if len(subnetResp.Subnets) < 4 { // 2 public + 2 private
		t.Fatalf("Expected at least 4 subnets, got %d", len(subnetResp.Subnets))
	}

	// 3) Internet Gateway exists
	igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		Filters: []ec2types.Filter{
			{
				Name:   awsString("attachment.vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("Internet Gateway describe failed: %v", err)
	}
	if len(igwResp.InternetGateways) == 0 {
		t.Fatalf("No Internet Gateway found for VPC %s", vpcID)
	}

	// 4) NAT Gateways exist
	natResp, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
		Filter: []ec2types.Filter{
			{
				Name:   awsString("vpc-id"),
				Values: []string{vpcID},
			},
		},
	})
	if err != nil {
		t.Fatalf("NAT Gateways describe failed: %v", err)
	}
	if len(natResp.NatGateways) < 2 {
		t.Fatalf("Expected at least 2 NAT Gateways, got %d", len(natResp.NatGateways))
	}

	// 5) S3 buckets exist
	if _, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &loggingBucketName}); err != nil {
		t.Fatalf("Logging S3 bucket not accessible: %v", err)
	}

	if _, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: &replicationBucketName}); err != nil {
		t.Fatalf("Replication S3 bucket not accessible: %v", err)
	}

	// 6) S3 bucket versioning enabled
	loggingVersioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: &loggingBucketName,
	})
	if err != nil {
		t.Fatalf("Get bucket versioning failed: %v", err)
	}
	if loggingVersioning.Status != s3types.BucketVersioningStatusEnabled {
		t.Fatalf("Logging bucket versioning = %v, want Enabled", loggingVersioning.Status)
	}

	// 7) S3 bucket encryption enabled
	loggingEncryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: &loggingBucketName,
	})
	if err != nil {
		t.Fatalf("Get bucket encryption failed: %v", err)
	}
	if len(loggingEncryption.ServerSideEncryptionConfiguration.Rules) == 0 {
		t.Fatalf("No encryption rules found for logging bucket")
	}

	// 8) IAM roles exist
	ec2RoleName := "dev-ec2-role"
	_, err = iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: &ec2RoleName,
	})
	if err != nil {
		t.Fatalf("EC2 role not found: %v", err)
	}

	lambdaRoleName := "dev-lambda-role"
	_, err = iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: &lambdaRoleName,
	})
	if err != nil {
		t.Fatalf("Lambda role not found: %v", err)
	}

	// 9) IAM policies attached
	ec2Policies, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
		RoleName: &ec2RoleName,
	})
	if err != nil {
		t.Fatalf("List EC2 role policies failed: %v", err)
	}
	if len(ec2Policies.AttachedPolicies) < 2 { // SSM + S3 custom policy
		t.Fatalf("Expected at least 2 policies attached to EC2 role, got %d", len(ec2Policies.AttachedPolicies))
	}

	lambdaPolicies, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
		RoleName: &lambdaRoleName,
	})
	if err != nil {
		t.Fatalf("List Lambda role policies failed: %v", err)
	}
	if len(lambdaPolicies.AttachedPolicies) < 2 { // Basic execution + S3 custom policy
		t.Fatalf("Expected at least 2 policies attached to Lambda role, got %d", len(lambdaPolicies.AttachedPolicies))
	}
}

// Helper function to create AWS string pointer
func awsString(s string) *string {
	return &s
}
