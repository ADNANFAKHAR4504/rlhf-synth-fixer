I got another error in the pipeline. I'm providing the error message. Please provide the necessary solution and fixes to the error message so that the pipeline can run successfully.

# Here is the Terraform Deployment error that needs fixing:

I'm getting these deployment errors with the current Terraform configuration. I need help resolving it.

Error message:
╷
│ Error: validating S3 Bucket (projectX-assets-ec153bf7) name: only lowercase alphanumeric characters and hyphens allowed in "projectX-assets-ec153bf7"
│
│ with aws_s3_bucket.app_assets,
│ on main.tf line 135, in resource "aws_s3_bucket" "app_assets":
│ 135: resource "aws_s3_bucket" "app_assets" {
│
╵
╷
│ Error: creating WAFv2 WebACL Association (arn:aws:wafv2:us-west-2:\*\*\*:regional/webacl/projectX-dev-api-waf/c6192f34-231b-47cd-9b2a-8de9e88b4589,arn:aws:apigateway:us-west-2::/apis/pl3pgi6ue8/stages/dev): operation error WAFV2: AssociateWebACL, https response error StatusCode: 400, RequestID: 8b0a45ff-512b-4811-9467-0e3ab99a97ef, WAFInvalidParameterException: Error reason: The ARN isn't valid. A valid ARN begins with arn: and includes other information separated by colons or slashes., field: RESOURCE_ARN, parameter: arn:aws:apigateway:us-west-2::/apis/pl3pgi6ue8/stages/dev
│
│ with aws_wafv2_web_acl_association.api_gateway_association,
│ on main.tf line 875, in resource "aws_wafv2_web_acl_association" "api_gateway_association":
│ 875: resource "aws_wafv2_web_acl_association" "api_gateway_association" {
│
╵
Error: Terraform exited with code 1.

aws_s3_bucket.app_assets: Creating...
aws_wafv2_web_acl_association.api_gateway_association: Creating...
╷
│ Error: validating S3 Bucket (projectX-assets-ec153bf7) name: only lowercase alphanumeric characters and hyphens allowed in "projectX-assets-ec153bf7"
│
│ with aws_s3_bucket.app_assets,
│ on main.tf line 135, in resource "aws_s3_bucket" "app_assets":
│ 135: resource "aws_s3_bucket" "app_assets" {
│
╵
╷
│ Error: creating WAFv2 WebACL Association (arn:aws:wafv2:us-west-2:\*\*\*:regional/webacl/projectX-dev-api-waf/c6192f34-231b-47cd-9b2a-8de9e88b4589,arn:aws:apigateway:us-west-2::/apis/pl3pgi6ue8/stages/dev): operation error WAFV2: AssociateWebACL, https response error StatusCode: 400, RequestID: be33cca3-1e92-4b35-a54e-f8c3063f182c, WAFInvalidParameterException: Error reason: The ARN isn't valid. A valid ARN begins with arn: and includes other information separated by colons or slashes., field: RESOURCE_ARN, parameter: arn:aws:apigateway:us-west-2::/apis/pl3pgi6ue8/stages/dev
│
│ with aws_wafv2_web_acl_association.api_gateway_association,
│ on main.tf line 875, in resource "aws_wafv2_web_acl_association" "api_gateway_association":
│ 875: resource "aws_wafv2_web_acl_association" "api_gateway_association" {
│
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.
