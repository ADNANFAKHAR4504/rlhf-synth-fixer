1. Model wrongly included the lambda fucntion against the requirement for the backup part and was trying to create the lambda which was not required at all and deployment was getting failed because of this.

```

⚠️ Terraform plan file not found, creating new plan and deploying... ╷ │ Error: Error in function call │ │ on tap_stack.tf line 408, in resource "aws_lambda_function" "backup_handler": │ 408: source_code_hash = filebase64sha256("backup_lambda.zip") │ ├──────────────── │ │ while calling filebase64sha256(path) │ │ Call to function "filebase64sha256" failed: open backup_lambda.zip: no such │ file or directory. ╵ Error: Terraform exited with code 1. Plan creation failed, attempting direct apply... ╷ │ Error: Failed to load "tfplan" as a plan file │ │ Error: stat tfplan: no such file or directory ╵ Error: Terraform exited with code 1. ⚠️ Direct apply with plan failed, trying without plan... ╷ │ Error: Error in function call │ │ on tap_stack.tf line 408, in resource "aws_lambda_function" "backup_handler": │ 408: source_code_hash = filebase64sha256("backup_lambda.zip") │ ├──────────────── │ │ while calling filebase64sha256(path) │ │ Call to function "filebase64sha256" failed: open backup_lambda.zip: no such │ file or directory. ╵ Error: Terraform exited with code 1. ❌ All deployment attempts failed. Check for state lock issues.

```
