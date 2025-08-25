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
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type HealthAppOutputs struct {
	APIKeySecretArn        string `json:"apiKeySecretArn"`
	AppRoleArn             string `json:"appRoleArn"`
	AuditBucketName        string `json:"auditBucketName"`
	BastionSecurityGroupId string `json:"bastionSecurityGroupId"`
	CloudTrailArn          string `json:"cloudTrailArn"`
	DbSecretArn            string `json:"dbSecretArn"`
	InternetGatewayId      string `json:"internetGatewayId"`
	KmsKeyArn              string `json:"kmsKeyArn"`
	KmsKeyId               string `json:"kmsKeyId"`
	LambdaFunctionArn      string `json:"lambdaFunctionArn"`
	LambdaRoleArn          string `json:"lambdaRoleArn"`
	LambdaSecurityGroupId  string `json:"lambdaSecurityGroupId"`
	NatGateway1Id          string `json:"natGateway1Id"`
	NatGateway2Id          string `json:"natGateway2Id"`
	PhiBucketName          string `json:"phiBucketName"`
	PrivateSubnet1Id       string `json:"privateSubnet1Id"`
	PrivateSubnet2Id       string `json:"privateSubnet2Id"`
	PublicSubnet1Id        string `json:"publicSubnet1Id"`
	PublicSubnet2Id        string `json:"publicSubnet2Id"`
	VpcId                  string `json:"vpcId"`
}

var (
	awsConfig     config.Config
	ec2Client     *ec2.Client
	s3Client      *s3.Client
	kmsClient     *kms.Client
	iamClient     *iam.Client
	lambdaClient  *lambda.Client
	secretsClient *secretsmanager.Client
	trailClient   *cloudtrail.Client
	outputs       *HealthAppOutputs
)

func TestMain(m *testing.M) {
	setupAWSClients()
	loadDeploymentOutputs()
	os.Exit(m.Run())
}

func setupAWSClients() {
	var err error
	awsConfig, err = config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	ec2Client = ec2.NewFromConfig(awsConfig)
	s3Client = s3.NewFromConfig(awsConfig)
	kmsClient = kms.NewFromConfig(awsConfig)
	iamClient = iam.NewFromConfig(awsConfig)
	lambdaClient = lambda.NewFromConfig(awsConfig)
	secretsClient = secretsmanager.NewFromConfig(awsConfig)
	trailClient = cloudtrail.NewFromConfig(awsConfig)
}

func loadDeploymentOutputs() {
	data, err := ioutil.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		panic(fmt.Sprintf("Failed to load deployment outputs: %v", err))
	}

	outputs = &HealthAppOutputs{}
	if err := json.Unmarshal(data, outputs); err != nil {
		panic(fmt.Sprintf("Failed to parse deployment outputs: %v", err))
	}
}

func extractResourceNameFromArn(arn string) string {
	parts := strings.Split(arn, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}

func TestVPCExists(t *testing.T) {
	ctx := context.Background()

	vpc, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})

	require.NoError(t, err)
	require.Len(t, vpc.Vpcs, 1)
	assert.Equal(t, "10.0.0.0/16", *vpc.Vpcs[0].CidrBlock)

	// Check VPC attributes
	dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
		VpcId:     aws.String(outputs.VpcId),
		Attribute: ec2Types.VpcAttributeNameEnableDnsHostnames,
	})
	require.NoError(t, err)
	assert.True(t, *dnsHostnames.EnableDnsHostnames.Value)

	dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
		VpcId:     aws.String(outputs.VpcId),
		Attribute: ec2Types.VpcAttributeNameEnableDnsSupport,
	})
	require.NoError(t, err)
	assert.True(t, *dnsSupport.EnableDnsSupport.Value)
}

func TestSubnetsExist(t *testing.T) {
	ctx := context.Background()

	subnetIds := []string{
		outputs.PublicSubnet1Id,
		outputs.PublicSubnet2Id,
		outputs.PrivateSubnet1Id,
		outputs.PrivateSubnet2Id,
	}

	subnets, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
		SubnetIds: subnetIds,
	})

	require.NoError(t, err)
	require.Len(t, subnets.Subnets, 4)

	// Verify CIDR blocks
	expectedCIDRs := []string{"10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24", "10.0.40.0/24"}
	foundCIDRs := make([]string, 0, 4)
	for _, subnet := range subnets.Subnets {
		foundCIDRs = append(foundCIDRs, *subnet.CidrBlock)
	}

	for _, expectedCIDR := range expectedCIDRs {
		assert.Contains(t, foundCIDRs, expectedCIDR)
	}
}

