Functional scope (build everything new):

* Create a **brand new, self-contained CloudFormation template** named `TapStack.yml` in **YAML**, not JSON. The template must define all resources needed to build a hardened infrastructure from scratch, without pointing to any pre-existing VPCs, subnets, security groups, KMS keys, or other customer-managed resources.
* Target a **multi-region architecture** that can be safely deployed in both `us-east-1` and `us-west-2` within a single AWS account. The template itself must be **region-agnostic**, relying on pseudo parameters and intrinsic functions instead of hard-coded region names or ARNs (except for AWS-managed resources where needed).
* Implement all of the following security and infrastructure requirements in a single stack:

  1. **IAM roles with enforced MFA** for all role assumption (trust policies must require MFA via appropriate condition keys so that every role in this template can only be assumed with MFA).
  2. **S3 buckets** that strictly **limit access to a specific IP range** using S3 bucket policies and `aws:SourceIp` conditions (no public “*” access).
  3. **RDS instances** deployed in private subnets with **public access disabled** (`PubliclyAccessible: false`) and no direct internet ingress paths.
  4. **CloudTrail** configured as a multi-region trail with **S3 data event logging enabled for all S3 buckets**, capturing all S3 read/write access events.
  5. **EBS volume encryption** for all EC2 instances using **KMS customer-managed keys** that are created within this template (no unencrypted EBS volumes or default AWS-managed keys only).
  6. **EC2 instance type restriction** so that any EC2 instances launched by this template are limited to **`t2.micro` or `t3.micro` only** (e.g., via parameters with `AllowedValues`).
  7. **CloudWatch alarms** that monitor and alert on **unauthorized API calls**, wired up via metric filters on CloudTrail logs and appropriate CloudWatch Metrics/Alarms.
  8. A **VPC with both public and private subnets** providing proper **network isolation**, including:

     * Public subnets with an Internet Gateway and route tables.
     * Private subnets for application and database tiers.
     * NAT Gateway(s) or equivalent for controlled outbound access from private subnets if needed.
  9. **Security Groups** that:

     * Restrict **SSH (TCP 22)** access to specific, parameterized IP addresses or CIDR ranges.
     * Do **not** allow **RDP (TCP 3389)** inbound from the internet (no `0.0.0.0/0` on port 3389; ideally no external 3389 at all).
  10. An **AWS WAF (WAFv2) Web ACL** to protect web-facing components from common threats (e.g., SQL injection) using AWS managed rule groups, associated with the appropriate resource (e.g., an Application Load Balancer or CloudFront distribution defined in this template).
* All resources must follow a consistent naming convention: `<Service>-<Env>-<Name>`, where `<Env>` is provided by a parameter and is always derived from the environment suffix.

Constraints and conventions:

* The CloudFormation template **must be written in valid YAML** and use standard sections: `AWSTemplateFormatVersion`, `Description`, `Parameters`, `Mappings` (if needed), `Conditions`, `Resources`, and `Outputs`.
* Define a **string parameter** (for example `EnvironmentSuffix` or `ENVIRONMENT_SUFFIX`) which is used to **suffix all resource names and Name tags** to avoid conflicts between multiple deployments. This parameter:

  * Must not use a hard-coded `AllowedValues` list.
  * Must instead use a **safe naming `AllowedPattern` regex** that supports common environment suffix formats such as `prod-us`, `production`, `qa`, `staging-eu`, etc., while enforcing lowercase letters, digits, and hyphens and a reasonable length (for example: only `[a-z0-9-]` with a modest max length).
  * Should be used consistently in resource `Name` tags, logical naming patterns (where appropriate), and physical resource names that allow customization (e.g., S3 bucket names, CloudTrail trails, Log Groups, WAF Web ACL names, etc.), in the style `<Service>-<EnvironmentSuffix>-<Name>`.
* The template must **not rely on external or existing resources** except:

  * AWS-managed services and AWS-managed rule groups.
  * Pseudo parameters (e.g., `AWS::AccountId`, `AWS::Region`, `AWS::Partition`).
* Use **IAM least privilege**:

  * IAM Roles and Policies should grant only the permissions strictly required for their purpose (e.g., roles for EC2, RDS, CloudTrail, CloudWatch, WAF).
  * All IAM trust policies for roles in this template must include conditions enforcing MFA (for example using `aws:MultiFactorAuthPresent` or similar appropriate condition keys on `sts:AssumeRole`).
* Ensure **no Security Group** created by this template:

  * Allows inbound `0.0.0.0/0` on **RDP (3389)**.
  * Allows overly broad inbound rules; SSH must be restricted to defined IPs/CIDRs via parameters, and other inbound ports must be tightly scoped.
* VPC and subnet design must be **clearly segregated** between:

  * Public subnets (for internet-facing components).
  * Private subnets (for application and database tiers).
  * RDS instances must reside in private subnets only.
* CloudTrail and CloudWatch:

  * Configure a multi-region CloudTrail that captures management events and S3 data events.
  * Send CloudTrail logs to an encrypted S3 bucket and to a CloudWatch Log Group with metric filters.
  * Create CloudWatch Alarms for unauthorized API calls (for example, based on a metric filter that matches `AccessDenied` / `UnauthorizedOperation` patterns in CloudTrail logs).
* EC2 and EBS:

  * EC2 instances or Launch Templates defined in this template must:

    * Use a parameter constrained to `t2.micro` and `t3.micro`.
    * Ensure **all attached EBS volumes** are encrypted with the KMS customer-managed key defined in the template.
* WAF:

  * Define an **AWS::WAFv2::WebACL** with a set of managed rule groups (including SQL injection protection) and associate it with the main web entry point (e.g., ALB or CloudFront) provisioned in this stack.

Deliverable:

* A **single file** named `TapStack.yml` containing a **complete, production-grade CloudFormation YAML template** that:

  * Declares all **Parameters, Conditions, Resources, and Outputs** needed for a **fresh deployment** in a clean AWS account (no assumptions about pre-existing VPCs, subnets, keys, or security groups).
  * Uses **intrinsic functions** and pseudo parameters appropriately to remain **region-agnostic** and compliant with `us-east-1` and `us-west-2`.
  * Applies the `<Service>-<Env>-<Name>` naming convention everywhere, with `<Env>` based on the `EnvironmentSuffix` / `ENVIRONMENT_SUFFIX` parameter and enforced via a safe regex pattern rather than a fixed list of AllowedValues.
  * Implements all security requirements listed above in a manner consistent with AWS best practices for highly secure environments.
  * Includes meaningful `Outputs` exposing key identifiers, ARNs, and names (e.g., VPC ID, Subnet IDs, Security Group IDs, KMS Key ARN, CloudTrail ARN, WAF Web ACL ARN, etc.) to support integration tests and downstream stacks.

Validation expectations:

* The resulting `TapStack.yml` must be syntactically valid CloudFormation YAML and suitable for validation or deployment via AWS CloudFormation (e.g., `aws cloudformation validate-template`, CloudFormation Designer, or a test deployment).
* The logical structure and configuration must clearly demonstrate compliance with the listed constraints, especially around MFA enforcement for IAM roles, S3 IP restrictions, RDS non-public deployment, EBS encryption with customer KMS keys, CloudTrail S3 data event logging, CloudWatch alarms for unauthorized API calls, controlled SSH access, prohibition of public RDP, and WAF protection against SQL injection and common web threats.