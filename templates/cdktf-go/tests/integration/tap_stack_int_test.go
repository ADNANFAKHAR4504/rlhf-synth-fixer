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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSynthEndToEnd tests full synthesis and validates generated Terraform
func TestSynthEndToEnd(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set region
	oldRegion := os.Getenv("AWS_REGION")
	defer func() { _ = os.Setenv("AWS_REGION", oldRegion) }()
	_ = os.Setenv("AWS_REGION", "us-east-1")

	// Create and synthesize stack
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, "TapStack")
	app.Synth()

	// Verify synthesized files exist
	stackDir := filepath.Join(outdir, "stacks", "TapStack")
	tfPath := filepath.Join(stackDir, "cdk.tf.json")
	require.FileExists(t, tfPath, "Terraform JSON should be generated")

	// Load and validate Terraform JSON
	data, err := os.ReadFile(tfPath)
	require.NoError(t, err, "Should be able to read Terraform JSON")

	var tfConfig map[string]any
	require.NoError(t, json.Unmarshal(data, &tfConfig), "Terraform JSON should be valid")

	// Validate required sections
	assert.Contains(t, tfConfig, "resource", "Should contain resources")
	assert.Contains(t, tfConfig, "output", "Should contain outputs")
	assert.Contains(t, tfConfig, "provider", "Should contain provider")

	// Validate specific resources
	resources := tfConfig["resource"].(map[string]any)
	expectedResources := []string{
		"aws_s3_bucket",
		"aws_s3_bucket_versioning",
		"aws_s3_bucket_public_access_block",
		"aws_s3_bucket_server_side_encryption_configuration",
		"aws_dynamodb_table",
		"aws_iam_role",
		"aws_iam_policy",
		"aws_iam_role_policy_attachment",
		"aws_accessanalyzer_analyzer",
	}

	for _, resourceType := range expectedResources {
		assert.Contains(t, resources, resourceType, "Should contain %s", resourceType)
	}

	// Validate outputs
	outputs := tfConfig["output"].(map[string]any)
	expectedOutputs := []string{
		"bucket_name",
		"bucket_arn",
		"dynamodb_table_name",
		"dynamodb_table_arn",
		"iam_role_name",
		"iam_role_arn",
		"access_analyzer_arn",
	}

	for _, outputName := range expectedOutputs {
		assert.Contains(t, outputs, outputName, "Should contain output %s", outputName)
		output := outputs[outputName].(map[string]any)
		assert.Contains(t, output, "value", "Output %s should have value", outputName)
		assert.Contains(t, output, "description", "Output %s should have description", outputName)
	}
}

