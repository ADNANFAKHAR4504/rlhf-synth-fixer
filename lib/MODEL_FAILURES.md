1. Critical Failure- Model is using wrong prefix with the security group which is not allowed as per the AWS naming conventions. sg- can not be used in prefix with any security groups as thats reserved.

Fix - Remove sg- will all the security groups being created.

```
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.rds_primary,
│   on tap_stack.tf line 487, in resource "aws_security_group" "rds_primary":
│  487:   name        = "sg-rds-${local.primary_prefix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.rds_secondary,
│   on tap_stack.tf line 515, in resource "aws_security_group" "rds_secondary":
│  515:   name        = "sg-rds-${local.secondary_prefix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.lambda_primary,
│   on tap_stack.tf line 543, in resource "aws_security_group" "lambda_primary":
│  543:   name        = "sg-lambda-${local.primary_prefix}"
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.lambda_secondary,
│   on tap_stack.tf line 563, in resource "aws_security_group" "lambda_secondary":
│  563:   name        = "sg-lambda-${local.secondary_prefix}"
│ 

```

2. Critical Failure - In Terraform's AWS provider, the aws_route53_health_check resource does not use an argument named interval. Instead, it uses the argument request_interval to specify the number of seconds between health checks, with accepted values typically 10 or 30


```
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1570, in resource "aws_route53_health_check" "primary":
│ 1570:   interval          = 30
│ 
│ An argument named "interval" is not expected here.
╵

```
