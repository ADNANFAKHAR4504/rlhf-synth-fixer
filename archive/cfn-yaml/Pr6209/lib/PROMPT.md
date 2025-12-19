# AWS CloudFormation Prompt

## Objective
Generate a complete, production-ready CloudFormation YAML template that builds a secure, compliant data processing infrastructure for handling sensitive financial records.

## Requirements

### Functional Requirements
- **S3 Bucket**: Create an S3 bucket for encrypted financial data storage using SSE-S3 encryption with Bucket Key enabled.
- **Lambda Function**: Define an AWS Lambda function that processes data from the S3 bucket, with environment variables encrypted by a customer-managed KMS key.
- **DynamoDB Table**: Create a DynamoDB table to store processing metadata, with Point-In-Time Recovery (PITR) enabled.
- **VPC Endpoints**: Configure VPC endpoints for S3 and DynamoDB to ensure all communications remain private (no internet access).
- **IAM Roles and Policies**: Create IAM roles and policies for the Lambda function using the principle of least privilege — only allow read access to the S3 bucket and write access to DynamoDB.
- **CloudWatch Logs**: Implement CloudWatch Log Groups with exactly 90-day retention for audit logging.
- **Security Groups**: Create security groups that allow only HTTPS traffic on port 443 for VPC endpoints.
- **Resource Tags**: Apply mandatory resource tags to every resource:
  - `DataClassification: Confidential`
  - `ComplianceScope: PCI-DSS`
- **S3 Bucket Policy**: Configure the S3 bucket policy to deny all non-HTTPS requests.
- **Private Subnets**: Ensure Lambda functions run in private subnets within a VPC that has no Internet Gateway or NAT Gateway access.

### Problem Constraints
- All S3 buckets must use SSE-S3 encryption with bucket key enabled.
- Lambda functions must use customer-managed KMS keys for environment variable encryption.
- All AWS service communications must go through VPC endpoints — no public internet routes.
- Security groups must explicitly deny all traffic except required ports (HTTPS 443).
- IAM roles must use least privilege and no wildcard (`*`) permissions.
- CloudWatch Logs must retain logs for exactly 90 days.
- All resources must be tagged with:
  - `DataClassification: Confidential`
  - `ComplianceScope: PCI-DSS`
- S3 bucket policies must enforce HTTPS-only access.
- Lambda functions must run in private subnets only.

### Cross-Account Executability Requirements
- The template must be fully deployable across any AWS account and region without modification.
- No hardcoded account IDs, ARNs, or region names.
- Use CloudFormation intrinsic functions (e.g., `!Sub`, `!Ref`, `!GetAtt`) and parameters to replace hardcoded values.
- Parameterize all resource names, ARNs, and external references.

### Mandatory Parameters
```yaml
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

### Mandatory Naming Convention
Every resource name must follow this pattern:

```yaml
Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"
```

#### Examples
- **VPC** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- **Subnet** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1`
- **Lambda** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda`

### Output Requirements
- Provide a complete, validated CloudFormation YAML template (not JSON).
- Use proper indentation and AWS resource logical IDs.
- Include comments explaining each major resource block.
- Ensure it is fully deployable as-is in a new AWS account without modification.
- The template must meet PCI-DSS-style security standards and pass `cfn-lint` validation.

### Final Deliverable
A single CloudFormation YAML file containing all infrastructure resources described above.

It should create a fully automated, private, secure data-processing stack suitable for handling **Confidential** financial data.