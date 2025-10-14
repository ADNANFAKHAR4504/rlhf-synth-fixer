```

╷
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
❌ All deployment attempts failed. Check for state lock issues.

```
