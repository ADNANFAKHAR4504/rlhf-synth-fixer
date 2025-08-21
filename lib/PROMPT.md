# IaC – AWS Nova Model Breaking  
### Prompting Guide for Pulumi + TypeScript Infrastructure Generation

This document provides a reusable meta-prompt for building production-grade, secure AWS infrastructure using Pulumi with TypeScript.  
It is designed to help engineers or AI assistants generate infrastructure code that meets strict security, compliance, and connectivity requirements, while ensuring output is clean, testable, and focused only on the files we care about.

---

## Goal
We want to translate high-level infrastructure requirements into working Pulumi code with TypeScript.  
The output should include:
- The stack implementation (`lib/tap-stack.ts`)
- Unit tests (`test/tap-stack.unit.test.ts`)
- Integration tests (`test/tap-stack.int.test.ts`)

Nothing else should be returned — no extra prose, no scaffolding, just those three files.

---

## Design Priorities
1. Multi-region support → cover `us-east-1`, `us-west-2`, and `eu-central-1`.
2. Security first  
   - KMS Customer Managed Keys for encryption  
   - IAM least privilege roles and policies  
   - VPC with private/public subnets, restricted Security Groups  
   - API Gateway locked to a given VPC Endpoint  
   - Enforce IAM credential rotation  
   - Automatic remediation using AWS Config + SSM Automation
3. Tagging → everything must include `Environment: Production`.
4. Monitoring and Logging  
   - CloudTrail (management + data events)  
   - VPC Flow Logs  
   - API Gateway and ALB access logs  
   - CloudWatch alarms with SNS notifications  

---

## Focus on Connectivity
Infrastructure should be wired together correctly:
- API Gateway → VPC Endpoint restriction  
- ALB → TargetGroup → ASG/Lambda  
- S3 → KMS → CloudTrail and access logs  
- VPC Flow Logs → CloudWatch log groups (encrypted with KMS)  
- Route53 → ALB  
- CloudWatch Alarms → SNS topics  

All relationships must be explicit and validated in outputs and tests.

---

## Testing Requirements
- Unit tests:  
  - Check tags, encryption, IAM least privilege, Security Group rules, and resource policies.  
  - Ensure logging resources exist.  
- Integration tests:  
  - Deploy minimal stack.  
  - Assert resources are connected (for example, Flow Logs → Log Group, API Gateway policy → VPC Endpoint).  

---

## How to Use
When you are ready to generate infrastructure:
1. Copy the requirements section (below) and replace values with your project details.  
2. Paste it into the User Message block of the prompt.  
3. The model will respond with only three files in fenced code blocks.

---

## Example User Message

```yaml
projectName: "IaC - AWS Nova Model Breaking"

regions:
  - us-east-1
  - us-west-2
  - eu-central-1

network:
  vpc:
    cidr: "10.0.0.0/16"
    publicSubnets: ["10.0.0.0/20","10.0.16.0/20"]
    privateSubnets: ["10.0.32.0/20","10.0.48.0/20"]
  allowedIngressCidrs: ["203.0.113.0/24"]

security:
  enforceIamLeastPrivilege: true
  enforceCredentialRotation: true
  useKmsCustomerManagedKeys: true
  restrictApiGatewayToVpceId: "vpce-0123456789abcdef0"
  enableConfigAndRemediation: true
  requireAllResourcesTaggedProduction: true

loggingMonitoring:
  enableCloudTrail: true
  enableVpcFlowLogs: true
  enableApiGwAccessLogs: true
  enableAlbAccessLogs: true
  cwAlarms:
    - name: "UnauthorizedAPICalls"
      metric: "AWS/CloudTrail:UnauthorizedApiCalls"
      threshold: 1
      period: 300
      snsEmail: "secops@example.com"

data:
  s3Buckets:
    - name: "nova-prod-artifacts"
      blockPublicAccess: true
      accessLogging: true
  rds:
    create: false
  secretsManager:
    kms: "auto"

testing:
  runMode: "ci"

constraints:
  - "Multi-region deployment must be ensured across us-east-1, us-west-2, eu-central-1."
  - "All resources must be tagged with 'Environment: Production'."
  - "IAM roles must have least privilege."
  - "Use KMS CMKs for all data encryption."
  - "Implement secure VPC, Subnets, and SGs; limit access to allowedIngressCidrs."
  - "Enable logging/monitoring across services."
  - "API Gateway only via the specified VPC Endpoint."
  - "Enforce IAM credential rotation policies."
  - "Implement automatic remediation for non-compliant configs."