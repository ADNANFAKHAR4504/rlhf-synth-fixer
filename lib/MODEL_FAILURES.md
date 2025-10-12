TapStackpr4163  aws_alb_listener.alb_listener_1B64D337: Creation complete after 0s [id=arn:aws:elasticloadbalancing:us-east-1:***:listener/app/myapp-pr4163-alb/48874c7dcd406e6f/b631596740a121a2]
TapStackpr4163  ╷
                │ Error: creating CloudWatch Metric Alarm
                │ 
                │   with aws_cloudwatch_metric_alarm.cloudwatch_alb-unhealthy-hosts_ECDC1B8A (cloudwatch/alb-unhealthy-hosts),
                │   on cdk.tf.json line 281, in resource.aws_cloudwatch_metric_alarm.cloudwatch_alb-unhealthy-hosts_ECDC1B8A (cloudwatch/alb-unhealthy-hosts):
                │  281:       },
                │ 
                │ ID: myapp-pr4163-unhealthy-hosts
                │ Cause: operation error CloudWatch: PutMetricAlarm, , api error
                │ ValidationError: 1 validation error detected: Value '' at
                │ 'dimensions.1.member.value' failed to satisfy constraint: Member must have
                │ length greater than or equal to 1"
                │ 
                ╵
TapStackpr4163  ╷
                │ Error: reading ZIP file (lambda.zip): open lambda.zip: no such file or directory
                │ 
                │   with aws_lambda_function.lambda_function_8A4960FD (lambda/function),
                │   on cdk.tf.json line 485, in resource.aws_lambda_function.lambda_function_8A4960FD (lambda/function):
                │  485:       }
                │ 
                ╵
TapStackpr4163  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.

5aae5c4a7614]
TapStackpr4163  ╷
                │ Error: creating CloudWatch Logs Log Group (/aws/lambda/myapp-pr4163-processor): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 74e2115b-8753-4000-be40-32588c7edc48, ResourceAlreadyExistsException: The specified log group already exists
                │ 
                │   with aws_cloudwatch_log_group.cloudwatch_lambda-logs_2A7F2AA8 (cloudwatch/lambda-logs),
                │   on cdk.tf.json line 280, in resource.aws_cloudwatch_log_group.cloudwatch_lambda-logs_2A7F2AA8 (cloudwatch/lambda-logs):
                │  280:       },
                │ 
                ╵
TapStackpr4163  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.
