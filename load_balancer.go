package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createLoadBalancer(ctx *pulumi.Context, vpcID string, environmentSuffix string) (*lb.LoadBalancer, *lb.TargetGroup, error) {
	// Security group for ALB
	albSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       pulumi.String(vpcID),
		Description: pulumi.String("Security group for Application Load Balancer"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(80),
				ToPort:     pulumi.Int(80),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
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
			"Name":        pulumi.Sprintf("alb-sg-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	// Get public subnets
	publicSubnets, err := ec2.GetSubnetIds(ctx, &ec2.GetSubnetIdsArgs{
		VpcId: vpcID,
		Tags: map[string]string{
			"Name": fmt.Sprintf("ecs-public-subnet-*-%s", environmentSuffix),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	// Create Application Load Balancer
	alb, err := lb.NewLoadBalancer(ctx, fmt.Sprintf("ecs-alb-%s", environmentSuffix), &lb.LoadBalancerArgs{
		Name:             pulumi.Sprintf("ecs-alb-%s", environmentSuffix),
		Internal:         pulumi.Bool(false),
		LoadBalancerType: pulumi.String("application"),
		SecurityGroups:   pulumi.StringArray{albSG.ID()},
		Subnets:          pulumi.ToStringArray(publicSubnets.Ids),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-alb-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	// Create target group for blue-green deployment
	targetGroup, err := lb.NewTargetGroup(ctx, fmt.Sprintf("ecs-tg-%s", environmentSuffix), &lb.TargetGroupArgs{
		Name:       pulumi.Sprintf("ecs-tg-%s", environmentSuffix),
		Port:       pulumi.Int(8080),
		Protocol:   pulumi.String("HTTP"),
		VpcId:      pulumi.String(vpcID),
		TargetType: pulumi.String("ip"),
		HealthCheck: &lb.TargetGroupHealthCheckArgs{
			Enabled:            pulumi.Bool(true),
			Path:               pulumi.String("/health"),
			Interval:           pulumi.Int(30),
			Timeout:            pulumi.Int(5),
			HealthyThreshold:   pulumi.Int(2),
			UnhealthyThreshold: pulumi.Int(3),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecs-tg-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, nil, err
	}

	// Create listener
	_, err = lb.NewListener(ctx, fmt.Sprintf("ecs-listener-%s", environmentSuffix), &lb.ListenerArgs{
		LoadBalancerArn: alb.Arn,
		Port:            pulumi.Int(80),
		Protocol:        pulumi.String("HTTP"),
		DefaultActions: lb.ListenerDefaultActionArray{
			&lb.ListenerDefaultActionArgs{
				Type:           pulumi.String("forward"),
				TargetGroupArn: targetGroup.Arn,
			},
		},
	})
	if err != nil {
		return nil, nil, err
	}

	return alb, targetGroup, nil
}
