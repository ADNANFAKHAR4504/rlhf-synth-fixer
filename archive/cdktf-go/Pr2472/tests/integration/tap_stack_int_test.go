//go:build integration
// +build integration

package main

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/autoscaling"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2Types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2"
	elbv2Types "github.com/aws/aws-sdk-go-v2/service/elasticloadbalancingv2/types"
	"github.com/aws/aws-sdk-go-v2/service/rds"
)

func TestVPCDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test VPC exists with correct CIDR and actual naming convention
	vpcs, err := ec2Client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-vpc-us-east-1-%s", envSuffix)},
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

	// Test VPC DNS settings using DescribeVpcAttribute
	dnsSupportResult, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     vpc.VpcId,
		Attribute: ec2Types.VpcAttributeNameEnableDnsSupport,
	})
	if err != nil {
		t.Fatalf("failed to describe VPC DNS support: %v", err)
	}
	if !*dnsSupportResult.EnableDnsSupport.Value {
		t.Error("VPC must have DNS support enabled")
	}

	dnsHostnamesResult, err := ec2Client.DescribeVpcAttribute(context.TODO(), &ec2.DescribeVpcAttributeInput{
		VpcId:     vpc.VpcId,
		Attribute: ec2Types.VpcAttributeNameEnableDnsHostnames,
	})
	if err != nil {
		t.Fatalf("failed to describe VPC DNS hostnames: %v", err)
	}
	if !*dnsHostnamesResult.EnableDnsHostnames.Value {
		t.Error("VPC must have DNS hostnames enabled")
	}
}

func TestSubnetDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test public subnets exist (2 AZs for our actual implementation)
	publicSubnet1, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-public-subnet-1-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe public subnet 1: %v", err)
	}
	if len(publicSubnet1.Subnets) == 0 {
		t.Fatal("Public subnet 1 not found")
	}

	publicSubnet2, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-public-subnet-2-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe public subnet 2: %v", err)
	}
	if len(publicSubnet2.Subnets) == 0 {
		t.Fatal("Public subnet 2 not found")
	}

	// Test private subnets exist
	privateSubnet1, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-private-subnet-1-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe private subnet 1: %v", err)
	}
	if len(privateSubnet1.Subnets) == 0 {
		t.Fatal("Private subnet 1 not found")
	}

	privateSubnet2, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-private-subnet-2-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe private subnet 2: %v", err)
	}
	if len(privateSubnet2.Subnets) == 0 {
		t.Fatal("Private subnet 2 not found")
	}

	// Test database subnets exist
	dbSubnet1, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-db-subnet-1-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe database subnet 1: %v", err)
	}
	if len(dbSubnet1.Subnets) == 0 {
		t.Fatal("Database subnet 1 not found")
	}

	dbSubnet2, err := ec2Client.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-db-subnet-2-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe database subnet 2: %v", err)
	}
	if len(dbSubnet2.Subnets) == 0 {
		t.Fatal("Database subnet 2 not found")
	}
}

func TestLoadBalancerDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	elbClient := elasticloadbalancingv2.NewFromConfig(cfg)

	// Test Application Load Balancer exists with actual naming
	albs, err := elbClient.DescribeLoadBalancers(context.TODO(), &elasticloadbalancingv2.DescribeLoadBalancersInput{
		Names: []string{fmt.Sprintf("tap-alb-us-east-1-%s", envSuffix)},
	})
	if err != nil {
		t.Fatalf("failed to describe load balancers: %v", err)
	}

	if len(albs.LoadBalancers) == 0 {
		t.Fatal("Application Load Balancer not found")
	}

	alb := albs.LoadBalancers[0]
	if alb.Type != elbv2Types.LoadBalancerTypeEnumApplication {
		t.Errorf("expected load balancer type 'application', got %s", string(alb.Type))
	}

	if alb.Scheme != elbv2Types.LoadBalancerSchemeEnumInternetFacing {
		t.Errorf("expected load balancer scheme 'internet-facing', got %s", string(alb.Scheme))
	}

	// Test HTTP listener exists (our actual implementation is HTTP-only)
	listeners, err := elbClient.DescribeListeners(context.TODO(), &elasticloadbalancingv2.DescribeListenersInput{
		LoadBalancerArn: alb.LoadBalancerArn,
	})
	if err != nil {
		t.Fatalf("failed to describe listeners: %v", err)
	}

	hasHTTP := false
	for _, listener := range listeners.Listeners {
		if listener.Port != nil && *listener.Port == 80 && listener.Protocol == elbv2Types.ProtocolEnumHttp {
			hasHTTP = true
		}
	}

	if !hasHTTP {
		t.Error("ALB must have HTTP listener on port 80")
	}
}

func TestDatabaseDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	rdsClient := rds.NewFromConfig(cfg)

	// Test RDS MySQL instance exists with actual naming
	instances, err := rdsClient.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(fmt.Sprintf("tap-database-us-east-1-%s", envSuffix)),
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
		t.Error("database must have Multi-AZ enabled")
	}

	if db.StorageEncrypted == nil || !*db.StorageEncrypted {
		t.Error("database must be encrypted")
	}
}

func TestAutoScalingGroupDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	asgClient := autoscaling.NewFromConfig(cfg)

	// Test Auto Scaling Group exists with actual naming
	asgs, err := asgClient.DescribeAutoScalingGroups(context.TODO(), &autoscaling.DescribeAutoScalingGroupsInput{
		AutoScalingGroupNames: []string{fmt.Sprintf("tap-asg-us-east-1-%s", envSuffix)},
	})
	if err != nil {
		t.Fatalf("failed to describe Auto Scaling Groups: %v", err)
	}

	if len(asgs.AutoScalingGroups) == 0 {
		t.Fatal("Auto Scaling Group not found")
	}

	asg := asgs.AutoScalingGroups[0]
	if asg.MinSize == nil || *asg.MinSize < 2 {
		t.Errorf("expected ASG minimum size >= 2 for high availability, got %v", asg.MinSize)
	}

	if asg.DesiredCapacity == nil || *asg.DesiredCapacity != 2 {
		t.Errorf("expected ASG desired capacity = 2, got %v", asg.DesiredCapacity)
	}

	if asg.MaxSize == nil || *asg.MaxSize < 2 {
		t.Errorf("expected ASG maximum size >= 2, got %v", asg.MaxSize)
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	ec2Client := ec2.NewFromConfig(cfg)

	// Test ALB Security Group exists
	albSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{fmt.Sprintf("tap-alb-sg-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe ALB security group: %v", err)
	}
	if len(albSG.SecurityGroups) == 0 {
		t.Fatal("ALB Security Group not found")
	}

	// Test Web Security Group exists
	webSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{fmt.Sprintf("tap-web-sg-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe Web security group: %v", err)
	}
	if len(webSG.SecurityGroups) == 0 {
		t.Fatal("Web Security Group not found")
	}

	// Test Database Security Group exists
	dbSG, err := ec2Client.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{fmt.Sprintf("tap-db-sg-us-east-1-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe Database security group: %v", err)
	}
	if len(dbSG.SecurityGroups) == 0 {
		t.Fatal("Database Security Group not found")
	}
}

func TestCloudWatchLogging(t *testing.T) {
	envSuffix := getEnvironmentSuffix()
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-1"))
	if err != nil {
		t.Fatalf("failed to load AWS config: %v", err)
	}

	logsClient := cloudwatchlogs.NewFromConfig(cfg)

	// Test CloudWatch Log Group exists
	logGroups, err := logsClient.DescribeLogGroups(context.TODO(), &cloudwatchlogs.DescribeLogGroupsInput{
		LogGroupNamePrefix: aws.String(fmt.Sprintf("/aws/ec2/tap-log-group-us-east-1-%s", envSuffix)),
	})
	if err != nil {
		t.Fatalf("failed to describe log groups: %v", err)
	}

	if len(logGroups.LogGroups) == 0 {
		t.Fatal("CloudWatch Log Group not found")
	}

	logGroup := logGroups.LogGroups[0]
	if logGroup.RetentionInDays == nil || *logGroup.RetentionInDays != 14 {
		t.Errorf("expected log retention of 14 days, got %v", logGroup.RetentionInDays)
	}
}

func TestMultiRegionDeployment(t *testing.T) {
	envSuffix := getEnvironmentSuffix()

	// Test us-west-2 region
	cfgWest, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-west-2"))
	if err != nil {
		t.Fatalf("failed to load AWS config for us-west-2: %v", err)
	}

	ec2ClientWest := ec2.NewFromConfig(cfgWest)

	// Test VPC exists in us-west-2
	vpcsWest, err := ec2ClientWest.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
		Filters: []ec2Types.Filter{
			{
				Name:   aws.String("tag:Name"),
				Values: []string{fmt.Sprintf("tap-vpc-us-west-2-%s", envSuffix)},
			},
		},
	})
	if err != nil {
		t.Fatalf("failed to describe VPCs in us-west-2: %v", err)
	}

	if len(vpcsWest.Vpcs) == 0 {
		t.Fatal("VPC not found in us-west-2")
	}

	vpcWest := vpcsWest.Vpcs[0]
	if *vpcWest.CidrBlock != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR 10.0.0.0/16 in us-west-2, got %s", *vpcWest.CidrBlock)
	}
}

// Helper function to get environment suffix
func getEnvironmentSuffix() string {
	envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envSuffix == "" {
		envSuffix = "dev"
	}
	return envSuffix
}
