I got some errors in the pipeline. I'm providing the error message. Please provide the necessary solution and fixes to the error message so that the pipeline can run successfully.

# Here is the Terraform Deployment error that needs fixing:

I'm getting deployment errors with the current Terraform configuration. The error is blocking the entire deployment, and I need help resolving it.

Error message:

╷
│ Error: creating CloudWatch Logs Log Group (/aws/lambda/secureApp-function): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: c7903165-27a9-4e57-b53f-e3d8c0665953, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:\*\*\*:log-group:/aws/lambda/secureApp-function'
│
│ with aws_cloudwatch_log_group.lambda_logs,
│ on main.tf line 159, in resource "aws_cloudwatch_log_group" "lambda_logs":
│ 159: resource "aws_cloudwatch_log_group" "lambda_logs" {
│
╵
╷
│ Error: creating WAFv2 WebACL (secureApp-waf): operation error WAFV2: CreateWebACL, https response error StatusCode: 400, RequestID: 0ab3035f-09d8-472a-ad83-5e15c9e5c5c9, WAFInvalidParameterException: Error reason: The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT
│
│ with aws_wafv2_web_acl.main,
│ on main.tf line 229, in resource "aws_wafv2_web_acl" "main":
│ 229: resource "aws_wafv2_web_acl" "main" {
│
╵
Error: Terraform exited with code 1.

╷
│ Error: creating CloudWatch Logs Log Group (/aws/lambda/secureApp-function): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: f00a8250-ddb8-4f3d-949a-43be018f1161, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:\*\*\*:log-group:/aws/lambda/secureApp-function'
│
│ with aws_cloudwatch_log_group.lambda_logs,
│ on main.tf line 159, in resource "aws_cloudwatch_log_group" "lambda_logs":
│ 159: resource "aws_cloudwatch_log_group" "lambda_logs" {
│
╵
╷
│ Error: creating WAFv2 WebACL (secureApp-waf): operation error WAFV2: CreateWebACL, https response error StatusCode: 400, RequestID: 1f6ca9e6-2959-4682-aabe-3c184ee01984, WAFInvalidParameterException: Error reason: The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT
│
│ with aws_wafv2_web_acl.main,
│ on main.tf line 229, in resource "aws_wafv2_web_acl" "main":
│ 229: resource "aws_wafv2_web_acl" "main" {
│
╵
Error: Terraform exited with code 1.
