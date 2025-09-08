can you provide the code snippet to fix this issue -

```
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.main,
│   on tap_stack.tf line 589, in resource "aws_db_instance" "main":
│  589:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.

```
