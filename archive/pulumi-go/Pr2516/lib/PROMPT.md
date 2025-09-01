# Secure AWS Web Application Infrastructure

You need to build a robust, production-ready AWS infrastructure to host a web application securely. This isn't just about getting something running - we need enterprise-grade security, high availability, and proper operational practices.

## What We're Building

Think of this as setting up a fortress for your web application. We need multiple layers of security, proper network isolation, and the ability to handle traffic reliably. The infrastructure should be resilient enough to handle failures gracefully while keeping everything secure.

## Core Requirements

### Network Foundation
Start with a solid VPC foundation in us-west-2. We need two public subnets for internet-facing components and two private subnets for our application servers and database. This separation is crucial for security - anything that doesn't need direct internet access stays private.

### Security First Approach
Security isn't an afterthought here. We need a bastion host as our secure entry point - think of it as the heavily guarded front gate. Only authorized users should be able to access the private resources through this controlled entry point.

### Database Layer
The database is the crown jewel - it needs maximum protection. Deploy an RDS MySQL instance in the private subnets with no public access whatsoever. Only the application servers should be able to talk to it, and even then, only through tightly controlled security groups.

### Application Delivery
Set up an Application Load Balancer in the public subnets to distribute incoming traffic. This should route requests to your application servers sitting safely in the private subnets. The ALB needs to handle health checks and failover scenarios properly.

### Access Control
IAM roles and policies should follow the principle of least privilege. Don't give anything more permissions than it absolutely needs. This means careful planning of what each component can and cannot do.

### Web Application Firewall
All public-facing IPs need AWS WAF protection. This adds an extra layer of defense against common web attacks and malicious traffic patterns.

### Data Protection
Encrypt everything - data in transit and at rest. This includes database connections, application traffic, and stored data. Use AWS KMS for key management where appropriate.

### Monitoring and Logging
Set up comprehensive logging with CloudTrail and CloudWatch. You need visibility into what's happening across your infrastructure - who's accessing what, when, and from where.

### Backup Strategy
Implement automated backups for the RDS instance. These should happen regularly and be stored securely. Consider point-in-time recovery capabilities.

### High Availability
Design for failure. The RDS instance should have automated failover capabilities. If something goes wrong, the system should recover automatically without manual intervention.

## Technical Constraints

- Use Pulumi Go for all infrastructure definition
- Deploy everything in us-west-2 region
- VPC must have exactly two public and two private subnets
- RDS must use MySQL engine
- Security groups should be restrictive - only allow necessary traffic
- All IAM permissions must follow least privilege principle
- WAF must protect all public IPs
- Automated backups must be enabled for RDS

## What Success Looks Like

When you're done, you should have an infrastructure that:
- Keeps the database completely isolated from the internet
- Provides secure access through a bastion host
- Distributes traffic efficiently through an ALB
- Protects against common web attacks
- Logs everything for audit purposes
- Can recover automatically from failures
- Follows AWS security best practices

This isn't just about ticking boxes - it's about building something that would pass a security audit and handle real production traffic reliably.
