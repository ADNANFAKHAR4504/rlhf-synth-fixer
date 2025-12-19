### Reasoning Trace
---

The user has provided a template for a request but hasn't actually filled in the specific values for:
- {{aws_region}}
- {{resource_constraints}}  
- {{project_name}}

They want me to create a deliverable CDK project but haven't specified what infrastructure they actually want me to create. The template shows they want 8 specific files, but without knowing what the actual infrastructure should be, I can't generate meaningful content.

I should ask them to provide the specific values for these placeholders and clarify what infrastructure they want me to create.
### Answer 
---

I see you've provided a comprehensive template for generating CDK infrastructure code, but you haven't filled in the specific placeholders yet. To generate the complete deliverable, I need you to specify:

1. **{{aws_region}}** - Which AWS region? (e.g., `us-east-1`, `eu-west-1`)
2. **{{resource_constraints}}** - What specific infrastructure do you want? (e.g., "Create a VPC with 2 public subnets, an ALB, and 2 EC2 instances t3.micro")
3. **{{project_name}}** - What should the project be named? (e.g., `web-app`, `api-service`)

Here's an example of how to complete your request:

```
I need a deliverable that I can drop into a TypeScript AWS CDK project and deploy with `cdk deploy`. Produce the files I request below, with full contents.

Constraints:
- AWS Region: us-east-1
- Use CDK v2 (aws-cdk-lib) and TypeScript.
- Resource constraints: Create a VPC with CIDR 10.0.0.0/16, 2 public subnets (10.0.1.0/24, 10.0.2.0/24), an Application Load Balancer, and 2 EC2 instances (t3.micro) running a simple web server
- Security: minimize IAM privileges; follow least privilege for instance role.
- Naming: use clear logical names and avoid collisions; allow CDK defaults where necessary.
- Single-file infra: Put the complete infra in `lib/web-app-stack.ts`.

Generate the files
```

Once you provide these details, I'll generate all 8 files with complete, ready-to-deploy CDK code.