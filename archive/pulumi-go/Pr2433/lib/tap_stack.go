package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration variables
		environment := getEnvOrDefault("ENVIRONMENT", "prod")
		awsRegion := getEnvOrDefault("AWS_REGION", "us-east-1")
		projectName := getEnvOrDefault("PROJECT_NAME", "securecorp")
		vpcCidr := getEnvOrDefault("VPC_CIDR", "10.0.0.0/16")

		// Common tags
		commonTags := pulumi.StringMap{
			"Project":     pulumi.String("SecureCorp"),
			"Environment": pulumi.String(environment),
			"ManagedBy":   pulumi.String("pulumi"),
			"Owner":       pulumi.String("DevOps"),
		}

		// Get availability zones
		availabilityZones, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
			State: pulumi.StringRef("available"),
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "main", &ec2.VpcArgs{
			CidrBlock:          pulumi.String(vpcCidr),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags:               commonTags,
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		internetGateway, err := ec2.NewInternetGateway(ctx, "main", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-%d", i), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i),
				AvailabilityZone:    pulumi.String(availabilityZones.Names[i]),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags:                commonTags,
			})
			if err != nil {
				return err
			}
			publicSubnets[i] = subnet
		}

		// Create private subnets
		privateSubnets := make([]*ec2.Subnet, 2)
		for i := 0; i < 2; i++ {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-%d", i), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+2),
				AvailabilityZone: pulumi.String(availabilityZones.Names[i]),
				Tags:             commonTags,
			})
			if err != nil {
				return err
			}
			privateSubnets[i] = subnet
		}

		// Create NAT Gateway EIPs
		natEips := make([]*ec2.Eip, 2)
		for i := 0; i < 2; i++ {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-%d", i), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags:   commonTags,
			})
			if err != nil {
				return err
			}
			natEips[i] = eip
		}

		// Create NAT Gateways
		natGateways := make([]*ec2.NatGateway, 2)
		for i := 0; i < 2; i++ {
			natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("main-%d", i), &ec2.NatGatewayArgs{
				AllocationId: natEips[i].ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags:         commonTags,
			})
			if err != nil {
				return err
			}
			natGateways[i] = natGateway
		}

		// Create route tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: internetGateway.ID(),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create private route tables
		privateRouteTables := make([]*ec2.RouteTable, 2)
		for i := 0; i < 2; i++ {
			routeTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-%d", i), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Routes: ec2.RouteTableRouteArray{
					&ec2.RouteTableRouteArgs{
						CidrBlock:    pulumi.String("0.0.0.0/0"),
						NatGatewayId: natGateways[i].ID(),
					},
				},
				Tags: commonTags,
			})
			if err != nil {
				return err
			}
			privateRouteTables[i] = routeTable
		}

		// Associate route tables with subnets
		for i := 0; i < 2; i++ {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-%d", i), &ec2.RouteTableAssociationArgs{
				SubnetId:     publicSubnets[i].ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}

			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-%d", i), &ec2.RouteTableAssociationArgs{
				SubnetId:     privateSubnets[i].ID(),
				RouteTableId: privateRouteTables[i].ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		// Database security group
		dbSg, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("%s-%s-db-sg", projectName, environment),
			Description: pulumi.String("Security group for RDS database"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					FromPort:    pulumi.Int(5432),
					ToPort:      pulumi.Int(5432),
					Protocol:    pulumi.String("tcp"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("10.0.0.0/16")},
					Description: pulumi.String("PostgreSQL access from VPC"),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					FromPort:    pulumi.Int(0),
					ToPort:      pulumi.Int(0),
					Protocol:    pulumi.String("-1"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("All outbound traffic"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Application security group
		appSg, err := ec2.NewSecurityGroup(ctx, "app-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.Sprintf("%s-%s-app-sg", projectName, environment),
			Description: pulumi.String("Security group for application servers"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					FromPort:    pulumi.Int(80),
					ToPort:      pulumi.Int(80),
					Protocol:    pulumi.String("tcp"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("HTTP access"),
				},
				&ec2.SecurityGroupIngressArgs{
					FromPort:    pulumi.Int(443),
					ToPort:      pulumi.Int(443),
					Protocol:    pulumi.String("tcp"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("HTTPS access"),
				},
				&ec2.SecurityGroupIngressArgs{
					FromPort:    pulumi.Int(22),
					ToPort:      pulumi.Int(22),
					Protocol:    pulumi.String("tcp"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("10.0.0.0/16")},
					Description: pulumi.String("SSH access from VPC"),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					FromPort:    pulumi.Int(0),
					ToPort:      pulumi.Int(0),
					Protocol:    pulumi.String("-1"),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("All outbound traffic"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create S3 buckets
		// Main application data bucket (versioned)
		appDataBucket, err := s3.NewBucket(ctx, "app-data", &s3.BucketArgs{
			Bucket: pulumi.Sprintf("prod-%s-%s-app-data", projectName, environment),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure versioning for app data bucket
		_, err = s3.NewBucketVersioningV2(ctx, "app-data-versioning", &s3.BucketVersioningV2Args{
			Bucket: appDataBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Configure encryption for app data bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "app-data-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: appDataBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Configure public access block for app data bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, "app-data-public-access", &s3.BucketPublicAccessBlockArgs{
			Bucket:                appDataBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Backup bucket
		backupBucket, err := s3.NewBucket(ctx, "backup", &s3.BucketArgs{
			Bucket: pulumi.Sprintf("prod-%s-%s-backup", projectName, environment),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure encryption for backup bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "backup-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: backupBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Configure public access block for backup bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, "backup-public-access", &s3.BucketPublicAccessBlockArgs{
			Bucket:                backupBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Logs bucket for server access logs
		logsBucket, err := s3.NewBucket(ctx, "logs", &s3.BucketArgs{
			Bucket: pulumi.Sprintf("prod-%s-%s-logs", projectName, environment),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure encryption for logs bucket
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "logs-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: logsBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// Configure public access block for logs bucket
		_, err = s3.NewBucketPublicAccessBlock(ctx, "logs-public-access", &s3.BucketPublicAccessBlockArgs{
			Bucket:                logsBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Configure server access logging for all buckets
		_, err = s3.NewBucketLoggingV2(ctx, "app-data-logging", &s3.BucketLoggingV2Args{
			Bucket:       appDataBucket.ID(),
			TargetBucket: logsBucket.ID(),
			TargetPrefix: pulumi.Sprintf("app-data/"),
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketLoggingV2(ctx, "backup-logging", &s3.BucketLoggingV2Args{
			Bucket:       backupBucket.ID(),
			TargetBucket: logsBucket.ID(),
			TargetPrefix: pulumi.Sprintf("backup/"),
		})
		if err != nil {
			return err
		}

		// Create RDS subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "main", &rds.SubnetGroupArgs{
			Name:      pulumi.Sprintf("%s-%s-db-subnet-group", projectName, environment),
			SubnetIds: pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			Tags:      commonTags,
		})
		if err != nil {
			return err
		}

		// Create RDS parameter group
		dbParameterGroup, err := rds.NewParameterGroup(ctx, "main", &rds.ParameterGroupArgs{
			Family: pulumi.String("postgres17"),
			Name:   pulumi.Sprintf("%s-%s-db-params", projectName, environment),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("log_connections"),
					Value: pulumi.String("1"),
				},
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("log_disconnections"),
					Value: pulumi.String("1"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create RDS instance
		dbInstance, err := rds.NewInstance(ctx, "main", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(20),
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:          pulumi.String("03:00-04:00"),
			DbName:                pulumi.String("securecorp"),
			DbSubnetGroupName:     dbSubnetGroup.Name,
			Engine:                pulumi.String("postgres"),
			EngineVersion:         pulumi.String("17.6"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			Username:              pulumi.String("dbadmin"),
			Password:              pulumi.String("SecurePassword123!"),
			MultiAz:               pulumi.Bool(false),
			ParameterGroupName:    dbParameterGroup.Name,
			PubliclyAccessible:    pulumi.Bool(false),
			SkipFinalSnapshot:     pulumi.Bool(true),
			StorageEncrypted:      pulumi.Bool(true),
			StorageType:           pulumi.String("gp3"),
			VpcSecurityGroupIds:   pulumi.StringArray{dbSg.ID()},
			Tags:                  commonTags,
		})
		if err != nil {
			return err
		}

		// Create IAM roles
		// EC2 instance role
		ec2Role, err := iam.NewRole(ctx, "ec2-role", &iam.RoleArgs{
			Name: pulumi.Sprintf("%s-%s-ec2-role", projectName, environment),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						}
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Create EC2 instance profile
		ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, "ec2-profile", &iam.InstanceProfileArgs{
			Name: pulumi.Sprintf("%s-%s-ec2-profile", projectName, environment),
			Role: ec2Role.Name,
		})
		if err != nil {
			return err
		}

		// Create S3 access policy for EC2
		_, err = iam.NewRolePolicy(ctx, "ec2-s3-policy", &iam.RolePolicyArgs{
			Name: pulumi.Sprintf("%s-%s-ec2-s3-policy", projectName, environment),
			Role: ec2Role.Name,
			Policy: pulumi.All(appDataBucket.Arn, backupBucket.Arn).ApplyT(func(args []interface{}) string {
				appDataArn := args[0].(string)
				backupArn := args[1].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject",
								"s3:ListBucket"
							],
							"Resource": [
								"%s",
								"%s/*",
								"%s",
								"%s/*"
							]
						}
					]
				}`, appDataArn, appDataArn, backupArn, backupArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create CloudWatch monitoring
		// RDS monitoring
		rdsCpuAlarm, err := cloudwatch.NewMetricAlarm(ctx, "rds-cpu-alarm", &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.Sprintf("%s-%s-rds-cpu-alarm", projectName, environment),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80.0),
			AlarmDescription:   pulumi.String("RDS CPU utilization is high"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": dbInstance.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		rdsConnectionsAlarm, err := cloudwatch.NewMetricAlarm(ctx, "rds-connections-alarm", &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.Sprintf("%s-%s-rds-connections-alarm", projectName, environment),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("DatabaseConnections"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(100.0),
			AlarmDescription:   pulumi.String("RDS database connections are high"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": dbInstance.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// CloudWatch dashboard
		dashboard, err := cloudwatch.NewDashboard(ctx, "main", &cloudwatch.DashboardArgs{
			DashboardName: pulumi.Sprintf("%s-%s-dashboard", projectName, environment),
			DashboardBody: pulumi.All(dbInstance.ID(), appDataBucket.Bucket, backupBucket.Bucket).ApplyT(func(args []interface{}) string {
				dbId := string(args[0].(pulumi.ID))
				appDataBucketName := args[1].(string)
				backupBucketName := args[2].(string)
				return fmt.Sprintf(`{
					"widgets": [
						{
							"type": "metric",
							"x": 0,
							"y": 0,
							"width": 12,
							"height": 6,
							"properties": {
								"metrics": [
									["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "%s"]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "RDS CPU Utilization"
							}
						},
						{
							"type": "metric",
							"x": 12,
							"y": 0,
							"width": 12,
							"height": 6,
							"properties": {
								"metrics": [
									["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "%s"]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "RDS Database Connections"
							}
						},
						{
							"type": "metric",
							"x": 0,
							"y": 6,
							"width": 12,
							"height": 6,
							"properties": {
								"metrics": [
									["AWS/S3", "NumberOfObjects", "BucketName", "%s"]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "S3 Objects - App Data"
							}
						},
						{
							"type": "metric",
							"x": 12,
							"y": 6,
							"width": 12,
							"height": 6,
							"properties": {
								"metrics": [
									["AWS/S3", "NumberOfObjects", "BucketName", "%s"]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "S3 Objects - Backup"
							}
						}
					]
				}`, dbId, awsRegion, dbId, awsRegion, appDataBucketName, awsRegion, backupBucketName, awsRegion)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpc_id", vpc.ID())
		ctx.Export("private_subnet_ids", pulumi.All(privateSubnets[0].ID(), privateSubnets[1].ID()))
		ctx.Export("public_subnet_ids", pulumi.All(publicSubnets[0].ID(), publicSubnets[1].ID()))
		ctx.Export("rds_endpoint", dbInstance.Endpoint)
		ctx.Export("rds_port", dbInstance.Port)
		ctx.Export("app_data_bucket", appDataBucket.Bucket)
		ctx.Export("backup_bucket", backupBucket.Bucket)
		ctx.Export("logs_bucket", logsBucket.Bucket)
		ctx.Export("db_security_group_id", dbSg.ID())
		ctx.Export("app_security_group_id", appSg.ID())
		ctx.Export("ec2_role_arn", ec2Role.Arn)
		ctx.Export("ec2_instance_profile_arn", ec2InstanceProfile.Arn)
		ctx.Export("rds_cpu_alarm_arn", rdsCpuAlarm.Arn)
		ctx.Export("rds_connections_alarm_arn", rdsConnectionsAlarm.Arn)
		ctx.Export("cloudwatch_dashboard_url", pulumi.Sprintf("https://%s.console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s", awsRegion, awsRegion, dashboard.DashboardName))

		return nil
	})
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
