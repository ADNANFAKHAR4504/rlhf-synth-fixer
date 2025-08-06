```markdown
# Model Failures and Troubleshooting Guide

## Overview

This document outlines common failure scenarios, their root causes, and recommended solutions for the scalable web application infrastructure defined in PROMPT.md file. The infrastructure includes EC2 instances behind an Application Load Balancer, Auto Scaling Group, S3 static content hosting, and CloudWatch monitoring.

---

## 🚨 Critical Infrastructure Failures

### 1. Auto Scaling Group Failures

#### **Scenario: Auto Scaling Group Cannot Launch Instances**
**Symptoms:**
- Auto Scaling Group shows "Insufficient capacity" errors
- Instances fail to launch or immediately terminate
- CloudWatch alarms trigger but scaling fails

**Root Causes:**
- Insufficient EC2 capacity in the target Availability Zones
- Launch Template configuration errors
- Security Group or IAM role issues
- VPC subnet configuration problems

**Solutions:**
```bash
# Check Auto Scaling Group status
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names WebApp-ASG

# Verify Launch Template
aws ec2 describe-launch-templates --launch-template-names WebApp-LaunchTemplate

# Check EC2 capacity
aws ec2 describe-instance-status --filters "Name=instance-state-name,Values=running"

# Review CloudWatch logs for launch failures
aws logs describe-log-groups --log-group-name-prefix "/aws/autoscaling"
```

**Prevention:**
- Use multiple Availability Zones for redundancy
- Implement proper health checks and grace periods
- Monitor capacity reservations in target AZs
- Test launch templates in staging environment

---

### 2. Application Load Balancer Failures

#### **Scenario: ALB Health Checks Failing**
**Symptoms:**
- All targets showing as unhealthy
- 502/503 errors from load balancer
- No traffic reaching EC2 instances

**Root Causes:**
- Security group rules blocking health check traffic
- EC2 instances not responding on health check port (80)
- Web server not running or misconfigured
- Network connectivity issues

**Solutions:**
```bash
# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Verify security group rules
aws ec2 describe-security-groups --group-ids <alb-security-group-id>

# Test connectivity from ALB to instances
aws ec2 describe-network-interfaces --filters "Name=group-id,Values=<security-group-id>"

# Check EC2 instance status
aws ec2 describe-instances --instance-ids <instance-id>
```

**Prevention:**
- Ensure ALB security group allows inbound traffic on port 80/443
- Verify EC2 security group allows traffic from ALB security group
- Implement proper health check paths and intervals
- Monitor web server logs for application errors

---

### 3. S3 Static Content Hosting Failures

#### **Scenario: S3 Bucket Not Accessible**
**Symptoms:**
- Static content returns 403 Forbidden errors
- Website hosting not working
- Bucket policy blocking access

**Root Causes:**
- Incorrect bucket policy configuration
- Public access blocks enabled
- Bucket ownership issues
- CORS configuration problems

**Solutions:**
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket <bucket-name>

# Verify public access blocks
aws s3api get-public-access-block --bucket <bucket-name>

# Test bucket access
aws s3 ls s3://<bucket-name>/

# Check website configuration
aws s3api get-bucket-website --bucket <bucket-name>
```

**Prevention:**
- Ensure bucket policy allows public read access
- Disable public access blocks for website hosting
- Use proper bucket naming conventions
- Implement CORS if needed for cross-origin requests

---

## �� Component-Specific Failures

### 4. EC2 Instance Failures

#### **Scenario: EC2 Instances Not Responding**
**Symptoms:**
- Instances running but not serving web traffic
- UserData script failures
- Application not starting properly

**Root Causes:**
- UserData script errors during instance launch
- Insufficient instance resources (CPU/Memory)
- Application configuration issues
- Missing dependencies

**Solutions:**
```bash
# Check instance system logs
aws ec2 get-console-output --instance-id <instance-id>

# Verify UserData execution
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["systemctl status httpd","journalctl -u cloud-init"]'

# Check instance metrics
aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=<instance-id>
```

