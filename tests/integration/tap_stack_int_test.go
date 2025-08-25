//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/accessanalyzer"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type TapStackOutputs struct {
	AccessAnalyzerArn string `json:"access_analyzer_arn"`
	BucketArn         string `json:"bucket_arn"`
	BucketName        string `json:"bucket_name"`
	DynamoDBTableArn  string `json:"dynamodb_table_arn"`
	DynamoDBTableName string `json:"dynamodb_table_name"`
	IAMRoleArn        string `json:"iam_role_arn"`
	IAMRoleName       string `json:"iam_role_name"`
}

type Outputs struct {
	TapStack TapStackOutputs `json:"TapStack"`
}

func loadOutputs(t *testing.T) *TapStackOutputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var outputs Outputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs: %v", err)
	}

	return &outputs.TapStack
}

func TestDeployedInfrastructure(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}
	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	// Test IAM Role exists
	t.Run("IAMRoleExists", func(t *testing.T) {
		iamClient := iam.NewFromConfig(cfg)

		roleOutput, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(outputs.IAMRoleName),
		})
		if err != nil {
			t.Errorf("failed to get IAM role: %v", err)
		}
		if roleOutput.Role == nil {
			t.Error("IAM role should not be nil")
		}

		// Verify role ARN matches output
		if *roleOutput.Role.Arn != outputs.IAMRoleArn {
			t.Errorf("Expected role ARN %s, got %s", outputs.IAMRoleArn, *roleOutput.Role.Arn)
		}

		// Verify trust policy contains Lambda service principal
		if roleOutput.Role.AssumeRolePolicyDocument == nil {
			t.Error("Role should have an assume role policy")
		} else {
			policyDoc := *roleOutput.Role.AssumeRolePolicyDocument
			if !strings.Contains(policyDoc, "lambda.amazonaws.com") {
				t.Error("Role should trust Lambda service")
			}
		}
	})

	// Test S3 Bucket security settings
	t.Run("S3BucketSecurity", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket exists and ARN matches
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to access S3 bucket: %v", err)
		}

		// Verify bucket ARN format
		expectedArn := fmt.Sprintf("arn:aws:s3:::%s", outputs.BucketName)
		if outputs.BucketArn != expectedArn {
			t.Errorf("Expected bucket ARN %s, got %s", expectedArn, outputs.BucketArn)
		}

		// Check public access is blocked
		publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to get public access block configuration: %v", err)
		}

		if publicAccessBlock.PublicAccessBlockConfiguration != nil {
			if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls) {
				t.Error("Expected BlockPublicAcls to be true")
			}
			if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy) {
				t.Error("Expected BlockPublicPolicy to be true")
			}
			if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls) {
				t.Error("Expected IgnorePublicAcls to be true")
			}
			if !aws.ToBool(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets) {
				t.Error("Expected RestrictPublicBuckets to be true")
			}
		}

		// Check encryption
		encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to get encryption configuration: %v", err)
		}

		if encryption.ServerSideEncryptionConfiguration == nil ||
			len(encryption.ServerSideEncryptionConfiguration.Rules) == 0 {
			t.Error("Expected encryption to be configured")
		} else {
			rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
			if rule.ApplyServerSideEncryptionByDefault == nil ||
				string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm) != "AES256" {
				t.Error("Expected AES256 encryption")
			}
		}

		// Check versioning
		versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to get versioning configuration: %v", err)
		}

		if versioning.Status != "Enabled" {
			t.Errorf("Expected versioning to be Enabled, got %v", versioning.Status)
		}

		// Check bucket policy for HTTPS enforcement
		bucketPolicy, err := s3Client.GetBucketPolicy(ctx, &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to get bucket policy: %v", err)
		} else {
			policyDoc := *bucketPolicy.Policy
			if !strings.Contains(policyDoc, "DenyInsecureConnections") {
				t.Error("Expected bucket policy to deny insecure connections")
			}
			if !strings.Contains(policyDoc, "aws:SecureTransport") {
				t.Error("Expected bucket policy to enforce HTTPS")
			}
		}
	})

	// Test DynamoDB Table exists and has encryption
	t.Run("DynamoDBTableSecurity", func(t *testing.T) {
		dynamoClient := dynamodb.NewFromConfig(cfg)

		tableOutput, err := dynamoClient.DescribeTable(ctx, &dynamodb.DescribeTableInput{
			TableName: aws.String(outputs.DynamoDBTableName),
		})
		if err != nil {
			t.Errorf("failed to describe DynamoDB table: %v", err)
		}

		if tableOutput.Table == nil {
			t.Error("DynamoDB table should not be nil")
		}

		// Verify table ARN matches output
		if *tableOutput.Table.TableArn != outputs.DynamoDBTableArn {
			t.Errorf("Expected table ARN %s, got %s", outputs.DynamoDBTableArn, *tableOutput.Table.TableArn)
		}

		// Check table status
		if tableOutput.Table != nil && tableOutput.Table.TableStatus != "ACTIVE" {
			t.Errorf("Expected table status to be ACTIVE, got %v", tableOutput.Table.TableStatus)
		}

		// Check billing mode is PAY_PER_REQUEST
		if tableOutput.Table.BillingModeSummary == nil ||
			tableOutput.Table.BillingModeSummary.BillingMode != "PAY_PER_REQUEST" {
			t.Error("Expected billing mode to be PAY_PER_REQUEST")
		}

		// Check hash key is 'id'
		if len(tableOutput.Table.KeySchema) == 0 ||
			*tableOutput.Table.KeySchema[0].AttributeName != "id" ||
			tableOutput.Table.KeySchema[0].KeyType != "HASH" {
			t.Error("Expected hash key to be 'id'")
		}

		// Check encryption
		if tableOutput.Table.SSEDescription == nil ||
			tableOutput.Table.SSEDescription.Status != "ENABLED" {
			t.Error("Expected encryption to be enabled")
		}

		// Check point-in-time recovery
		backups, err := dynamoClient.DescribeContinuousBackups(ctx, &dynamodb.DescribeContinuousBackupsInput{
			TableName: aws.String(outputs.DynamoDBTableName),
		})
		if err != nil {
			t.Errorf("failed to describe continuous backups: %v", err)
		}

		if backups.ContinuousBackupsDescription == nil ||
			backups.ContinuousBackupsDescription.PointInTimeRecoveryDescription == nil ||
			backups.ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus != "ENABLED" {
			t.Error("Expected point-in-time recovery to be enabled")
		}
	})

	// Test IAM Access Analyzer exists
	t.Run("AccessAnalyzerExists", func(t *testing.T) {
		analyzerClient := accessanalyzer.NewFromConfig(cfg)

		// Extract analyzer name from ARN
		arnParts := strings.Split(outputs.AccessAnalyzerArn, "/")
		analyzerName := arnParts[len(arnParts)-1]

		analyzer, err := analyzerClient.GetAnalyzer(ctx, &accessanalyzer.GetAnalyzerInput{
			AnalyzerName: aws.String(analyzerName),
		})
		if err != nil {
			t.Errorf("failed to get access analyzer: %v", err)
		}

		if analyzer.Analyzer == nil {
			t.Error("Access analyzer should not be nil")
		}

		// Verify analyzer ARN matches output
		if *analyzer.Analyzer.Arn != outputs.AccessAnalyzerArn {
			t.Errorf("Expected analyzer ARN %s, got %s", outputs.AccessAnalyzerArn, *analyzer.Analyzer.Arn)
		}

		if analyzer.Analyzer != nil && string(analyzer.Analyzer.Type) != "ACCOUNT" {
			t.Errorf("Expected analyzer type to be ACCOUNT, got %v", analyzer.Analyzer.Type)
		}

		// Check analyzer status
		if analyzer.Analyzer.Status != "ACTIVE" {
			t.Errorf("Expected analyzer status to be ACTIVE, got %v", analyzer.Analyzer.Status)
		}
	})

}

