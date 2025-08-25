Prompt: Request for CloudFormation Template

You are tasked with creating a production-grade AWS CloudFormation template in YAML format named web-app-deployment.yaml. This template must define infrastructure to deploy a high-availability web application in the us-west-2 region. The requirements are as follows:

Problem Statement & Constraints
The architecture must include an Application Load Balancer to distribute traffic across two EC2 instances.

All resources should use a Prod prefix in their names (e.g., ProdInstance1, ProdVPC, etc.).

The infrastructure must span two Availability Zones for redundancy and high availability.

The template must pass AWS CloudFormation YAML validation and deploy successfully without errors.

Environment Setup Requirements
VPC

Use default VPC settings (CIDR block, DNS support, etc.).

Create two public subnets in two different AZs in us-west-2.

EC2 Instances

Deploy two Amazon Linux EC2 instances:

ProdInstance1 in one AZ.

ProdInstance2 in another AZ.

These should be in public subnets and belong to an Auto Scaling Group (optional, if using for HA).

Application Load Balancer

Internet-facing ALB with a listener on port 80 (HTTP).

Target group should forward traffic to both EC2 instances.

Health check on port 80 and path /.

Security Groups

ALB Security Group: Allow inbound HTTP (port 80) from the internet.

EC2 Security Group: Allow inbound HTTP from the ALB only (reference the ALBs security group).

Expected Output
A single YAML file named web-app-deployment.yaml.

The file should:

Contain all resources (VPC, subnets, EC2, ALB, SGs).

Be written using CloudFormation YAML syntax.

Use parameterized or clean hardcoded values suitable for a demonstration or test.

Be deployable as-is in the us-west-2 region via AWS Console or CLI.