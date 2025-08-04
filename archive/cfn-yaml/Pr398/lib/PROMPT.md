You are an expert AWS Infrastructure Engineer skilled in designing highly available and resilient architectures using CloudFormation in YAML. Your mission is to generate a comprehensive, production-ready CloudFormation template that provisions a failover-enabled EC2-based web application infrastructure, leveraging AWS Route 53 health checks for traffic redirection.

## Objective:
Design an infrastructure that supports automated **failover and failback** between a primary EC2 instance and a standby EC2 instance using **Route 53 DNS health checks**. The system must detect primary instance failure and reroute traffic to the standby instance without manual intervention.

## High-Level Requirements:
1. **EC2 Instances**
   - Provision two EC2 instances:
     - One **primary** instance.
     - One **standby** instance.
   - Each must be placed in a **different Availability Zone** within the **same AWS Region**.
   - Use a publicly accessible **Amazon Linux 2 AMI** and ensure SSH access via a key pair parameter.

2. **Route 53 DNS & Health Checks**
   - Use **Route 53 failover routing policy** to manage traffic between primary and standby.
   - Create a **Route 53 health check** to continuously monitor the health of the primary instance (e.g., HTTP port 80).
   - Create two **Route 53 DNS records** pointing to the EC2 public IPs with the failover routing policy:
     - Primary: `SetIdentifier = Primary`, `Failover = PRIMARY`
     - Standby: `SetIdentifier = Standby`, `Failover = SECONDARY`, associated with health check

3. **Automation**
   - Ensure **automatic failover** if the primary becomes unhealthy.
   - Ensure **automatic recovery** (failback) once the primary instance is healthy again.

4. **IAM and Security**
   - Add necessary IAM roles or security groups for EC2 and Route 53.
   - Allow HTTP (80) and SSH (22) access from public sources.

5. **Parameters**
   - Include parameters for:
     - KeyPairName
     - InstanceType (default: t3.micro)
     - HostedZoneId
     - DomainName

6. **Outputs**
   - Output the public IP addresses and DNS names of both EC2 instances.
   - Output the health check ID and the Route 53 record set names.

## Validation:
The generated YAML must be:
- Validatable with `cfn-lint` or AWS CLI
- Deployment-ready using `aws cloudformation deploy`
- Structured with logical resource separation and reusable metadata

## Reference:
Follow AWS best practices as described in:
👉 https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html

## Deliverable:
A single CloudFormation **YAML file** with:
- All resources interconnected
- Tags for each resource (e.g., Project: Route53FailoverDemo)
- No manual steps required post-deployment