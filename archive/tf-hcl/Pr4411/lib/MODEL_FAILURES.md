1. Generated response by the model had failures related to the security group naming conventions, it used the sg with naming starrting from sg- which is not allowed as per AWS rules.

```

╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.web,
│   on tap_stack.tf line 364, in resource "aws_security_group" "web":
│  364:   name        = local.sg_web_name
│ 
╵
╷
│ Error: invalid value for name (cannot begin with sg-)
│ 
│   with aws_security_group.ec2,
│   on tap_stack.tf line 426, in resource "aws_security_group" "ec2":
│  426:   name        = local.sg_ec2_name
│ 
╵
Error: Terraform exited with code 1.
All deployment attempts failed. Check for state lock issues.

```

2. Model used wrong IAM role arn for aws config setup which is again not allowed as per AWS rules and failed the deployment. Model worngly used this ARN with config which is not allowed.

```

│ Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role (aws-config-role-tap-stack-bmup): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 6d42d8df-24fb-4894-983c-06c44b25b104, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.
│ 

│   with aws_iam_role_policy_attachment.config,

│   on tap_stack.tf line 1014, in resource "aws_iam_role_policy_attachment" "config":

│ 1014: resource "aws_iam_role_policy_attachment" "config" {
```

3. Model used wrong resource completely creation completely which doesn't even exists. The shield protection happens for the overall account and not just for EC2.

```
│ Error: creating Shield Protection (shield-ec2-1-tap-stack-bmup): operation error Shield: CreateProtection, https response error StatusCode: 400, RequestID: 40a98bdb-2ca9-45ec-ab52-72a47400e087, InvalidResourceException: Unrecognized resource 'instance' of service 'ec2'.
│ 

│   with aws_shield_protection.ec2[1],

│   on tap_stack.tf line 1078, in resource "aws_shield_protection" "ec2":

│ 1078: resource "aws_shield_protection" "ec2" {

│

```
