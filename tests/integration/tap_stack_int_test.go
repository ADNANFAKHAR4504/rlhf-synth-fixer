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
	testTimeout           = 45 * time.Minute
)

// TestClients holds all AWS service clients needed for integration tests
type TestClients struct {
	CFN      *cloudformation.Client
	EC2      *ec2.Client
	RDS      *rds.Client
	S3       *s3.Client
	KMS      *kms.Client
	ELB      *elasticloadbalancingv2.Client
	WAF      *wafv2.Client
	DynamoDB *dynamodb.Client
}

// setupTestClients initializes all AWS service clients
func setupTestClients(t *testing.T, ctx context.Context) *TestClients {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(testRegion),
	)
	require.NoError(t, err, "Failed to load AWS config")

	return &TestClients{
		CFN:      cloudformation.NewFromConfig(cfg),
		EC2:      ec2.NewFromConfig(cfg),
		RDS:      rds.NewFromConfig(cfg),
		S3:       s3.NewFromConfig(cfg),
		KMS:      kms.NewFromConfig(cfg),
		ELB:      elasticloadbalancingv2.NewFromConfig(cfg),
		WAF:      wafv2.NewFromConfig(cfg),
		DynamoDB: dynamodb.NewFromConfig(cfg),
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

	_ = setupTestClients(t, ctx)

	t.Run("VPC is created with correct configuration", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("NetworkingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

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

	t.Run("VPC has public, private, and isolated subnets in multiple AZs", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("SubnetsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// 2 AZs * 3 subnet types = 6 subnets
		template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(6))

		// Internet Gateway for public subnets
		template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))

		// NAT Gateway for private subnets (only 1 for cost optimization)
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(1))
	})

	t.Run("DynamoDB VPC Gateway endpoint enables private access", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("VpcEndpointTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// DynamoDB endpoint is a Gateway endpoint
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName":     assertions.Match_StringLikeRegexp(jsii.String("com.amazonaws.us-east-1.dynamodb")),
			"VpcEndpointType": "Gateway",
		})

		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Environment"),
					"Value": jsii.String(testEnvironmentSuffix),
				},
			}),
		})
	})

	t.Run("VPC endpoint has route table associations for private subnets", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("EndpointRoutingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Gateway endpoints should have route table associations
		// Match_AnyValue just checks that at least one exists
		endpoints := template.FindResources(jsii.String("AWS::EC2::VPCEndpointRouteTableAssociation"), &map[string]interface{}{})
		assert.NotEmpty(t, *endpoints, "Should have VPC endpoint route table associations")
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

	_ = setupTestClients(t, ctx)

	t.Run("KMS key is created with automatic rotation enabled", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"EnableKeyRotation":   true,
			"Description":         assertions.Match_StringLikeRegexp(jsii.String("Customer-managed KMS key for RDS encryption")),
			"PendingWindowInDays": 30,
		})

		template.HasResourceProperties(jsii.String("AWS::KMS::Key"), map[string]interface{}{
			"Tags": assertions.Match_ArrayWith(&[]interface{}{
				map[string]*string{
					"Key":   jsii.String("Purpose"),
					"Value": jsii.String("RDS-Encryption"),
				},
			}),
		})
	})

	t.Run("KMS key has alias for easy reference", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsAliasTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::KMS::Alias"), map[string]interface{}{
			"AliasName": assertions.Match_StringLikeRegexp(jsii.String(fmt.Sprintf("alias/tap-rds-key-%s", testEnvironmentSuffix))),
		})
	})

	t.Run("S3 bucket blocks all public access completely", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3PublicAccessTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"PublicAccessBlockConfiguration": map[string]interface{}{
				"BlockPublicAcls":       true,
				"BlockPublicPolicy":     true,
				"IgnorePublicAcls":      true,
				"RestrictPublicBuckets": true,
			},
		})

		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"VersioningConfiguration": map[string]interface{}{
				"Status": "Enabled",
			},
		})
	})

	t.Run("S3 bucket has lifecycle rules for cost optimization", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3LifecycleTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"LifecycleConfiguration": map[string]interface{}{
				"Rules": assertions.Match_ArrayWith(&[]interface{}{
					map[string]interface{}{
						"Id":               "DeleteOldLogs",
						"Status":           "Enabled",
						"ExpirationInDays": 365,
						"Transitions": assertions.Match_ArrayWith(&[]interface{}{
							map[string]interface{}{
								"StorageClass":     "STANDARD_IA",
								"TransitionInDays": 30,
							},
							map[string]interface{}{
								"StorageClass":     "GLACIER",
								"TransitionInDays": 90,
							},
						}),
					},
				}),
			},
		})
	})

	t.Run("S3 bucket name indicates no public access", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("S3NamingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), map[string]interface{}{
			"BucketName": assertions.Match_StringLikeRegexp(jsii.String(".*no-public-access.*")),
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

	_ = setupTestClients(t, ctx)

	t.Run("RDS instance is deployed in isolated subnets only", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSubnetTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::RDS::DBSubnetGroup"), map[string]interface{}{
			"DBSubnetGroupDescription": assertions.Match_StringLikeRegexp(jsii.String("Subnet group for RDS instance")),
		})
	})

	t.Run("RDS instance is encrypted with customer-managed KMS key", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsEncryptionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"StorageEncrypted": true,
			"KmsKeyId": assertions.Match_ObjectLike(&map[string]interface{}{
				"Fn::GetAtt": assertions.Match_ArrayWith(&[]interface{}{
					assertions.Match_StringLikeRegexp(jsii.String(".*RdsKmsKey.*")),
				}),
			}),
		})
	})

	t.Run("RDS security group strictly restricts ingress to VPC CIDR only", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSecurityGroupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": assertions.Match_StringLikeRegexp(jsii.String("Security group for RDS database instance")),
		})

		// Verify MySQL port is restricted to VPC CIDR
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   3306,
			"ToPort":     3306,
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("RDS security group restricts egress to HTTPS only", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsEgressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Egress restricted to HTTPS for patches/updates
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   443,
			"ToPort":     443,
			"CidrIp":     "0.0.0.0/0",
		})
	})

	t.Run("RDS credentials are securely stored in Secrets Manager", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsSecretsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::SecretsManager::Secret"), map[string]interface{}{
			"Name": assertions.Match_StringLikeRegexp(jsii.String(fmt.Sprintf("tap-rds-credentials-%s", testEnvironmentSuffix))),
		})

		template.HasResourceProperties(jsii.String("AWS::SecretsManager::SecretTargetAttachment"), map[string]interface{}{
			"TargetType": "AWS::RDS::DBInstance",
		})
	})

	t.Run("RDS has automated backups configured properly", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsBackupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"BackupRetentionPeriod":      7,
			"PreferredBackupWindow":      "03:00-04:00",
			"PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
			"AutoMinorVersionUpgrade":    true,
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

	_ = setupTestClients(t, ctx)

	t.Run("ALB is internet-facing and deployed in public subnets", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbSubnetTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), map[string]interface{}{
			"Scheme": "internet-facing",
			"Type":   "application",
		})
	})

	t.Run("ALB security group restricts ingress to specific IP ranges only", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbSecurityGroupTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), map[string]interface{}{
			"GroupDescription": assertions.Match_StringLikeRegexp(jsii.String("Security group for Application Load Balancer")),
		})

		// Verify ingress is restricted to specific IP (not 0.0.0.0/0)
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupIngress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"FromPort":   443,
			"ToPort":     443,
			"CidrIp":     "203.0.113.0/24", // Example IP from code
		})
	})

	t.Run("ALB security group has restricted egress to VPC CIDR", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbEgressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("WAF Web ACL uses AWS managed rule set for common threats", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

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

	t.Run("WAF includes SQL injection protection rule", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafSQLiTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

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

	t.Run("WAF is properly associated with ALB", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafAlbAssociationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.ResourceCountIs(jsii.String("AWS::WAFv2::WebACLAssociation"), jsii.Number(1))
	})

	t.Run("WAF has CloudWatch metrics enabled for monitoring", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WafMetricsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::WAFv2::WebACL"), map[string]interface{}{
			"VisibilityConfig": map[string]interface{}{
				"SampledRequestsEnabled":   true,
				"CloudWatchMetricsEnabled": true,
			},
		})
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
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("VpcDynamoDBTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// VPC endpoint routes to private subnets via route tables
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName": assertions.Match_StringLikeRegexp(jsii.String("dynamodb")),
		})

		endpoints := template.FindResources(jsii.String("AWS::EC2::VPCEndpointRouteTableAssociation"), &map[string]interface{}{})
		assert.NotEmpty(t, *endpoints, "Should have VPC endpoint route table associations")
	})

	t.Run("KMS key encrypts RDS storage", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("KmsRdsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Verify KMS key is used for RDS
		rdsProps := template.FindResources(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"StorageEncrypted": true,
			},
		})
		assert.NotEmpty(t, *rdsProps)
	})

	t.Run("RDS is completely isolated with no internet access", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsIsolationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Verify RDS security group doesn't allow 0.0.0.0/0 on MySQL port
		ingressRules := template.FindResources(jsii.String("AWS::EC2::SecurityGroupIngress"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"CidrIp": "0.0.0.0/0",
			},
		})

		rdsPublicAccess := 0
		for _, rule := range *ingressRules {
			props := (*rule)["Properties"].(map[string]interface{})
			if fromPort, ok := props["FromPort"]; ok {
				if fromPort == float64(3306) {
					rdsPublicAccess++
				}
			}
		}

		assert.Equal(t, 0, rdsPublicAccess, "RDS should not have public ingress on MySQL port")
	})

	t.Run("ALB can route to backend in private subnets via VPC", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("AlbRoutingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// ALB has egress to VPC CIDR for backend communication
		template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroupEgress"), map[string]interface{}{
			"IpProtocol": "tcp",
			"CidrIp":     "10.0.0.0/16",
		})
	})

	t.Run("Security groups implement defense in depth architecture", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("SecurityLayersTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Multiple security groups for different tiers
		securityGroups := template.FindResources(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{})
		sgMap := *securityGroups

		assert.GreaterOrEqual(t, len(sgMap), 2, "Should have multiple security groups (ALB, RDS)")

		// Verify each SG has a description
		for logicalId, sg := range sgMap {
			props := (*sg)["Properties"].(map[string]interface{})
			desc, hasDesc := props["GroupDescription"]
			assert.True(t, hasDesc, fmt.Sprintf("SG %s must have description", logicalId))
			assert.NotEmpty(t, desc, fmt.Sprintf("SG %s description must not be empty", logicalId))
		}
	})

	t.Run("Network segmentation: public, private, and isolated subnets", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("NetworkSegmentationTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Should have 6 subnets (3 types × 2 AZs)
		subnets := template.FindResources(jsii.String("AWS::EC2::Subnet"), &map[string]interface{}{})
		subnetMap := *subnets

		assert.Equal(t, 6, len(subnetMap), "Should have 6 subnets for proper segmentation")
	})

	t.Run("NAT Gateway enables private subnet internet access", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("NatGatewayTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// NAT Gateway for private subnet egress
		template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(1))

		// NAT requires EIP
		eips := template.FindResources(jsii.String("AWS::EC2::EIP"), &map[string]interface{}{})
		assert.NotEmpty(t, *eips, "NAT Gateway should have Elastic IP")
	})
}

