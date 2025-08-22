I got this error in the above prompt
---


│ Error: waiting for ACM Certificate (arn:aws:acm:us-west-2:***:certificate/5ed32028-b8c0-41dd-8eee-44211ca2a066) to be issued: timeout while waiting for state to become 'true' (last state: 'false', timeout: 5m0s)
│ 
│   with aws_acm_certificate.main,
│   on tap_stack.tf line 491, in resource "aws_acm_certificate" "main":
│  491: resource "aws_acm_certificate" "main" {
│ 
╵
╷
│ Error: creating Auto Scaling Group (Prod-SecureApp-asg): operation error Auto Scaling: CreateAutoScalingGroup, https response error StatusCode: 400, RequestID: 7255ab79-d6f2-4a6e-b719-e78778cff0af, api error InvalidQueryParameter: Invalid launch template: When a network interface is provided, the security groups must be a part of it.
│ 
│   with aws_autoscaling_group.main,
│   on tap_stack.tf line 679, in resource "aws_autoscaling_group" "main":
│  679: resource "aws_autoscaling_group" "main" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.


Please fix the errors