**Prevention:**
- Test UserData scripts thoroughly
- Use appropriate instance types for workload
- Implement proper error handling in startup scripts
- Monitor instance performance metrics

---

### 5. CloudWatch Monitoring Failures

#### **Scenario: CloudWatch Alarms Not Triggering**
**Symptoms:**
- CPU utilization high but no scaling events
- No SNS notifications received
- Alarms stuck in INSUFFICIENT_DATA state

**Root Causes:**
- CloudWatch agent not installed or configured
- Incorrect alarm thresholds or evaluation periods
- SNS topic or subscription issues
- Metric collection problems

**Solutions:**
```bash
# Check alarm status
aws cloudwatch describe-alarms --alarm-names WebApp-HighCPU

# Verify SNS topic and subscription
aws sns list-topics
aws sns list-subscriptions-by-topic --topic-arn <topic-arn>

# Check CloudWatch agent status on instances
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["systemctl status amazon-cloudwatch-agent"]'
```

**Prevention:**
- Ensure CloudWatch agent is properly installed and configured
- Set appropriate alarm thresholds and evaluation periods
- Test SNS notifications in staging environment
- Monitor metric collection and agent health

---

### 6. VPC and Networking Failures

#### **Scenario: Network Connectivity Issues**
**Symptoms:**
- Instances cannot reach internet
- Load balancer cannot reach instances
- DNS resolution failures

**Root Causes:**
- Route table misconfiguration
- Internet Gateway not attached
- Subnet configuration issues
- Security group rules blocking traffic

**Solutions:**
```bash
# Check route tables
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<vpc-id>"

# Verify Internet Gateway attachment
aws ec2 describe-internet-gateways --internet-gateway-ids <igw-id>

# Test network connectivity
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["ping -c 3 8.8.8.8","nslookup google.com"]'
```

**Prevention:**
- Use CloudFormation to ensure consistent VPC configuration
- Implement proper route table associations
- Test network connectivity after deployment
- Monitor VPC flow logs for traffic analysis

---

## 🚀 Scaling and Performance Failures

### 7. Auto Scaling Performance Issues

#### **Scenario: Scaling Too Slow or Too Fast**
**Symptoms:**
- Application performance degradation during traffic spikes
- Unnecessary scaling events
- Cost overruns due to excessive instances

**Root Causes:**
- Inappropriate scaling policies
- Incorrect alarm thresholds
- Insufficient cooldown periods
- Metric aggregation issues

**Solutions:**
```bash
# Review scaling policies
aws autoscaling describe-policies --auto-scaling-group-name WebApp-ASG

# Check scaling history
aws autoscaling describe-scaling-activities --auto-scaling-group-name WebApp-ASG

# Analyze CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=AutoScalingGroupName,Value=WebApp-ASG
```

**Prevention:**
- Set appropriate cooldown periods (300 seconds recommended)
- Use step scaling policies for better control
- Monitor scaling effectiveness and adjust thresholds
- Implement predictive scaling for known traffic patterns

---

### 8. Load Balancer Performance Issues

#### **Scenario: ALB Performance Degradation**
**Symptoms:**
- High latency responses
- Connection timeouts
- Uneven traffic distribution

**Root Causes:**
- Insufficient ALB capacity
- Target group configuration issues
- Health check intervals too aggressive
- SSL/TLS configuration problems

**Solutions:**
```bash
# Check ALB metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name TargetResponseTime

# Verify target group configuration
aws elbv2 describe-target-groups --target-group-arns <target-group-arn>

# Monitor ALB access logs
aws logs describe-log-groups --log-group-name-prefix "/aws/applicationloadbalancer"
```

**Prevention:**
- Use appropriate ALB capacity units
- Configure optimal health check intervals
- Enable access logging for performance analysis
- Implement proper SSL/TLS termination

---

## 🔒 Security and Compliance Failures

### 9. Security Group Misconfigurations