func TestKMSKeyExists(t *testing.T) {
	ctx := context.Background()

	key, err := kmsClient.DescribeKey(ctx, &kms.DescribeKeyInput{
		KeyId: aws.String(outputs.KmsKeyId),
	})

	require.NoError(t, err)
	assert.Equal(t, outputs.KmsKeyArn, *key.KeyMetadata.Arn)
	assert.Equal(t, "ENCRYPT_DECRYPT", string(key.KeyMetadata.KeyUsage))
	assert.True(t, key.KeyMetadata.Enabled)
}

func TestS3BucketsExist(t *testing.T) {
	ctx := context.Background()

	// Test PHI bucket
	_, err := s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.PhiBucketName),
	})
	require.NoError(t, err)

	// Test audit bucket
	_, err = s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(outputs.AuditBucketName),
	})
	require.NoError(t, err)
}

func TestS3BucketEncryption(t *testing.T) {
	ctx := context.Background()

	encryption, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(outputs.PhiBucketName),
	})

	require.NoError(t, err)
	require.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)

	rule := encryption.ServerSideEncryptionConfiguration.Rules[0]
	assert.Equal(t, "aws:kms", string(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm))
	assert.Equal(t, outputs.KmsKeyArn, *rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID)

	// Test versioning
	versioning, err := s3Client.GetBucketVersioning(ctx, &s3.GetBucketVersioningInput{
		Bucket: aws.String(outputs.PhiBucketName),
	})
	require.NoError(t, err)
	assert.Equal(t, "Enabled", string(versioning.Status))

	// Test public access block
	pab, err := s3Client.GetPublicAccessBlock(ctx, &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(outputs.PhiBucketName),
	})
	require.NoError(t, err)
	assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicAcls)
	assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
	assert.True(t, *pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
	assert.True(t, *pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
}

func TestIAMRolesExist(t *testing.T) {
	ctx := context.Background()

	// Test application role
	appRoleName := extractResourceNameFromArn(outputs.AppRoleArn)
	appRole, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String(appRoleName),
	})
	require.NoError(t, err)
	assert.Contains(t, *appRole.Role.AssumeRolePolicyDocument, "ec2.amazonaws.com")

	// Test lambda role
	lambdaRoleName := extractResourceNameFromArn(outputs.LambdaRoleArn)
	lambdaRole, err := iamClient.GetRole(ctx, &iam.GetRoleInput{
		RoleName: aws.String(lambdaRoleName),
	})
	require.NoError(t, err)
	assert.Contains(t, *lambdaRole.Role.AssumeRolePolicyDocument, "lambda.amazonaws.com")
}

func TestLambdaFunctionExists(t *testing.T) {
	ctx := context.Background()

	functionName := extractResourceNameFromArn(outputs.LambdaFunctionArn)
	function, err := lambdaClient.GetFunction(ctx, &lambda.GetFunctionInput{
		FunctionName: aws.String(functionName),
	})

	require.NoError(t, err)
	assert.Equal(t, functionName, *function.Configuration.FunctionName)
	assert.Equal(t, "python3.9", string(function.Configuration.Runtime))
	assert.Equal(t, int32(256), *function.Configuration.MemorySize)
	assert.Equal(t, int32(30), *function.Configuration.Timeout)
	assert.Equal(t, outputs.LambdaRoleArn, *function.Configuration.Role)

	// Verify VPC configuration
	assert.NotNil(t, function.Configuration.VpcConfig)
	assert.Contains(t, function.Configuration.VpcConfig.SubnetIds, outputs.PrivateSubnet1Id)
	assert.Contains(t, function.Configuration.VpcConfig.SubnetIds, outputs.PrivateSubnet2Id)
	assert.Contains(t, function.Configuration.VpcConfig.SecurityGroupIds, outputs.LambdaSecurityGroupId)
}

