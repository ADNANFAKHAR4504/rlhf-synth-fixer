1. Critical Failures - The error you are seeing is because the argument log_destination_arn is no longer supported in recent versions of the Terraform AWS provider for the aws_flow_log resource. Instead, you should use the log_destination argument, which accepts the ARN of the CloudWatch log group or S3 bucket, depending on your log destination type.

Additional Notes
The log_destination_arn argument was deprecated in favor of log_destination to unify the interface for both S3 and CloudWatch log destinations.

Make sure your AWS provider version is up to date (5.18.1 or later is recommended for full compatibility).

If you are using an older version of the provider, consider upgrading to avoid deprecation warnings and ensure compatibility with AWS API changes.


```

╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 683, in resource "aws_flow_log" "primary":
│  683:   log_destination_arn  = aws_cloudwatch_log_group.primary_flow_logs.arn
│ 
│ An argument named "log_destination_arn" is not expected here.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 699, in resource "aws_flow_log" "secondary":
│  699:   log_destination_arn  = aws_cloudwatch_log_group.secondary_flow_logs.arn
│ 
│ An argument named "log_destination_arn" is not expected here.
╵

```

2. Medium Failures - Model wrongly used the sg- as wrong prefix in the security groups which is not allowed.


Fix- remvove the sg- from prefix in security groups.
```

╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.primary_alb,
│   on tap_stack.tf line 718, in resource "aws_security_group" "primary_alb":
│  718:   name        = "sg-alb-primary-${local.resource_suffix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.secondary_alb,
│   on tap_stack.tf line 757, in resource "aws_security_group" "secondary_alb":
│  757:   name        = "sg-alb-secondary-${local.resource_suffix}"
│ 
╵

```
