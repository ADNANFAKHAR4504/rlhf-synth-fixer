**Act as a senior DevOps engineer and AWS Solutions Architect.**  
You are building a **secure, production-grade serverless infrastructure on AWS** using **CDK for Terraform (CDKTF) in TypeScript**. The environment must support **multiple Lambda functions, an API Gateway**, and implement **canary deployments** for safe rollout of new Lambda versions. Your code must be **modular**, **reusable**, and all resources must be deployed in the `us-east-1` region.

---

## 📁 Required Files

- `lib/modules.ts`  
  Contains reusable CDKTF constructs for Lambda, API Gateway, IAM roles/policies, and Canary Deployments.

- `lib/tap-stack.ts`  
  Composes the infrastructure by importing and instantiating modules, configuring canary deployments, and exporting final outputs (e.g., API URL, Lambda ARNs).

---

## 🌍 Environment

- **Cloud Provider:** AWS  
- **Region:** `us-east-1`  
- **Deployment Type:** Serverless  
- **Deployment Strategy:** Canary deployments with Lambda aliases and weighted traffic shifting  
- **Tagging (required on all resources):**
  - `Environment = dev`
  - `Project = ServerlessMicroservices`
  - `Cloud = AWS`

---

## 🛠️ Infrastructure Requirements

1. **Multiple AWS Lambda Functions**
   - Use **Lambda versioning and aliases**
   - Integrate with **AWS CodeDeploy** for **canary deployments**
   - Canary rollout must shift **10% of traffic for 5 minutes** before shifting 100%
   - Functions must be deployed and versioned using CDKTF constructs

2. **Amazon API Gateway (HTTP or REST)**
   - Publicly accessible API routes (e.g., `/v1/function1`)
   - Integrates with Lambda aliases, not directly with `$LATEST`
   - Must be modular and configurable per route

3. **IAM Roles and Policies**
   - Use **least privilege** principle
   - Each Lambda function and API Gateway component should have scoped IAM roles
   - All roles and policies must be reusable from modules

4. **Modular Infrastructure**
   - Infrastructure must be implemented in CDKTF modules under `lib/modules.ts`
   - `tap-stack.ts` is responsible only for composition and output definitions

5. **Deployment**
   - All configurations must be deployable using `cdktf deploy`
   - Canary deployments must be testable from the CLI
   - Tagging and region must be enforced through CDKTF constructs

---

## ✅ Constraints

- All AWS resources must be deployed in **`us-east-1`**
- **Canary deployments are mandatory** for Lambda using CodeDeploy and aliases
- IAM policies must follow **least privilege**
- All code must be **modularized in `modules.ts`**
- `tap-stack.ts` must only handle composition and outputs
- The infrastructure must pass **`cdktf synth`** and **`cdktf deploy`** without error

---

## 🔧 Deliverables

- `lib/modules.ts`:  
  Exports reusable CDKTF constructs for:
  - Lambda function with versioning, alias, and canary deployment config  
  - API Gateway integrated with Lambda alias  
  - IAM role and policy generator for Lambda and API Gateway  

- `lib/tap-stack.ts`:  
  Imports and wires modules together.  
  Deploys two Lambda functions behind API Gateway routes using aliases and canary deployment config.  
  Outputs:
  - Lambda function names and ARNs  
  - API Gateway endpoint URL  
  - Deployment status of canary rollout  

---