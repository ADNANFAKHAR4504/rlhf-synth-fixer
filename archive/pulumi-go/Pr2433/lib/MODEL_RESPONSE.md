# Secure Cloud Infrastructure with Pulumi Go

# I'll create a comprehensive cloud infrastructure solution that meets all your requirements. Here's the complete implementation:

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration
		cfg := config.New(ctx, "")
		projectName := ctx.Project()
		stackName := ctx.Stack()
		
		// Common tags for all resources
		commonTags := pulumi.StringMap{
			"Project":     pulumi.String(projectName),
			"Stack":       pulumi.String(stackName),
			"Environment": pulumi.String("production"),
			"ManagedBy":   pulumi.String("pulumi"),
		}

		// Get current AWS region and account ID
		current, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}

		region, err := aws.GetRegion(ctx, nil, nil)
		if err != nil {
			return err
		}

		// =============================================================================
		// NETWORKING INFRASTRUCTURE
		// =============================================================================

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "prod-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-vpc"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "prod-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-igw"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create public subnets (for NAT gateways and load balancers)
		publicSubnet1, err := ec2.NewSubnet(ctx, "prod-public-subnet-1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String("us-east-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-public-subnet-1"),
				"Type": pulumi.String("public"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, "prod-public-subnet-2", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String("us-east-1b"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-public-subnet-2"),
				"Type": pulumi.String("public"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create private subnets (for RDS and application servers)
		privateSubnet1, err := ec2.NewSubnet(ctx, "prod-private-subnet-1", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.10.0/24"),
			AvailabilityZone: pulumi.String("us-east-1a"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-private-subnet-1"),
				"Type": pulumi.String("private"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, "prod-private-subnet-2", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.11.0/24"),
			AvailabilityZone: pulumi.String("us-east-1b"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-private-subnet-2"),
				"Type": pulumi.String("private"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create NAT Gateway for private subnet internet access
		natEip, err := ec2.NewEip(ctx, "prod-nat-eip", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-nat-eip"),
			}.Merge(commonTags),
		}, pulumi.DependsOn([]pulumi.Resource{igw}))
		if err != nil {
			return err
		}

		natGateway, err := ec2.NewNatGateway(ctx, "prod-nat-gateway", &ec2.NatGatewayArgs{
			AllocationId: natEip.ID(),
			SubnetId:     publicSubnet1.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-nat-gateway"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create route tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "prod-public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-public-rt"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		privateRouteTable, err := ec2.NewRouteTable(ctx, "prod-private-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-private-rt"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Create routes
		_, err = ec2.NewRoute(ctx, "prod-public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "prod-private-route", &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGateway.ID(),
		})
		if err != nil {
			return err
		}

		// Associate subnets with route tables
		_, err = ec2.NewRouteTableAssociation(ctx, "prod-public-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "prod-public-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "prod-private-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "prod-private-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// SECURITY GROUPS
		// =============================================================================

		// Web tier security group
		webSecurityGroup, err := ec2.NewSecurityGroup(ctx, "prod-web-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("prod-web-sg"),
			Description: pulumi.String("Security group for web tier"),
			VpcId:       vpc.ID(),
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
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
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
				"Name": pulumi.String("prod-web-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Application tier security group
		appSecurityGroup, err := ec2.NewSecurityGroup(ctx, "prod-app-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("prod-app-sg"),
			Description: pulumi.String("Security group for application tier"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(8080),
					ToPort:         pulumi.Int(8080),
					SecurityGroups: pulumi.StringArray{webSecurityGroup.ID()},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
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
				"Name": pulumi.String("prod-app-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Database security group
		dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "prod-db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("prod-db-sg"),
			Description: pulumi.String("Security group for database tier"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{appSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-db-sg"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// NETWORK ACLs
		// =============================================================================

		// Private subnet NACL for additional security
		privateNacl, err := ec2.NewNetworkAcl(ctx, "prod-private-nacl", &ec2.NetworkAclArgs{
			VpcId: vpc.ID(),
			Ingress: ec2.NetworkAclIngressArray{
				&ec2.NetworkAclIngressArgs{
					Protocol:   pulumi.String("tcp"),
					RuleNo:     pulumi.Int(100),
					Action:     pulumi.String("allow"),
					CidrBlock:  pulumi.String("10.0.0.0/16"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(65535),
				},
				&ec2.NetworkAclIngressArgs{
					Protocol:   pulumi.String("tcp"),
					RuleNo:     pulumi.Int(110),
					Action:     pulumi.String("allow"),
					CidrBlock:  pulumi.String("0.0.0.0/0"),
					FromPort:   pulumi.Int(1024),
					ToPort:     pulumi.Int(65535),
				},
			},
			Egress: ec2.NetworkAclEgressArray{
				&ec2.NetworkAclEgressArgs{
					Protocol:   pulumi.String("-1"),
					RuleNo:     pulumi.Int(100),
					Action:     pulumi.String("allow"),
					CidrBlock:  pulumi.String("0.0.0.0/0"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
				},
			},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-private-nacl"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// Associate private subnets with NACL
		_, err = ec2.NewNetworkAclAssociation(ctx, "prod-private-nacl-assoc-1", &ec2.NetworkAclAssociationArgs{
			NetworkAclId: privateNacl.ID(),
			SubnetId:     privateSubnet1.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewNetworkAclAssociation(ctx, "prod-private-nacl-assoc-2", &ec2.NetworkAclAssociationArgs{
			NetworkAclId: privateNacl.ID(),
			SubnetId:     privateSubnet2.ID(),
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// IAM ROLES AND POLICIES
		// =============================================================================

		// EC2 instance role for S3 access
		ec2Role, err := iam.NewRole(ctx, "prod-ec2-s3-role", &iam.RoleArgs{
			Name: pulumi.String("prod-ec2-s3-role"),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ec2.amazonaws.com"
						},
						"Effect": "Allow"
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// S3 access policy for EC2 instances
		s3Policy, err := iam.NewPolicy(ctx, "prod-s3-access-policy", &iam.PolicyArgs{
			Name:        pulumi.String("prod-s3-access-policy"),
			Description: pulumi.String("Policy for EC2 instances to access S3 buckets"),
			Policy: pulumi.String(fmt.Sprintf(`{
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
							"arn:aws:s3:::prod-*",
							"arn:aws:s3:::prod-*/*"
						]
					},
					{
						"Effect": "Allow",
						"Action": [
							"cloudwatch:PutMetricData",
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents"
						],
						"Resource": "*"
					}
				]
			}`)),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Attach policy to role
		_, err = iam.NewRolePolicyAttachment(ctx, "prod-ec2-s3-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: s3Policy.Arn,
		})
		if err != nil {
			return err
		}

		// Instance profile for EC2
		instanceProfile, err := iam.NewInstanceProfile(ctx, "prod-ec2-instance-profile", &iam.InstanceProfileArgs{
			Name: pulumi.String("prod-ec2-instance-profile"),
			Role: ec2Role.Name,
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// S3 BUCKETS
		// =============================================================================

		// Application data bucket with versioning
		appDataBucket, err := s3.NewBucketV2(ctx, "prod-app-data", &s3.BucketV2Args{
			Bucket: pulumi.String("prod-app-data-" + current.AccountId),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Enable versioning on app data bucket
		_, err = s3.NewBucketVersioningV2(ctx, "prod-app-data-versioning", &s3.BucketVersioningV2Args{
			Bucket: appDataBucket.ID(),
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Static assets bucket
		staticAssetsBucket, err := s3.NewBucketV2(ctx, "prod-static-assets", &s3.BucketV2Args{
			Bucket: pulumi.String("prod-static-assets-" + current.AccountId),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Backup bucket
		backupBucket, err := s3.NewBucketV2(ctx, "prod-backups", &s3.BucketV2Args{
			Bucket: pulumi.String("prod-backups-" + current.AccountId),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Logs bucket for server access logs
		logsBucket, err := s3.NewBucketV2(ctx, "prod-logs", &s3.BucketV2Args{
			Bucket: pulumi.String("prod-logs-" + current.AccountId),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// Configure server-side encryption for all buckets
		buckets := []*s3.BucketV2{appDataBucket, staticAssetsBucket, backupBucket, logsBucket}
		bucketNames := []string{"prod-app-data", "prod-static-assets", "prod-backups", "prod-logs"}

		for i, bucket := range buckets {
			// Server-side encryption
			_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, bucketNames[i]+"-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
				Bucket: bucket.ID(),
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

			// Public access block
			_, err = s3.NewBucketPublicAccessBlock(ctx, bucketNames[i]+"-pab", &s3.BucketPublicAccessBlockArgs{
				Bucket:                bucket.ID(),
				BlockPublicAcls:       pulumi.Bool(true),
				BlockPublicPolicy:     pulumi.Bool(true),
				IgnorePublicAcls:      pulumi.Bool(true),
				RestrictPublicBuckets: pulumi.Bool(true),
			})
			if err != nil {
				return err
			}

			// Server access logging (except for logs bucket itself)
			if bucketNames[i] != "prod-logs" {
				_, err = s3.NewBucketLoggingV2(ctx, bucketNames[i]+"-logging", &s3.BucketLoggingV2Args{
					Bucket: bucket.ID(),
					TargetBucket: logsBucket.ID(),
					TargetPrefix: pulumi.String(bucketNames[i] + "/"),
				})
				if err != nil {
					return err
				}
			}
		}

		// Lifecycle policy for cost optimization
		_, err = s3.NewBucketLifecycleConfigurationV2(ctx, "prod-app-data-lifecycle", &s3.BucketLifecycleConfigurationV2Args{
			Bucket: appDataBucket.ID(),
			Rules: s3.BucketLifecycleConfigurationV2RuleArray{
				&s3.BucketLifecycleConfigurationV2RuleArgs{
					Id:     pulumi.String("transition_to_ia"),
					Status: pulumi.String("Enabled"),
					Transitions: s3.BucketLifecycleConfigurationV2RuleTransitionArray{
						&s3.BucketLifecycleConfigurationV2RuleTransitionArgs{
							Days:         pulumi.Int(30),
							StorageClass: pulumi.String("STANDARD_IA"),
						},
						&s3.BucketLifecycleConfigurationV2RuleTransitionArgs{
							Days:         pulumi.Int(90),
							StorageClass: pulumi.String("GLACIER"),
						},
					},
					NoncurrentVersionTransitions: s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArray{
						&s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs{
							NoncurrentDays: pulumi.Int(30),
							StorageClass:   pulumi.String("STANDARD_IA"),
						},
					},
					NoncurrentVersionExpiration: &s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs{
						NoncurrentDays: pulumi.Int(365),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// RDS DATABASE
		// =============================================================================

		// DB subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "prod-db-subnet-group", &rds.SubnetGroupArgs{
			Name:       pulumi.String("prod-db-subnet-group"),
			SubnetIds:  pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-db-subnet-group"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// RDS parameter group
		dbParameterGroup, err := rds.NewParameterGroup(ctx, "prod-postgres-params", &rds.ParameterGroupArgs{
			Name:   pulumi.String("prod-postgres-params"),
			Family: pulumi.String("postgres15"),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("log_statement"),
					Value: pulumi.String("all"),
				},
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("log_min_duration_statement"),
					Value: pulumi.String("1000"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// RDS instance
		dbPassword := cfg.RequireSecret("dbPassword")
		
		rdsInstance, err := rds.NewInstance(ctx, "prod-postgres", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(100),
			StorageType:           pulumi.String("gp3"),
			Engine:                pulumi.String("postgres"),
			EngineVersion:         pulumi.String("15.4"),
			InstanceClass:         pulumi.String("db.t3.medium"),
			DbName:                pulumi.String("proddb"),
			Username:              pulumi.String("dbadmin"),
			Password:              dbPassword,
			VpcSecurityGroupIds:   pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			ParameterGroupName:    dbParameterGroup.Name,
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			MultiAz:               pulumi.Bool(true),
			StorageEncrypted:      pulumi.Bool(true),
			PubliclyAccessible:    pulumi.Bool(false),
			DeletionProtection:    pulumi.Bool(true),
			SkipFinalSnapshot:     pulumi.Bool(false),
			FinalSnapshotIdentifier: pulumi.String("prod-postgres-final-snapshot"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String("prod-postgres"),
			}.Merge(commonTags),
		})
		if err != nil {
			return err
		}

		// =============================================================================
		// CLOUDWATCH MONITORING
		// =============================================================================

		// CloudWatch dashboard
		dashboard, err := cloudwatch.NewDashboard(ctx, "prod-infrastructure-dashboard", &cloudwatch.DashboardArgs{
			DashboardName: pulumi.String("prod-infrastructure-dashboard"),
			DashboardBody: pulumi.All(rdsInstance.ID(), region.Name).ApplyT(func(args []interface{}) string {
				rdsId := args[0].(string)
				regionName := args[1].(string)
				
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
									[ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "%s" ],
									[ ".", "DatabaseConnections", ".", "." ],
									[ ".", "FreeableMemory", ".", "." ]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "RDS Metrics",
								"period": 300
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
									[ "AWS/S3", "BucketSizeBytes", "BucketName", "prod-app-data-%s", "StorageType", "StandardStorage" ],
									[ ".", "NumberOfObjects", ".", ".", ".", "AllStorageTypes" ]
								],
								"view": "timeSeries",
								"stacked": false,
								"region": "%s",
								"title": "S3 Metrics",
								"period": 86400
							}
						}
					]
				}`, rdsId, regionName, current.AccountId, regionName)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// CloudWatch alarms for RDS
		_, err = cloudwatch.NewMetricAlarm(ctx, "prod-rds-cpu-alarm", &cloudwatch.MetricAlarmArgs{
			AlarmName:          pulumi.String("prod-rds-high-cpu"),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80),
			AlarmDescription:   pulumi.String("This metric monitors RDS CPU utilization"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": rdsInstance.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		_, err = cloudwatch.NewMetricAlarm(ctx, "prod-rds-connections-alarm", &cloudwatch.MetricAl
```
