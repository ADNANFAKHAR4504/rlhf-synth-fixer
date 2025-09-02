Create a secure, modular, production-ready CDKTF project that deploys staging and production AWS environments.
here are my Requirements:

### Environments
- Support **staging + production**, structurally similar but isolated.  
- Separate AWS providers + Terraform Cloud remote state per environment.  

### Resources (per env)
- **S3 bucket** with versioning.  
- **Security Group** allowing only port 443.  
- **IAM role** with least privilege, scoped to env.  

### Naming & Tags
- Env-specific names (e.g., `myapp-staging`, `myapp-production`).  
- Tag all resources with `environment=staging|production`.  

### Modularity
- Reusable modules (S3, SGs, IAM).  
- Keep env logic **out of main stack**.  

---

## File Structure
- `lib/modules.ts` – defines reusable modules.  
- `lib/tap-stack.ts` – root stack, sets up providers, creates modules, wires staging + production.  

---

## Output
- Valid **CDKTF TypeScript**.  
- Deployable with `cdktf deploy`.  
- Secure, compliant, and well-commented.  
