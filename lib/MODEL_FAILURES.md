1. Generated response by model had issues creation in vpc flow logs.


2. Generated response by model had issues realted to autoscaling group creation

3. S3 bucket policy also had issues wrt syntax.

```


│ Error: creating EC2 EIP: operation error EC2: AllocateAddress, https response error StatusCode: 400, RequestID: 5dfa5ccd-55a8-4f9f-96f5-012222723a6d, api error AddressLimitExceeded: The maximum number of addresses has been reached.
│ 
│   with aws_eip.nat[0],
│   on tap_stack.tf line 166, in resource "aws_eip" "nat":
│  166: resource "aws_eip" "nat" {
│ 
╵
╷
│ Error: creating EC2 EIP: operation error EC2: AllocateAddress, https response error StatusCode: 400, RequestID: c3575429-4aaf-4e47-a025-1caf9213dbc6, api error AddressLimitExceeded: The maximum number of addresses has been reached.
│ 
│   with aws_eip.nat[1],
│   on tap_stack.tf line 166, in resource "aws_eip" "nat":
│  166: resource "aws_eip" "nat" {
│ 
╵
╷
│ Error: creating CloudWatch Logs Log Group (/aws/vpc/tap-stack-vpc/flow-logs): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 3b182d21-e7d0-4b06-be6e-586a7e47343c, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/vpc/tap-stack-vpc/flow-logs'
│ 
│   with aws_cloudwatch_log_group.vpc_flow_logs,
│   on tap_stack.tf line 234, in resource "aws_cloudwatch_log_group" "vpc_flow_logs":
│  234: resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
│ 
╵
╷
│ Error: waiting for Auto Scaling Group (tap-stack-asg) capacity satisfied: timeout while waiting for state to become 'ok' (last state: 'want at least 1 healthy instance(s) in Auto Scaling Group, have 0', timeout: 10m0s)
│ 
│   with aws_autoscaling_group.main,
│   on tap_stack.tf line 423, in resource "aws_autoscaling_group" "main":
│  423: resource "aws_autoscaling_group" "main" {
│ 
╵
╷
│ Error: creating S3 Bucket (tap-stack-secure-bucket-***) Lifecycle Configuration
│ 
│   with aws_s3_bucket_lifecycle_configuration.main,
│   on tap_stack.tf line 497, in resource "aws_s3_bucket_lifecycle_configuration" "main":
│  497: resource "aws_s3_bucket_lifecycle_configuration" "main" {
│ 
│ operation error S3: PutBucketLifecycleConfiguration, https response error
│ StatusCode: 400, RequestID: ENYHHYSR9051FPK1, HostID:
│ 2GoTcqGMJm00DYGDP9CZDICoUdE7VuVqp6a6iqAwXPfXj16xY1vAgiXETMTvjv1lJdcedQ023Hg=,
│ api error InvalidArgument: 'Days' in the 'Transition' action for
│ StorageClass 'DEEP_ARCHIVE' for filter '()' must be 90 days more than
│ 'filter '()'' in the 'Transition' action for StorageClass 'GLACIER'
╵
╷
│ Error: creating CloudTrail Trail (tap-stack-trail): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: d5004512-4b7b-4614-9cdf-af3277a41aaa, MaximumNumberOfTrailsExceededException: User: *** already has 5 trails in us-west-2.
│ 
│   with aws_cloudtrail.main,
│   on tap_stack.tf line 689, in resource "aws_cloudtrail" "main":
│  689: resource "aws_cloudtrail" "main" {
│ 
╵
╷
│ Error: creating GuardDuty Detector: operation error GuardDuty: CreateDetector, https response error StatusCode: 400, RequestID: 7d4720b8-1ffc-4147-92a8-3076c84b3d0e, BadRequestException: The request is rejected because a detector already exists for the current account.
│ 
│   with aws_guardduty_detector.main,
│   on tap_stack.tf line 716, in resource "aws_guardduty_detector" "main":
│  716: resource "aws_guardduty_detector" "main" {
│ 
╵
╷
│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role (tap-stack-config-role): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: f387c92b-2c1e-4112-8e1b-0912d10d681c, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.
│ 
│   with aws_iam_role_policy_attachment.config,
│   on tap_stack.tf line 783, in resource "aws_iam_role_policy_attachment" "config":
│  783: resource "aws_iam_role_policy_attachment" "config" {
│ 
╵
╷
│ Error: putting ConfigService Delivery Channel (tap-stack-delivery-channel): operation error Config Service: PutDeliveryChannel, https response error StatusCode: 400, RequestID: 9da2faf3-3b70-49de-a853-dda98efc4631, NoAvailableConfigurationRecorderException: Configuration recorder is not available to put delivery channel.
│ 
│   with aws_config_delivery_channel.main,
│   on tap_stack.tf line 872, in resource "aws_config_delivery_channel" "main":
│  872: resource "aws_config_delivery_channel" "main" {
│ 
╵

```
