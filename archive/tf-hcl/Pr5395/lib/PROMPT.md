Hey team,

We need to get a secure and scalable AWS network infrastructure up and running in us-west-1 using Terraform. This needs to be production-ready, so make sure everything is easily configurable through variables and properly tagged so we can track resources.

Here's what we need to build:

VPC

Set up a VPC with the 10.0.0.0/16 CIDR block. Make sure to add descriptive tags like Name and Environment so we can identify it easily.

Public Subnets

Create two public subnets with these CIDR blocks:
- 10.0.1.0/24
- 10.0.2.0/24

Spread them across different Availability Zones in us-west-1 for high availability. Both should be associated with the main route table.

Internet Gateway

Attach an Internet Gateway to the VPC and tag it properly.

Route Table and Routes

Set up a Route Table specifically for the public subnets. Add a route that sends all internet-bound traffic (0.0.0.0/0) through the IGW. Make sure both public subnets are associated with this route table.

IAM Role

We need an IAM Role for EC2 instances with these permissions:
- S3 Read-Only Access
- EC2 Full Control

Use the AWS-managed policies for these, and don't forget to tag the role.

Security Group

Create a Security Group in the VPC that allows:
- Inbound HTTP traffic on port 80
- Inbound SSH traffic on port 22
- All outbound traffic

Tag it with meaningful identifiers.

Variables

Define input variables for the CIDR blocks and instance types. The instance type variable can be a placeholder for now, but having it makes the config more flexible down the road.

Outputs

We'll need outputs for the VPC ID, Subnet IDs, Internet Gateway ID, Route Table ID, and Security Group ID. This makes it easier to reference these resources later.

Important Constraints

Everything needs to be in the us-west-1 region. Follow Terraform best practices with proper resource references like depends_on and id usage. Every resource should have tags for identification - at minimum Name, Project, and Environment. For the IAM Role, stick to least privilege by only using those two AWS-managed policies mentioned above.

What We're Looking For

A single Terraform file called main.tf that implements all of this. It should use proper Terraform structures like variables, outputs, and the provider block. Make sure it's syntactically valid so we can actually deploy it. Use consistent naming conventions across all resources and add comments explaining key security decisions.

The deliverable should be one complete Terraform HCL file with everything implemented. Include inline comments about security best practices throughout the code.