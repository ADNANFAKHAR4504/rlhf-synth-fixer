package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createCloudWatchAlarms(ctx *pulumi.Context, cluster *ecs.Cluster, service *ecs.Service, environmentSuffix string) error {
	// Create CloudWatch Log Group
	_, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-log-group-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
		Name:            pulumi.Sprintf("/ecs/fintech-%s", environmentSuffix),
		RetentionInDays: pulumi.Int(7),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-logs-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return err
	}

	// Alarm for Fargate Spot interruptions
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("fargate-spot-interruption-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("fargate-spot-interruption-%s", environmentSuffix),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("FargateSpotInterruptionCount"),
		Namespace:          pulumi.String("AWS/ECS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.Float64(1.0),
		AlarmDescription:   pulumi.String("Alert when Fargate Spot tasks are interrupted"),
		Dimensions: pulumi.StringMap{
			"ClusterName": cluster.Name,
			"ServiceName": service.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fargate-spot-interruption-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return err
	}

	// Alarm for high CPU utilization
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-high-cpu-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("ecs-high-cpu-%s", environmentSuffix),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("CPUUtilization"),
		Namespace:          pulumi.String("AWS/ECS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(85.0),
		AlarmDescription:   pulumi.String("Alert when CPU utilization is high"),
		Dimensions: pulumi.StringMap{
			"ClusterName": cluster.Name,
			"ServiceName": service.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-high-cpu-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return err
	}

	// Alarm for high memory utilization
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-high-memory-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("ecs-high-memory-%s", environmentSuffix),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("MemoryUtilization"),
		Namespace:          pulumi.String("AWS/ECS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(85.0),
		AlarmDescription:   pulumi.String("Alert when memory utilization is high"),
		Dimensions: pulumi.StringMap{
			"ClusterName": cluster.Name,
			"ServiceName": service.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-high-memory-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return err
	}

	return nil
}
