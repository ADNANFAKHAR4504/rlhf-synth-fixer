package main

import (
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	stack := cdktf.NewTerraformStack(app, jsii.String("TapStack"))

	// Configure S3 backend for state management
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String("iac-rlhf-cfn-states-us-east-1"),
		Key:    jsii.String("cdktf/TapStack-dev/terraform.tfstate"),
		Region: jsii.String("us-east-1"),
	})

	// We'll configure the AWS provider using HCL configuration
	// This avoids the "module too large" issue with Go CDKTF AWS provider

	// Add AWS provider configuration
	stack.AddOverride(jsii.String("terraform.required_providers.aws"), map[string]interface{}{
		"source":  "hashicorp/aws",
		"version": "~> 6.0",
	})

	stack.AddOverride(jsii.String("provider.aws.region"), jsii.String("us-east-1"))
	stack.AddOverride(jsii.String("provider.aws.default_tags.tags"), map[string]string{
		"Environment": "dev",
		"Project":     "tap",
		"ManagedBy":   "cdktf",
	})

	// Add VPC
	stack.AddOverride(jsii.String("resource.aws_vpc.tap_vpc"), map[string]interface{}{
		"cidr_block":           "10.0.0.0/16",
		"enable_dns_hostnames": true,
		"enable_dns_support":   true,
		"tags": map[string]string{
			"Name": "tap-vpc-dev",
		},
	})

	// Add private subnet
	stack.AddOverride(jsii.String("resource.aws_subnet.private_subnet"), map[string]interface{}{
		"vpc_id":            "${aws_vpc.tap_vpc.id}",
		"cidr_block":        "10.0.1.0/24",
		"availability_zone": "us-east-1a",
		"tags": map[string]string{
			"Name": "tap-private-subnet-dev",
			"Type": "private",
		},
	})

	// Add KMS key
	stack.AddOverride(jsii.String("resource.aws_kms_key.tap_kms_key"), map[string]interface{}{
		"description": "KMS key for TAP infrastructure encryption",
		"key_usage":   "ENCRYPT_DECRYPT",
		"policy": `{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudTrail to encrypt logs",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/tap-cloudtrail-dev"
						}
					}
				},
				{
					"Sid": "Allow CloudTrail to describe key",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`,
		"tags": map[string]string{
			"Name": "tap-kms-key-dev",
		},
	})

	// Add S3 bucket
	stack.AddOverride(jsii.String("resource.aws_s3_bucket.tap_bucket"), map[string]interface{}{
		"bucket": "tap-app-data-dev",
		"tags": map[string]string{
			"Name": "tap-app-bucket-dev",
		},
	})

	// Add random ID for unique naming
	stack.AddOverride(jsii.String("resource.random_id.suffix"), map[string]interface{}{
		"byte_length": 4,
	})

	// Add S3 bucket encryption
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_server_side_encryption_configuration.tap_bucket_encryption"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.tap_bucket.id}",
		"rule": []map[string]interface{}{
			{
				"apply_server_side_encryption_by_default": map[string]interface{}{
					"sse_algorithm":     "aws:kms",
					"kms_master_key_id": "${aws_kms_key.tap_kms_key.arn}",
				},
			},
		},
	})

	// Add S3 bucket public access block
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_public_access_block.tap_bucket_pab"), map[string]interface{}{
		"bucket":                  "${aws_s3_bucket.tap_bucket.id}",
		"block_public_acls":       true,
		"block_public_policy":     true,
		"ignore_public_acls":      true,
		"restrict_public_buckets": true,
	})

	// Add IAM role for EC2
	stack.AddOverride(jsii.String("resource.aws_iam_role.ec2_role"), map[string]interface{}{
		"name": "tap-ec2-role-dev",
		"assume_role_policy": `{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`,
		"tags": map[string]string{
			"Name": "tap-ec2-role-dev",
		},
	})

	// Attach S3 read-only policy
	stack.AddOverride(jsii.String("resource.aws_iam_role_policy_attachment.s3_readonly"), map[string]interface{}{
		"role":       "${aws_iam_role.ec2_role.name}",
		"policy_arn": "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
	})

	// Add CloudWatch policy
	stack.AddOverride(jsii.String("resource.aws_iam_role_policy_attachment.cloudwatch"), map[string]interface{}{
		"role":       "${aws_iam_role.ec2_role.name}",
		"policy_arn": "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
	})

	// Add instance profile
	stack.AddOverride(jsii.String("resource.aws_iam_instance_profile.ec2_profile"), map[string]interface{}{
		"name": "tap-ec2-instance-profile-dev",
		"role": "${aws_iam_role.ec2_role.name}",
		"tags": map[string]string{
			"Name": "tap-ec2-instance-profile-dev",
		},
	})

	// Add security group
	stack.AddOverride(jsii.String("resource.aws_security_group.ec2_sg"), map[string]interface{}{
		"name":        "tap-ec2-sg-dev",
		"vpc_id":      "${aws_vpc.tap_vpc.id}",
		"description": "Security group for TAP EC2 instances with SSL/TLS enforcement",
		"ingress": []map[string]interface{}{
			{
				"description":      "HTTPS",
				"from_port":        443,
				"to_port":          443,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"10.0.0.0/16"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
			{
				"description":      "SSH",
				"from_port":        22,
				"to_port":          22,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"10.0.0.0/16"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
		},
		"egress": []map[string]interface{}{
			{
				"description":      "HTTPS outbound",
				"from_port":        443,
				"to_port":          443,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"0.0.0.0/0"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
			{
				"description":      "HTTP outbound for package updates",
				"from_port":        80,
				"to_port":          80,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"0.0.0.0/0"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
			},
		},
		"tags": map[string]string{
			"Name": "tap-ec2-sg-dev",
		},
	})

	// Add AMI data source
	stack.AddOverride(jsii.String("data.aws_ami.latest"), map[string]interface{}{
		"most_recent": true,
		"owners":      []string{"amazon"},
		"filter": []map[string]interface{}{
			{
				"name":   "name",
				"values": []string{"amzn2-ami-hvm-*-x86_64-gp2"},
			},
			{
				"name":   "state",
				"values": []string{"available"},
			},
		},
	})

	// Add EC2 instance
	stack.AddOverride(jsii.String("resource.aws_instance.app_instance"), map[string]interface{}{
		"ami":                     "${data.aws_ami.latest.id}",
		"instance_type":           "t3.micro",
		"subnet_id":               "${aws_subnet.private_subnet.id}",
		"vpc_security_group_ids":  []string{"${aws_security_group.ec2_sg.id}"},
		"iam_instance_profile":    "${aws_iam_instance_profile.ec2_profile.name}",
		"monitoring":              true,
		"disable_api_termination": true,
		"user_data": `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "metrics": {
        "namespace": "TAP/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`,
		"root_block_device": []map[string]interface{}{
			{
				"volume_type": "gp3",
				"volume_size": 20,
				"encrypted":   true,
				"kms_key_id":  "${aws_kms_key.tap_kms_key.arn}",
			},
		},
		"tags": map[string]string{
			"Name": "tap-ec2-instance-dev",
		},
	})

	// Add SNS topic
	stack.AddOverride(jsii.String("resource.aws_sns_topic.cpu_alarm_topic"), map[string]interface{}{
		"name":              "tap-cpu-alarm-topic-dev",
		"kms_master_key_id": "${aws_kms_key.tap_kms_key.id}",
		"tags": map[string]string{
			"Name": "tap-sns-topic-dev",
		},
	})

	// Add CloudWatch alarm
	stack.AddOverride(jsii.String("resource.aws_cloudwatch_metric_alarm.cpu_alarm"), map[string]interface{}{
		"alarm_name":          "tap-cpu-high-alarm-dev",
		"comparison_operator": "GreaterThanThreshold",
		"evaluation_periods":  "2",
		"metric_name":         "CPUUtilization",
		"namespace":           "AWS/EC2",
		"period":              "300",
		"statistic":           "Average",
		"threshold":           "70",
		"alarm_description":   "This metric monitors ec2 cpu utilization",
		"alarm_actions":       []string{"${aws_sns_topic.cpu_alarm_topic.arn}"},
		"dimensions": map[string]string{
			"InstanceId": "${aws_instance.app_instance.id}",
		},
		"tags": map[string]string{
			"Name": "tap-cpu-alarm-dev",
		},
	})

	// Add CloudTrail S3 bucket
	stack.AddOverride(jsii.String("resource.aws_s3_bucket.cloudtrail_bucket"), map[string]interface{}{
		"bucket": "tap-cloudtrail-logs-dev",
		"tags": map[string]string{
			"Name": "tap-cloudtrail-bucket-dev",
		},
	})

	// Add CloudTrail bucket encryption
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_server_side_encryption_configuration.cloudtrail_bucket_encryption"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.cloudtrail_bucket.id}",
		"rule": []map[string]interface{}{
			{
				"apply_server_side_encryption_by_default": map[string]interface{}{
					"sse_algorithm":     "aws:kms",
					"kms_master_key_id": "${aws_kms_key.tap_kms_key.arn}",
				},
			},
		},
	})

	// Add CloudTrail bucket public access block
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_public_access_block.cloudtrail_bucket_pab"), map[string]interface{}{
		"bucket":                  "${aws_s3_bucket.cloudtrail_bucket.id}",
		"block_public_acls":       true,
		"block_public_policy":     true,
		"ignore_public_acls":      true,
		"restrict_public_buckets": true,
	})

	// Add CloudTrail bucket policy
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_policy.cloudtrail_bucket_policy"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.cloudtrail_bucket.id}",
		"policy": `{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AWSCloudTrailAclCheck",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:GetBucketAcl",
					"Resource": "${aws_s3_bucket.cloudtrail_bucket.arn}"
				},
				{
					"Sid": "AWSCloudTrailWrite",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:PutObject",
					"Resource": "${aws_s3_bucket.cloudtrail_bucket.arn}/*",
					"Condition": {
						"StringEquals": {
							"s3:x-amz-acl": "bucket-owner-full-control"
						}
					}
				},
				{
					"Sid": "AWSCloudTrailBucketExistenceCheck",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:ListBucket",
					"Resource": "${aws_s3_bucket.cloudtrail_bucket.arn}"
				}
			]
		}`,
		"depends_on": []string{"aws_s3_bucket_public_access_block.cloudtrail_bucket_pab"},
	})

	// Add current AWS account data source
	stack.AddOverride(jsii.String("data.aws_caller_identity.current"), map[string]interface{}{})

	// Add required provider for random
	stack.AddOverride(jsii.String("terraform.required_providers.random"), map[string]interface{}{
		"source":  "hashicorp/random",
		"version": "~> 3.1",
	})

	// Add CloudTrail
	stack.AddOverride(jsii.String("resource.aws_cloudtrail.audit_trail"), map[string]interface{}{
		"name":                          "tap-cloudtrail-dev",
		"s3_bucket_name":                "${aws_s3_bucket.cloudtrail_bucket.id}",
		"include_global_service_events": true,
		"is_multi_region_trail":         true,
		"enable_log_file_validation":    true,
		"kms_key_id":                    "${aws_kms_key.tap_kms_key.arn}",
		"depends_on": []string{
			"aws_s3_bucket_policy.cloudtrail_bucket_policy",
			"aws_kms_key.tap_kms_key",
		},
		"tags": map[string]string{
			"Name": "tap-cloudtrail-dev",
		},
	})

	// Add outputs for integration testing
	stack.AddOverride(jsii.String("output.vpc_id"), map[string]interface{}{
		"value":       "${aws_vpc.tap_vpc.id}",
		"description": "VPC ID",
	})

	stack.AddOverride(jsii.String("output.private_subnet_id"), map[string]interface{}{
		"value":       "${aws_subnet.private_subnet.id}",
		"description": "Private subnet ID",
	})

	stack.AddOverride(jsii.String("output.kms_key_id"), map[string]interface{}{
		"value":       "${aws_kms_key.tap_kms_key.id}",
		"description": "KMS key ID",
	})

	stack.AddOverride(jsii.String("output.s3_bucket_name"), map[string]interface{}{
		"value":       "${aws_s3_bucket.tap_bucket.id}",
		"description": "Application S3 bucket name",
	})

	stack.AddOverride(jsii.String("output.cloudtrail_bucket_name"), map[string]interface{}{
		"value":       "${aws_s3_bucket.cloudtrail_bucket.id}",
		"description": "CloudTrail S3 bucket name",
	})

	stack.AddOverride(jsii.String("output.ec2_instance_id"), map[string]interface{}{
		"value":       "${aws_instance.app_instance.id}",
		"description": "EC2 instance ID",
	})

	stack.AddOverride(jsii.String("output.iam_role_name"), map[string]interface{}{
		"value":       "${aws_iam_role.ec2_role.name}",
		"description": "IAM role name",
	})

	stack.AddOverride(jsii.String("output.security_group_id"), map[string]interface{}{
		"value":       "${aws_security_group.ec2_sg.id}",
		"description": "Security group ID",
	})

	stack.AddOverride(jsii.String("output.sns_topic_arn"), map[string]interface{}{
		"value":       "${aws_sns_topic.cpu_alarm_topic.arn}",
		"description": "SNS topic ARN",
	})

	stack.AddOverride(jsii.String("output.cloudtrail_arn"), map[string]interface{}{
		"value":       "${aws_cloudtrail.audit_trail.arn}",
		"description": "CloudTrail ARN",
	})

	app.Synth()
}
