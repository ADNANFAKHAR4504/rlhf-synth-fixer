│ Error: creating CloudTrail Trail (secure-web-app-cloudtrail): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: ebc3c5a1-3410-43bc-ba55-89fbecfa7453, InsufficientEncryptionPolicyException: Insufficient permissions to access S3 bucket secure-web-app-cloudtrail-logs-20250902145133375200000002 or KMS key arn:aws:kms:us-west-2:***:key/fb544e72-5daf-4bf8-87f2-ebb70fe15158.
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 529, in resource "aws_cloudtrail" "main":
│  529: resource "aws_cloudtrail" "main" {
│ 
╵
╷
│ Error: creating GuardDuty Detector: operation error GuardDuty: CreateDetector, https response error StatusCode: 400, RequestID: df27216f-31e9-4524-80f7-270ef67f8f87, BadRequestException: The request is rejected because a detector already exists for the current account.
│ 
│   with aws_guardduty_detector.main,
│   on tap_stack.tf line 559, in resource "aws_guardduty_detector" "main":
│  559: resource "aws_guardduty_detector" "main" {
│ 
╵
╷
│ Error: creating CloudWatch Logs Log Group (/aws/ec2/secure-web-app/httpd/access): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 6686f32c-1b5f-4685-8655-26a5f52550c5, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/ec2/secure-web-app/httpd/access'
│ 
│   with aws_cloudwatch_log_group.httpd_access,
│   on tap_stack.tf line 888, in resource "aws_cloudwatch_log_group" "httpd_access":
│  888: resource "aws_cloudwatch_log_group" "httpd_access" {
│ 
╵
╷
│ Error: creating CloudWatch Logs Log Group (/aws/ec2/secure-web-app/httpd/error): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 2597079a-c0df-40cc-a433-70d568b36540, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/ec2/secure-web-app/httpd/error'
│ 
│   with aws_cloudwatch_log_group.httpd_error,
│   on tap_stack.tf line 898, in resource "aws_cloudwatch_log_group" "httpd_error":
│  898: resource "aws_cloudwatch_log_group" "httpd_error" {
│ 
╵
Error: Terraform exited with code 1.
 All deployment attempts failed. Check for state lock issues.

Heres the latest  error