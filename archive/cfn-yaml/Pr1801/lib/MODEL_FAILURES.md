# Failure Report: High Availability Web App Stack

This document outlines failure scenarios encountered during **CloudFormation stack deployment** and **integration testing**, including probable causes and how to resolve them.

---

## Test Suite: `tap-stack.int.test.ts`

### Failure 1: Load Balancer HTTP 200 Check

**Test Case:**  
`Load balancer should respond with HTTP 200`

**Status:** Failed (Timeout after 30s)

**Error:**


**Root Cause:**
- The test attempted to access the ALB before instances were **fully initialized** or **registered** with the Target Group.
- The HTTP service (httpd) may not have started yet on EC2 instances.
- Security Group rules may be restricting inbound traffic from the ALB.

**Recommended Fix:**
- Introduce a **retry mechanism with exponential backoff** in the test until the ALB returns 200.
- Ensure **UserData script** completes before health checks start (use `cloud-init` wait or adjust grace period).
- Verify the **Target Group health check** configuration (e.g., path `/`, port `80`, protocol `HTTP`) is correct.

---

### Failure 2: Web Server Welcome Message

**Test Case:**  
`Web server should return welcome message`

**Status:** Failed (Timeout after 30s)

**Error:**


**Root Cause:**
- The EC2 instance may not have completed **httpd setup**, or `index.html` wasn’t written as expected.
- `UserData` script could be failing silently.
- The ALB forwarded the request to a **not-yet-healthy** instance.

**Recommended Fix:**
- Confirm that the `UserData` installs and starts `httpd` correctly:
  ```bash
  yum install -y httpd
  systemctl start httpd
  echo "Welcome to the High Availability Web App" > /var/www/html/index.html
