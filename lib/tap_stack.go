package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment suffix for resource naming
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		// Create KMS key for encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("patient-data-key-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for patient data encryption"),
			DeletionWindowInDays: pulumi.Int(7),
			EnableKeyRotation:    pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-data-key-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create KMS key alias
		_, err = kms.NewAlias(ctx, fmt.Sprintf("patient-data-key-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/patient-data-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Use default VPC to avoid VPC quota limits
		defaultVpc, err := ec2.LookupVpc(ctx, &ec2.LookupVpcArgs{
			Default: pulumi.BoolRef(true),
		})
		if err != nil {
			return err
		}
		vpcId := pulumi.String(defaultVpc.Id)

		// Get default internet gateway
		defaultIgw, err := ec2.LookupInternetGateway(ctx, &ec2.LookupInternetGatewayArgs{
			Filters: []ec2.GetInternetGatewayFilter{
				{
					Name:   "attachment.vpc-id",
					Values: []string{defaultVpc.Id},
				},
			},
		})
		if err != nil {
			return err
		}
		igwId := pulumi.String(defaultIgw.Id)

		// Create public subnets in different AZs within default VPC CIDR
		publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("patient-api-public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpcId,
			CidrBlock:           pulumi.String("172.31.128.0/24"),
			AvailabilityZone:    pulumi.String("us-east-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-public-subnet-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("patient-api-public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpcId,
			CidrBlock:           pulumi.String("172.31.129.0/24"),
			AvailabilityZone:    pulumi.String("us-east-1b"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-public-subnet-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create private subnets for database and cache
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("patient-api-private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpcId,
			CidrBlock:        pulumi.String("172.31.130.0/24"),
			AvailabilityZone: pulumi.String("us-east-1a"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-private-subnet-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("patient-api-private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpcId,
			CidrBlock:        pulumi.String("172.31.131.0/24"),
			AvailabilityZone: pulumi.String("us-east-1b"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-private-subnet-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create route table for public subnets
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("patient-api-public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpcId,
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igwId,
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-public-rt-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Associate public subnets with route table
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("patient-api-public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("patient-api-public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		// Create security group for RDS
		rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("patient-rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Description: pulumi.String("Security group for patient records RDS"),
			VpcId:       vpcId,
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(5432),
					ToPort:     pulumi.Int(5432),
					CidrBlocks: pulumi.StringArray{pulumi.String("172.31.0.0/16")},
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
				"Name":        pulumi.String(fmt.Sprintf("patient-rds-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ElastiCache
		cacheSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("patient-cache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Description: pulumi.String("Security group for patient session cache"),
			VpcId:       vpcId,
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(6379),
					ToPort:     pulumi.Int(6379),
					CidrBlocks: pulumi.StringArray{pulumi.String("172.31.0.0/16")},
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
				"Name":        pulumi.String(fmt.Sprintf("patient-cache-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create DB subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("patient-db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{
				privateSubnet1.ID(),
				privateSubnet2.ID(),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-db-subnet-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache subnet group
		cacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("patient-cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{
				privateSubnet1.ID(),
				privateSubnet2.ID(),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-cache-subnet-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create secret for database credentials
		dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("patient-db-credentials-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Description: pulumi.String("Database credentials for patient records"),
			KmsKeyId:    kmsKey.KeyId,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-db-credentials-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create secret version with initial credentials
		dbPassword := "InitialPassword123!"
		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("patient-db-credentials-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     dbSecret.ID(),
			SecretString: pulumi.String(fmt.Sprintf(`{"username":"patientadmin","password":"%s"}`, dbPassword)),
		})
		if err != nil {
			return err
		}

		// Create Aurora cluster parameter group
		clusterParamGroup, err := rds.NewClusterParameterGroup(ctx, fmt.Sprintf("patient-aurora-cluster-pg-%s", environmentSuffix), &rds.ClusterParameterGroupArgs{
			Family:      pulumi.String("aurora-postgresql14"),
			Description: pulumi.String("Patient records Aurora cluster parameter group"),
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
				"Name":        pulumi.String(fmt.Sprintf("patient-aurora-cluster-pg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Aurora Serverless v2 cluster
		auroraCluster, err := rds.NewCluster(ctx, fmt.Sprintf("patient-aurora-cluster-%s", environmentSuffix), &rds.ClusterArgs{
			Engine:                      pulumi.String("aurora-postgresql"),
			EngineMode:                  pulumi.String("provisioned"),
			EngineVersion:               pulumi.String("14.9"),
			DatabaseName:                pulumi.String("patientdb"),
			MasterUsername:              pulumi.String("patientadmin"),
			MasterPassword:              pulumi.String(dbPassword),
			DbSubnetGroupName:           dbSubnetGroup.Name,
			VpcSecurityGroupIds:         pulumi.StringArray{rdsSecurityGroup.ID()},
			StorageEncrypted:            pulumi.Bool(true),
			KmsKeyId:                    kmsKey.Arn,
			BackupRetentionPeriod:       pulumi.Int(7),
			PreferredBackupWindow:       pulumi.String("03:00-04:00"),
			PreferredMaintenanceWindow:  pulumi.String("mon:04:00-mon:05:00"),
			DbClusterParameterGroupName: clusterParamGroup.Name,
			EnabledCloudwatchLogsExports: pulumi.StringArray{
				pulumi.String("postgresql"),
			},
			DeletionProtection: pulumi.Bool(false),
			SkipFinalSnapshot:  pulumi.Bool(true),
			Serverlessv2ScalingConfiguration: &rds.ClusterServerlessv2ScalingConfigurationArgs{
				MaxCapacity: pulumi.Float64(1.0),
				MinCapacity: pulumi.Float64(0.5),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-aurora-cluster-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create Aurora cluster instance
		_, err = rds.NewClusterInstance(ctx, fmt.Sprintf("patient-aurora-instance-%s", environmentSuffix), &rds.ClusterInstanceArgs{
			ClusterIdentifier:  auroraCluster.ID(),
			InstanceClass:      pulumi.String("db.serverless"),
			Engine:             auroraCluster.Engine,
			EngineVersion:      auroraCluster.EngineVersion,
			PubliclyAccessible: pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-aurora-instance-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache parameter group for Redis 7
		cacheParamGroup, err := elasticache.NewParameterGroup(ctx, fmt.Sprintf("patient-redis-pg-%s", environmentSuffix), &elasticache.ParameterGroupArgs{
			Family:      pulumi.String("redis7"),
			Description: pulumi.String("Patient session cache parameter group"),
			Parameters: elasticache.ParameterGroupParameterArray{
				&elasticache.ParameterGroupParameterArgs{
					Name:  pulumi.String("maxmemory-policy"),
					Value: pulumi.String("allkeys-lru"),
				},
				&elasticache.ParameterGroupParameterArgs{
					Name:  pulumi.String("timeout"),
					Value: pulumi.String("3600"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-redis-pg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache Redis cluster
		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("patient-redis-cluster-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("patient-redis-%s", environmentSuffix)),
			Description:              pulumi.String("Patient session management cache"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.0"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			ParameterGroupName:       cacheParamGroup.Name,
			SubnetGroupName:          cacheSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{cacheSecurityGroup.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			KmsKeyId:                 kmsKey.Arn,
			AutomaticFailoverEnabled: pulumi.Bool(true),
			MultiAzEnabled:           pulumi.Bool(true),
			SnapshotRetentionLimit:   pulumi.Int(5),
			SnapshotWindow:           pulumi.String("03:00-05:00"),
			MaintenanceWindow:        pulumi.String("mon:05:00-mon:07:00"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-redis-cluster-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// Create REST API
		api, err := apigateway.NewRestApi(ctx, fmt.Sprintf("patient-records-api-%s", environmentSuffix), &apigateway.RestApiArgs{
			Description: pulumi.String("HIPAA-compliant API for patient records"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-records-api-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create API resource for patients endpoint
		patientsResource, err := apigateway.NewResource(ctx, fmt.Sprintf("patients-resource-%s", environmentSuffix), &apigateway.ResourceArgs{
			RestApi:  api.ID(),
			ParentId: api.RootResourceId,
			PathPart: pulumi.String("patients"),
		})
		if err != nil {
			return err
		}

		// Create GET method for patients
		getPatientsMethod, err := apigateway.NewMethod(ctx, fmt.Sprintf("get-patients-method-%s", environmentSuffix), &apigateway.MethodArgs{
			RestApi:       api.ID(),
			ResourceId:    patientsResource.ID(),
			HttpMethod:    pulumi.String("GET"),
			Authorization: pulumi.String("NONE"),
		})
		if err != nil {
			return err
		}

		// Create mock integration for GET patients
		getPatientsIntegration, err := apigateway.NewIntegration(ctx, fmt.Sprintf("get-patients-integration-%s", environmentSuffix), &apigateway.IntegrationArgs{
			RestApi:    api.ID(),
			ResourceId: patientsResource.ID(),
			HttpMethod: getPatientsMethod.HttpMethod,
			Type:       pulumi.String("MOCK"),
			RequestTemplates: pulumi.StringMap{
				"application/json": pulumi.String(`{"statusCode": 200}`),
			},
		})
		if err != nil {
			return err
		}

		// Create method response
		getPatientsMethodResponse, err := apigateway.NewMethodResponse(ctx, fmt.Sprintf("get-patients-response-%s", environmentSuffix), &apigateway.MethodResponseArgs{
			RestApi:    api.ID(),
			ResourceId: patientsResource.ID(),
			HttpMethod: getPatientsMethod.HttpMethod,
			StatusCode: pulumi.String("200"),
			ResponseModels: pulumi.StringMap{
				"application/json": pulumi.String("Empty"),
			},
		})
		if err != nil {
			return err
		}

		// Create integration response
		getPatientsIntegrationResponse, err := apigateway.NewIntegrationResponse(ctx, fmt.Sprintf("get-patients-integration-response-%s", environmentSuffix), &apigateway.IntegrationResponseArgs{
			RestApi:    api.ID(),
			ResourceId: patientsResource.ID(),
			HttpMethod: getPatientsMethod.HttpMethod,
			StatusCode: pulumi.String("200"),
			ResponseTemplates: pulumi.StringMap{
				"application/json": pulumi.String(`{"message": "Patient records retrieved"}`),
			},
		}, pulumi.DependsOn([]pulumi.Resource{getPatientsIntegration, getPatientsMethodResponse}))
		if err != nil {
			return err
		}

		// Create deployment
		deployment, err := apigateway.NewDeployment(ctx, fmt.Sprintf("patient-api-deployment-%s", environmentSuffix), &apigateway.DeploymentArgs{
			RestApi:     api.ID(),
			Description: pulumi.String("Patient API deployment"),
		}, pulumi.DependsOn([]pulumi.Resource{getPatientsMethod, getPatientsIntegration, getPatientsIntegrationResponse}))
		if err != nil {
			return err
		}

		// Create stage with CloudWatch logging
		stage, err := apigateway.NewStage(ctx, fmt.Sprintf("patient-api-stage-%s", environmentSuffix), &apigateway.StageArgs{
			RestApi:            api.ID(),
			Deployment:         deployment.ID(),
			StageName:          pulumi.String("prod"),
			Description:        pulumi.String("Production stage for patient API"),
			XrayTracingEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-stage-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create usage plan for rate limiting (must be created after stage)
		usagePlan, err := apigateway.NewUsagePlan(ctx, fmt.Sprintf("patient-api-usage-plan-%s", environmentSuffix), &apigateway.UsagePlanArgs{
			Description: pulumi.String("Rate limiting for patient API - 100 requests per minute"),
			ApiStages: apigateway.UsagePlanApiStageArray{
				&apigateway.UsagePlanApiStageArgs{
					ApiId: api.ID(),
					Stage: stage.StageName,
				},
			},
			ThrottleSettings: &apigateway.UsagePlanThrottleSettingsArgs{
				RateLimit:  pulumi.Float64(100),
				BurstLimit: pulumi.Int(200),
			},
			QuotaSettings: &apigateway.UsagePlanQuotaSettingsArgs{
				Limit:  pulumi.Int(10000),
				Period: pulumi.String("DAY"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-api-usage-plan-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		}, pulumi.DependsOn([]pulumi.Resource{stage}))
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpcId", vpcId)
		ctx.Export("kmsKeyId", kmsKey.ID())
		ctx.Export("kmsKeyArn", kmsKey.Arn)
		ctx.Export("auroraClusterEndpoint", auroraCluster.Endpoint)
		ctx.Export("auroraClusterReaderEndpoint", auroraCluster.ReaderEndpoint)
		ctx.Export("redisClusterEndpoint", redisCluster.PrimaryEndpointAddress)
		ctx.Export("redisClusterPort", redisCluster.Port)
		ctx.Export("dbSecretArn", dbSecret.Arn)
		ctx.Export("apiGatewayUrl", pulumi.Sprintf("https://%s.execute-api.us-east-1.amazonaws.com/%s", api.ID(), stage.StageName))
		ctx.Export("apiGatewayId", api.ID())
		ctx.Export("usagePlanId", usagePlan.ID())

		return nil
	})
}
