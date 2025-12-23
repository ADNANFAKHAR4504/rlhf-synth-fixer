You are a Cloud Security Architect responsible for designing a foundational, secure network infrastructure on AWS. Your task is to create a reusable AWS CloudFormation template that provisions a Virtual Private Cloud adhering to security standards and the principle of least privilege.

Core Task:

Develop a single AWS CloudFormation template in YAML format. This template must create a complete, secure, and multi-Availability Zone VPC environment strictly within the us-east-1 region.

Infrastructure and Security Requirements:

VPC and Subnet Architecture for High Availability:

Provision a VPC with a configurable IPv4 CIDR block. Use a Parameter with a default of 10.0.0.0/16.

Create two public subnets and two private subnets. Deploy one public and one private subnet in each Availability Zone within us-east-1 to ensure redundancy.

Network Traffic Routing:

Provision and attach an Internet Gateway to the VPC.

Provision a NAT Gateway in one of the public subnets to provide outbound internet access for resources in the private subnets. You must also provision an Elastic IP to associate with the NAT Gateway.

Create two distinct Route Tables:

A Public Route Table associated with both public subnets, containing a default route to the Internet Gateway.

A Private Route Table associated with both private subnets, containing a default route to the NAT Gateway.

Security Posture with Least Privilege:

Security Groups:

Implement a PublicSecurityGroup that only permits inbound HTTPS traffic on TCP port 443 from anywhere. All other inbound traffic must be denied by default.

Implement a PrivateSecurityGroup that blocks all direct inbound traffic from the internet. Configure it to accept inbound traffic from the PublicSecurityGroup on a specific application port such as TCP port 80.

IAM Role and Policy:

Define an AWS::IAM::Role named EC2LeastPrivilegeRole that can be assumed by the EC2 service at ec2.amazonaws.com.

Create an associated AWS::IAM::Policy that adheres to the principle of least privilege. For this exercise, grant only the permissions required for AWS Systems Manager to manage the instance: ssm:UpdateInstanceInformation, ssmmessages:CreateControlChannel, ssmmessages:CreateDataChannel, ssmmessages:OpenControlChannel, ssmmessages:OpenDataChannel.

Create an AWS::IAM::InstanceProfile to attach the role to EC2 instances.

Data Encryption Mandate:

While this template does not provision data storage resources directly, it is a foundational requirement that all data at rest within this VPC must be encrypted. Ensure that all components are configured in a way that supports this. For example, any future EBS volumes attached to instances in these subnets should have their Encrypted property set to true, using AWS managed keys with KMS.

Template and Deployment Standards:

Single Stack: All resources defined above must be contained within this single CloudFormation stack.

Outputs: The template's Outputs section must export the logical IDs of the following critical resources for use by other stacks or for reference:

VPCId

PublicSubnetIds as a comma-delimited string

PrivateSubnetIds as a comma-delimited string

PublicSecurityGroupId

InstanceProfileArn

Expected Output:

A single, valid, and well-commented secure-vpc-infrastructure.yaml file. The template must pass all CloudFormation validation checks and be ready to launch a secure and compliant VPC stack without errors.
