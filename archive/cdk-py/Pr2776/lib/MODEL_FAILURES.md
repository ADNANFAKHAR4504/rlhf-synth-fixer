# Model Failures

### 1. AutoScalingGroup CPU Metric Method Error
**Problem:** `metric_cpu_utilization()` method doesn't exist on AutoScalingGroup objects  
**Impact:** AttributeError when trying to create CPU alarms for EC2 instances  

### 2. RDS Endpoint Port Type Mismatch
**Problem:** `CfnOutput` expects string values but `instance_endpoint.port` returns numeric  
**Impact:** Type error preventing stack deployment  

### 3. RDS Monitoring Interval Format Error
**Problem:** RDS `monitoring_interval` expects integer seconds, not Duration objects  
**Impact:** Invalid parameter error during RDS instance creation  

### 4. Missing IAM Role for Enhanced Monitoring
**Issue:** RDS enhanced monitoring (monitoring_interval=60) requires an IAM role  
**Impact:** Stack deployment failed with "Enhanced Monitoring requires a monitoring role"   

### 5. Missing CloudWatch Dashboard
**Issue:** The code creates alarms but no CloudWatch dashboard as mentioned in requirements  
**Impact:** No visual monitoring dashboard for the three metrics (EC2 CPU, RDS CPU, ALB requests)  

### 6. Incomplete ALB Metric Dimensions
**Issue:** ALB metrics might need both `LoadBalancer` and `TargetGroup` dimensions  
**Impact:** Metric did not properly track unhealthy targets  

### 7. Log Group Not Connected to EC2 Instances
**Issue:** CloudWatch Log Group created but not configured on EC2 instances  
**Impact:** EC2 logs did not send to CloudWatch.

### 8. Missing SNS Topic for Alarms
**Issue:** CloudWatch alarms created without notification actions  
**Impact:** Alarms trigger but no one gets notified.

### 9. Database Credentials Not Exported
**Issue:** RDS credentials secret ARN not in outputs  
**Impact:** Applications can't retrieve database credentials.

### 10. Period Inconsistency in Metrics
**Issue:** ALB metric uses 1-minute period while others use 5 minutes  
**Impact:** Inconsistent monitoring.  

## Critical Missing Components

### 11. No Error Handling in Main Script
**Issue:** The `deploy_infrastructure.py` likely lacks try-catch blocks  
**Impact:** Uncaught exceptions during deployment.