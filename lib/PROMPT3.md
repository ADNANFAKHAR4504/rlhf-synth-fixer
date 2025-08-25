Now getting an issue in deployment
```
TapStackcdktf-pr2188  ╷
                      │ Error: creating CloudWatch Logs Log Group (/aws/cloudtrail/tap-trail-cdktf-pr2188): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 41d06941-5769-496d-85d0-6f2e36884fee, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/cloudtrail/tap-trail-cdktf-pr2188'
                      │ 
                      │   with aws_cloudwatch_log_group.cloudtrail-log-group (cloudtrail-log-group),
                      │   on cdk.tf.json line 281, in resource.aws_cloudwatch_log_group.cloudtrail-log-group (cloudtrail-log-group):
                      │  281:       }
                      │ 
                      ╵
TapStackcdktf-pr2188  ╷
                      │ Error: creating RDS DB Instance (tap-postgres-db-cdktf-pr2188): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 10e2100e-c196-4fad-874b-251c92820074, api error InvalidParameterCombination: Cannot find version 15.4 for postgres
                      │ 
                      │   with aws_db_instance.postgres-db (postgres-db),
                      │   on cdk.tf.json line 322, in resource.aws_db_instance.postgres-db (postgres-db):
                      │  322:       }
                      │ 
                      ╵
TapStackcdktf-pr2188  ╷
TapStackcdktf-pr2188  │ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/CloudTrailLogsRole) to IAM Role (tap-cloudtrail-role-cdktf-pr2188): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 83064d98-b513-41b2-831f-053c0b285060, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/CloudTrailLogsRole does not exist or is not attachable.
                      │ 
                      │   with aws_iam_role_policy_attachment.cloudtrail-logs-policy (cloudtrail-logs-policy),
                      │   on cdk.tf.json line 428, in resource.aws_iam_role_policy_attachment.cloudtrail-logs-policy (cloudtrail-logs-policy):
                      │  428:       },
                      │ 
                      ╵
TapStackcdktf-pr2188  ::error::Terraform exited with code 1.


0 Stacks deploying     1 Stack done     0 Stacks waiting
Invoking Terraform CLI failed with exit code 1
Error: Process completed with exit code 1.
```