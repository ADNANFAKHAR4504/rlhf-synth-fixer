# Resource Already Exists Error - Need to Fix Naming Conflicts

I'm getting a deployment error because Terraform is trying to create IAM resources that already exist from previous deployments. The error is blocking the entire infrastructure deployment.

## Current Error

```
Error: creating IAM Role (Production-ec2-role): operation error IAM: CreateRole, https response error StatusCode: 409, RequestID: 09f327b2-48a9-4484-9c6d-9d1cc9c79604, EntityAlreadyExists: Role with name Production-ec2-role already exists.

with aws_iam_role.ec2_role,
on tap_stack.tf line 303, in resource "aws_iam_role" "ec2_role":
303: resource "aws_iam_role" "ec2_role" {
```

The problem is that when I run `terraform apply`, it tries to create a new IAM role with the same name as one that already exists in AWS.

## Root Cause

Looking at the current configuration, I can see multiple resources that will have this same naming conflict problem:

1. **IAM Role**: `Production-ec2-role` 
2. **IAM Policy**: `Production-s3-access`
3. **IAM Instance Profile**: `Production-ec2-profile`
4. **Load Balancer**: `Production-alb`
5. **Target Group**: `Production-web-tg`
6. **Auto Scaling Group**: `Production-web-asg`
7. **Auto Scaling Policies**: `Production-scale-up`, `Production-scale-down`
8. **CloudWatch Alarms**: `Production-high-cpu`, `Production-low-cpu`
9. **CloudWatch Log Group**: `/aws/ec2/Production-web-app`

All these resources use static names based on the environment variable, so every time I deploy it tries to create resources with identical names.

## What I Need

Can you fix this by making all resource names unique for each deployment? I think the best approach would be to add some kind of random suffix or timestamp to make sure resource names don't conflict with existing ones.

The ideal solution should:
1. **Add uniqueness to resource names** - prevent conflicts with existing resources
2. **Keep names readable** - still be able to identify what each resource is for
3. **Work for multiple deployments** - allow deploying the same configuration multiple times without conflicts
4. **Handle all affected resources** - not just the IAM role that's currently failing

I've seen other Terraform configurations use random suffixes or timestamps for this. Whatever approach you use, please make sure it covers all the resources that have static names, not just the IAM role.

Right now I can't deploy at all because of this naming conflict, so I need a working solution that allows the infrastructure to be created successfully.