# Event Ticketing System - AWS CDK Java Implementation

## Task Overview
I want you to create a production-ready event ticketing system using **AWS CDK with Java**. Deploy all infrastructure to **us-west-2** region.

## Required AWS Resources

### 1. Network Layer
- **VPC**: CIDR `10.24.0.0/16`
  - 2 public subnets (for ALB)
  - 2 private subnets (for ECS, Aurora, Lambda)
  - Internet Gateway and NAT Gateways
  - Route tables properly configured

### 2. Application Layer
- **Application Load Balancer** (internet-facing)
  - Target group pointing to ECS service
  - Health checks configured
  - Port 80/443 listeners
- **ECS Fargate Cluster** with service
  - Task definition with web app container
  - Auto-scaling enabled (min 2, max 10 tasks)
  - Container port 8080

### 3. Database Layer
- **Aurora Serverless v2** (PostgreSQL)
  - Min capacity: 0.5 ACU, Max: 2 ACU
  - Database name: `ticketdb`
  - Master username: `admin`
  - Store credentials in Secrets Manager
- **DynamoDB Table**: `TicketInventory`
  - Partition key: `eventId` (String)
  - Sort key: `ticketId` (String)
  - GSI: `statusIndex` (status, purchaseTimestamp)
  - Enable Point-in-Time Recovery
  - On-demand billing mode

### 4. Lambda & API
- **Lambda Function**: `QRCodeGenerator`
  - Runtime: Java 17 (`JAVA_17`)
  - Memory: 512 MB
  - Timeout: 30 seconds
  - Trigger: DynamoDB Stream from TicketInventory table
  - Environment variables for S3 bucket name
- **API Gateway**: REST API named `TicketValidationAPI`
  - Resource: `/validate`
  - Method: POST with Lambda integration
  - Enable CORS
  - API key required for validation requests

### 5. Storage & Email
- **S3 Bucket**: `ticket-qrcodes-{accountId}`
  - Versioning enabled
  - Encryption at rest (SSE-S3)
  - Lifecycle policy: delete after 90 days
- **SES Configuration**
  - Verified sender email
  - Configuration set for tracking
  - Email template for ticket delivery

### 6. Authentication
- **Cognito User Pool**: `TicketSystemUsers`
  - Email as username
  - Password policy: min 8 chars, require uppercase, number, symbol
  - MFA optional
  - App client for web application

### 7. Monitoring & Security
- **CloudWatch Log Groups** for:
  - ECS task logs: `/ecs/ticketing-app`
  - Lambda logs: `/aws/lambda/QRCodeGenerator`
  - API Gateway logs
- **IAM Roles**:
  - ECS Task Role: access to DynamoDB, Aurora, S3
  - Lambda Execution Role: DynamoDB streams, S3 write, CloudWatch logs
  - API Gateway Role: invoke Lambda
- **Security Groups**:
  - ALB-SG: allow 80, 443 from 0.0.0.0/0
  - ECS-SG: allow 8080 from ALB-SG
  - Aurora-SG: allow 5432 from ECS-SG and Lambda-SG
  - Lambda-SG: egress to Aurora, S3, DynamoDB

## CDK Java Implementation Requirements

### Expected Output Format


#### 1. Main CDK Stack (TicketingSystemStack.java)
```java
package com.ticketing;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.ecs.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cognito.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;

public class TicketingSystemStack extends Stack {
    public TicketingSystemStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
    }
}
```

#### 2. Main App Class
```java
package com.ticketing;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class TicketingSystemApp {
    public static void main(final String[] args) {
        App app = new App();
        
        new TicketingSystemStack(app, "TicketingSystemStack", StackProps.builder()
            .env(Environment.builder()
                .region("us-west-2")
                .build())
            .build());
            
        app.synth();
    }
}
```

#### 3. Lambda Handler (separate Java class)
```java
package com.ticketing.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
```

## Specific CDK Java Patterns to Use

1. **Builder Pattern**: Use `.builder()` for all construct properties
2. **Environment**: Set region in StackProps using `Environment.builder()`
3. **Cross-Stack References**: Export/import values using `CfnOutput` if needed
4. **Vpc.Builder**: Use `Vpc.Builder.create()` with `maxAzs(2)` and `subnetConfiguration()`
5. **DatabaseCluster**: Use `DatabaseCluster.Builder.create()` for Aurora Serverless v2
6. **ApplicationLoadBalancedFargateService**: Use this Pattern construct for simplified ALB+ECS setup
7. **Function.Builder**: Create Lambda with `Function.Builder.create()` and `Runtime.JAVA_17`
8. **RestApi.Builder**: Define API Gateway with proper integration

## Validation Checklist
All resources deploy successfully with `cdk deploy`  
VPC has correct CIDR and subnet configuration  
ALB forwards traffic to ECS tasks  
ECS can connect to Aurora and DynamoDB  
Lambda generates QR codes on DynamoDB stream events  
API Gateway validates tickets via Lambda  
Cognito user pool is functional  
S3 bucket stores QR codes with proper permissions  
CloudWatch logs capture all service activities  
IAM roles follow least-privilege principle

## Deliverables
Provide complete, compilable CDK Java code that:
- Includes all necessary imports
- Uses proper CDK L2 constructs
- Has meaningful variable names and comments
- Can be deployed with `cdk synth` and `cdk deploy`
- Follows AWS best practices for security and scalability