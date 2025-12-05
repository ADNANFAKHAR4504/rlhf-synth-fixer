package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createVPCEndpoints(ctx *pulumi.Context, vpcID string, environmentSuffix string) ([]pulumi.StringOutput, error) {
	// Security group for VPC endpoints
	endpointSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("vpc-endpoint-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       pulumi.String(vpcID),
		Description: pulumi.String("Security group for VPC endpoints"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
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
			"Name":        pulumi.Sprintf("vpc-endpoint-sg-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Get private subnets for interface endpoints
	privateSubnets, err := ec2.GetSubnetIds(ctx, &ec2.GetSubnetIdsArgs{
		VpcId: vpcID,
		Tags: map[string]string{
			"Name": fmt.Sprintf("ecs-private-subnet-*-%s", environmentSuffix),
		},
	})
	if err != nil {
		// If subnets don't exist yet, use empty array
		privateSubnets = &ec2.GetSubnetIdsResult{Ids: []string{}}
	}

	var endpoints []pulumi.StringOutput

	// S3 Gateway Endpoint (free)
	s3Endpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("s3-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:           pulumi.String(vpcID),
		ServiceName:     pulumi.String("com.amazonaws.us-east-1.s3"),
		VpcEndpointType: pulumi.String("Gateway"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("s3-endpoint-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	endpoints = append(endpoints, s3Endpoint.ID().ToStringOutput())

	// ECR API Interface Endpoint
	ecrAPIEndpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("ecr-api-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:             pulumi.String(vpcID),
		ServiceName:       pulumi.String("com.amazonaws.us-east-1.ecr.api"),
		VpcEndpointType:   pulumi.String("Interface"),
		SecurityGroupIds:  pulumi.StringArray{endpointSG.ID()},
		SubnetIds:         pulumi.ToStringArray(privateSubnets.Ids),
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecr-api-endpoint-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	endpoints = append(endpoints, ecrAPIEndpoint.ID().ToStringOutput())

	// ECR DKR Interface Endpoint
	ecrDKREndpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("ecr-dkr-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:             pulumi.String(vpcID),
		ServiceName:       pulumi.String("com.amazonaws.us-east-1.ecr.dkr"),
		VpcEndpointType:   pulumi.String("Interface"),
		SecurityGroupIds:  pulumi.StringArray{endpointSG.ID()},
		SubnetIds:         pulumi.ToStringArray(privateSubnets.Ids),
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("ecr-dkr-endpoint-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	endpoints = append(endpoints, ecrDKREndpoint.ID().ToStringOutput())

	// CloudWatch Logs Interface Endpoint
	logsEndpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("logs-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:             pulumi.String(vpcID),
		ServiceName:       pulumi.String("com.amazonaws.us-east-1.logs"),
		VpcEndpointType:   pulumi.String("Interface"),
		SecurityGroupIds:  pulumi.StringArray{endpointSG.ID()},
		SubnetIds:         pulumi.ToStringArray(privateSubnets.Ids),
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("logs-endpoint-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	endpoints = append(endpoints, logsEndpoint.ID().ToStringOutput())

	// Secrets Manager Interface Endpoint
	secretsEndpoint, err := ec2.NewVpcEndpoint(ctx, fmt.Sprintf("secretsmanager-endpoint-%s", environmentSuffix), &ec2.VpcEndpointArgs{
		VpcId:             pulumi.String(vpcID),
		ServiceName:       pulumi.String("com.amazonaws.us-east-1.secretsmanager"),
		VpcEndpointType:   pulumi.String("Interface"),
		SecurityGroupIds:  pulumi.StringArray{endpointSG.ID()},
		SubnetIds:         pulumi.ToStringArray(privateSubnets.Ids),
		PrivateDnsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("secretsmanager-endpoint-%s", environmentSuffix),
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	endpoints = append(endpoints, secretsEndpoint.ID().ToStringOutput())

	return endpoints, nil
}
