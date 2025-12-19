This is the deployment error i got


│ Error: creating CloudTrail Trail (main-cloudtrail): operation error CloudTrail: CreateTrail, https response error StatusCode: 400, RequestID: 0ac014a0-e136-4770-8580-2bd3acff5b30, InsufficientEncryptionPolicyException: Insufficient permissions to access S3 bucket cloudtrail-logs-223f197917c19c9a or KMS key arn:aws:kms:us-east-1:***:key/7ad7c5af-5932-49ab-961c-66f77c8805d1.
│ 
│   with aws_cloudtrail.main,
│   on secure_infrastructure_setup.tf line 317, in resource "aws_cloudtrail" "main":
│  317: resource "aws_cloudtrail" "main" {
│ 
╵
╷
│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role (aws-config-role): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 4b008a93-9e9c-43bd-8e27-6d5141db00c5, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.
│ 
│   with aws_iam_role_policy_attachment.config,
│   on secure_infrastructure_setup.tf line 452, in resource "aws_iam_role_policy_attachment" "config":
│  452: resource "aws_iam_role_policy_attachment" "config" {
│ 
╵
╷
│ Error: putting ConfigService Configuration Recorder (main-recorder): operation error Config Service: PutConfigurationRecorder, https response error StatusCode: 400, RequestID: 5c1dbc01-4719-4b38-87c2-6b7d54b47a23, MaxNumberOfConfigurationRecordersExceededException: Failed to put configuration recorder  because you have reached the limit for the maximum number of customer managed configuration records: (1)
│ 
│   with aws_config_configuration_recorder.main,
│   on secure_infrastructure_setup.tf line 457, in resource "aws_config_configuration_recorder" "main":
│  457: resource "aws_config_configuration_recorder" "main" {
│ 
╵
╷
│ Error: putting ConfigService Delivery Channel (main-delivery-channel): operation error Config Service: PutDeliveryChannel, https response error StatusCode: 400, RequestID: 6e6d79c4-759c-4191-9d3d-57cc141c0f88, MaxNumberOfDeliveryChannelsExceededException: Failed to put delivery channel 'main-delivery-channel' because the maximum number of delivery channels: 1 is reached.
│ 
│   with aws_config_delivery_channel.main,
│   on secure_infrastructure_setup.tf line 467, in resource "aws_config_delivery_channel" "main":
│  467: resource "aws_config_delivery_channel" "main" {
│ 
╵
Error: Terraform exited with code 1.

Fix the error