package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/appautoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func CreateStack(ctx *pulumi.Context) error {
	cfg := config.New(ctx, "")
	region := cfg.Get("region")
	if region == "" {
		region = "eu-central-2"
	}

	// Get environmentSuffix from environment variable or config
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			// Default for testing purposes
			environmentSuffix = "synth8120486147"
		}
	}

	// Create VPC
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("vpc-%s", environmentSuffix), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create CloudWatch Log Group for VPC Flow Logs
	flowLogsGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("vpc-flow-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/vpc/flowlogs-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(7),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-flow-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create IAM Role for VPC Flow Logs
	flowLogsRole, err := iam.NewRole(ctx, fmt.Sprintf("vpc-flow-logs-role-%s", environmentSuffix), &iam.RoleArgs{
		Name: pulumi.String(fmt.Sprintf("vpc-flow-logs-role-%s", environmentSuffix)),
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Action": "sts:AssumeRole",
				"Principal": {
					"Service": "vpc-flow-logs.amazonaws.com"
				},
				"Effect": "Allow"
			}]
		}`),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-flow-logs-role-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create IAM Policy for VPC Flow Logs
	flowLogsPolicy, err := iam.NewRolePolicy(ctx, fmt.Sprintf("vpc-flow-logs-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
		Name: pulumi.String(fmt.Sprintf("vpc-flow-logs-policy-%s", environmentSuffix)),
		Role: flowLogsRole.Name,
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Action": [
					"logs:CreateLogGroup",
					"logs:CreateLogStream",
					"logs:PutLogEvents",
					"logs:DescribeLogGroups",
					"logs:DescribeLogStreams"
				],
				"Resource": "*"
			}]
		}`),
	})
	if err != nil {
		return err
	}

	// Enable VPC Flow Logs
	_, err = ec2.NewFlowLog(ctx, fmt.Sprintf("vpc-flow-log-%s", environmentSuffix), &ec2.FlowLogArgs{
		VpcId:              vpc.ID(),
		TrafficType:        pulumi.String("ALL"),
		LogDestinationType: pulumi.String("cloud-watch-logs"),
		LogDestination:     flowLogsGroup.Arn,
		IamRoleArn:         flowLogsRole.Arn,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-flow-log-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	}, pulumi.DependsOn([]pulumi.Resource{flowLogsPolicy}))
	if err != nil {
		return err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("igw-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create Public Subnets in 2 AZs
	publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.1.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("public-subnet-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("public"),
		},
	})
	if err != nil {
		return err
	}

	publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.2.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("public-subnet-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("public"),
		},
	})
	if err != nil {
		return err
	}

	// Create Private Subnets in 2 AZs
	privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.11.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("private-subnet-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("private"),
		},
	})
	if err != nil {
		return err
	}

	privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.12.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("private-subnet-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("private"),
		},
	})
	if err != nil {
		return err
	}

	// Create Elastic IPs for NAT Gateways
	eip1, err := ec2.NewEip(ctx, fmt.Sprintf("eip-1-%s", environmentSuffix), &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("eip-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	eip2, err := ec2.NewEip(ctx, fmt.Sprintf("eip-2-%s", environmentSuffix), &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("eip-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create NAT Gateways
	natGw1, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gw-1-%s", environmentSuffix), &ec2.NatGatewayArgs{
		SubnetId:     publicSubnet1.ID(),
		AllocationId: eip1.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("nat-gw-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	natGw2, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gw-2-%s", environmentSuffix), &ec2.NatGatewayArgs{
		SubnetId:     publicSubnet2.ID(),
		AllocationId: eip2.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("nat-gw-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create Public Route Table
	publicRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("public-rt-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Public route to Internet Gateway
	_, err = ec2.NewRoute(ctx, fmt.Sprintf("public-route-%s", environmentSuffix), &ec2.RouteArgs{
		RouteTableId:         publicRT.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		GatewayId:            igw.ID(),
	})
	if err != nil {
		return err
	}

	// Associate public subnets with public route table
	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet1.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet2.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return err
	}

	// Create Private Route Tables
	privateRT1, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-1-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("private-rt-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	privateRT2, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-2-%s", environmentSuffix), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("private-rt-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Private routes to NAT Gateways
	_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-1-%s", environmentSuffix), &ec2.RouteArgs{
		RouteTableId:         privateRT1.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		NatGatewayId:         natGw1.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-2-%s", environmentSuffix), &ec2.RouteArgs{
		RouteTableId:         privateRT2.ID(),
		DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
		NatGatewayId:         natGw2.ID(),
	})
	if err != nil {
		return err
	}

	// Associate private subnets with private route tables
	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet1.ID(),
		RouteTableId: privateRT1.ID(),
	})
	if err != nil {
		return err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet2.ID(),
		RouteTableId: privateRT2.ID(),
	})
	if err != nil {
		return err
	}

	// Create Kinesis Data Stream
	kinesisStream, err := kinesis.NewStream(ctx, fmt.Sprintf("kinesis-stream-%s", environmentSuffix), &kinesis.StreamArgs{
		Name:            pulumi.String(fmt.Sprintf("iot-sensor-data-%s", environmentSuffix)),
		ShardCount:      pulumi.Int(2),
		RetentionPeriod: pulumi.Int(24),
		StreamModeDetails: &kinesis.StreamStreamModeDetailsArgs{
			StreamMode: pulumi.String("PROVISIONED"),
		},
		EncryptionType: pulumi.String("KMS"),
		KmsKeyId:       pulumi.String("alias/aws/kinesis"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-stream-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create CloudWatch Alarms for Kinesis
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("kinesis-iterator-age-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("kinesis-iterator-age-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("GetRecords.IteratorAgeMilliseconds"),
		Namespace:          pulumi.String("AWS/Kinesis"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Maximum"),
		Threshold:          pulumi.Float64(60000),
		AlarmDescription:   pulumi.String("Alert when Kinesis iterator age exceeds 60 seconds"),
		Dimensions: pulumi.StringMap{
			"StreamName": kinesisStream.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-iterator-age-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("kinesis-write-throughput-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("kinesis-write-throughput-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("WriteProvisionedThroughputExceeded"),
		Namespace:          pulumi.String("AWS/Kinesis"),
		Period:             pulumi.Int(60),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.Float64(0),
		AlarmDescription:   pulumi.String("Alert when Kinesis write throughput is exceeded"),
		Dimensions: pulumi.StringMap{
			"StreamName": kinesisStream.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-write-throughput-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create DB Secret in Secrets Manager
	dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("db-secret-%s", environmentSuffix), &secretsmanager.SecretArgs{
		// Make the secret name unique by including the Pulumi stack name to avoid
		// collisions when secrets with the same base name are scheduled for deletion.
		Name:        pulumi.String(fmt.Sprintf("rds-credentials-%s-%s", environmentSuffix, ctx.Stack())),
		Description: pulumi.String("RDS PostgreSQL credentials for IoT manufacturing system"),
		Tags: pulumi.StringMap{
			// Keep tags consistent and include stack to help identification
			"Name":        pulumi.String(fmt.Sprintf("db-secret-%s-%s", environmentSuffix, ctx.Stack())),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Store initial secret value
	secretValue := map[string]interface{}{
		"username": "adminuser",
		"password": "TempPassword123!",
		"engine":   "postgres",
		"host":     "",
		"port":     5432,
		"dbname":   "sensordata",
	}
	secretJSON, err := json.Marshal(secretValue)
	if err != nil {
		return err
	}

	_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("db-secret-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
		SecretId:     dbSecret.ID(),
		SecretString: pulumi.String(string(secretJSON)),
	})
	if err != nil {
		return err
	}

	// Create RDS Subnet Group
	dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
		Name:        pulumi.String(fmt.Sprintf("db-subnet-group-%s", environmentSuffix)),
		Description: pulumi.String("Subnet group for RDS PostgreSQL"),
		SubnetIds:   pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("db-subnet-group-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create RDS Security Group
	rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for RDS PostgreSQL"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-sg-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create ECS Security Group (needed before RDS rule)
	ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for ECS tasks"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-sg-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Allow ECS to access RDS
	_, err = ec2.NewSecurityGroupRule(ctx, fmt.Sprintf("rds-ingress-%s", environmentSuffix), &ec2.SecurityGroupRuleArgs{
		Type:                  pulumi.String("ingress"),
		FromPort:              pulumi.Int(5432),
		ToPort:                pulumi.Int(5432),
		Protocol:              pulumi.String("tcp"),
		SecurityGroupId:       rdsSecurityGroup.ID(),
		SourceSecurityGroupId: ecsSecurityGroup.ID(),
		Description:           pulumi.String("Allow ECS tasks to access RDS PostgreSQL"),
	})
	if err != nil {
		return err
	}

	// Allow ECS outbound traffic
	_, err = ec2.NewSecurityGroupRule(ctx, fmt.Sprintf("ecs-egress-%s", environmentSuffix), &ec2.SecurityGroupRuleArgs{
		Type:            pulumi.String("egress"),
		FromPort:        pulumi.Int(0),
		ToPort:          pulumi.Int(0),
		Protocol:        pulumi.String("-1"),
		CidrBlocks:      pulumi.StringArray{pulumi.String("0.0.0.0/0")},
		SecurityGroupId: ecsSecurityGroup.ID(),
		Description:     pulumi.String("Allow all outbound traffic from ECS tasks"),
	})
	if err != nil {
		return err
	}

	// Create RDS PostgreSQL Instance
	dbInstance, err := rds.NewInstance(ctx, fmt.Sprintf("rds-postgres-%s", environmentSuffix), &rds.InstanceArgs{
		AllocatedStorage:      pulumi.Int(20),
		Engine:                pulumi.String("postgres"),
		EngineVersion:         pulumi.String("15.7"),
		InstanceClass:         pulumi.String("db.t3.micro"),
		DbName:                pulumi.String("sensordata"),
		Username:              pulumi.String("adminuser"),
		Password:              pulumi.String("TempPassword123!"),
		DbSubnetGroupName:     dbSubnetGroup.Name,
		VpcSecurityGroupIds:   pulumi.StringArray{rdsSecurityGroup.ID()},
		MultiAz:               pulumi.Bool(true),
		StorageEncrypted:      pulumi.Bool(true),
		SkipFinalSnapshot:     pulumi.Bool(true),
		BackupRetentionPeriod: pulumi.Int(7),
		EnabledCloudwatchLogsExports: pulumi.StringArray{
			pulumi.String("postgresql"),
			pulumi.String("upgrade"),
		},
		PerformanceInsightsEnabled: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-postgres-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create CloudWatch Alarms for RDS
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("rds-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("rds-cpu-utilization-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("CPUUtilization"),
		Namespace:          pulumi.String("AWS/RDS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(80),
		AlarmDescription:   pulumi.String("Alert when RDS CPU exceeds 80%"),
		Dimensions: pulumi.StringMap{
			"DBInstanceIdentifier": dbInstance.ID(),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-cpu-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("rds-connections-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("rds-database-connections-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("DatabaseConnections"),
		Namespace:          pulumi.String("AWS/RDS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(80),
		AlarmDescription:   pulumi.String("Alert when RDS connections exceed 80"),
		Dimensions: pulumi.StringMap{
			"DBInstanceIdentifier": dbInstance.ID(),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-connections-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("rds-storage-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("rds-free-storage-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("LessThanThreshold"),
		EvaluationPeriods:  pulumi.Int(1),
		MetricName:         pulumi.String("FreeStorageSpace"),
		Namespace:          pulumi.String("AWS/RDS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(2000000000),
		AlarmDescription:   pulumi.String("Alert when RDS free storage is less than 2GB"),
		Dimensions: pulumi.StringMap{
			"DBInstanceIdentifier": dbInstance.ID(),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-storage-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Note: Secret Rotation is commented out as it requires a Lambda function to be set up first
	// In production, you would create a Lambda function for rotation and then enable this:
	// _, err = secretsmanager.NewSecretRotation(ctx, fmt.Sprintf("db-secret-rotation-%s", environmentSuffix), &secretsmanager.SecretRotationArgs{
	// 	SecretId:          dbSecret.ID(),
	// 	RotationLambdaArn: pulumi.String("arn:aws:lambda:eu-central-2:123456789012:function:SecretsManagerRotation"),
	// 	RotationRules: &secretsmanager.SecretRotationRotationRulesArgs{
	// 		AutomaticallyAfterDays: pulumi.Int(30),
	// 	},
	// })
	ctx.Log.Info("Secret rotation is configured to be set up manually with a Lambda function", nil)

	// Create CloudWatch Log Group for ECS
	ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-log-group-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/ecs/iot-processor-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(7),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-log-group-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create ECS Cluster
	ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
		Name: pulumi.String(fmt.Sprintf("iot-processing-%s", environmentSuffix)),
		Settings: ecs.ClusterSettingArray{
			&ecs.ClusterSettingArgs{
				Name:  pulumi.String("containerInsights"),
				Value: pulumi.String("enabled"),
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-cluster-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create IAM Role for ECS Task Execution
	ecsExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-execution-role-%s", environmentSuffix), &iam.RoleArgs{
		Name: pulumi.String(fmt.Sprintf("ecs-execution-role-%s", environmentSuffix)),
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
			"Name":        pulumi.String(fmt.Sprintf("ecs-execution-role-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Attach execution role policy
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-execution-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      ecsExecutionRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
	})
	if err != nil {
		return err
	}

	// Create IAM Role for ECS Task
	ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
		Name: pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
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
			"Name":        pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create custom policy for task role
	taskPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("ecs-task-policy-%s", environmentSuffix), &iam.PolicyArgs{
		Name: pulumi.String(fmt.Sprintf("ecs-task-policy-%s", environmentSuffix)),
		Policy: pulumi.All(kinesisStream.Arn, dbSecret.Arn).ApplyT(func(args []interface{}) (string, error) {
			kinesisArn := args[0].(string)
			secretArn := args[1].(string)
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"kinesis:GetRecords",
							"kinesis:GetShardIterator",
							"kinesis:DescribeStream",
							"kinesis:ListShards",
							"kinesis:DescribeStreamSummary"
						],
						"Resource": "%s"
					},
					{
						"Effect": "Allow",
						"Action": [
							"secretsmanager:GetSecretValue",
							"secretsmanager:DescribeSecret"
						],
						"Resource": "%s"
					},
					{
						"Effect": "Allow",
						"Action": [
							"cloudwatch:PutMetricData"
						],
						"Resource": "*"
					}
				]
			}`, kinesisArn, secretArn), nil
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	// Attach task policy
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-task-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
		Role:      ecsTaskRole.Name,
		PolicyArn: taskPolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create ECS Task Definition
	taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("ecs-task-def-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
		Family:                  pulumi.String(fmt.Sprintf("iot-processor-%s", environmentSuffix)),
		NetworkMode:             pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
		Cpu:                     pulumi.String("256"),
		Memory:                  pulumi.String("512"),
		ExecutionRoleArn:        ecsExecutionRole.Arn,
		TaskRoleArn:             ecsTaskRole.Arn,
		ContainerDefinitions: ecsLogGroup.Name.ApplyT(func(logGroupName string) (string, error) {
			return fmt.Sprintf(`[{
				"name": "iot-processor",
				"image": "nginx:latest",
				"cpu": 256,
				"memory": 512,
				"essential": true,
				"logConfiguration": {
					"logDriver": "awslogs",
					"options": {
						"awslogs-group": "%s",
						"awslogs-region": "%s",
						"awslogs-stream-prefix": "ecs",
						"mode": "non-blocking",
						"max-buffer-size": "25m"
					}
				},
				"healthCheck": {
					"command": ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
					"interval": 30,
					"timeout": 5,
					"retries": 3,
					"startPeriod": 60
				}
			}]`, logGroupName, region), nil
		}).(pulumi.StringOutput),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-task-def-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	}, pulumi.DependsOn([]pulumi.Resource{ecsLogGroup}))
	if err != nil {
		return err
	}

	// Create ECS Service
	ecsService, err := ecs.NewService(ctx, fmt.Sprintf("ecs-service-%s", environmentSuffix), &ecs.ServiceArgs{
		Name:           pulumi.String(fmt.Sprintf("iot-processor-service-%s", environmentSuffix)),
		Cluster:        ecsCluster.Arn,
		TaskDefinition: taskDefinition.Arn,
		DesiredCount:   pulumi.Int(2),
		LaunchType:     pulumi.String("FARGATE"),
		NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
			Subnets:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
			AssignPublicIp: pulumi.Bool(false),
		},
		DeploymentCircuitBreaker: &ecs.ServiceDeploymentCircuitBreakerArgs{
			Enable:   pulumi.Bool(true),
			Rollback: pulumi.Bool(true),
		},
		EnableExecuteCommand: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-service-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Configure Auto Scaling for ECS Service
	ecsTarget, err := appautoscaling.NewTarget(ctx, fmt.Sprintf("ecs-scaling-target-%s", environmentSuffix), &appautoscaling.TargetArgs{
		MaxCapacity:       pulumi.Int(10),
		MinCapacity:       pulumi.Int(2),
		ResourceId:        pulumi.Sprintf("service/%s/%s", ecsCluster.Name, ecsService.Name),
		ScalableDimension: pulumi.String("ecs:service:DesiredCount"),
		ServiceNamespace:  pulumi.String("ecs"),
	})
	if err != nil {
		return err
	}

	// CPU-based Auto Scaling Policy
	_, err = appautoscaling.NewPolicy(ctx, fmt.Sprintf("ecs-cpu-scaling-policy-%s", environmentSuffix), &appautoscaling.PolicyArgs{
		Name:              pulumi.String(fmt.Sprintf("ecs-cpu-scaling-%s", environmentSuffix)),
		PolicyType:        pulumi.String("TargetTrackingScaling"),
		ResourceId:        ecsTarget.ResourceId,
		ScalableDimension: ecsTarget.ScalableDimension,
		ServiceNamespace:  ecsTarget.ServiceNamespace,
		TargetTrackingScalingPolicyConfiguration: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs{
			TargetValue:      pulumi.Float64(70.0),
			ScaleInCooldown:  pulumi.Int(300),
			ScaleOutCooldown: pulumi.Int(60),
			PredefinedMetricSpecification: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
				PredefinedMetricType: pulumi.String("ECSServiceAverageCPUUtilization"),
			},
		},
	})
	if err != nil {
		return err
	}

	// Memory-based Auto Scaling Policy
	_, err = appautoscaling.NewPolicy(ctx, fmt.Sprintf("ecs-memory-scaling-policy-%s", environmentSuffix), &appautoscaling.PolicyArgs{
		Name:              pulumi.String(fmt.Sprintf("ecs-memory-scaling-%s", environmentSuffix)),
		PolicyType:        pulumi.String("TargetTrackingScaling"),
		ResourceId:        ecsTarget.ResourceId,
		ScalableDimension: ecsTarget.ScalableDimension,
		ServiceNamespace:  ecsTarget.ServiceNamespace,
		TargetTrackingScalingPolicyConfiguration: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs{
			TargetValue:      pulumi.Float64(80.0),
			ScaleInCooldown:  pulumi.Int(300),
			ScaleOutCooldown: pulumi.Int(60),
			PredefinedMetricSpecification: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
				PredefinedMetricType: pulumi.String("ECSServiceAverageMemoryUtilization"),
			},
		},
	})
	if err != nil {
		return err
	}

	// Create CloudWatch Alarms for ECS
	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("ecs-cpu-utilization-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("CPUUtilization"),
		Namespace:          pulumi.String("AWS/ECS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(80),
		AlarmDescription:   pulumi.String("Alert when ECS CPU exceeds 80%"),
		Dimensions: pulumi.StringMap{
			"ClusterName": ecsCluster.Name,
			"ServiceName": ecsService.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-cpu-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-memory-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.String(fmt.Sprintf("ecs-memory-utilization-%s", environmentSuffix)),
		ComparisonOperator: pulumi.String("GreaterThanThreshold"),
		EvaluationPeriods:  pulumi.Int(2),
		MetricName:         pulumi.String("MemoryUtilization"),
		Namespace:          pulumi.String("AWS/ECS"),
		Period:             pulumi.Int(300),
		Statistic:          pulumi.String("Average"),
		Threshold:          pulumi.Float64(85),
		AlarmDescription:   pulumi.String("Alert when ECS memory exceeds 85%"),
		Dimensions: pulumi.StringMap{
			"ClusterName": ecsCluster.Name,
			"ServiceName": ecsService.Name,
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-memory-alarm-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Export important values
	ctx.Export("vpcId", vpc.ID())
	ctx.Export("publicSubnetIds", pulumi.StringArray{publicSubnet1.ID(), publicSubnet2.ID()})
	ctx.Export("privateSubnetIds", pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()})
	ctx.Export("kinesisStreamName", kinesisStream.Name)
	ctx.Export("kinesisStreamArn", kinesisStream.Arn)
	ctx.Export("rdsEndpoint", dbInstance.Endpoint)
	ctx.Export("rdsDbName", dbInstance.DbName)
	ctx.Export("dbSecretArn", dbSecret.Arn)
	ctx.Export("ecsClusterName", ecsCluster.Name)
	ctx.Export("ecsClusterArn", ecsCluster.Arn)
	ctx.Export("ecsServiceName", ecsService.Name)
	ctx.Export("ecsLogGroupName", ecsLogGroup.Name)

	return nil
}

func main() {
	// Set TMPDIR to a location that allows execution
	// Avoid /tmp which may have noexec mount flag
	homeDir, err := os.UserHomeDir()
	if err == nil {
		tmpDir := filepath.Join(homeDir, ".pulumi", "tmp")
		os.MkdirAll(tmpDir, 0755)
		os.Setenv("TMPDIR", tmpDir)
	}

	pulumi.Run(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	})
}
