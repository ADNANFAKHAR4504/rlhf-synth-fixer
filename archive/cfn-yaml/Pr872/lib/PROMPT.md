You are tasked with generating a complete and production-ready AWS CloudFormation template in YAML format to migrate an existing on-premises application to the AWS Cloud (us-east-1) region. The template must comply strictly with the infrastructure and security requirements outlined below. All resources must be correctly referenced and parameterized where appropriate. Ensure that the output is valid and can be deployed directly using AWS CloudFormation without modification.

Requirements: Networking -

Create a new VPC with the CIDR block 10.0.0.0/16. 2.Deploy at least two Availability Zones.
In each AZ, create:

One public subnet
One private subnet
Set up an Internet Gateway and attach it to the VPC.

Create appropriate route tables and route table associations for:
Public subnets (with route to Internet Gateway)

Private subnets (with route to NAT Gateway)

NAT Gateway -

Deploy a NAT Gateway in one of the public subnets.

Create an Elastic IP and associate it with the NAT Gateway.

Security Groups

Create a Security Group for the EC2 instance that:

Allows inbound HTTP (port 80) and HTTPS (port 443) traffic from the internet.

Allows outbound traffic to all destinations.

EC2 Instance

Launch a single EC2 instance in a private subnet.

Use the latest Amazon Linux 2 AMI (for us-east-1).

Associate the previously created security group.

Attach an IAM role granting full S3 access.

Include basic UserData to install a simple web server (optional but preferred).

RDS Instance

Launch a MySQL-compatible RDS instance in one of the private subnets.

Enable automated backups.

Ensure the RDS is not publicly accessible.

Associate with appropriate DB Subnet Group.

IAM Role

Create and attach an IAM Role to the EC2 instance.

The IAM Role must allow full access to S3 services.

S3 Bucket

Create an S3 bucket dedicated to application log storage.

Ensure block all public access is enabled.

Additional Constraints: The template must be YAML, not JSON.

Must pass CloudFormation validation.

Follow AWS best practices for naming, tagging, and separation of resources.

Parameterize values where applicable (e.g., key pair name, instance type, DB credentials).

Avoid hardcoding AZ names; use AWS pseudo parameters or Fn::GetAZs.

Make sure all dependencies are defined properly (DependsOn, if needed).

Expected Output: A single CloudFormation YAML template that fully defines the infrastructure above and is deployable as-is.
