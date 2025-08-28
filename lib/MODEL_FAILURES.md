Model Failures are as -

1. Model was trying to use key pair which doesn't even exists and if didn't create one key pair as well.
2. Moreoover it was not a requiremtn to create a key pair but its good to have if there is any requirement.

```
│ Error: creating Auto Scaling Group (tap-webapp-asg): operation error Auto Scaling: CreateAutoScalingGroup, https response error StatusCode: 400, RequestID: 35a2d6b3-bb49-4f8e-a3ea-09dc9ff6ae26, api error ValidationError: You must use a valid fully-formed launch template. The key pair 'tap-webapp-key' does not exist
│ 
│   with aws_autoscaling_group.main,
│   on tap_stack.tf line 470, in resource "aws_autoscaling_group" "main":
│  470: resource "aws_autoscaling_group" "main" {
│ 
╵
╷
│ Error: creating EC2 Instance: operation error EC2: RunInstances, https response error StatusCode: 400, RequestID: d9b971dc-168f-4af1-9efc-c0168750ec3d, api error InvalidKeyPair.NotFound: The key pair 'tap-webapp-key' does not exist
│ 
│   with aws_instance.standalone,
│   on tap_stack.tf line 573, in resource "aws_instance" "standalone":
│  573: resource "aws_instance" "standalone" {
│ 
╵
Error: Terraform exited with code 1.
data.aws_ami.amazon_linux: Reading...
```
