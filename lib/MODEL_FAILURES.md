Model has following failures 

1. Model was unable to generate full outputs in single turn so had to generate turn 2.

2. Model use the wrong parameter slowquery in db instance which failed the db deployment.

3. Model used the wrong user data function in launch template which failed the deployment.

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
│ Error: Invalid function argument
│ 
│   on tap_stack.tf line 767, in resource "aws_launch_template" "main":
│  767:   user_data = base64encode(templatefile("${path.module}/user_data.sh", {
│  768:     rds_endpoint = aws_db_instance.main.endpoint
│  769:     s3_bucket    = aws_s3_bucket.static_content.bucket
│  770:   }))
│     ├────────────────
│     │ while calling templatefile(path, vars)
│     │ path.module is "."
│ 
│ Invalid value for "path" parameter: no file exists at "./user_data.sh";
│ this function works only with files that are distributed as part of the
│ configuration source code, so if this file will be created by a resource in
│ this configuration you must instead obtain this result from an attribute of
│ that resource.

```
