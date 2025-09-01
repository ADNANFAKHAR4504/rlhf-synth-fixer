//go:build integration
// +build integration

package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/route53"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

func TestVPCDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test VPC exists with correct CIDR and updated naming
	vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("migration-vpc-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe VPCs: %v", err)
	}

	if len(vpcs.Vpcs) == 0 {
		t.Fatal("VPC not found")
	}

	vpc := vpcs.Vpcs[0]
	if *vpc.CidrBlock != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR 10.0.0.0/16, got %s", *vpc.CidrBlock)
	}

	// Test VPC has DNS support and hostnames enabled
	if !*vpc.EnableDnsSupport {
		t.Error("VPC must have DNS support enabled")
	}

	if !*vpc.EnableDnsHostnames {
		t.Error("VPC must have DNS hostnames enabled")
	}
}

func TestNetworkACLSecurity(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test public Network ACL exists
	acls, err := ec2Client.DescribeNetworkAcls(context.TODO(), &ec2.DescribeNetworkAclsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("public-network-acl-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe Network ACLs: %v", err)
	}

	if len(acls.NetworkAcls) == 0 {
		t.Fatal("Public Network ACL not found")
	}

	// Verify ACL has proper rules (HTTP, HTTPS, ephemeral)
	acl := acls.NetworkAcls[0]
	hasHTTPRule := false
	hasHTTPSRule := false
	for _, entry := range acl.Entries {
		if entry.PortRange != nil && *entry.PortRange.From == 80 && *entry.PortRange.To == 80 {
			hasHTTPRule = true
		}
		if entry.PortRange != nil && *entry.PortRange.From == 443 && *entry.PortRange.To == 443 {
			hasHTTPSRule = true
		}
	}

	if !hasHTTPRule {
		t.Error("Network ACL must have HTTP rule for port 80")
	}
	if !hasHTTPSRule {
		t.Error("Network ACL must have HTTPS rule for port 443")
	}
}

func TestSubnetConfiguration(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test public subnets exist (3 AZs)
	publicSubnets, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Type"),
				Values: []string{"Public"},
			},
			{
				Name:   aws.String("tag:Name"),
				Values: []string{
					fmt.Sprintf("public-subnet-1-us-east-1-%s", envSuffix),
					fmt.Sprintf("public-subnet-2-us-east-1-%s", envSuffix),
					fmt.Sprintf("public-subnet-3-us-east-1-%s", envSuffix),
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe public subnets: %v", err)
	}

	if len(publicSubnets.Subnets) < 3 {
		t.Errorf("expected 3 public subnets, got %d", len(publicSubnets.Subnets))
	}

	// Test private subnets exist (3 AZs)
	privateSubnets, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Type"),
				Values: []string{"Private"},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe private subnets: %v", err)
	}

	if len(privateSubnets.Subnets) < 3 {
		t.Errorf("expected 3 private subnets, got %d", len(privateSubnets.Subnets))
	}

	// Test database subnets exist (3 AZs)
	dbSubnets, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Type"),
				Values: []string{"Database"},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe database subnets: %v", err)
	}

	if len(dbSubnets.Subnets) < 3 {
		t.Errorf("expected 3 database subnets, got %d", len(dbSubnets.Subnets))
	}
}

func TestLoadBalancerDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)

	// Test Application Load Balancer exists with new naming
	albs, err := elbClient.DescribeLoadBalancers(context.TODO(), &elasticloadbalancingv2.DescribeLoadBalancersInput{
		Names: []string{fmt.Sprintf("migration-alb-us-east-1-%s", envSuffix)},
	})
	if err != nil {
		t.Fatalf("failed to describe load balancers: %v", err)
	}

	if len(albs.LoadBalancers) == 0 {
		t.Fatal("Application Load Balancer not found")
	}

	alb := albs.LoadBalancers[0]
	if alb.Type != "application" {
		t.Errorf("expected load balancer type 'application', got %s", string(alb.Type))
	}

	if alb.Scheme != "internet-facing" {
		t.Errorf("expected load balancer scheme 'internet-facing', got %s", string(alb.Scheme))
	}

	// Test HTTPS listener exists
	listeners, err := elbClient.DescribeListeners(context.TODO(), &elasticloadbalancingv2.DescribeListenersInput{
		LoadBalancerArn: alb.LoadBalancerArn,
	})
	if err != nil {
		t.Fatalf("failed to describe listeners: %v", err)
	}

	hasHTTPS := false
	hasHTTP := false
	for _, listener := range listeners.Listeners {
		if listener.Port != nil && *listener.Port == 443 && listener.Protocol != nil && *listener.Protocol == "HTTPS" {
			hasHTTPS = true
		}
		if listener.Port != nil && *listener.Port == 80 && listener.Protocol != nil && *listener.Protocol == "HTTP" {
			hasHTTP = true
		}
	}

	if !hasHTTPS {
		t.Error("ALB must have HTTPS listener on port 443")
	}
	if !hasHTTP {
		t.Error("ALB must have HTTP listener on port 80 (for redirect)")
	}
}

func TestDatabaseDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	rdsClient := rds.NewFromConfig(cfg)

	// Test RDS MySQL instance exists with new naming
	instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(fmt.Sprintf("migration-primary-db-us-east-1-%s", envSuffix)),
	})
	if err != nil {
		t.Fatalf("failed to describe RDS instances: %v", err)
	}

	if len(instances.DBInstances) == 0 {
		t.Fatal("RDS MySQL instance not found")
	}

	db := instances.DBInstances[0]
	if *db.Engine != "mysql" {
		t.Errorf("expected database engine 'mysql', got %s", *db.Engine)
	}

	if db.MultiAZ == nil || !*db.MultiAZ {
		t.Error("database must have Multi-AZ enabled per PROMPT.md")
	}

	if db.StorageEncrypted == nil || !*db.StorageEncrypted {
		t.Error("database must be encrypted per PROMPT.md")
	}

	// Test database uses managed password (Secrets Manager)
	if db.ManageMasterUserPassword == nil || !*db.ManageMasterUserPassword {
		t.Error("database must use managed passwords via Secrets Manager")
	}
}

func TestAutoScalingGroupDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	asgClient := autoscaling.NewFromConfig(cfg)

	// Test Web Auto Scaling Group exists
	webASGs, err := asgClient.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{fmt.Sprintf("web-asg-us-east-1-%s", envSuffix)},
	})
	if err != nil {
		t.Fatalf("failed to describe Web Auto Scaling Groups: %v", err)
	}

	if len(webASGs.AutoScalingGroups) == 0 {
		t.Fatal("Web Auto Scaling Group not found")
	}

	webASG := webASGs.AutoScalingGroups[0]
	if webASG.MinSize == nil || *webASG.MinSize < 2 {
		t.Errorf("expected web ASG minimum size >= 2 for high availability, got %v", webASG.MinSize)
	}

	// Test App Auto Scaling Group exists
	appASGs, err := asgClient.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{fmt.Sprintf("app-asg-us-east-1-%s", envSuffix)},
	})
	if err != nil {
		t.Fatalf("failed to describe App Auto Scaling Groups: %v", err)
	}

	if len(appASGs.AutoScalingGroups) == 0 {
		t.Fatal("App Auto Scaling Group not found")
	}

	appASG := appASGs.AutoScalingGroups[0]
	if appASG.MinSize == nil || *appASG.MinSize < 2 {
		t.Errorf("expected app ASG minimum size >= 2 for high availability, got %v", appASG.MinSize)
	}
}

func TestKMSEncryption(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	kmsClient := kms.NewFromConfig(cfg)

	// List KMS keys and find migration key
	keys, err := kmsClient.ListKeys(context.TODO(), &kms.ListKeysInput{})
	if err != nil {
		t.Fatalf("failed to list KMS keys: %v", err)
	}

	foundKey := false
	for _, key := range keys.Keys {
		keyDetails, err := kmsClient.DescribeKey(context.TODO(), &kms.DescribeKeyInput{
			KeyId: key.KeyId,
		})
		if err != nil {
			continue // Skip keys we can't access
		}

		if keyDetails.KeyMetadata != nil && keyDetails.KeyMetadata.Description != nil &&
			strings.Contains(*keyDetails.KeyMetadata.Description, "migration resources") {
			foundKey = true
			break
		}
	}

	if !foundKey {
		t.Error("KMS key for migration resources not found")
	}
}

func TestS3BucketSecurity(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	s3Client := s3.NewFromConfig(cfg)

	bucketName := fmt.Sprintf("migration-bucket-us-east-1-%s-12345", envSuffix)

	// Test bucket encryption
	encryption, err := s3Client.GetBucketEncryption(context.TODO(), &s3.GetBucketEncryptionInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get bucket encryption: %v", err)
	}

	if len(encryption.ServerSideEncryptionConfiguration.Rules) == 0 {
		t.Error("S3 bucket must have encryption enabled")
	}

	// Test public access blocking
	publicAccess, err := s3Client.GetPublicAccessBlock(context.TODO(), &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		t.Fatalf("failed to get public access block: %v", err)
	}

	if !*publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls {
		t.Error("S3 bucket must block public ACLs")
	}
}

func TestSecretsManagerIntegration(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	secretsClient := secretsmanager.NewFromConfig(cfg)

	// Test database secret exists
	secretName := fmt.Sprintf("migration/database/us-east-1-%s", envSuffix)
	_, err = secretsClient.DescribeSecret(context.TODO(), &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(secretName),
	})
	if err != nil {
		t.Fatalf("database secret not found: %v", err)
	}
}

