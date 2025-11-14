Hey there! We’d like you to build a complete CI/CD pipeline using Pulumi with Python that automates the deployment of an AWS Lambda function.

Here’s what we’re looking for:

- Integrate **AWS CodePipeline** and **AWS CodeBuild** to build and deploy a Python 3.8 Lambda function automatically.
- Trigger deployments from changes in an **S3 bucket** (instead of GitHub) where updated source code archives are stored.
- Define strict **IAM roles and policies** to ensure the pipeline and Lambda have only the permissions they need.
- Configure **AWS CloudWatch** for detailed logging and monitoring of the pipeline and Lambda function.
- Encrypt all Lambda environment variables using **AWS KMS**.
- Store versioned build artifacts securely in an **S3 bucket**.
- Enable rollback capability to restore the previous version automatically in case of deployment failure.
- Ensure the entire infrastructure is defined using **Pulumi + Python** and supports repeatable deployments.

Expected output:

- a Pulumi Python program that provisions the entire CI/CD pipeline, demonstrating successful automated Lambda deployments, secure artifact management, environment isolation, and rollback functionality.
- Remember, the code should be clean, modular and following best practices
