# CI/CD Pipeline with AWS CDK (TypeScript)

We need to create a CDK stack in TypeScript that sets up a CI/CD pipeline using AWS native services. The stack should be self-contained, deployable, and demonstrate a complete workflow for building and deploying an application.

## Requirements

1. **Pipeline Workflow**

   * Use **CodePipeline** for orchestration.
   * Use **CodeBuild** for build steps.
   * Use **CodeDeploy** for deployments.

2. **Deployment Strategy**

   * Implement **blue/green deployments** to reduce downtime.
   * Roll back automatically if a deployment fails.

3. **Artifacts**

   * Store build artifacts in **S3**.

4. **Tagging**

   * Tag all resources with `Project: CI-CD-Example`.

5. **Networking & Availability**

   * Deploy in **us-west-2**.
   * Ensure application stack runs in at least **two AZs** for high availability.

6. **Security**

   * Create IAM roles with **least privilege** for each component (pipeline, build, deploy).
   * Follow AWS security best practices.

7. **Monitoring**

   * Enable logging for CodePipeline, CodeBuild, CodeDeploy, and S3.

8. **Approvals**

   * Add a **manual approval step** before promoting to production.

9. **Documentation & Naming**

   * Document the stack and its resources clearly.
   * Follow naming convention: `ci-cd-<resource-type>-<env>`.

## Extra Consideration

The design should also support a multi-account setup, where the main account hosts the CI/CD pipeline and other accounts are used for dev, staging, and prod deployments.

---

