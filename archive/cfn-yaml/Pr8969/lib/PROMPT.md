You are an expert AWS Infrastructure Engineer skilled in designing highly available and resilient architectures using CloudFormation in YAML. Your mission is to generate a comprehensive, production-ready CloudFormation template that provisions a failover-enabled EC2-based web application infrastructure, leveraging AWS Route 53 health checks for traffic redirection.

## Objective:
Build a failover system where **Route 53 health checks continuously monitor the primary EC2 instance**. When the health check detects the primary instance is down, **Route 53 automatically redirects DNS traffic to the standby EC2 instance**. Once the primary recovers and the health check passes again, **Route 53 switches traffic back to the primary**. This entire failover and recovery process happens automatically through the Route 53-to-EC2 connection without any manual intervention.

## High-Level Requirements:
1. **EC2 Instances**
   - Provision two EC2 instances:
     - One **primary** instance.
     - One **standby** instance.
   - Each must be placed in a **different Availability Zone** within the **same AWS Region**.
   - Use a publicly accessible **Amazon Linux 2 AMI** and ensure SSH access via a key pair parameter.

2. **Route 53 DNS & Health Checks - Service Connectivity**
   - **Route 53 health check monitors the primary EC2 instance** by sending HTTP requests to port 80 every 30 seconds
   - **Route 53 DNS failover records connect to both EC2 instances** using their public IPs
   - When health check fails, **Route 53 automatically updates DNS to point to the standby EC2 instance**
   - When health check recovers, **Route 53 switches DNS back to the primary EC2 instance**
   - Set up two DNS records with failover routing:
     - Primary record: Points to primary EC2 public IP, associated with health check
     - Standby record: Points to standby EC2 public IP, activates when primary health check fails

3. **Automation**
   - Ensure **automatic failover** if the primary becomes unhealthy.
   - Ensure **automatic failback** once the primary instance is healthy again.

4. **IAM and Security**
   - Add necessary IAM roles or security groups for EC2 and Route 53.
   - Allow HTTP port 80 and SSH port 22 access from public sources.

5. **Parameters**
   - Include parameters for:
     - KeyPairName
     - InstanceType with default t3.micro
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
 https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html

## Deliverable:
A single CloudFormation **YAML file** with:
- All resources interconnected
- Tags for each resource like Project: Route53FailoverDemo
- No manual steps required post-deployment