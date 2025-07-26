# PROMPT

```yaml
You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code (IaC) using AWS CDK (Python). Your task is to design and define a basic AWS environment, adhering to best practices for networking, security, and resource allocation.

The entire infrastructure must be deployed in the us-east-1 AWS region.

Your AWS CDK Python project must comply with the following detailed requirements:

VPC Network Configuration:

Set up a new AWS Virtual Private Cloud (VPC) with the CIDR block 10.0.0.0/16.

Ensure the VPC has at least two public subnets, each deployed in a different Availability Zone within the us-east-1 region.

Internet Connectivity:

Configure an Internet Gateway and attach it to the newly created VPC to enable internet access.

EC2 Instance Deployment:

Instantiate at least one EC2 instance within one of the public subnets.

The EC2 instance must be configured with a public IP address.

The EC2 instance should use an appropriate Amazon Linux 2 or Amazon Linux 2023 AMI.

Security Group Configuration:

Set up a Security Group specifically for the EC2 instance(s).

This security group must permit inbound SSH access on port 22 from any IP address (0.0.0.0/0).

Resource Tagging:

Tag all AWS resources created by this CDK stack with a tag having the key Project and the value CdkSetup. (Note: This tag value is kept as requested, even though the tool is CDK).

Naming Convention:

Ensure all resources adhere to a consistent naming convention with a cdk- prefix (adapting from the requested tf- prefix to align with CDK best practices).
```