// Test resource tagging compliance
func TestResourceTagging(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("S3BucketTags", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		tagging, err := s3Client.GetBucketTagging(ctx, &s3.GetBucketTaggingInput{
			Bucket: aws.String(outputs.BucketName),
		})
		if err != nil {
			t.Errorf("failed to get bucket tagging: %v", err)
		}

		expectedTags := map[string]string{
			"Project":     "SecureApp",
			"Environment": "Production",
			"ManagedBy":   "CDKTF",
		}

		for _, tag := range tagging.TagSet {
			if expectedValue, exists := expectedTags[*tag.Key]; exists {
				if *tag.Value != expectedValue {
					t.Errorf("Expected tag %s to have value %s, got %s", *tag.Key, expectedValue, *tag.Value)
				}
			}
		}
	})

	t.Run("DynamoDBTableTags", func(t *testing.T) {
		dynamoClient := dynamodb.NewFromConfig(cfg)

		tags, err := dynamoClient.ListTagsOfResource(ctx, &dynamodb.ListTagsOfResourceInput{
			ResourceArn: aws.String(outputs.DynamoDBTableArn),
		})
		if err != nil {
			t.Errorf("failed to get table tags: %v", err)
		}

		expectedTags := map[string]string{
			"Project":     "SecureApp",
			"Environment": "Production",
			"ManagedBy":   "CDKTF",
		}

		tagMap := make(map[string]string)
		for _, tag := range tags.Tags {
			tagMap[*tag.Key] = *tag.Value
		}

		for key, expectedValue := range expectedTags {
			if actualValue, exists := tagMap[key]; !exists {
				t.Errorf("Expected tag %s not found", key)
			} else if actualValue != expectedValue {
				t.Errorf("Expected tag %s to have value %s, got %s", key, expectedValue, actualValue)
			}
		}
	})
}

