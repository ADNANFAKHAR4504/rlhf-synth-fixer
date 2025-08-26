# Tap CDK Stack

This document provides the Go code for the Tap CDK stack, which defines the AWS infrastructure for the Tap project.

## `lib/tap_stack.go`

This file contains the core logic for the CDK stack, including the definition of resources like VPC, S3 buckets, EC2 instances, and RDS database.

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	// Configurable parameters
	AllowedSSHIP      *string
	EC2InstanceType   *string
	DBInstanceClass   *string
	DBUsername        *string
	DBPassword        *string
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Default values for parameters
	if props.AllowedSSHIP == nil {
		props.AllowedSSHIP = jsii.String("0.0.0.0/0")
	}
	if props.EC2InstanceType == nil {
		props.EC2InstanceType = jsii.String("t3.micro")
	}
	if props.DBInstanceClass == nil {
		props.DBInstanceClass = jsii.String("t3.micro")
	}
	if props.DBUsername == nil {
		props.DBUsername = jsii.String("admin")
	}
	if props.DBPassword == nil {
		props.DBPassword = jsii.String("TempPassword123!")
	}

	commonTags := map[string]*string{
		"Environment": jsii.String("Production"),
		"Project":     jsii.String("CDKSetup"),
	}

	vpc := awsec2.NewVpc(stack, jsii.String("cf-vpc"), &awsec2.VpcProps{
		MaxAzs:             jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{Name: jsii.String("cf-public-subnet"), SubnetType: awsec2.SubnetType_PUBLIC, CidrMask: jsii.Number(24)},
			{Name: jsii.String("cf-private-subnet"), SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, CidrMask: jsii.Number(24)},
		},
		NatGateways: jsii.Number(0),
	})
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("cf-vpc"), nil)
	for key, value := range commonTags {
		awscdk.Tags_Of(vpc).Add(jsii.String(key), value, nil)
	}

	loggingBucket := awss3.NewBucket(stack, jsii.String("cf-access-logs-bucket"), &awss3.BucketProps{
		BucketName:        nil, // Let CDK generate a unique name
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
	})

	bucket := awss3.NewBucket(stack, jsii.String("cf-assets-bucket"), &awss3.BucketProps{
		BucketName:             nil, // Let CDK generate a unique name
		Versioned:              jsii.Bool(true),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(bucket).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(loggingBucket).Add(jsii.String(key), value, nil)
	}

	s3VpcEndpoint := awsec2.NewGatewayVpcEndpoint(stack, jsii.String("cf-s3-vpc-endpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
		Subnets: &[]*awsec2.SubnetSelection{
			{SubnetType: awsec2.SubnetType_PUBLIC},
			{SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED},
		},
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(s3VpcEndpoint).Add(jsii.String(key), value, nil)
	}

	ec2SecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-ec2-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-ec2-sg"),
		Description:       jsii.String("Security group for EC2 web server"),
		AllowAllOutbound:  jsii.Bool(true),
	})
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("Allow HTTP traffic from anywhere"), jsii.Bool(false))
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("Allow HTTPS traffic from anywhere"), jsii.Bool(false))
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_Ipv4(props.AllowedSSHIP), awsec2.Port_Tcp(jsii.Number(22)), jsii.String("Allow SSH from specified IP"), jsii.Bool(false))

	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-rds-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-rds-sg"),
		Description:       jsii.String("Security group for RDS MySQL instance"),
		AllowAllOutbound:  jsii.Bool(false),
	})
	rdsSecurityGroup.AddIngressRule(ec2SecurityGroup, awsec2.Port_Tcp(jsii.Number(3306)), jsii.String("Allow MySQL traffic from EC2 instances"), jsii.Bool(false))
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2SecurityGroup).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String(key), value, nil)
	}

	ec2Role := awsiam.NewRole(stack, jsii.String("cf-ec2-role"), &awsiam.RoleProps{
		RoleName:  jsii.String("cf-ec2-role"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})
	s3Policy := awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect:  awsiam.Effect_ALLOW,
		Actions: &[]*string{jsii.String("s3:GetObject"), jsii.String("s3:ListBucket")},
		Resources: &[]*string{
			bucket.BucketArn(),
			bucket.ArnForObjects(jsii.String("*")),
		},
	})
	ec2Role.AddToPolicy(s3Policy)
	instanceProfile := awsiam.NewCfnInstanceProfile(stack, jsii.String("cf-ec2-instance-profile"), &awsiam.CfnInstanceProfileProps{
		InstanceProfileName: jsii.String("cf-ec2-instance-profile"),
		Roles:               &[]*string{ec2Role.RoleName()},
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Role).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(instanceProfile).Add(jsii.String(key), value, nil)
	}

	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("cf-db-subnet-group"), &awsrds.SubnetGroupProps{
		Description:     jsii.String("Subnet group for RDS instance"),
		Vpc:             vpc,
		VpcSubnets:      &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED},
		SubnetGroupName: jsii.String("cf-db-subnet-group-" + environmentSuffix),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(dbSubnetGroup).Add(jsii.String(key), value, nil)
	}

	rdsInstance := awsrds.NewDatabaseInstance(stack, jsii.String("cf-rds-mysql"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0(),
		}),
		InstanceType:              awsec2.NewInstanceType(props.DBInstanceClass),
		Vpc:                       vpc,
		SecurityGroups:            &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:               dbSubnetGroup,
		DatabaseName:              jsii.String("cfdb"),
		Credentials:               awsrds.Credentials_FromPassword(props.DBUsername, awscdk.SecretValue_UnsafePlainText(props.DBPassword)),
		MultiAz:                   jsii.Bool(true),
		AllocatedStorage:          jsii.Number(20),
		StorageType:               awsrds.StorageType_GP2,
		BackupRetention:           awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection:        jsii.Bool(false),
		InstanceIdentifier:        jsii.String("cf-rds-mysql-" + environmentSuffix),
		MonitoringInterval:        awscdk.Duration_Seconds(jsii.Number(60)),
		EnablePerformanceInsights: jsii.Bool(false),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(rdsInstance).Add(jsii.String(key), value, nil)
	}

	cpuAlarm := awscloudwatch.NewAlarm(stack, jsii.String("cf-rds-cpu-alarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("cf-rds-high-cpu-" + environmentSuffix),
		AlarmDescription: jsii.String("RDS CPU utilization is too high"),
		Metric: rdsInstance.MetricCPUUtilization(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(75),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(cpuAlarm).Add(jsii.String(key), value, nil)
	}

	amzLinux2 := awsec2.MachineImage_LatestAmazonLinux2(nil)
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	userData.AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y httpd"),
		jsii.String("systemctl start httpd"),
		jsii.String("systemctl enable httpd"),
		jsii.String("echo '<h1>CF Foundation Stack - Web Server</h1>' > /var/www/html/index.html"),
		jsii.String("echo '<p>Instance ID: ' $(curl -s http://169.254.169.24/latest/meta-data/instance-id) '</p>' >> /var/www/html/index.html"),
	)
	ec2Instance := awsec2.NewInstance(stack, jsii.String("cf-web-server"), &awsec2.InstanceProps{
		InstanceType:  awsec2.NewInstanceType(props.EC2InstanceType),
		MachineImage:  amzLinux2,
		Vpc:           vpc,
		VpcSubnets:    &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
		SecurityGroup: ec2SecurityGroup,
		Role:          ec2Role,
		UserData:      userData,
		InstanceName:  jsii.String("cf-web-server-dev"),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Instance).Add(jsii.String(key), value, nil)
	}

	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{Value: vpc.VpcId()})
	awscdk.NewCfnOutput(stack, jsii.String("EC2InstanceId"), &awscdk.CfnOutputProps{Value: ec2Instance.InstanceId()})
	awscdk.NewCfnOutput(stack, jsii.String("EC2PublicIP"), &awscdk.CfnOutputProps{Value: ec2Instance.InstancePublicIp()})
	awscdk.NewCfnOutput(stack, jsii.String("RDSEndpoint"), &awscdk.CfnOutputProps{Value: rdsInstance.InstanceEndpoint().Hostname()})
	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{Value: bucket.BucketName()})
	awscdk.NewCfnOutput(stack, jsii.String("S3LoggingBucketName"), &awscdk.CfnOutputProps{Value: loggingBucket.BucketName()})
	awscdk.NewCfnOutput(stack, jsii.String("SecurityGroupId"), &awscdk.CfnOutputProps{Value: ec2SecurityGroup.SecurityGroupId()})
	awscdk.NewCfnOutput(stack, jsii.String("VPCCidr"), &awscdk.CfnOutputProps{Value: vpc.VpcCidrBlock()})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
