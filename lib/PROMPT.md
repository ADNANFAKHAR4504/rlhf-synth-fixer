# Infrastructure Requirements

Hey team! We're building out the AWS infrastructure for our new web application. I've been tasked with setting this up using Go CDK for Terraform, and here's what we need to implement:

## Security & Compliance
I want to make sure we're following security best practices from day one. Here's what I'm thinking:
- Let's encrypt everything at rest using KMS keys
- No more shared credentials - we'll use proper IAM roles for everything
- The application should run in a private VPC, not directly internet-facing
- We need CloudTrail enabled for audit compliance (management is asking for this)

## Infrastructure Setup
For the compute layer:
- Going with t3.micro instances to keep costs down initially
- Need detailed monitoring enabled on all EC2 instances
- Each instance should have read-only access to our application data bucket
- SSL/TLS everywhere - no exceptions

## Monitoring & Alerting
We've had issues with resource utilization in the past, so:
- Set up CloudWatch alarms for CPU usage
- If CPU goes above 70%, send SNS notifications to the ops team
- Want to catch performance issues before customers notice them

## Implementation
Everything should be defined in a single `tap_stack.go` file for now. We're targeting us-east-1 region.

The goal is to have a production-ready environment that's secure, monitored, and compliant with our internal standards. This will be the foundation for our application deployment.
