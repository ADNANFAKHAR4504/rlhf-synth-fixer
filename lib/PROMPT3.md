Getting these errors, can you provide the code snippet to fix these errors

╷
│ Error: creating WAFv2 WebACL (tap-stack-production-waf): operation error WAFV2: CreateWebACL, https response error StatusCode: 400, RequestID: acbda1b3-b607-47ee-bdfc-b5421b03c713, WAFInvalidParameterException: Error reason: The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT
│ 
│   with aws_wafv2_web_acl.main,
│   on tap_stack.tf line 772, in resource "aws_wafv2_web_acl" "main":
│  772: resource "aws_wafv2_web_acl" "main" {
│ 

Can you explain the error and seems this is not the region issue
