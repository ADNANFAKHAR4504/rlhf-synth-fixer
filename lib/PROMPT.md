You are an expert AWS infrastructure engineer and Terraform CDK (CDKTF) specialist. Your task is to design and implement a **security-hardened, dual-region AWS infrastructure** using **TypeScript with CDKTF** that meets advanced security, monitoring, and compliance requirements.

> **Environment & Requirements:**
>
> 1. **IAM Security:** Define IAM roles and policies strictly adhering to the _least privilege principle_. All roles must have precise permissions needed for their function, with no wildcard (“\*”) permissions.
> 2. **Monitoring & Logging:** Enable AWS CloudWatch Logs for infrastructure monitoring and logging. Ensure that all services created are configured to send logs to CloudWatch.
> 3. **Encryption:** All data at rest must be encrypted using **customer-managed AWS KMS keys**. The KMS keys should have restrictive policies allowing only authorized IAM principals to use them.
> 4. **Dual-Region Deployment:** Deploy infrastructure across **`us-east-1`** and **`us-west-2`**. Ensure region-specific resources are properly scoped and independently managed while following a consistent naming convention.
> 5. **Industry Best Practices:** Apply secure defaults, tagging for all resources (`Environment`, `Owner`, `Project`), and modular design so that components can be reused or extended for other environments.
>
> **Output Expectations:**
>
> - A **single, fully functional CDKTF TypeScript file** implementing all the above requirements.
> - Code must pass `cdktf synth` without errors and follow Terraform security best practices.
> - All resources must be fully provisioned in both regions without manual intervention.
> - Policies, logging, and encryption must be explicitly verifiable in the generated Terraform plan.
>
> **Constraints:**
>
> - Use **CDKTF with TypeScript** only.
> - No hardcoded secrets; parameterize sensitive values where needed.
> - Avoid public internet exposure for any service.
> - Ensure code is idempotent and can be re-run without causing resource drift.
