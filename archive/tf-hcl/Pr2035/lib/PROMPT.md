I need to create a multi-region web application infrastructure using Terraform HCL. The setup should deploy the same application across at least two AWS regions for high availability.

Requirements:
- VPC with subnets and gateways in each region
- Application Load Balancer to distribute traffic across EC2 instances
- Auto-scaling groups that scale based on CPU usage
- IAM roles and security groups following least privilege principle
- Consistent application deployment across all regions

The infrastructure should use proper naming conventions like `appname-region-identifier` and handle regional failover. Please create Terraform HCL files that can be deployed and tested in AWS.

Focus on creating clean, maintainable code with good security practices. Avoid over-engineering and keep the deployment time reasonable. All the HCL code should be placed in a single `tap-stack.tf` file, and you should assume the `provider.tf` will already be provided.