func TestSecretsManagerSecrets(t *testing.T) {
	ctx := context.Background()

	// Test DB secret
	dbSecret, err := secretsClient.DescribeSecret(ctx, &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(outputs.DbSecretArn),
	})
	require.NoError(t, err)
	assert.Equal(t, outputs.DbSecretArn, *dbSecret.ARN)
	assert.Equal(t, outputs.KmsKeyId, *dbSecret.KmsKeyId)

	// Test API key secret
	apiSecret, err := secretsClient.DescribeSecret(ctx, &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(outputs.APIKeySecretArn),
	})
	require.NoError(t, err)
	assert.Equal(t, outputs.APIKeySecretArn, *apiSecret.ARN)
	assert.Equal(t, outputs.KmsKeyId, *apiSecret.KmsKeyId)
}

func TestCloudTrailExists(t *testing.T) {
	ctx := context.Background()

	trailName := extractResourceNameFromArn(outputs.CloudTrailArn)
	trails, err := trailClient.DescribeTrails(ctx, &cloudtrail.DescribeTrailsInput{
		TrailNameList: []string{trailName},
	})

	require.NoError(t, err)
	require.Len(t, trails.TrailList, 1)

	trail := trails.TrailList[0]
	assert.Equal(t, outputs.CloudTrailArn, *trail.TrailARN)
	assert.Equal(t, outputs.AuditBucketName, *trail.S3BucketName)
	assert.True(t, *trail.IncludeGlobalServiceEvents)
	assert.True(t, *trail.IsMultiRegionTrail)
	assert.True(t, *trail.LogFileValidationEnabled)
}

func TestSecurityGroupsExist(t *testing.T) {
	ctx := context.Background()

	// Test bastion security group
	bastionSG, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{outputs.BastionSecurityGroupId},
	})
	require.NoError(t, err)
	require.Len(t, bastionSG.SecurityGroups, 1)
	assert.Equal(t, outputs.VpcId, *bastionSG.SecurityGroups[0].VpcId)

	// Verify SSH access rule
	found := false
	for _, rule := range bastionSG.SecurityGroups[0].IpPermissions {
		if *rule.IpProtocol == "tcp" && *rule.FromPort == 22 && *rule.ToPort == 22 {
			found = true
			break
		}
	}
	assert.True(t, found, "Bastion SG should allow SSH")

	// Test lambda security group
	lambdaSG, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{outputs.LambdaSecurityGroupId},
	})
	require.NoError(t, err)
	require.Len(t, lambdaSG.SecurityGroups, 1)
	assert.Equal(t, outputs.VpcId, *lambdaSG.SecurityGroups[0].VpcId)
}

func TestResourceTagging(t *testing.T) {
	ctx := context.Background()

	// Test VPC tags
	vpc, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{outputs.VpcId},
	})
	require.NoError(t, err)
	require.Len(t, vpc.Vpcs, 1)

	tags := make(map[string]string)
	for _, tag := range vpc.Vpcs[0].Tags {
		tags[*tag.Key] = *tag.Value
	}

	assert.Equal(t, "HealthApp", tags["Project"])
	assert.Equal(t, "Production", tags["Environment"])
	assert.Equal(t, "HIPAA", tags["Compliance"])
	assert.Equal(t, "pulumi", tags["ManagedBy"])
}

func TestNATGatewaysExist(t *testing.T) {
	ctx := context.Background()

	natGateways, err := ec2Client.DescribeNatGateways(ctx, &ec2.DescribeNatGatewaysInput{
		NatGatewayIds: []string{outputs.NatGateway1Id, outputs.NatGateway2Id},
	})

	require.NoError(t, err)
	require.Len(t, natGateways.NatGateways, 2)

	for _, natGw := range natGateways.NatGateways {
		assert.Equal(t, "available", string(natGw.State))
		assert.Equal(t, outputs.VpcId, *natGw.VpcId)
		assert.True(t, *natGw.SubnetId == outputs.PublicSubnet1Id || *natGw.SubnetId == outputs.PublicSubnet2Id)
	}
}

func TestInternetGatewayExists(t *testing.T) {
	ctx := context.Background()

	igw, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
		InternetGatewayIds: []string{outputs.InternetGatewayId},
	})

	require.NoError(t, err)
	require.Len(t, igw.InternetGateways, 1)
	assert.Equal(t, "available", string(igw.InternetGateways[0].State))
	require.Len(t, igw.InternetGateways[0].Attachments, 1)
	assert.Equal(t, outputs.VpcId, *igw.InternetGateways[0].Attachments[0].VpcId)
	assert.Equal(t, "available", string(igw.InternetGateways[0].Attachments[0].State))
}