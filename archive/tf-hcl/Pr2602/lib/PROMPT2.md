Here is the deploy error i got


╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.main,
│   on tap_stack.tf line 658, in resource "aws_db_instance" "main":
│  658:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
Error: Terraform exited with code 1.
 Terraform plan failed, but continuing...
 Terraform plan file not found, but continuing...
 Terraform bootstrap completed
 Bootstrap completed successfully
== Deploy Phase ===
 Terraform HCL project detected, running Terraform deploy...
Using state key: prs/pr2602/terraform.tfstate
 Terraform plan file not found, creating new plan and deploying...
╷
│ Warning: Argument is deprecated
│ 
│   with aws_guardduty_detector.main,
│   on tap_stack.tf line 591, in resource "aws_guardduty_detector" "main":
│  591: resource "aws_guardduty_detector" "main" {
│ 
│ datasources is deprecated. Use aws_guardduty_detector_feature resources
│ instead.
╵
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.main,
│   on tap_stack.tf line 658, in resource "aws_db_instance" "main":
│  658:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
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
╷
│ Warning: Argument is deprecated
│ 
│   with aws_guardduty_detector.main,
│   on tap_stack.tf line 591, in resource "aws_guardduty_detector" "main":
│  591: resource "aws_guardduty_detector" "main" {
│ 
│ datasources is deprecated. Use aws_guardduty_detector_feature resources
│ instead.
╵
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with aws_db_instance.main,
│   on tap_stack.tf line 658, in resource "aws_db_instance" "main":
│  658:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
Error: Terraform exited with code 1.
 All deployment attempts failed. Check for state lock issues.
No lock information available
 Deploy completed successfully
 Collecting deployment outputs...
 Getting deployment outputs...
Project: platform=tf, language=hcl
Environment suffix: pr2602
 Terraform project detected, writing outputs to cfn-outputs...
 Terraform outputs retrieved successfully
 Consolidated Terraform outputs:
{}
 Flat outputs:
{}
 Deployment outputs collection completed successfully

fix the error so deploy can pass