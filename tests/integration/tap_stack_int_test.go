//go:build integration
// +build integration

package main

import (
	"context"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
)

func TestVPCDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test VPC exists with correct CIDR
	vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{"tap-vpc-" + envSuffix},
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
}

func TestSubnetConfiguration(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test public subnets exist
	publicSubnets, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{"tap-public-subnet-1-" + envSuffix, "tap-public-subnet-2-" + envSuffix},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe public subnets: %v", err)
	}

	if len(publicSubnets.Subnets) < 2 {
		t.Errorf("expected at least 2 public subnets, got %d", len(publicSubnets.Subnets))
	}

	// Test private subnets exist
	privateSubnets, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{"tap-private-subnet-1-" + envSuffix, "tap-private-subnet-2-" + envSuffix},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe private subnets: %v", err)
	}

	if len(privateSubnets.Subnets) < 2 {
		t.Errorf("expected at least 2 private subnets, got %d", len(privateSubnets.Subnets))
	}
}

func TestLoadBalancerDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)

	// Test Application Load Balancer exists
	albs, err := elbClient.DescribeLoadBalancers(context.TODO(), &elasticloadbalancingv2.DescribeLoadBalancersInput{
		Names: []string{"tap-alb-" + envSuffix},
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
}

func TestDatabaseDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	rdsClient := rds.NewFromConfig(cfg)

	// Test RDS MySQL instance exists
	instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String("tap-database-" + envSuffix),
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
}

func TestAutoScalingGroupDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	asgClient := autoscaling.NewFromConfig(cfg)

	// Test Auto Scaling Group exists
	asgs, err := asgClient.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{"tap-asg-" + envSuffix},
	})
	if err != nil {
		t.Fatalf("failed to describe Auto Scaling Groups: %v", err)
	}

	if len(asgs.AutoScalingGroups) == 0 {
		t.Fatal("Auto Scaling Group not found")
	}

	asg := asgs.AutoScalingGroups[0]
	if asg.MinSize == nil || *asg.MinSize < 2 {
		t.Errorf("expected minimum size >= 2 for high availability, got %v", asg.MinSize)
	}

	if asg.MaxSize == nil || *asg.MaxSize < 4 {
		t.Errorf("expected maximum size >= 4 for scalability, got %v", asg.MaxSize)
	}
}

func TestResourceTagging(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test VPC tags
	vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{"tap-vpc-" + envSuffix},
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
		"Project": "Migration",
		"Creator": "CloudEngineer",
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

			// Test VPC exists in this region
			vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
				Filters: []ec2Types.Filter{
					{
						Name:   aws.String("tag:Name"),
						Values: []string{"tap-vpc-" + envSuffix},
					},
				},
			})
			if err != nil {
				t.Fatalf("failed to describe VPCs in %s: %v", region, err)
			}

			if len(vpcs.Vpcs) == 0 {
				t.Errorf("VPC not found in region %s", region)
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
