//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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
	EncryptionEnabled           string `json:"encryptionEnabled"`
	SSLEnforced                 string `json:"sslEnforced"`
	PublicAccessBlocked         string `json:"publicAccessBlocked"`
	VersioningEnabled           string `json:"versioningEnabled"`
	ObjectLockEnabled           string `json:"objectLockEnabled"`
	AuditLoggingEnabled         string `json:"auditLoggingEnabled"`
	ComplianceMonitoringEnabled string `json:"complianceMonitoringEnabled"`
}

// Helper methods to convert string booleans to actual booleans
func (o *FlatOutputs) IsEncryptionEnabled() bool {
	return o.EncryptionEnabled == "true"
}

func (o *FlatOutputs) IsSSLEnforced() bool {
	return o.SSLEnforced == "true"
}

func (o *FlatOutputs) IsPublicAccessBlocked() bool {
	return o.PublicAccessBlocked == "true"
}

func (o *FlatOutputs) IsVersioningEnabled() bool {
	return o.VersioningEnabled == "true"
}

func (o *FlatOutputs) IsObjectLockEnabled() bool {
	return o.ObjectLockEnabled == "true"
}

func (o *FlatOutputs) IsAuditLoggingEnabled() bool {
	return o.AuditLoggingEnabled == "true"
}

func (o *FlatOutputs) IsComplianceMonitoringEnabled() bool {
	return o.ComplianceMonitoringEnabled == "true"
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

// TestSecurityCompliance tests the security compliance settings
func TestSecurityCompliance(t *testing.T) {
	outputs := loadOutputs(t)

	// Test encryption is enabled
	assert.True(t, outputs.IsEncryptionEnabled(), "Encryption should be enabled for financial data")

	// Test SSL/TLS enforcement
	assert.True(t, outputs.IsSSLEnforced(), "SSL/TLS should be enforced for all connections")

	// Test public access is blocked
	assert.True(t, outputs.IsPublicAccessBlocked(), "Public access should be completely blocked")

	// Test versioning is enabled
	assert.True(t, outputs.IsVersioningEnabled(), "Versioning should be enabled for audit trails")

	// Test audit logging is enabled
	assert.True(t, outputs.IsAuditLoggingEnabled(), "Audit logging should be enabled for compliance")

	// Test compliance monitoring is enabled
	assert.True(t, outputs.IsComplianceMonitoringEnabled(), "Compliance monitoring should be enabled")
}

// TestFinancialComplianceIntegration tests financial compliance requirements
func TestFinancialComplianceIntegration(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify all required security features are enabled
	securityFeatures := map[string]bool{
		"Encryption":            outputs.IsEncryptionEnabled(),
		"SSL/TLS Enforcement":   outputs.IsSSLEnforced(),
		"Public Access Block":   outputs.IsPublicAccessBlocked(),
		"Versioning":            outputs.IsVersioningEnabled(),
		"Audit Logging":         outputs.IsAuditLoggingEnabled(),
		"Compliance Monitoring": outputs.IsComplianceMonitoringEnabled(),
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
	if outputs.BucketName != "" {
		assert.Contains(t, outputs.BucketName, "finapp", "Bucket should follow finapp naming convention")
	}
}

// TestAuditingCapabilities tests the auditing infrastructure
func TestAuditingCapabilities(t *testing.T) {
	outputs := loadOutputs(t)

	// Verify CloudTrail is configured
	assert.NotEmpty(t, outputs.CloudTrailArn, "CloudTrail must be configured for auditing")
	assert.True(t, outputs.IsAuditLoggingEnabled(), "Audit logging must be enabled")

	// Verify Config is configured for compliance monitoring
	assert.NotEmpty(t, outputs.ConfigRecorderName, "AWS Config must be configured for compliance")
	assert.True(t, outputs.IsComplianceMonitoringEnabled(), "Compliance monitoring must be enabled")

	// Verify versioning for audit trails
	assert.True(t, outputs.IsVersioningEnabled(), "S3 versioning must be enabled for audit trails")
}

// TestDataProtection tests data protection measures
func TestDataProtection(t *testing.T) {
	outputs := loadOutputs(t)

	// Test encryption at rest
	assert.True(t, outputs.IsEncryptionEnabled(), "Data must be encrypted at rest")

	// Test encryption in transit
	assert.True(t, outputs.IsSSLEnforced(), "Data must be encrypted in transit")

	// Test access controls
	assert.True(t, outputs.IsPublicAccessBlocked(), "Public access must be blocked")
	assert.NotEmpty(t, outputs.PolicyArn, "Least-privilege policy must be configured")
}

// TestS3BucketActualConfiguration tests the actual S3 bucket configuration via AWS API
func TestS3BucketActualConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)

	// Test bucket exists
	_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Bucket should exist and be accessible")

	// Test bucket encryption
	encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get bucket encryption")
	assert.NotNil(t, encryption.ServerSideEncryptionConfiguration, "Encryption should be configured")
	assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules, "Encryption rules should exist")

	// Test bucket versioning
	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get bucket versioning")
	assert.Equal(t, "Enabled", string(versioning.Status), "Versioning should be enabled")

	// Test public access block
	publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get public access block")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls, "Public ACLs should be blocked")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy, "Public policies should be blocked")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls, "Public ACLs should be ignored")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets, "Public buckets should be restricted")

	// Test bucket policy (SSL enforcement)
	bucketPolicy, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get bucket policy")
	assert.Contains(t, *bucketPolicy.Policy, "aws:SecureTransport", "Policy should enforce SSL")
	assert.Contains(t, *bucketPolicy.Policy, "Deny", "Policy should have deny statements")
}

