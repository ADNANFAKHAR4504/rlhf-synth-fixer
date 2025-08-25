//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type AWSClients struct {
	EC2            *ec2.Client
	S3             *s3.Client
	IAM            *iam.Client
	KMS            *kms.Client
	CloudTrail     *cloudtrail.Client
	SecretsManager *secretsmanager.Client
	Lambda         *lambda.Client
	CloudWatch     *cloudwatch.Client
}

type DeploymentOutputs struct {
	VpcId                  string `json:"vpcId"`
	KmsKeyId               string `json:"kmsKeyId"`
	KmsKeyArn              string `json:"kmsKeyArn"`
	PhiBucketName          string `json:"phiBucketName"`
	AuditBucketName        string `json:"auditBucketName"`
	CloudTrailArn          string `json:"cloudTrailArn"`
	DbSecretArn            string `json:"dbSecretArn"`
	ApiKeySecretArn        string `json:"apiKeySecretArn"`
	AppRoleArn             string `json:"appRoleArn"`
	LambdaRoleArn          string `json:"lambdaRoleArn"`
	LambdaFunctionArn      string `json:"lambdaFunctionArn"`
	PublicSubnet1Id        string `json:"publicSubnet1Id"`
	PublicSubnet2Id        string `json:"publicSubnet2Id"`
	PrivateSubnet1Id       string `json:"privateSubnet1Id"`
	PrivateSubnet2Id       string `json:"privateSubnet2Id"`
	BastionSecurityGroupId string `json:"bastionSecurityGroupId"`
	LambdaSecurityGroupId  string `json:"lambdaSecurityGroupId"`
	InternetGatewayId      string `json:"internetGatewayId"`
	NatGateway1Id          string `json:"natGateway1Id"`
	NatGateway2Id          string `json:"natGateway2Id"`
}

var (
	awsClients *AWSClients
	outputs    *DeploymentOutputs
)

func TestMain(m *testing.M) {
	setupAWSClients()
	loadDeploymentOutputs()
	code := m.Run()
	os.Exit(code)
}

func setupAWSClients() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	awsClients = &AWSClients{
		EC2:            ec2.NewFromConfig(cfg),
		S3:             s3.NewFromConfig(cfg),
		IAM:            iam.NewFromConfig(cfg),
		KMS:            kms.NewFromConfig(cfg),
		CloudTrail:     cloudtrail.NewFromConfig(cfg),
		SecretsManager: secretsmanager.NewFromConfig(cfg),
		Lambda:         lambda.NewFromConfig(cfg),
		CloudWatch:     cloudwatch.NewFromConfig(cfg),
	}
}

func loadDeploymentOutputs() {
	outputs = &DeploymentOutputs{}

	if data, err := ioutil.ReadFile("pulumi-outputs.json"); err == nil {
		if err := json.Unmarshal(data, outputs); err != nil {
			fmt.Printf("Failed to parse outputs: %v\n", err)
		}
	}
}

func TestVPCIntegration(t *testing.T) {
	if outputs.VpcId == "" {
		t.Skip("VPC ID not available in outputs")
	}

	t.Run("should verify VPC exists and is configured correctly", func(t *testing.T) {
		vpc, err := awsClients.EC2.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
		require.NoError(t, err)
		require.Len(t, vpc.Vpcs, 1)

		assert.Equal(t, "10.0.0.0/16", *vpc.Vpcs[0].CidrBlock)
		assert.True(t, *vpc.Vpcs[0].EnableDnsHostnames)
		assert.True(t, *vpc.Vpcs[0].EnableDnsSupport)
	})
}

func TestPrivateSubnetsIntegration(t *testing.T) {
	if outputs.PrivateSubnet1Id == "" || outputs.PrivateSubnet2Id == "" {
		t.Skip("Private subnet IDs not available in outputs")
	}

	t.Run("should verify private subnets exist in different AZs", func(t *testing.T) {
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			SubnetIds: []string{outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id},
		})
		require.NoError(t, err)
		require.Len(t, subnets.Subnets, 2)

		subnet1 := subnets.Subnets[0]
		subnet2 := subnets.Subnets[1]

		assert.Equal(t, outputs.VpcId, *subnet1.VpcId)
		assert.Equal(t, outputs.VpcId, *subnet2.VpcId)
		assert.NotEqual(t, *subnet1.AvailabilityZone, *subnet2.AvailabilityZone)
		assert.Equal(t, "10.0.1.0/24", *subnet1.CidrBlock)
		assert.Equal(t, "10.0.2.0/24", *subnet2.CidrBlock)
	})
}

