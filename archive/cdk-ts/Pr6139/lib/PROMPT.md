---

## Payment Processing Stack Refactoring (AWS CDK – TypeScript)

### Monolithic to Micro-Stacks Migration

A fintech company's payment processing infrastructure was built as a monolithic CDK stack but now suffers from deployment timeouts and excessive CloudFormation resource limits. We'll **refactor this into multiple smaller, manageable stacks** using **AWS CDK** in **TypeScript** for better maintainability and faster deployments.

---

## What We Need

Implement the refactored infrastructure across multiple CDK stacks in `lib/` to deploy a **modular, scalable payment processing system**.

### **Core Components**

1. **API Stack**

   * API Gateway REST API with all payment endpoints
   * Usage plans and API keys for different customer tiers
   * Request validation and rate limiting configuration
   * Custom domain and SSL certificate management

2. **Database Stack**

   * RDS Aurora PostgreSQL cluster with Multi-AZ deployment
   * Encrypted storage with automated backups to S3
   * Read replicas for read-heavy operations
   * Database parameter groups and security groups

3. **Processing Stack**

   * Lambda functions for payment validation and processing
   * SQS queues with DLQs for async transaction processing
   * EventBridge rules for payment event routing
   * Step Functions for complex payment workflows

4. **Monitoring Stack**

   * CloudWatch dashboards for system observability
   * Custom metrics and alarms for payment processing
   * X-Ray tracing for distributed transaction tracking
   * SNS topics for alert notifications

5. **Cross-Stack References**

   * Proper CDK cross-stack references for shared resources
   * Dependency management to prevent circular references
   * Stack outputs and imports for inter-stack communication

6. **CDK Aspects for Validation**

   * Resource count validation (max 500 resources per stack)
   * Tagging consistency enforcement
   * Security group and IAM policy validation

7. **CI/CD Pipeline**

   * CDK Pipelines for automated deployments
   * Manual approval gates for production deployments
   * Parallel stack deployment where possible
   * Rollback capabilities for failed deployments

8. **Custom Constructs Library**

   * Reusable Lambda-with-DLQ construct
   * API Gateway with WAF integration
   * Database connection pooling utilities

---

## Technical Requirements

* AWS CDK v2.x with TypeScript and Node.js 18+
* Multi-stack deployment with proper dependency ordering
* Zero-downtime refactoring without service interruption
* CloudFormation stack size limits (max 500 resources per stack)
* Existing API endpoints and integrations must be preserved

---

## Current Stack Structure

Create separate stack files in `lib/` for each logical component. `bin/tap.ts` already defines a base CDK app with multiple stacks for API, Database, Processing, and Monitoring components.

Connections should be correctly wired:

* API Stack → Processing Stack (API Gateway → Lambda)
* Processing Stack → Database Stack (Lambda → RDS)
* All Stacks → Monitoring Stack (CloudWatch integration)
* Cross-stack references for shared resources and configurations

Implement proper CDK best practices with L3 constructs, custom aspects for validation, and comprehensive error handling. The refactoring should maintain **zero downtime** while improving **deployability and maintainability**.

---