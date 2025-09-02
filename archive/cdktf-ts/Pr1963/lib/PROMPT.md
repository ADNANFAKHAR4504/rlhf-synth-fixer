# CDKTF TypeScript Production-Ready Infrastructure Prompt

Generate **production-ready CDKTF TypeScript code** for AWS infrastructure with the following specifications:

## Requirements
1. **VPC** spanning **3 Availability Zones** in `us-east-1`.
2. Include **public and private subnets** in each AZ for security best practices.
3. Deploy an **Auto Scaling Group (ASG)** that launches **EC2 instances** in the **private subnets**.
4. Each EC2 instance must have an **IAM Role** with **read-only access to S3**.
5. Create a **NAT Gateway** in one of the **public subnets** to provide internet access for EC2 instances in private subnets.
6. Use resource naming conventions with prefix **"MyApp-"**.
7. Add **tags** to all resources:
   - `Project: MyApp`
8. Use **AWS default account settings** and region `us-east-1`.
9. Organize the project into **two files only**:
   - `lib/tap-stack.ts` → Root stack, composes/instantiates all modules.
   - `lib/modules.ts` → Contains reusable modules (VPC, EC2/ASG, IAM, NAT, etc.).
10. The output must be a **single deployable CDKTF project** with a stack named **`myapp-infrastructure`**.

## Expected Output
- Fully working **TypeScript code**.
- **Two files only** (`lib/tap-stack.ts` and `lib/modules.ts`).
- Production-grade structure with reusable modules and clear naming.
- Code should be **ready to run `cdktf deploy`** without modification.
