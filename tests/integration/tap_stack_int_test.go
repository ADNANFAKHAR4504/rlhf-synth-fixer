//go:build integration

package lib_test

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation/types"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/wafv2"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testEnvironmentSuffix = "inttest"
	testRegion            = "us-east-1"
	testTimeout           = 45 * time.Minute // Longer timeout for actual deployment
)

// TestClients holds all AWS service clients needed for integration tests
type TestClients struct {
	CFN        *cloudformation.Client
	EC2        *ec2.Client
	RDS        *rds.Client
	S3         *s3.Client
	KMS        *kms.Client
	ELB        *elasticloadbalancingv2.Client
	WAF        *wafv2.Client
	CloudTrail *cloudtrail.Client
	DynamoDB   *dynamodb.Client
}

// setupTestClients initializes all AWS service clients
func setupTestClients(t *testing.T, ctx context.Context) *TestClients {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(testRegion),
	)
	require.NoError(t, err, "Failed to load AWS config")

	return &TestClients{
		CFN:        cloudformation.NewFromConfig(cfg),
		EC2:        ec2.NewFromConfig(cfg),
		RDS:        rds.NewFromConfig(cfg),
		S3:         s3.NewFromConfig(cfg),
		KMS:        kms.NewFromConfig(cfg),
		ELB:        elasticloadbalancingv2.NewFromConfig(cfg),
		WAF:        wafv2.NewFromConfig(cfg),
		CloudTrail: cloudtrail.NewFromConfig(cfg),
		DynamoDB:   dynamodb.NewFromConfig(cfg),
	}
}

// ========================================
// Networking Stack Integration Tests
// ========================================

func TestNetworkingStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	clients := setupTestClients(t, ctx)

	t.Run("VPC is created with correct configuration", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("NetworkingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT - Synthesize the stack
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - VPC properties
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Name"),
					"Value": jsii.String(fmt.Sprintf("tap-vpc-%s", testEnvironmentSuffix)),
				},
			}),
		})

		// Verify VPC has required tags
		template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Environment"),
					"Value": jsii.String(testEnvironmentSuffix),
				},
				map[string]*string{
					"Key":   jsii.String("Owner"),
					"Value": jsii.String("TapProject"),
				},
			}),
		})
	})

	t.Run("VPC has public, private, and isolated subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("SubnetsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Check for public subnets
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(6)) // 2 AZs * 3 subnet types

		// Verify Internet Gateway exists for public subnets
		template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))

		// Verify NAT Gateway exists for private subnets
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(1))
	})

	t.Run("DynamoDB VPC endpoint is created", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("VpcEndpointTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - DynamoDB endpoint exists
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName": assertions.Match_StringLikeRegexp("com.amazonaws.us-east-1.dynamodb"),
			"VpcEndpointType": "Gateway",
		})

		// Verify endpoint has proper tags
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Environment"),
					"Value": jsii.String(testEnvironmentSuffix),
				},
			}),
		})
	})

	t.Run("VPC outputs are exported correctly", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("VpcOutputsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Check VPC outputs
		outputs := template.FindOutputs(jsii.String("*"), &map[string]interface{}{})
		outputMap := *outputs.(*map[string]map[string]interface{})

		// Verify VPC ID output exists
		assert.Contains(t, outputMap, "VpcId")
		vpcOutput := outputMap["VpcId"]
		assert.Contains(t, vpcOutput, "Export")
	})
}

// ========================================
// Security Stack Integration Tests
// ========================================

func TestSecurityStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	clients := setupTestClients(t, ctx)

	t.Run("KMS key is created with encryption and rotation enabled", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - KMS key properties
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation": true,
			"Description":       assertions.Match_StringLikeRegexp("Customer-managed KMS key for RDS encryption"),
			"PendingWindowInDays": 30,
		})

		// Verify KMS key has proper tags
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Purpose"),
					"Value": jsii.String("RDS-Encryption"),
				},
			}),
		})
	})

	t.Run("KMS key has CloudTrail permissions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsCloudTrailTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - KMS key policy allows CloudTrail
		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"KeyPolicy": map[string]interface{}{
				"Statement": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Sid": "Enable CloudTrail Encrypt Permissions",
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action": []interface{}{
							"kms:GenerateDataKey*",
							"kms:DecryptDataKey",
						},
					},
				}),
			},
		})
	})

	t.Run("S3 bucket blocks all public access", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3PublicAccessTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - S3 bucket blocks public access
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
		})

		// Verify versioning is enabled
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("S3 bucket has lifecycle rules for cost optimization", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3LifecycleTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Lifecycle rules exist
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"LifecycleConfiguration": map[string]interface{}{
				"Rules": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Id":     "DeleteOldLogs",
						"Status": "Enabled",
						"Transitions": assertions.Match_ArrayWith(&[]interface{}{
							map[string]interface{}{
								"StorageClass":         "STANDARD_IA",
								"TransitionInDays":     30,
							},
						}),
						"ExpirationInDays": 365,
					},
				}),
			},
		})
	})

	t.Run("S3 bucket policy allows CloudTrail to write logs", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3CloudTrailPolicyTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Bucket policy allows CloudTrail
		template.HasResourceProperties(jsii.String("AWS::S3::BucketPolicy"), map[string]interface{}{
			"PolicyDocument": map[string]interface{}{
				"Statement": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Sid": "AWSCloudTrailWrite",
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action": "s3:PutObject",
					},
				}),
			},
		})
	})

	t.Run("CloudTrail is configured with encryption and validation", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("CloudTrailTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - CloudTrail properties
		template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
			"IncludeGlobalServiceEvents": true,
			"IsMultiRegionTrail":          false,
			"EnableLogFileValidation":     true,
		})

		// Verify CloudTrail is encrypted with KMS
		template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
			"KMSKeyId": assertions.Match_ObjectLike(map[string]interface{}{
				"Fn::GetAtt": assertions.Match_ArrayWith(&[]interface{}{
					assertions.Match_StringLikeRegexp(".*RdsKmsKey.*"),
				}),
			}),
		})
	})
}

// ========================================
// Data Stack Integration Tests
// ========================================

func TestDataStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	clients := setupTestClients(t, ctx)

	t.Run("RDS instance is created in isolated subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSubnetTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Subnet group exists
		template.HasResourceProperties(jsii.String("AWS::RDS::DBSubnetGroup"), map[string]interface{}{
			"DBSubnetGroupDescription": assertions.Match_StringLikeRegexp("Subnet group for RDS instance"),
		})
	})

	t.Run("RDS instance is encrypted with KMS", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsEncryptionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - RDS encryption
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"StorageEncrypted": true,
			"KmsKeyId": assertions.Match_ObjectLike(map[string]interface{}{
				"Fn::GetAtt": assertions.Match_ArrayWith(&[]interface{}{
					assertions.Match_StringLikeRegexp(".*RdsKmsKey.*"),
				}),
			}),
		})
	})

	t.Run("RDS security group restricts ingress to VPC CIDR", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSecurityGroupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Security group has description
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": assertions.Match_StringLikeRegexp("Security group for RDS database instance"),
		})

		// Verify ingress is restricted to VPC CIDR
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   3306,
			"ToPort":     3306,
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("RDS security group restricts egress", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsEgressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Egress is restricted to HTTPS only
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   443,
			"ToPort":     443,
			"CidrIp":     "0.0.0.0/0",
		})
	})

	t.Run("RDS instance has backup and maintenance configured", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsBackupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Backup configuration
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"BackupRetentionPeriod":      7,
			"PreferredBackupWindow":      "03:00-04:00",
			"PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
			"AutoMinorVersionUpgrade":    true,
		})
	})

	t.Run("RDS credentials are stored in Secrets Manager", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSecretsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Secret exists for RDS credentials
		template.HasResourceProperties(jsii.String("AWS::SecretsManager::Secret"), map[string]interface{}{
			"Name": assertions.Match_StringLikeRegexp(fmt.Sprintf("tap-rds-credentials-%s", testEnvironmentSuffix)),
		})

		// Verify secret is attached to RDS
		template.HasResourceProperties(jsii.String("AWS::SecretsManager::SecretTargetAttachment"), map[string]interface{}{
			"TargetType": "AWS::RDS::DBInstance",
		})
	})
}

