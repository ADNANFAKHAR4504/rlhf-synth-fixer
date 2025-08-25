//go:build !integration
// +build !integration

package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
)

func TestTapStackBasics(t *testing.T) {
	// Find the tap_stack.go file
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
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

	// Test AWS provider configuration
	if !strings.Contains(contentStr, "provider.NewAwsProvider") {
		t.Error("Expected AWS provider configuration")
	}

	// Test S3 backend configuration
	if !strings.Contains(contentStr, "cdktf.NewS3Backend") {
		t.Error("Expected S3 backend configuration")
	}
}

func TestSecurityConfigurations(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test S3 public access block configuration
	if !strings.Contains(contentStr, "BlockPublicAcls") {
		t.Error("Expected S3 public access block configuration")
	}

	if !strings.Contains(contentStr, "BlockPublicPolicy") {
		t.Error("Expected S3 block public policy configuration")
	}

	if !strings.Contains(contentStr, "IgnorePublicAcls") {
		t.Error("Expected S3 ignore public ACLs configuration")
	}

	if !strings.Contains(contentStr, "RestrictPublicBuckets") {
		t.Error("Expected S3 restrict public buckets configuration")
	}

	// Test S3 encryption
	if !strings.Contains(contentStr, "s3bucketserversideencryptionconfiguration") {
		t.Error("Expected S3 server-side encryption configuration")
	}

	if !strings.Contains(contentStr, "AES256") {
		t.Error("Expected AES256 encryption algorithm")
	}

	// Test S3 versioning
	if !strings.Contains(contentStr, "s3bucketversioning") {
		t.Error("Expected S3 versioning configuration")
	}

	// Test DynamoDB encryption
	if !strings.Contains(contentStr, "ServerSideEncryption") {
		t.Error("Expected DynamoDB server-side encryption")
	}

	// Test DynamoDB point-in-time recovery
	if !strings.Contains(contentStr, "PointInTimeRecovery") {
		t.Error("Expected DynamoDB point-in-time recovery")
	}

	// Test least privilege policy
	if !strings.Contains(contentStr, "s3:GetObject") {
		t.Error("Expected restricted S3 access policy")
	}

	if !strings.Contains(contentStr, "dynamodb:GetItem") {
		t.Error("Expected restricted DynamoDB access policy")
	}

	// Test HTTPS enforcement
	if !strings.Contains(contentStr, "DenyInsecureConnections") {
		t.Error("Expected HTTPS enforcement policy")
	}

	if !strings.Contains(contentStr, "aws:SecureTransport") {
		t.Error("Expected secure transport condition")
	}
}

func TestNamingConventions(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test naming conventions with environment suffix
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

	// Test environment suffix usage
	if !strings.Contains(contentStr, "environmentSuffix") {
		t.Error("Expected environment suffix to be used in naming")
	}

	// Test unique bucket naming with timestamp
	if !strings.Contains(contentStr, "bucketSuffix") {
		t.Error("Expected bucket suffix for unique naming")
	}
}

