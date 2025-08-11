Prompt:

You are to create a complete AWS infrastructure-as-code project using CDK for Terraform (cdktf) in TypeScript.
The folder structure must be:

bin/tap.ts in the project root (entry point)

lib/ folder under root containing tapstack.ts (the main stack definition)

test/ folder under root for tests

Requirements:

Use AWS as the cloud provider and deploy to two regions: us-east-1 and us-west-2.

Define a VPC in each region with CIDR block 10.0.0.0/16.

Create two public subnets and two private subnets per region, each associated with the correct route table.

Attach an Internet Gateway to each VPC and configure NAT Gateways in private subnets using Elastic IPs.

Launch EC2 application servers in public subnets with security groups allowing only HTTP (80) and SSH (22).

Deploy an RDS database in private subnets with a restricted security group that only allows access from the application server security group.

Create an Elastic Load Balancer to distribute traffic to application servers.

Use IAM roles withat at least privilege for EC2, RDS, and other resources.

Store database credentials securely in AWS Secrets Manager and retrieve them for the RDS instance.

Enable the CloudWatch monitoring for EC2 and RDS.

Prefix all resource names with "prod-" to indicate a production environment.

Follow best practices for redundancy,security, and scaling.

The output must be a TypeScript CDKTF project with the above requirements fully implemented, compiling and deploying without manual intervention. Use modern CDKTF patterns and resource constructs.