You are tasked with generating a single, fully functional AWS CloudFormation template in YAML format that provisions a production-grade infrastructure for a web application, incorporating high availability, security, and compliance requirements.

Environment Context:
The existing environment is basic and must be upgraded to production-ready standards while preserving application functionality. The new infrastructure must run in the us-west-2 AWS region and follow corporate compliance rules.

Requirements:

Tagging: Every AWS resource must include the tag:

yaml
Copy
Edit
Tags:
- Key: env
Value: production
RDS: Deploy an Amazon RDS instance in Multi-AZ mode with encryption at rest enabled.

IAM Role: Create an IAM role granting S3 read-only access, attach it to all EC2 instances.

S3 Buckets:

Enable versioning for data protection.

Restrict public access (only accessible through CloudFront).

CloudFront: Deploy a CloudFront distribution serving content from the S3 bucket.

Application Load Balancer:

Deploy in two availability zones.

Configure two listeners:

HTTP (port 80)

HTTPS (port 443)

VPC:

Create a VPC with public and private subnets across two AZs.

Configure routing for internet access in public subnets and NAT gateway for private subnets.

CloudWatch: Create CloudWatch alarms to monitor EC2 instances CPU utilization and send alerts when usage exceeds a threshold.

Security Groups: Restrict inbound traffic to HTTP (80), HTTPS (443), and SSH (22) only.

Region: Ensure all resources are provisioned in us-west-2.

Constraints:

All resources must be tagged with 'env: production'.

The CloudFormation template must pass cfn-lint validation and be directly deployable via AWS CLI or Console without manual edits.

Use YAML syntax only.

Expected Output:
A single YAML CloudFormation template implementing the above infrastructure. Ensure modular readability with !Ref, !Sub, and parameterization where appropriate (e.g., instance types, CIDR ranges, DB username/password, certificate ARN for HTTPS).

If you want, I can now turn this refined prompt into the IDEAL_RESPONSE.md format you asked about earlier so its directly usable in your repo. That way it fits your existing IaC compliance automation workflow.