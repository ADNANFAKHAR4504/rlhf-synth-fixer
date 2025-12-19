# Failure Response

## Description

The following conditions describe scenarios in which the submitted CloudFormation solution will be considered **incomplete**, **invalid**, or **unsuccessful**.

## Failure Criteria

1. **Missing or Incorrect Resource Definitions**
   - The template does **not use Amazon ECS** or fails to deploy containers using **Amazon ECR**.
   - ECS tasks are not configured with the **Fargate** launch type.
   - The template fails to define a **VPC** with **two public and two private subnets** across multiple **Availability Zones**.

2. **Load Balancer Misconfiguration**
   - An **Application Load Balancer** is not created.
   - The ALB is not connected to the ECS service or does not distribute traffic correctly.

3. **Auto Scaling Not Implemented**
   - ECS service does **not scale** based on **CPU utilization**.
   - Missing or misconfigured **CloudWatch alarms** for scaling triggers.

4. **IAM Role Issues**
   - ECS task role is **not created** or lacks **permissions to write logs to CloudWatch**.

5. **DNS Configuration Missing**
   - **Amazon Route 53** is not used.
   - No **custom domain** is configured for the application.

6. **Tagging Omitted**
   - Resources are **not tagged** with the required key-value pair:  
     `Environment: Production`.

7. **Outputs Not Defined**
   - The template does **not output** the **public DNS name of the Application Load Balancer**.

8. **Template Format or Structure Errors**
   - Template is **not written in JSON**.
   - **YAML format** or multiple template files are used.
   - Contains **syntax errors** or fails to **pass validation** using the AWS CLI.

9. **Manual Configuration Required**
   - Any part of the infrastructure requires **manual steps** after stack creation (e.g., configuring DNS, setting up auto-scaling policies).

10. **Template Validation Fails**
    - Template does not pass validation via:  
      ```
      aws cloudformation validate-template --template-body file://template.json
      ```