package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createECSCluster(ctx *pulumi.Context, environmentSuffix string) (*ecs.Cluster, error) {
	// Create ECS cluster with Container Insights enabled
	cluster, err := ecs.NewCluster(ctx, fmt.Sprintf("ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
		Name: pulumi.Sprintf("fintech-ecs-%s", environmentSuffix),
		Settings: ecs.ClusterSettingArray{
			&ecs.ClusterSettingArgs{
				Name:  pulumi.String("containerInsights"),
				Value: pulumi.String("enabled"),
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fintech-ecs-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	return cluster, nil
}

func createCapacityProviders(ctx *pulumi.Context, clusterName pulumi.StringOutput, environmentSuffix string) (*ecs.CapacityProvider, *ecs.CapacityProvider, error) {
	// Fargate Spot capacity provider
	spotCP, err := ecs.NewCapacityProvider(ctx, fmt.Sprintf("fargate-spot-cp-%s", environmentSuffix), &ecs.CapacityProviderArgs{
		Name: pulumi.Sprintf("fargate-spot-%s", environmentSuffix),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fargate-spot-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	// Fargate on-demand capacity provider
	onDemandCP, err := ecs.NewCapacityProvider(ctx, fmt.Sprintf("fargate-ondemand-cp-%s", environmentSuffix), &ecs.CapacityProviderArgs{
		Name: pulumi.Sprintf("fargate-ondemand-%s", environmentSuffix),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fargate-ondemand-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	return spotCP, onDemandCP, nil
}