// Test security compliance
func TestSecurityCompliance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	t.Run("IAMRoleTrustPolicy", func(t *testing.T) {
		iamClient := iam.NewFromConfig(cfg)

		roleOutput, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(outputs.IAMRoleName),
		})
		if err != nil {
			t.Errorf("failed to get IAM role: %v", err)
		}

		if roleOutput.Role.AssumeRolePolicyDocument != nil {
			policyDoc := *roleOutput.Role.AssumeRolePolicyDocument
			// Verify basic trust policy structure
			if !strings.Contains(policyDoc, "lambda.amazonaws.com") {
				t.Error("Expected role trust policy to include Lambda service")
			}
		}
	})

	t.Run("IAMPolicyPermissions", func(t *testing.T) {
		iamClient := iam.NewFromConfig(cfg)

		// List attached policies
		attachedPolicies, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(outputs.IAMRoleName),
		})
		if err != nil {
			t.Errorf("failed to list attached policies: %v", err)
		}

		if len(attachedPolicies.AttachedPolicies) == 0 {
			t.Error("Expected at least one policy to be attached to role")
		}

		// Check policy document for least privilege
		for _, policy := range attachedPolicies.AttachedPolicies {
			policyVersion, err := iamClient.GetPolicyVersion(ctx, &iam.GetPolicyVersionInput{
				PolicyArn: policy.PolicyArn,
				VersionId: aws.String("v1"),
			})
			if err != nil {
				continue // Skip if can't get policy version
			}

			if policyVersion.PolicyVersion.Document != nil {
				policyDoc := *policyVersion.PolicyVersion.Document
				// Check for specific S3 and DynamoDB permissions
				if strings.Contains(policyDoc, "s3:*") {
					t.Error("Policy should not grant wildcard S3 permissions")
				}
				if strings.Contains(policyDoc, "dynamodb:*") {
					t.Error("Policy should not grant wildcard DynamoDB permissions")
				}
				// Check for encryption requirements
				if !strings.Contains(policyDoc, "s3:x-amz-server-side-encryption") {
					t.Error("Policy should enforce S3 encryption")
				}
			}
		}
	})
}