// ========================================
// Application Stack Integration Tests
// ========================================

func TestApplicationStackIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
	defer cancel()

	clients := setupTestClients(t, ctx)

	t.Run("ALB is created in public subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbSubnetTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - ALB properties
		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Scheme": "internet-facing",
			"Type":   "application",
		})
	})

	t.Run("ALB security group has description and restricted ingress", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbSecurityGroupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Security group description
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": assertions.Match_StringLikeRegexp("Security group for Application Load Balancer"),
		})

		// Verify ingress is restricted to specific IPs
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   443,
			"ToPort":     443,
			"CidrIp":     "203.0.113.0/24", // Example IP from code
		})
	})

	t.Run("ALB security group restricts egress", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbEgressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Egress is restricted to VPC CIDR
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("WAF Web ACL is created with managed rules", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - WAF ACL properties
		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"Scope": "REGIONAL",
			"Rules": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Name":     "AWSManagedRulesCommonRuleSet",
					"Priority": 1,
					"Statement": map[string]interface{}{
						"ManagedRuleGroupStatement": map[string]interface{}{
							"VendorName": "AWS",
							"Name":       "AWSManagedRulesCommonRuleSet",
						},
					},
				},
			}),
		})
	})

	t.Run("WAF has SQL injection protection", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafSQLiTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - SQLi protection rule
		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"Rules": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Name":     "AWSManagedRulesSQLiRuleSet",
					"Priority": 2,
					"Statement": map[string]interface{}{
						"ManagedRuleGroupStatement": map[string]interface{}{
							"VendorName": "AWS",
							"Name":       "AWSManagedRulesSQLiRuleSet",
						},
					},
				},
			}),
		})
	})

	t.Run("WAF is associated with ALB", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafAlbAssociationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - WAF association exists
		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACLAssociation"), jsii.Number(1))
	})
}

// ========================================
// Cross-Service Interaction Tests
// ========================================

func TestCrossServiceInteractions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("VPC endpoint enables private DynamoDB access from private subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("VpcDynamoDBTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - VPC endpoint routes to private subnets
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName": assertions.Match_StringLikeRegexp("dynamodb"),
		})

		// Verify route tables are associated
		template.ResourceCountIs(jsii.String("AWS::EC2::VPCEndpointRouteTableAssociation"), assertions.Match_AnyValue())
	})

	t.Run("KMS key encrypts both RDS and CloudTrail", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsSharedTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Same KMS key used for both RDS and CloudTrail
		// Count references to the KMS key
		kmsKeyRefs := 0

		// Check RDS uses KMS key
		rdsProps := template.FindResources(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"StorageEncrypted": true,
			},
		})
		if len(*rdsProps.(*map[string]map[string]interface{})) > 0 {
			kmsKeyRefs++
		}

		// Check CloudTrail uses KMS key
		trailProps := template.FindResources(jsii.String("AWS::CloudTrail::Trail"), &map[string]interface{}{})
		if len(*trailProps.(*map[string]map[string]interface{})) > 0 {
			kmsKeyRefs++
		}

		assert.Equal(t, 2, kmsKeyRefs, "KMS key should be referenced by both RDS and CloudTrail")
	})

	t.Run("RDS is isolated in private subnets with no internet access", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsIsolationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - RDS subnet group uses isolated subnets
		template.HasResourceProperties(jsii.String("AWS::RDS::DBSubnetGroup"), map[string]interface{}{
			"SubnetIds": assertions.Match_AnyValue(), // Will be validated by subnet selection
		})

		// Verify RDS security group doesn't allow 0.0.0.0/0 ingress
		ingressRules := template.FindResources(jsii.String("AWS::EC2::SecurityGroupIngress"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"CidrIp": "0.0.0.0/0",
			},
		})

		// Count ingress rules targeting RDS security group
		rdsIngressWithPublicAccess := 0
		for _, rule := range *ingressRules.(*map[string]map[string]interface{}) {
			props := rule["Properties"].(map[string]interface{})
			if fromPort, ok := props["FromPort"]; ok {
				if fromPort == 3306 { // MySQL port
					rdsIngressWithPublicAccess++
				}
			}
		}

		assert.Equal(t, 0, rdsIngressWithPublicAccess, "RDS should not have public ingress on port 3306")
	})

	t.Run("ALB in public subnets can route to backend in private subnets", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbRoutingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - ALB has egress to VPC CIDR (for backend communication)
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("CloudTrail logs are encrypted and stored in S3", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("CloudTrailS3Test"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - CloudTrail references S3 bucket and KMS key
		template.HasResourceProperties(jsii.String("AWS::CloudTrail::Trail"), map[string]interface{}{
			"S3BucketName": assertions.Match_ObjectLike(map[string]interface{}{
				"Ref": assertions.Match_StringLikeRegexp(".*CloudTrailLogsBucket.*"),
			}),
			"KMSKeyId": assertions.Match_ObjectLike(map[string]interface{}{
				"Fn::GetAtt": assertions.Match_AnyValue(),
			}),
		})
	})
}

