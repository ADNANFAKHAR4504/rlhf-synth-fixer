# PROMPT

## Problem Environment
Develop an AWS CloudFormation YAML template that sets up a scalable, secure, and highly available web service in the AWS Cloud.  

### Requirements:
1. **VPC**  
   - CIDR block: `10.0.0.0/16`
2. **Subnets**  
   - Two **public** subnets and two **private** subnets, spread across two Availability Zones.
3. **NAT Gateways**  
   - One NAT Gateway in each public subnet for outbound internet connectivity from private subnets.
4. **Internet Gateway**  
   - Attach an Internet Gateway to the VPC for public subnet connectivity.
5. **Application Load Balancer (ALB)**  
   - HTTP (port 80) and HTTPS (port 443) listeners.
   - Target an Auto Scaling Group (ASG) deployed in the private subnets.
6. **VPC Endpoints**  
   - For **S3** and **DynamoDB**, to reduce internet traffic and enhance security.
7. **Security**  
   - Ensure cloud-native security best practices.
   - Private instances must not be directly accessible from the internet.
8. **Parameters**  
   - Allow parameterization for customization in different deployments.
9. **Documentation**  
   - Template must be well-commented for maintainability.

---

## Constraints:
- Must use AWS CloudFormation in YAML format.
- Must pass all compliance and infrastructure tests without errors.
- Must be deployable in a single AWS account.
- NAT Gateways must route traffic from private subnets.
- ALB must be internet-facing and distribute traffic to private ASG.
- Use VPC endpoints for S3 and DynamoDB.

---

## Proposed Statement
The challenge involves creating a production-grade AWS infrastructure using CloudFormation.  
The environment must deliver **high availability**, **security**, and **scalability** while following AWS best practices and enabling easy customization through parameters.
