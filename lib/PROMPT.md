# Prompt

You are tasked with setting up a **Continuous Integration and Continuous Deployment (CI/CD)** pipeline entirely within AWS for a **serverless application** using **Pulumi in Python**.  
The pipeline must provision both **infrastructure** and **application deployment resources** securely and scalably, relying **only on AWS native services**.

---

## **Specific Requirements**

### **Implementation**

- Use the **Pulumi Python SDK** for all infrastructure as code.
- Define **all resources** in a **single Pulumi Python file**.

---

### **Provisioned AWS Resources**

1. **S3 Buckets**
   - One for **build artifacts**.
   - One for **application logs**.
   - Must have:
     - **Server-side encryption** with **AWS KMS** (CMK).
     - **Bucket ownership controls** set to `BucketOwnerEnforced`.
     - **Versioning enabled**.

2. **AWS KMS CMK**
   - Customer-managed key.
   - **Rotation enabled**.
   - Used for S3 bucket encryption.

3. **Lambda Function (Main Application)**
   - With **alias** for zero-downtime deployments.
   - No separate log processor Lambda.

4. **API Gateway REST API**
   - Exposes the Lambda function.

5. **AWS CodeBuild Project**
   - Builds the application.

6. **AWS CodePipeline**
   - Orchestrates CI/CD.
   - Uses **CodeCommit** as the source stage (**lookup or fallback** if missing).
   - Integrates with CodeDeploy for deployments.

7. **AWS CodeDeploy**
   - Application and deployment group for **Lambda traffic shifting** and **rollback**.

8. **CloudWatch**
   - Alarms and log groups for monitoring.

---

### **Security & Best Practices**

- **Isolated environment deployments** via configurable `ENVIRONMENT_SUFFIX`.
- **IAM roles** with **minimal permissions** and explicit **policy attachments**.
- **Tags applied** to all resources:
  - `Environment` → from `ENVIRONMENT_SUFFIX`
  - `Department` → `Engineering` (default)
  - `Project` → `AWS Nova Model Breaking`
- **Only AWS native services**:
  - CodeCommit, CodePipeline, CodeBuild, S3, Lambda, API Gateway, CloudWatch, KMS.

---

### **Naming Conventions**

- **Project-specific prefixes**:
  - `nova-*` → Main application components.
  - `corp-*` → Shared buckets and keys.
- Naming scheme must ensure **global uniqueness** per environment.

---

## **Constraints**

- **All resources** must be defined in **a single Pulumi Python file**.
- **No external CI/CD services** (e.g., GitHub Actions).
- **Zero downtime deployments** via Lambda alias routing + AWS CodeDeploy.
- **Rollbacks** supported via CodePipeline + CodeDeploy.
- Resource names and structures may **vary per environment** for uniqueness.

---

**Project Name:**  
`IaC - AWS Nova Model Breaking`
