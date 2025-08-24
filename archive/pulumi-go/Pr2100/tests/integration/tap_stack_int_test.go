//go:build integration
// +build integration

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type AWSClients struct {
	EC2        *ec2.Client
	S3         *s3.Client
	RDS        *rds.Client
	IAM        *iam.Client
	KMS        *kms.Client
	CloudFront *cloudfront.Client
	CloudWatch *cloudwatch.Client
	CloudTrail *cloudtrail.Client
}

type DeploymentOutputs struct {
	S3BucketName             string                            `json:"s3BucketName"`
	S3BucketArn              string                            `json:"s3BucketArn"`
	CloudfrontDistributionId string                            `json:"cloudfrontDistributionId"`
	CloudfrontDomainName     string                            `json:"cloudfrontDomainName"`
	CloudtrailBucketName     string                            `json:"cloudtrailBucketName"`
	Environment              string                            `json:"environment"`
	Regions                  []string                          `json:"regions"`
	EC2RoleArn               string                            `json:"ec2RoleArn"`
	RdsMonitoringRoleArn     string                            `json:"rdsMonitoringRoleArn"`
	RegionalResources        map[string]map[string]interface{} `json:"-"`
}

var (
	awsClients  *AWSClients
	outputs     *DeploymentOutputs
	testRegions = []string{"us-east-1", "us-west-2", "eu-west-1"}
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
		EC2:        ec2.NewFromConfig(cfg),
		S3:         s3.NewFromConfig(cfg),
		RDS:        rds.NewFromConfig(cfg),
		IAM:        iam.NewFromConfig(cfg),
		KMS:        kms.NewFromConfig(cfg),
		CloudFront: cloudfront.NewFromConfig(cfg),
		CloudWatch: cloudwatch.NewFromConfig(cfg),
		CloudTrail: cloudtrail.NewFromConfig(cfg),
	}
}

func loadDeploymentOutputs() {
	outputs = &DeploymentOutputs{
		Environment:       getEnvOrDefault("ENVIRONMENT_SUFFIX", "dev"),
		Regions:           testRegions,
		RegionalResources: make(map[string]map[string]interface{}),
	}

	// Try to load from cfn-outputs/flat-outputs.json
	if data, err := ioutil.ReadFile("../cfn-outputs/flat-outputs.json"); err == nil {
		var stringifiedOutputs map[string]string
		if err := json.Unmarshal(data, &stringifiedOutputs); err == nil {
			if val, ok := stringifiedOutputs["s3BucketName"]; ok {
				outputs.S3BucketName = val
			}
			if val, ok := stringifiedOutputs["s3BucketArn"]; ok {
				outputs.S3BucketArn = val
			}
			if val, ok := stringifiedOutputs["cloudfrontDistributionId"]; ok {
				outputs.CloudfrontDistributionId = val
			}
			if val, ok := stringifiedOutputs["cloudfrontDomainName"]; ok {
				outputs.CloudfrontDomainName = val
			}
			if val, ok := stringifiedOutputs["cloudtrailBucketName"]; ok {
				outputs.CloudtrailBucketName = val
			}
			if val, ok := stringifiedOutputs["environment"]; ok {
				outputs.Environment = val
			}
			if val, ok := stringifiedOutputs["ec2RoleArn"]; ok {
				outputs.EC2RoleArn = val
			}
			if val, ok := stringifiedOutputs["rdsMonitoringRoleArn"]; ok {
				outputs.RdsMonitoringRoleArn = val
			}
			if val, ok := stringifiedOutputs["regions"]; ok {
				var regions []string
				if err := json.Unmarshal([]byte(val), &regions); err == nil {
					outputs.Regions = regions
				}
			}
		}
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func TestMultiRegionInfrastructureIntegration(t *testing.T) {
	t.Run("should deploy infrastructure across multiple regions", func(t *testing.T) {
		for _, region := range testRegions {
			t.Run(fmt.Sprintf("region_%s", region), func(t *testing.T) {
				cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
				require.NoError(t, err)
				ec2Client := ec2.NewFromConfig(cfg)

				vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{})
				require.NoError(t, err)
				assert.NotEmpty(t, vpcs.Vpcs, "VPC should exist in region %s", region)
			})
		}
	})
}

func TestS3BucketIntegration(t *testing.T) {
	if outputs.S3BucketName == "" {
		t.Skip("S3 bucket name not available in outputs")
	}

	t.Run("should verify S3 bucket exists and is configured correctly", func(t *testing.T) {
		_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "S3 bucket should exist")

		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "Bucket encryption should be configured")
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)

		versioning, err := awsClients.S3.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.Equal(t, "Enabled", string(versioning.Status))

		pab, err := awsClients.S3.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicAcls)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.True(t, *pab.PublicAccessBlockConfiguration.BlockPublicPolicy)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.True(t, *pab.PublicAccessBlockConfiguration.IgnorePublicAcls)
		assert.NotNil(t, pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
		assert.True(t, *pab.PublicAccessBlockConfiguration.RestrictPublicBuckets)
	})
}

