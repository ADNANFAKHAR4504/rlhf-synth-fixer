You are AWS Architect tasked with implementing a **CI/CD pipeline on AWS using the AWS Cloud Development Kit (CDK) in Python**. This pipeline should enable automated deployment to **distinct staging and production environments** and integrate tightly with **AWS CodePipeline** and **AWS CodeBuild**. Your infrastructure must be defined entirely in **Python code using AWS CDK**, with no manual AWS Console configuration.

---

### **Core Requirements:**

1. **Infrastructure-as-Code:**
   - Use **AWS CDK (Python)** to define all infrastructure for the pipeline, environments, and supporting resources.
   - The code should be modular and reusable across staging and production environments.

2. **Environments:**
   - Support **two separate environments**: `staging` and `production`.
   - Deployments to these environments must be handled by **distinct stages** in the pipeline but share a common codebase.
   - Resource names must follow the format: `projectname-environment-resourcetype` (e.g., `ciapp-staging-codebuild`).

3. **CI/CD Integration:**
   - Use **AWS CodePipeline** as the orchestrator for the CI/CD workflow.
   - Use **AWS CodeBuild** for build and test phases.
   - Enable automatic deployments triggered by code commits (e.g., via a connected GitHub or CodeCommit repository).

4. **Pipeline Capabilities:**
   - The pipeline should:
     - Build the codebase using CodeBuild.
     - Deploy to the **staging** environment automatically.
     - Deploy to **production** either automatically after a manual approval step or in a separate pipeline stage.

   - Ensure outputs, build artifacts, and logs are stored appropriately (e.g., in S3).

---

### **Security & Configuration:**

- Define appropriate **IAM roles and policies** for CodePipeline, CodeBuild, and deployment targets.
- The solution must be **fully automated**, **auditable**, and **repeatable** via `cdk deploy`.

---

### **Deployment Region & Tagging:**

- All infrastructure must be deployed in the **`us-west-2` region**.
- Tag all AWS resources with:
  `Environment: staging` or `Environment: production` (depending on the target).

---

### **Expected Output:**

Provide a complete **AWS CDK Python project** that:

- Defines the CI/CD pipeline, CodeBuild projects, CodePipeline stages, environment separation, and required roles/policies.
- Supports deployment and promotion of application code to staging and production environments.
- Follows best practices in modularization, naming conventions, and resource tagging.

Include the following files:

- `app.py`
- `cdk.json`
- `requirements.txt`
- `pipeline_stack.py` or equivalent
- Supporting stacks or constructs for staging and production deployments
- Example buildspec files and sample Lambda/app code if needed

The solution should be testable by running `cdk deploy` and validating deployment to both environments from a single source repository.

---