// TestIAMResourcesActualConfiguration tests the actual IAM resources via AWS API
func TestIAMResourcesActualConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	iamClient := iam.NewFromConfig(cfg)

	// Test IAM role exists
	role, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String(outputs.RoleName),
	})
	require.NoError(t, err, "Role should exist")
	assert.Contains(t, *role.Role.RoleName, "FinApp", "Role name should contain FinApp")
	assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "ec2.amazonaws.com", "Role should allow EC2 to assume it")

	// Test IAM policy exists
	policyArn := outputs.PolicyArn
	policy, err := iamClient.GetPolicy(ctx, &iam.GetPolicyInput{
		PolicyArn: aws.String(policyArn),
	})
	require.NoError(t, err, "Policy should exist")
	assert.Contains(t, *policy.Policy.PolicyName, "FinApp", "Policy name should contain FinApp")

	// Test policy is attached to role
	attachedPolicies, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
		RoleName: aws.String(outputs.RoleName),
	})
	require.NoError(t, err, "Should be able to list attached policies")

	found := false
	for _, attachedPolicy := range attachedPolicies.AttachedPolicies {
		if *attachedPolicy.PolicyArn == policyArn {
			found = true
			break
		}
	}
	assert.True(t, found, "Policy should be attached to role")

	// Test instance profile exists
	instanceProfileName := strings.Split(outputs.InstanceProfileArn, "/")[1]
	instanceProfile, err := iamClient.GetInstanceProfile(ctx, &iam.GetInstanceProfileInput{
		InstanceProfileName: aws.String(instanceProfileName),
	})
	require.NoError(t, err, "Instance profile should exist")
	assert.Contains(t, *instanceProfile.InstanceProfile.InstanceProfileName, "FinApp", "Instance profile should contain FinApp")
	assert.Len(t, instanceProfile.InstanceProfile.Roles, 1, "Instance profile should have one role")
	assert.Equal(t, outputs.RoleName, *instanceProfile.InstanceProfile.Roles[0].RoleName, "Instance profile should be associated with the correct role")
}

