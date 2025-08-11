Insert here the prompt that made the model fail.You are an expert AWS Cloud Security Engineer specializing in Infrastructure as Code (IaC) using CloudFormation.

Your task is to generate a single, comprehensive, and robust CloudFormation YAML template. This template will establish a foundational security configuration that can be deployed in any AWS region, specifically targeting `us-east-1` and `us-west-2`. The template must be complete, well-documented, and ready for deployment.

**Project Name:** IaC - AWS Nova Model Breaking

**Core Security Requirements:**

1.  **IAM MFA Enforcement:**
    * Create an IAM Group named `MfaEnforcedUsers`.
    * Create a customer-managed IAM Policy that enforces Multi-Factor Authentication (MFA) for **all** actions on **all** resources (`Action: "*"` and `Resource: "*"`).
    * This policy must explicitly deny actions if the user's session is not authenticated with MFA. Use the `aws:MultiFactorAuthPresent` condition key to achieve this.
    * Attach this IAM policy to the `MfaEnforcedUsers` group.

2.  **AWS Config for S3 Bucket Security:**
    * Set up the necessary AWS Config infrastructure, including a `ConfigurationRecorder` and a `DeliveryChannel`.
    * Create an S3 bucket for AWS Config to store its logs and configuration history. This bucket must itself be secure and not publicly accessible.
    * Implement the AWS Managed Config Rule `s3-bucket-public-read-prohibited` to continuously monitor for S3 buckets that allow public read access.
    * Implement the AWS Managed Config Rule `s3-bucket-public-write-prohibited` to continuously monitor for S3 buckets that allow public write access.

3.  **Demonstration Resources:**
    * Include a sample S3 bucket named using a parameter. This bucket will serve as an example resource to be monitored by the AWS Config rules.

**Output Requirements:**

* Provide the entire solution in a **single CloudFormation YAML code block**.
* The template must be region-agnostic, using pseudo parameters like `AWS::Region` and `AWS::AccountId` as needed. Do not hardcode region names.
* Use `Parameters` for customizable values, such as the name for the sample S3 bucket and the Config delivery bucket, to enhance reusability.
* Include `Description` fields for all key resources to explain their purpose.
* Ensure the template is syntactically correct and logically sound to guarantee a successful deployment without errors.
