Generated response by model had below failures - 

1. Model was not able to generate the full response in single Turn. So had to genertae multiple turns.

2. Model applied tags wrongly to the api gateway which doesn't accept the tags directly and deployment threw below errors

```
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1267, in resource "aws_api_gateway_deployment" "api_deployment":
│ 1267:   stage_name  = "prod"
│ 
│ An argument named "stage_name" is not expected here.
╵
╷
│ Error: Unsupported argument
│ 
│   on tap_stack.tf line 1274, in resource "aws_api_gateway_deployment" "api_deployment":
│ 1274:   tags = local.common_tags
│ 
│ An argument named "tags" is not expected here.
╵
Error: Terraform exited with code 1.
```