// TestCloudTrailActualConfiguration tests the actual CloudTrail configuration via AWS API
func TestCloudTrailActualConfiguration(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	cloudTrailClient := cloudtrail.NewFromConfig(cfg)

	// Extract trail name from ARN
	trailArnParts := strings.Split(outputs.CloudTrailArn, "/")
	trailName := trailArnParts[len(trailArnParts)-1]

	// Test CloudTrail exists and is configured correctly
	trail, err := cloudTrailClient.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{
		TrailNameList: []string{trailName},
	})
	require.NoError(t, err, "Should be able to describe trail")
	require.Len(t, trail.TrailList, 1, "Should find exactly one trail")

	trailConfig := trail.TrailList[0]
	assert.Contains(t, *trailConfig.Name, "FinApp", "Trail name should contain FinApp")
	assert.True(t, *trailConfig.IncludeGlobalServiceEvents, "Trail should include global service events")
	assert.True(t, *trailConfig.LogFileValidationEnabled, "Trail should have log file validation enabled")
	assert.NotNil(t, trailConfig.S3BucketName, "Trail should have S3 bucket configured")

	// Test CloudTrail status
	status, err := cloudTrailClient.GetTrailStatus(ctx, &cloudtrail.GetTrailStatusInput{
		Name: aws.String(trailName),
	})
	require.NoError(t, err, "Should be able to get trail status")
	assert.True(t, *status.IsLogging, "CloudTrail should be actively logging")
}

// TestEndToEndWorkflow tests the complete workflow with actual AWS API calls
func TestEndToEndWorkflow(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)
	iamClient := iam.NewFromConfig(cfg)
	cloudTrailClient := cloudtrail.NewFromConfig(cfg)

	// Step 1: Verify S3 bucket is created with security features
	assert.NotEmpty(t, outputs.BucketName, "S3 bucket should be created")
	_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.BucketName),
	})
	assert.NoError(t, err, "S3 bucket should exist and be accessible")

	// Step 2: Verify IAM resources for access control
	assert.NotEmpty(t, outputs.RoleArn, "IAM role should be created")
	_, err = iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String(outputs.RoleName),
	})
	assert.NoError(t, err, "IAM role should exist")

	assert.NotEmpty(t, outputs.PolicyArn, "IAM policy should be created")
	_, err = iamClient.GetPolicy(ctx, &iam.GetPolicyInput{
		PolicyArn: aws.String(outputs.PolicyArn),
	})
	assert.NoError(t, err, "IAM policy should exist")

	// Step 3: Verify audit infrastructure
	assert.NotEmpty(t, outputs.CloudTrailArn, "CloudTrail should be configured")
	trailArnParts := strings.Split(outputs.CloudTrailArn, "/")
	trailName := trailArnParts[len(trailArnParts)-1]
	_, err = cloudTrailClient.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{
		TrailNameList: []string{trailName},
	})
	assert.NoError(t, err, "CloudTrail should exist")

	// Step 4: Verify security configurations via API
	encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.BucketName),
	})
	assert.NoError(t, err, "Should be able to verify encryption")
	assert.NotNil(t, encryption.ServerSideEncryptionConfiguration, "Encryption should be configured")

	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.BucketName),
	})
	assert.NoError(t, err, "Should be able to verify versioning")
	assert.Equal(t, "Enabled", string(versioning.Status), "Versioning should be enabled")

	publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.BucketName),
	})
	assert.NoError(t, err, "Should be able to verify public access block")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls, "Public access should be blocked")
}

// TestS3BucketPolicyEnforcement tests that the bucket policy actually enforces SSL
func TestS3BucketPolicyEnforcement(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)

	// Test that bucket policy exists and contains SSL enforcement
	bucketPolicy, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get bucket policy")

	policyDocument := *bucketPolicy.Policy
	assert.Contains(t, policyDocument, "aws:SecureTransport", "Policy should check for secure transport")
	assert.Contains(t, policyDocument, "\"false\"", "Policy should deny when SecureTransport is false")
	assert.Contains(t, policyDocument, "Deny", "Policy should have deny effect")
	assert.Contains(t, policyDocument, "s3:*", "Policy should apply to all S3 actions")
}