#### **Scenario: Unauthorized Access or Blocked Traffic**
**Symptoms:**
- Legitimate traffic blocked
- Unauthorized access attempts
- Security audit failures

**Root Causes:**
- Overly restrictive security group rules
- Missing required port configurations
- Incorrect source/destination specifications

**Solutions:**
```bash
# Review security group rules
aws ec2 describe-security-groups --group-ids <security-group-id>

# Check security group associations
aws ec2 describe-network-interfaces --filters "Name=group-id,Values=<security-group-id>"

# Test connectivity
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["netstat -tuln","ss -tuln"]'
```

**Prevention:**
- Follow least privilege principle
- Document all required ports and protocols
- Regular security group audits
- Use security group references instead of hardcoded values

---

### 10. IAM Role and Permission Failures

#### **Scenario: Permission Denied Errors**
**Symptoms:**
- EC2 instances cannot access S3 or CloudWatch
- Application cannot perform required operations
- IAM role attachment failures

**Root Causes:**
- Missing IAM permissions
- Incorrect role policies
- Instance profile not attached
- Cross-account permission issues

**Solutions:**
```bash
# Check IAM role permissions
aws iam get-role --role-name WebApp-EC2-Role
aws iam list-attached-role-policies --role-name WebApp-EC2-Role

# Verify instance profile
aws iam get-instance-profile --instance-profile-name WebApp-EC2-InstanceProfile

# Test permissions from instance
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["aws s3 ls","aws cloudwatch list-metrics"]'
```

**Prevention:**
- Use AWS managed policies where appropriate
- Implement least privilege access
- Regular permission audits
- Test permissions in staging environment

---

## 📊 Monitoring and Alerting Failures

### 11. CloudWatch Agent Failures

#### **Scenario: Metrics Not Being Collected**
**Symptoms:**
- Missing custom metrics
- Incomplete monitoring data
- CloudWatch agent errors

**Root Causes:**
- Agent not installed or running
- Configuration file errors
- Insufficient permissions
- Resource constraints

**Solutions:**
```bash
# Check agent status
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["systemctl status amazon-cloudwatch-agent","/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -s"]'

# Verify configuration
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["cat /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"]'

# Check agent logs
aws ssm send-command --instance-ids <instance-id> --document-name "AWS-RunShellScript" --parameters 'commands=["tail -f /var/log/amazon/amazon-cloudwatch-agent/amazon-cloudwatch-agent.log"]'
```

**Prevention:**
- Include agent installation in UserData
- Use proper configuration files
- Monitor agent health and logs
- Implement agent auto-recovery mechanisms

---

### 12. SNS Notification Failures

#### **Scenario: Alerts Not Being Delivered**
**Symptoms:**
- No email notifications received
- Alarms triggered but no alerts
- SNS delivery failures

**Root Causes:**
- Incorrect email address
- SNS subscription not confirmed
- Topic policy issues
- Email provider blocking

**Solutions:**
```bash
# Check SNS topic and subscription
aws sns list-topics
aws sns list-subscriptions-by-topic --topic-arn <topic-arn>

# Verify subscription status
aws sns get-subscription-attributes --subscription-arn <subscription-arn>

# Test notification
aws sns publish --topic-arn <topic-arn> --message "Test notification" --subject "Test"
```

**Prevention:**
- Confirm SNS subscriptions immediately
- Use verified email addresses
- Monitor SNS delivery metrics
- Implement backup notification channels

---

## 🛠️ Recovery Procedures

### Emergency Recovery Checklist

1. **Immediate Actions:**
   - Check CloudWatch alarms and metrics
   - Verify Auto Scaling Group status
   - Review recent deployment changes
   - Check security group configurations

2. **Diagnostic Commands:**
   ```bash
   # Infrastructure health check
   aws cloudformation describe-stacks --stack-name <stack-name>
   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names WebApp-ASG
   aws elbv2 describe-load-balancers --names WebApp-ALB
   aws s3 ls s3://<bucket-name>/
   ```

