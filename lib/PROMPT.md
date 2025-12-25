# Secure AWS Infrastructure with CloudFormation

Need to build a CloudFormation template that sets up a secure AWS environment. This is for production so security needs to be baked in from the start, not added later.

## What needs to be included

Create a CloudFormation YAML file at `lib/TapStack.yml` that covers these security requirements:

**S3 Buckets**
Enable default encryption on all buckets. No unencrypted data at rest.

**IAM Roles**
Follow least privilege - only grant the specific permissions needed, nothing more. Avoid giving broad permissions or using wildcards for resources.

**CloudTrail**
Turn on CloudTrail to log all account activity. We need audit trails for compliance.

**MFA Enforcement**
Require multi-factor authentication for all IAM users accessing the console.

**DynamoDB Tables**
Enable point-in-time recovery for all tables so we can restore data if needed.

**VPC Flow Logs**
Capture VPC flow logs and store them securely. This helps with network monitoring and troubleshooting.

**Security Groups**
No SSH access from the entire internet. Lock down port 22 to specific IP ranges only.

**Load Balancers**
Use HTTPS listeners only. No plain HTTP for production traffic.

## Technical details

The template should work in us-east-1 and us-west-2 regions. Make sure to properly define VPC IDs, security groups, and IAM role relationships.

Structure the code like this:

```
project-root/
└── lib/
    └── TapStack.yml
```

The goal is a secure, production-ready CloudFormation template that passes AWS validation and follows security best practices across the board.