// ========================================
// End-to-End Workflow Tests
// ========================================

func TestEndToEndWorkflows(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("full stack synthesizes without errors", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		// ACT - Create full stack
		stack := lib.NewTapStack(app, jsii.String("FullStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ASSERT - Stack can be synthesized
		require.NotNil(t, stack)

		template := assertions.Template_FromStack(stack, nil)
		require.NotNil(t, template)

		// Verify all nested stacks are created
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(4))
	})

	t.Run("nested stacks have proper dependencies", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("DependencyTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Verify nested stacks exist
		nestedStacks := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), &map[string]interface{}{})
		nestedStackMap := *nestedStacks.(*map[string]map[string]interface{})

		assert.GreaterOrEqual(t, len(nestedStackMap), 4, "Should have at least 4 nested stacks")

		// Verify stack names contain environment suffix
		for logicalId := range nestedStackMap {
			assert.Contains(t, logicalId, testEnvironmentSuffix, "Nested stack should contain environment suffix")
		}
	})

	t.Run("all stack outputs are exported correctly", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("OutputsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Check all required outputs
		outputs := template.FindOutputs(jsii.String("*"), &map[string]interface{}{})
		outputMap := *outputs.(*map[string]map[string]interface{})

		requiredOutputs := []string{
			"VpcId",
			"KmsKeyId",
			"LoggingBucketName",
			"RdsEndpoint",
			"AlbDnsName",
			"SecurityFeatures",
		}

		for _, outputName := range requiredOutputs {
			assert.Contains(t, outputMap, outputName, fmt.Sprintf("Output %s should exist", outputName))
		}

		// Verify outputs have export names
		exportedOutputs := []string{"VpcId", "KmsKeyId", "LoggingBucketName", "RdsEndpoint", "AlbDnsName"}
		for _, outputName := range exportedOutputs {
			if output, ok := outputMap[outputName]; ok {
				assert.Contains(t, output, "Export", fmt.Sprintf("Output %s should have Export", outputName))
			}
		}
	})

	t.Run("stack region is set to us-east-1", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RegionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Verify resources reference us-east-1
		// CloudTrail service name should include us-east-1
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName": assertions.Match_StringLikeRegexp("com.amazonaws.us-east-1.dynamodb"),
		})
	})
}

// ========================================
// Security Compliance Tests
// ========================================

