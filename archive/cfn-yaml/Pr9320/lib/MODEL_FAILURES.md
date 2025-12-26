# Model Failures for Blue-Green Migration CloudFormation Template

This document lists common model failures and misconfigurations when generating a CloudFormation YAML template for a zero-downtime, Blue-Green migration of a multi-tier web application to AWS, based on the requirements provided.

---

## 1. Blue-Green Deployment Implementation
- **Failure:** No clear separation of Blue and Green environments or missing switch mechanism.
- **Impact:** Downtime or traffic routed to incomplete/inconsistent environments during migration.
- **Mitigation:** Provision separate environments and use Route53/ALB/CloudFront to switch traffic atomically.

## 2. RDS Data Migration
- **Failure:** RDS is provisioned but data migration is not seamless or lossless.
- **Impact:** Data loss or application inconsistency during cutover.
- **Mitigation:** Use AWS Database Migration Service or snapshot/restore with minimal downtime.

## 3. CodePipeline Integration
- **Failure:** CodePipeline is not used or not integrated for CI/CD during migration.
- **Impact:** Manual deployments, increased risk of errors, and no automated rollback.
- **Mitigation:** Define `AWS::CodePipeline::Pipeline` with all required stages.

## 4. High Availability
- **Failure:** Application is not distributed across multiple AZs.
- **Impact:** Single point of failure, reduced resilience.
- **Mitigation:** Use subnets and resources in at least two AZs for all tiers.

## 5. IAM Least Privilege
- **Failure:** IAM roles/policies grant excessive permissions (e.g., `*:*`).
- **Impact:** Security risk due to over-permissioned compute resources.
- **Mitigation:** Scope IAM policies to only required actions and resources.

## 6. Security Group Configuration
- **Failure:** Security groups are too permissive or do not match/exceed existing environment security.
- **Impact:** Increased attack surface or failed compliance.
- **Mitigation:** Restrict ingress/egress rules to only what is required.

## 7. Naming Convention
- **Failure:** Logical resource names do not follow `<component>-env-migration` format.
- **Impact:** Harder to manage, track, and audit resources.
- **Mitigation:** Use the required naming convention for all resources.

## 8. Region Hardcoding
- **Failure:** AWS region is hardcoded in the template.
- **Impact:** Reduced portability and compliance with requirements.
- **Mitigation:** Use environment variables for region.

## 9. Dynamic References for Secrets
- **Failure:** Secrets (e.g., passwords) are passed as parameters or hardcoded.
- **Impact:** Security risk and non-compliance.
- **Mitigation:** Use dynamic references (e.g., Secrets Manager, SSM Parameter Store).

## 10. Unsupported Properties
- **Failure:** Template includes properties not supported by the resource (e.g., `BackupPolicy`).
- **Impact:** CloudFormation validation or deployment fails.
- **Mitigation:** Only use properties supported by the resource type.

## 11. CloudTrail Logging
- **Failure:** `IsLogging` property missing for `AWS::CloudTrail::Trail`.
- **Impact:** Template fails validation or does not meet audit requirements.
- **Mitigation:** Always include `IsLogging` when using CloudTrail.

## 12. Template Validation and Linting
- **Failure:** Template does not pass CloudFormation validation or cfn-lint checks.
- **Impact:** Stack creation fails or is not deployable.
- **Mitigation:** Validate and lint template before deployment.

---

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| CodePipeline | Pro-only feature | Conditional deployment via `IsLocalStack` parameter | Enabled in AWS |
| CodeBuild | Pro-only feature | Conditional deployment via `IsLocalStack` parameter | Enabled in AWS |
| CodeDeploy | Pro-only feature | Conditional deployment via `IsLocalStack` parameter | Enabled in AWS |
| NAT Gateway | Limited support | Conditional deployment via `IsLocalStack` parameter | Enabled in AWS |

### Parameter for Environment Detection

```yaml
Parameters:
  IsLocalStack:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: 'Set to true when deploying to LocalStack'
```

### Conditions Applied

```yaml
Conditions:
  DeployCodePipeline: !Equals [!Ref IsLocalStack, 'false']
  DeployNATGateway: !Equals [!Ref IsLocalStack, 'false']
```

### Resources Made Conditional

- `CodePipelineServiceRole` - IAM role for CodePipeline
- `CodeBuildServiceRole` - IAM role for CodeBuild
- `CodeDeployServiceRole` - IAM role for CodeDeploy
- `CodeBuildProject` - CodeBuild project resource
- `CodeDeployApplication` - CodeDeploy application
- `CodeDeployDeploymentGroup` - Deployment group
- `CodePipeline` - The pipeline itself
- `NATGateway1EIP` - Elastic IP for NAT Gateway
- `NATGateway1` - NAT Gateway resource
- `PrivateRoute1` - Route using NAT Gateway

### Services Verified Working in LocalStack

- VPC (full support)
- Subnets (full support)
- Internet Gateway (full support)
- Security Groups (full support)
- Application Load Balancer (full support)
- Target Groups (full support)
- Auto Scaling Groups (basic support)
- RDS (basic support)
- S3 (full support)
- Secrets Manager (full support)
- IAM (basic support)

### Integration Test Adjustments

Tests now detect LocalStack via `AWS_ENDPOINT_URL` environment variable and:
- Use LocalStack endpoints for all AWS SDK clients
- Skip CodePipeline tests in LocalStack
- Accept different DNS formats for ALB and RDS in LocalStack
- Make CodePipelineName output optional in checks

---

*Update this document as new model failure scenarios are discovered or requirements change.*
