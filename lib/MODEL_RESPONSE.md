### Reasoning Trace
---

The user is asking me to restate the business context for a FedRAMP data processing pipeline using Pulumi Go. They want me to:

1. Re-state the business context (PII ingestion via API Gateway, streaming through Kinesis, containerized processing on ECS/Fargate, and durable storage in encrypted PostgreSQL RDS)
2. Highlight FedRAMP Moderate controls
3. Spell out minimum infrastructure components including:
   - VPC layout
   - Security groups and networking rules
   - KMS key usage patterns
   - Secret management
   - Observability requirements
4. Close with non-negotiable conventions

They want it written naturally as if it's an internal ticket for an experienced cloud engineer, no AI-like language.
### Answer 
---

## Business Context

We're building a data pipeline for our federal program office that ingests PII through a public-facing API Gateway endpoint. The data flows through Kinesis Data Streams for real-time processing, gets transformed by containerized services running on ECS Fargate, and lands in an encrypted PostgreSQL RDS instance for long-term storage and analytics.

The pipeline needs to meet FedRAMP Moderate requirements, which means we need customer-managed KMS keys for all encryption (both at rest and in transit), comprehensive audit logging for every access attempt, least-privilege IAM roles that follow the principle of minimal necessary access, and fully private networking for any stateful services that touch PII.

## Required Infrastructure Components

### VPC Architecture
- Single VPC with CIDR 10.0.0.0/16
- Two public subnets (10.0.1.0/24, 10.0.2.0/24) across AZs for the NAT Gateway and any AWS-managed service endpoints
- Two private subnets (10.0.10.0/24, 10.0.11.0/24) for ECS tasks
- Two database subnets (10.0.20.0/24, 10.0.21.0/24) for RDS - these should be completely isolated
- Single NAT Gateway in one public subnet (cost optimization for non-prod; production would need one per AZ)
- Route tables that ensure private subnets can only reach the internet through the NAT Gateway

### Security Groups and Network ACLs
- **API Gateway**: Managed by AWS, no security group needed
- **ECS Tasks SG**: Ingress only from API Gateway's VPC endpoint on port 8080, egress to RDS on 5432 and HTTPS for AWS service APIs
- **RDS SG**: Ingress only from ECS Tasks security group on port 5432, no direct internet access
- **VPC Endpoints SG**: HTTPS ingress from private subnets for AWS service communication
- Network ACLs should remain at defaults unless specifically required by security team

### KMS Key Configuration
- Single customer-managed KMS key for all encryption operations
- Key policy must grant:
  - ECS task execution role: Decrypt for pulling container images and secrets
  - ECS task role: Encrypt/Decrypt for Kinesis operations
  - RDS: Encrypt/Decrypt for database storage
  - CloudWatch Logs: Encrypt for log streams
  - API Gateway: Decrypt for request/response logging
- Enable automatic rotation (annual)
- CloudTrail must log all KMS API calls

### Secrets Management
- RDS master password stored in Secrets Manager with automatic rotation enabled
- Application database credentials in separate secret, rotated on demand
- ECS tasks pull secrets at runtime using task execution role
- No hardcoded credentials anywhere in the codebase or infrastructure

### Observability Stack
- CloudWatch Log Groups for each component with 30-day retention
- API Gateway access logging to dedicated log group
- ECS Container Insights enabled on the cluster
- Kinesis enhanced monitoring for shard-level metrics
- RDS Performance Insights with 7-day retention (free tier)
- All logs encrypted with the customer-managed KMS key

## Non-Negotiable Conventions

**Naming**: All resources must use the pattern `{project}-{stack}-{resource}` where project comes from Pulumi.Project() and stack from Pulumi.Stack(). Example: `pipeline-staging-ecs-cluster`.

**Destruction Safety**: Every stateful resource (RDS, KMS keys, Secrets) must have DeletionProtection enabled. Override only through explicit stack config for ephemeral environments.

**Tagging**: Every resource gets these tags minimum:
- `Project`: Pulumi project name
- `Stack`: Pulumi stack name  
- `ManagedBy`: "pulumi"
- `Environment`: Derived from stack name
- `DataClassification`: "pii"
- `ComplianceScope`: "fedramp-moderate"

**Testing Requirements**:
- Unit tests for all custom resource construction functions
- Integration test that validates security group rules using AWS SDK
- Smoke test that confirms API Gateway can reach ECS and ECS can reach RDS
- No use of `pulumi.String("hardcoded-value")` except in tests

**Additional Constraints**:
- Use structured config with strong typing - no raw pulumi.Config.Get()
- All availability zone selections must use data sources, not hardcoded AZ names
- Implement resource dependencies explicitly where CloudFormation would infer them
- Comments explaining STIG/FedRAMP control mapping for security-relevant configurations