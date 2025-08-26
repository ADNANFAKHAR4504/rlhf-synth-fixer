# Prompt2.md

We need to design and implement a **fault-tolerant multi-region AWS infrastructure** using **AWS CDK (Java)** for the project **“IaC – AWS Nova Model Breaking.”**  
The goal is to provision **two stacks** across `us-east-1` and `us-west-2` to achieve **high availability** and **disaster recovery**.  

---

## Problem Context  

The current build fails at the **compile stage** with the following errors:  

error: cannot find symbol
new TapStack(app, "TapStack-" + environmentSuffix + "-use1", TapStackProps.builder()
^
symbol: class TapStack
location: class Main

error: cannot find symbol
TapStackProps.builder()
^
symbol: variable TapStackProps

markdown
Copy
Edit

This indicates that the classes `TapStack` and `TapStackProps` are referenced in `Main.java` but are **missing or not defined** in the codebase. As a result, Gradle compilation fails.  

---

## Requirements  

1. **Multi-Region Deployment**  
   - Each region (`us-east-1`, `us-west-2`) must deploy its own stack.  
   - The stack should include VPCs, subnets, Auto Scaling Groups, Load Balancers, RDS (Multi-AZ), S3 for logs, IAM roles, and CloudWatch alarms.  

2. **Fix Build Issues**  
   - Define and implement `TapStack.java` inside the project (e.g., `lib/src/main/java/app/TapStack.java`).  
   - Create a matching `TapStackProps.java` for stack configuration (with properties such as VPC CIDR, environment name, hosted zone, etc.).  
   - Update `Main.java` so it correctly instantiates `TapStack` with the props.  

3. **CI/CD Friendly**  
   - Ensure the project compiles and synthesizes without errors (`gradle build` and `cdk synth`).  
   - Write unit and integration tests to validate the synthesized CloudFormation templates.  

---

## Deliverable  

- A **working AWS CDK (Java) project** that builds successfully with Gradle.  
- `Main.java` deploying multi-region stacks.  
- Supporting classes (`TapStack.java`, `TapStackProps.java`) implemented to resolve the missing symbol errors.  
- A CI/CD pipeline that runs without failures at the **compile and deploy stages**.  

The outcome should be a **production-ready, fault-tolerant infrastructure**, and the build should no longer fail due to missing dependencies or undefined classes.