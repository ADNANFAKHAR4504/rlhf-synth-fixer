I got below issues

lib/tap-stack.ts:152:9 - error TS2322: Type 'string[]' is not assignable to type 'string'.
152 'example@example.com': ['*.example.com'],

lib/tap-stack.ts:179:5 - error TS18048: 'launchTemplate.userData' is possibly 'undefined'.
179 launchTemplate.userData.addCommands(

lib/tap-stack.ts:199:7 - error TS2561: Object literal may only specify known properties, but 'healthCheckType' does not exist in type 'AutoScalingGroupProps'. Did you mean to write 'healthCheck'?
199 healthCheckType: autoscaling.HealthCheckType.ELB,

lib/tap-stack.ts:199:36 - error TS2551: Property 'HealthCheckType' does not exist on type 'typeof import("aws-cdk-lib/aws-autoscaling")'. Did you mean 'HealthCheck'?
199 healthCheckType: autoscaling.HealthCheckType.ELB,

lib/tap-stack.ts:206:7 - error TS2353: Object literal may only specify known properties, and 'scaleInCooldown' does not exist in type 'CpuUtilizationScalingProps'.
206 scaleInCooldown: cdk.Duration.seconds(300),

lib/tap-stack.ts:230:7 - error TS2561: Object literal may only specify known properties, but 'healthCheckPath' does not exist in type 'ApplicationTargetGroupProps'. Did you mean to write 'healthCheck'?
230 healthCheckPath: '/',
