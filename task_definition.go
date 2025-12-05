package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createOptimizedTaskDefinition(ctx *pulumi.Context, ecrRepo pulumi.StringOutput, params []pulumi.StringOutput, environmentSuffix string) (*ecs.TaskDefinition, error) {
	// Create task execution role
	taskExecRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-exec-role-%s", environmentSuffix), &iam.RoleArgs{
		Name: pulumi.Sprintf("ecs-task-exec-role-%s", environmentSuffix),
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Action": "sts:AssumeRole",
				"Principal": {
					"Service": "ecs-tasks.amazonaws.com"
				},
				"Effect": "Allow"
			}]
		}`),
		ManagedPolicyArns: pulumi.StringArray{
			pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-task-exec-role-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Add policy for Parameter Store and Secrets Manager access
	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ecs-task-exec-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
		Role: taskExecRole.ID(),
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"ssm:GetParameters",
						"secretsmanager:GetSecretValue"
					],
					"Resource": "*"
				}
			]
		}`),
	})
	if err != nil {
		return nil, err
	}

	// Create task role
	taskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
		Name: pulumi.Sprintf("ecs-task-role-%s", environmentSuffix),
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Action": "sts:AssumeRole",
				"Principal": {
					"Service": "ecs-tasks.amazonaws.com"
				},
				"Effect": "Allow"
			}]
		}`),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-task-role-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Optimized container definition with right-sized CPU/memory
	containerDef := pulumi.All(ecrRepo, params[0]).ApplyT(func(args []interface{}) (string, error) {
		repo := args[0].(string)
		dbHostParam := args[1].(string)

		containerJSON := []map[string]interface{}{
			{
				"name":      "app",
				"image":     fmt.Sprintf("%s:latest", repo),
				"cpu":       256, // Optimized from 512
				"memory":    512, // Optimized from 1024
				"essential": true,
				"portMappings": []map[string]interface{}{
					{
						"containerPort": 8080,
						"protocol":      "tcp",
					},
				},
				"logConfiguration": map[string]interface{}{
					"logDriver": "awslogs",
					"options": map[string]interface{}{
						"awslogs-group":         fmt.Sprintf("/ecs/fintech-%s", environmentSuffix),
						"awslogs-region":        "us-east-1",
						"awslogs-stream-prefix": "ecs",
					},
				},
				"secrets": []map[string]interface{}{
					{
						"name":      "DB_HOST",
						"valueFrom": dbHostParam,
					},
				},
			},
		}

		jsonBytes, err := json.Marshal(containerJSON)
		if err != nil {
			return "", err
		}

		return string(jsonBytes), nil
	}).(pulumi.StringOutput)

	// Create task definition with optimized CPU/memory
	taskDef, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("ecs-task-def-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
		Family:                  pulumi.Sprintf("fintech-app-%s", environmentSuffix),
		NetworkMode:             pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
		Cpu:                     pulumi.String("256"), // Optimized from 512
		Memory:                  pulumi.String("512"), // Optimized from 1024
		ExecutionRoleArn:        taskExecRole.Arn,
		TaskRoleArn:             taskRole.Arn,
		ContainerDefinitions:    containerDef,
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("fintech-app-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	return taskDef, nil
}
