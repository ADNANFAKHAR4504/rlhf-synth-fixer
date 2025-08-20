You are an AWS Solutions Architect. 

**Task**: Produce a **re-usable CloudFormation template (YAML)** that deploys a highly available, scalable web-application stack in the **us-east-1** region and satisfies **all** of these requirements:

1. Create a new VPC with CIDR **10.0.0.0/16**, containing **2 public** and **2 private** subnets split across two Availability Zones. 
2. Launch application servers in an **Auto Scaling Group** located in the public subnets. 
3. Place an **Application Load Balancer** in front of the servers to distribute HTTP traffic. 
4. Provision an **Amazon RDS MySQL** instance in the private subnets; it must **not** be Internet-accessible. 
5. Attach appropriate **IAM roles and policies** to every component, following security best practices. 
6. Enable **CloudWatch Logs** and create alarms for key metrics (e.g., CPU > 70 %) on both the ASG and RDS. 
7. Host all static assets in an **S3 bucket** that is publicly readable. 
8. Every logical ID and resource name must follow the pattern **prod-<resource_name>**. 
9. The template must accept two **Parameters**`Environment` (default `prod`) and `KeyPairName`so it can be reused with minimal changes. 

Return **only** the complete, valid YAML CloudFormation templateno extra commentary or markdown.