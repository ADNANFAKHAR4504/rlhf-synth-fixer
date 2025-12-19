1. Model had failures related to the iam role creations and using same iam role.

2. Model generated response while creating ACM certificate.

```
│ Error: creating IAM Role (tap-ec2-role): operation error IAM: CreateRole, https response error StatusCode: 409, RequestID: 8b4da930-4969-4dcb-a7aa-411603421b12, EntityAlreadyExists: Role with name tap-ec2-role already exists.
│ 
│   with aws_iam_role.ec2_role,
│   on tap_stack.tf line 341, in resource "aws_iam_role" "ec2_role":
│  341: resource "aws_iam_role" "ec2_role" {
│ 
╵
╷
│ Error: waiting for ACM Certificate (arn:aws:acm:us-east-2:***:certificate/955d6de3-025a-4352-a046-da045feb79b9) to be issued: timeout while waiting for state to become 'true' (last state: 'false', timeout: 5m0s)
│ 
│   with aws_acm_certificate.main,
│   on tap_stack.tf line 466, in resource "aws_acm_certificate" "main":
│  466: resource "aws_acm_certificate" "main" {
│ 
╵

```
