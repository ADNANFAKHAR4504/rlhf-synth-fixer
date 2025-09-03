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
)

// This optional integration test performs a real terraform init/apply/output/destroy
// against the synthesized Terraform in the CDKTF outdir. It requires:
// - LIVE_APPLY=1
// - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY set with permissions
// - terraform CLI available in PATH
func Test_Live_Deploy_ApplyAndDestroy(t *testing.T) {
	if os.Getenv("LIVE_APPLY") != "1" {
		t.Skip("LIVE_APPLY != 1; skipping live deployment test")
	}

	if _, err := exec.LookPath("terraform"); err != nil {
		t.Skip("terraform not found in PATH; skipping live deployment test")
	}

	if os.Getenv("AWS_ACCESS_KEY_ID") == "" || os.Getenv("AWS_SECRET_ACCESS_KEY") == "" {
		t.Skip("AWS credentials not set; skipping live deployment test")
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
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Output()
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	if _, err := run(ctx, "init", "-input=false", "-no-color"); err != nil {
		t.Fatalf("terraform init failed: %v", err)
	}

	if _, err := run(ctx, "apply", "-input=false", "-auto-approve", "-no-color"); err != nil {
		// try best-effort destroy on failure
		_, _ = run(context.Background(), "destroy", "-auto-approve", "-no-color")
		t.Fatalf("terraform apply failed: %v", err)
	}

	// Ensure resources produced expected outputs
	outJSON, err := run(ctx, "output", "-json")
	if err != nil {
		// ensure cleanup
		_, _ = run(context.Background(), "destroy", "-auto-approve", "-no-color")
		t.Fatalf("terraform output failed: %v", err)
	}
	var outputs map[string]struct{ Value any }
	if err := json.Unmarshal(outJSON, &outputs); err != nil {
		_, _ = run(context.Background(), "destroy", "-auto-approve", "-no-color")
		t.Fatalf("parse outputs json: %v", err)
	}
	for _, key := range []string{"bucket_name", "lambda_function_name", "lambda_function_arn"} {
		if _, ok := outputs[key]; !ok {
			_, _ = run(context.Background(), "destroy", "-auto-approve", "-no-color")
			t.Fatalf("missing output %s", key)
		}
	}

	if _, err := run(ctx, "destroy", "-auto-approve", "-no-color"); err != nil {
		t.Fatalf("terraform destroy failed: %v", err)
	}
}
