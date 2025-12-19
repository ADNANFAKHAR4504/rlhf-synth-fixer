I’m designing a production-grade AWS network infrastructure using CloudFormation YAML, and I need your help generating a complete, validated template for it.

The goal is to automate the provisioning of a secure, high-availability (HA) VPC environment that fully adheres to AWS best practices for cost optimization, scalability, and compliance. The CloudFormation file should be named prod-HA-vpc.yaml and must successfully deploy a production-ready stack when run through CloudFormation validation tools.

Here’s the scenario:
We’re building a multi-AZ production VPC setup that spans three availability zones, with three public subnets and three private subnets evenly distributed. The public subnets will host load-balanced application servers, while the private subnets will host a multi-AZ RDS MySQL database and other backend services that should never be publicly accessible.

Each public subnet should be tied to its own route table, connected to an Internet Gateway, while each private subnet should have its own managed NAT Gateway for outbound internet access. Public subnets should allow HTTP and HTTPS traffic from anywhere, but no security group should allow unrestricted inbound access—only specific ports should be opened as required.

The infrastructure should include:

A VPC with flow logs enabled, sending logs to an encrypted S3 bucket.

RDS MySQL configured for multi-AZ failover and automatic backups, with data encrypted at rest.

A bastion host in a public subnet to securely access private subnet resources over SSH.

A Load Balancer to handle public-facing traffic across application EC2 instances in the public subnets.

All EBS volumes and S3 buckets must enforce encryption at rest.

IAM roles should be used for any service needing AWS access—no hardcoded secrets or credentials anywhere in the template.

Every resource created should be clearly tagged with Environment: Production for easy identification and governance. The entire stack should represent a cost-efficient yet resilient production environment, enabling safe, controlled, and observable operations.

Please make sure that:

Private subnets have no direct internet connectivity.
RDS and database resources reside strictly in private subnets.
VPC flow logs are directed to an encrypted S3 bucket.
NAT Gateways are managed (not instance-based) and deployed in each AZ.
IAM roles replace any use of direct AWS keys.
The template passes CloudFormation validation and aligns with AWS architecture and security best practices.
This configuration supports our AWS Infrastructure Migration efforts and should serve as a reusable, version-controlled CloudFormation template for automating secure, high-availability production environments.
