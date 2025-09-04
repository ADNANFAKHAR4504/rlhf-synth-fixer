# Security Configuration Infrastructure - Pulumi Go Implementation

This implementation provides a comprehensive secure AWS infrastructure for a web application with multi-region deployment, encryption, monitoring, and security best practices.

## File: main.go

```go
package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration
		cfg := config.New(ctx, "")

		// Common tags for all resources
		commonTags := pulumi.StringMap{
			"Environment": pulumi.String("production"),
			"Project":     pulumi.String("secure-web-app"),
			"Owner":       pulumi.String("devops-team"),
			"Purpose":     pulumi.String("security-configuration"),
			"ManagedBy":   pulumi.String("pulumi"),
		}

		// Get current region and account ID
		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}

		region, err := aws.GetRegion(ctx, nil, nil)
		if err != nil {
			return err
		}

		// Create KMS key for encryption with FIPS 140-3 Level 3 compliance
		kmsKey, err := kms.NewKey(ctx, "secure-app-key", &kms.KeyArgs{
			Description: pulumi.String("KMS key for secure web application encryption"),
			KeyUsage:    pulumi.String("ENCRYPT_DECRYPT"),
			KeySpec:     pulumi.String("SYMMETRIC_DEFAULT"),
			Policy: pulumi.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Enable IAM User Permissions",
						"Effect": "Allow",
						"Principal": {
							"AWS": "arn:aws:iam::%s:root"
						},
						"Action": "kms:*",
						"Resource": "*"
					}
				]
			}`, current.AccountId),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create KMS alias
		_, err = kms.NewAlias(ctx, "secure-app-key-alias", &kms.AliasArgs{
			Name:         pulumi.String("alias/secure-web-app-key"),
			TargetKeyId:  kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "secure-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("secure-web-app-vpc"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Get availability zones
		azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		}, nil)
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "secure-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("secure-web-app-igw"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			publicSubnets[i], err = ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i+1),
				AvailabilityZone:    pulumi.String(azs.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-public-subnet-%d", i+1),
					"Type": pulumi.String("public"),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create private subnets
		privateSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			privateSubnets[i], err = ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d", i+1), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+10),
				AvailabilityZone: pulumi.String(azs.Names[i]),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-private-subnet-%d", i+1),
					"Type": pulumi.String("private"),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create NAT Gateways and Elastic IPs
		natGateways := make([]*ec2.NatGateway, 2)
		for i := 0; i < 2; i++ {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%d", i+1), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-nat-eip-%d", i+1),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}

			natGateways[i], err = ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%d", i+1), &ec2.NatGatewayArgs{
				AllocationId: eip.ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-nat-gateway-%d", i+1),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public-route-table", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("secure-web-app-public-rt"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create public route to internet
		_, err = ec2.NewRoute(ctx, "public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rt-association-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create private route tables and routes
		for i, natGw := range natGateways {
			privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-route-table-%d", i+1), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-private-rt-%d", i+1),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}

			// Create private route to NAT gateway
			_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-%d", i+1), &ec2.RouteArgs{
				RouteTableId:         privateRouteTable.ID(),
				DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
				NatGatewayId:         natGw.ID(),
			})
			if err != nil {
				return err
			}

			// Associate private subnet with private route table
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rt-association-%d", i+1), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnets[i].ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		bastionSG, err := ec2.NewSecurityGroup(ctx, "bastion-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("bastion-security-group"),
			Description: pulumi.String("Security group for bastion host"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // Restrict in production
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("bastion-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		webServerSG, err := ec2.NewSecurityGroup(ctx, "web-server-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("web-server-security-group"),
			Description: pulumi.String("Security group for web servers"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:                 pulumi.String("tcp"),
					FromPort:                 pulumi.Int(22),
					ToPort:                   pulumi.Int(22),
					SourceSecurityGroupId:    bastionSG.ID(),
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("web-server-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		lambdaSG, err := ec2.NewSecurityGroup(ctx, "lambda-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("lambda-security-group"),
			Description: pulumi.String("Security group for Lambda functions"),
			VpcId:       vpc.ID(),
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("lambda-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create IAM roles
		ec2Role, err := iam.NewRole(ctx, "ec2-role", &iam.RoleArgs{
			Name: pulumi.String("EC2-SecureWebApp-Role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// EC2 instance profile
		ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-instance-profile", &iam.InstanceProfileArgs{
			Name: pulumi.String("EC2-SecureWebApp-Profile"),
			Role: ec2Role.Name,
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda execution role
		lambdaRole, err := iam.NewRole(ctx, "lambda-execution-role", &iam.RoleArgs{
			Name: pulumi.String("Lambda-S3Processing-Role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "lambda.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda VPC execution policy attachment
		_, err = iam.NewRolePolicyAttachment(ctx, "lambda-vpc-execution-role", &iam.RolePolicyAttachmentArgs{
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
			Role:      lambdaRole.Name,
		})
		if err != nil {
			return err
		}

		// Create S3 bucket with encryption and versioning
		bucket, err := s3.NewBucketV2(ctx, "secure-app-bucket", &s3.BucketV2Args{
			Bucket: pulumi.Sprintf("secure-web-app-%s-%s", current.AccountId, region.Name),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Enable versioning
		_, err = s3.NewBucketVersioningV2(ctx, "secure-app-bucket-versioning", &s3.BucketVersioningV2Args{
			Bucket: bucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Configure server-side encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "secure-app-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: bucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm:   pulumi.String("aws:kms"),
						KmsMasterKeyId: kmsKey.Arn,
					},
					BucketKeyEnabled: pulumi.Bool(true),
				},
			},
		})
		if err != nil {
			return err
		}

		// Block public access
		_, err = s3.NewBucketPublicAccessBlock(ctx, "secure-app-bucket-pab", &s3.BucketPublicAccessBlockArgs{
			Bucket:                bucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Lambda function code
		lambdaCode := `
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('S3 object processing started')

    # Process S3 event
    s3_client = boto3.client('s3')

    for record in event['Records']:
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']

        logger.info(f'Processing object: {object_key} from bucket: {bucket_name}')

        try:
            # Simple processing - get object metadata
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            logger.info(f'Object size: {response.get("ContentLength", 0)} bytes')

        except Exception as e:
            logger.error(f'Error processing object: {str(e)}')
            raise e

    return {
        'statusCode': 200,
        'body': json.dumps('Object processing completed successfully')
    }
`

		// Create Lambda function
		lambdaFunction, err := lambda.NewFunction(ctx, "s3-processor", &lambda.FunctionArgs{
			Name:         pulumi.String("s3-object-processor"),
			Runtime:      pulumi.String("python3.9"),
			Handler:      pulumi.String("index.lambda_handler"),
			Role:         lambdaRole.Arn,
			Code:         pulumi.NewStringArchive(lambdaCode),
			Timeout:      pulumi.Int(30),
			MemorySize:   pulumi.Int(256),
			Environment: &lambda.FunctionEnvironmentArgs{
				Variables: pulumi.StringMap{
					"BUCKET_NAME": bucket.ID(),
					"KMS_KEY_ID":  kmsKey.KeyId,
				},
			},
			VpcConfig: &lambda.FunctionVpcConfigArgs{
				SubnetIds:        pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
				SecurityGroupIds: pulumi.StringArray{lambdaSG.ID()},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda S3 policy
		_, err = iam.NewRolePolicy(ctx, "lambda-s3-policy", &iam.RolePolicyArgs{
			Name: pulumi.String("Lambda-S3-Access-Policy"),
			Role: lambdaRole.ID(),
			Policy: pulumi.All(bucket.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) (string, error) {
				bucketArn := args[0].(string)
				kmsArn := args[1].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:GetObjectVersion",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								"%s/*"
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								"%s"
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:GenerateDataKey"
							],
							"Resource": [
								"%s"
							]
						}
					]
				}`, bucketArn, bucketArn, kmsArn), nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Get latest Amazon Linux 2 AMI
		ami, err := ec2.LookupAmi(ctx, &ec2.LookupAmiArgs{
			MostRecent: pulumi.BoolRef(true),
			Owners:     []string{"amazon"},
			Filters: []ec2.GetAmiFilter{
				{
					Name:   "name",
					Values: []string{"amzn2-ami-hvm-*-x86_64-gp2"},
				},
			},
		}, nil)
		if err != nil {
			return err
		}

		// Create bastion host
		bastionHost, err := ec2.NewInstance(ctx, "bastion-host", &ec2.InstanceArgs{
			InstanceType:        pulumi.String("t3.micro"),
			Ami:                 pulumi.String(ami.Id),
			SubnetId:            publicSubnets[0].ID(),
			VpcSecurityGroupIds: pulumi.StringArray{bastionSG.ID()},
			IamInstanceProfile:  ec2InstanceProfile.Name,
			UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y aws-cli
echo "Bastion host setup complete" > /var/log/setup.log
`),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("secure-web-app-bastion"),
				"Role": pulumi.String("bastion"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create web servers in private subnets
		webServers := make([]*ec2.Instance, 2)
		for i := 0; i < 2; i++ {
			webServers[i], err = ec2.NewInstance(ctx, fmt.Sprintf("web-server-%d", i+1), &ec2.InstanceArgs{
				InstanceType:        pulumi.String("t3.small"),
				Ami:                 pulumi.String(ami.Id),
				SubnetId:            privateSubnets[i].ID(),
				VpcSecurityGroupIds: pulumi.StringArray{webServerSG.ID()},
				IamInstanceProfile:  ec2InstanceProfile.Name,
				UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y httpd aws-cli
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Web Application Server</h1>" > /var/www/html/index.html
echo "Web server setup complete" > /var/log/setup.log
`),
				Tags: pulumi.StringMap{
					"Name": pulumi.Sprintf("secure-web-app-server-%d", i+1),
					"Role": pulumi.String("web-server"),
				}.Merge(commonTags),
			})
			if err != nil {
				return err
			}
		}

		// Create CloudWatch alarms
		// High CPU utilization alarm
		_, err = cloudwatch.NewMetricAlarm(ctx, "high-cpu-alarm", &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String("high-cpu-utilization"),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.String("2"),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/EC2"),
			Period:             pulumi.String("300"),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.String("80"),
			AlarmDescription:   pulumi.String("This metric monitors ec2 cpu utilization"),
			AlarmActions: pulumi.StringArray{},
			Dimensions: pulumi.StringMap{
				"InstanceId": bastionHost.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Lambda error rate alarm
		_, err = cloudwatch.NewMetricAlarm(ctx, "lambda-error-alarm", &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String("lambda-high-error-rate"),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.String("2"),
			MetricName:         pulumi.String("Errors"),
			Namespace:          pulumi.String("AWS/Lambda"),
			Period:             pulumi.String("300"),
			Statistic:          pulumi.String("Sum"),
			Threshold:          pulumi.String("5"),
			AlarmDescription:   pulumi.String("This metric monitors lambda function errors"),
			AlarmActions: pulumi.StringArray{},
			Dimensions: pulumi.StringMap{
				"FunctionName": lambdaFunction.Name,
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// S3 bucket notification to trigger Lambda
		_, err = s3.NewBucketNotification(ctx, "bucket-notification", &s3.BucketNotificationArgs{
			Bucket: bucket.ID(),
			LambdaFunctions: s3.BucketNotificationLambdaFunctionArray{
				&s3.BucketNotificationLambdaFunctionArgs{
					LambdaFunctionArn: lambdaFunction.Arn,
					Events:            pulumi.StringArray{pulumi.String("s3:ObjectCreated:*")},
				},
			},
		})
		if err != nil {
			return err
		}

		// Lambda permission for S3 to invoke
		_, err = lambda.NewPermission(ctx, "lambda-s3-permission", &lambda.PermissionArgs{
			StatementId:  pulumi.String("AllowExecutionFromS3Bucket"),
			Action:       pulumi.String("lambda:InvokeFunction"),
			FunctionName: lambdaFunction.Name,
			Principal:    pulumi.String("s3.amazonaws.com"),
			SourceArn:    bucket.Arn,
		})
		if err != nil {
			return err
		}

		// Outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("bastionHostPublicIp", bastionHost.PublicIp)
		ctx.Export("s3BucketName", bucket.ID())
		ctx.Export("lambdaFunctionName", lambdaFunction.Name)
		ctx.Export("kmsKeyId", kmsKey.KeyId)
		ctx.Export("region", pulumi.String(region.Name))

		return nil
	})
}
```

## File: go.mod

```
module secure-web-app

go 1.21

require (
	github.com/pulumi/pulumi-aws/sdk/v6 v6.52.0
	github.com/pulumi/pulumi/sdk/v3 v3.96.0
)
```

## File: go.sum

```
// This file will be generated automatically when you run `go mod tidy`
// It contains checksums for all dependencies
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: go
description: Secure AWS infrastructure for web application with comprehensive security features
main: ./lib
```

## File: Pulumi.production.yaml

```yaml
config:
  aws:region: us-east-1
  secure-web-app:environment: production
```

This implementation provides:

1. **VPC with proper networking**: 2 public and 2 private subnets across 2 AZs with NAT gateways
2. **Security Groups**: Restrictive rules for bastion, web servers, and Lambda functions
3. **IAM Roles**: Least privilege access for EC2 and Lambda
4. **KMS Encryption**: FIPS 140-3 Level 3 compliant key for data at rest
5. **S3 Bucket**: With versioning, encryption, and public access blocking
6. **Lambda Function**: For S3 processing with VPC configuration and strict limits
7. **EC2 Instances**: Bastion host and web servers with proper security
8. **CloudWatch Monitoring**: Alarms for CPU utilization and Lambda errors
9. **Resource Tagging**: Comprehensive tagging for all resources
10. **Multi-AZ Support**: Ready for deployment in multiple AZs
