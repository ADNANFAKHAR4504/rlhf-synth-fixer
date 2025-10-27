package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi-random/sdk/v4/go/random"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration
		cfg := config.New(ctx, "")
		region := cfg.Get("region")
		if region == "" {
			region = "us-east-1"
		}

		// Get environment suffix from config or environment variable
		environmentSuffix := cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			environmentSuffix = os.Getenv("ENVIRONMENT_SUFFIX")
			if environmentSuffix == "" {
				poId := cfg.Get("po_id")
				if poId == "" {
					poId = "5596902889"
				}
				environmentSuffix = fmt.Sprintf("synth%s", poId)
			}
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("healthcare-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-monitoring-vpc-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("healthcare-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-igw-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Get availability zones
		azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		})
		if err != nil {
			return err
		}

		// Create public subnets
		var publicSubnets []*ec2.Subnet
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d-%s", i, environmentSuffix), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i)),
				AvailabilityZone:    pulumi.String(azs.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("healthcare-public-subnet-%d-%s", i, environmentSuffix)),
					"Type": pulumi.String("public"),
				},
			})
			if err != nil {
				return err
			}
			publicSubnets = append(publicSubnets, subnet)
		}

		// Create private subnets
		var privateSubnets []*ec2.Subnet
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d-%s", i, environmentSuffix), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
				AvailabilityZone: pulumi.String(azs.Names[i]),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("healthcare-private-subnet-%d-%s", i, environmentSuffix)),
					"Type": pulumi.String("private"),
				},
			})
			if err != nil {
				return err
			}
			privateSubnets = append(privateSubnets, subnet)
		}

		// Allocate Elastic IP for NAT Gateway
		eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%s", environmentSuffix), &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-nat-eip-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create NAT Gateway
		natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%s", environmentSuffix), &ec2.NatGatewayArgs{
			SubnetId:     publicSubnets[0].ID(),
			AllocationId: eip.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-nat-gateway-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create public route table
		publicRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-public-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d-%s", i, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRt.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create private route table
		privateRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock:    pulumi.String("0.0.0.0/0"),
					NatGatewayId: natGw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-private-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Associate private subnets with private route table
		for i, subnet := range privateSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%d-%s", i, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: privateRt.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security group for RDS
		rdsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for Aurora database"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(5432),
					ToPort:     pulumi.Int(5432),
					CidrBlocks: pulumi.StringArray{vpc.CidrBlock},
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
				"Name": pulumi.String(fmt.Sprintf("healthcare-rds-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ECS tasks
		ecsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ECS tasks"),
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
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ElastiCache
		cacheSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("cache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ElastiCache Redis"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(6379),
					ToPort:         pulumi.Int(6379),
					SecurityGroups: pulumi.StringArray{ecsSg.ID()},
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
				"Name": pulumi.String(fmt.Sprintf("healthcare-cache-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Generate random password for database
		// Exclude characters that AWS RDS doesn't allow: / @ " and space
		dbPassword, err := random.NewRandomPassword(ctx, fmt.Sprintf("db-password-%s", environmentSuffix), &random.RandomPasswordArgs{
			Length:          pulumi.Int(32),
			Special:         pulumi.Bool(true),
			OverrideSpecial: pulumi.String("!#$%&*()-_=+[]{}<>:?"),
		})
		if err != nil {
			return err
		}

		// Create Secrets Manager secret for database credentials
		dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("db-credentials-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Name:        pulumi.String(fmt.Sprintf("healthcare-db-credentials-%s", environmentSuffix)),
			Description: pulumi.String("Aurora database master credentials"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-db-credentials-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Store credentials in Secrets Manager
		dbSecretVersion, err := secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("db-credentials-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId: dbSecret.ID(),
			SecretString: pulumi.All(dbPassword.Result).ApplyT(func(args []interface{}) (string, error) {
				password := args[0].(string)
				credentials := map[string]string{
					"username": "healthcare_admin",
					"password": password,
					"engine":   "postgres",
				}
				jsonBytes, err := json.Marshal(credentials)
				if err != nil {
					return "", err
				}
				return string(jsonBytes), nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create rotation lambda role (required for secret rotation)
		rotationLambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("rotation-lambda-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "lambda.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
			ManagedPolicyArns: pulumi.StringArray{
				pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
				pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("rotation-lambda-role-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Note: Secret rotation requires a Lambda function which is complex to set up
		// For now, we'll skip the rotation setup to avoid deployment complexity
		// In production, you would need to create a Lambda function for rotation
		_ = rotationLambdaRole
		_ = dbSecretVersion

		// Create DB subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-db-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{
				privateSubnets[0].ID(),
				privateSubnets[1].ID(),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-db-subnet-group-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create Aurora cluster parameter group
		clusterParamGroup, err := rds.NewClusterParameterGroup(ctx, fmt.Sprintf("aurora-cluster-pg-%s", environmentSuffix), &rds.ClusterParameterGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("healthcare-aurora-pg-%s", environmentSuffix)),
			Family:      pulumi.String("aurora-postgresql14"),
			Description: pulumi.String("Aurora cluster parameter group for healthcare monitoring"),
			Parameters: rds.ClusterParameterGroupParameterArray{
				&rds.ClusterParameterGroupParameterArgs{
					Name:  pulumi.String("log_statement"),
					Value: pulumi.String("all"),
				},
				&rds.ClusterParameterGroupParameterArgs{
					Name:  pulumi.String("log_min_duration_statement"),
					Value: pulumi.String("1000"),
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-aurora-cluster-pg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM role for enhanced monitoring
		monitoringRole, err := iam.NewRole(ctx, fmt.Sprintf("rds-monitoring-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-rds-monitoring-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "monitoring.rds.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
			ManagedPolicyArns: pulumi.StringArray{
				pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-rds-monitoring-role-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create Aurora Serverless v2 cluster
		auroraCluster, err := rds.NewCluster(ctx, fmt.Sprintf("aurora-cluster-%s", environmentSuffix), &rds.ClusterArgs{
			ClusterIdentifier:           pulumi.String(fmt.Sprintf("healthcare-aurora-%s", environmentSuffix)),
			Engine:                      pulumi.String("aurora-postgresql"),
			EngineMode:                  pulumi.String("provisioned"),
			EngineVersion:               pulumi.String("14.9"),
			DatabaseName:                pulumi.String("healthcaredb"),
			MasterUsername:              pulumi.String("healthcare_admin"),
			MasterPassword:              dbPassword.Result,
			DbSubnetGroupName:           dbSubnetGroup.Name,
			VpcSecurityGroupIds:         pulumi.StringArray{rdsSg.ID()},
			DbClusterParameterGroupName: clusterParamGroup.Name,
			BackupRetentionPeriod:       pulumi.Int(35),
			PreferredBackupWindow:       pulumi.String("03:00-04:00"),
			PreferredMaintenanceWindow:  pulumi.String("sun:04:00-sun:05:00"),
			EnabledCloudwatchLogsExports: pulumi.StringArray{
				pulumi.String("postgresql"),
			},
			StorageEncrypted: pulumi.Bool(true),
			Serverlessv2ScalingConfiguration: &rds.ClusterServerlessv2ScalingConfigurationArgs{
				MinCapacity: pulumi.Float64(0.5),
				MaxCapacity: pulumi.Float64(4.0),
			},
			SkipFinalSnapshot: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-aurora-cluster-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create Aurora Serverless v2 instance
		auroraInstance, err := rds.NewClusterInstance(ctx, fmt.Sprintf("aurora-instance-%s", environmentSuffix), &rds.ClusterInstanceArgs{
			Identifier:                         pulumi.String(fmt.Sprintf("healthcare-aurora-instance-%s", environmentSuffix)),
			ClusterIdentifier:                  auroraCluster.ID(),
			InstanceClass:                      pulumi.String("db.serverless"),
			Engine:                             pulumi.String("aurora-postgresql"),
			EngineVersion:                      pulumi.String("14.9"),
			PubliclyAccessible:                 pulumi.Bool(false),
			MonitoringInterval:                 pulumi.Int(60),
			MonitoringRoleArn:                  monitoringRole.Arn,
			PerformanceInsightsEnabled:         pulumi.Bool(true),
			PerformanceInsightsRetentionPeriod: pulumi.Int(7),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-aurora-instance-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache subnet group
		cacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-cache-subnet-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{
				privateSubnets[0].ID(),
				privateSubnets[1].ID(),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-cache-subnet-group-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache Redis replication group
		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("redis-cluster-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("healthcare-redis-%s", environmentSuffix)),
			Description:              pulumi.String("Redis cluster for session management"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.0"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			ParameterGroupName:       pulumi.String("default.redis7"),
			Port:                     pulumi.Int(6379),
			SubnetGroupName:          cacheSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{cacheSg.ID()},
			AutomaticFailoverEnabled: pulumi.Bool(true),
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			MultiAzEnabled:           pulumi.Bool(true),
			SnapshotRetentionLimit:   pulumi.Int(5),
			SnapshotWindow:           pulumi.String("03:00-05:00"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-redis-cluster-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS cluster with Container Insights
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-ecs-%s", environmentSuffix)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enhanced"),
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-cluster-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch log group for ECS with 6-year retention
		ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-log-group-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/healthcare-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(2192), // 6 years
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-logs-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM role for ECS task execution
		ecsTaskExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-execution-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-ecs-exec-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
			ManagedPolicyArns: pulumi.StringArray{
				pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-task-execution-role-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Attach policy to allow ECS to read secrets
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-secrets-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/SecretsManagerReadWrite"),
		})
		if err != nil {
			return err
		}

		// Create IAM role for ECS tasks
		ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-ecs-task-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-task-role-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("app-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("healthcare-app-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.All(ecsLogGroup.Name, dbSecret.Arn, redisCluster.PrimaryEndpointAddress).ApplyT(
				func(args []interface{}) (string, error) {
					logGroupName := args[0].(string)
					secretArn := args[1].(string)
					redisEndpoint := args[2].(string)

					containerDef := []map[string]interface{}{
						{
							"name":  "healthcare-app",
							"image": "nginx:latest",
							"portMappings": []map[string]interface{}{
								{
									"containerPort": 80,
									"protocol":      "tcp",
								},
							},
							"environment": []map[string]interface{}{
								{
									"name":  "REDIS_ENDPOINT",
									"value": redisEndpoint,
								},
							},
							"secrets": []map[string]interface{}{
								{
									"name":      "DB_CREDENTIALS",
									"valueFrom": secretArn,
								},
							},
							"logConfiguration": map[string]interface{}{
								"logDriver": "awslogs",
								"options": map[string]interface{}{
									"awslogs-group":         logGroupName,
									"awslogs-region":        region,
									"awslogs-stream-prefix": "ecs",
								},
							},
						},
					}
					jsonBytes, err := json.Marshal(containerDef)
					if err != nil {
						return "", err
					}
					return string(jsonBytes), nil
				}).(pulumi.StringOutput),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-task-definition-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS service
		ecsService, err := ecs.NewService(ctx, fmt.Sprintf("app-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("healthcare-app-service-%s", environmentSuffix)),
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(2),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets: pulumi.StringArray{
					privateSubnets[0].ID(),
					privateSubnets[1].ID(),
				},
				SecurityGroups: pulumi.StringArray{ecsSg.ID()},
				AssignPublicIp: pulumi.Bool(false),
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-app-service-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch alarm for Aurora CPU
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("aurora-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("healthcare-aurora-cpu-%s", environmentSuffix)),
			AlarmDescription:   pulumi.String("Alert when Aurora CPU exceeds 80%"),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80),
			Dimensions: pulumi.StringMap{
				"DBClusterIdentifier": auroraCluster.ClusterIdentifier,
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-aurora-cpu-alarm-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch alarm for ECS service
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-service-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("healthcare-ecs-service-%s", environmentSuffix)),
			AlarmDescription:   pulumi.String("Alert when ECS service has no running tasks"),
			ComparisonOperator: pulumi.String("LessThanThreshold"),
			EvaluationPeriods:  pulumi.Int(1),
			MetricName:         pulumi.String("RunningTaskCount"),
			Namespace:          pulumi.String("ECS/ContainerInsights"),
			Period:             pulumi.Int(60),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(1),
			Dimensions: pulumi.StringMap{
				"ClusterName": ecsCluster.Name,
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("healthcare-ecs-service-alarm-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Export important outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("auroraClusterEndpoint", auroraCluster.Endpoint)
		ctx.Export("auroraClusterReaderEndpoint", auroraCluster.ReaderEndpoint)
		ctx.Export("auroraInstanceId", auroraInstance.ID())
		ctx.Export("redisEndpoint", redisCluster.PrimaryEndpointAddress)
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("ecsServiceName", ecsService.Name)
		ctx.Export("dbSecretArn", dbSecret.Arn)
		ctx.Export("region", pulumi.String(region))
		ctx.Export("environmentSuffix", pulumi.String(environmentSuffix))

		return nil
	})
}
