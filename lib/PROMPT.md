---

# CI/CD Pipeline with AWS CDK (TypeScript)

Your job is to design and implement a complete CI/CD pipeline using **AWS CDK** with **TypeScript**. The pipeline should automate the build and deployment of an enterprise web application, while keeping security, reliability, and maintainability in mind.

---

## Task: Build a CDK Stack for the CI/CD Pipeline

Write a full **TypeScript** CDK stack that creates an end-to-end pipeline with these requirements:

1. **Pipeline Orchestration** – Use **AWS CodePipeline** to handle the workflow from source through deployment.
2. **Build Stage** – Use **AWS CodeBuild** to compile and package the web application. It should support a standard web app build process.
3. **Deployment Stage** – Deploy with **AWS CodeDeploy** to multiple EC2 instances.
4. **Custom Validation** – Add a step using **AWS Lambda** for custom checks before production deployment.
5. **Notifications** – Set up **Amazon SNS** to send alerts for pipeline events (success or failure).
6. **Manual Approval** – Include a manual approval step before deploying to production.
7. **Multi-Region Support** – Design the pipeline so it can work across multiple AWS regions.
8. **Secure Parameters** – Store configuration and secrets in **AWS Systems Manager Parameter Store** and retrieve them at runtime.
9. **Resource Tagging** – Apply the tag `Environment: Production` to every resource created.
10. **IAM Security** – Create **least-privilege IAM roles** for CodePipeline, CodeBuild, CodeDeploy, Lambda, and related services.

---

## What to Deliver

* A single **TypeScript** file that defines the CDK stack.
* All imports included.
* Clear inline comments explaining each resource and how they connect.
* Code should be clean, readable, and easy to extend.
* A sample `cdk.json` file to run the stack.
* A short, step-by-step guide on how to initialize and deploy the project.

---

## Extra Notes

* The pipeline is for an enterprise web application, so it should be resilient and secure.
* Assume existing IAM policies and VPC configurations already exist; you don’t need to define them in the stack.
* Focus on making the pipeline easy to maintain and extend in the future.

---