// TestTerraformValidation tests that generated Terraform is valid
func TestTerraformValidation(t *testing.T) {
	if _, err := exec.LookPath("terraform"); err != nil {
		t.Skip("terraform not found in PATH; skipping validation test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set region
	oldRegion := os.Getenv("AWS_REGION")
	defer func() { _ = os.Setenv("AWS_REGION", oldRegion) }()
	_ = os.Setenv("AWS_REGION", "us-east-1")

	// Create and synthesize stack
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, "TapStack")
	app.Synth()

	stackDir := filepath.Join(outdir, "stacks", "TapStack")

	// Run terraform init
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	initCmd := exec.CommandContext(ctx, "terraform", "init", "-backend=false")
	initCmd.Dir = stackDir
	initCmd.Env = os.Environ()
	err := initCmd.Run()
	require.NoError(t, err, "terraform init should succeed")

	// Run terraform validate
	validateCmd := exec.CommandContext(ctx, "terraform", "validate")
	validateCmd.Dir = stackDir
	validateCmd.Env = os.Environ()
	err = validateCmd.Run()
	require.NoError(t, err, "terraform validate should succeed")
}

// TestLiveDeployment tests actual deployment to AWS (requires credentials)
func TestLiveDeployment(t *testing.T) {
	if os.Getenv("LIVE_DEPLOY") != "1" {
		t.Skip("LIVE_DEPLOY != 1; skipping live deployment test")
	}

	if _, err := exec.LookPath("terraform"); err != nil {
		t.Skip("terraform not found in PATH; skipping live deployment test")
	}

	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("AWS_SECRET_ACCESS_KEY") == "" {
		t.Skip("AWS credentials not set; skipping live deployment test")
	}

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set region
	oldRegion := os.Getenv("AWS_REGION")
	defer func() { _ = os.Setenv("AWS_REGION", oldRegion) }()
	_ = os.Setenv("AWS_REGION", "us-east-1")

	// Create and synthesize stack
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, "TapStack")
	app.Synth()

	stackDir := filepath.Join(outdir, "stacks", "TapStack")

	runTerraform := func(ctx context.Context, args ...string) error {
		cmd := exec.CommandContext(ctx, "terraform", args...)
		cmd.Dir = stackDir
		cmd.Env = os.Environ()
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	// Initialize Terraform
	err := runTerraform(ctx, "init", "-input=false")
	require.NoError(t, err, "terraform init should succeed")

	// Plan deployment
	err = runTerraform(ctx, "plan", "-input=false", "-out=tfplan")
	require.NoError(t, err, "terraform plan should succeed")

	// Apply deployment
	err = runTerraform(ctx, "apply", "-input=false", "-auto-approve", "tfplan")
	if err != nil {
		// Attempt cleanup on failure
		_, _ = runTerraform(context.Background(), "destroy", "-auto-approve")
		require.NoError(t, err, "terraform apply should succeed")
	}

	// Get outputs
	outputCmd := exec.CommandContext(ctx, "terraform", "output", "-json")
	outputCmd.Dir = stackDir
	outputCmd.Env = os.Environ()
	outputBytes, err := outputCmd.Output()
	if err != nil {
		_, _ = runTerraform(context.Background(), "destroy", "-auto-approve")
		require.NoError(t, err, "terraform output should succeed")
	}

	// Validate outputs
	var outputs map[string]struct {
		Value any `json:"value"`
	}
	err = json.Unmarshal(outputBytes, &outputs)
	if err != nil {
		_, _ = runTerraform(context.Background(), "destroy", "-auto-approve")
		require.NoError(t, err, "should parse terraform outputs")
	}

	expectedOutputs := []string{
		"bucket_name",
		"bucket_arn",
		"dynamodb_table_name",
		"dynamodb_table_arn",
		"iam_role_name",
		"iam_role_arn",
		"access_analyzer_arn",
	}

	for _, outputName := range expectedOutputs {
		output, exists := outputs[outputName]
		if !exists {
			_, _ = runTerraform(context.Background(), "destroy", "-auto-approve")
			require.True(t, exists, "Output %s should exist", outputName)
		}
		assert.NotNil(t, output.Value, "Output %s should have value", outputName)
	}

	// Cleanup - destroy resources
	err = runTerraform(ctx, "destroy", "-input=false", "-auto-approve")
	require.NoError(t, err, "terraform destroy should succeed")
}

// TestResourceValidation tests that resources are created with correct configurations
func TestResourceValidation(t *testing.T) {
	if os.Getenv("VALIDATE_RESOURCES") != "1" {
		t.Skip("VALIDATE_RESOURCES != 1; skipping resource validation test")
	}

	// This test would use AWS SDK to validate actual resource configurations
	// after deployment, checking things like:
	// - S3 bucket encryption settings
	// - DynamoDB table configuration
	// - IAM policy permissions
	// - Access Analyzer configuration

	t.Log("Resource validation test would validate actual AWS resources")
	t.Log("This requires AWS SDK integration and deployed resources")
}

// TestSecurityCompliance tests security compliance of the infrastructure
func TestSecurityCompliance(t *testing.T) {
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set region
	oldRegion := os.Getenv("AWS_REGION")
	defer func() { _ = os.Setenv("AWS_REGION", oldRegion) }()
	_ = os.Setenv("AWS_REGION", "us-east-1")

	// Create and synthesize stack
	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, "TapStack")
	app.Synth()

	// Load Terraform JSON
	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	data, err := os.ReadFile(tfPath)
	require.NoError(t, err)

	var tfConfig map[string]any
	require.NoError(t, json.Unmarshal(data, &tfConfig))

	resources := tfConfig["resource"].(map[string]any)

	// Test S3 security configurations
	s3Resources := resources["aws_s3_bucket"].(map[string]any)
	assert.NotEmpty(t, s3Resources, "S3 bucket should exist")

	// Verify public access block exists
	pabResources := resources["aws_s3_bucket_public_access_block"].(map[string]any)
	assert.NotEmpty(t, pabResources, "S3 public access block should exist")

	for _, pab := range pabResources {
		pabConfig := pab.(map[string]any)
		assert.Equal(t, true, pabConfig["block_public_acls"], "Should block public ACLs")
		assert.Equal(t, true, pabConfig["block_public_policy"], "Should block public policy")
		assert.Equal(t, true, pabConfig["ignore_public_acls"], "Should ignore public ACLs")
		assert.Equal(t, true, pabConfig["restrict_public_buckets"], "Should restrict public buckets")
	}

	// Verify encryption exists
	encResources := resources["aws_s3_bucket_server_side_encryption_configuration"].(map[string]any)
	assert.NotEmpty(t, encResources, "S3 encryption should exist")

	// Test DynamoDB security
	ddbResources := resources["aws_dynamodb_table"].(map[string]any)
	for _, ddb := range ddbResources {
		ddbConfig := ddb.(map[string]any)
		sse := ddbConfig["server_side_encryption"].(map[string]any)
		assert.Equal(t, true, sse["enabled"], "DynamoDB encryption should be enabled")
		pitr := ddbConfig["point_in_time_recovery"].(map[string]any)
		assert.Equal(t, true, pitr["enabled"], "DynamoDB PITR should be enabled")
	}

	// Test IAM policy for least privilege
	iamPolicies := resources["aws_iam_policy"].(map[string]any)
	for _, policy := range iamPolicies {
		policyConfig := policy.(map[string]any)
		policyDoc := policyConfig["policy"].(string)
		assert.Contains(t, policyDoc, "DenyInsecureConnections", "Should deny insecure connections")
		assert.Contains(t, policyDoc, "aws:SecureTransport", "Should enforce secure transport")
	}

	// Verify Access Analyzer exists
	analyzerResources := resources["aws_accessanalyzer_analyzer"].(map[string]any)
	assert.NotEmpty(t, analyzerResources, "Access Analyzer should exist")

	for _, analyzer := range analyzerResources {
		analyzerConfig := analyzer.(map[string]any)
		assert.Equal(t, "ACCOUNT", analyzerConfig["type"], "Access Analyzer should be account-wide")
	}
}
