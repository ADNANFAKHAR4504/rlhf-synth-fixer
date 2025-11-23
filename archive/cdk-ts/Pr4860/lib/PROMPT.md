We need to refactor the AWS CDK TypeScript project for our **real-time stock trading platform** in `us-east-2`. The core microservice, the `OrderBroker`, is currently failing during peak market hours. It's over-provisioned on CPU (using 4096 units but averaging 1800), yet it scales too slowly (taking 5 minutes) to handle the 9:30 AM market open and 4:00 PM market close trading spikes, causing failed orders and performance issues.

Our goal is to re-architect this Fargate infrastructure to be faster, cheaper, and resilient enough for zero-downtime deployments _during_ active trading hours.

Here is the infrastructure we need to define in our refactored CDK stack:

## 1. Smart Scaling for Market Spikes

This is the core of the refactor. We need to handle predictable and unpredictable traffic spikes.

- **Predictive Auto-Scaling:** Instead of just reacting to current CPU, configure the ECS service's auto-scaling to use **predictive scaling**. This must be configured to analyze the daily 9:30 AM and 4:00 PM historical traffic spikes and provision new `OrderBroker` tasks _before_ those times.
- **Warm Pool (Capacity Providers):** A 90-second cold start is too long for a sudden volatility spike. Define a **Fargate Capacity Provider** for the ECS service that maintains a "warm pool" of tasks, ensuring new tasks are available in under 30 seconds.
- **Task Definition Right-Sizing:** Update the `ecs.FargateTaskDefinition` to use the correct, right-sized CPU and memory (e.g., 2048 CPU units). The task definition must also be configured to support both `X86_64` and `ARM64` architectures.

## 2. Zero-Downtime Deployments During Trading Hours

We must be able to deploy bug fixes and new features while the market is open. This requires a full blue-green deployment strategy using **AWS CodeDeploy**.

- **Blue-Green Setup:** Your CDK code should define an `ecs.FargateService` and integrate it with a new `codedeploy.EcsDeploymentGroup`.
- **ALB Listeners:** The Application Load Balancer needs a production listener (e.g., on port 80) and a test listener (e.g., on port 9090). CodeDeploy will use the test listener to validate the 'green' deployment before shifting 100% of live production traffic.
- **Auto-Rollback:** Configure CodeDeploy with automatic rollback on failed deployments to meet our 5-minute rollback requirement.

## 3. Enhanced Observability for Trading Analytics

We need deeper insight into the `OrderBroker`'s performance.

- **CloudWatch Container Insights:** Enable Container Insights on the ECS cluster.
- **Custom Alarms:** Create CloudWatch alarms for key performance indicators (KPIs) specific to this service: **JVM heap usage** and **database connection pool utilization**.
- **Notifications:** These alarms must send notifications to an SNS topic for our SRE team.

## 4. Security & Governance Refactoring

- **IAM Least Privilege:** The existing task IAM role is too permissive. Your CDK code must define a new, lean `iam.Role` that _only_ allows the `OrderBroker` service to write to the `trades` Kinesis stream and read/write from the `orders` RDS database.
- **Tagging Automation:** Use a CDK **Aspect** to programmatically enforce our tagging policy. This Aspect must run at synthesis time and automatically add `CostCenter`, `Project: TradingPlatform`, and `Service: OrderBroker` tags to all resources.

---

### **Integration Test Scenarios to Plan For**

Your infrastructure design must enable these critical end-to-end tests:

1.  **Predictive Scaling Test:** The test will verify that at 9:25 AM EST, the number of running `OrderBroker` tasks has already scaled up in anticipation of the 9:30 AM market open.
2.  **Blue-Green Deployment Test:** The test will deploy a new version of the `OrderBroker` service at 11:00 AM (during active trading) and continuously run synthetic transactions to verify that zero trades are dropped during the traffic shift.
3.  **Auto-Rollback Test:** The test will deploy a "bad" version of the service (e.g., one that intentionally fails health checks) and verify that CodeDeploy automatically detects the failures and rolls back to the previous stable version.

---

Implement using AWS CDK TypeScript with separate modular stack file ecs_trading_infra.ts in lib/ for all components, instantiated in lib/tap-stack.ts.
