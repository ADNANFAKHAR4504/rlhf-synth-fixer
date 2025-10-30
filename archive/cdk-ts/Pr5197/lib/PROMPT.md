You are an expert in AWS Cloud Development Kit (CDK) with TypeScript. Your task is to generate a **single TypeScript file** that defines a complete AWS CDK stack for an automated infrastructure compliance and quality assurance system. **All provided data and configuration must remain intact and unchanged.** Wherever resource names require a suffix, ensure a String suffix is appended.

**Problem Statement:**  
Create a CDK program to implement an automated infrastructure compliance and quality assurance system. The configuration must:

1. Deploy Lambda functions that scan EC2 instances, RDS databases, and S3 buckets for compliance violations every 4 hours.
2. Check for required tags (`Environment`, `Owner`, `CostCenter`, `DataClassification`) on all resources.
3. Validate that all EC2 instances use approved AMIs from Systems Manager Parameter Store.
4. Ensure RDS instances have encryption enabled and automated backups configured.
5. Verify S3 buckets have versioning enabled and lifecycle policies defined.
6. Generate CloudWatch metrics for compliance scores by resource type.
7. Send SNS notifications for critical violations within 5 minutes of detection.
8. Create CloudWatch dashboards showing compliance trends over 30 days.
9. Store detailed scan results in S3 with 90-day retention.
10. Implement least-privilege IAM roles for all Lambda functions.

**Expected output:**  
A fully deployed compliance scanning system that automatically evaluates infrastructure against defined policies, generates actionable reports, and maintains historical compliance data for audit purposes.

**Background:**  
A financial services company needs automated infrastructure compliance scanning to ensure their AWS resources meet regulatory requirements. The solution must detect configuration drift, validate tagging standards, and report violations in real-time.

**Environment:**  
- Multi-region deployment across ` ` and ` ` for global compliance coverage.
- Uses Lambda for serverless compute, CloudWatch for metrics and dashboards, SNS for alerting, and S3 for audit trail storage.
- Requires CDK 2.x with TypeScript, Node.js 18.x, AWS CLI configured with appropriate permissions.
- Lambda functions deployed in VPC private subnets with VPC endpoints for AWS service access.
- Systems Manager Parameter Store contains approved AMI IDs and compliance thresholds.

**Constraints:**  
- Lambda functions must complete scans within 5-minute timeout limits.
- Use AWS SDK pagination for scanning large resource collections.
- Implement exponential backoff for API rate limiting.
- CloudWatch dashboard must auto-refresh every 60 seconds.
- SNS topics must support cross-region replication for disaster recovery (DR).
- **Ensure String suffix is appended to resource names where needed.**

**Instructions:**  
- Generate a complete TypeScript file for the AWS CDK stack, strictly following all requirements, environment details, and constraints.
- Do not change or reinterpret any provided data or configuration details.
- Explicitly append a String suffix to resource names wherever required.
- All AWS resources must be fully deployable and verifiable by AWS solution tests.

---

**Expected Output:**  
A deployable TypeScript file containing the AWS CDK stack definition that implements all the above requirements and constraints.

```