You are an AWS CloudFormation expert.
Generate a production-grade CloudFormation YAML template named web-application-infra.yaml that builds a secure, scalable, multi-AZ web application infrastructure on AWS.

The template must be fully automated, cross-account, and cross-region executable — with no manual pre-dependencies (like pre-created key pairs or hardcoded values).

Functional Requirements
1. Networking

Create a VPC spanning two Availability Zones.

Define two public and two private subnets (one per AZ).

Attach an Internet Gateway to the VPC.

Create a NAT Gateway (with an Elastic IP) for private subnet internet access.

Set up public and private route tables with appropriate routes.

2. Compute Layer (EC2 + Auto Scaling + ALB)

Dynamically create a Key Pair resource (AWS::EC2::KeyPair) to enable SSH access.

Name format: <Environment>-KeyPair (using !Sub for dynamic naming).

Export the private key material as a secure output (via AWS::SecretsManager::Secret).

Dynamically fetch the latest Amazon Linux 2 AMI using SSM Parameter Store, for example:

/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2


Use !Ref and !Sub to make this dynamic per-region.

Create a Launch Template that:

Uses the dynamic AMI ID.

Uses the generated key pair.

Includes UserData to install and start a simple web server (Apache or Nginx).

Attaches an IAM Role for EC2 with least privilege (access to S3 for logs and CloudWatch).

Create an Auto Scaling Group (ASG):

Minimum: 2, Maximum: 5 instances.

Launches in both private subnets.

Targets CPU utilization average (e.g., 60%) for scaling.

Create an Application Load Balancer (ALB):

Deployed in both public subnets.

Listener: HTTP (80).

Target Group: Forward to private EC2 instances.

Define Security Groups:

ALB SG: Allow inbound HTTP (80) from the internet.

EC2 SG: Allow HTTP (80) only from ALB SG and SSH (22) from an Admin CIDR (parameterized).

3. Database Layer

Deploy an RDS instance (MySQL or PostgreSQL) in private subnets.

Enable:

Multi-AZ

Storage encryption at rest

Allow inbound traffic only from the EC2 security group.

Create a DBSubnetGroup for RDS placement.

Accept DB credentials as Parameters (no hardcoding).

4. Monitoring, Logging, and Auditing

Create an S3 bucket for storing:

ALB access logs

EC2 app logs

CloudTrail audit logs

Enable CloudWatch detailed monitoring for EC2 and ALB.

Create and configure CloudTrail to log all management events to the S3 bucket.

5. IAM & Security

Create an EC2 IAM Role and Instance Profile with:

Permissions for CloudWatch logs, S3 (log delivery), and basic system metrics.

Apply the principle of least privilege.

All resource names should be dynamically constructed using:

<Environment>-<Service>-<ResourceType>


via !Sub.

6. Parameterization

All configurable values must be Parameters, including:

Environment Name (e.g., Dev, Staging, Prod)

VPC CIDR

Subnet CIDRs

Admin SSH CIDR

EC2 Instance Type

DB Engine, Name, Username, Password

Desired/Min/Max capacity for ASG

7. Outputs

Clearly define outputs for:

ALB DNS Name

VPC ID

Key Pair Name

RDS Endpoint

Log S3 Bucket Name
Best Practices & Compliance

No hardcoded values (region names, ARNs, account IDs).

Cross-account deployable (works in any AWS account).

Use intrinsic functions (!Ref, !Sub, !GetAtt, !FindInMap) for dynamic references.

Enforce idempotency — re-deploying should not break or recreate unchanged resources.

Ensure template passes aws cloudformation validate-template check.

YAML format, properly indented and production-ready.

Align with AWS Well-Architected Framework (security, scalability, resilience, cost, operations).

Expected Output:
A single CloudFormation YAML template (web-application-infra.yaml) that can be deployed in any AWS account and region without modification.
It should:

Create its own key pair

Fetch AMI dynamically from SSM

Deploy the full web application stack (VPC, ALB, ASG, RDS, NAT, CloudTrail, CloudWatch, IAM, S3 logging)

Use parameters for every environment-specific configuration

Contain no hardcoded values.