3. **Rollback Procedures:**
   - Revert to previous CloudFormation stack version
   - Restore from backup if data corruption
   - Scale up manually if auto scaling fails
   - Switch to backup region if available

4. **Communication Plan:**
   - Notify stakeholders immediately
   - Provide status updates every 15 minutes
   - Document all actions taken
   - Post-mortem analysis within 24 hours

---

## 📈 Prevention Strategies

### Best Practices for Failure Prevention

1. **Infrastructure as Code:**
   - Use version control for all templates
   - Implement automated testing
   - Use CloudFormation drift detection
   - Regular template validation

2. **Monitoring and Alerting:**
   - Comprehensive CloudWatch monitoring
   - Proactive alerting before failures
   - Regular log analysis
   - Performance baseline monitoring

3. **Security:**
   - Regular security audits
   - Principle of least privilege
   - Encryption at rest and in transit
   - Regular patch management

4. **Disaster Recovery:**
   - Multi-AZ deployment
   - Regular backup testing
   - Cross-region replication
   - Documented recovery procedures

---

## 📞 Support and Escalation

### When to Escalate

- **Critical Infrastructure Down:** Immediate escalation
- **Data Loss or Corruption:** Escalate within 1 hour
- **Security Breach:** Escalate immediately
- **Performance Degradation:** Escalate within 4 hours
- **Monitoring Failures:** Escalate within 8 hours

### Contact Information

- **Primary On-Call:** [Contact Information]
- **Secondary On-Call:** [Contact Information]
- **Infrastructure Team:** [Contact Information]
- **Security Team:** [Contact Information]

---

*This document should be reviewed and updated quarterly to reflect current infrastructure and failure patterns.*
```

I've created comprehensive content for the MODEL_FAILURES.md file that covers:

## **📋 Content Overview:**

### **🚨 Critical Infrastructure Failures (3 scenarios)**
1. **Auto Scaling Group Failures** - Capacity issues, launch template problems
2. **Application Load Balancer Failures** - Health check failures, connectivity issues  
3. **S3 Static Content Hosting Failures** - Access issues, policy problems

### **�� Component-Specific Failures (3 scenarios)**
4. **EC2 Instance Failures** - UserData issues, application problems
5. **CloudWatch Monitoring Failures** - Alarm issues, metric collection problems
6. **VPC and Networking Failures** - Connectivity issues, routing problems

### **🚀 Scaling and Performance Failures (2 scenarios)**
7. **Auto Scaling Performance Issues** - Scaling too slow/fast, policy problems
8. **Load Balancer Performance Issues** - Latency, capacity issues

### **🔒 Security and Compliance Failures (2 scenarios)**
9. **Security Group Misconfigurations** - Access control issues
10. **IAM Role and Permission Failures** - Permission problems

### **📊 Monitoring and Alerting Failures (2 scenarios)**
11. **CloudWatch Agent Failures** - Metric collection issues
12. **SNS Notification Failures** - Alert delivery problems

### **🛠️ Recovery Procedures**
- Emergency recovery checklist
- Diagnostic commands
- Rollback procedures
- Communication plan

### **📈 Prevention Strategies**
- Infrastructure as Code best practices
- Monitoring and alerting strategies
- Security best practices
- Disaster recovery procedures

### **📞 Support and Escalation**
- Escalation criteria
- Contact information structure

## **✅ Key Features:**

1. **Comprehensive Coverage**: All components from PROMPT.md are covered
2. **Practical Solutions**: Real AWS CLI commands for troubleshooting
3. **Prevention Focus**: Best practices to avoid failures
4. **Emergency Procedures**: Step-by-step recovery processes
5. **Security Considerations**: Security-specific failure scenarios
6. **Monitoring Integration**: CloudWatch and SNS failure scenarios

The document provides a complete troubleshooting guide that aligns perfectly with the infrastructure requirements specified in PROMPT.md! 🎯