Create a CDKTF TypeScript project that securely deploys staging and production AWS environments.  

### Requirements
- **Environments**: staging + production, isolated but structurally similar.  
- **State**: separate AWS providers + Terraform Cloud remote state per env.  
- **Resources (per env)**:  
  - S3 bucket with versioning  
  - Security Group (only port 443)  
  - IAM role (least privilege, scoped to env)  
- **Naming/Tags**: env-specific names (`myapp-staging`, `myapp-production`), tag all resources with `environment=staging|production`.  
- **Modularity**: reusable modules (S3, SG, IAM); no env logic in main stack.  

### File Structure
- `lib/modules.ts` → reusable modules  
- `lib/tap-stack.ts` → providers + wiring staging/production  

### Output
- Valid **CDKTF TypeScript**  
- Deployable with `cdktf deploy`  
- Secure, modular, and well-commented  
