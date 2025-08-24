//go:build integration
// +build integration

package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// FlatOutputs represents the flattened CloudFormation outputs
type FlatOutputs struct {
	BucketName                  string `json:"bucketName"`
	BucketArn                   string `json:"bucketArn"`
	RoleArn                     string `json:"roleArn"`
	RoleName                    string `json:"roleName"`
	InstanceProfileArn          string `json:"instanceProfileArn"`
	PolicyArn                   string `json:"policyArn"`
	CloudTrailArn               string `json:"cloudTrailArn"`
	ConfigRecorderName          string `json:"configRecorderName"`
	EncryptionEnabled           bool   `json:"encryptionEnabled"`
	SSLEnforced                 bool   `json:"sslEnforced"`
	PublicAccessBlocked         bool   `json:"publicAccessBlocked"`
	VersioningEnabled           bool   `json:"versioningEnabled"`
	ObjectLockEnabled           bool   `json:"objectLockEnabled"`
	AuditLoggingEnabled         bool   `json:"auditLoggingEnabled"`
	ComplianceMonitoringEnabled bool   `json:"complianceMonitoringEnabled"`
}

// loadOutputs loads the flat outputs from the JSON file
func loadOutputs(t *testing.T) *FlatOutputs {
	outputsFile := "../cfn-outputs/flat-outputs.json"
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skip("Outputs file not found, skipping integration tests")
	}

	data, err := ioutil.ReadFile(outputsFile)
	require.NoError(t, err, "Failed to read outputs file")

	var outputs FlatOutputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse outputs JSON")

	return &outputs
}

// TestS3BucketDeployment tests the deployed S3 bucket configuration
func TestS3BucketDeployment(t *testing.T) {
	outputs := loadOutputs(t)

	// Test bucket name exists and follows naming convention
	assert.NotEmpty(t, outputs.BucketName, "Bucket name should not be empty")
	assert.Contains(t, outputs.BucketName, "finapp", "Bucket name should contain 'finapp'")

	// Test bucket ARN is valid
	assert.NotEmpty(t, outputs.BucketArn, "Bucket ARN should not be empty")
	assert.True(t, strings.HasPrefix(outputs.BucketArn, "arn:aws:s3:::"), "Bucket ARN should be valid S3 ARN")
}

// TestIAMResourcesDeployment tests the deployed IAM resources
func TestIAMResourcesDeployment(t *testing.T) {
	outputs := loadOutputs(t)

	// Test IAM role deployment
	assert.NotEmpty(t, outputs.RoleArn, "Role ARN should not be empty")
	assert.True(t, strings.HasPrefix(outputs.RoleArn, "arn:aws:iam::"), "Role ARN should be valid IAM ARN")
	assert.NotEmpty(t, outputs.RoleName, "Role name should not be empty")
	assert.Contains(t, outputs.RoleName, "FinApp", "Role name should contain 'FinApp'")

	// Test IAM policy deployment
	assert.NotEmpty(t, outputs.PolicyArn, "Policy ARN should not be empty")
	assert.True(t, strings.HasPrefix(outputs.PolicyArn, "arn:aws:iam::"), "Policy ARN should be valid IAM ARN")

	// Test instance profile deployment
	assert.NotEmpty(t, outputs.InstanceProfileArn, "Instance profile ARN should not be empty")
	assert.True(t, strings.HasPrefix(outputs.InstanceProfileArn, "arn:aws:iam::"), "Instance profile ARN should be valid")
}

// TestCloudTrailDeployment tests the deployed CloudTrail configuration
func TestCloudTrailDeployment(t *testing.T) {
	outputs := loadOutputs(t)

	// Test CloudTrail deployment
	assert.NotEmpty(t, outputs.CloudTrailArn, "CloudTrail ARN should not be empty")
	assert.Contains(t, outputs.CloudTrailArn, "cloudtrail", "CloudTrail ARN should contain 'cloudtrail'")
	assert.Contains(t, outputs.CloudTrailArn, "FinApp", "CloudTrail ARN should contain 'FinApp'")
}

// TestAWSConfigDeployment tests the deployed AWS Config configuration
func TestAWSConfigDeployment(t *testing.T) {
	outputs := loadOutputs(t)

	// Test Config recorder deployment
	assert.NotEmpty(t, outputs.ConfigRecorderName, "Config recorder name should not be empty")
	assert.Contains(t, outputs.ConfigRecorderName, "FinApp", "Config recorder name should contain 'FinApp'")
	assert.Contains(t, outputs.ConfigRecorderName, "ComplianceRecorder", "Config recorder name should contain 'ComplianceRecorder'")
}

// TestSecurityCompliance tests the security compliance settings
func TestSecurityCompliance(t *testing.T) {
	outputs := loadOutputs(t)

	// Test encryption is enabled
	assert.True(t, outputs.EncryptionEnabled, "Encryption should be enabled for financial data")

	// Test SSL/TLS enforcement
	assert.True(t, outputs.SSLEnforced, "SSL/TLS should be enforced for all connections")

	// Test public access is blocked
	assert.True(t, outputs.PublicAccessBlocked, "Public access should be completely blocked")

	// Test versioning is enabled
	assert.True(t, outputs.VersioningEnabled, "Versioning should be enabled for audit trails")

	// Test audit logging is enabled
	assert.True(t, outputs.AuditLoggingEnabled, "Audit logging should be enabled for compliance")

	// Test compliance monitoring is enabled
	assert.True(t, outputs.ComplianceMonitoringEnabled, "Compliance monitoring should be enabled")
}

