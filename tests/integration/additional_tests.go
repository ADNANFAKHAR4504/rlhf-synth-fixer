//go:build integration
// +build integration

package main

import (
	"context"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPublicSubnetsIntegration(t *testing.T) {
	if outputs.PublicSubnet1Id == "" || outputs.PublicSubnet2Id == "" {
		t.Skip("Public subnet IDs not available in outputs")
	}

	t.Run("should verify public subnets exist with internet access", func(t *testing.T) {
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			SubnetIds: []string{outputs.PublicSubnet1Id, outputs.PublicSubnet2Id},
		})
		require.NoError(t, err)
		require.Len(t, subnets.Subnets, 2)

		for _, subnet := range subnets.Subnets {
			assert.Equal(t, outputs.VpcId, *subnet.VpcId)
			assert.True(t, *subnet.MapPublicIpOnLaunch)
		}
	})
}

func TestSecurityGroupsIntegration(t *testing.T) {
	t.Run("should verify bastion security group", func(t *testing.T) {
		if outputs.BastionSecurityGroupId == "" {
			t.Skip("Bastion security group ID not available")
		}

		sg, err := awsClients.EC2.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.BastionSecurityGroupId},
		})
		require.NoError(t, err)
		require.Len(t, sg.SecurityGroups, 1)

		bastionSg := sg.SecurityGroups[0]
		assert.Equal(t, outputs.VpcId, *bastionSg.VpcId)
		assert.NotEmpty(t, bastionSg.IpPermissions)
	})

	t.Run("should verify lambda security group", func(t *testing.T) {
		if outputs.LambdaSecurityGroupId == "" {
			t.Skip("Lambda security group ID not available")
		}

		sg, err := awsClients.EC2.DescribeSecurityGroups(context.TODO(), &ec2.DescribeSecurityGroupsInput{
			GroupIds: []string{outputs.LambdaSecurityGroupId},
		})
		require.NoError(t, err)
		require.Len(t, sg.SecurityGroups, 1)

		lambdaSg := sg.SecurityGroups[0]
		assert.Equal(t, outputs.VpcId, *lambdaSg.VpcId)
	})
}

