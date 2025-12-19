The deployment failed in CI with this error
```
Running Terraform plan...

> tap@0.1.0 tf:plan
> cd lib && terraform plan -lock=false -out=tfplan

╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 542, in resource "aws_api_gateway_deployment" "main":
│  542:   stage_name  = "prod"
│ 
│ An argument named "stage_name" is not expected here.
╵
Error: Terraform exited with code 1.
⚠️ Terraform plan failed, but continuing...
⚠️ Terraform plan file not found, but continuing...
✅ Terraform bootstrap completed
✅ Bootstrap completed successfully
=== Deploy Phase ===
✅ Terraform HCL project detected, running Terraform deploy...
Using state key: prs/pr2669/terraform.tfstate
⚠️ Terraform plan file not found, creating new plan and deploying...
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 542, in resource "aws_api_gateway_deployment" "main":
│  542:   stage_name  = "prod"
│ 
│ An argument named "stage_name" is not expected here.
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
│   on tap_stack.tf line 542, in resource "aws_api_gateway_deployment" "main":
│  542:   stage_name  = "prod"
│ 
│ An argument named "stage_name" is not expected here.
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.
```