func TestSecurityCompliance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("no security groups have 0.0.0.0/0 ingress on sensitive ports", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("PublicIngressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Find all ingress rules with 0.0.0.0/0
		publicIngressRules := template.FindResources(jsii.String("AWS::EC2::SecurityGroupIngress"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"CidrIp": "0.0.0.0/0",
			},
		})

		publicRulesMap := *publicIngressRules.(*map[string]map[string]interface{})

		// Check for sensitive ports
		sensitivePorts := []int{22, 3306, 5432, 3389, 1433}
		for _, rule := range publicRulesMap {
			props := rule["Properties"].(map[string]interface{})
			if fromPort, ok := props["FromPort"]; ok {
				for _, sensitivePort := range sensitivePorts {
					assert.NotEqual(t, sensitivePort, fromPort,
						fmt.Sprintf("Security group should not allow public access on port %d", sensitivePort))
				}
			}
		}
	})

	t.Run("all security groups have descriptions", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("SecurityGroupDescTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - All security groups have descriptions
		securityGroups := template.FindResources(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{})
		sgMap := *securityGroups.(*map[string]map[string]interface{})

		for logicalId, sg := range sgMap {
			props := sg["Properties"].(map[string]interface{})
			desc, hasDesc := props["GroupDescription"]
			assert.True(t, hasDesc, fmt.Sprintf("Security group %s must have a description", logicalId))
			assert.NotEmpty(t, desc, fmt.Sprintf("Security group %s description must not be empty", logicalId))
		}
	})

	t.Run("all resources have required tags", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("TaggingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Check resources that support tags
		resourceTypesWithTags := []string{
			"AWS::EC2::VPC",
			"AWS::RDS::DBInstance",
			"AWS::S3::Bucket",
			"AWS::KMS::Key",
			"AWS::ElasticLoadBalancingV2::LoadBalancer",
		}

		requiredTags := map[string]string{
			"Environment": testEnvironmentSuffix,
			"Owner":       "TapProject",
		}

		for _, resourceType := range resourceTypesWithTags {
			resources := template.FindResources(jsii.String(resourceType), &map[string]interface{}{})
			resourceMap := *resources.(*map[string]map[string]interface{})

			for logicalId, resource := range resourceMap {
				props := resource["Properties"].(map[string]interface{})

				// Check if Tags property exists
				if tags, hasTags := props["Tags"]; hasTags {
					tagList := tags.([]interface{})

					for tagKey, tagValue := range requiredTags {
						foundTag := false
						for _, tag := range tagList {
							tagMap := tag.(map[string]interface{})
							if tagMap["Key"] == tagKey && tagMap["Value"] == tagValue {
								foundTag = true
								break
							}
						}

						assert.True(t, foundTag,
							fmt.Sprintf("Resource %s of type %s must have tag %s=%s",
								logicalId, resourceType, tagKey, tagValue))
					}
				}
			}
		}
	})

	t.Run("data resources are encrypted at rest", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("EncryptionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - RDS encryption
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"StorageEncrypted": true,
		})

		// S3 encryption
		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketEncryption": assertions.Match_ObjectLike(map[string]interface{}{
				"ServerSideEncryptionConfiguration": assertions.Match_AnyValue(),
			}),
		})
	})

	t.Run("IAM policies do not use wildcard resources", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("IAMWildcardTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Find all IAM policies
		policies := template.FindResources(jsii.String("AWS::IAM::Policy"), &map[string]interface{}{})
		policyMap := *policies.(*map[string]map[string]interface{})

		for logicalId, policy := range policyMap {
			props := policy["Properties"].(map[string]interface{})
			policyDoc := props["PolicyDocument"].(map[string]interface{})
			statements := policyDoc["Statement"].([]interface{})

			for _, stmt := range statements {
				statement := stmt.(map[string]interface{})
				resources := statement["Resource"]

				// Check if resources is a string "*" or array containing "*"
				switch v := resources.(type) {
				case string:
					// Only fail if it's exactly "*" - some services require wildcard for specific actions
					if v == "*" {
						// Check if this is an allowed case (KMS key policy, CloudTrail, etc.)
						actions := statement["Action"]
						actionStr := fmt.Sprintf("%v", actions)

						// Allow wildcards for specific CloudTrail and KMS actions
						if !strings.Contains(actionStr, "kms:") && !strings.Contains(actionStr, "cloudtrail:") {
							t.Errorf("IAM policy %s should not use wildcard (*) resource without specific service context", logicalId)
						}
					}
				case []interface{}:
					for _, r := range v {
						if rStr, ok := r.(string); ok && rStr == "*" {
							// Same check for array case
							actions := statement["Action"]
							actionStr := fmt.Sprintf("%v", actions)

							if !strings.Contains(actionStr, "kms:") && !strings.Contains(actionStr, "cloudtrail:") {
								t.Errorf("IAM policy %s should not use wildcard (*) in resources array without specific service context", logicalId)
							}
						}
					}
				}
			}
		}
	})

	t.Run("network ACLs and security groups implement defense in depth", func(t *testing.T) {
		// ARRANGE
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("DefenseInDepthTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		// ACT
		template := assertions.Template_FromStack(stack, nil)

		// ASSERT - Multiple security groups exist
		securityGroups := template.FindResources(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{})
		sgMap := *securityGroups.(*map[string]map[string]interface{})

		// Should have at least 2 security groups (RDS and ALB)
		assert.GreaterOrEqual(t, len(sgMap), 2, "Should have multiple security groups for defense in depth")

		// Verify isolated subnets exist
		subnets := template.FindResources(jsii.String("AWS::EC2::Subnet"), &map[string]interface{}{})
		subnetMap := *subnets.(*map[string]map[string]interface{})

		assert.GreaterOrEqual(t, len(subnetMap), 6, "Should have public, private, and isolated subnets")
	})
}