```

## `lib/tap_stack_int_test.go`

This file contains the integration tests for the Tap CDK stack.

```go
//go:build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Outputs represents the structure of cfn-outputs/flat-outputs.json
type Outputs struct {
	VPCId           string `json:"VPCId"`
	SecurityGroupId string `json:"SecurityGroupId"`
	VPCCidr         string `json:"VPCCidr"`
}

// loadOutputs loads deployment outputs from cfn-outputs/flat-outputs.json
func loadOutputs(t *testing.T) *Outputs {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		t.Skipf("Cannot load cfn-outputs/flat-outputs.json: %v", err)
	}

	var outputs Outputs
	err = json.Unmarshal(data, &outputs)
	require.NoError(t, err, "Failed to parse cfn-outputs/flat-outputs.json")

	return &outputs
}

func TestTapStackIntegration(t *testing.T) {
	// Skip if running in CI without AWS credentials
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	t.Run("deployed VPC has correct CIDR block", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe VPC
		vpcResp, err := ec2Client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VPCId},
		})
		require.NoError(t, err, "Failed to describe VPC")
		require.Len(t, vpcResp.Vpcs, 1, "Expected exactly one VPC")

		// ASSERT
		vpc := vpcResp.Vpcs[0]
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC should have correct CIDR block")
		assert.Equal(t, ec2types.VpcStateAvailable, vpc.State, "VPC should be available")

		// Check DNS attributes separately using DescribeVpcAttribute
		dnsSupport, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsSupport,
		})
		require.NoError(t, err, "Failed to get DNS support attribute")
		assert.True(t, *dnsSupport.EnableDnsSupport.Value, "VPC should have DNS support enabled")

		dnsHostnames, err := ec2Client.DescribeVpcAttribute(ctx, &ec2.DescribeVpcAttributeInput{
			VpcId:     &outputs.VPCId,
			Attribute: ec2types.VpcAttributeNameEnableDnsHostnames,
		})
		require.NoError(t, err, "Failed to get DNS hostnames attribute")
		assert.True(t, *dnsHostnames.EnableDnsHostnames.Value, "VPC should have DNS hostnames enabled")
	})

	t.Run("deployed security group has correct rules", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe Security Group
		sgResp, err := ec2Client.DescribeSecurityGroups(ctx, &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.SecurityGroupId},
		})
		require.NoError(t, err, "Failed to describe security group")
		require.Len(t, sgResp.SecurityGroups, 1, "Expected exactly one security group")

		// ASSERT
		sg := sgResp.SecurityGroups[0]
		assert.Equal(t, "cf-ec2-sg", *sg.GroupName, "Security group should have correct name")
		assert.Contains(t, *sg.Description, "Security group for EC2 web server", "Security group should have correct description")

		// ASSERT - Inbound rules
		assert.Len(t, sg.IpPermissions, 3, "Security group should have three inbound rules")

		// Helper function to check for a specific rule
		ruleExists := func(port int32, cidr string) bool {
			for _, rule := range sg.IpPermissions {
				if *rule.FromPort == port && *rule.ToPort == port && *rule.IpProtocol == "tcp" {
					for _, ipRange := range rule.IpRanges {
						if *ipRange.CidrIp == cidr {
							return true
						}
					}
				}
			}
			return false
		}

		assert.True(t, ruleExists(80, "0.0.0.0/0"), "Inbound rule for HTTP on port 80 from anywhere should exist")
		assert.True(t, ruleExists(443, "0.0.0.0/0"), "Inbound rule for HTTPS on port 443 from anywhere should exist")
		assert.True(t, ruleExists(22, "0.0.0.0/0"), "Inbound rule for SSH on port 22 from the allowed IP should exist")

		// ASSERT - Outbound rules
		assert.True(t, len(sg.IpPermissionsEgress) > 0, "Security group should have outbound rules")
	})

	t.Run("VPC has correct subnets and Internet Gateway", func(t *testing.T) {
		// ARRANGE
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		cfg, err := config.LoadDefaultConfig(ctx)
		require.NoError(t, err, "Failed to load AWS config")

		ec2Client := ec2.NewFromConfig(cfg)
		outputs := loadOutputs(t)

		// ACT - Describe subnets
		subnetsResp, err := ec2Client.DescribeSubnets(ctx, &ec2.DescribeSubnetsInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe subnets")

		// ASSERT - Should have 4 subnets (2 AZs * 2 types)
		assert.Len(t, subnetsResp.Subnets, 4, "VPC should have 4 subnets")

		// ACT - Describe Internet Gateway
		igwResp, err := ec2Client.DescribeInternetGateways(ctx, &ec2.DescribeInternetGatewaysInput{
			Filters: []ec2types.Filter{
				{
					Name:   aws.String("attachment.vpc-id"),
					Values: []string{outputs.VPCId},
				},
			},
		})
		require.NoError(t, err, "Failed to describe internet gateways")

		// ASSERT - Should have one Internet Gateway attached
		assert.Len(t, igwResp.InternetGateways, 1, "VPC should have exactly one Internet Gateway")
		assert.Len(t, igwResp.InternetGateways[0].Attachments, 1, "Internet Gateway should be attached to VPC")
		assert.Equal(t, outputs.VPCId, *igwResp.InternetGateways[0].Attachments[0].VpcId, "Internet Gateway should be attached to correct VPC")
	})

	t.Run("outputs are correctly exported", func(t *testing.T) {
		// ARRANGE
		outputs := loadOutputs(t)

		// ASSERT - All required outputs should be present
		assert.NotEmpty(t, outputs.VPCId, "VPCId should be exported")
		assert.NotEmpty(t, outputs.SecurityGroupId, "SecurityGroupId should be exported")
		assert.NotEmpty(t, outputs.VPCCidr, "VPCCidr should be exported")
		assert.Equal(t, "10.0.0.0/16", outputs.VPCCidr, "VPCCidr should match expected value")

		// ASSERT - IDs should follow AWS format
		assert.Regexp(t, "^vpc-[a-f0-9]+$", outputs.VPCId, "VPCId should follow AWS VPC ID format")
		assert.Regexp(t, "^sg-[a-f0-9]+$", outputs.SecurityGroupId, "SecurityGroupId should follow AWS Security Group ID format")
	})
}

// Helper function to wait for stack deployment completion
func waitForStackCompletion(ctx context.Context, cfnClient *cloudformation.Client, stackName string) error {
	waiter := cloudformation.NewStackCreateCompleteWaiter(cfnClient)
	return waiter.Wait(ctx, &cloudformation.DescribeStacksInput{
		StackName: aws.String(stackName),
	}, 10*time.Minute)
}
```
