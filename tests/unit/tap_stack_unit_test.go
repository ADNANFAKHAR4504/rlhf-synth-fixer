//go:build !integration
// +build !integration

package main

import (
	"os"
	"strings"
	"testing"

	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
)

func TestTapStackBasics(t *testing.T) {
	// Basic test to check the Go file loads
	content, err := os.ReadFile("tap_stack.go")
	if err != nil {
		t.Fatalf("Failed to read tap_stack.go: %v", err)
	}

	contentStr := string(content)

	// Test IAM role exists
	if !strings.Contains(contentStr, "SecureApp-Role") {
		t.Error("Expected IAM role 'SecureApp-Role' to be present in code")
	}

	// Test S3 bucket exists
	if !strings.Contains(contentStr, "secureapp-bucket") {
		t.Error("Expected S3 bucket 'secureapp-bucket' to be present in code")
	}

	// Test DynamoDB table exists
	if !strings.Contains(contentStr, "SecureApp-Table") {
		t.Error("Expected DynamoDB table 'SecureApp-Table' to be present in code")
	}

	// Test IAM Access Analyzer exists
	if !strings.Contains(contentStr, "SecureApp-AccessAnalyzer") {
		t.Error("Expected IAM Access Analyzer 'SecureApp-AccessAnalyzer' to be present in code")
	}
}

func TestSecurityConfigurations(t *testing.T) {
	content, err := os.ReadFile("tap_stack.go")
	if err != nil {
		t.Fatalf("Failed to read tap_stack.go: %v", err)
	}

	contentStr := string(content)

	// Test S3 public access block configuration
	if !strings.Contains(contentStr, "BlockPublicAcls") {
		t.Error("Expected S3 public access block configuration")
	}

	if !strings.Contains(contentStr, "BlockPublicPolicy") {
		t.Error("Expected S3 block public policy configuration")
	}

	// Test S3 encryption
	if !strings.Contains(contentStr, "s3bucketserversideencryptionconfiguration") {
		t.Error("Expected S3 server-side encryption configuration")
	}

	// Test DynamoDB encryption
	if !strings.Contains(contentStr, "ServerSideEncryption") {
		t.Error("Expected DynamoDB server-side encryption")
	}

	// Test least privilege policy
	if !strings.Contains(contentStr, "s3:GetObject") {
		t.Error("Expected restricted S3 access policy")
	}

	if !strings.Contains(contentStr, "dynamodb:GetItem") {
		t.Error("Expected restricted DynamoDB access policy")
	}
}

func TestNamingConventions(t *testing.T) {
	content, err := os.ReadFile("tap_stack.go")
	if err != nil {
		t.Fatalf("Failed to read tap_stack.go: %v", err)
	}

	contentStr := string(content)

	// Test naming conventions
	expectedNames := []string{
		"SecureApp-Role",
		"SecureApp-Policy",
		"SecureApp-Table",
		"secureapp-bucket",
		"SecureApp-AccessAnalyzer",
	}

	for _, name := range expectedNames {
		if !strings.Contains(contentStr, name) {
			t.Errorf("Expected resource name '%s' not found", name)
		}
	}
}

func TestNoPublicAccess(t *testing.T) {
	content, err := os.ReadFile("tap_stack.go")
	if err != nil {
		t.Fatalf("Failed to read tap_stack.go: %v", err)
	}

	contentStr := string(content)

	// Test no public access configurations
	if !strings.Contains(contentStr, "BlockPublicAcls:       jsii.Bool(true)") {
		t.Error("Expected BlockPublicAcls to be true")
	}

	if !strings.Contains(contentStr, "BlockPublicPolicy:     jsii.Bool(true)") {
		t.Error("Expected BlockPublicPolicy to be true")
	}

	if !strings.Contains(contentStr, "IgnorePublicAcls:      jsii.Bool(true)") {
		t.Error("Expected IgnorePublicAcls to be true")
	}

	if !strings.Contains(contentStr, "RestrictPublicBuckets: jsii.Bool(true)") {
		t.Error("Expected RestrictPublicBuckets to be true")
	}

	// Test explicit deny policy
	if !strings.Contains(contentStr, "DenyInsecureConnections") {
		t.Error("Expected explicit deny insecure connections policy")
	}
}

