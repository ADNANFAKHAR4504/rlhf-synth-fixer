Hey,

I need you to write the Go code for a new CI/CD pipeline for **Project Nova** using the **AWS Cloud Development Kit for Terraform (CDKTF)**. The goal is to create a robust, secure, and fully automated pipeline that handles deployments across our staging and production AWS accounts, which are in different regions.

Please ensure all the generated Go code is contained within a single file named `tap_stack.go`.

Here are the detailed requirements for the pipeline stack:

## Core Architecture & Technology

* **Framework:** Use **CDKTF with Go** to define all infrastructure.
* **Orchestrator:** The pipeline must be an **AWS CodePipeline**.
* **Source Control:** The pipeline should trigger automatically from commits to a specific branch in an **AWS CodeCommit** repository.

## Pipeline Stages & Logic

1.  **Source Stage:**
    * Fetches the source code from CodeCommit.

2.  **Build & Test Stage:**
    * Use **AWS CodeBuild** for this stage.
    * The build process must package our web application into a **Docker container**.
    * It must execute both **unit tests** and **integration tests**. If any test fails, the pipeline must stop.

3.  **Staging Deployment:**
    * Deploy to our **staging AWS account** in the `eu-west-1` region.
    * The deployment action should use **AWS CloudFormation** to create or update the stack.
    * Implement an **automated rollback** mechanism if the CloudFormation deployment fails.

4.  **Production Approval:**
    * Incorporate a **manual approval step** before the production deployment can proceed. A notification should be sent out for the approval.

5.  **Production Deployment:**
    * After approval, deploy to our **production AWS account** in the `us-east-1` region.
    * This stage must also use **AWS CloudFormation** for the deployment and have **automated rollback** on failure.

## Security & Compliance

* **IAM Policies:** All IAM roles (for CodePipeline, CodeBuild, CloudFormation actions, etc.) must be created with the **principle of least privilege**. Only grant the permissions absolutely necessary for each component to function.
* **Encryption:** The S3 bucket used by CodePipeline for artifacts must be encrypted using a customer-managed **AWS KMS key**. All logs must also be encrypted.
* **Logging:** Ensure **AWS CloudTrail** is configured to log all actions performed by the CodePipeline.

## Monitoring & Naming

* **Alerting:** Configure **AWS CloudWatch Events** to monitor the pipeline's execution status. Set up an alert to trigger a notification (e.g., to an SNS topic) upon any failed stage.
* **Resource Naming:** All resources you define must follow the naming convention: `Corp-{ResourceName}-{region}`. For example, a CodeCommit repository could be `Corp-NovaWebApp-eu-west-1`.

## Expected Output

Provide a single, complete, and well-documented Go code file named `tap_stack.go`. The code should be ready to be used in a CDKTF project to synthesize the Terraform configuration for this entire pipeline. Do not include placeholder text or comments like `// your code here`; the file should be fully implemented.