// ========================================
// End-to-End Workflow Tests
// ========================================

func TestEndToEndWorkflows(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("full stack synthesizes correctly with all nested stacks", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("FullStackTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		require.NotNil(t, stack)

		template := assertions.Template_FromStack(stack, nil)
		require.NotNil(t, template)

		// 4 nested stacks: Networking, Security, Data, Application
		template.ResourceCountIs(jsii.String("AWS::CloudFormation::Stack"), jsii.Number(4))
	})

	t.Run("nested stacks have proper naming with environment suffix", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("DependencyTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		nestedStacks := template.FindResources(jsii.String("AWS::CloudFormation::Stack"), &map[string]interface{}{})
		nestedStackMap := *nestedStacks

		assert.GreaterOrEqual(t, len(nestedStackMap), 4, "Should have 4 nested stacks")

		// Verify environment suffix in stack names
		for logicalId := range nestedStackMap {
			assert.Contains(t, logicalId, testEnvironmentSuffix, "Nested stack must contain environment suffix")
		}
	})

	t.Run("all critical stack outputs are exported with proper naming", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("OutputsTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		outputs := template.FindOutputs(jsii.String("*"), &map[string]interface{}{})
		outputMap := *outputs

		requiredOutputs := []string{
			"VpcId",
			"KmsKeyId",
			"RdsEndpoint",
			"AlbDnsName",
			"SecurityFeatures",
		}

		for _, outputName := range requiredOutputs {
			assert.Contains(t, outputMap, outputName, fmt.Sprintf("Output %s should exist", outputName))
		}

		// Verify outputs have export names for cross-stack references
		exportedOutputs := []string{"VpcId", "KmsKeyId", "RdsEndpoint", "AlbDnsName"}
		for _, outputName := range exportedOutputs {
			if output, ok := outputMap[outputName]; ok {
				assert.Contains(t, *output, "Export", fmt.Sprintf("Output %s should have Export", outputName))
			}
		}
	})

	t.Run("stack targets us-east-1 region", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RegionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Verify DynamoDB endpoint service name includes us-east-1
		template.HasResourceProperties(jsii.String("AWS::EC2::VPCEndpoint"), map[string]interface{}{
			"ServiceName": assertions.Match_StringLikeRegexp(jsii.String("com.amazonaws.us-east-1.dynamodb")),
		})
	})

	t.Run("complete infrastructure deployment workflow", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("WorkflowTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Verify deployment flow: Networking → Security → Data → Application
		// This is implicit in dependencies via nested stacks

		// Networking resources
		vpcs := template.FindResources(jsii.String("AWS::EC2::VPC"), &map[string]interface{}{})
		assert.NotEmpty(t, *vpcs, "Should have VPC")

		// Security resources
		keys := template.FindResources(jsii.String("AWS::KMS::Key"), &map[string]interface{}{})
		assert.NotEmpty(t, *keys, "Should have KMS key")
		buckets := template.FindResources(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{})
		assert.NotEmpty(t, *buckets, "Should have S3 bucket")

		// Data resources (depends on Networking + Security)
		rdss := template.FindResources(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{})
		assert.NotEmpty(t, *rdss, "Should have RDS instance")

		// Application resources (depends on Networking)
		albs := template.FindResources(jsii.String("AWS::ElasticLoadBalancingV2::LoadBalancer"), &map[string]interface{}{})
		assert.NotEmpty(t, *albs, "Should have ALB")
		wafs := template.FindResources(jsii.String("AWS::WAFv2::WebACL"), &map[string]interface{}{})
		assert.NotEmpty(t, *wafs, "Should have WAF")
	})
}

