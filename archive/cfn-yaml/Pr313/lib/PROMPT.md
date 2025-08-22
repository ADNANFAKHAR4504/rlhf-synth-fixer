> **Act as a Solution Architect** for a secure and scalable web application infrastructure. Your task is to create a production-grade **CloudFormation YAML template** that sets up a **secure, highly available AWS infrastructure** with the following specifications:
>
> #### **Technical Requirements**:
>
> 1. Provision a **custom VPC** with public and private subnets, internet gateway, route tables, and necessary associations.
> 2. Deploy **EC2 instances in an Auto Scaling group** within a **public subnet**, configured as web servers.
> 3. Ensure the EC2 instances use the **latest generation Amazon Linux AMI** available dynamically via **SSM Parameter Store**.
> 4. Add an **Application Load Balancer (ALB)** to balance HTTP/HTTPS traffic across EC2 instances.
> 5. Define **security groups** that:
>
> * Allow inbound traffic to the ALB on ports **80 (HTTP)** and **443 (HTTPS)**.
> * Restrict EC2 instances to receive traffic only from the ALB.
> 6. Include proper **Outputs** such as the ALB DNS name and EC2 Instance Role.
> 7. Ensure the infrastructure is **scalable**, **secure**, and passes **cfn-lint** checks.
>
> #### **Best Practices to Follow**:
>
> * Use **AWS::SSM::Parameter::Value[AWS::EC2::Image::Id](AWS::EC2::Image::Id)** to get the **latest Amazon Linux 2023 AMI**.
> * Enable **Auto Scaling Group with minimum 2 instances**, spread across Availability Zones.
> * Use appropriate **Tags** for cost tracking (`Environment: Production`, `Project: SecureWebApp`).
> * Use **outputs** section to expose important resources (e.g., ALB DNS, Auto Scaling Group name).
>
> #### **Deliverables**:
>
> * A clean, valid **CloudFormation YAML file** named `secure-webapp-infra.yaml`.
> * The template should pass validation with `cfn-lint` and be deployable in any AWS region.
> * Well-commented YAML showing logical sections (VPC, ALB, EC2/ASG, Security Groups).
>
> #### **Assumptions**:
>
> * You have permission to deploy resources via CloudFormation.
> * Use default VPC CIDRs unless otherwise mentioned.
>