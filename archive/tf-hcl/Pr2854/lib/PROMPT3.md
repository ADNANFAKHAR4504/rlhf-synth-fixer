can you provide the code snippet to fix these issues -

```
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.primary_rds,
│   on tap_stack.tf line 1129, in resource "aws_db_instance" "primary_rds":
│ 1129:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.secondary_rds,
│   on tap_stack.tf line 1190, in resource "aws_db_instance" "secondary_rds":
│ 1190:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1346, in resource "aws_api_gateway_deployment" "app_deployment":
│ 1346:   stage_name  = var.environment
│ 
│ An argument named "stage_name" is not expected here.
╵
╷
│ Error: expected delivery_frequency to be one of ["One_Hour" "Three_Hours" "Six_Hours" "Twelve_Hours" "TwentyFour_Hours"], got Daily
│ 
│   with aws_config_delivery_channel.app_config_delivery_channel,
│   on tap_stack.tf line 1686, in resource "aws_config_delivery_channel" "app_config_delivery_channel":
│ 1686:     delivery_frequency = "Daily"
│ 
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
 Direct apply with plan failed, trying without plan...

```
