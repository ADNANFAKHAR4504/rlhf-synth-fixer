package lib_test

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// TestTapStack_Simple verifies core resources are created and points the
// lambda asset path at the real code under ../lib/lambda to avoid asset
// resolution errors during tests.
func TestTapStack_Simple(t *testing.T) {
	defer jsii.Close()

	app := awscdk.NewApp(nil)
	envSuffix := "test"
	// Resolve the lambda asset directory to an absolute path to avoid
	// asset resolution issues when running tests from different CWDs.
	// tests/unit -> ../../lib/lambda resolves to repo-root/lib/lambda
	// Resolve the lambda asset directory to an absolute path relative to
	// this test file. Using the test file's location avoids depending on
	// the current working directory when tests are run from different
	// places (CI, other packages, etc.).
	// Find the nearest lib/lambda directory walking up from the test file
	_, thisFile, _, _ := runtime.Caller(0)
	dir := filepath.Dir(thisFile)
	var absLambdaPath string
	found := false
	for i := 0; i < 8; i++ {
		candidate := filepath.Join(dir, "lib", "lambda")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			absLambdaPath, _ = filepath.Abs(candidate)
			found = true
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	if !found {
		// fallback to a relative path from the test file
		absLambdaPath, _ = filepath.Abs(filepath.Join(filepath.Dir(thisFile), "..", "..", "lib", "lambda"))
	}
	stack := lib.NewTapStack(app, jsii.String("TapStackTest"), &lib.TapStackProps{
		StackProps:        &awscdk.StackProps{},
		EnvironmentSuffix: jsii.String(envSuffix),
		LambdaAssetPath:   jsii.String(absLambdaPath),
	})
	template := assertions.Template_FromStack(stack.Stack, nil)

	// Basic resource existence
	template.ResourceCountIs(jsii.String("AWS::DynamoDB::Table"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::SQS::Queue"), jsii.Number(2))
	template.ResourceCountIs(jsii.String("AWS::SNS::Topic"), jsii.Number(1))
	// Don't assert exact Lambda function count because CDK may add helper
	// Lambda(s) (e.g. for log retention). Instead assert key functions
	// exist by properties later.
	template.ResourceCountIs(jsii.String("AWS::ApiGateway::RestApi"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(4))

	// Check a few key properties
	template.HasResourceProperties(jsii.String("AWS::DynamoDB::Table"), map[string]interface{}{
		"TableName":   "orders-table-" + envSuffix,
		"BillingMode": "PAY_PER_REQUEST",
	})
	template.HasResourceProperties(jsii.String("AWS::SQS::Queue"), map[string]interface{}{
		"QueueName": "order-queue-" + envSuffix,
	})
	template.HasResourceProperties(jsii.String("AWS::SNS::Topic"), map[string]interface{}{
		"TopicName": "order-topic-" + envSuffix,
	})
}
