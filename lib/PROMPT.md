# Secure AWS Infrastructure with CloudFormation

Need to build a CloudFormation template that sets up a secure, monitored production environment. This is for a compliance-heavy application where we need full audit trails and security controls working together.

## The scenario

We're deploying a web application that handles sensitive data. Here's how the pieces connect:

**Application flow:**
A load balancer receives HTTPS traffic and forwards it to EC2 instances running in a VPC. The instances are protected by security groups that only allow traffic from the load balancer. The application writes data to DynamoDB tables that have point-in-time recovery enabled.

**Security monitoring:**
CloudTrail logs every API call made in the account and stores those logs in an encrypted S3 bucket. VPC Flow Logs capture all network traffic in the VPC and also send that data to S3. This gives us a complete audit trail - we know who did what and what network traffic moved where.

**Access control:**
IAM roles control what each service can access. The EC2 instances get a role that lets them write to DynamoDB but nothing else. CloudTrail gets a role that can write to its S3 bucket. VPC Flow Logs get permissions to write to their S3 bucket. All IAM users must have MFA enabled to access the console.

The S3 buckets storing the logs have encryption enabled by default. Security groups ensure no one can SSH in from the internet - port 22 is restricted to our office IP range only.

## What needs to be built

Create a CloudFormation YAML file at `lib/TapStack.yml` with these connected components:

**Load Balancer with HTTPS**
Set up an application load balancer that only accepts HTTPS traffic. It should forward requests to EC2 instances in the VPC. No plain HTTP allowed in production.

**VPC with Security Groups**
The VPC needs security groups that:
- Allow inbound traffic to EC2 instances only from the load balancer
- Block SSH access from 0.0.0.0/0
- Restrict port 22 to specific IP ranges

**VPC Flow Logs → S3**
Enable VPC Flow Logs that capture all traffic in the VPC and send it to an encrypted S3 bucket. We need this for security investigations and compliance audits.

**CloudTrail → S3**
Turn on CloudTrail to log all API activity across the account. Have it write logs to an encrypted S3 bucket. This bucket should be separate from the VPC Flow Logs bucket.

**DynamoDB with PITR**
Create DynamoDB tables with point-in-time recovery enabled. The EC2 instances write application data here.

**IAM Roles connecting it all**
- EC2 instance role: Can read/write to DynamoDB tables only
- CloudTrail role: Can write to its S3 bucket
- VPC Flow Logs role: Can write to its S3 bucket
- Enforce MFA for all IAM users

**S3 Buckets with Encryption**
All S3 buckets must have default encryption enabled. No unencrypted data at rest.

## Technical details

The template should work in us-east-1 and us-west-2 regions. Make sure to properly define VPC IDs, security groups, and IAM role relationships so everything can actually talk to each other.

Structure the code like this:

```
project-root/
└── lib/
    └── TapStack.yml
```

The goal is a secure, production-ready CloudFormation template where the logging and monitoring services are actually collecting data from the infrastructure, not just deployed as separate components.