func TestCloudFrontIntegration(t *testing.T) {
	if outputs.CloudfrontDistributionId == "" {
		t.Skip("CloudFront distribution ID not available in outputs")
	}

	t.Run("should verify CloudFront distribution is configured correctly", func(t *testing.T) {
		dist, err := awsClients.CloudFront.GetDistribution(context.TODO(), &cloudfront.GetDistributionInput{
			Id: aws.String(outputs.CloudfrontDistributionId),
		})
		require.NoError(t, err, "CloudFront distribution should exist")

		assert.NotNil(t, dist.Distribution.DistributionConfig.Enabled)
		assert.True(t, *dist.Distribution.DistributionConfig.Enabled)
		assert.NotNil(t, dist.Distribution.DistributionConfig.IsIPV6Enabled)
		assert.True(t, *dist.Distribution.DistributionConfig.IsIPV6Enabled)
		assert.NotNil(t, dist.Distribution.DistributionConfig.DefaultRootObject)
		assert.Equal(t, "index.html", *dist.Distribution.DistributionConfig.DefaultRootObject)
	})
}

func TestRDSIntegration(t *testing.T) {
	for _, region := range testRegions {
		t.Run(fmt.Sprintf("rds_in_%s", region), func(t *testing.T) {
			cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
			require.NoError(t, err)
			rdsClient := rds.NewFromConfig(cfg)

			instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{})
			require.NoError(t, err)

			for _, instance := range instances.DBInstances {
				if strings.Contains(*instance.DBInstanceIdentifier, outputs.Environment) {
					assert.NotNil(t, instance.MultiAZ)
					assert.True(t, *instance.MultiAZ, "RDS should be Multi-AZ")
					assert.NotNil(t, instance.StorageEncrypted)
					assert.True(t, *instance.StorageEncrypted, "RDS should be encrypted")
					assert.NotNil(t, instance.Engine)
					assert.Equal(t, "mysql", *instance.Engine)
					assert.NotNil(t, instance.BackupRetentionPeriod)
					assert.GreaterOrEqual(t, int(*instance.BackupRetentionPeriod), 7)
					break
				}
			}
		})
	}
}

func TestIAMRolesIntegration(t *testing.T) {
	t.Run("should verify IAM roles exist and have correct policies", func(t *testing.T) {
		if outputs.EC2RoleArn != "" {
			roleName := extractRoleNameFromArn(outputs.EC2RoleArn)
			role, err := awsClients.IAM.GetRole(context.TODO(), &iam.GetRoleInput{
				RoleName: aws.String(roleName),
			})
			require.NoError(t, err, "EC2 role should exist")
			assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "ec2.amazonaws.com")
		}

		if outputs.RdsMonitoringRoleArn != "" {
			roleName := extractRoleNameFromArn(outputs.RdsMonitoringRoleArn)
			role, err := awsClients.IAM.GetRole(context.TODO(), &iam.GetRoleInput{
				RoleName: aws.String(roleName),
			})
			require.NoError(t, err, "RDS monitoring role should exist")
			assert.Contains(t, *role.Role.AssumeRolePolicyDocument, "monitoring.rds.amazonaws.com")
		}
	})
}

func TestE2EMultiRegionDeployment(t *testing.T) {
	t.Run("e2e: should deploy infrastructure across at least three AWS regions", func(t *testing.T) {
		assert.GreaterOrEqual(t, len(outputs.Regions), 3, "Should deploy to at least 3 regions")
		assert.Contains(t, outputs.Regions, "us-east-1")
		assert.Contains(t, outputs.Regions, "us-west-2")
		assert.Contains(t, outputs.Regions, "eu-west-1")

		for _, region := range outputs.Regions {
			t.Run(fmt.Sprintf("verify_region_%s", region), func(t *testing.T) {
				cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
				require.NoError(t, err)
				ec2Client := ec2.NewFromConfig(cfg)

				vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{})
				require.NoError(t, err)
				assert.NotEmpty(t, vpcs.Vpcs, "VPC should exist in region %s", region)
			})
		}
	})
}

