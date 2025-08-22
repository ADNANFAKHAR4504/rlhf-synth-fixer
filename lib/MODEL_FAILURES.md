Mismatched Variable and Resource Names:

Your tests expected variables like "secondary_region", "ssh_allowed_cidr", "web_port", "app_port", "db_port", and several others which were not declared in your actual tap_stack.tf.

Resources such as security groups named "primary_web", "primary_app", "secondary_web", "secondary_app", and CloudWatch metric alarms were expected in tests but missing in your configuration.

Similarly, IAM roles and policies for enhanced RDS monitoring were expected but not defined.

Incorrect Locals Checks:

Tests checked for locals like "primary_prefix", "secondary_prefix", "primary_vpc_cidr", "secondary_vpc_cidr", "primary_public_subnets", "primary_private_subnets", etc., which were not present or had different names in your tap_stack.tf.

S3 Bucket Resource Types:

Your tests expected resources like "aws_s3_bucket_ownership_controls" which your stack doesn’t declare, causing failures.

CloudWatch Log Groups and CPU Alarms:

Tests looked for CloudWatch log groups with names like "ec2_logs_primary", "ec2_logs_secondary" and CPU alarms "primary_cpu_alarm", "secondary_cpu_alarm", which do not exist in your stack. Your stack uses different CloudWatch log group resource names.

Inconsistent Output Names:

The test suite expected outputs such as "primary_web_sg_arn", "primary_app_sg_arn", "primary_db_sg_arn", and others which your actual outputs do not have.

IAM Instance Profile Test Failure:

The test for iam_instance_profile failed because it expected a non-empty string but your outputs file might have an unexpected format or missing key based on your JSON.