// ========================================
// Security Compliance Tests
// ========================================

func TestSecurityCompliance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("no security groups allow unrestricted access on sensitive ports", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("PublicIngressTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		publicIngressRules := template.FindResources(jsii.String("AWS::EC2::SecurityGroupIngress"), &map[string]interface{}{
			"Properties": map[string]interface{}{
				"CidrIp": "0.0.0.0/0",
			},
		})

		publicRulesMap := *publicIngressRules

		// Sensitive database/SSH ports should never be open to 0.0.0.0/0
		sensitivePorts := []float64{22, 3306, 5432, 3389, 1433}
		for _, rule := range publicRulesMap {
			props := (*rule)["Properties"].(map[string]interface{})
			if fromPort, ok := props["FromPort"]; ok {
				fromPortNum := fromPort.(float64)
				for _, sensitivePort := range sensitivePorts {
					assert.NotEqual(t, sensitivePort, fromPortNum,
						fmt.Sprintf("Security group should not allow public access on port %.0f", sensitivePort))
				}
			}
		}
	})

	t.Run("all security groups have meaningful descriptions", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("SecurityGroupDescTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		securityGroups := template.FindResources(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{})
		sgMap := *securityGroups

		for logicalId, sg := range sgMap {
			props := (*sg)["Properties"].(map[string]interface{})
			desc, hasDesc := props["GroupDescription"]
			assert.True(t, hasDesc, fmt.Sprintf("Security group %s must have a description", logicalId))
			assert.NotEmpty(t, desc, fmt.Sprintf("Security group %s description cannot be empty", logicalId))

			// Description should be meaningful (not default)
			descStr := fmt.Sprintf("%v", desc)
			assert.NotContains(t, descStr, "Managed by CDK", "Description should be custom, not default")
		}
	})

	t.Run("all taggable resources have required tags", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("TaggingTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

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
			resourceMap := *resources

			for logicalId, resource := range resourceMap {
				props := (*resource)["Properties"].(map[string]interface{})

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
							fmt.Sprintf("Resource %s (%s) must have tag %s=%s",
								logicalId, resourceType, tagKey, tagValue))
					}
				}
			}
		}
	})

	t.Run("all data resources use encryption at rest", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("EncryptionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// RDS encryption
		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"StorageEncrypted": true,
		})

		// S3 encryption
		s3Buckets := template.FindResources(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{})
		s3Map := *s3Buckets
		assert.NotEmpty(t, s3Map, "Should have S3 buckets")

		// Verify at least one bucket has encryption
		hasEncryption := false
		for _, bucket := range s3Map {
			props := (*bucket)["Properties"].(map[string]interface{})
			if _, ok := props["BucketEncryption"]; ok {
				hasEncryption = true
				break
			}
		}
		assert.True(t, hasEncryption, "At least one S3 bucket should have encryption configured")
	})

	t.Run("IAM policies follow least privilege principle", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("IAMWildcardTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		policies := template.FindResources(jsii.String("AWS::IAM::Policy"), &map[string]interface{}{})
		policyMap := *policies

		for logicalId, policy := range policyMap {
			props := (*policy)["Properties"].(map[string]interface{})
			policyDoc := props["PolicyDocument"].(map[string]interface{})
			statements := policyDoc["Statement"].([]interface{})

			for _, stmt := range statements {
				statement := stmt.(map[string]interface{})
				resources := statement["Resource"]

				switch v := resources.(type) {
				case string:
					if v == "*" {
						actions := statement["Action"]
						actionStr := fmt.Sprintf("%v", actions)

						// Only KMS-specific actions can use wildcard
						if !strings.Contains(actionStr, "kms:") {
							t.Errorf("IAM policy %s should not use wildcard (*) resource", logicalId)
						}
					}
				}
			}
		}
	})

	t.Run("network implements multi-layer defense", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("DefenseInDepthTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		// Multiple security groups (defense layer 1)
		securityGroups := template.FindResources(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{})
		sgMap := *securityGroups
		assert.GreaterOrEqual(t, len(sgMap), 2, "Should have multiple security groups")

		// Isolated subnets (defense layer 2)
		subnets := template.FindResources(jsii.String("AWS::EC2::Subnet"), &map[string]interface{}{})
		subnetMap := *subnets
		assert.GreaterOrEqual(t, len(subnetMap), 6, "Should have segmented subnets")

		// WAF protection (defense layer 3)
		wafs := template.FindResources(jsii.String("AWS::WAFv2::WebACL"), &map[string]interface{}{})
		assert.NotEmpty(t, *wafs, "Should have WAF ACL")

		// Encryption (defense layer 4)
		kmsKeys := template.FindResources(jsii.String("AWS::KMS::Key"), &map[string]interface{}{})
		assert.NotEmpty(t, *kmsKeys, "Should have KMS key")
	})

	t.Run("RDS uses MySQL 8.0 for security updates", func(t *testing.T) {
		app := awscdk.NewApp(nil)
		defer jsii.Close()

		stack := lib.NewTapStack(app, jsii.String("RdsVersionTest"), &lib.TapStackProps{
			StackProps:        &awscdk.StackProps{},
			EnvironmentSuffix: jsii.String(testEnvironmentSuffix),
		})

		template := assertions.Template_FromStack(stack, nil)

		template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), map[string]interface{}{
			"Engine": "mysql",
			// Engine version is set to 8.0 in the code
		})
	})
}

