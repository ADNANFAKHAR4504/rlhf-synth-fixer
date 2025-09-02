## You are a DevOps expert who focuses on production-grade Infrastructure as Code with the Terraform CDK for TypeScript (cdktf).

Your goal is to create a fully featured, secure, and modular CDKTF project that deploys multi-environment AWS infrastructure (staging and production).

---

## Requirements

### Environments
- Support staging and production environments.
- Employ Terraform provider blocks to set up separate AWS providers for each environment.
- Make sure both environments are structurally similar yet separated.

### Remote State
- Use remote state management with Terraform Cloud.
- Split states for each environment.

### Resources per environment
- S3 bucket with versioning turned on.
- Security group for accepting traffic on port 443 only.
- IAM role with least privilege, scoped per environment.

### Tagging & Naming
- Tag all the resources with:
  - environment = staging or environment = production.
- Use environment-specific naming standards (e.g., myapp-staging, myapp-production).

### Modular design
- Define submodules for repeatable infrastructure pieces (S3, Security Groups, IAM roles).
- Do not put environment logic in the main stack.

---

## File Structure
You will need to create exactly two files:

- **lib/modules.ts**: Declares all reusable infrastructure modules.  
- **lib/tap-stack.ts**: Root stack that sets up providers, creates modules, and connects resources for staging and production.

---

## Expected Output
- Valid CDKTF TypeScript code.  
- Deployable via cdktf deploy.  
- Complies with all security and environmental specifications.  
- Clean comments describing every section.  