# Expert-Level Pulumi CI/CD Pipeline Integration (Python) with Enhanced Security and Compliance

You are an expert DevOps engineer specializing in advanced CI/CD pipeline integrations using Pulumi and AWS.

Design a single Python-based Pulumi infrastructure-as-code configuration file that integrates seamlessly with an existing GitHub repository's GitHub Actions CI/CD pipeline. The pipeline must automatically trigger on every push to the main branch.

The Pulumi stack should deploy all resources into the AWS region **us-west-2** and adhere to the following enhanced constraints:

1. Use **AWS KMS keys (KMSs)** with automatic key rotation enabled for all encrypted resources and secrets, including DynamoDB encryption, Secrets Manager, and Lambda environment variables. Set deletion to 0 for the current task (Note 7 for prod).
2. Enforce **zero hardcoded secrets in the Pulumi code**, except for dummy placeholders strictly necessary for external data representation. All secrets must be dynamically generated or securely referenced during deployment.
3. Explicitly use **Python 3.12 runtime** for all Lambda functions and related code, ensuring compliance with the latest language standards and avoiding deprecated features.
4. Include a basic **Policy as Code (PaC)** setup within the Pulumi stack, such as provisioning AWS Config Rules or custom compliance Lambda functions that enforce tagging and security policies either before or after deployment.
5. Implement automated infrastructure validation and deployment testing within AWS environments, strictly enforcing a monthly budget cap of **$15**.
6. Securely manage all sensitive credentials and secrets using **AWS Secrets Manager**.
7. Implement automatic rollback functionality that reverts deployments if any stage fails during the CI/CD run.
8. Provide comprehensive documentation within the same file that outlines setup instructions, follows Pulumi best practices for code organization and structure, and details pipeline integration.

The final deliverable must be a **standalone, production-ready Python Pulumi file** suitable for immediate use within the existing GitHub repository for CI/CD automation, without requiring access to or modification of internal AWS accounts or external CI/CD pipeline configurations.

---

**Project Name:** IaC - AWS Nova Model Breaking  
**Difficulty:** Expert
