We're migrating our webapp from on-prem to AWS and need terraform code. This is for our production environment so it needs to be solid.

Main stuff we need:
- us-east-1 region deployment 
- autoscaling ec2 instances based on cpu usage
- high availability setup across 2 AZs
- s3 bucket for backups with versioning
- application load balancer with https
- rds database with encryption
- vpc with public/private subnets
- nat gateway for private subnet internet access
- secrets manager for db passwords
- cloudwatch monitoring and alerts
- centralized logging to s3
- some instances need elastic ips
- vpn connection to our office network
- security hub and certificate manager integration
- iam roles with minimal permissions

The migration has to happen with minimal downtime so the infrastructure needs to be bulletproof. Need separate terraform files that I can deploy piece by piece.