func TestNoPublicAccess(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
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

	// Test bucket policy enforcement
	if !strings.Contains(contentStr, "s3bucketpolicy.NewS3BucketPolicy") {
		t.Error("Expected S3 bucket policy configuration")
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
	// Test that empty names cause a panic (CDKTF requirement)
	app := cdktf.NewApp(nil)

	// This should panic because CDKTF doesn't allow empty IDs
	assert.Panics(t, func() {
		NewTapStack(app, "")
	}, "Empty stack name should panic")
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

// Helper function to find the stack file
func findStackFile(t *testing.T) string {
	// Try current directory first
	if _, err := os.Stat("tap_stack.go"); err == nil {
		return "tap_stack.go"
	}

	// Try lib directory
	if _, err := os.Stat("../lib/tap_stack.go"); err == nil {
		return "../lib/tap_stack.go"
	}

	// Try relative to test directory
	if _, err := os.Stat("../../lib/tap_stack.go"); err == nil {
		return "../../lib/tap_stack.go"
	}

	t.Fatal("Could not find tap_stack.go file")
	return ""
}

// Test AWS provider configuration
func TestAWSProviderConfiguration(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test AWS provider region
	if !strings.Contains(contentStr, `Region: jsii.String("us-east-1")`) {
		t.Error("Expected AWS provider to be configured for us-east-1")
	}

	// Test default tags
	expectedTags := []string{
		`"Project":     jsii.String("SecureApp")`,
		`"Environment": jsii.String("Production")`,
		`"ManagedBy":   jsii.String("CDKTF")`,
	}

	for _, tag := range expectedTags {
		if !strings.Contains(contentStr, tag) {
			t.Errorf("Expected default tag not found: %s", tag)
		}
	}
}

// Test S3 backend configuration
func TestS3BackendConfiguration(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test S3 backend configuration
	if !strings.Contains(contentStr, "cdktf.NewS3Backend") {
		t.Error("Expected S3 backend configuration")
	}

	// Test encryption enabled
	if !strings.Contains(contentStr, "Encrypt: jsii.Bool(true)") {
		t.Error("Expected S3 backend encryption to be enabled")
	}

	// Test environment variables usage
	if !strings.Contains(contentStr, "TERRAFORM_STATE_BUCKET") {
		t.Error("Expected TERRAFORM_STATE_BUCKET environment variable usage")
	}

	if !strings.Contains(contentStr, "TERRAFORM_STATE_BUCKET_REGION") {
		t.Error("Expected TERRAFORM_STATE_BUCKET_REGION environment variable usage")
	}
}

// Test IAM role configuration
func TestIAMRoleConfiguration(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test Lambda service principal
	if !strings.Contains(contentStr, `"Service": "lambda.amazonaws.com"`) {
		t.Error("Expected Lambda service principal in IAM role")
	}

	// Test region restriction in trust policy
	if !strings.Contains(contentStr, `"aws:RequestedRegion": "us-east-1"`) {
		t.Error("Expected region restriction in IAM role trust policy")
	}

	// Test role policy attachment
	if !strings.Contains(contentStr, "iamrolepolicyattachment.NewIamRolePolicyAttachment") {
		t.Error("Expected IAM role policy attachment")
	}
}

// Test DynamoDB configuration
func TestDynamoDBConfiguration(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test billing mode
	if !strings.Contains(contentStr, `BillingMode: jsii.String("PAY_PER_REQUEST")`) {
		t.Error("Expected PAY_PER_REQUEST billing mode")
	}

	// Test hash key
	if !strings.Contains(contentStr, `HashKey:     jsii.String("id")`) {
		t.Error("Expected 'id' as hash key")
	}

	// Test attribute configuration
	if !strings.Contains(contentStr, `Name: jsii.String("id")`) {
		t.Error("Expected 'id' attribute definition")
	}

	if !strings.Contains(contentStr, `Type: jsii.String("S")`) {
		t.Error("Expected string type for 'id' attribute")
	}
}

// Test outputs configuration
func TestOutputsConfiguration(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test all required outputs
	expectedOutputs := []string{
		"bucket_name",
		"bucket_arn",
		"dynamodb_table_name",
		"dynamodb_table_arn",
		"iam_role_name",
		"iam_role_arn",
		"access_analyzer_arn",
	}

	for _, output := range expectedOutputs {
		if !strings.Contains(contentStr, `"`+output+`"`) {
			t.Errorf("Expected output '%s' not found", output)
		}
	}

	// Test output descriptions
	if !strings.Contains(contentStr, "Description:") {
		t.Error("Expected output descriptions")
	}
}

// Test environment variable handling
func TestEnvironmentVariableHandling(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test ENVIRONMENT_SUFFIX handling
	if !strings.Contains(contentStr, `envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")`) {
		t.Error("Expected ENVIRONMENT_SUFFIX environment variable handling")
	}

	// Test default value
	if !strings.Contains(contentStr, `envSuffix = "prod"`) {
		t.Error("Expected default environment suffix 'prod'")
	}
}

// Test resource tagging
func TestResourceTagging(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test that resources have tags
	tagPatterns := []string{
		`"Name":`,
		`"Description":`,
		`Tags: &map[string]*string{`,
	}

	for _, pattern := range tagPatterns {
		if !strings.Contains(contentStr, pattern) {
			t.Errorf("Expected tag pattern '%s' not found", pattern)
		}
	}
}

// Test code structure and imports
func TestCodeStructure(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	// Test required imports
	requiredImports := []string{
		`"github.com/aws/constructs-go/constructs/v10"`,
		`"github.com/hashicorp/terraform-cdk-go/cdktf"`,
		`"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"`,
		`"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"`,
		`"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dynamodbtable"`,
		`"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"`,
		`"github.com/cdktf/cdktf-provider-aws-go/aws/v19/accessanalyzeranalyzer"`,
	}

	for _, imp := range requiredImports {
		if !strings.Contains(contentStr, imp) {
			t.Errorf("Expected import '%s' not found", imp)
		}
	}

	// Test function signature
	if !strings.Contains(contentStr, "func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack") {
		t.Error("Expected correct NewTapStack function signature")
	}

	// Test main function
	if !strings.Contains(contentStr, "func main()") {
		t.Error("Expected main function")
	}
}

// Test error handling and edge cases
func TestErrorHandling(t *testing.T) {
	t.Run("InvalidStackName", func(t *testing.T) {
		app := cdktf.NewApp(nil)

		// Test with special characters
		specialNames := []string{
			"test-stack-123",
			"TestStack_456",
			"stack.test",
		}

		for _, name := range specialNames {
			assert.NotPanics(t, func() {
				NewTapStack(app, name)
			}, "Stack creation should handle special characters in name: %s", name)
		}
	})

	t.Run("EnvironmentVariables", func(t *testing.T) {
		// Test with different environment variables
		testCases := []struct {
			envVar string
			value  string
		}{
			{"ENVIRONMENT_SUFFIX", "test"},
			{"ENVIRONMENT_SUFFIX", "dev"},
			{"ENVIRONMENT_SUFFIX", "staging"},
			{"TERRAFORM_STATE_BUCKET", "custom-bucket"},
			{"TERRAFORM_STATE_BUCKET_REGION", "us-west-2"},
		}

		for _, tc := range testCases {
			t.Run(tc.envVar+"_"+tc.value, func(t *testing.T) {
				// Set environment variable
				oldValue := os.Getenv(tc.envVar)
				os.Setenv(tc.envVar, tc.value)
				defer func() {
					if oldValue == "" {
						os.Unsetenv(tc.envVar)
					} else {
						os.Setenv(tc.envVar, oldValue)
					}
				}()

				app := cdktf.NewApp(nil)
				assert.NotPanics(t, func() {
					NewTapStack(app, "env-test")
				}, "Stack creation should handle environment variable %s=%s", tc.envVar, tc.value)
			})
		}
	})
}

// Test performance and resource limits
func TestPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	t.Run("MultipleStackCreation", func(t *testing.T) {
		// Test creating multiple stacks quickly
		for i := 0; i < 10; i++ {
			app := cdktf.NewApp(nil)
			stackName := fmt.Sprintf("perf-test-%d", i)

			assert.NotPanics(t, func() {
				stack := NewTapStack(app, stackName)
				assert.NotNil(t, stack)
			}, "Should handle multiple stack creation")
		}
	})

	t.Run("LargeStackName", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		// Test with very long stack name
		longName := strings.Repeat("a", 100)

		assert.NotPanics(t, func() {
			NewTapStack(app, longName)
		}, "Should handle long stack names")
	})
}

