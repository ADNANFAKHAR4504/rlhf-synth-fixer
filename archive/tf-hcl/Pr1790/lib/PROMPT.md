# Setting up a secure AWS environment with Terraform

## What we're building

We need to create a VPC with both public and private subnets. The public subnets will handle internet-facing stuff, and the private subnet will be for our sensitive workloads that shouldn't have direct internet access.

For the network setup, we're looking at:
- 3 public subnets spread across different availability zones (for redundancy)
- 1 private subnet for internal resources
- Proper naming that makes sense for our organization

## Security is key here

We absolutely need to lock down network access using Security Groups. This means:
- Only allowing specific IP ranges to connect in
- Controlling what can go out
- Following the principle of least privilege - only give access to what's actually needed
- Making sure we document why each rule exists

## Tagging everything

All our AWS resources need to be tagged with "Environment = Production". This helps with cost tracking and makes it clear what's what in our AWS account.

## Following AWS best practices

We want to make sure we're following AWS recommendations for security, reliability, and operations. This includes proper network segmentation, good Terraform practices (like using variables and modules), and making sure everything is well documented.

## What we need to deliver

The end result should be:
- A complete Terraform setup that actually works
- Security groups that do what we need them to do
- Everything properly tagged
- Good documentation explaining what we built and why
- A Terraform plan that runs without errors

## Success looks like

When we're done, we should have:
- A working Terraform deployment
- Network access controls that actually restrict traffic properly
- All resources tagged correctly
- Infrastructure that follows AWS security guidelines
- Code that's maintainable and well-documented
