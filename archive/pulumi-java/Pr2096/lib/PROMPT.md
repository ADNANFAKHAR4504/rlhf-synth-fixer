# AWS Multi-Account Security Infrastructure Design

Add all the content to a single file called Main.java

## Project Overview

We need to build a comprehensive security framework for our multi-account AWS Organization that can handle the complex compliance requirements we're facing. This isn't just about ticking boxes - we need a robust, production-ready solution that our security team can actually rely on day-to-day.

## What We're Building

The goal is to create a Java-based AWS infrastructure that establishes a secure foundation across all our AWS accounts. Think of this as the security backbone that everything else will build upon. We're talking about a setup that would make our CISO sleep better at night.

## Core Requirements

### Identity & Access Management
- **IAM Roles & Policies**: We need a bulletproof IAM setup that follows the principle of least privilege. No more overly permissive policies that keep our security team up at night. Every role should have exactly the permissions it needs, nothing more.

- **Cross-Account Access**: Since we're dealing with multiple accounts, we need a secure way for services to talk to each other. IAM roles for cross-account access, properly configured with trust relationships.

### Data Protection
- **KMS Encryption**: A centralized KMS key that we can use across all our services for encrypting sensitive data at rest. This needs to be properly managed with appropriate key rotation policies.

- **S3 Security**: Our S3 buckets need to be locked down tight. Encryption in transit (TLS) and at rest (KMS), plus proper bucket policies that prevent public access.

### Monitoring & Alerting
- **CloudWatch & SNS**: We need real-time visibility into what's happening in our accounts. CloudWatch for monitoring, SNS for alerting our security team when something fishy happens - especially around IAM activities.

- **Comprehensive Logging**: Every access to sensitive resources needs to be logged. No exceptions. We need an audit trail that would stand up in court.

### Automation
- **Lambda & Step Functions**: When we detect unauthorized login attempts, we don't want to wait for human intervention. Automated response workflows that can take immediate action.

### Governance
- **Consistent Tagging**: Every resource needs proper tags (Environment, Project) for cost allocation and compliance reporting. No more untagged resources floating around.

## Technical Constraints

- **Java Only**: We're a Java shop, so everything needs to be written in Java using AWS SDKs
- **Region**: us-east-1 for consistency
- **Naming Convention**: Account ID prefix on all resources for easy identification
- **Multi-Account**: This needs to work across our entire AWS Organization

## What Success Looks Like

When we're done, we should have:
1. A security framework that actually works in production
2. Automated responses to security threats
3. Complete visibility into our AWS environment
4. Compliance-ready audit trails
5. A foundation that can scale as we add more accounts

## Testing Requirements

This isn't just about writing code - we need to prove it works. The solution should include comprehensive tests that validate:
- All security controls are functioning
- Encryption is working properly
- Alerts are firing when they should
- Cross-account access is secure
- Logging is capturing everything it should