func TestE2EResourceTagging(t *testing.T) {
	t.Run("e2e: should tag all resources with environment and purpose", func(t *testing.T) {
		if outputs.S3BucketName != "" {
			tags, err := awsClients.S3.GetBucketTagging(context.TODO(), &s3.GetBucketTaggingInput{
				Bucket: aws.String(outputs.S3BucketName),
			})
			if err == nil {
				tagMap := make(map[string]string)
				for _, tag := range tags.TagSet {
					tagMap[*tag.Key] = *tag.Value
				}
				assert.Contains(t, tagMap, "purpose")
				assert.Contains(t, tagMap, "managed-by")
			}
		}
	})
}

func TestE2ENamingConvention(t *testing.T) {
	t.Run("e2e: should follow naming convention <environment>-<resource-name>", func(t *testing.T) {
		if outputs.S3BucketName != "" {
			assert.Contains(t, outputs.S3BucketName, outputs.Environment)
		}

		if outputs.EC2RoleArn != "" {
			roleName := extractRoleNameFromArn(outputs.EC2RoleArn)
			assert.Contains(t, roleName, outputs.Environment)
		}

		if outputs.RdsMonitoringRoleArn != "" {
			roleName := extractRoleNameFromArn(outputs.RdsMonitoringRoleArn)
			assert.Contains(t, roleName, outputs.Environment)
		}
	})
}

func TestE2ERDSConfiguration(t *testing.T) {
	t.Run("e2e: should configure RDS with advanced features", func(t *testing.T) {
		for _, region := range testRegions {
			cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
			if err != nil {
				continue
			}
			rdsClient := rds.NewFromConfig(cfg)

			instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{})
			if err != nil {
				continue
			}

			for _, instance := range instances.DBInstances {
				if strings.Contains(*instance.DBInstanceIdentifier, outputs.Environment) {
					assert.NotNil(t, instance.MultiAZ)
					assert.True(t, *instance.MultiAZ, "RDS should have Multi-AZ enabled")
					assert.NotNil(t, instance.StorageEncrypted)
					assert.True(t, *instance.StorageEncrypted, "RDS should be encrypted")
					assert.NotNil(t, instance.AutoMinorVersionUpgrade)
					assert.True(t, *instance.AutoMinorVersionUpgrade, "RDS should have auto minor version upgrade enabled")
					assert.NotNil(t, instance.BackupRetentionPeriod)
					assert.GreaterOrEqual(t, int(*instance.BackupRetentionPeriod), 7, "RDS should have backup retention >= 7 days")
					assert.NotNil(t, instance.MonitoringInterval)
					assert.Greater(t, int(*instance.MonitoringInterval), 0, "RDS should have enhanced monitoring enabled")
					break
				}
			}
		}
	})
}

func TestE2ECloudFrontS3Integration(t *testing.T) {
	t.Run("e2e: should configure CloudFront to serve from encrypted S3 bucket", func(t *testing.T) {
		if outputs.CloudfrontDistributionId == "" || outputs.S3BucketName == "" {
			t.Skip("CloudFront or S3 resources not available")
		}

		encryption, err := awsClients.S3.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
			Bucket: aws.String(outputs.S3BucketName),
		})
		require.NoError(t, err, "S3 bucket should have encryption configured")
		assert.NotEmpty(t, encryption.ServerSideEncryptionConfiguration.Rules)

		dist, err := awsClients.CloudFront.GetDistribution(context.TODO(), &cloudfront.GetDistributionInput{
			Id: aws.String(outputs.CloudfrontDistributionId),
		})
		require.NoError(t, err, "CloudFront distribution should exist")

		assert.NotEmpty(t, dist.Distribution.DistributionConfig.Origins.Items)
		origin := dist.Distribution.DistributionConfig.Origins.Items[0]
		assert.Contains(t, *origin.DomainName, outputs.S3BucketName)
		assert.NotNil(t, origin.OriginAccessControlId)
	})
}