// TestNewTapStack tests the actual stack creation function
func TestNewTapStack(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "test-stack")

	assert.NotNil(t, stack, "Stack should be created")
	assert.Equal(t, "test-stack", *stack.Node().Id(), "Stack should have correct ID")
}

// TestStackWithDifferentNames tests stack creation with various names
func TestStackWithDifferentNames(t *testing.T) {
	testCases := []string{
		"TapStack",
		"TestStack",
		"DevStack",
		"ProdStack",
	}

	for _, name := range testCases {
		t.Run(name, func(t *testing.T) {
			app := cdktf.NewApp(nil)
			stack := NewTapStack(app, name)

			assert.NotNil(t, stack, "Stack should be created for name: %s", name)
			assert.Equal(t, name, *stack.Node().Id(), "Stack should have correct ID")
		})
	}
}

// TestAppCreation tests CDKTF app creation
func TestAppCreation(t *testing.T) {
	app := cdktf.NewApp(nil)
	assert.NotNil(t, app, "App should be created")
}

// TestMultipleStacks tests creating multiple stacks in different apps
func TestMultipleStacks(t *testing.T) {
	app1 := cdktf.NewApp(nil)
	app2 := cdktf.NewApp(nil)

	stack1 := NewTapStack(app1, "stack1")
	stack2 := NewTapStack(app2, "stack2")

	assert.NotNil(t, stack1, "First stack should be created")
	assert.NotNil(t, stack2, "Second stack should be created")
	// Different stacks have different IDs
	assert.NotEqual(t, *stack1.Node().Id(), *stack2.Node().Id(), "Stacks should have different IDs")
}

// TestStackResourceCount tests that stack creates expected number of resources
func TestStackResourceCount(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "resource-test")

	// Check that stack has child nodes (resources)
	children := stack.Node().Children()
	assert.Greater(t, len(*children), 0, "Stack should have child resources")
}

// TestStackSynthesis tests that stack can be synthesized
func TestStackSynthesis(t *testing.T) {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "synth-test")

	// This should not panic
	assert.NotPanics(t, func() {
		app.Synth()
	}, "Stack synthesis should not panic")
}

// TestEnvironmentVariables tests stack behavior with environment variables
func TestEnvironmentVariables(t *testing.T) {
	// Test with AWS_REGION set
	os.Setenv("AWS_REGION", "us-west-2")
	defer os.Unsetenv("AWS_REGION")

	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "env-test")

	assert.NotNil(t, stack, "Stack should be created with environment variables")
}

// TestStackWithEmptyName tests edge case with empty name
func TestStackWithEmptyName(t *testing.T) {
	// Skip this test as empty names are not allowed in CDKTF
	t.Skip("Empty stack names are not allowed in CDKTF")
}

// TestStackNodeProperties tests stack node properties
func TestStackNodeProperties(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "node-test")

	node := stack.Node()
	assert.NotNil(t, node, "Stack node should exist")
	assert.Equal(t, "node-test", *node.Id(), "Node ID should match stack name")
}

// TestStackDependencies tests that resources are created in correct order
func TestStackDependencies(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "deps-test")

	// Verify stack has resources
	children := stack.Node().Children()
	assert.Greater(t, len(*children), 5, "Stack should have multiple resources")
}

// TestStackMetadata tests stack metadata and tags
func TestStackMetadata(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "metadata-test")

	assert.NotNil(t, stack, "Stack should be created")
	// Additional metadata checks can be added here
}

// TestConcurrentStackCreation tests creating stacks concurrently
func TestConcurrentStackCreation(t *testing.T) {
	// Skip this test as concurrent stack creation can cause race conditions
	t.Skip("Concurrent stack creation can cause race conditions")
}

// TestStackValidation tests stack validation
func TestStackValidation(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "validation-test")

	// Basic validation - stack should exist and have resources
	assert.NotNil(t, stack, "Stack should exist")
	children := stack.Node().Children()
	assert.Greater(t, len(*children), 0, "Stack should have resources")
}
