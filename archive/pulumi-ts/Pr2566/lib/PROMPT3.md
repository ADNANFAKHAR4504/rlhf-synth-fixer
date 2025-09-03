The code you gave is failing to deploy with the following errors -

```bash
reviewing update (TapStackpr2431):

 +  pulumi:pulumi:Stack TapStack-TapStackpr2431 create
@ previewing update........
 +  pulumi:pulumi:Stack TapStack-TapStackpr2431 create error: Running program '/home/runner/work/iac-test-automations/iac-test-automations/bin/tap.ts' failed with an unhandled exception:
 +  pulumi:pulumi:Stack TapStack-TapStackpr2431 create 1 error
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2431):
    error: Running program '/home/runner/work/iac-test-automations/iac-test-automations/bin/tap.ts' failed with an unhandled exception:
    TSError: ⨯ Unable to compile TypeScript:
    ../lib/production-infrastructure.ts(16,10): error TS2564: Property 'vpc' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(17,10): error TS2564: Property 'publicSubnets' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(18,10): error TS2564: Property 'privateSubnets' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(19,10): error TS2564: Property 'internetGateway' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(20,10): error TS2564: Property 'natGateway' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(21,10): error TS2564: Property 'elasticIp' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(22,10): error TS2564: Property 'publicRouteTable' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(23,10): error TS2564: Property 'privateRouteTable' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(24,10): error TS2564: Property 'vpcFlowLogGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(25,10): error TS2564: Property 'vpcFlowLogRole' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(26,10): error TS2564: Property 'vpcFlowLog' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(27,10): error TS2564: Property 'ec2SecurityGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(28,10): error TS2564: Property 'rdsSecurityGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(29,10): error TS2564: Property 'albSecurityGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(30,10): error TS2564: Property 'ec2Role' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(31,10): error TS2564: Property 'ec2InstanceProfile' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(32,10): error TS2564: Property 'kmsKey' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(33,10): error TS2564: Property 's3Bucket' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(34,10): error TS2564: Property 'rdsSubnetGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(35,10): error TS2564: Property 'rdsInstance' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(36,10): error TS2564: Property 'launchTemplate' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(37,10): error TS2564: Property 'targetGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(38,10): error TS2564: Property 'applicationLoadBalancer' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(39,10): error TS2564: Property 'albListener' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(40,10): error TS2564: Property 'autoScalingGroup' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(41,10): error TS2564: Property 'scaleUpPolicy' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(42,10): error TS2564: Property 'scaleDownPolicy' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(43,10): error TS2564: Property 'cpuAlarmHigh' has no initializer and is not definitely assigned in the constructor.
    ../lib/production-infrastructure.ts(44,10): error TS2564: Property 'cpuAlarmLow' has no initializer and is not definitely assigned in the constructor.
```
