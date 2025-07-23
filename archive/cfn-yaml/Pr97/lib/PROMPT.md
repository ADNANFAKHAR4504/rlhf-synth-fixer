You are an expert AWS Cloud Engineer specializing in Infrastructure as Code (IaC). Your task is to write a single, comprehensive AWS CloudFormation template in YAML format to deploy a scalable, secure, and highly available production environment.

The final deliverable must be a valid CloudFormation file named production_environment.yaml that can be deployed without errors.

Template Requirements
1. Parameters
The template must include parameters for user-specific inputs to avoid hardcoding sensitive information:

YourIpForSsh: The CIDR block of your IP address to allow SSH access to the EC2 instances.

DbUsername: The master username for the RDS database.

DbPassword: The master password for the RDS database, using the NoEcho property.

InstanceType: The EC2 instance type (e.g., t2.micro).

2. Networking Infrastructure
VPC: Create a VPC with an appropriate CIDR block.

Availability Zones: The VPC resources must be distributed across two Availability Zones.

Subnets: In each of the two AZs, create:

One public subnet.

One private subnet.

Gateways & Routing:

Create and attach an Internet Gateway to the VPC.

Create a NAT Gateway in each public subnet.

Configure route tables to provide public subnets with a route to the Internet Gateway and private subnets with a route to their respective NAT Gateway.

3. Compute and Scalability
Application Load Balancer (ALB): Deploy an internet-facing ALB in the public subnets.

Launch Template: Define a Launch Template for the EC2 instances.

Auto Scaling Group (ASG):

Create an ASG that uses the Launch Template to deploy EC2 instances across the public subnets.

Configure the ASG with a minimum size of 1, a desired capacity of 2, and a maximum size of 3 instances.

Set up a scaling policy based on CPU utilization.

4. Database Layer
RDS Instance:

Deploy an RDS for PostgreSQL database instance.

Enable the Multi-AZ deployment option for high availability.

Place the RDS instance within a private subnet.

Create an RDS Subnet Group that includes the private subnets.

5. Security and Tagging
Security Groups:

EC2 Security Group: Allow inbound SSH (port 22) only from the YourIpForSsh parameter and inbound HTTP (port 80) from the ALB.

ALB Security Group: Allow inbound HTTP (port 80) from anywhere (0.0.0.0/0).

RDS Security Group: Allow inbound PostgreSQL traffic (port 5432) only from the EC2 instance security group.

Tagging: Ensure that all created resources are tagged with Environment: Production.

6. Outputs
Provide stack outputs for key resources, including:

The DNS name of the Application Load Balancer.

The endpoint address of the RDS database instance.