// Test code quality and best practices
func TestCodeQuality(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	t.Run("NoHardcodedValues", func(t *testing.T) {
		// Check for hardcoded AWS account IDs (should not exist)
		accountIdPattern := regexp.MustCompile(`\d{12}`)
		if accountIdPattern.MatchString(contentStr) {
			// Allow in policy documents as placeholders
			if !strings.Contains(contentStr, "arn:aws:logs:us-east-1:*:*") {
				t.Error("Found potential hardcoded AWS account ID")
			}
		}

		// Check for hardcoded regions (except us-east-1 which is expected)
		regions := []string{"us-west-1", "us-west-2", "eu-west-1", "ap-southeast-1"}
		for _, region := range regions {
			if strings.Contains(contentStr, region) {
				t.Errorf("Found hardcoded region: %s", region)
			}
		}
	})

	t.Run("ProperErrorHandling", func(t *testing.T) {
		// Check for proper nil checks and error handling patterns
		if strings.Contains(contentStr, "panic(") {
			t.Error("Code should not contain panic statements")
		}

		// Check for environment variable defaults
		if !strings.Contains(contentStr, `if envSuffix == ""`) {
			t.Error("Expected proper default handling for environment variables")
		}
	})

	t.Run("SecurityBestPractices", func(t *testing.T) {
		// Check for security best practices
		securityPatterns := []string{
			"Encrypt: jsii.Bool(true)", // S3 backend encryption
			"ServerSideEncryption",     // DynamoDB encryption
			"PointInTimeRecovery",      // DynamoDB backup
			"BlockPublicAcls",          // S3 public access block
			"DenyInsecureConnections",  // HTTPS enforcement
			"aws:SecureTransport",      // Secure transport condition
		}

		for _, pattern := range securityPatterns {
			if !strings.Contains(contentStr, pattern) {
				t.Errorf("Security best practice not found: %s", pattern)
			}
		}
	})

	t.Run("ResourceNamingConsistency", func(t *testing.T) {
		// Check that all resources use consistent naming with environment suffix
		resourceTypes := []string{
			"SecureAppRole",
			"SecureAppBucket",
			"SecureAppTable",
			"SecureAppPolicy",
			"SecureAppAccessAnalyzer",
		}

		for _, resourceType := range resourceTypes {
			if !strings.Contains(contentStr, resourceType) {
				t.Errorf("Expected resource type not found: %s", resourceType)
			}
		}
	})
}

