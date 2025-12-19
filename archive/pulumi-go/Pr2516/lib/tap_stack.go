package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/wafv2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Configuration with defaults
		cfg := config.New(ctx, "")
		projectName := cfg.Get("projectName")
		if projectName == "" {
			projectName = "tap-project"
		}
		environment := cfg.Get("environment")
		if environment == "" {
			environment = "dev"
		}

		// Common tags
		commonTags := pulumi.StringMap{
			"Project":     pulumi.String(projectName),
			"Environment": pulumi.String(environment),
			"ManagedBy":   pulumi.String("pulumi"),
			"Purpose":     pulumi.String("web-application-infrastructure"),
		}

		// Use hardcoded AZs for us-west-2
		availabilityZones := []string{"us-west-2a", "us-west-2b"}

		// 1. VPC with Public and Private Subnets
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("%s-vpc", projectName), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags:               commonTags,
		})
		if err != nil {
			return err
		}

		// Internet Gateway
		internetGateway, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("%s-igw", projectName), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags:  commonTags,
		})
		if err != nil {
			return err
		}

		// NAT Gateway and Elastic IPs
		eips := make([]*ec2.Eip, 2)
		for i := 0; i < 2; i++ {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("%s-nat-eip-%d", projectName, i), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags:   commonTags,
			})
			if err != nil {
				return err
			}
			eips[i] = eip
		}

		// Public subnets for ALB and Bastion
		publicSubnets := make([]*ec2.Subnet, 2)
		for i, az := range availabilityZones {
			publicSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-public-subnet-%d", projectName, i), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
				AvailabilityZone:    pulumi.String(az),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags:                commonTags,
			})
			if err != nil {
				return err
			}
			publicSubnets[i] = publicSubnet
		}

		// Private subnets for RDS and Application servers
		privateSubnets := make([]*ec2.Subnet, 2)
		for i, az := range availabilityZones {
			privateSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-private-subnet-%d", projectName, i), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
				AvailabilityZone: pulumi.String(az),
				Tags:             commonTags,
			})
			if err != nil {
				return err
			}
			privateSubnets[i] = privateSubnet
		}

		// NAT Gateways
		natGateways := make([]*ec2.NatGateway, 2)
		for i := 0; i < 2; i++ {
			natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("%s-nat-%d", projectName, i), &ec2.NatGatewayArgs{
				AllocationId: eips[i].ID(),
				SubnetId:     publicSubnets[i].ID(),
				Tags:         commonTags,
			})
			if err != nil {
				return err
			}
			natGateways[i] = natGateway
		}

		// Route Tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-public-rt", projectName), &ec2.RouteTableArgs{
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

		privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-private-rt", projectName), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock:    pulumi.String("0.0.0.0/0"),
					NatGatewayId: natGateways[0].ID(),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Route Table Associations
		for i, subnet := range publicSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-public-rta-%d", projectName, i), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		for i, subnet := range privateSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-private-rta-%d", projectName, i), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// 2. Security Groups
		// Bastion Security Group
		bastionSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-bastion-sg", projectName), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-bastion-sg", projectName)),
			Description: pulumi.String("Security group for bastion host"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}, // Restrict this in production
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
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// ALB Security Group
		albSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-alb-sg", projectName), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-alb-sg", projectName)),
			Description: pulumi.String("Security group for Application Load Balancer"),
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
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Application Security Group
		appSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-app-sg", projectName), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-app-sg", projectName)),
			Description: pulumi.String("Security group for application servers"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(80),
					ToPort:         pulumi.Int(80),
					SecurityGroups: pulumi.StringArray{albSg.ID()},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(443),
					ToPort:         pulumi.Int(443),
					SecurityGroups: pulumi.StringArray{albSg.ID()},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(22),
					ToPort:         pulumi.Int(22),
					SecurityGroups: pulumi.StringArray{bastionSg.ID()},
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
			Tags: commonTags,
		})

		// RDS Security Group
		dbSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("%s-db-sg", projectName), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-db-sg", projectName)),
			Description: pulumi.String("Security group for RDS instance"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(3306),
					ToPort:         pulumi.Int(3306),
					SecurityGroups: pulumi.StringArray{appSg.ID()},
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
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// 3. KMS Key for Encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("%s-kms-key", projectName), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for RDS encryption"),
			DeletionWindowInDays: pulumi.Int(7),
			EnableKeyRotation:    pulumi.Bool(true),
			Tags:                 commonTags,
		})
		if err != nil {
			return err
		}

		// 4. RDS Subnet Group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("%s-rds-subnet-group", projectName), &rds.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("%s-rds-subnet-group", projectName)),
			SubnetIds: pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			Tags:      commonTags,
		})
		if err != nil {
			return err
		}

		// 5. RDS Parameter Group
		rdsParameterGroup, err := rds.NewParameterGroup(ctx, fmt.Sprintf("%s-rds-param-group", projectName), &rds.ParameterGroupArgs{
			Family: pulumi.String("mysql8.0"),
			Name:   pulumi.String(fmt.Sprintf("%s-rds-param-group", projectName)),
			Parameters: rds.ParameterGroupParameterArray{
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("character_set_server"),
					Value: pulumi.String("utf8mb4"),
				},
				&rds.ParameterGroupParameterArgs{
					Name:  pulumi.String("character_set_client"),
					Value: pulumi.String("utf8mb4"),
				},
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// 6. RDS Instance
		// Get database password from config or use default for development
		dbPassword := cfg.Get("dbPassword")
		if dbPassword == "" {
			dbPassword = "DevPassword123!" // Default password for development
		}

		rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("%s-rds", projectName), &rds.InstanceArgs{
			AllocatedStorage:        pulumi.Int(20),
			StorageType:             pulumi.String("gp3"),
			Engine:                  pulumi.String("mysql"),
			EngineVersion:           pulumi.String("8.0"),
			InstanceClass:           pulumi.String("db.t3.micro"),
			DbName:                  pulumi.String("webappdb"),
			Username:                pulumi.String("dbadmin"),
			Password:                pulumi.String(dbPassword),
			ParameterGroupName:      rdsParameterGroup.Name,
			DbSubnetGroupName:       dbSubnetGroup.Name,
			VpcSecurityGroupIds:     pulumi.StringArray{dbSg.ID()},
			StorageEncrypted:        pulumi.Bool(true),
			PubliclyAccessible:      pulumi.Bool(false),
			KmsKeyId:                kmsKey.Arn,
			BackupRetentionPeriod:   pulumi.Int(7),
			BackupWindow:            pulumi.String("03:00-04:00"),
			MaintenanceWindow:       pulumi.String("sun:04:00-sun:05:00"),
			MultiAz:                 pulumi.Bool(true),
			SkipFinalSnapshot:       pulumi.Bool(false),
			FinalSnapshotIdentifier: pulumi.String(fmt.Sprintf("%s-rds-final-snapshot", projectName)),
			Tags:                    commonTags,
		})
		if err != nil {
			return err
		}

		// 7. S3 Bucket for ALB Logs
		albLogsBucket, err := s3.NewBucket(ctx, fmt.Sprintf("%s-alb-logs", projectName), &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("%s-alb-logs-%s", projectName, environment)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// S3 Bucket Encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("%s-alb-logs-encryption", projectName), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: albLogsBucket.Bucket,
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

		// S3 Bucket Public Access Block
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("%s-alb-logs-public-access-block", projectName), &s3.BucketPublicAccessBlockArgs{
			Bucket:                albLogsBucket.Bucket,
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// S3 Bucket Versioning
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("%s-alb-logs-versioning", projectName), &s3.BucketVersioningV2Args{
			Bucket: albLogsBucket.Bucket,
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// Note: Removed S3 Bucket ACL as it was causing issues
		// The bucket policy below provides the necessary permissions for ALB logs

		// S3 Bucket Server Access Logging
		_, err = s3.NewBucketLoggingV2(ctx, fmt.Sprintf("%s-alb-logs-logging", projectName), &s3.BucketLoggingV2Args{
			Bucket:       albLogsBucket.Bucket,
			TargetBucket: albLogsBucket.Bucket,
			TargetPrefix: pulumi.String("logs/"),
		})
		if err != nil {
			return err
		}

		// S3 Bucket Policy for ALB Logs
		albLogsBucketPolicy, err := s3.NewBucketPolicy(ctx, fmt.Sprintf("%s-alb-logs-policy", projectName), &s3.BucketPolicyArgs{
			Bucket: albLogsBucket.Bucket,
			Policy: albLogsBucket.Bucket.ApplyT(func(bucketName string) (string, error) {
				policy := map[string]interface{}{
					"Version": "2012-10-17",
					"Statement": []map[string]interface{}{
						{
							"Sid":    "AWSLogDeliveryWrite",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"Service": "delivery.logs.amazonaws.com",
							},
							"Action":   "s3:PutObject",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s/*", bucketName),
							"Condition": map[string]interface{}{
								"StringEquals": map[string]interface{}{
									"s3:x-amz-acl": "bucket-owner-full-control",
								},
							},
						},
						{
							"Sid":    "AWSLogDeliveryAclCheck",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"Service": "delivery.logs.amazonaws.com",
							},
							"Action":   "s3:GetBucketAcl",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s", bucketName),
						},
						{
							"Sid":    "ELBLogDeliveryWrite",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"AWS": "arn:aws:iam::797873946194:root", // ELB account for us-west-2 region
							},
							"Action":   "s3:PutObject",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s/*", bucketName),
						},
						{
							"Sid":    "ELBLogDeliveryAclCheck",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"AWS": "arn:aws:iam::797873946194:root", // ELB account for us-west-2 region
							},
							"Action":   "s3:GetBucketAcl",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s", bucketName),
						},
					},
				}
				policyBytes, err := json.Marshal(policy)
				return string(policyBytes), err
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// 8. S3 Bucket for Application Data
		appDataBucket, err := s3.NewBucket(ctx, fmt.Sprintf("%s-app-data", projectName), &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("%s-app-data-%s", projectName, environment)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// S3 Bucket Encryption for App Data
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("%s-app-data-encryption", projectName), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: appDataBucket.Bucket,
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

		// S3 Bucket Public Access Block for App Data
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("%s-app-data-public-access-block", projectName), &s3.BucketPublicAccessBlockArgs{
			Bucket:                appDataBucket.Bucket,
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// 9. S3 Bucket for Backup
		backupBucket, err := s3.NewBucket(ctx, fmt.Sprintf("%s-backup", projectName), &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("%s-backup-%s", projectName, environment)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// S3 Bucket Encryption for Backup
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("%s-backup-encryption", projectName), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: backupBucket.Bucket,
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

		// S3 Bucket Public Access Block for Backup
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("%s-backup-public-access-block", projectName), &s3.BucketPublicAccessBlockArgs{
			Bucket:                backupBucket.Bucket,
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// 10. Application Load Balancer
		alb, err := lb.NewLoadBalancer(ctx, fmt.Sprintf("%s-alb", projectName), &lb.LoadBalancerArgs{
			Name:                     pulumi.String(fmt.Sprintf("%s-alb", projectName)),
			Internal:                 pulumi.Bool(false),
			LoadBalancerType:         pulumi.String("application"),
			SecurityGroups:           pulumi.StringArray{albSg.ID()},
			Subnets:                  pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
			EnableDeletionProtection: pulumi.Bool(false),
			AccessLogs: &lb.LoadBalancerAccessLogsArgs{
				Bucket:  albLogsBucket.Bucket,
				Prefix:  pulumi.String("alb-logs"),
				Enabled: pulumi.Bool(true),
			},
			Tags: commonTags,
		}, pulumi.DependsOn([]pulumi.Resource{albLogsBucket, albLogsBucketPolicy}))
		if err != nil {
			return err
		}

		// 11. ALB Target Group
		targetGroup, err := lb.NewTargetGroup(ctx, fmt.Sprintf("%s-tg", projectName), &lb.TargetGroupArgs{
			Name:       pulumi.String(fmt.Sprintf("%s-tg", projectName)),
			Port:       pulumi.Int(80),
			Protocol:   pulumi.String("HTTP"),
			VpcId:      vpc.ID(),
			TargetType: pulumi.String("instance"),
			HealthCheck: &lb.TargetGroupHealthCheckArgs{
				Enabled:            pulumi.Bool(true),
				HealthyThreshold:   pulumi.Int(2),
				Interval:           pulumi.Int(30),
				Matcher:            pulumi.String("200"),
				Path:               pulumi.String("/health"),
				Port:               pulumi.String("traffic-port"),
				Protocol:           pulumi.String("HTTP"),
				Timeout:            pulumi.Int(5),
				UnhealthyThreshold: pulumi.Int(2),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// 12. ALB Listener
		_, err = lb.NewListener(ctx, fmt.Sprintf("%s-listener", projectName), &lb.ListenerArgs{
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
			return err
		}

		// 13. Launch Template for Application Servers
		userData := `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
`
		userDataEncoded := base64.StdEncoding.EncodeToString([]byte(userData))

		_, err = ec2.NewLaunchTemplate(ctx, fmt.Sprintf("%s-lt", projectName), &ec2.LaunchTemplateArgs{
			NamePrefix:          pulumi.String(fmt.Sprintf("%s-lt", projectName)),
			ImageId:             pulumi.String("ami-0735c191cf914754d"), // Amazon Linux 2 in us-west-2
			InstanceType:        pulumi.String("t3.micro"),
			VpcSecurityGroupIds: pulumi.StringArray{appSg.ID()},
			UserData:            pulumi.String(userDataEncoded),
			TagSpecifications: ec2.LaunchTemplateTagSpecificationArray{
				&ec2.LaunchTemplateTagSpecificationArgs{
					ResourceType: pulumi.String("instance"),
					Tags:         commonTags,
				},
			},
		})
		if err != nil {
			return err
		}

		// 14. Auto Scaling Group - Commented out due to SDK compatibility issues
		// _, err = autoscaling.NewGroup(ctx, fmt.Sprintf("%s-asg", projectName), &autoscaling.GroupArgs{
		// 	Name:                pulumi.String(fmt.Sprintf("%s-asg", projectName)),
		// 	DesiredCapacity:     pulumi.Int(2),
		// 	MaxSize:             pulumi.Int(4),
		// 	MinSize:             pulumi.Int(1),
		// 	VpcZoneIdentifier:   pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
		// 	LaunchTemplate: &autoscaling.GroupLaunchTemplateArgs{
		// 		Id:      launchTemplate.ID(),
		// 		Version: pulumi.String("$Latest"),
		// 	},
		// 	TargetGroupArns: pulumi.StringArray{targetGroup.Arn},
		// 	Tags: autoscaling.GroupTagArray{
		// 		&autoscaling.GroupTagArgs{
		// 			Key:               pulumi.String("Name"),
		// 			Value:             pulumi.String(fmt.Sprintf("%s-app-instance", projectName)),
		// 			PropagateAtLaunch: pulumi.Bool(true),
		// 		},
		// 	},
		// })
		// if err != nil {
		// 	return err
		// }

		// 15. Bastion Host
		bastionInstance, err := ec2.NewInstance(ctx, fmt.Sprintf("%s-bastion", projectName), &ec2.InstanceArgs{
			Ami:                 pulumi.String("ami-0735c191cf914754d"), // Amazon Linux 2 in us-west-2
			InstanceType:        pulumi.String("t3.micro"),
			SubnetId:            publicSubnets[0].ID(),
			VpcSecurityGroupIds: pulumi.StringArray{bastionSg.ID()},
			KeyName:             pulumi.StringPtr(cfg.Get("keyName")),
			Tags:                commonTags,
		})
		if err != nil {
			return err
		}

		// 16. WAF Web ACL
		wafWebAcl, err := wafv2.NewWebAcl(ctx, fmt.Sprintf("%s-waf", projectName), &wafv2.WebAclArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-waf", projectName)),
			Description: pulumi.String("WAF for protecting public IPs"),
			Scope:       pulumi.String("REGIONAL"),
			DefaultAction: &wafv2.WebAclDefaultActionArgs{
				Allow: &wafv2.WebAclDefaultActionAllowArgs{},
			},
			Rules: wafv2.WebAclRuleArray{
				&wafv2.WebAclRuleArgs{
					Name:     pulumi.String("AWSManagedRulesCommonRuleSet"),
					Priority: pulumi.Int(1),
					OverrideAction: &wafv2.WebAclRuleOverrideActionArgs{
						None: &wafv2.WebAclRuleOverrideActionNoneArgs{},
					},
					Statement: &wafv2.WebAclRuleStatementArgs{
						ManagedRuleGroupStatement: &wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs{
							Name:       pulumi.String("AWSManagedRulesCommonRuleSet"),
							VendorName: pulumi.String("AWS"),
						},
					},
					VisibilityConfig: &wafv2.WebAclRuleVisibilityConfigArgs{
						CloudwatchMetricsEnabled: pulumi.Bool(true),
						MetricName:               pulumi.String("AWSManagedRulesCommonRuleSetMetric"),
						SampledRequestsEnabled:   pulumi.Bool(true),
					},
				},
			},
			VisibilityConfig: &wafv2.WebAclVisibilityConfigArgs{
				CloudwatchMetricsEnabled: pulumi.Bool(true),
				MetricName:               pulumi.String(fmt.Sprintf("%s-waf-metric", projectName)),
				SampledRequestsEnabled:   pulumi.Bool(true),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// 17. WAF Association with ALB
		_, err = wafv2.NewWebAclAssociation(ctx, fmt.Sprintf("%s-waf-alb-assoc", projectName), &wafv2.WebAclAssociationArgs{
			ResourceArn: alb.Arn,
			WebAclArn:   wafWebAcl.Arn,
		})
		if err != nil {
			return err
		}

		// 18. CloudTrail
		cloudTrailBucket, err := s3.NewBucket(ctx, fmt.Sprintf("%s-cloudtrail", projectName), &s3.BucketArgs{
			Bucket: pulumi.String(fmt.Sprintf("%s-cloudtrail-%s", projectName, environment)),
			Tags:   commonTags,
		})
		if err != nil {
			return err
		}

		// CloudTrail S3 Bucket Encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("%s-cloudtrail-encryption", projectName), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: cloudTrailBucket.Bucket,
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

		// CloudTrail S3 Bucket Public Access Block
		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("%s-cloudtrail-public-access-block", projectName), &s3.BucketPublicAccessBlockArgs{
			Bucket:                cloudTrailBucket.Bucket,
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// CloudTrail S3 Bucket Versioning
		_, err = s3.NewBucketVersioningV2(ctx, fmt.Sprintf("%s-cloudtrail-versioning", projectName), &s3.BucketVersioningV2Args{
			Bucket: cloudTrailBucket.Bucket,
			VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
				Status: pulumi.String("Enabled"),
			},
		})
		if err != nil {
			return err
		}

		// CloudTrail S3 Bucket Server Access Logging
		_, err = s3.NewBucketLoggingV2(ctx, fmt.Sprintf("%s-cloudtrail-logging", projectName), &s3.BucketLoggingV2Args{
			Bucket:       cloudTrailBucket.Bucket,
			TargetBucket: cloudTrailBucket.Bucket,
			TargetPrefix: pulumi.String("logs/"),
		})
		if err != nil {
			return err
		}

		// CloudTrail S3 Bucket Policy
		cloudTrailBucketPolicy, err := s3.NewBucketPolicy(ctx, fmt.Sprintf("%s-cloudtrail-policy", projectName), &s3.BucketPolicyArgs{
			Bucket: cloudTrailBucket.Bucket,
			Policy: cloudTrailBucket.Bucket.ApplyT(func(bucketName string) (string, error) {
				policy := map[string]interface{}{
					"Version": "2012-10-17",
					"Statement": []map[string]interface{}{
						{
							"Sid":    "AWSCloudTrailAclCheck",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"Service": "cloudtrail.amazonaws.com",
							},
							"Action":   "s3:GetBucketAcl",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s", bucketName),
						},
						{
							"Sid":    "AWSCloudTrailWrite",
							"Effect": "Allow",
							"Principal": map[string]interface{}{
								"Service": "cloudtrail.amazonaws.com",
							},
							"Action":   "s3:PutObject",
							"Resource": fmt.Sprintf("arn:aws:s3:::%s/AWSLogs/*", bucketName),
							"Condition": map[string]interface{}{
								"StringEquals": map[string]interface{}{
									"s3:x-amz-acl": "bucket-owner-full-control",
								},
							},
						},
					},
				}
				policyJSON, err := json.Marshal(policy)
				return string(policyJSON), err
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		cloudTrail, err := cloudtrail.NewTrail(ctx, fmt.Sprintf("%s-trail", projectName), &cloudtrail.TrailArgs{
			Name:                       pulumi.String(fmt.Sprintf("%s-trail", projectName)),
			S3BucketName:               cloudTrailBucket.Bucket,
			IncludeGlobalServiceEvents: pulumi.Bool(true),
			IsMultiRegionTrail:         pulumi.Bool(true),
			EnableLogging:              pulumi.Bool(true),
			Tags:                       commonTags,
		}, pulumi.DependsOn([]pulumi.Resource{cloudTrailBucketPolicy}))
		if err != nil {
			return err
		}

		// 19. CloudWatch Alarms
		// RDS CPU Alarm
		rdsCpuAlarm, err := cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("%s-rds-cpu-alarm", projectName), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("%s-rds-cpu-alarm", projectName)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80.0),
			AlarmDescription:   pulumi.String("RDS CPU utilization is too high"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": rdsInstance.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// RDS Connections Alarm
		rdsConnectionsAlarm, err := cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("%s-rds-connections-alarm", projectName), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("%s-rds-connections-alarm", projectName)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("DatabaseConnections"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(100.0),
			AlarmDescription:   pulumi.String("RDS database connections are too high"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": rdsInstance.ID(),
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// ALB 5xx Error Alarm
		alb5xxAlarm, err := cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("%s-alb-5xx-alarm", projectName), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("%s-alb-5xx-alarm", projectName)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("HTTPCode_ELB_5XX_Count"),
			Namespace:          pulumi.String("AWS/ApplicationELB"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Sum"),
			Threshold:          pulumi.Float64(10.0),
			AlarmDescription:   pulumi.String("ALB is returning too many 5xx errors"),
			Dimensions: pulumi.StringMap{
				"LoadBalancer": alb.Name,
				"TargetGroup":  targetGroup.Name,
			},
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// 20. CloudWatch Dashboard
		cloudWatchDashboard, err := cloudwatch.NewDashboard(ctx, fmt.Sprintf("%s-dashboard", projectName), &cloudwatch.DashboardArgs{
			DashboardName: pulumi.String(fmt.Sprintf("%s-dashboard", projectName)),
			DashboardBody: pulumi.String(`{
				"widgets": [
					{
						"type": "metric",
						"x": 0,
						"y": 0,
						"width": 12,
						"height": 6,
						"properties": {
							"metrics": [
								["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "tap-project-rds"],
								["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "tap-project-rds"]
							],
							"view": "timeSeries",
							"stacked": false,
							"region": "us-west-2",
							"title": "RDS Metrics"
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
								["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "tap-project-alb"],
								["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", "tap-project-alb"]
							],
							"view": "timeSeries",
							"stacked": false,
							"region": "us-west-2",
							"title": "ALB Metrics"
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
								["AWS/S3", "NumberOfObjects", "BucketName", "tap-project-alb-logs-dev"],
								["AWS/S3", "BucketSizeBytes", "BucketName", "tap-project-alb-logs-dev", "StorageType", "StandardStorage"]
							],
							"view": "timeSeries",
							"stacked": false,
							"region": "us-west-2",
							"title": "S3 Metrics"
						}
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		// 21. IAM Roles and Policies
		// EC2 Instance Role
		ec2Role, err := iam.NewRole(ctx, fmt.Sprintf("%s-ec2-role", projectName), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("%s-ec2-role", projectName)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "ec2.amazonaws.com"
					}
				}]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// EC2 Instance Profile
		ec2InstanceProfile, err := iam.NewInstanceProfile(ctx, fmt.Sprintf("%s-ec2-profile", projectName), &iam.InstanceProfileArgs{
			Name: ec2Role.Name,
			Role: ec2Role.Name,
		})
		if err != nil {
			return err
		}

		// S3 Access Policy
		s3AccessPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("%s-s3-access-policy", projectName), &iam.PolicyArgs{
			Name: pulumi.String(fmt.Sprintf("%s-s3-access-policy", projectName)),
			Policy: pulumi.String(`{
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
							"arn:aws:s3:::tap-project-app-data-dev",
							"arn:aws:s3:::tap-project-app-data-dev/*"
						]
					}
				]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// CloudWatch Logs Policy
		cloudWatchPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("%s-cloudwatch-policy", projectName), &iam.PolicyArgs{
			Name: pulumi.String(fmt.Sprintf("%s-cloudwatch-policy", projectName)),
			Policy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents",
						"logs:DescribeLogStreams"
					],
					"Resource": ["arn:aws:logs:*:*:*"]
				}]
			}`),
			Tags: commonTags,
		})
		if err != nil {
			return err
		}

		// Attach CloudWatch policy to role
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-cloudwatch-attachment", projectName), &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: cloudWatchPolicy.Arn,
		})
		if err != nil {
			return err
		}

		// Attach S3 access policy to role
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-s3-access-attachment", projectName), &iam.RolePolicyAttachmentArgs{
			Role:      ec2Role.Name,
			PolicyArn: s3AccessPolicy.Arn,
		})
		if err != nil {
			return err
		}

		// Update launch template to use instance profile
		userDataWithProfile := `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
`
		userDataWithProfileEncoded := base64.StdEncoding.EncodeToString([]byte(userDataWithProfile))

		_, err = ec2.NewLaunchTemplate(ctx, fmt.Sprintf("%s-lt-with-profile", projectName), &ec2.LaunchTemplateArgs{
			NamePrefix:          pulumi.String(fmt.Sprintf("%s-lt-with-profile", projectName)),
			ImageId:             pulumi.String("ami-0735c191cf914754d"),
			InstanceType:        pulumi.String("t3.micro"),
			VpcSecurityGroupIds: pulumi.StringArray{appSg.ID()},
			IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
				Name: ec2InstanceProfile.Name,
			},
			UserData: pulumi.String(userDataWithProfileEncoded),
			TagSpecifications: ec2.LaunchTemplateTagSpecificationArray{
				&ec2.LaunchTemplateTagSpecificationArgs{
					ResourceType: pulumi.String("instance"),
					Tags:         commonTags,
				},
			},
		})
		if err != nil {
			return err
		}

		// Exports
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("publicSubnetIds", pulumi.All(publicSubnets[0].ID(), publicSubnets[1].ID()))
		ctx.Export("privateSubnetIds", pulumi.All(privateSubnets[0].ID(), privateSubnets[1].ID()))
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("albDnsName", alb.DnsName)
		ctx.Export("bastionPublicIp", bastionInstance.PublicIp)
		ctx.Export("kmsKeyArn", kmsKey.Arn)
		ctx.Export("wafWebAclArn", wafWebAcl.Arn)
		ctx.Export("cloudTrailName", cloudTrail.Name)
		ctx.Export("rdsCpuAlarmArn", rdsCpuAlarm.Arn)
		ctx.Export("rdsConnectionsAlarmArn", rdsConnectionsAlarm.Arn)
		ctx.Export("alb5xxAlarmArn", alb5xxAlarm.Arn)
		ctx.Export("cloudWatchDashboardUrl", cloudWatchDashboard.DashboardArn)

		return nil
	})
}
