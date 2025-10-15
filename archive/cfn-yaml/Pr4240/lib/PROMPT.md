Develop a complete AWS CloudFormation template in YAML named TapStack.yml that builds a brand-new, production-ready network infrastructure from scratch in the us-west-2 region.

The template should include all parameter declarations, resource logic, and outputs — nothing should depend on existing infrastructure. Follow AWS best practices for naming, security, and modular structuring.

Architecture requirements:

Create a VPC (10.0.0.0/16) with DNS hostnames and DNS support enabled.

Create two public and two private subnets, each in a different AZ within us-west-2. Every subnet must have a unique CIDR block (for example, 10.0.1.0/24, 10.0.2.0/24, etc.).

Deploy and attach an Internet Gateway to the VPC.

Create a NAT Gateway in one of the public subnets, along with an Elastic IP for it.

Configure route tables so:

Public subnets route 0.0.0.0/0 traffic to the Internet Gateway.

Private subnets route 0.0.0.0/0 traffic to the NAT Gateway.

Private subnets have no direct Internet Gateway route.

Launch two EC2 instances (t2.micro), one in each private subnet.

Use an Amazon Linux 2 AMI parameter (default to latest SSM lookup).

Security group allows SSH (port 22) only from 203.0.113.0/24.

Include IAM Role and Instance Profile that allow read/write access to a specific S3 bucket.

Implement an Auto Scaling Group (ASG) using a Launch Configuration based on the same AMI, instance type t2.micro, and private subnets.

ASG should have min size 2, max size 4, desired capacity 2.

Create CloudWatch Alarms for CPU utilization to trigger scale-out (≥70%) and scale-in (≤30%) actions.

Define an S3 bucket (for example, tapstack-app-bucket) used by EC2 instances, with:

Default encryption (SSE-S3 or KMS).

Block public access enabled.

Include Outputs for VPC ID, Subnets, NAT Gateway, and ASG Name.

Constraints and quality expectations:

Everything must be defined inside TapStack.yml — all parameters, mappings, resources, and outputs.

The template must pass AWS CloudFormation validation (aws cloudformation validate-template) without modification.

Follow secure defaults, using least privilege and encryption where possible.

Do not include any SSL certificate, ALB, or HTTPS-related configuration.

Organize sections clearly: Parameters, Mappings, Resources, Outputs.

Use descriptive logical names (e.g., PublicSubnetA, PrivateSubnetB, NatGatewayEIP).

Write the full YAML content of TapStack.yml, formatted cleanly with proper indentation and ready to deploy.