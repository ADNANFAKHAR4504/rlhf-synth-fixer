Infrastructure Changes Needed to Fix MODEL_RESPONSE

Missing Scheduled Scaling Configuration

The MODEL_RESPONSE likely uses incorrect scheduled scaling syntax or missing scheduled actions. The IDEAL_RESPONSE uses scalableTarget.addScheduledAction with proper cron expressions for EST timezone.

Fix: Replace any incorrect scheduled scaling with:
- scalableTarget.addScheduledAction(applicationautoscaling.Schedule.cron({ hour: '9', minute: '0', timeZone: 'America/New_York' }), { minCapacity: 10, maxCapacity: 20 })
- scalableTarget.addScheduledAction(applicationautoscaling.Schedule.cron({ hour: '18', minute: '0', timeZone: 'America/New_York' }), { minCapacity: 2, maxCapacity: 10 })

Incorrect Target Tracking Scale-In Threshold

The MODEL_RESPONSE may set targetValue to 60% for both scale-out and scale-in. The IDEAL_RESPONSE uses 60% targetValue which automatically handles scale-in at 20% when below target.

Fix: Ensure targetValue is 60.0 for both CPU and Memory target tracking policies. The scale-in behavior is automatic when metrics drop below the target value.

Missing Step Scaling Alarm Action

The MODEL_RESPONSE may create step scaling policy without connecting it to an alarm action. The IDEAL_RESPONSE creates a CloudWatch alarm and connects it to the step scaling policy using StepScalingAction.

Fix: Create stepScalingAlarm and connect it to stepScaling using:
- stepScalingAlarm.addAlarmAction(new applicationautoscaling.StepScalingAction(stepScaling))

Incorrect Cooldown Periods

The MODEL_RESPONSE may use incorrect cooldown values. The IDEAL_RESPONSE uses 300 seconds for scale-in and 60 seconds for scale-out as specified in requirements.

Fix: Set scaleInCooldown to cdk.Duration.seconds(300) and scaleOutCooldown to cdk.Duration.seconds(60) in target tracking policies.

Missing Target Group Deregistration Delay

The MODEL_RESPONSE may not configure the 60-second deregistration delay for ALB target groups. The IDEAL_RESPONSE sets this attribute when targetGroupArns are provided.

Fix: Add targetGroup.setAttribute('deregistration_delay.timeout_seconds', '60') when target group ARNs are available.

Incorrect Cost Anomaly Detector Configuration

The MODEL_RESPONSE may use wrong monitorSpecification format. The IDEAL_RESPONSE uses JSON.stringify to properly format the monitor specification.

Fix: Use JSON.stringify({ Dimension: 'SERVICE', MatchOptions: ['EQUALS'], Values: ['Amazon Elastic Container Service'] }) for monitorSpecification.

Missing IAM Role for Auto-Scaling

The MODEL_RESPONSE may not create the scaling role or use incorrect permissions. The IDEAL_RESPONSE creates a role with ApplicationAutoScalingForECSService managed policy and additional inline permissions.

Fix: Create IAM role with service principal 'application-autoscaling.amazonaws.com', attach managed policy 'service-role/ApplicationAutoScalingForECSService', and add inline policy with ecs:DescribeServices, ecs:UpdateService, and CloudWatch permissions.

Incorrect Dashboard Widget Configuration

The MODEL_RESPONSE may not add all required widgets or use wrong metric dimensions. The IDEAL_RESPONSE adds widgets for task count, CPU/Memory per service, ALB metrics, and cost signals.

Fix: Add GraphWidget instances for DesiredTaskCount, RunningTaskCount, CPUUtilization, MemoryUtilization, ALB RequestCount, ALB 5xx errors, and Billing EstimatedCharges with correct dimensions.

Missing Service Tags

The MODEL_RESPONSE may not apply Service and Environment tags to all resources. The IDEAL_RESPONSE applies these tags to all resources including SNS topic, cost anomaly detector, scaling role, dashboard, scalable targets, policies, and alarms.

Fix: Add cdk.Tags.of(resource).add('Service', 'FinancialServices') and cdk.Tags.of(resource).add('Environment', environmentSuffix) to all resources.

Incorrect Step Scaling Adjustments

The MODEL_RESPONSE may not configure three step adjustments correctly. The IDEAL_RESPONSE adds three adjustments: +2 tasks for 0-50% CPU, +4 tasks for 50-75% CPU, and +6 tasks for 75%+ CPU.

Fix: Add three step adjustments using stepScaling.addAdjustment with scalingAdjustment values of 2, 4, and 6, with proper lowerBound and upperBound values.

Missing ALB 5xx Error Alarm

The MODEL_RESPONSE may not create alarm for ALB 5xx errors. The IDEAL_RESPONSE creates an alarm monitoring HTTPCode_Target_5XX_Count metric with threshold of 10 and connects it to SNS.

Fix: Create CloudWatch alarm for HTTPCode_Target_5XX_Count metric with threshold 10, evaluationPeriods 2, and connect to SNS topic.

Incorrect Resource ID Format for Scalable Targets

The MODEL_RESPONSE may use wrong format for resourceId. The IDEAL_RESPONSE uses format 'service/${clusterName}/${serviceName}' for ECS scalable targets.

Fix: Set resourceId to `service/${clusterName}/${serviceName}` format for all scalable targets.

Missing Capacity Provider Strategy Configuration

The MODEL_RESPONSE may attempt to modify existing services directly which is not possible in CDK. The IDEAL_RESPONSE includes a comment noting that capacity provider strategy should be configured via AWS Console, CLI, or custom resource.

Fix: Add comment explaining that capacity provider strategy for existing services needs to be configured separately, with recommended strategy of FARGATE (weight: 1, base: 1) and FARGATE_SPOT (weight: 3, base: 0).

Incorrect Metric Period Configuration

The MODEL_RESPONSE may use wrong periods for CloudWatch metrics. The IDEAL_RESPONSE uses 1 minute period for target tracking, 5 minutes for alarms, and 1 hour for cost metrics.

Fix: Set period to cdk.Duration.minutes(1) for target tracking metrics, cdk.Duration.minutes(5) for alarm metrics, and cdk.Duration.hours(1) for cost metrics.

Missing Cost Anomaly Subscription

The MODEL_RESPONSE may create detector without subscription. The IDEAL_RESPONSE creates CfnAnomalySubscription with threshold 50.0, frequency IMMEDIATE, and connects to SNS topic.

Fix: Create CfnAnomalySubscription with monitorArnList referencing the detector, subscribers array with SNS topic ARN, threshold 50.0, and frequency 'IMMEDIATE'.
