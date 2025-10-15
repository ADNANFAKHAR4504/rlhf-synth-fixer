You are an expert AWS Cloud Architect specializing in Infrastructure as Code using AWS CDK with TypeScript. You produce clean, modular, and deployable TypeScript code that adheres to AWS best practices, security principles (least privilege), and cost optimization.

---

### **USER PROMPT**

You are tasked with implementing a **CI/CD pipeline** using **AWS CodePipeline** in **TypeScript-based AWS CDK**.
The output must contain **exactly two files**:

1. `main.ts` – entry point that initializes the app and the stack.
2. `cicd-stack.ts` – defines all infrastructure resources.

Your goal is to design a **production-ready pipeline** that connects **GitHub source**, **CodeBuild build**, **manual approval**, and **CloudFormation deployment**, while meeting all constraints below.

---

### **Context:**

Environment involves multiple AWS regions (`us-east-1`, `us-west-2`).
All resource names use **kebab-case**.
Resources must be **tagged** for cost and compliance (`project`, `env`, `owner`).
IAM roles follow **least privilege**.
VPCs already exist per organizational CIDR policy.

---

### **Requirements:**

1. Integrate **AWS CodePipeline** with a **GitHub repository** as the source stage.
2. Deploy a **CloudFormation stack** using **CloudFormation actions**.
3. Include a **build stage** using **AWS CodeBuild**, with buildspec tests that must pass.
4. Add a **manual approval** action between build and deploy stages.
5. Use **IAM roles** with minimal permissions for each stage.
6. Stream logs from all stages to **CloudWatch Logs**.
7. Tag every resource for **auditing and tracking**.
8. Securely manage environment variables using **AWS SSM Parameter Store**.
9. Implement **multi-region deployment** using **StackSets**.
10. Enable **automatic rollback** on failed deployments.
11. Encrypt **artifacts S3 bucket** with **KMS (SSE-KMS)**.
12. Trigger pipeline on **pull requests and main branch pushes**.
13. Send **SNS notifications** on pipeline execution failures.
14. Add **CodeBuild caching** for faster builds.
15. Limit **concurrent pipeline executions**.
16. Define **CloudWatch alarms** for key pipeline stages.
17. Ensure **cost optimization** across all services.

---

### **Expected Output:**

* ✅ **Two TypeScript files only:**

  * `main.ts`
  * `cicd-stack.ts`
* ✅ Uses AWS CDK v2 syntax (`aws-cdk-lib` imports).
* ✅ All resources connected logically (GitHub → CodeBuild → Approval → CloudFormation Deploy).
* ✅ Includes meaningful class names (`CicdPipelineStack`, etc.).
* ✅ Fully deployable and syntactically correct.
* ✅ Each resource tagged and commented for clarity.
* ✅ Use `StackProps` pattern for environment configuration.
* ✅ Use placeholders where appropriate (e.g., GitHub repo, branch, KMS key).
* ✅ Include IAM role definitions inline.

---