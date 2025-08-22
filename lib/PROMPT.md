# Terraform Web Application Infrastructure Deployment

## Objective
Deploy a secure, scalable, and production-ready web application infrastructure on AWS using Terraform.

## Requirements
1. **Cloud Provider**: Use AWS as the cloud provider throughout the deployment.
2. **Networking**:
   - Implement a **Virtual Private Cloud (VPC)** with subnets across multiple availability zones.
   - Include at least **two public subnets** and **two private subnets**.
   - Configure a **NAT Gateway** to allow outbound internet access from private subnets.
3. **Compute & Load Balancing**:
   - Deploy an **Auto Scaling Group** with a minimum of **two EC2 instances**.
   - Use an **Elastic Load Balancer (ELB)** to distribute traffic evenly across EC2 instances.
4. **Database**:
   - Deploy a **Postgres RDS database instance**.
   - Enable **automatic backups** for the RDS instance.
5. **Security**:
   - Use **IAM roles and managed policies** to manage permissions for EC2 instances.
   - Apply necessary **security group rules** to allow **HTTPS traffic**.
6. **Configuration Management**:
   - Store all **application configuration data** securely in **AWS Systems Manager Parameter Store**.
7. **Monitoring & Logging**:
   - Implement **CloudWatch logging** for system and application logs.
8. **Resource Management**:
   - Ensure all AWS resources are tagged with:
     - `environment`
     - `project`
   - Use **Terraform modules** for reusability and organization.
9. **Scalability**:
   - The infrastructure must be **easily scalable** and manage resource access through **IAM roles**.

## Deliverables
Give all the infra in a single file tap_stakck.tf.
Remember to assign a prefix 274789 to all the resources so that it will be unique