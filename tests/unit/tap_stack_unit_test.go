package lib_test

import (
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// setupTestStack initializes a new CDK app and the TapStack for testing.
func setupTestStack(t *testing.T) (awscdk.App, awscdk.Stack, assertions.Template) {
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
		StackProps: &awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
		AllowedSSHIP:    jsii.String("10.0.0.0/32"),
		EC2InstanceType: jsii.String("t2.micro"),
		DBInstanceClass: jsii.String("t3.small"),
		DBUsername:      jsii.String("testuser"),
		DBPassword:      jsii.String("testpassword"),
	})
	template := assertions.Template_FromStack(stack.Stack, nil)
	return app, stack.Stack, template
}

// TestVPCCreation validates that the VPC and its subnets are correctly configured.
func TestVPCResources(t *testing.T) {
	_, _, template := setupTestStack(t)

	// Assert that a VPC is created with the correct CIDR block.
	template.HasResourceProperties(jsii.String("AWS::EC2::VPC"), &map[string]interface{}{
		"CidrBlock": "10.0.0.0/16",
		"Tags": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{"Key": "Environment", "Value": "Production"},
			map[string]interface{}{"Key": "Project", "Value": "CDKSetup"},
		}),
	})

	// Assert that 2 public and 2 private subnets are created.
	template.ResourceCountIs(jsii.String("AWS::EC2::Subnet"), jsii.Number(4))
	template.AllResourcesProperties(jsii.String("AWS::EC2::Subnet"), assertions.Match_ObjectLike(&map[string]interface{}{
		"VpcId": assertions.Match_AnyValue(),
	}))

	// Assert that an Internet Gateway and a NAT Gateway are created.
	template.ResourceCountIs(jsii.String("AWS::EC2::InternetGateway"), jsii.Number(1))
	template.ResourceCountIs(jsii.String("AWS::EC2::NatGateway"), jsii.Number(1))
}

// TestS3BucketCreation validates the S3 bucket and its logging configuration.
func TestS3BucketResources(t *testing.T) {
	_, _, template := setupTestStack(t)

	// Assert that two S3 buckets are created (main and logging).
	template.ResourceCountIs(jsii.String("AWS::S3::Bucket"), jsii.Number(2))

	// Assert that the main bucket has versioning and server access logging enabled.
	template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{
		"VersioningConfiguration": map[string]interface{}{"Status": "Enabled"},
		"LoggingConfiguration": assertions.Match_ObjectLike(&map[string]interface{}{
			"DestinationBucketName": assertions.Match_AnyValue(),
		}),
		"Tags": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{"Key": "Environment", "Value": "Production"},
		}),
	})
	// Assert that the bucket has no explicit name, allowing CDK to generate one.
	template.HasResourceProperties(jsii.String("AWS::S3::Bucket"), &map[string]interface{}{
		"BucketName": assertions.Match_Absent(),
	})

	// Assert that no bucket policy is created.
	template.ResourceCountIs(jsii.String("AWS::S3::BucketPolicy"), jsii.Number(0))
}

// TestSecurityGroups validates the security group rules for EC2 and RDS.
func TestSecurityGroupResources(t *testing.T) {
	_, _, template := setupTestStack(t)

	// Assert that the EC2 security group allows HTTP, HTTPS, and SSH traffic.
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{
		"GroupDescription": "Security group for EC2 web server",
		"SecurityGroupIngress": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{"CidrIp": "0.0.0.0/0", "FromPort": 80, "ToPort": 80},
			map[string]interface{}{"CidrIp": "0.0.0.0/0", "FromPort": 443, "ToPort": 443},
			map[string]interface{}{"CidrIp": "10.0.0.0/32", "FromPort": 22, "ToPort": 22},
		}),
	})

	// Assert that the RDS security group allows traffic from the EC2 security group on the MySQL port.
	template.HasResourceProperties(jsii.String("AWS::EC2::SecurityGroup"), &map[string]interface{}{
		"GroupDescription": "Security group for RDS MySQL instance",
		"SecurityGroupIngress": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{
				"FromPort":              3306,
				"ToPort":                3306,
				"SourceSecurityGroupId": assertions.Match_AnyValue(),
			},
		}),
	})
}

// TestRDSInstanceCreation validates the RDS instance configuration.
func TestRDSInstanceResources(t *testing.T) {
	_, _, template := setupTestStack(t)

	// Assert that the RDS instance is created with the correct properties.
	template.HasResourceProperties(jsii.String("AWS::RDS::DBInstance"), &map[string]interface{}{
		"DBInstanceClass":           "db.t3.small",
		"Engine":                    "mysql",
		"MultiAZ":                   true,
		"DeletionProtection":        false,
		"EnablePerformanceInsights": false,
		"DBInstanceIdentifier":      "cf-rds-mysql-dev",
		"Tags": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{"Key": "Project", "Value": "CDKSetup"},
		}),
	})

	// Assert that a CloudWatch alarm is created for CPU utilization.
	template.HasResourceProperties(jsii.String("AWS::CloudWatch::Alarm"), &map[string]interface{}{
		"AlarmName":          "cf-rds-high-cpu-dev",
		"MetricName":         "CPUUtilization",
		"Namespace":          "AWS/RDS",
		"Threshold":          75,
		"ComparisonOperator": "GreaterThanThreshold",
	})
}

// TestEC2InstanceCreation validates the EC2 instance and its IAM role.
func TestEC2InstanceResources(t *testing.T) {
	_, _, template := setupTestStack(t)

	// Assert that the EC2 instance is created with the correct properties.
	template.HasResourceProperties(jsii.String("AWS::EC2::Instance"), &map[string]interface{}{
		"InstanceType": "t2.micro",
		"InstanceName": "cf-web-server-dev",
		"Tags": assertions.Match_ArrayWith(&[]interface{}{
			map[string]interface{}{"Key": "Environment", "Value": "Production"},
		}),
	})

	// Assert that the IAM role for the EC2 instance has S3 read-only permissions.
	template.HasResourceProperties(jsii.String("AWS::IAM::Policy"), &map[string]interface{}{
		"PolicyDocument": assertions.Match_ObjectLike(&map[string]interface{}{
			"Statement": assertions.Match_ArrayWith(&[]interface{}{
				map[string]interface{}{
					"Action":   assertions.Match_ArrayWith(&[]interface{}{"s3:GetObject", "s3:ListBucket"}),
					"Effect":   "Allow",
					"Resource": assertions.Match_AnyValue(),
				},
			}),
		}),
	})
}
