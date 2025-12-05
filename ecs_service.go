package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createECSService(ctx *pulumi.Context, cluster *ecs.Cluster, taskDef *ecs.TaskDefinition, targetGroup *lb.TargetGroup, spotCP *ecs.CapacityProvider, onDemandCP *ecs.CapacityProvider, vpcID string, environmentSuffix string) (*ecs.Service, error) {
	// Security group for ECS tasks
	taskSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-task-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       pulumi.String(vpcID),
		Description: pulumi.String("Security group for ECS tasks"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(8080),
				ToPort:     pulumi.Int(8080),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("-1"),
				FromPort:   pulumi.Int(0),
				ToPort:     pulumi.Int(0),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-task-sg-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Get private subnets
	privateSubnets, err := ec2.GetSubnetIds(ctx, &ec2.GetSubnetIdsArgs{
		VpcId: vpcID,
		Tags: map[string]string{
			"Name": fmt.Sprintf("ecs-private-subnet-*-%s", environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create ECS service with 70% Fargate Spot, 30% On-Demand
	service, err := ecs.NewService(ctx, fmt.Sprintf("ecs-service-%s", environmentSuffix), &ecs.ServiceArgs{
		Name:           pulumi.Sprintf("fintech-service-%s", environmentSuffix),
		Cluster:        cluster.Arn,
		TaskDefinition: taskDef.Arn,
		DesiredCount:   pulumi.Int(3),
		LaunchType:     pulumi.String("FARGATE"),

		// Capacity provider strategy: 70% Spot, 30% On-Demand
		CapacityProviderStrategies: ecs.ServiceCapacityProviderStrategyArray{
			&ecs.ServiceCapacityProviderStrategyArgs{
				CapacityProvider: spotCP.Name,
				Weight:           pulumi.Int(70),
				Base:             pulumi.Int(0),
			},
			&ecs.ServiceCapacityProviderStrategyArgs{
				CapacityProvider: onDemandCP.Name,
				Weight:           pulumi.Int(30),
				Base:             pulumi.Int(1), // At least 1 on-demand for stability
			},
		},

		NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
			Subnets:        pulumi.ToStringArray(privateSubnets.Ids),
			SecurityGroups: pulumi.StringArray{taskSG.ID()},
			AssignPublicIp: pulumi.Bool(false),
		},

		LoadBalancers: ecs.ServiceLoadBalancerArray{
			&ecs.ServiceLoadBalancerArgs{
				TargetGroupArn: targetGroup.Arn,
				ContainerName:  pulumi.String("app"),
				ContainerPort:  pulumi.Int(8080),
			},
		},

		// Blue-green deployment configuration
		DeploymentController: &ecs.ServiceDeploymentControllerArgs{
			Type: pulumi.String("CODE_DEPLOY"),
		},

		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fintech-service-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	return service, nil
}
