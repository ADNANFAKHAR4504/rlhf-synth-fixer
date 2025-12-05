package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/appautoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createAutoScalingPolicies(ctx *pulumi.Context, cluster *ecs.Cluster, service *ecs.Service, environmentSuffix string) error {
	// Create auto-scaling target
	target, err := appautoscaling.NewTarget(ctx, fmt.Sprintf("ecs-autoscaling-target-%s", environmentSuffix), &appautoscaling.TargetArgs{
		MaxCapacity:       pulumi.Int(10),
		MinCapacity:       pulumi.Int(3),
		ResourceId:        pulumi.Sprintf("service/%s/%s", cluster.Name, service.Name),
		ScalableDimension: pulumi.String("ecs:service:DesiredCount"),
		ServiceNamespace:  pulumi.String("ecs"),
	})
	if err != nil {
		return err
	}

	// CPU utilization scaling policy
	_, err = appautoscaling.NewPolicy(ctx, fmt.Sprintf("ecs-cpu-scaling-%s", environmentSuffix), &appautoscaling.PolicyArgs{
		Name:              pulumi.Sprintf("ecs-cpu-scaling-%s", environmentSuffix),
		PolicyType:        pulumi.String("TargetTrackingScaling"),
		ResourceId:        target.ResourceId,
		ScalableDimension: target.ScalableDimension,
		ServiceNamespace:  target.ServiceNamespace,
		TargetTrackingScalingPolicyConfiguration: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs{
			PredefinedMetricSpecification: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
				PredefinedMetricType: pulumi.String("ECSServiceAverageCPUUtilization"),
			},
			TargetValue:      pulumi.Float64(70.0),
			ScaleInCooldown:  pulumi.Int(300),
			ScaleOutCooldown: pulumi.Int(60),
		},
	})
	if err != nil {
		return err
	}

	// Memory utilization scaling policy
	_, err = appautoscaling.NewPolicy(ctx, fmt.Sprintf("ecs-memory-scaling-%s", environmentSuffix), &appautoscaling.PolicyArgs{
		Name:              pulumi.Sprintf("ecs-memory-scaling-%s", environmentSuffix),
		PolicyType:        pulumi.String("TargetTrackingScaling"),
		ResourceId:        target.ResourceId,
		ScalableDimension: target.ScalableDimension,
		ServiceNamespace:  target.ServiceNamespace,
		TargetTrackingScalingPolicyConfiguration: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs{
			PredefinedMetricSpecification: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
				PredefinedMetricType: pulumi.String("ECSServiceAverageMemoryUtilization"),
			},
			TargetValue:      pulumi.Float64(75.0),
			ScaleInCooldown:  pulumi.Int(300),
			ScaleOutCooldown: pulumi.Int(60),
		},
	})
	if err != nil {
		return err
	}

	return nil
}
