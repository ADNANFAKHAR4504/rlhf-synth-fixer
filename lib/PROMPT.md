> **Act as an AWS Solutions Architect** and write a **complete AWS CloudFormation template in YAML** to deploy a **secure and highly available application infrastructure** in **us-west-2** that meets the following requirements:
>
> **1. Tagging & Naming**
>
> * All resources must have tags:
>
>   * `Environment: EnvironmentSuffix`
>   * `Owner: <team-email>`
> * Follow a consistent naming convention for all resource names.
>
> **2. Security & IAM**
>
> * Use AWS **managed IAM policies** with **least privilege** access.
> * All S3 buckets must enforce **encryption at rest** with **AWS KMS**.
> * All Lambda environment variables must be encrypted with KMS.
> * Restrict network traffic using **Security Groups** allowing only **HTTP (80)** and **HTTPS (443)** inbound traffic.
>
> **3. High Availability**
>
> * VPC with **at least two public** and **two private subnets** across multiple AZs.
> * RDS instances deployed in **Multi-AZ** configuration.
> * DynamoDB tables with **Point-in-Time Recovery** enabled.
>
> **4. Monitoring & Compliance**
>
> * Configure **CloudWatch** to monitor **unauthorized API access attempts**.
> * Enable CloudWatch Logs for all applicable services.
>
> **5. Other Constraints**
>
> * EC2 instances must use a **specified AMI ID** (parameterized in the template).
> * All data at rest must be encrypted with **AWS-managed KMS keys**.
> * Deployment must pass without errors and conform to AWS best practices for security and high availability.
>
> **Output Requirements:**
>
> * Provide a **single deploy-ready CloudFormation YAML template** that includes:
>
>   * Resources for VPC, Subnets, Security Groups, IAM Roles, EC2, S3, RDS, DynamoDB, Lambda, CloudWatch alarms/log groups.
>   * Outputs section for key resource ARNs and endpoints.
>   * Inline comments explaining the security, HA, and compliance choices.
> * Ensure the YAML is properly indented and **CloudFormation Linter (cfn-lint)** compliant.