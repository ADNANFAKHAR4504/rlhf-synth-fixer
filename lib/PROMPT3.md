The response still has some errors in the resources,
Error: creating CloudWatch Logs Log Group (/aws/secconfig/security-logs): AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/secconfig/security-logs'
│ 	status code: 400, request id: ef963b03-2ba9-4478-9c88-2626dfd67de2
│ 
│   with aws_cloudwatch_log_group.security_logs,
│   on tap_stack.tf line 452, in resource "aws_cloudwatch_log_group" "security_logs":
│  452: resource "aws_cloudwatch_log_group" "security_logs" {
│ 
╵
╷
│ Error: Creating GuardDuty Detector failed: BadRequestException: The request is rejected because a detector already exists for the current account.
│ {
│   RespMetadata: {
│     StatusCode: 400,
│     RequestID: "414aa0f9-2b0b-4c76-b90b-92e425cc4387"
│   },
│   Message_: "The request is rejected because a detector already exists for the current account.",
│   Type: "InvalidInputException"
│ }
│ 
│   with aws_guardduty_detector.main,
│   on tap_stack.tf line 507, in resource "aws_guardduty_detector" "main":
│  507: resource "aws_guardduty_detector" "main" {
│ 
╵
╷
│ Error: attaching policy arn:aws:iam::aws:policy/service-role/ConfigRole to IAM Role SecConfig-ConfigRole: NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.
│ 	status code: 404, request id: 29b11213-faed-47fe-9dec-19bbf86058f8
│ 
│   with aws_iam_role_policy_attachment.config_role_policy,
│   on tap_stack.tf line 645, in resource "aws_iam_role_policy_attachment" "config_role_policy":
│  645: resource "aws_iam_role_policy_attachment" "config_role_policy" {
│ 
╵
╷
│ Error: Creating Delivery Channel failed: NoAvailableConfigurationRecorderException: Configuration recorder is not available to put delivery channel.
│ 
│   with aws_config_delivery_channel.main,
│   on tap_stack.tf line 664, in resource "aws_config_delivery_channel" "main":
│  664: resource "aws_config_delivery_channel" "main" {
│ 
╵