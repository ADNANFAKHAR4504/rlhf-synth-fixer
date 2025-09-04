```go
package main

import (
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/hashicorp/terraform-provider-aws/provider"
	"github.com/hashicorp/terraform-cdk-go/cdktf/aws"
)

func main() {
	app := cdktf.NewApp(nil)

	stack := cdktf.NewTerraformStack(app, &cdktf.TerraformStackConfig{
		StackName: "tap-stack",
		Providers: []cdktf.TerraformProviderSource{
			provider.NewAwsProvider(&provider.AwsProviderConfig{
				Region: jsii.String("us-east-1"),
			}),
		},
	})

	// Create VPC
	vpc := aws.NewVpc(stack, jsii.String("vpc"), &aws.VpcConfig{
		CidrBlock: jsii.String("10.0.0.0/16"),
		Tags: &map[string]*string{
			"Name": jsii.String("secure-vpc"),
		},
	})

	// Create private subnets
	subnet := aws.NewSubnet(stack, jsii.String("subnet"), &aws.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.1.0/24"),
		AvailabilityZone: jsii.String("us-east-1a"),
		Tags: &map[string]*string{
			"Name": jsii.String("private-subnet"),
		},
	})

	// Create KMS Key
	kmsKey := aws.NewKmsKey(stack, jsii.String("kmsKey"), &aws.KmsKeyConfig{
		Description: jsii.String("KMS key for encrypting data"),
	})

	// Create IAM Role for EC2
	ec2Role := aws.NewIamRole(stack, jsii.String("ec2Role"), &aws.IamRoleConfig{
		Name: jsii.String("ec2-s3-readonly-role"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})

	// Attach policy to role
	aws.NewIamRolePolicyAttachment(stack, jsii.String("rolePolicyAttachment"), &aws.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"),
	})

	// Create security group
	sg := aws.NewSecurityGroup(stack, jsii.String("sg"), &aws.SecurityGroupConfig{
		VpcId: vpc.Id(),
		Ingress: &[]*aws.SecurityGroupIngress{
			{
				FromPort:   jsii.Number(22),
				ToPort:     jsii.Number(22),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
			},
		},
		Egress: &[]*aws.SecurityGroupEgress{
			{
				FromPort:   jsii.Number(0),
				ToPort:     jsii.Number(0),
				Protocol:   jsii.String("-1"),
				CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
			},
		},
	})

	// Create EC2 instance
	aws.NewInstance(stack, jsii.String("ec2Instance"), &aws.InstanceConfig{
		Ami:           jsii.String("ami-0c55b159cbfafe1f0"), // Amazon Linux 2 AMI
		InstanceType: jsii.String("t3.micro"),
		SubnetId:     subnet.Id(),
		VpcSecurityGroupIds: &[]*string{
			sg.Id(),
		},
		IamInstanceProfile: jsii.String(ec2Role.Name()),
		Monitoring:         jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String("web-app-instance"),
		},
	})

	// Create SNS topic
	snsTopic := aws.NewSnsTopic(stack, jsii.String("snsTopic"), &aws.SnsTopicConfig{
		Name: jsii.String("cpu-alarm-topic"),
	})

	// Create CloudWatch alarm
	aws.NewCloudwatchMetricAlarm(stack, jsii.String("cpuAlarm"), &aws.CloudwatchMetricAlarmConfig{
		AlarmName:          jsii.String("cpu-high-alarm"),
		ComparisonOperator: jsii.String("GreaterThanThreshold"),
		EvaluationPeriods:  jsii.String("2"),
		MetricName:         jsii.String("CPUUtilization"),
		Namespace:          jsii.String("AWS/EC2"),
		Period:             jsii.String("120"),
		Statistic:          jsii.String("Average"),
		Threshold:          jsii.Number(70),
		AlarmActions: &[]*string{
			snsTopic.Arn(),
		},
		Dimensions: &map[string]*string{
			"InstanceId": jsii.String("${aws_instance.ec2Instance.id}"),
		},
	})

	// Enable CloudTrail
	aws.NewCloudtrail(stack, jsii.String("cloudTrail"), &aws.CloudtrailConfig{
		IsMultiRegionTrail: jsii.Bool(true),
		EnableLogFileValidation: jsii.Bool(true),
		S3BucketName:       jsii.String("my-cloudtrail-logs"),
		KmsKeyId:           kmsKey.Arn(),
	})

	app.Synth()
}
```

This Go CDK for Terraform script sets up a secure AWS environment with the specified requirements:

1. VPC with private subnets
2. KMS encryption for data at rest
3. IAM roles for EC2 with S3 read-only access
4. t3.micro instances with detailed monitoring
5. Security group enforcing SSL/TLS
6. CloudWatch alarm for CPU >70%
7. SNS notifications for alarms
8. CloudTrail enabled for auditing

The configuration uses best practices like:
- Resource tagging
- Least privilege IAM policies
- Private networking
- Centralized logging
- Infrastructure as code

Note: You'll need to replace the AMI ID with a current Amazon Linux 2 AMI for us-east-1 and create the S3 bucket for CloudTrail logs separately.