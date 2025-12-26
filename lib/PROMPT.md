# Security Configuration as Code using CloudFormation YAML

## Task Requirements

Design and implement a comprehensive security configuration where AWS services connect and integrate to form a defense-in-depth architecture following AWS best practices.

## Core Security Architecture

1. IAM roles attach to EC2 instances in private subnets, granting specific permissions to access S3 buckets and RDS databases through instance profiles. The roles enforce least privilege by specifying exact resource ARNs rather than wildcards, ensuring applications only access their designated resources.

2. S3 buckets store application data with server-side encryption enabled using AES-256. Bucket policies enforce HTTPS connections from EC2 instances and deny public access. Versioning protects against accidental deletions while lifecycle policies manage storage costs.

3. CloudTrail captures all API calls across regions and streams audit events to an encrypted S3 bucket dedicated to security logs. CloudWatch Logs receives these trail events for real-time analysis, enabling detection of unauthorized access patterns.

4. VPC network architecture segments resources into public and private subnets across availability zones. Security groups attached to EC2 instances filter inbound traffic, allowing SSH only from a bastion host while permitting application traffic from the load balancer. Database security groups accept connections exclusively from application tier instances.

5. CloudWatch monitors security-related metrics and log patterns, triggering alarms when anomalies occur. These alarms publish notifications to SNS topics that alert the security team via email subscriptions. Metric filters analyze CloudTrail logs for root account usage and unauthorized API calls.

6. GuardDuty continuously analyzes VPC flow logs, CloudTrail events, and DNS logs to detect threats. Findings integrate with CloudWatch Events to trigger automated responses through Lambda functions that can isolate compromised resources.

## Technical Specifications

- Platform: AWS CloudFormation
- Language: YAML
- Region: us-east-1
- Resource Naming: Use environment suffix for all resources
- Tagging Strategy: Consistent tagging with Environment, Project, and Owner tags

## Deliverables

- Complete CloudFormation YAML template with integrated security controls
- Parameterized template supporting development, staging, and production environments
- Outputs exposing resource identifiers for cross-stack references
- Security validation through proper resource configuration and connectivity

## Compliance Standards

- Follow AWS Well-Architected Security Pillar guidelines
- Implement defense-in-depth with multiple security layers that reinforce each other
- Ensure all data flows use encryption at rest and in transit
- Maintain complete audit trail connecting administrative activities to storage and alerting
