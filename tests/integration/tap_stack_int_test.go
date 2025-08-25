//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/accessanalyzer"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Outputs struct {
	IAMRoleArn         string `json:"iam_role_arn"`
	S3BucketName       string `json:"s3_bucket_name"`
	DynamoDBTableName  string `json:"dynamodb_table_name"`
	AccessAnalyzerName string `json:"access_analyzer_name"`
	IAMPolicyArn       string `json:"iam_policy_arn"`
}

func loadOutputs(t *testing.T) *Outputs {
	data, err := os.ReadFile("../../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Fatalf("Failed to read outputs file: %v", err)
	}

	var outputs Outputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("Failed to parse outputs: %v", err)
	}

	return &outputs
}

func TestDeployedInfrastructure(t *testing.T) {
	outputs := loadOutputs(t)
	ctx := context.Background()

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("unable to load AWS config: %v", err)
	}

	// Test IAM Role exists
	t.Run("IAMRoleExists", func(t *testing.T) {
		iamClient := iam.NewFromConfig(cfg)

		// Extract role name from ARN
		roleName := "SecureApp-Role-str968v2"

		roleOutput, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		if err != nil {
			t.Errorf("failed to get IAM role: %v", err)
		}
		if roleOutput.Role == nil {
			t.Error("IAM role should not be nil")
		}

		// Verify trust policy
		if roleOutput.Role.AssumeRolePolicyDocument == nil {
			t.Error("Role should have an assume role policy")
		}
	})

	// Test S3 Bucket security settings
	t.Run("S3BucketSecurity", func(t *testing.T) {
		s3Client := s3.NewFromConfig(cfg)

		// Check bucket exists
		_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to access S3 bucket: %v", err)
		}

		// Check public access is blocked
		publicAccessBlock, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3BucketName),
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
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to get encryption configuration: %v", err)
		}

		if encryption.ServerSideEncryptionConfiguration == nil ||
			len(encryption.ServerSideEncryptionConfiguration.Rules) == 0 {
			t.Error("Expected encryption to be configured")
		}

		// Check versioning
		versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		if err != nil {
			t.Errorf("failed to get versioning configuration: %v", err)
		}

		if versioning.Status != "Enabled" {
			t.Errorf("Expected versioning to be Enabled, got %v", versioning.Status)
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

		// Check table status
		if tableOutput.Table != nil && tableOutput.Table.TableStatus != "ACTIVE" {
			t.Errorf("Expected table status to be ACTIVE, got %v", tableOutput.Table.TableStatus)
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

		analyzer, err := analyzerClient.GetAnalyzer(ctx, &accessanalyzer.GetAnalyzerInput{
			AnalyzerName: aws.String(outputs.AccessAnalyzerName),
		})
		if err != nil {
			t.Errorf("failed to get access analyzer: %v", err)
		}

		if analyzer.Analyzer == nil {
			t.Error("Access analyzer should not be nil")
		}

		if analyzer.Analyzer != nil && string(analyzer.Analyzer.Type) != "ACCOUNT" {
			t.Errorf("Expected analyzer type to be ACCOUNT, got %v", analyzer.Analyzer.Type)
		}
	})

	// Test IAM Policy exists and attachments
	t.Run("IAMPolicyConfiguration", func(t *testing.T) {
		iamClient := iam.NewFromConfig(cfg)

		// Get policy
		policy, err := iamClient.GetPolicy(ctx, &iam.GetPolicyInput{
			PolicyArn: aws.String(outputs.IAMPolicyArn),
		})
		if err != nil {
			t.Errorf("failed to get IAM policy: %v", err)
		}

		if policy.Policy == nil {
			t.Error("IAM policy should not be nil")
		}

		// Check policy is attached to role
		roleName := "SecureApp-Role-str968v2"
		attachedPolicies, err := iamClient.ListAttachedRolePolicies(ctx, &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		if err != nil {
			t.Errorf("failed to list attached policies: %v", err)
		}

		policyAttached := false
		for _, attached := range attachedPolicies.AttachedPolicies {
			if *attached.PolicyArn == outputs.IAMPolicyArn {
				policyAttached = true
				break
			}
		}

		if !policyAttached {
			t.Error("Expected policy to be attached to role")
		}
	})
}