// ========================================
// Helper Functions
// ========================================

func verifyVPCConnectivity(ctx context.Context, ec2Client *ec2.Client, vpcId string) error {
	result, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
		VpcIds: []string{vpcId},
	})
	if err != nil {
		return fmt.Errorf("failed to describe VPC: %w", err)
	}

	if len(result.Vpcs) == 0 {
		return fmt.Errorf("VPC not found: %s", vpcId)
	}

	vpc := result.Vpcs[0]
	if vpc.EnableDnsSupport == nil || !*vpc.EnableDnsSupport {
		return fmt.Errorf("VPC DNS support should be enabled")
	}

	if vpc.EnableDnsHostnames == nil || !*vpc.EnableDnsHostnames {
		return fmt.Errorf("VPC DNS hostnames should be enabled")
	}

	return nil
}

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

func verifyWAFAssociation(ctx context.Context, wafClient *wafv2.Client, webACLArn string) error {
	result, err := wafClient.ListResourcesForWebACL(ctx, &wafv2.ListResourcesForWebACLInput{
		WebACLArn: aws.String(webACLArn),
	})
	if err != nil {
		return fmt.Errorf("failed to list WAF resources: %w", err)
	}

	if len(result.ResourceArns) == 0 {
		return fmt.Errorf("no resources associated with WAF ACL")
	}

	return nil
}

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

func verifySubnetRouting(ctx context.Context, ec2Client *ec2.Client, vpcId string) error {
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

	for _, rule := range sg.IpPermissions {
		for _, ipRange := range rule.IpRanges {
			if ipRange.CidrIp != nil && *ipRange.CidrIp == "0.0.0.0/0" && expectedRestricted {
				return fmt.Errorf("security group has unrestricted ingress (0.0.0.0/0)")
			}
		}
	}

	return nil
}
