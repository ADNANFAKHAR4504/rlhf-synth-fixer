could you pls provide the code snippet to fix the below error or may be we can remove this parameter itself -

```

⚠️ Direct apply with plan failed, trying without plan...
╷
│ Error: expected insufficient_data_health_status to be one of ["Healthy" "Unhealthy" "LastKnownStatus"], got Failure
│ 
│   with aws_route53_health_check.alb,
│   on tap_stack.tf line 1104, in resource "aws_route53_health_check" "alb":
│ 1104:   insufficient_data_health_status = "Failure"
│ 
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.

```
