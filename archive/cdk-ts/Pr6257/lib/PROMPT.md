I need help building a Lambda memory optimization system for our transaction processing infrastructure. We're running into performance issues and cost overruns because our Lambda functions are using static memory configurations that don't match actual usage patterns.

Here's the situation: we have about 15 Lambda functions handling different parts of our transaction pipeline - some are API endpoints that need low latency, others are async processors, and some are batch jobs that run overnight. Right now we're either over-provisioning (wasting money) or under-provisioning (causing timeouts), and we need a smarter way to set memory based on real data.

We already have Lambda Power Tuning results stored in Parameter Store for each function, so we want to use that data. The system should:

1. Read the Power Tuning results from SSM Parameter Store (they're stored at paths like `/lambda/power-tuning/<functionName>`)

2. Create a custom CDK construct that automatically calculates optimal memory based on:
   - The function's tier (API endpoints prioritize low latency, batch jobs prioritize cost)
   - The Power Tuning data showing actual optimal memory
   - Some safety rules to prevent drastic changes between deployments

3. Set up three optimization tiers:
   - API tier: needs to reduce cold starts by at least 40%, add 20% headroom above peak usage
   - Async tier: balanced approach, 15% headroom
   - Batch tier: cost-focused, can reduce memory more aggressively

4. Add CloudWatch alarms that trigger when functions are using more than 80% of their allocated memory

5. Build a dashboard showing actual vs allocated memory, plus the usual metrics (invocations, duration, errors, throttles)

6. Create a cost report generator that runs daily and compares current costs vs what we'd pay with optimized memory settings

7. Store previous memory settings in SSM so we can roll back if something goes wrong

8. Tag everything properly so we can track which functions are optimized and when they were last tuned

The code should be clean and modular. We're using CDK v2 with TypeScript, and the functions are a mix of Python 3.11 and Node.js 18. Everything runs in us-east-1, and we have X-Ray tracing enabled.

I need two files: the main CDK app entry point and the stack file with the custom construct. The construct should handle reading from Parameter Store, calculating optimal memory with guardrails, setting up alarms and dashboards, and managing the rollback mechanism.
