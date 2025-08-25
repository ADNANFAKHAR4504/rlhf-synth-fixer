**Act as an expert DevOps engineer** specializing in Infrastructure as Code with Terraform and AWS. 
You will write code in **TypeScript format** for the AWS CDK for Terraform (CDKTF). 
Create **two files only**:

1. **`modules.ts`** Define Terraform AWS resources here as reusable modules, following production best practices. 
2. **`tap-stack.ts`** Instantiate all modules, configure outputs, and ensure the deployment meets the given requirements. 

**Requirements:**
- Cloud provider: AWS 
- Region: `us-west-2` 
- Tag all resources with: `Environment:Production` 
- Create a VPC with:
- One **public subnet** (with internet access) 
- One **private subnet** (no direct internet access) 
- Follow secure, production-ready AWS networking patterns:
- Internet Gateway (IGW) for public subnet
- NAT Gateway for outbound internet access from private subnet
- Use clear variable names and export outputs only from `tap-stack.ts`. 
- Follow CDKTF TypeScript best practices with proper imports and type safety.

**Deliverables:**
- Complete TypeScript code for `modules.ts` defining all Terraform AWS resources and modules. 
- Complete TypeScript code for `tap-stack.ts` instantiating the modules and exporting all required outputs. 

**Expectations:**
- Code must be clean, reusable, and aligned with Terraform and AWS production standards.
