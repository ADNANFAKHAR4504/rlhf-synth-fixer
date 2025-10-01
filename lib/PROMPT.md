Create a production-ready AWS CDKTF TypeScript project in **us-west-2** with only:

- `lib/tap-stack.ts` (main stack wiring modules)  
- `lib/modules.ts` (reusable modules: ASG, ELB, RDS, S3, IAM, CloudWatch, SNS).  

### Requirements
- **VPC**: use default, span at least 2 AZs.  
- **ASG**: EC2 instances across AZs, detailed monitoring, CPU-based scaling policies.  
- **ELB**: distribute traffic across ASG.  
- **CloudWatch + SNS**: alarms on CPU → trigger scaling + notify ops team.  
- **RDS**: Multi-AZ, automated backups, Secrets Manager for credentials.  
- **S3**: bucket for logs, versioning enabled.  
- **IAM**: least-privilege roles for EC2, RDS, etc.  
- **Tags**: all resources tagged with `Environment=Production`.  

### Constraints
- Only output the **two TS files**, with filename headers.  
- Code must run with `cdktf synth` (no placeholders/TODOs).  
- Must be modular, clean, and deployable end-to-end.  