## Prompt: IoT Monitoring System Deployment with Terraform

### User Prompt

You are an expert Terraform engineer following AWS best practices.  
Create a complete `tap_stack.tf` file to deploy a secure, highly available IoT monitoring system for an agriculture firm that monitors 50,000 IoT sensors.

The infrastructure must:
- Process real-time IoT sensor data.
- Provide analytics dashboards for insights.
- Trigger alerts on anomalies.
- Ensure secure device authentication and communication.
- Be highly available and fully automated.

---

### Key Requirements

1. **Provider Setup**  
   - The provider configuration already exists in `provider.tf`.  
   - The region is passed using an existing variable:
     ```
     variable "aws_region" {
       description = "AWS region for deployment"
       type        = string
     }
     ```
   - Do not redefine the provider in `tap_stack.tf`.

2. **New Stack Creation**  
   - This file (`tap_stack.tf`) should create all modules from scratch — not reference or import any existing infrastructure.

3. **Resources to Include**  
   - IoT Core for secure device connectivity and MQTT messaging.  
   - IAM Roles and Policies for IoT, Lambda, and Kinesis services.  
   - Kinesis Data Stream for ingesting high-volume real-time data.  
   - Lambda Functions for real-time processing of incoming sensor data.  
   - DynamoDB Table to store processed sensor data with high availability.  
   - EventBridge Rule for anomaly detection and triggering alerts.  
   - SNS Topic for sending alerts or notifications.  
   - CloudWatch Metrics and Alarms for system health and anomaly detection.  
   - QuickSight Dataset and Dashboard for visual analytics on sensor data.  
   - KMS Key to encrypt sensitive data at rest and in transit.  
   - VPC (optional) for securing Lambda and Kinesis with private subnets.

4. **Best Practices**  
   - Apply least-privilege IAM roles.  
   - Enable KMS encryption for all applicable services.  
   - Configure CloudWatch Logs for every Lambda and Kinesis resource.  
   - Use standard tags such as `Environment`, `Owner`, `CostCenter`, and `Application`.  
   - Include outputs for important resource ARNs, endpoints, and dashboard URLs.  
   - Include variable declarations with defaults and descriptions.  
   - Follow Terraform 1.x syntax standards and modular design principles.

---

### Deliverables

Produce a single Terraform file named `tap_stack.tf` containing:
- Variable declarations.  
- Resource definitions.  
- Output blocks.  
- Complete and consistent logic using AWS best practices.  

No external modules or files should be referenced.

---

### Output Format

Return your answer as Terraform code in one fenced block: