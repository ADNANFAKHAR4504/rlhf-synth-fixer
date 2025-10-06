1. Generated response by model had iam policy related issues for the dynamo db.
```
│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/DynamoDBAutoscaleRole) to IAM Role (tap-dynamodb-autoscaling-role): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 6741927b-c3f2-4daa-be3e-1bff1c6870cd, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/DynamoDBAutoscaleRole does not exist or is not attachable.
│ 
│   with aws_iam_role_policy_attachment.dynamodb_autoscaling,
│   on tap_stack.tf line 688, in resource "aws_iam_role_policy_attachment" "dynamodb_autoscaling":
│  688: resource "aws_iam_role_policy_attachment" "dynamodb_autoscaling" {
│ 
╵
Error: Terraform exited with code 1.

```