// TestIAMPolicyPermissions tests that the IAM policy has appropriate S3 permissions
func TestIAMPolicyPermissions(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	iamClient := iam.NewFromConfig(cfg)

	// Get the policy version
	policy, err := iamClient.GetPolicy(ctx, &iam.GetPolicyInput{
		PolicyArn: aws.String(outputs.PolicyArn),
	})
	require.NoError(t, err, "Should be able to get policy")

	// Get the policy document
	policyVersion, err := iamClient.GetPolicyVersion(ctx, &iam.GetPolicyVersionInput{
		PolicyArn: aws.String(outputs.PolicyArn),
		VersionId: policy.Policy.DefaultVersionId,
	})
	require.NoError(t, err, "Should be able to get policy version")

	policyDocument := *policyVersion.PolicyVersion.Document

	// URL decode the policy document

	decodedPolicy, err := url.QueryUnescape(policyDocument)
	require.NoError(t, err, "Should be able to decode policy document")

	// Parse as JSON to validate structure
	var policyJSON map[string]interface{}
	err = json.Unmarshal([]byte(decodedPolicy), &policyJSON)
	require.NoError(t, err, "Policy should be valid JSON")

	// Check policy contains required permissions
	assert.Contains(t, decodedPolicy, "s3:ListBucket", "Policy should allow listing bucket")
	assert.Contains(t, decodedPolicy, "s3:GetObject", "Policy should allow getting objects")
	assert.Contains(t, decodedPolicy, "s3:PutObject", "Policy should allow putting objects")
	assert.Contains(t, decodedPolicy, outputs.BucketName, "Policy should reference the correct bucket")

	// Verify policy structure
	statements, ok := policyJSON["Statement"].([]interface{})
	require.True(t, ok, "Policy should have Statement array")
	assert.GreaterOrEqual(t, len(statements), 2, "Policy should have at least 2 statements")
}

// TestResourceTagging tests that resources are properly tagged
func TestResourceTagging(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)
	iamClient := iam.NewFromConfig(cfg)

	// Test S3 bucket tags
	bucketTags, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Should be able to get bucket tags")

	tagMap := make(map[string]string)
	for _, tag := range bucketTags.TagSet {
		tagMap[*tag.Key] = *tag.Value
	}

	assert.Equal(t, "FinApp", tagMap["Project"], "Bucket should have Project tag set to FinApp")
	assert.Equal(t, "Production", tagMap["Environment"], "Bucket should have Environment tag set to Production")
	assert.Contains(t, tagMap["Purpose"], "Financial", "Bucket should have Purpose tag mentioning Financial")

	// Test IAM role tags
	roleTags, err := iamClient.ListRoleTags(ctx, &iam.ListRoleTagsInput{
		RoleName: aws.String(outputs.RoleName),
	})
	require.NoError(t, err, "Should be able to get role tags")

	roleTagMap := make(map[string]string)
	for _, tag := range roleTags.Tags {
		roleTagMap[*tag.Key] = *tag.Value
	}

	assert.Equal(t, "FinApp", roleTagMap["Project"], "Role should have Project tag set to FinApp")
	assert.Equal(t, "Production", roleTagMap["Environment"], "Role should have Environment tag set to Production")
}

// TestSecurityComplianceIntegration tests end-to-end security compliance
func TestSecurityComplianceIntegration(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(ctx)
	require.NoError(t, err, "Failed to load AWS config")

	s3Client := s3.NewFromConfig(cfg)
	cloudTrailClient := cloudtrail.NewFromConfig(cfg)

	// Test 1: Encryption at rest
	encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Encryption should be configured")
	assert.Equal(t, "AES256", string(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm), "Should use AES256 encryption")

	// Test 2: Encryption in transit (SSL enforcement)
	bucketPolicy, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "SSL policy should be configured")
	assert.Contains(t, *bucketPolicy.Policy, "aws:SecureTransport", "Should enforce SSL")

	// Test 3: Access controls (public access blocked)
	publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Public access block should be configured")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls, "Public ACLs should be blocked")
	assert.True(t, *publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy, "Public policies should be blocked")

	// Test 4: Audit logging (CloudTrail)
	trailArnParts := strings.Split(outputs.CloudTrailArn, "/")
	trailName := trailArnParts[len(trailArnParts)-1]
	status, err := cloudTrailClient.GetTrailStatus(ctx, &cloudtrail.GetTrailStatusInput{
		Name: aws.String(trailName),
	})
	require.NoError(t, err, "CloudTrail should be accessible")
	assert.True(t, *status.IsLogging, "CloudTrail should be actively logging")

	// Test 5: Versioning for audit trails
	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.BucketName),
	})
	require.NoError(t, err, "Versioning should be configured")
	assert.Equal(t, "Enabled", string(versioning.Status), "Versioning should be enabled for audit trails")
}
