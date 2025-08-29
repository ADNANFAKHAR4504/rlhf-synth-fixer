Heres the latest error i got

╷
│ Error: Missing required argument
│ 
│   on secure_infrastructure_setup.tf line 841, in resource "aws_fms_policy" "waf_policy":
│  841: resource "aws_fms_policy" "waf_policy" {
│ 
│ The argument "exclude_resource_tags" is required, but no definition was
│ found.
╵
╷
│ Error: Unsupported argument
│ 
│   on secure_infrastructure_setup.tf line 844, in resource "aws_fms_policy" "waf_policy":
│  844:   security_service_type = "WAFV2"
│ 
│ An argument named "security_service_type" is not expected here.
╵
Error: Terraform exited with code 1.
⚠️ Terraform plan failed, but continuing...
⚠️ Terraform plan file not found, but continuing...
✅ Terraform bootstrap completed
✅ Bootstrap completed successfully
=== Deploy Phase ===
✅ Terraform HCL project detected, running Terraform deploy...
Using state key: prs/pr2486/terraform.tfstate
⚠️ Terraform plan file not found, creating new plan and deploying...
╷
│ Error: Missing required argument
│ 
│   on secure_infrastructure_setup.tf line 841, in resource "aws_fms_policy" "waf_policy":
│  841: resource "aws_fms_policy" "waf_policy" {
│ 
│ The argument "exclude_resource_tags" is required, but no definition was
│ found.
╵
╷
│ Error: Unsupported argument
│ 
│   on secure_infrastructure_setup.tf line 844, in resource "aws_fms_policy" "waf_policy":
│  844:   security_service_type = "WAFV2"
│ 
│ An argument named "security_service_type" is not expected here.
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...
╷
│ Error: Failed to load "tfplan" as a plan file
│ 
│ Error: stat tfplan: no such file or directory
╵
Error: Terraform exited with code 1.
╷
│ Error: Missing required argument
│ 
│   on secure_infrastructure_setup.tf line 841, in resource "aws_fms_policy" "waf_policy":
│  841: resource "aws_fms_policy" "waf_policy" {
│ 
│ The argument "exclude_resource_tags" is required, but no definition was
│ found.
╵
╷
│ Error: Unsupported argument
│ 
│   on secure_infrastructure_setup.tf line 844, in resource "aws_fms_policy" "waf_policy":
│  844:   security_service_type = "WAFV2"
│ 
│ An argument named "security_service_type" is not expected here.
╵
Error: Terraform exited with code 1.

fix the error.