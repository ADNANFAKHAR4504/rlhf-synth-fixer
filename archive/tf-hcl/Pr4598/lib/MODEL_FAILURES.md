1. Critical Failure — Security Group Naming Convention
Root Cause

Terraform security group resources in your tap_stack.tf used a name starting with "sg-"
This is invalid because AWS reserves the "sg-" prefix for its own internally generated Security Group IDs (e.g., sg-0ff7dfda60377d2bc).
When you use a name starting with sg-, AWS interprets it as an internal SG ID format, causing a validation failure during creation.

AWS Reference

As per AWS rules, security group names cannot start with sg- because it conflicts with system-generated identifiers.

Ref: https://paladincloud.io/aws-security-risks/aws-security-group-naming-convention/

```
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.web,
│   on tap_stack.tf line 364, in resource "aws_security_group" "web":
│  364:   name        = local.sg_web_name
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.ec2,
│   on tap_stack.tf line 426, in resource "aws_security_group" "ec2":
│  426:   name        = local.sg_ec2_name
│ 
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.
```
2. High-Level Failure — IAM Role + Lambda Inline Code Issue
Root Cause 1 – IAM Role Naming

AWS IAM role names cannot include uppercase letters or special characters, and must comply with:

Allowed characters: [a-zA-Z0-9+=,.@_-]

Typically lowercase or PascalCase, but some IaC policies (like PaladinCloud or enterprise rules) enforce lowercase-only names.

You mentioned the model-generated role used capital letters and special characters, which violates internal or organizational compliance rules.

Root Cause 2 – Lambda Inline Code Argument

Terraform’s AWS provider does not support inline_code for aws_lambda_function.
The correct argument is filename or source_code_hash (for zipped code), or handler and runtime if using an uploaded package.

Fix-
We can only use inline code via filename and local file, or embed code using local_file data source.

Ref- https://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateRole.html?utm_source=chatgpt.com

AWS CloudFormation IAM::Role RoleName property
The AWS CloudFormation documentation for AWS::IAM::Role confirms the same constraints for RoleName:

Role names are up to 64 characters. Valid characters are uppercase, lowercase, digits, no spaces, plus _+=,.@-. Role names are not distinguished by case.

```
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 692, in resource "aws_lambda_function" "processor":
│  692:   inline_code = <<EOF
│ 
│ An argument named "inline_code" is not expected here.
╵
```
