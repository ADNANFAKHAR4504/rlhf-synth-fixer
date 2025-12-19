Can you help fix this error , seems tags are not expected for this resource -
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
