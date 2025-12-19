Model had below failures -

1. Model was unable to deploy the RDS in first go as per the instructions given.

2. Model was unable to give deploy the EIP resources so had to make few chnages in that.

```
getting below error ╷ │ Error: Unsupported argument │ │ on tap_stack.tf line 312, in resource "aws_flow_log" "main": │ 312: log_destination_arn = aws_cloudwatch_log_group.vpc_flow_logs.arn │ │ An argument named "log_destination_arn" is not expected here. ╵ Error: Terraform exited with code 1.
```
