//go:build !integration
// +build !integration

package main

import (
	"os"
	"strings"
	"testing"
)

func TestTapStackBasics(t *testing.T) {
	// Basic test to check the Go file loads
	content, err := os.ReadFile("../../lib/main.go")
	if err != nil {
		t.Fatalf("Failed to read main.go: %v", err)
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
	content, err := os.ReadFile("../../lib/main.go")
	if err != nil {
		t.Fatalf("Failed to read main.go: %v", err)
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
	content, err := os.ReadFile("../../lib/main.go")
	if err != nil {
		t.Fatalf("Failed to read main.go: %v", err)
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
	content, err := os.ReadFile("../../lib/main.go")
	if err != nil {
		t.Fatalf("Failed to read main.go: %v", err)
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

func TestGoModuleStructure(t *testing.T) {
	// Test that go.mod file exists and has correct module name
	content, err := os.ReadFile("../../lib/go.mod")
	if err != nil {
		t.Fatalf("Failed to read go.mod: %v", err)
	}
	
	contentStr := string(content)
	
	if !strings.Contains(contentStr, "module secureapp") {
		t.Error("Expected module name 'secureapp' in go.mod")
	}
	
	if !strings.Contains(contentStr, "github.com/cdktf/cdktf-provider-aws-go/aws") {
		t.Error("Expected AWS provider dependency in go.mod")
	}
}