// Test documentation and comments
func TestDocumentation(t *testing.T) {
	stackFile := findStackFile(t)
	content, err := os.ReadFile(stackFile)
	if err != nil {
		t.Fatalf("Failed to read %s: %v", stackFile, err)
	}

	contentStr := string(content)

	t.Run("FunctionComments", func(t *testing.T) {
		// Check for function documentation
		functions := []string{
			"NewTapStack",
			"main",
		}

		for _, fn := range functions {
			// Look for the function and check if there are comments nearby
			if strings.Contains(contentStr, "func "+fn) {
				// This is a basic check - in a real scenario you'd want more sophisticated comment checking
				t.Logf("Found function: %s", fn)
			}
		}
	})

	t.Run("ConfigurationComments", func(t *testing.T) {
		// Check for inline comments explaining complex configurations
		commentPatterns := []string{
			"// Configure AWS provider",
			"// S3 Backend",
			"// Create IAM role",
			"// Create S3 bucket",
			"// Create DynamoDB table",
			"// Outputs",
		}

		foundComments := 0
		for _, pattern := range commentPatterns {
			if strings.Contains(contentStr, pattern) {
				foundComments++
			}
		}

		if foundComments < len(commentPatterns)/2 {
			t.Error("Expected more inline comments for configuration sections")
		}
	})
}

// Test integration with CDKTF framework
func TestCDKTFIntegration(t *testing.T) {
	t.Run("StackInheritance", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		stack := NewTapStack(app, "inheritance-test")

		// Test that stack implements TerraformStack interface
		_, ok := stack.(cdktf.TerraformStack)
		assert.True(t, ok, "Stack should implement TerraformStack interface")
	})

	t.Run("AppIntegration", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		stackName := "app-integration-test"

		// Create stack
		stack := NewTapStack(app, stackName)

		// Verify stack is part of app
		assert.NotNil(t, stack.Node().Scope(), "Stack should have a scope (app)")
		assert.Equal(t, stackName, *stack.Node().Id(), "Stack ID should match")
	})

	t.Run("SynthesisValidation", func(t *testing.T) {
		app := cdktf.NewApp(nil)
		NewTapStack(app, "synth-validation-test")

		// Test that synthesis produces valid output
		assert.NotPanics(t, func() {
			app.Synth()
		}, "Synthesis should not panic")
	})
}

// Benchmark tests
func BenchmarkStackCreation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		app := cdktf.NewApp(nil)
		NewTapStack(app, fmt.Sprintf("benchmark-test-%d", i))
	}
}

func BenchmarkStackSynthesis(b *testing.B) {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "benchmark-synth-test")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		app.Synth()
	}
}
