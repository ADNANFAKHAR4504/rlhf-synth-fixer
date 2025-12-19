//go:build integration

package lib_test

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTapStackIntegration(t *testing.T) {
	defer jsii.Close()

	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// This integration test synthesizes the CDK app to a temporary directory
	// and asserts that the generated CloudFormation template contains
	// resources and names matching the environment suffix.
	t.Run("synthesizes stack and template contains expected resource names", func(t *testing.T) {
		// ARRANGE
		tempDir, err := os.MkdirTemp("", "cdk-synth-*")
		require.NoError(t, err)
		defer os.RemoveAll(tempDir)

		envSuffix := "integration"

		// Create app that writes to the temporary outdir
		app := awscdk.NewApp(&awscdk.AppProps{
			Outdir: jsii.String(tempDir),
		})

		// Prepare a minimal lambda asset directory so CDK asset resolution succeeds
		assetDir := filepath.Join(tempDir, "lambda-asset")
		require.NoError(t, os.MkdirAll(assetDir, 0o755))

		// Create minimal handler files referenced by the stack (order_processor and api_handler)
		err = os.WriteFile(filepath.Join(assetDir, "order_processor.py"), []byte("def handler(event, context):\n    return {'statusCode':200}"), 0o644)
		require.NoError(t, err)
		err = os.WriteFile(filepath.Join(assetDir, "api_handler.py"), []byte("def handler(event, context):\n    return {'statusCode':200}"), 0o644)
		require.NoError(t, err)

		// ACT: create the stack which will be synthesized to `tempDir`
		stack := lib.NewTapStack(app, jsii.String("TapStackResourceTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(envSuffix),
			LambdaAssetPath:   jsii.String(assetDir),
		})
		require.NotNil(t, stack)

		// Synthesize the app (writes the template to tempDir)
		_ = app.Synth(nil)

		// The synthesized template file name follows the pattern: <StackId>.template.json
		templatePath := filepath.Join(tempDir, "TapStackResourceTest.template.json")
		_, err = os.Stat(templatePath)
		require.NoError(t, err, fmt.Sprintf("expected synthesized template at %s", templatePath))

		// Read template and assert expected resource names / patterns
		b, err := os.ReadFile(templatePath)
		require.NoError(t, err)
		content := string(b)

		// Verify known resource name patterns from the stack implementation
		assert.Contains(t, content, fmt.Sprintf("orders-table-%s", envSuffix))
		assert.Contains(t, content, fmt.Sprintf("order-queue-%s", envSuffix))
		assert.Contains(t, content, fmt.Sprintf("orders-api-%s", envSuffix))

		t.Logf("Synthesized template located at %s", templatePath)
	})
}

// No remote deploy in this test; synth verification only.
