# Prompt: Secure Multi-Region AWS CloudFormation Template
**Task:**
Create a **CloudFormation YAML** file named `secure-architecture.yaml` that provisions a secure **AWS infrastructure** designed to handle sensitive financial data. The architecture must be deployed across three `AWS regions`:

`us-east-1`

`us-west-2` 

`eu-central-1`

**Requirements Encryption**

- Use **AWS Key Management Service (KMS)** for encrypting data at rest across all resources.

- All **S3 buckets** must have `default` server-side encryption (SSE-S3) enabled.

**Security**

- Implement **AWS WAF** to protect all publicly accessible web applications.

- Define **IAM roles** following the principle of least privilege, using AWS managed policies where applicable.

- Configure **VPCs** with custom Network Access Control Lists (NACLs) to control inbound and outbound traffic.

**Governance**

- Enable **AWS CloudTrail** logging in all `AWS regions` to maintain a complete governance and audit trail.

**Constraints**
- Use **CloudFormation** best practices for **parameterization**, **resource naming**, and **reusability**.

- Ensure the template is `multi-region` ready, either through StackSets or a well-parameterized single stack.

- The template must pass all security compliance checks for financial data handling.

**Output Format**
- The final answer must be pure **YAML** inside a code block using the following syntax:

```yaml
# secure-architecture.yml
<CloudFormation code here>
```
- No extra explanations outside the YAML block.