func TestLambdaFunctionIntegration(t *testing.T) {
	if outputs.LambdaFunctionArn == "" {
		t.Skip("Lambda function ARN not available")
	}

	t.Run("should verify Lambda function configuration", func(t *testing.T) {
		functionName := extractFunctionNameFromArn(outputs.LambdaFunctionArn)
		function, err := awsClients.Lambda.GetFunction(context.TODO(), &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		assert.Equal(t, "python3.9", *function.Configuration.Runtime)
		assert.Equal(t, int32(30), *function.Configuration.Timeout)
		assert.Equal(t, int32(256), *function.Configuration.MemorySize)
		assert.NotNil(t, function.Configuration.Environment)
		assert.Contains(t, function.Configuration.Environment.Variables, "BUCKET_NAME")
		assert.Contains(t, function.Configuration.Environment.Variables, "KMS_KEY_ID")
	})
}

func TestNATGatewaysIntegration(t *testing.T) {
	if outputs.NatGateway1Id == "" || outputs.NatGateway2Id == "" {
		t.Skip("NAT Gateway IDs not available")
	}

	t.Run("should verify NAT gateways exist", func(t *testing.T) {
		natGws, err := awsClients.EC2.DescribeNatGateways(context.TODO(), &ec2.DescribeNatGatewaysInput{
			NatGatewayIds: []string{outputs.NatGateway1Id, outputs.NatGateway2Id},
		})
		require.NoError(t, err)
		require.Len(t, natGws.NatGateways, 2)

		for _, natGw := range natGws.NatGateways {
			assert.Equal(t, "available", string(natGw.State))
			assert.NotEmpty(t, natGw.NatGatewayAddresses)
		}
	})
}

func TestInternetGatewayIntegration(t *testing.T) {
	if outputs.InternetGatewayId == "" {
		t.Skip("Internet Gateway ID not available")
	}

	t.Run("should verify internet gateway is attached to VPC", func(t *testing.T) {
		igws, err := awsClients.EC2.DescribeInternetGateways(context.TODO(), &ec2.DescribeInternetGatewaysInput{
			InternetGatewayIds: []string{outputs.InternetGatewayId},
		})
		require.NoError(t, err)
		require.Len(t, igws.InternetGateways, 1)

		igw := igws.InternetGateways[0]
		require.NotEmpty(t, igw.Attachments)
		assert.Equal(t, outputs.VpcId, *igw.Attachments[0].VpcId)
		assert.Equal(t, "available", string(igw.Attachments[0].State))
	})
}

func TestCloudWatchAlarmsIntegration(t *testing.T) {
	t.Run("should verify CloudWatch alarms exist", func(t *testing.T) {
		alarms, err := awsClients.CloudWatch.DescribeAlarms(context.TODO(), &cloudwatch.DescribeAlarmsInput{
			AlarmNamePrefix: aws.String("healthapp"),
		})
		require.NoError(t, err)
		assert.NotEmpty(t, alarms.MetricAlarms)

		lambdaErrorAlarmFound := false
		s3UnauthorizedAlarmFound := false

		for _, alarm := range alarms.MetricAlarms {
			if strings.Contains(*alarm.AlarmName, "lambda-errors") {
				lambdaErrorAlarmFound = true
				assert.Equal(t, "AWS/Lambda", *alarm.Namespace)
				assert.Equal(t, "Errors", *alarm.MetricName)
			}
			if strings.Contains(*alarm.AlarmName, "s3-unauthorized") {
				s3UnauthorizedAlarmFound = true
				assert.Equal(t, "AWS/S3", *alarm.Namespace)
				assert.Equal(t, "4xxErrors", *alarm.MetricName)
			}
		}

		assert.True(t, lambdaErrorAlarmFound, "Lambda error alarm should exist")
		assert.True(t, s3UnauthorizedAlarmFound, "S3 unauthorized access alarm should exist")
	})
}

func TestE2ENetworkingIntegration(t *testing.T) {
	t.Run("e2e: should have proper network architecture", func(t *testing.T) {
		// Verify VPC has both public and private subnets
		subnets, err := awsClients.EC2.DescribeSubnets(context.TODO(), &ec2.DescribeSubnetsInput{
			Filters: []types.Filter{
				{
					Name:   aws.String("vpc-id"),
					Values: []string{outputs.VpcId},
				},
			},
		})
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(subnets.Subnets), 4)

		publicSubnets := 0
		privateSubnets := 0

		for _, subnet := range subnets.Subnets {
			if *subnet.MapPublicIpOnLaunch {
				publicSubnets++
			} else {
				privateSubnets++
			}
		}

		assert.Equal(t, 2, publicSubnets, "Should have 2 public subnets")
		assert.Equal(t, 2, privateSubnets, "Should have 2 private subnets")
	})
}

func TestE2ELambdaVPCIntegration(t *testing.T) {
	if outputs.LambdaFunctionArn == "" {
		t.Skip("Lambda function ARN not available")
	}

	t.Run("e2e: should deploy Lambda in VPC with proper security", func(t *testing.T) {
		functionName := extractFunctionNameFromArn(outputs.LambdaFunctionArn)
		function, err := awsClients.Lambda.GetFunction(context.TODO(), &lambda.GetFunctionInput{
			FunctionName: aws.String(functionName),
		})
		require.NoError(t, err)

		assert.NotNil(t, function.Configuration.VpcConfig)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SubnetIds)
		assert.NotEmpty(t, function.Configuration.VpcConfig.SecurityGroupIds)
		assert.Equal(t, outputs.VpcId, *function.Configuration.VpcConfig.VpcId)
	})
}

func extractFunctionNameFromArn(arn string) string {
	parts := strings.Split(arn, ":")
	if len(parts) >= 7 {
		return parts[6]
	}
	return ""
}