// Test resource naming conventions
func TestNamingConventions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("ResourceNaming", func(t *testing.T) {
		// Check IAM role name follows convention
		if !strings.HasPrefix(outputs.IAMRoleName, "SecureApp-Role-") {
			t.Errorf("IAM role name should start with 'SecureApp-Role-', got %s", outputs.IAMRoleName)
		}

		// Check S3 bucket name follows convention
		if !strings.HasPrefix(outputs.BucketName, "secureapp-bucket-") {
			t.Errorf("S3 bucket name should start with 'secureapp-bucket-', got %s", outputs.BucketName)
		}

		// Check DynamoDB table name follows convention
		if !strings.HasPrefix(outputs.DynamoDBTableName, "SecureApp-Table-") {
			t.Errorf("DynamoDB table name should start with 'SecureApp-Table-', got %s", outputs.DynamoDBTableName)
		}

		// Check Access Analyzer ARN contains expected name pattern
		if !strings.Contains(outputs.AccessAnalyzerArn, "SecureApp-AccessAnalyzer-") {
			t.Errorf("Access Analyzer ARN should contain 'SecureApp-AccessAnalyzer-', got %s", outputs.AccessAnalyzerArn)
		}
	})

	t.Run("ARNFormats", func(t *testing.T) {
		// Validate ARN formats
		arnPatterns := map[string]string{
			"IAM Role":        `^arn:aws:iam::\d+:role/SecureApp-Role-.*`,
			"S3 Bucket":       `^arn:aws:s3:::secureapp-bucket-.*`,
			"DynamoDB Table":  `^arn:aws:dynamodb:us-east-1:\d+:table/SecureApp-Table-.*`,
			"Access Analyzer": `^arn:aws:access-analyzer:us-east-1:\d+:analyzer/SecureApp-AccessAnalyzer-.*`,
		}

		arns := map[string]string{
			"IAM Role":        outputs.IAMRoleArn,
			"S3 Bucket":       outputs.BucketArn,
			"DynamoDB Table":  outputs.DynamoDBTableArn,
			"Access Analyzer": outputs.AccessAnalyzerArn,
		}

		for resourceType, pattern := range arnPatterns {
			matched, err := regexp.MatchString(pattern, arns[resourceType])
			if err != nil {
				t.Errorf("Error matching pattern for %s: %v", resourceType, err)
			}
			if !matched {
				t.Errorf("%s ARN format is invalid: %s (expected pattern: %s)", resourceType, arns[resourceType], pattern)
			}
		}
	})
}

// Test output completeness
func TestOutputCompleteness(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	outputs := loadOutputs(t)

	t.Run("AllOutputsPresent", func(t *testing.T) {
		requiredOutputs := map[string]string{
			"AccessAnalyzerArn": outputs.AccessAnalyzerArn,
			"BucketArn":         outputs.BucketArn,
			"BucketName":        outputs.BucketName,
			"DynamoDBTableArn":  outputs.DynamoDBTableArn,
			"DynamoDBTableName": outputs.DynamoDBTableName,
			"IAMRoleArn":        outputs.IAMRoleArn,
			"IAMRoleName":       outputs.IAMRoleName,
		}

		for outputName, outputValue := range requiredOutputs {
			if outputValue == "" {
				t.Errorf("Output %s is empty", outputName)
			}
		}
	})

	t.Run("OutputConsistency", func(t *testing.T) {
		// Check that names in ARNs match the name outputs
		if !strings.Contains(outputs.IAMRoleArn, outputs.IAMRoleName) {
			t.Error("IAM role name should be contained in IAM role ARN")
		}

		if !strings.Contains(outputs.BucketArn, outputs.BucketName) {
			t.Error("Bucket name should be contained in bucket ARN")
		}

		if !strings.Contains(outputs.DynamoDBTableArn, outputs.DynamoDBTableName) {
			t.Error("DynamoDB table name should be contained in table ARN")
		}
	})
}
