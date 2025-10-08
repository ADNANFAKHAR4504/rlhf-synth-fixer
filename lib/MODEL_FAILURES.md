```
Error: Terraform exited with code 1.
⚠️ Direct apply with plan failed, trying without plan...
╷
│ Error: invalid value for name_prefix (cannot begin with sg-)
│ 
│   with aws_security_group.web,
│   on tap_stack.tf line 258, in resource "aws_security_group" "web":
│  258:   name_prefix = "sg-web-"
│ 
╵
Error: Terraform exited with code 1.
```
