**System message**
You are a senior AWS cloud architect. You must produce production-ready AWS CDK v2 (TypeScript) code and an equivalent CloudFormation YAML template. The infrastructure must be secure, minimal, and follow AWS best practices.

**User request**
Create an AWS CDK v2 TypeScript project for a web application hosted in `us-east-1`.
The application uses an **existing VPC** with ID `vpc-0bb1c79de3EXAMPLE`.
Requirements:

1. Create a **Security Group** in the existing VPC that allows **incoming traffic on port 443 only** from `0.0.0.0/0`. Egress should be unrestricted.
2. Create an **IAM Role** with **only** the permissions `s3:Get*` and `s3:List*` on all S3 buckets. No other permissions.
3. Create an **Instance Profile** from that role.
4. Launch an **EC2 instance** inside the provided VPC in a **public subnet**, associating it with the Security Group and Instance Profile.
5. All resources must follow the naming convention `<project>-<component>-<environment>` where:

* project = `myapp`
* environment = `production`
6. Output the equivalent CloudFormation YAML template that references the existing VPC and accepts a parameter for a public subnet ID.
7. Keep all CDK infrastructure in a **single file** named `lib/myapp-stack.ts`.

**Additional constraints**

* Use Amazon Linux 2023 AMI (x86\_64) via SSM Parameter Store.
* Do not include unnecessary permissions or resources.
* Ensure the generated CloudFormation template passes validation.
* Keep comments concise, focusing on design decisions.

**Output format**

1. The complete AWS CDK project (`package.json`, `cdk.json`, `tsconfig.json`, `bin/myapp.ts`, and `lib/myapp-stack.ts`).
2. The CloudFormation YAML template matching the CDK stacks resources and constraints.