func TestKMSKeyIntegration(t *testing.T) {
	if outputs.KmsKeyId == "" {
		t.Skip("KMS key ID not available in outputs")
	}

	t.Run("should verify KMS key exists and is configured correctly", func(t *testing.T) {
		key, err := awsClients.KMS.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		require.NoError(t, err)

		assert.Equal(t, "ENCRYPT_DECRYPT", string(key.KeyMetadata.KeyUsage))
		assert.True(t, *key.KeyMetadata.Enabled)

		alias, err := awsClients.KMS.ListAliases(context.TODO(), &kms.ListAliasesInput{
			KeyId: aws.String(outputs.KmsKeyId),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, alias.Aliases)
		assert.Contains(t, *alias.Aliases[0].AliasName, "healthapp-key")
	})
}

func TestPHIBucketIntegration(t *testing.T) {
	if outputs.PhiBucketName == "" {
		t.Skip("PHI bucket name not available in outputs")
	}

	t.Run("should verify PHI bucket exists with proper security", func(t *testing.T) {
		_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.PhiBucketName),
		})
		require.NoError(t, err)

		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.PhiBucketName),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)
		assert.Equal(t, "aws:kms", string(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))

		versioning, err := awsClients.S3.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.PhiBucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioning.Status))

		pab, err := awsClients.S3.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.PhiBucketName),
		})
		require.NoError(t, err)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})
}

func TestAuditBucketIntegration(t *testing.T) {
	if outputs.AuditBucketName == "" {
		t.Skip("Audit bucket name not available in outputs")
	}

	t.Run("should verify audit bucket exists with CloudTrail policy", func(t *testing.T) {
		_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.AuditBucketName),
		})
		require.NoError(t, err)

		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.AuditBucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "aws:kms", string(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))

		policy, err := awsClients.S3.GetBucketPolicy(context.TODO(), &s3.GetBucketPolicyInput{
			Bucket: aws.String(outputs.AuditBucketName),
		})
		require.NoError(t, err)
		assert.Contains(t, *policy.Policy, "cloudtrail.amazonaws.com")
		assert.Contains(t, *policy.Policy, "s3:GetBucketAcl")
		assert.Contains(t, *policy.Policy, "s3:PutObject")
	})
}

func TestCloudTrailIntegration(t *testing.T) {
	if outputs.CloudTrailArn == "" {
		t.Skip("CloudTrail ARN not available in outputs")
	}

	t.Run("should verify CloudTrail is configured correctly", func(t *testing.T) {
		trailName := extractTrailNameFromArn(outputs.CloudTrailArn)
		trail, err := awsClients.CloudTrail.DescribeTrails(context.TODO(), &cloudtrail.DescribeTrailsInput{
			TrailNameList: []string{trailName},
		})
		require.NoError(t, err)
		require.Len(t, trail.TrailList, 1)

		assert.True(t, *trail.TrailList[0].IncludeGlobalServiceEvents)
		assert.True(t, *trail.TrailList[0].IsMultiRegionTrail)
		assert.True(t, *trail.TrailList[0].LogFileValidationEnabled)
		assert.Equal(t, outputs.AuditBucketName, *trail.TrailList[0].S3BucketName)

		status, err := awsClients.CloudTrail.GetTrailStatus(context.TODO(), &cloudtrail.GetTrailStatusInput{
			Name: aws.String(trailName),
		})
		require.NoError(t, err)
		assert.True(t, *status.IsLogging)
	})
}

func TestSecretsManagerIntegration(t *testing.T) {
	t.Run("should verify database secret exists", func(t *testing.T) {
		if outputs.DbSecretArn == "" {
			t.Skip("DB secret ARN not available in outputs")
		}

		secret, err := awsClients.SecretsManager.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
			SecretId: aws.String(outputs.DbSecretArn),
		})
		require.NoError(t, err)
		assert.Contains(t, *secret.Name, "healthapp/db/credentials")
		assert.Equal(t, outputs.KmsKeyArn, *secret.KmsKeyId)
	})

	t.Run("should verify API key secret exists", func(t *testing.T) {
		if outputs.ApiKeySecretArn == "" {
			t.Skip("API key secret ARN not available in outputs")
		}

		secret, err := awsClients.SecretsManager.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
			SecretId: aws.String(outputs.ApiKeySecretArn),
		})
		require.NoError(t, err)
		assert.Contains(t, *secret.Name, "healthapp/api/keys")
		assert.Equal(t, outputs.KmsKeyArn, *secret.KmsKeyId)
	})
}

