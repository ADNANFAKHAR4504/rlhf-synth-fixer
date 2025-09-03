I need help fixing TypeScript compilation errors in my AWS CDK defense-in-depth infrastructure. The build is failing with the following specific errors:

**Error 1 - Lambda Function Type Issue:**
```
lambda/audit-function.ts(53,14): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | Error | null | undefined'.
```

**Error 2-4 - AutoScaling Group Metric Issues (3 instances):**
```
lib/defense-in-depth-stack.ts(402,34): error TS2339: Property 'metricCpuUtilization' does not exist on type 'AutoScalingGroup'.
lib/defense-in-depth-stack.ts(433,32): error TS2339: Property 'metricCpuUtilization' does not exist on type 'AutoScalingGroup'.
lib/defense-in-depth-stack.ts(443,32): error TS2339: Property 'metricCpuUtilization' does not exist on type 'AutoScalingGroup'.
```

The original requirements were to create a defense-in-depth security infrastructure with AWS WAF, GuardDuty, Security Hub, Config, CloudTrail, VPC Flow Logs, and multi-tier architecture with auto-scaling groups. The current implementation has the right approach but needs these TypeScript compilation issues fixed.

Please provide corrected TypeScript code that:
1. Fixes the lambda function type casting issue 
2. Uses the correct method to get CPU utilization metrics from AutoScaling groups (should be `autoScalingGroup.metric('CPUUtilization')` instead of `metricCpuUtilization`)
3. Maintains all the existing security features and architecture

Just provide the corrected TypeScript code sections that need to be fixed, not the entire files.