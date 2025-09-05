can you provide the code snippet to fix this issue -
```
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1675, in resource "aws_route53_health_check" "primary":
│ 1675:   cloudwatch_logs_region        = var.primary_region
│ 
│ An argument named "cloudwatch_logs_region" is not expected here.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1693, in resource "aws_route53_health_check" "secondary":
│ 1693:   cloudwatch_logs_region        = var.secondary_region
│ 
│ An argument named "cloudwatch_logs_region" is not expected here.
╵
Error: Terraform exited with code 1.

```
