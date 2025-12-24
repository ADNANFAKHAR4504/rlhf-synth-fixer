# Prompt

Need to set up a basic dev network environment in us-west-2 using CloudFormation. This is for initial infrastructure setup where web servers in public subnets can receive traffic from the internet through the IGW, with proper route tables connecting everything.

**What to Build:**

VPC with CIDR 10.0.0.0/16 that has two public subnets - 10.0.1.0/24 and 10.0.2.0/24. Attach an internet gateway and configure route tables so traffic from the subnets routes through the IGW to reach the internet.

For security, create a security group that allows SSH access but only from my office IP range 203.0.113.0/24 - not from everywhere since that's too risky.

**Network Flow:**

The subnets need to connect to the internet gateway via route tables with a default route pointing to the IGW. This lets instances in the public subnets reach the internet and receive incoming traffic through the security group rules.

**Technical Details:**

- Use YAML format for CloudFormation
- Reference resources using Ref and GetAtt functions
- Make sure the template can deploy without errors
- Add outputs for VPC ID, subnet IDs, IGW ID, and security group ID

**Deliverable:**

A working CloudFormation YAML template that creates the VPC network foundation, connects the public subnets to the internet through the IGW routing, and sets up the security group. Include a brief explanation of how it works.