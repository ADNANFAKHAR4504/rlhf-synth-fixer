# Setting up a secure AWS environment with Terraform

Need to create a VPC with both public and private subnets. The public subnets will handle internet-facing stuff, and the private subnet will be for our sensitive workloads that shouldn't have direct internet access.

For the network setup with VPC and EC2 networking components, we're looking at:
- 3 public subnets spread across different availability zones for redundancy
- 1 private subnet for internal resources
- Proper naming that makes sense for our organization
- Internet Gateway to provide internet access

## Security is key here

We absolutely need to lock down network access using EC2 Security Groups. This means:
- Only allowing specific IP ranges to connect in
- Controlling what can go out
- Following the principle of least privilege - only give access to what's actually needed
- Making sure we document why each rule exists

The security groups need to be attached to the subnets and configured with ingress rules from our trusted IP ranges. We also need egress rules to control outbound traffic from the private subnet.

## Tagging everything

All our AWS resources need to be tagged with Environment equals Production. This helps with cost tracking and makes it clear what's what in our AWS account.

## Following AWS best practices

We want to make sure we're following AWS recommendations for security, reliability, and operations. This includes proper network segmentation, good Terraform practices like using variables and modules, and making sure everything is well documented.

The VPC needs to be configured with proper CIDR blocks, and the subnets should be associated with route tables that control traffic flow. Internet Gateway needs to be attached to the VPC so the public subnets can reach the internet.

## What we need to deliver

The end result should be:
- A complete Terraform setup that actually works
- Security groups that do what we need them to do and are linked to the right subnets
- Everything properly tagged
- Good documentation explaining what we built and why
- A Terraform plan that runs without errors

## Success looks like

When we're done, we should have:
- A working Terraform deployment
- Network access controls that actually restrict traffic properly through security groups attached to resources
- All resources tagged correctly
- Infrastructure that follows AWS security guidelines
- Code that's maintainable and well-documented
