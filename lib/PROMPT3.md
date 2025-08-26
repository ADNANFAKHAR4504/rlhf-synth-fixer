# Prompt3.md

We need to design and implement a **fault-tolerant multi-region AWS infrastructure** using **AWS CDK (Java)** for the project **“IaC – AWS Nova Model Breaking.”**  
The application must provision **two stacks** across `us-east-1` and `us-west-2` to achieve **high availability** and **disaster recovery**.

---

## Problem Context

The current build passes compilation but fails at the **lint/test stage** with the following error:

Task :compileTestJava
.../tests/unit/java/app/MainTest.java:23: error: cannot find symbol
TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
^
symbol: class TapStack
location: class MainTest

... 12 errors
Task :compileTestJava FAILED

markdown
Copy
Edit

This shows that **`TapStack`** and **`TapStackProps`** are referenced inside the unit tests (`MainTest.java`) but are **not implemented in the codebase**. As a result, `:compileTestJava` fails and the CI/CD pipeline stops during lint/test execution.

---

## Requirements

1. **Multi-Region Deployment**
   - Deploy two stacks (`us-east-1` and `us-west-2`) for redundancy.
   - Each stack should include:
     - A VPC with public and private subnets  
     - Auto Scaling Group + Application Load Balancer  
     - Amazon RDS in Multi-AZ mode  
     - S3 bucket with versioning + lifecycle rules for logs  
     - IAM roles and policies with least privilege  
     - CloudWatch alarms with SNS alerts  

2. **Fix Test Failures**
   - Implement missing classes `TapStack.java` and `TapStackProps.java` under `lib/src/main/java/app/`.
   - Update `MainTest.java` to correctly import and instantiate these classes.
   - Ensure `gradle test` runs successfully without `cannot find symbol` errors.

3. **CI/CD Ready**
   - Code should compile, pass linting, and run unit/integration tests.
   - `cdk synth` and `cdk deploy` must complete without dependency errors.
   - Tests should validate that required AWS resources (VPC, ASG, RDS, S3, IAM, Route53, Alarms) are created with correct properties.

---

## Deliverables

- A **working CDK (Java) project** that provisions the infrastructure across two AWS regions.  
- New source files:
  - `TapStack.java`  
  - `TapStackProps.java`  
- Fixed `MainTest.java` that passes unit tests.  
- Successful execution of the CI/CD pipeline (lint + test + synth + deploy).  

The final solution should be **production-ready, resilient across regions, and fully testable without breaking the pipeline.**