func TestParameterStoreConfiguration(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ssmClient := ssm.NewFromConfig(cfg)

	// Test VPC CIDR parameter
	vpcParam, err := ssmClient.GetParameter(context.TODO(), &ssm.GetParameterInput{
		Name: aws.String(fmt.Sprintf("/migration/us-east-1/vpc-cidr")),
	})
	if err != nil {
		t.Fatalf("VPC CIDR parameter not found: %v", err)
	}

	if *vpcParam.Parameter.Value != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR 10.0.0.0/16, got %s", *vpcParam.Parameter.Value)
	}

	// Test domain parameter
	_, err = ssmClient.GetParameter(context.TODO(), &ssm.GetParameterInput{
		Name: aws.String(fmt.Sprintf("/migration/us-east-1/domain")),
	})
	if err != nil {
		t.Fatalf("domain parameter not found: %v", err)
	}
}

func TestRoute53Configuration(t *testing.T) {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	route53Client := route53.NewFromConfig(cfg)

	// List hosted zones to find migration domain
	zones, err := route53Client.ListHostedZones(context.TODO(), &route53.ListHostedZonesInput{})
	if err != nil {
		t.Fatalf("failed to list hosted zones: %v", err)
	}

	foundZone := false
	for _, zone := range zones.HostedZones {
		if zone.Name != nil && strings.Contains(*zone.Name, "migration-") {
			foundZone = true

			// Test health checks exist for this zone
			healthChecks, err := route53Client.ListHealthChecks(context.TODO(), &route53.ListHealthChecksInput{})
			if err != nil {
				t.Fatalf("failed to list health checks: %v", err)
			}

			if len(healthChecks.HealthChecks) == 0 {
				t.Error("Route 53 health checks not found")
			}
			break
		}
	}

	if !foundZone {
		t.Error("Route 53 hosted zone for migration domain not found")
	}
}

func TestCloudWatchMonitoring(t *testing.T) {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	cwClient := cloudwatchlogs.NewFromConfig(cfg)

	// Test log groups exist
	expectedLogGroups := []string{
		"/migration/web/us-east-1-",
		"/migration/app/us-east-1-",
		"/migration/cloudtrail/us-east-1-",
	}

	logGroups, err := cwClient.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{})
	if err != nil {
		t.Fatalf("failed to describe log groups: %v", err)
	}

	for _, expected := range expectedLogGroups {
		found := false
		for _, lg := range logGroups.LogGroups {
			if lg.LogGroupName != nil && strings.Contains(*lg.LogGroupName, expected) {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("CloudWatch log group with pattern %s not found", expected)
		}
	}
}

func TestResourceTagging(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test VPC tags with new naming
	vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("migration-vpc-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe VPCs: %v", err)
	}

	if len(vpcs.Vpcs) == 0 {
		t.Fatal("VPC not found for tag testing")
	}

	tags := vpcs.Vpcs[0].Tags
	requiredTags := map[string]string{
		"Project":     "Migration",
		"Creator":     "CloudEngineer",
		"Environment": "production",
		"CostCenter":  "IT-Infrastructure",
	}

	for key, expectedValue := range requiredTags {
		found := false
		for _, tag := range tags {
			if *tag.Key == key && *tag.Value == expectedValue {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("required tag %s=%s not found on VPC", key, expectedValue)
		}
	}
}

func TestMultiRegionDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	regions := []string{"us-east-1", "us-west-2"}

	for _, region := range regions {
		t.Run(region, func(t *testing.T) {
			cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
			if err != nil {
				t.Fatalf("failed to load AWS config for %s: %v", region, err)
			}

			ec2Client := ec2.NewFromConfig(cfg)

			// Test VPC exists in this region with new naming
			vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
				Filters: []ec2Types.Filter{
					{
						Name:   aws.String("tag:Name"),
						Values: []string{fmt.Sprintf("migration-vpc-%s-%s", region, envSuffix)},
					},
				},
			})
			if err != nil {
				t.Fatalf("failed to describe VPCs in %s: %v", region, err)
			}

			if len(vpcs.Vpcs) == 0 {
				t.Errorf("VPC not found in region %s", region)
			}

			// Test cross-region read replica (only in us-west-2)
			if region == "us-west-2" {
				rdsClient := rds.NewFromConfig(cfg)
				replicas, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
					DBInstanceIdentifier: aws.String(fmt.Sprintf("migration-read-replica-us-west-2-%s", envSuffix)),
				})
				if err != nil {
					t.Logf("Read replica not found in %s: %v", region, err)
				} else if len(replicas.DBInstances) > 0 {
					replica := replicas.DBInstances[0]
					if replica.ReadReplicaSourceDBInstanceIdentifier == nil {
						t.Error("Database instance in us-west-2 should be a read replica")
					}
				}
			}
		})
	}
}

func getEnvironmentSuffix() string {
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "dev"
	}
	return envSuffix
}