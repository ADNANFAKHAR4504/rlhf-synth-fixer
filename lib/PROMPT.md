```
I need a production-ready CDKTF solution in TypeScript that deploys a multi-tier web application on AWS.
The project should be cleanly structured into exactly two files (lib/modules.ts and lib/tap-stack.ts).
The code must:
Work out of the box (fully functional).
Be clear and well-commented.
Deploy using only the cdktf CLI.
What I’m Looking For
 Centralized Security Management
All Security Groups and their rules should be defined in tap-stack.ts.
This way, the entire network security posture is visible in one place.
Each module should accept security group IDs as inputs, not create them internally.
 Remote State Management
Use a secure S3 backend to store the Terraform state file.
 Secrets Management
The database password should come from AWS Secrets Manager, not be hardcoded in the code.
No credentials or passwords should ever appear directly in the source.
 Least Privilege Access
The EC2 instance IAM role should follow least privilege principles.
It should only have:
SSM access (so we can connect via AWS Systems Manager instead of SSH keys).
Minimal required permissions for networking or S3 if needed.
```