func TestIAMRoleIntegration(t *testing.T) {
	if outputs.AppRoleArn == "" {
		t.Skip("App role ARN not available in outputs")
	}

	t.Run("should verify application role exists with correct policies", func(t *testing.T) {
		roleName := extractRoleNameFromArn(outputs.AppRoleArn)
		role, err := awsClients.IAM.GetRole(context.TODO(), &iam.GetRoleInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "ec2.amazonaws.com")

		policies, err := awsClients.IAM.ListAttachedRolePolicies(context.TODO(), &iam.ListAttachedRolePoliciesInput{
			RoleName: aws.String(roleName),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, policies.AttachedPolicies)

		for _, policy := range policies.AttachedPolicies {
			if strings.Contains(*policy.PolicyName, "s3-access") {
				policyDoc, err := awsClients.IAM.GetPolicy(context.TODO(), &iam.GetPolicyInput{
					PolicyArn: policy.PolicyArn,
				})
				require.NoError(t, err)
				assert.Contains(t, *policyDoc.Policy.PolicyName, "healthapp-s3-access")
			}
		}
	})
}

func TestE2EHIPAACompliance(t *testing.T) {
	t.Run("e2e: should meet HIPAA compliance requirements", func(t *testing.T) {
		// Verify encryption at rest
		if outputs.PhiBucketName != "" {
			encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
				Bucket: aws.String(outputs.PhiBucketName),
			})
			require.NoError(t, err)
			assert.Equal(t, "aws:kms", string(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm))
		}

		// Verify audit logging
		if outputs.CloudTrailArn != "" {
			trailName := extractTrailNameFromArn(outputs.CloudTrailArn)
			status, err := awsClients.CloudTrail.GetTrailStatus(context.TODO(), &cloudtrail.GetTrailStatusInput{
				Name: aws.String(trailName),
			})
			require.NoError(t, err)
			assert.True(t, *status.IsLogging)
		}

		// Verify network isolation
		if outputs.VpcId != "" {
			vpc, err := awsClients.EC2.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
				VpcIds: []string{outputs.VpcId},
			})
			require.NoError(t, err)
			assert.Len(t, vpc.Vpcs, 1)
		}
	})
}

func TestE2EResourceTagging(t *testing.T) {
	t.Run("e2e: should tag all resources with compliance tags", func(t *testing.T) {
		if outputs.PhiBucketName != "" {
			tags, err := awsClients.S3.GetBucketTagging(context.TODO(), &s3.GetBucketTaggingInput{
				Bucket: aws.String(outputs.PhiBucketName),
			})
			if err == nil {
				tagMap := make(map[string]string)
				for _, tag := range tags.TagSet {
					tagMap[*tag.Key] = *tag.Value
				}
				assert.Equal(t, "HealthApp", tagMap["Project"])
				assert.Equal(t, "Production", tagMap["Environment"])
				assert.Equal(t, "HIPAA", tagMap["Compliance"])
				assert.Equal(t, "pulumi", tagMap["ManagedBy"])
			}
		}
	})
}

func TestE2ESecretManagement(t *testing.T) {
	t.Run("e2e: should properly manage secrets with KMS encryption", func(t *testing.T) {
		secrets := []string{outputs.DbSecretArn, outputs.ApiKeySecretArn}
		for _, secretArn := range secrets {
			if secretArn != "" {
				secret, err := awsClients.SecretsManager.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
					SecretId: aws.String(secretArn),
				})
				require.NoError(t, err)
				assert.Equal(t, outputs.KmsKeyArn, *secret.KmsKeyId)
			}
		}
	})
}

func extractRoleNameFromArn(arn string) string {
	parts := strings.Split(arn, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}

func extractTrailNameFromArn(arn string) string {
	parts := strings.Split(arn, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}
