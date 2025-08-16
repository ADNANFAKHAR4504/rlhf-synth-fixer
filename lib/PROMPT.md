## **Prompt: Define Our New CI/CD Pipeline in TypeScript**

Alright, it's time to build our core CI/CD pipeline. We'll be defining the entire thing as code using **Pulumi** and **TypeScript**. The goal is a fully automated, secure pipeline that takes code from GitHub and deploys our infrastructure to AWS across multiple environments.

---

### **Infrastructure Blueprint**

Your Pulumi script needs to define the full CI/CD system itself.

#### **1. Source Control & Triggers**

- The pipeline must be connected to a **GitHub repository** with out any authentication lets use any Public repo now.
- It needs to trigger automatically based on Git pushes, supporting three distinct environments:
  - Pushes to the `main` branch deploy to the **production** stack.
  - Pushes to the `staging` branch deploy to the **staging** stack.
  - Pushes to any `feature/*` branch deploy to a dynamic **development** stack.

#### **2. The Build & Deploy Engine**

- Use **AWS CodeBuild** as the engine for our build and deployment steps.
- The build environment must be **Docker-based** to ensure consistency.
- The build process should be within CodeBuild

#### **3. Secret Management**

- The pipeline will need secrets (like a Slack webhook URL). These must be stored in **AWS Secrets Manager**.
- The CodeBuild project needs a least-privilege **IAM Role** that allows it to securely fetch these secrets at runtime. No plaintext secrets in the build spec.

#### **4. A Sample Deployment Target**

- To prove the pipeline works, the Pulumi code should also define a simple **AWS Lambda function**. The pipeline's job will be to deploy or update this Lambda based on the branch.

#### **5. Logging & Notifications**

- All build and deployment logs from CodeBuild must be sent to **Amazon CloudWatch**.
- We need real-time notifications. The pipeline must send a success or failure message to a **Slack channel** after each run. This will likely require an EventBridge rule that watches the pipeline's state and triggers a small Lambda to send the notification.

---

### **IaC Constraints Checklist**

- The entire CI/CD pipeline (CodePipeline, CodeBuild, IAM Roles, etc.) is defined with Pulumi and TypeScript.
- Connects to GitHub for source control.
- Supports `development`, `staging`, and `production` environments based on branch names.
- Uses AWS CodeBuild with a Docker environment.
- Fetches secrets securely from AWS Secrets Manager.
- Deploys a sample AWS Lambda function.
- Logs everything to CloudWatch.
- Sends success/failure notifications to Slack.

---

### **Expected Output**

- **Language**: TypeScript
- **Tool**: Pulumi.
- **Focus more on the IaC part rather than the explaining it more**
