## Prompt

You are tasked with deploying a web application on AWS using Terraform, with a focus on scalability, reliability, and high availability. The infrastructure must run on AWS as the cloud provider and be deployed across at least two regions to ensure resilience against regional failures. All incoming traffic should be routed through an AWS Application Load Balancer to provide efficient traffic distribution. The application data should be stored in an Amazon RDS instance with automatic backups enabled for data protection and recovery. Additionally, the environment should be designed to scale automatically, adjusting the number of EC2 instances in response to changing traffic loads to ensure consistent performance.

*** instruction ***

Expected output: Provide an HCL Terraform script that defines the infrastructure meeting the above requirements. The script should successfully create resources and pass validation checks when applied using the Terraform CLI.

Deploy a web application to AWS using Terraform. The application should be available in multiple regions, with robust networking and database configurations, maintaining high availability and scalability.