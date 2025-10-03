# MODEL_FAILURES

## 1. Subnet Configuration

**Issue:** Private subnets missing or misconfigured  
**Ideal Response:** Separate private subnets for EC2 and RDS, multi-AZ deployment  
**Model Response:** Only general private subnets mentioned; DB subnets partially included  
**Impact:** Could cause single-AZ deployment, EC2/RDS HA not guaranteed  
**Suggested Fix:** Ensure private subnets explicitly created per AZ for EC2 and RDS  

---

## 2. Security Groups

**Issue:** EC2 and ALB security groups misaligned  
**Ideal Response:**  
- ALB SG allows HTTP/HTTPS from internet  
- EC2 SG allows traffic from ALB only  
- RDS SG allows MySQL from EC2 only  
**Model Response:** EC2 SG allows all traffic from ALB using `${ApplicationLoadBalancer.LoadBalancerFullName}` placeholder (potentially wrong)  
**Impact:** Could block ALB→EC2 traffic, or expose EC2 incorrectly  
**Suggested Fix:** Reference ALB SG ID correctly in EC2 SG  

---

## 3. IAM Role / Policies

**Issue:** EC2 role permissions mismatch  
**Ideal Response:** Least privilege, allow `s3:PutObject` to Logs bucket  
**Model Response:** Role grants CloudWatchAgentServerPolicy and `s3:PutObject` using `${LogsBucket.Arn}` (ARN syntax may be invalid)  
**Impact:** EC2 may fail to upload logs  
**Suggested Fix:** Ensure S3 bucket ARN correctly interpolated  

---

## 4. Launch Template / UserData

**Issue:** UserData complexity  
**Ideal Response:** Install NGINX/simple server, serve `/health`, logs to S3  
**Model Response:** Installs HTTPD, CloudWatch agent, custom cron; references `${EnvironmentName}` and `${LogsBucket}` placeholders  
**Impact:** Health check path or log uploads may fail due to unresolved placeholders  
**Suggested Fix:** Verify placeholders are correctly evaluated in CloudFormation  

---

## 5. CloudWatch Dashboard

**Issue:** Dashboard metrics references incorrect  
**Ideal Response:** EC2, RDS, ALB metrics using correct logical IDs  
**Model Response:** Uses `${ApplicationLoadBalancer.LoadBalancerFullName}` which may not resolve  
**Impact:** Dashboard shows empty or invalid metrics  
**Suggested Fix:** Replace with `!GetAtt ApplicationLoadBalancer.LoadBalancerFullName` or correct reference  

---

## 6. RDS Deployment

**Issue:** Multi-AZ / private subnets missing  
**Ideal Response:** RDS in multi-AZ private subnets  
**Model Response:** Multi-AZ=false, subnets partially mentioned  
**Impact:** Single-AZ deployment reduces availability  
**Suggested Fix:** Include explicit private DB subnets, consider Multi-AZ for production  

---

## 7. Scaling Policy

**Issue:** ASG scaling policies may misfire  
**Ideal Response:** CloudWatch alarms tied to CPU, linked to scaling policy  
**Model Response:** Alarms reference `${AutoScalingGroup}` placeholder, possibly unresolved  
**Impact:** Auto-scaling may not trigger  
**Suggested Fix:** Use `!Ref AutoScalingGroup` or proper logical ID  

---

## 8. Parameterization

**Issue:** Some parameters missing or defaults unsafe  
**Ideal Response:** Parameters for AppName, Environment, InstanceType, KeyName, DB credentials  
**Model Response:** KeyName, DBPassword, AMIId included; DBUsername defaulted; InstanceType limited  
**Impact:** Reduced flexibility, deployment may fail if KeyName not provided  
**Suggested Fix:** Include all critical parameters and validate constraints  

---

## 9. Naming / Tagging

**Issue:** Resource names or tags inconsistent  
**Ideal Response:** `<app-name>-<resource-type>` naming and proper tags  
**Model Response:** Mostly uses `${EnvironmentName}-<Resource>`  
**Impact:** Minor, but may break naming conventions in multi-stack environments  
**Suggested Fix:** Standardize names and tags according to app name  

---

## 10. Minor Issues / Placeholders

- Some placeholders in model response (e.g., `${ApplicationLoadBalancer.LoadBalancerFullName}`) may not resolve in CloudFormation  
- Lifecycle rules for S3 logs differ from ideal (30 days vs. ideal might be 30 + Glacier transition)  
- Multi-AZ and HA configurations partially implemented  

