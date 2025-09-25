# Cloud Security Configuration with AWS CloudFormation  

## Objective  
Design and implement a secure cloud environment using **AWS CloudFormation** in YAML format. The goal is to enforce robust security measures for Amazon EC2 instances, ensure compliance with AWS best practices, and maintain flexibility for environment-specific configurations.  

## Problem Statement  
You have been tasked with creating a CloudFormation template that provisions EC2 instances and applies strict security configurations. The solution must control network access, enforce least-privilege permissions, encrypt sensitive data, and enable monitoring for operational visibility. Additionally, resources should comply with organizational naming conventions and must be protected from accidental modifications during stack updates or deletions.  

## Functional Requirements  
Your CloudFormation template must:  
1. **Security Groups**  
   - Define inbound and outbound rules for EC2 instances.  
   - Inbound SSH (port 22) should be limited to specific IP addresses.  
   - Outbound traffic should be restricted to **HTTPS (port 443) only**.  

2. **Parameterization**  
   - Allow IP addresses to be passed as parameters for environment-specific flexibility without modifying the core template.  

3. **IAM Roles**  
   - Assign IAM roles to EC2 instances with **least privilege policies**.  
   - Roles must grant only the required permissions for **S3 read access** and **CloudWatch monitoring**.  
   - Ensure IAM trust policies allow EC2 to assume the role.  

4. **Data Protection**  
   - Encrypt all Amazon EBS volumes using **AWS KMS**.  

5. **Monitoring**  
   - Enable **detailed CloudWatch monitoring** on EC2 instances.  

6. **Networking and Naming**  
   - Ensure all resources are created inside a specified **VPC**.  
   - Apply a naming convention: `[ProjectName]-[ResourcePurpose]-[Environment]`.  

7. **Stack Protection**  
   - Implement **stack policies** to prevent accidental deletion of critical resources during updates or deletions.  

## Constraints  
- Use **only AWS CloudFormation** to define resources.  
- Ensure that each security group is explicitly associated with the relevant EC2 instance.  
- All IP addresses must be configurable via parameters.  
- Template must be valid and pass **AWS CloudFormation validation**.  

## Deliverables  
- A YAML file named **`TapStack.yaml`** that:  
  - Implements all the above requirements.  
  - Passes AWS CloudFormation’s template validator.  
- Documentation within the template (via comments) explaining key configuration decisions.  