// TestFinancialComplianceIntegration tests financial compliance requirements
func TestFinancialComplianceIntegration(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify all required security features are enabled
	securityFeatures := map[string]bool{
		"Encryption":            outputs.EncryptionEnabled,
		"SSL/TLS Enforcement":   outputs.SSLEnforced,
		"Public Access Block":   outputs.PublicAccessBlocked,
		"Versioning":            outputs.VersioningEnabled,
		"Audit Logging":         outputs.AuditLoggingEnabled,
		"Compliance Monitoring": outputs.ComplianceMonitoringEnabled,
	}

	for feature, enabled := range securityFeatures {
		assert.True(t, enabled, "%s must be enabled for financial compliance", feature)
	}
}

// TestResourceIntegration tests the integration between resources
func TestResourceIntegration(t *testing.T) {
	outputs := loadOutputs(t)

	// Test that all critical resources are deployed
	criticalResources := []struct {
		name  string
		value string
	}{
		{"S3 Bucket", outputs.BucketName},
		{"IAM Role", outputs.RoleName},
		{"IAM Policy", outputs.PolicyArn},
		{"Instance Profile", outputs.InstanceProfileArn},
		{"CloudTrail", outputs.CloudTrailArn},
		{"Config Recorder", outputs.ConfigRecorderName},
	}

	for _, resource := range criticalResources {
		assert.NotEmpty(t, resource.value, "%s should be deployed", resource.name)
	}
}

// TestResourceNaming tests that resources follow the naming convention
func TestResourceNaming(t *testing.T) {
	outputs := loadOutputs(t)

	// Check that resources follow FinApp naming convention
	if outputs.RoleName != "" {
		assert.Contains(t, outputs.RoleName, "FinApp", "Role should follow FinApp naming convention")
	}

	if outputs.ConfigRecorderName != "" {
		assert.Contains(t, outputs.ConfigRecorderName, "FinApp", "Config recorder should follow FinApp naming convention")
	}

	if outputs.BucketName != "" {
		assert.Contains(t, outputs.BucketName, "finapp", "Bucket should follow finapp naming convention")
	}
}

// TestAuditingCapabilities tests the auditing infrastructure
func TestAuditingCapabilities(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify CloudTrail is configured
	assert.NotEmpty(t, outputs.CloudTrailArn, "CloudTrail must be configured for auditing")
	assert.True(t, outputs.AuditLoggingEnabled, "Audit logging must be enabled")

	// Verify Config is configured for compliance monitoring
	assert.NotEmpty(t, outputs.ConfigRecorderName, "AWS Config must be configured for compliance")
	assert.True(t, outputs.ComplianceMonitoringEnabled, "Compliance monitoring must be enabled")

	// Verify versioning for audit trails
	assert.True(t, outputs.VersioningEnabled, "S3 versioning must be enabled for audit trails")
}

// TestDataProtection tests data protection measures
func TestDataProtection(t *testing.T) {
	outputs := loadOutputs(t)

	// Test encryption at rest
	assert.True(t, outputs.EncryptionEnabled, "Data must be encrypted at rest")

	// Test encryption in transit
	assert.True(t, outputs.SSLEnforced, "Data must be encrypted in transit")

	// Test access controls
	assert.True(t, outputs.PublicAccessBlocked, "Public access must be blocked")
	assert.NotEmpty(t, outputs.PolicyArn, "Least-privilege policy must be configured")
}

// TestEndToEndWorkflow tests the complete workflow
func TestEndToEndWorkflow(t *testing.T) {
	outputs := loadOutputs(t)

	// Step 1: Verify S3 bucket is created with security features
	assert.NotEmpty(t, outputs.BucketName, "S3 bucket should be created")
	assert.True(t, outputs.EncryptionEnabled, "Bucket should have encryption")
	assert.True(t, outputs.VersioningEnabled, "Bucket should have versioning")
	assert.True(t, outputs.SSLEnforced, "Bucket should enforce SSL")
	assert.True(t, outputs.PublicAccessBlocked, "Bucket should block public access")

	// Step 2: Verify IAM resources for access control
	assert.NotEmpty(t, outputs.RoleArn, "IAM role should be created")
	assert.NotEmpty(t, outputs.PolicyArn, "IAM policy should be created")
	assert.NotEmpty(t, outputs.InstanceProfileArn, "Instance profile should be created")

	// Step 3: Verify audit infrastructure
	assert.NotEmpty(t, outputs.CloudTrailArn, "CloudTrail should be configured")
	assert.NotEmpty(t, outputs.ConfigRecorderName, "AWS Config should be configured")

	// Step 4: Verify all compliance features are enabled
	assert.True(t, outputs.AuditLoggingEnabled, "Audit logging should be enabled")
	assert.True(t, outputs.ComplianceMonitoringEnabled, "Compliance monitoring should be enabled")
}
