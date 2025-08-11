**Persona:** You are an expert AWS CloudFormation engineer specializing in large-scale, multi-region cloud security and Infrastructure as Code (IaC). You have extensive experience with **AWS CloudFormation StackSets** to ensure consistent deployments across an organization.

**Objective:** Create a single, comprehensive CloudFormation YAML template. This template must be designed for use within an **AWS CloudFormation StackSet** to deploy a secure baseline infrastructure across the `us-east-1` and `us-west-2` regions.

**Project Context:**
The infrastructure will support a high-availability, multi-region application named "Nova." The application requires an EC2 instance in each region to process data. Each instance needs read-only access to an S3 bucket within its own region and permission to write logs to CloudWatch.

**Core Requirements:**

1.  **StackSet Target Regions:**
    * The template must be written to function correctly when deployed via a StackSet to both `us-east-1` and `us-west-2`.

2.  **Region-Specific AMI Mapping:**
    * Since AMI IDs are region-specific, you **must** use a `Mappings` section in the template. This mapping will associate the region (`us-east-1`, `us-west-2`) with the correct, latest Amazon Linux 2 AMI ID for that region.

3.  **Tagging:**
    * Every resource created by the stack must be tagged with:
        * `Owner`: YourName
        * `Purpose`: Nova-App-Baseline

4.  **AWS Key Management Service (KMS):**
    * Create a customer-managed KMS Key in each target region.
    * The key should have an alias, `alias/nova-app-key`.
    * The KMS key's deletion policy should be set to `Retain`.

5.  **Secure Storage (S3):**
    * Provision an S3 bucket in each target region.
    * To prevent naming conflicts in the global S3 namespace, the bucket name **must be dynamically generated** to be unique. A good practice is to incorporate the AWS Account ID and Region (e.g., using `!Sub 'nova-data-bucket-${AWS::AccountId}-${AWS::Region}'`).
    * Enforce server-side encryption on the bucket using the regional KMS key created above.
    * Block all public access.

6.  **IAM Roles (Least Privilege Principle):**
    * Create an IAM Role for an EC2 instance (`EC2AppRole`). This is a global resource but will be used by instances in each region.
    * Its attached IAM policy must grant **only** the following permissions:
        * Read-only access (`s3:GetObject`) to the S3 bucket created *in the same region*.
        * Permissions to create and write to CloudWatch Logs (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`).

7.  **Compute and Encrypted Volumes (EC2 & EBS):**
    * In each region, launch a `t3.micro` EC2 instance using the appropriate AMI ID from your `Mappings` section.
    * The instance's root EBS volume must be encrypted using the regional KMS key.
    * Create and attach an EC2 Instance Profile associated with the `EC2AppRole`.

8.  **Compliance Monitoring (AWS Config):**
    * Deploy the following AWS managed Config Rules in each region:
        * `s3-bucket-server-side-encryption-enabled`
        * `encrypted-volumes`
        * `iam-role-managed-policy-check`

**Output Format:**

* Provide a single, complete CloudFormation template in YAML format.
* Ensure the template is well-structured and includes comments explaining key configurations, especially the multi-region aspects like the AMI `Mappings`.
* The final YAML must be valid and pass linting checks with tools like `cfn-lint`.
* Enclose the entire output in a single YAML code block.
