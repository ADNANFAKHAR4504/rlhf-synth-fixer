## Model Errors Encountered

### Error 1: Deprecated Attribute Warning
```
│ Warning: Deprecated attribute
│ 
│   on main.tf line 670, in resource "aws_ecs_task_definition" "app":
│  670:           awslogs-region        = data.aws_region.current.name
│ 
│ The attribute "name" is deprecated. Refer to the provider documentation for details.
```

**Resolution**: Changed `data.aws_region.current.name` to `data.aws_region.current.id`

### Error 2: Invalid CloudWatch Logs Export Value
```
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.main,
│   on main.tf line 857, in resource "aws_db_instance" "main":
│  857:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
```

**Resolution**: Changed `"slow_query"` to `"slowquery"` (removed underscore) in the `enabled_cloudwatch_logs_exports` list.

### Error 3: CloudWatch Logs KMS Key Access Denied
```
│ Error: creating CloudWatch Logs Log Group (/aws/ecs/secure-ecs-app): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 0f8fd3fb-5c9a-4731-a14b-995c8e1da6cd, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:137285103215:log-group:/aws/ecs/secure-ecs-app'
│ 
│   with aws_cloudwatch_log_group.ecs,
│   on main.tf line 526, in resource "aws_cloudwatch_log_group" "ecs":
│  526: resource "aws_cloudwatch_log_group" "ecs" {
```

```
│ Error: creating CloudWatch Logs Log Group (/aws/rds/instance/secure-ecs-app/error): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: add1ab5a-af50-47f5-b804-49a07e381c7c, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:137285103215:log-group:/aws/rds/instance/secure-ecs-app/error'
│ 
│   with aws_cloudwatch_log_group.rds,
│   on main.tf line 537, in resource "aws_cloudwatch_log_group" "rds":
│  537: resource "aws_cloudwatch_log_group" "rds" {
```

**Issue**: CloudWatch Logs service needs explicit permission to use the custom KMS key for log group encryption.

### Error 4: ECS Task Definition Port Mapping Mismatch
```
╷
│ Error: creating ECS Task Definition (secure-ecs-app-task): operation error ECS: RegisterTaskDefinition, https response error StatusCode: 400, RequestID: 1021fde3-8fe7-4016-a325-95d1c8a84840, ClientException: When networkMode=awsvpc, the host ports and container ports in port mappings must match.
│ 
│   with aws_ecs_task_definition.app,
│   on main.tf line 667, in resource "aws_ecs_task_definition" "app":
│  667: resource "aws_ecs_task_definition" "app" {
│ 
╵
```

**Resolution**: When using `networkMode = "awsvpc"`, the `hostPort` and `containerPort` values in port mappings must be identical. Changed `hostPort = 8080` to `hostPort = 80` to match the `containerPort = 80`.
