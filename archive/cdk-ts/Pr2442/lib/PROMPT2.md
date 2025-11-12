I am facing this issue during synth:

```
ValidationError: You must supply at least 2 intervals for autoscaling
    at path [TapStackdev/ScaleDownPolicy] in aws-cdk-lib.aws_autoscaling.StepScalingPolicy

    at new TapStack (/Users/sivakumar/Documents/turing/iac-test-automations/lib/tap-stack.ts:262:5)
```

The issue is in the ScaleDownPolicy StepScalingPolicy configuration. Currently it only has one scaling step:

```typescript
scalingSteps: [{ upper: 30, change: -1 }]
```

But AWS requires at least 2 intervals for StepScalingPolicy. 

Fix this by updating the ScaleDownPolicy to have proper step intervals that meet AWS requirements.