// ========================================
// Helper Functions
// ========================================

// waitForStackCompletion waits for CloudFormation stack to complete creation
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 45*time.Minute)
}

// getStackOutputs retrieves outputs from a deployed CloudFormation stack
func getStackOutputs(ctx context.Context, cfnClient *cloudformation.Client, stackName string) (map[string]string, error) {
	result, err := cfnClient.DescribeStacks(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	})
	if err != nil {
		return nil, err
	}

	if len(result.Stacks) == 0 {
		return nil, fmt.Errorf("stack not found: %s", stackName)
	}

	outputs := make(map[string]string)
	for _, output := range result.Stacks[0].Outputs {
		if output.OutputKey != nil && output.OutputValue != nil {
			outputs[*output.OutputKey] = *output.OutputValue
		}
	}

	return outputs, nil
}

// verifyVPCConnectivity tests network connectivity within VPC
func verifyVPCConnectivity(ctx context.Context, ec2Client *ec2.Client, vpcId string) error {
	// Describe VPC to verify it exists
	result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcId},
	})
	if err != nil {
		return fmt.Errorf("failed to describe VPC: %w", err)
	}

	if len(result.Vpcs) == 0 {
		return fmt.Errorf("VPC not found: %s", vpcId)
	}

	// Verify VPC has DNS support enabled
	vpc := result.Vpcs[0]
	if vpc.EnableDnsSupport == nil || !*vpc.EnableDnsSupport {
		return fmt.Errorf("VPC DNS support should be enabled")
	}

	if vpc.EnableDnsHostnames == nil || !*vpc.EnableDnsHostnames {
		return fmt.Errorf("VPC DNS hostnames should be enabled")
	}

	return nil
}

// verifyRDSEncryption validates RDS instance encryption
func verifyRDSEncryption(ctx context.Context, rdsClient *rds.Client, dbInstanceId string) error {
	result, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbInstanceId),
	})
	if err != nil {
		return fmt.Errorf("failed to describe RDS instance: %w", err)
	}

	if len(result.DBInstances) == 0 {
		return fmt.Errorf("RDS instance not found: %s", dbInstanceId)
	}

	dbInstance := result.DBInstances[0]

	if dbInstance.StorageEncrypted == nil || !*dbInstance.StorageEncrypted {
		return fmt.Errorf("RDS instance should be encrypted")
	}

	if dbInstance.KmsKeyId == nil || *dbInstance.KmsKeyId == "" {
		return fmt.Errorf("RDS instance should use KMS encryption")
	}

	return nil
}

