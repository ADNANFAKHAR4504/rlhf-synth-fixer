1. Model used incorrect naming convention for few of the resoruces.
2. Model used incorrect prefix for few of the resources.
3. Models use incorrect Capital letters for few of the resoruces.

```

│ Error: "name_prefix" cannot be longer than 6 characters: "pr-Byte"
│ 
│   with aws_lb.primary,
│   on tap_stack.tf line 546, in resource "aws_lb" "primary":
│  546:   name_prefix        = "pr-Byte"
│ 
╵
╷
│ Error: "name_prefix" cannot be longer than 6 characters
│ 
│   with aws_lb_target_group.primary,
│   on tap_stack.tf line 562, in resource "aws_lb_target_group" "primary":
│  562:   name_prefix = "pr-Byte"
│ 
╵
╷
│ Error: "name_prefix" cannot be longer than 6 characters: "sc-Byte"
│ 
│   with aws_lb.secondary,
│   on tap_stack.tf line 1038, in resource "aws_lb" "secondary":
│ 1038:   name_prefix        = "sc-Byte"
│ 
╵
╷
│ Error: "name_prefix" cannot be longer than 6 characters
│ 
│   with aws_lb_target_group.secondary,
│   on tap_stack.tf line 1054, in resource "aws_lb_target_group" "secondary":
│ 1054:   name_prefix = "sc-Byte"

```
