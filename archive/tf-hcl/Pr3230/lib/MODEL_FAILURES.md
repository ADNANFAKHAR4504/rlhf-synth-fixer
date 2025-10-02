1. Generated response by model  had key pair related issues for bastion server.

2. Model response had failures related to KMS key.


```

╷
│ Error: creating EC2 EIP: operation error EC2: AllocateAddress, https response error StatusCode: 400, RequestID: b292788c-137a-4d54-9a44-98ddd1f6b799, api error AddressLimitExceeded: The maximum number of addresses has been reached.
│ 
│   with aws_eip.nat[1],
│   on tap_stack.tf line 166, in resource "aws_eip" "nat":
│  166: resource "aws_eip" "nat" {
│ 
╵
╷
│ Error: creating EC2 EIP: operation error EC2: AllocateAddress, https response error StatusCode: 400, RequestID: b6622d17-c9b4-4f56-9e41-6a6b364a566a, api error AddressLimitExceeded: The maximum number of addresses has been reached.
│ 
│   with aws_eip.nat[0],
│   on tap_stack.tf line 166, in resource "aws_eip" "nat":
│  166: resource "aws_eip" "nat" {
│ 
╵
╷
│ Error: creating CloudWatch Logs Log Group (/aws/ec2/tap-app): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 535de3b0-102b-470a-92d6-4aeeaeb9f741, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-west-2:***:log-group:/aws/ec2/tap-app'
│ 
│   with aws_cloudwatch_log_group.app,
│   on tap_stack.tf line 483, in resource "aws_cloudwatch_log_group" "app":
│  483: resource "aws_cloudwatch_log_group" "app" {
│ 
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.

```