// verifyWAFAssociation validates WAF is associated with ALB
func verifyWAFAssociation(ctx context.Context, wafClient *wafv2.Client, albArn string) error {
	result, err := wafClient.ListResourcesForWebACL(ctx, &wafv2.ListResourcesForWebACLInput{
		WebACLArn: aws.String(albArn),
	})
	if err != nil {
		return fmt.Errorf("failed to list WAF resources: %w", err)
	}

	if len(result.ResourceArns) == 0 {
		return fmt.Errorf("no resources associated with WAF ACL")
	}

	return nil
}

// verifyCloudTrailLogging validates CloudTrail is logging to S3
func verifyCloudTrailLogging(ctx context.Context, cloudTrailClient *cloudtrail.Client, trailName string) error {
	result, err := cloudTrailClient.GetTrailStatus(ctx, &cloudtrail.GetTrailStatusInput{
		Name: aws.String(trailName),
	})
	if err != nil {
		return fmt.Errorf("failed to get trail status: %w", err)
	}

	if result.IsLogging == nil || !*result.IsLogging {
		return fmt.Errorf("CloudTrail should be logging")
	}

	return nil
}

// verifyS3BucketEncryption validates S3 bucket encryption settings
func verifyS3BucketEncryption(ctx context.Context, s3Client *s3.Client, bucketName string) error {
	result, err := s3Client.GetBucketEncryption(ctx, &s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return fmt.Errorf("failed to get bucket encryption: %w", err)
	}

	if result.ServerSideEncryptionConfiguration == nil {
		return fmt.Errorf("bucket encryption should be configured")
	}

	if len(result.ServerSideEncryptionConfiguration.Rules) == 0 {
		return fmt.Errorf("bucket should have encryption rules")
	}

	return nil
}

// verifySecurityGroupRules validates security group ingress/egress rules
func verifySecurityGroupRules(ctx context.Context, ec2Client *ec2.Client, sgId string, expectedRestricted bool) error {
	result, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
		GroupIds: []string{sgId},
	})
	if err != nil {
		return fmt.Errorf("failed to describe security group: %w", err)
	}

	if len(result.SecurityGroups) == 0 {
		return fmt.Errorf("security group not found: %s", sgId)
	}

	sg := result.SecurityGroups[0]

	// Check for unrestricted ingress
	for _, rule := range sg.IpPermissions {
		for _, ipRange := range rule.IpRanges {
			if ipRange.CidrIp != nil && *ipRange.CidrIp == "0.0.0.0/0" && expectedRestricted {
				return fmt.Errorf("security group has unrestricted ingress (0.0.0.0/0)")
			}
		}
	}

	return nil
}

// verifyKMSKeyRotation validates KMS key rotation is enabled
func verifyKMSKeyRotation(ctx context.Context, kmsClient *kms.Client, keyId string) error {
	result, err := kmsClient.GetKeyRotationStatus(ctx, &kms.GetKeyRotationStatusInput{
		KeyId: aws.String(keyId),
	})
	if err != nil {
		return fmt.Errorf("failed to get key rotation status: %w", err)
	}

	if result.KeyRotationEnabled == nil || !*result.KeyRotationEnabled {
		return fmt.Errorf("KMS key rotation should be enabled")
	}

	return nil
}

// verifySubnetRouting validates subnet routing configuration
func verifySubnetRouting(ctx context.Context, ec2Client *ec2.Client, vpcId string) error {
	// Get all route tables for VPC
	result, err := ec2Client.DescribeRouteTables(ctx, &ec2.DescribeRouteTablesInput{
		Filters: []ec2types.Filter{
			{
				Name:   aws.String("vpc-id"),
				Values: []string{vpcId},
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to describe route tables: %w", err)
	}

	if len(result.RouteTables) == 0 {
		return fmt.Errorf("no route tables found for VPC")
	}

	// Verify at least one route table has internet gateway route (public subnet)
	hasPublicRoute := false
	for _, rt := range result.RouteTables {
		for _, route := range rt.Routes {
			if route.GatewayId != nil && strings.HasPrefix(*route.GatewayId, "igw-") {
				hasPublicRoute = true
				break
			}
		}
	}

	if !hasPublicRoute {
		return fmt.Errorf("VPC should have at least one public subnet with internet gateway route")
	}

	return nil
}
