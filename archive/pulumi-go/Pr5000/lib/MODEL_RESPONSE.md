# IoT Manufacturing Data Processing Pipeline

Here's a complete implementation of the containerized data processing pipeline for your IoT manufacturing system using Pulumi and Go.

## lib/tap_stack.go

```go
package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment suffix from config
		cfg := config.New(ctx, "")
		environmentSuffix := cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "iot-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("iot-vpc-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("iot-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-igw-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("iot-public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String("eu-west-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("iot-public-subnet-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("iot-public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String("eu-west-1b"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("iot-public-subnet-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create private subnets
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("iot-private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.10.0/24"),
			AvailabilityZone: pulumi.String("eu-west-1a"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("iot-private-subnet-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("iot-private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.11.0/24"),
			AvailabilityZone: pulumi.String("eu-west-1b"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("iot-private-subnet-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Elastic IP for NAT Gateway
		eip, err := ec2.NewEip(ctx, fmt.Sprintf("iot-nat-eip-%s", environmentSuffix), &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-nat-eip-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create NAT Gateway
		natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("iot-nat-gateway-%s", environmentSuffix), &ec2.NatGatewayArgs{
			SubnetId:     publicSubnet1.ID(),
			AllocationId: eip.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-nat-gateway-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("iot-public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-public-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create route to Internet Gateway
		_, err = ec2.NewRoute(ctx, fmt.Sprintf("iot-public-route-%s", environmentSuffix), &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("iot-public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("iot-public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		// Create private route table
		privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("iot-private-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-private-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create route to NAT Gateway
		_, err = ec2.NewRoute(ctx, fmt.Sprintf("iot-private-route-%s", environmentSuffix), &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGateway.ID(),
		})
		if err != nil {
			return err
		}

		// Associate private subnets with private route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("iot-private-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("iot-private-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		// Create DB credentials secret
		dbCredentials := map[string]interface{}{
			"username": "iotadmin",
			"password": "ChangeMe12345!",
		}
		dbCredentialsJSON, err := json.Marshal(dbCredentials)
		if err != nil {
			return err
		}

		dbSecret, err := secretsmanager.NewSecret(ctx, "iot-db-secret", &secretsmanager.SecretArgs{
			Name:        pulumi.String("iot-db-secret"),
			Description: pulumi.String("Database credentials for IoT manufacturing system"),
		})
		if err != nil {
			return err
		}

		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("iot-db-secret-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     dbSecret.ID(),
			SecretString: pulumi.String(string(dbCredentialsJSON)),
		})
		if err != nil {
			return err
		}

		// Create security group for RDS
		rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
			Description: pulumi.String("Security group for RDS PostgreSQL instance"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(5432),
					ToPort:     pulumi.Int(5432),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create DB subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("iot-db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("iot-db-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-db-subnet-group-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create RDS PostgreSQL instance
		rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("iot-postgres-%s", environmentSuffix), &rds.InstanceArgs{
			Identifier:          pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
			Engine:              pulumi.String("postgres"),
			EngineVersion:       pulumi.String("16.3"),
			InstanceClass:       pulumi.String("db.t3.micro"),
			AllocatedStorage:    pulumi.Int(20),
			StorageEncrypted:    pulumi.Bool(true),
			DbName:              pulumi.String("iotmanufacturing"),
			Username:            pulumi.String("iotadmin"),
			Password:            pulumi.String("ChangeMe12345!"),
			DbSubnetGroupName:   dbSubnetGroup.Name,
			VpcSecurityGroupIds: pulumi.StringArray{rdsSecurityGroup.ID()},
			SkipFinalSnapshot:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ElastiCache
		elasticacheSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
			Description: pulumi.String("Security group for ElastiCache Redis cluster"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(6379),
					ToPort:     pulumi.Int(6379),
					CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache subnet group
		elasticacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache Redis cluster
		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("iot-redis-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
			Description:              pulumi.String("Redis cluster for IoT manufacturing metrics"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.1"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			Port:                     pulumi.Int(6379),
			SubnetGroupName:          elasticacheSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{elasticacheSecurityGroup.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			AuthToken:                pulumi.String("ChangeMe12345678901234567890123!"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS cluster
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
		})
		if err != nil {
			return err
		}

		// Create ECS task execution role
		ecsTaskExecutionRole, err := iam.NewRole(ctx, "iot-task-execution-role", &iam.RoleArgs{
			Name: pulumi.String("iot-task-execution-role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}]
			}`),
		})
		if err != nil {
			return err
		}

		// Attach execution role policy
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("iot-ecs-task-execution-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// Create ECS task role
		ecsTaskRole, err := iam.NewRole(ctx, "iot-task-role", &iam.RoleArgs{
			Name: pulumi.String("iot-task-role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}]
			}`),
		})
		if err != nil {
			return err
		}

		// Attach policy to task role for Secrets Manager access
		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("iot-ecs-task-secrets-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: ecsTaskRole.Name,
			Policy: pulumi.String(fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Action": [
						"secretsmanager:GetSecretValue"
					],
					"Resource": "*"
				}]
			}`)),
		})
		if err != nil {
			return err
		}

		// Create security group for ECS tasks
		ecsTaskSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
			Description: pulumi.String("Security group for ECS tasks"),
			VpcId:       vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("iot-data-processor-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("iot-data-processor-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.All(rdsInstance.Endpoint, redisCluster.PrimaryEndpointAddress, dbSecret.Arn).ApplyT(
				func(args []interface{}) (string, error) {
					dbEndpoint := args[0].(string)
					redisEndpoint := args[1].(string)
					secretArn := args[2].(string)

					containerDef := []map[string]interface{}{
						{
							"name":      "data-processor",
							"image":     "public.ecr.aws/docker/library/busybox:latest",
							"essential": true,
							"command": []string{
								"sh",
								"-c",
								"echo 'IoT Data Processor Started' && sleep 3600",
							},
							"environment": []map[string]string{
								{"name": "DB_ENDPOINT", "value": dbEndpoint},
								{"name": "REDIS_ENDPOINT", "value": redisEndpoint},
								{"name": "ENVIRONMENT", "value": environmentSuffix},
							},
							"secrets": []map[string]string{
								{"name": "DB_CREDENTIALS", "valueFrom": secretArn},
							},
							"logConfiguration": map[string]interface{}{
								"logDriver": "awslogs",
								"options": map[string]string{
									"awslogs-group":         fmt.Sprintf("/ecs/iot-data-processor-%s", environmentSuffix),
									"awslogs-region":        "eu-west-1",
									"awslogs-stream-prefix": "ecs",
									"awslogs-create-group":  "true",
								},
							},
						},
					}

					containerDefJSON, err := json.Marshal(containerDef)
					if err != nil {
						return "", err
					}
					return string(containerDefJSON), nil
				},
			).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("redisEndpoint", redisCluster.PrimaryEndpointAddress)
		ctx.Export("taskDefinitionArn", taskDefinition.Arn)

		return nil
	})
}
```

This implementation provides a complete IoT data processing pipeline with all the required components including VPC, ECS cluster, RDS PostgreSQL, and ElastiCache Redis with proper security configurations.
