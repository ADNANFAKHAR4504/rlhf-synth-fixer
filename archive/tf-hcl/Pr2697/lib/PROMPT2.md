Provide a fix in a code snippet for the below error

```

Using state key: prs/pr2697/terraform.tfstate
⚠️ Terraform plan file not found, creating new plan and deploying...
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 655, in resource "aws_iam_group" "mfa_required":
│  655:   tags = local.common_tags
│ 
│ An argument named "tags" is not expected here.
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
⚠️ Direct apply with plan failed, trying without plan...
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 655, in resource "aws_iam_group" "mfa_required":
│  655:   tags = local.common_tags
│ 
│ An argument named "tags" is not expected here.
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.

```
