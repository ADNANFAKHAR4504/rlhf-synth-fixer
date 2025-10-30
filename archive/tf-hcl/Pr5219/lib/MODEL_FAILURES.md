1. Critical Failure — Security Group Naming Convention
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

2. Medium Failure: Model used wrong DB Engine version for the postgres DB

means that the PostgreSQL version 15.4 you’re trying to use in your aws_db_instance block is not available in the selected AWS region (us-east-1 or us-west-2) or for that specific instance class (db.r6g.xlarge).

Why this happens

RDS PostgreSQL versions vary by:

Region

Instance class (e.g., Graviton vs x86)

Engine type (postgres)

AWS sometimes retires patch versions (like 15.4) or limits availability for certain classes.

Fix - Apply the available version

Ref - https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html
```

╷
│ Error: creating RDS DB Instance (rds-primary-drsh): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: b63e3918-c173-4d4f-9846-b7c7c93539f1, api error InvalidParameterCombination: Cannot find version 15.4 for postgres
│ 
│   with aws_db_instance.primary,
│   on tap_stack.tf line 635, in resource "aws_db_instance" "primary":
│  635: resource "aws_db_instance" "primary" {
│ 
╵
Error: Terraform exited with code 1.
⚠️Direct apply with plan failed, trying without plan...

```

3. Medium Failure: indicates that the password generated for the RDS master user includes disallowed characters. According to the AWS RDS constraint, the password may not contain '/', '@', '"', or spaces.

Error

```
╷
│ Error: creating RDS DB Instance (rds-primary-drsh): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 04c4bb0c-ae53-411c-af12-494a940f7268, api error InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
│ 
│   with aws_db_instance.primary,
│   on tap_stack.tf line 635, in resource "aws_db_instance" "primary":
│  635: resource "aws_db_instance" "primary" {
│ 
╵
Error: Terraform exited with code 1.
```

Fix

```
resource "random_password" "db_password" {
  length  = 32
  override_characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%^&*()-_=+{}[]:;,.<>?"
}

```

4. Critical Failure: wrong paramegter used with the RDS

occurs because you are trying to use the apply_immediately = true setting with a parameter in the DB parameter group that is static. Static parameters require a database reboot to take effect, and cannot be applied immediately.

What to do:
Locate your aws_db_parameter_group resources for primary and secondary in your tap_stack.tf (line 569 and 601).

Remove or set apply_immediately = false for these parameter groups, or remove this setting altogether since it does not apply to parameter groups but to the DB instances.

Instead of applying changes immediately on the parameter group, you need a controlled reboot of the RDS instances to have static parameter changes applied

```

│ Error: modifying RDS DB Parameter Group (pg-primary-drsh): operation error RDS: ModifyDBParameterGroup, https response error StatusCode: 400, RequestID: 11e7025d-3d56-4b8e-8e52-f8ae1662f630, api error InvalidParameterCombination: cannot use immediate apply method for static parameter

│ 

│   with aws_db_parameter_group.primary,

│   on tap_stack.tf line 569, in resource "aws_db_parameter_group" "primary":

│  569: resource "aws_db_parameter_group" "primary" {

│ 

╵

╷

│ Error: modifying RDS DB Parameter Group (pg-secondary-drsh): operation error RDS: ModifyDBParameterGroup, https response error StatusCode: 400, RequestID: e644c362-f5b1-4889-afdf-8d7779da5969, api error InvalidParameterCombination: cannot use immediate apply method for static parameter

│ 

│   with aws_db_parameter_group.secondary,

│   on tap_stack.tf line 601, in resource "aws_db_parameter_group" "secondary":

│  601: resource "aws_db_parameter_group" "secondary" {

│ 

╵

```
