 Critical Failure — Security Group Naming Convention
Root Cause

Terraform security group resources in your tap_stack.tf used a name starting with "sg-"
This is invalid because AWS reserves the "sg-" prefix for its own internally generated Security Group IDs (e.g., sg-0ff7dfda60377d2bc).
When you use a name starting with sg-, AWS interprets it as an internal SG ID format, causing a validation failure during creation.

AWS Reference

As per AWS rules, security group names cannot start with sg- because it conflicts with system-generated identifiers.

Ref: https://paladincloud.io/aws-security-risks/aws-security-group-naming-convention/

```
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.rds_primary,
│   on tap_stack.tf line 421, in resource "aws_security_group" "rds_primary":
│  421:   name        = "sg-rds-primary-${local.resource_suffix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.lambda_primary,
│   on tap_stack.tf line 457, in resource "aws_security_group" "lambda_primary":
│  457:   name        = "sg-lambda-primary-${local.resource_suffix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.rds_secondary,
│   on tap_stack.tf line 481, in resource "aws_security_group" "rds_secondary":
│  481:   name        = "sg-rds-secondary-${local.resource_suffix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.lambda_secondary,
│   on tap_stack.tf line 517, in resource "aws_security_group" "lambda_secondary":
│  517:   name        = "sg-lambda-secondary-${local.resource_suffix}"
│ 
╵
Error: Terraform exited with code 1.
```
