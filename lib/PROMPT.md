***

As an expert AWS Cloud Engineer, your task is to design and implement a complete CI/CD pipeline using AWS CDK and **TypeScript**. Your primary mission is to build a robust infrastructure that automates the build and deployment of an enterprise web application, with a strong focus on connecting and integrating all resources seamlessly.

---

### **Task: Generate a CDK Stack for a CI/CD Pipeline**

Please write a complete **TypeScript** CDK stack that defines an end-to-end CI/CD pipeline with the following specifications:

1.  **Orchestration:** Use **AWS CodePipeline** to orchestrate the entire workflow, from source to deployment.
2.  **Build Stage:** Implement **AWS CodeBuild** to perform the application build. This stage must be capable of handling a standard web application build process.
3.  **Deployment Stage:** Leverage **AWS CodeDeploy** for managing the deployment of the application across multiple EC2 instances.
4.  **Custom Validation:** Integrate **AWS Lambda** functions within the CodePipeline to perform custom validation checks at a specific stage, such as before a production deployment.
5.  **Notifications:** Configure **Amazon SNS** to send notifications for all pipeline stage changes, providing real-time updates on success or failure.
6.  **Manual Approval:** Incorporate a **Manual Approval** action within the CodePipeline at a critical stage (e.g., before deploying to production) to ensure human oversight.
7.  **Multi-Region Capability:** The pipeline architecture must be designed to be cross-region compatible, allowing for deployments to different AWS regions.
8.  **Secure Parameters:** Use **AWS Systems Manager Parameter Store** to securely store and retrieve configuration parameters for the pipeline, such as environment-specific variables or secrets.
9.  **Resource Tagging:** Ensure that all AWS resources created by the stack are tagged with `Environment:Production`.
10. **IAM Best Practices:** Define **least privilege IAM roles** for all services involved (`CodePipeline`, `CodeBuild`, `CodeDeploy`, `Lambda`, etc.) to restrict access to only the necessary resources and actions.

---

### **Output Requirements**

* Provide a single, complete **TypeScript** file for the CDK stack.
* Include all necessary imports and clear, detailed **inline comments** explaining the purpose of each resource and the connections between them.
* Structure the code to be clean, readable, and easy to extend.
* Provide a sample `cdk.json` file that would be used to deploy this stack.
* Include a concise set of **deployment instructions** on how to initialize the project and deploy the stack.

---

### **Additional Context**

The target environment is for a robust enterprise web application. The pipeline should be resilient to changes and leverage existing IAM policies and VPC configurations where possible (you may assume these exist for the sake of the prompt but do not need to create them in the code). The goal is to create a maintainable and secure CI/CD process.