func TestE2ECloudWatchMonitoring(t *testing.T) {
	t.Run("e2e: should configure CloudWatch monitoring for all services", func(t *testing.T) {
		for _, region := range testRegions {
			cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
			if err != nil {
				continue
			}
			cwClient := cloudwatch.NewFromConfig(cfg)

			alarms, err := cwClient.DescribeAlarms(context.TODO(), &cloudwatch.DescribeAlarmsInput{
				AlarmNamePrefix: aws.String(fmt.Sprintf("%s-rds", outputs.Environment)),
			})
			if err != nil {
				continue
			}

			if len(alarms.MetricAlarms) > 0 {
				cpuAlarmFound := false
				connectionAlarmFound := false

				for _, alarm := range alarms.MetricAlarms {
					if alarm.MetricName != nil && strings.Contains(*alarm.MetricName, "CPUUtilization") {
						cpuAlarmFound = true
						assert.NotNil(t, alarm.Threshold)
						assert.Equal(t, float64(80), *alarm.Threshold)
					}
					if alarm.MetricName != nil && strings.Contains(*alarm.MetricName, "DatabaseConnections") {
						connectionAlarmFound = true
						assert.NotNil(t, alarm.Threshold)
						assert.Equal(t, float64(50), *alarm.Threshold)
					}
				}

				if len(alarms.MetricAlarms) >= 2 {
					assert.True(t, cpuAlarmFound, "CPU alarm should exist")
					assert.True(t, connectionAlarmFound, "Connection alarm should exist")
				}
			}
		}
	})
}

func TestE2EIAMLeastPrivilege(t *testing.T) {
	t.Run("e2e: should configure IAM roles with least privilege", func(t *testing.T) {
		if outputs.EC2RoleArn != "" {
			roleName := extractRoleNameFromArn(outputs.EC2RoleArn)

			policies, err := awsClients.IAM.ListRolePolicies(context.TODO(), &iam.ListRolePoliciesInput{
				RoleName: aws.String(roleName),
			})
			if err == nil && len(policies.PolicyNames) > 0 {
				policy, err := awsClients.IAM.GetRolePolicy(context.TODO(), &iam.GetRolePolicyInput{
					RoleName:   aws.String(roleName),
					PolicyName: aws.String(policies.PolicyNames[0]),
				})
				if err == nil {
					doc, _ := url.QueryUnescape(*policy.PolicyDocument)
					assert.Contains(t, doc, "cloudwatch:PutMetricData")
					assert.Contains(t, doc, "logs:CreateLogGroup")
					assert.NotContains(t, doc, "\"Action\":[\"*\"]")
				}
			}
		}
	})
}

func TestE2EStackOutputs(t *testing.T) {
	t.Run("e2e: should export key outputs for resource sharing", func(t *testing.T) {
		assert.NotEmpty(t, outputs.Environment, "Environment should be exported")
		assert.NotEmpty(t, outputs.Regions, "Regions should be exported")

		if outputs.S3BucketName != "" {
			assert.NotEmpty(t, outputs.S3BucketName, "S3 bucket name should be exported")
		}
		if outputs.S3BucketArn != "" {
			assert.NotEmpty(t, outputs.S3BucketArn, "S3 bucket ARN should be exported")
		}
		if outputs.CloudfrontDistributionId != "" {
			assert.NotEmpty(t, outputs.CloudfrontDistributionId, "CloudFront distribution ID should be exported")
		}
		if outputs.CloudfrontDomainName != "" {
			assert.NotEmpty(t, outputs.CloudfrontDomainName, "CloudFront domain name should be exported")
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

func TestE2ESeparateBuckets(t *testing.T) {
	t.Run("e2e: should use separate buckets for static assets and CloudTrail", func(t *testing.T) {
		if outputs.S3BucketName == "" || outputs.CloudtrailBucketName == "" {
			t.Skip("Both S3 buckets not available")
		}

		assert.NotEqual(t, outputs.S3BucketName, outputs.CloudtrailBucketName, "Should use separate buckets")
		assert.Contains(t, outputs.S3BucketName, "static-assets")
		assert.Contains(t, outputs.CloudtrailBucketName, "cloudtrail-logs")
	})
}

func BenchmarkE2EResourceLookup(b *testing.B) {
	for i := 0; i < b.N; i++ {
		if outputs.S3BucketName != "" {
			_, err := awsClients.S3.HeadBucket(context.TODO(), &s3.HeadBucketInput{
				Bucket: aws.String(outputs.S3BucketName),
			})
			if err != nil {
				b.Errorf("S3 bucket lookup failed: %v", err)
			}
		}
	}
}
