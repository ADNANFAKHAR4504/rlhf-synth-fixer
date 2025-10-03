Generated response by the model had failure related to aws cloud watch log  destination group.

```
⚠️ Terraform plan file not found, creating new plan and deploying...
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 776, in resource "aws_flow_log" "main":
│  776:   log_destination_arn = aws_cloudwatch_log_group.flow_logs.arn
│ 
│ An argument named "log_destination_arn" is not expected here.
╵
Error: Terraform exited with code 1.
Plan creation failed, attempting direct apply...

```
