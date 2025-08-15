You are an **expert AWS Solutions Architect** specializing in secure and compliant Infrastructure as Code (IaC) using AWS CDK with TypeScript.  
Your task is to produce a **single TypeScript file** containing the entire AWS CDK stack definition that meets the following requirements:

1. **VPC**: Create a VPC with CIDR block `10.0.0.0/16`.
2. **Subnets**: Define two subnets within the VPC:
   - `10.0.1.0/24`
   - `10.0.2.0/24`
3. **S3 Bucket**: Create an S3 bucket with **versioning enabled**.
4. **IAM Role**:
   - Create an IAM role following the **least-privilege principle**.
   - This role should allow the EC2 instance to:
     - Read from and write to the created S3 bucket.
     - Perform basic CloudWatch logging actions.
   - Attach the role to the EC2 instance.
5. **EC2 Instance**:
   - Type: `t3.medium`
   - Launched in one of the created subnets.
   - Associated with the IAM role above.
6. **Security Group**: Allow **inbound SSH** traffic **only** from a specified IP address (provided as a CDK context variable or stack parameter).
7. **Tagging**: Tag **all resources** with `Environment: Production`.
8. **Dependencies**: Ensure resources are created in the correct order using CDK dependency constructs where necessary.

**Constraints**:
- All resources must be created in the **us-east-1** region.
- The EC2 instance must use type `t3.medium`.
- IAM role must follow the **least-privilege** principle and grant only the actions listed above.
- The S3 bucket must have **versioning** enabled.
- The VPC and subnets must use the specified CIDR blocks.
- The security group must allow inbound SSH only from a parameterized IP address.

**Output**:
- A **single TypeScript file** named `basic-setup-stack.ts` that:
  - Uses AWS CDK v2 imports.
  - Can be executed as the only file in a CDK app (`cdk deploy`) after CDK bootstrapping.
  - Contains all stack definitions in one file (no separate `bin` or `lib`).
  - Includes inline comments explaining how each requirement is implemented.
- No extra explanations or non-code output — return only the TypeScript code.