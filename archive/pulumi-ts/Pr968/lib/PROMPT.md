# Secure, Self-Auditing EC2 Infrastructure with Pulumi & TypeScript

**Role**: You are a senior DevSecOps Engineer specializing in cloud security automation. Your primary expertise is using Infrastructure as Code (IaC) with Pulumi and TypeScript to build secure, compliant, and self-auditing environments on AWS.

**Objective**: Generate a complete, well-structured Pulumi TypeScript project that provisions a highly secure and continuously monitored EC2 instance in the `us-west-2` region. The solution must be production-ready, ensuring that any unauthorized changes to its network security posture are immediately detected and trigger an alert.

---

## High-Level Architecture Scenario: A Hardened Web Server

You are tasked with deploying a critical web server that processes sensitive information. The security requirements are non-negotiable: the server's network access must be strictly limited, its storage must be encrypted, and any modification to its firewall rules must trigger an immediate email alert to the security administration team (`paul.s@turing.com`).

---

## Detailed Infrastructure & Resource Connectivity

Your Pulumi project must provision the following interconnected resources, demonstrating a robust and secure design pattern.

### **SNS for Notifications (The Alerting Endpoint)**

- Provision an **SNS Topic** that will serve as the destination for security alerts.
- Create an **SNS Topic Subscription** to send notifications from this topic to the email address `paul.s@turing.com`.

### **Security Group (The Network Firewall)**

- Provision a dedicated **Security Group** for the EC2 instance.
- **Connection & Security**: This security group must be configured with ingress rules that **only** allow HTTP (port 80) and HTTPS (port 443) traffic from the specific IP range `203.0.113.0/24`. All other inbound traffic must be denied.
- Create a New VPC for EC2 in Public Subnet

### **Event-Driven Monitoring (The Core Connection)**

This is the critical system that connects resource changes to notifications.

- **EventBridge Rule**: Provision an **EventBridge (CloudWatch Events) Rule** to act as a security event listener. This rule must be configured with a precise `eventPattern` to detect changes to the specific Security Group created above. The pattern must filter for CloudTrail API calls related to security group modifications:
  - `source`: `["aws.ec2"]`
  - `detail-type`: `["AWS API Call via CloudTrail"]`
  - `detail.eventName`: `["AuthorizeSecurityGroupIngress", "AuthorizeSecurityGroupEgress", "RevokeSecurityGroupIngress", "RevokeSecurityGroupEgress"]`
  - **Crucial Connection**: The pattern must also filter for the specific resource ID. Use the `id` output from the Security Group resource you created as a value in the event pattern. This ensures the rule _only_ triggers for changes to _this specific_ security group.
- **EventBridge Target**: Create an **EventBridge Target** that connects the rule to the alert system.
  - **Connection**: This target must link the EventBridge Rule to the SNS Topic, completing the alerting pipeline from event detection to notification.

### **EC2 Instance (The Hardened Compute)**

- Provision an **EC2 Instance** (e.g., `t3.micro`).
- **Connection & Security**:
  - Associate this instance with the **Security Group** created above.
  - **Best Practice - Encryption by Default**: To ensure all volumes are encrypted, add a comment explaining the modern best practice of enabling **EBS encryption by default** at the AWS account/region level. For the purpose of this script, however, explicitly set the `ebsBlockDevices` and `rootBlockDevice` configurations with `{ encrypted: true }` to guarantee compliance within the code.

---

## Mandatory Constraints Checklist

Ensure your generated Pulumi project explicitly implements every one of these constraints:

- **Security Group Lockdown**: The security group must only allow HTTP and HTTPS traffic exclusively from the `203.0.113.0/24` IP range.
- **Mandatory Volume Encryption**: The EC2 instance's root and any attached data volumes must be configured for encryption.
- **Real-time Change Auditing**: The EventBridge rule must be correctly configured to listen for changes _only_ on the created security group.
- **Automated Email Notification**: The entire chain from EventBridge to the SNS Topic and email subscription must be correctly provisioned to alert `paul.s@turing.com`.

---

## Expected Output Format

- **Language**: TypeScript
- **Tool**: Pulumi
