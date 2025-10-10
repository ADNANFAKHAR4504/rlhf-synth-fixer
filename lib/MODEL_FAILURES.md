

```

│ Error: invalid value for name_prefix (cannot begin with sg-)
│ 
│   with aws_security_group.primary_alb,
│   on tap_stack.tf line 348, in resource "aws_security_group" "primary_alb":
│  348:   name_prefix = "sg-alb-primary-"
│ 
╵
╷
│ Error: invalid value for name_prefix (cannot begin with sg-)
│ 
│   with aws_security_group.secondary_alb,
│   on tap_stack.tf line 862, in resource "aws_security_group" "secondary_alb":
│  862:   name_prefix = "sg-alb-secondary-"
│ 
╵
╷
│ Error: invalid value for name_prefix (cannot begin with sg-)
│ 
│   with aws_security_group.third_alb,
│   on tap_stack.tf line 1376, in resource "aws_security_group" "third_alb":
│ 1376:   name_prefix = "sg-alb-third-"
│ 
╵
Error: Terraform exited with code 1.

```
