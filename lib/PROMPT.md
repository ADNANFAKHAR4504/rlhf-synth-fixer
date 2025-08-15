**Prompt:**

> You are to write complete, production-ready **CDK for Terraform (TypeScript)** code that provisions AWS infrastructure meeting the following exact requirements.
>
> **Constraints (do not change these):**
>
> * All AWS resources must reside in the `us-west-2` region.
> * VPC CIDR block: `10.0.0.0/16`.
> * All EC2 instances must be `t3.micro`.
> * IAM roles must have policy attachments defined in CDKTF code, not manually.
> * Enable **detailed CloudWatch monitoring** for all instances.
> * All S3 buckets must enforce **AES-256** encryption.
> * Provision a minimum of **3 EC2 instances** in an **Auto Scaling Group**.
> * Network ACLs must allow **only** ports `443` and `22`.
> * Use a single AWS account dedicated to production workloads.
> * RDS instances must be **Multi-AZ**.
> * All user data scripts must log their actions to CloudWatch.
> * DynamoDB tables must have **auto-scaling** enabled for both Read and Write Capacity Units.
> * An **Elastic Load Balancer** must sit in front of the Auto Scaling Group.
>
> **Environment:**
>
> * Define a new VPC (`10.0.0.0/16`) in `us-west-2`.
> * Create an Auto Scaling Group linked to an Elastic Load Balancer with at least 3 `t3.micro` instances.
> * Enforce AES-256 encryption on all S3 buckets.
> * Implement IAM roles and inline policy attachments within CDKTF code.
> * Deploy a Multi-AZ RDS instance.
> * Enable detailed monitoring in CloudWatch for all EC2 instances, and ensure user data logs to CloudWatch.
> * Restrict traffic with Network ACLs to allow only ports 443 and 22.
> * Enable auto-scaling for DynamoDB tables.
> * All resources must reside in the production AWS account only.
>
> **Expected Output:**
>
> * Provide a complete **CDKTF (TypeScript)** project containing all necessary stacks and constructs.
> * The configuration must run without errors when executed with `cdktf synth` and `terraform plan`.
> * Follow security best practices and organize the code into reusable CDKTF constructs or stacks.
> * Include any necessary imports, provider configuration, and stack composition in `main.ts`.
> * Ensure that all naming conventions and tags clearly indicate production use.