1. Error 1: filebase64sha256 failed (lambda_placeholder.zip missing)
Problem: Terraform can't find or open the file you referenced for the Lambda code hash.

How to Fix
Option 1: Add the file

Ensure lambda_placeholder.zip is present in your project root or ${path.module} directory. This zip must contain your Lambda handler and dependencies.

Error 2 and 3: Invalid resource type aws_lambda_function_code
Problem: Terraform AWS provider does not support aws_lambda_function_code. You tried to create resources of an unsupported type.


```
╷
│ Error: Error in function call
│ 
│   on tap_stack.tf line 757, in resource "aws_lambda_function" "data_replay":
│  757:   source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")
│     ├────────────────
│     │ while calling filebase64sha256(path)
│     │ path.module is "."
│ 
│ Call to function "filebase64sha256" failed: open lambda_placeholder.zip: no
│ such file or directory.
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 770, in resource "aws_lambda_function_code" "device_verification":
│  770: resource "aws_lambda_function_code" "device_verification" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_function_code".
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 855, in resource "aws_lambda_function_code" "data_replay":
│  855: resource "aws_lambda_function_code" "data_replay" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_lambda_function_code".
╵
Error: Terraform exited with code 1.

```

Summary of Fixes -
All references to aws_lambda_function_code resources must be removed and replaced with valid aws_lambda_function blocks using either zip_file or filename/source_code_hash.

If referencing zip files, ensure they exist in your Terraform module directory.

For quick testing and placeholder logic, use the zip_file option with inline handler source code
