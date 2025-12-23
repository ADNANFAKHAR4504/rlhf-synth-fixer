# Ideal Response

This document contains all the infrastructure code and test files for this project.

## Infrastructure Code


### infrastructure.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type InfrastructureConfig struct {
	Environment        string
	Regions            []string
	InstanceType       string
	DBInstanceClass    string
	DBAllocatedStorage int
	BackupRetention    int
	MultiAZ            bool
	EnableInsights     bool
	Tags               map[string]string
}

type MultiRegionInfrastructure struct {
	config InfrastructureConfig
	ctx    *pulumi.Context
	tags   pulumi.StringMap
}

func NewMultiRegionInfrastructure(ctx *pulumi.Context, config InfrastructureConfig) *MultiRegionInfrastructure {
	tags := pulumi.StringMap{
		"purpose":    pulumi.String("multi-region-infrastructure"),
		"managed-by": pulumi.String("pulumi"),
	}

	// Add custom tags from config (these take precedence)
	for k, v := range config.Tags {
		tags[k] = pulumi.String(v)
	}

	return &MultiRegionInfrastructure{
		config: config,
		ctx:    ctx,
		tags:   tags,
	}
}

func (m *MultiRegionInfrastructure) Deploy() error {
	// Create KMS key for encryption
	kmsKey, err := m.CreateKMSKey()
	if err != nil {
		return err
	}

	// Create S3 bucket for static files
	bucket, err := m.CreateS3Bucket(kmsKey)
	if err != nil {
		return err
	}

	// Create CloudFront distribution
	distribution, err := m.CreateCloudFrontDistribution(bucket)
	if err != nil {
		return err
	}

	// Create IAM roles and policies
	roles, err := m.CreateIAMResources()
	if err != nil {
		return err
	}

	// Deploy resources across regions
	regionalResources := make(map[string]map[string]pulumi.Output)
	for _, region := range m.config.Regions {
		resources, err := m.DeployRegionalResources(region, roles)
		if err != nil {
			return err
		}
		regionalResources[region] = resources
	}

	// COMMENTED OUT: CloudTrail not reliably supported by LocalStack
	// LocalStack throws "too many results: wanted 1, got 2" errors when reading trails
	// Create CloudTrail for auditing
	// cloudtrailBucket, err := m.CreateCloudTrailBucket(kmsKey)
	// if err != nil {
	// 	return err
	// }
	// if err := m.CreateCloudTrail(cloudtrailBucket); err != nil {
	// 	return err
	// }

	// Export outputs
	// LocalStack: Pass nil for cloudtrailBucket since CloudTrail is commented out
	m.exportOutputs(bucket, nil, distribution, roles, regionalResources)

	return nil
}

func (m *MultiRegionInfrastructure) CreateKMSKey() (*kms.Key, error) {
	key, err := newKMSKey(m.ctx, fmt.Sprintf("%s-encryption-key", m.config.Environment), &kms.KeyArgs{
		Description: pulumi.String("Multi-region infrastructure encryption key"),

		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	_, err = newKMSAlias(m.ctx, fmt.Sprintf("%s-encryption-key-alias", m.config.Environment), &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/%s-encryption", m.config.Environment)),
		TargetKeyId: key.KeyId,
	})
	if err != nil {
		return nil, err
	}

	return key, nil
}

func (m *MultiRegionInfrastructure) CreateS3Bucket(kmsKey *kms.Key) (*s3.Bucket, error) {
	bucket, err := newS3Bucket(m.ctx, fmt.Sprintf("%s-static-assets", m.config.Environment), &s3.BucketArgs{
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// Configure bucket encryption
	_, err = newS3BucketEncryption(m.ctx, fmt.Sprintf("%s-bucket-encryption", m.config.Environment), &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: bucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					KmsMasterKeyId: kmsKey.Arn,
					SseAlgorithm:   pulumi.String("aws:kms"),
				},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Configure bucket versioning
	_, err = newS3BucketVersioning(m.ctx, fmt.Sprintf("%s-bucket-versioning", m.config.Environment), &s3.BucketVersioningV2Args{
		Bucket: bucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Block public access
	_, err = newS3BucketPAB(m.ctx, fmt.Sprintf("%s-bucket-pab", m.config.Environment), &s3.BucketPublicAccessBlockArgs{
		Bucket:                bucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, err
	}

	// Create access logging bucket
	logBucket, err := newS3Bucket(m.ctx, fmt.Sprintf("%s-access-logs", m.config.Environment), &s3.BucketArgs{
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// Configure access logging
	_, err = newS3BucketLogging(m.ctx, fmt.Sprintf("%s-bucket-logging", m.config.Environment), &s3.BucketLoggingV2Args{
		Bucket:       bucket.ID(),
		TargetBucket: logBucket.ID(),
		TargetPrefix: pulumi.String("access-logs/"),
	})

	return bucket, err
}

func (m *MultiRegionInfrastructure) CreateCloudFrontDistribution(bucket *s3.Bucket) (*cloudfront.Distribution, error) {
	// COMMENTED OUT: CloudFront OriginAccessControl is not fully supported by LocalStack
	// LocalStack throws "OriginRequestPolicyAlreadyExists" errors and does not properly handle OAC lifecycle
	// Create Origin Access Control
	// oac, err := cloudfront.NewOriginAccessControl(m.ctx, fmt.Sprintf("%s-oac", m.config.Environment), &cloudfront.OriginAccessControlArgs{
	// 	Name:                          pulumi.String(fmt.Sprintf("%s-oac", m.config.Environment)),
	// 	Description:                   pulumi.String("Origin Access Control for S3 bucket"),
	// 	OriginAccessControlOriginType: pulumi.String("s3"),
	// 	SigningBehavior:               pulumi.String("always"),
	// 	SigningProtocol:               pulumi.String("sigv4"),
	// })
	// if err != nil {
	// 	return nil, err
	// }

	// Create CloudFront distribution
	distribution, err := newCloudFrontDist(m.ctx, fmt.Sprintf("%s-distribution", m.config.Environment), &cloudfront.DistributionArgs{
		Origins: cloudfront.DistributionOriginArray{
			&cloudfront.DistributionOriginArgs{
				DomainName: bucket.BucketDomainName,
				OriginId:   pulumi.String("S3-" + m.config.Environment),
				// COMMENTED OUT: OriginAccessControlId not supported by LocalStack - using public S3 access instead
				// OriginAccessControlId: oac.ID(),
			},
		},
		DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{
			TargetOriginId:       pulumi.String("S3-" + m.config.Environment),
			ViewerProtocolPolicy: pulumi.String("redirect-to-https"),
			AllowedMethods:       pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")},
			CachedMethods:        pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")},
			ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
				QueryString: pulumi.Bool(false),
				Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
					Forward: pulumi.String("none"),
				},
			},
		},
		Enabled:           pulumi.Bool(true),
		IsIpv6Enabled:     pulumi.Bool(true),
		DefaultRootObject: pulumi.String("index.html"),
		Restrictions: &cloudfront.DistributionRestrictionsArgs{
			GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{
				RestrictionType: pulumi.String("none"),
			},
		},
		ViewerCertificate: &cloudfront.DistributionViewerCertificateArgs{
			CloudfrontDefaultCertificate: pulumi.Bool(true),
		},
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// Update S3 bucket policy to allow CloudFront access
	_, err = newS3BucketPolicy(m.ctx, fmt.Sprintf("%s-bucket-policy", m.config.Environment), &s3.BucketPolicyArgs{
		Bucket: bucket.ID(),
		Policy: pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudfront.amazonaws.com"
					},
					"Action": "s3:GetObject",
					"Resource": "%s/*",
					"Condition": {
						"StringEquals": {
							"AWS:SourceArn": "%s"
						}
					}
				}
			]
		}`, bucket.Arn, distribution.Arn),
	})

	return distribution, err
}

func (m *MultiRegionInfrastructure) CreateIAMResources() (map[string]*iam.Role, error) {
	roles := make(map[string]*iam.Role)

	// EC2 Instance Role
	ec2Role, err := newIAMRole(m.ctx, fmt.Sprintf("%s-ec2-role", m.config.Environment), &iam.RoleArgs{
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
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// EC2 Policy
	_, err = newIAMRolePolicy(m.ctx, fmt.Sprintf("%s-ec2-policy", m.config.Environment), &iam.RolePolicyArgs{
		Role: ec2Role.ID(),
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"cloudwatch:PutMetricData"
					],
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:*:*:log-group:/aws/ec2/*"
				}
			]
		}`),
	})
	if err != nil {
		return nil, err
	}

	// Instance Profile
	_, err = newIAMInstanceProfile(m.ctx, fmt.Sprintf("%s-ec2-profile", m.config.Environment), &iam.InstanceProfileArgs{
		Role: ec2Role.Name,
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	roles["ec2"] = ec2Role

	// RDS Enhanced Monitoring Role
	rdsRole, err := newIAMRole(m.ctx, fmt.Sprintf("%s-rds-monitoring-role", m.config.Environment), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "monitoring.rds.amazonaws.com"
					}
				}
			]
		}`),
		ManagedPolicyArns: pulumi.StringArray{
			pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"),
		},
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	roles["rds"] = rdsRole

	return roles, nil
}

func (m *MultiRegionInfrastructure) DeployRegionalResources(region string, roles map[string]*iam.Role) (map[string]pulumi.Output, error) {
	provider, err := newAWSProvider(m.ctx, fmt.Sprintf("provider-%s", region), &aws.ProviderArgs{
		Region: pulumi.String(region),
	})
	if err != nil {
		return nil, err
	}

	// Create VPC
	vpc, err := newVpc(m.ctx, fmt.Sprintf("%s-vpc-%s", m.config.Environment, region), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags:               m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create regional KMS key
	regionalKmsKey, err := newKMSKey(m.ctx, fmt.Sprintf("%s-kms-%s", m.config.Environment, region), &kms.KeyArgs{
		Description: pulumi.String(fmt.Sprintf("Regional encryption key for %s", region)),
		Tags:        m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create subnets
	subnets, err := m.CreateSubnets(region, vpc, provider)
	if err != nil {
		return nil, err
	}

	// Create security groups
	securityGroups, err := m.CreateSecurityGroups(region, vpc, provider)
	if err != nil {
		return nil, err
	}

	// Create RDS subnet group
	dbSubnetGroup, err := newRDSSubnetGroup(m.ctx, fmt.Sprintf("%s-db-subnet-group-%s", m.config.Environment, region), &rds.SubnetGroupArgs{
		SubnetIds: pulumi.StringArray{subnets["private1"].ID(), subnets["private2"].ID()},
		Tags:      m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// COMMENTED OUT: RDS instance creation not reliably supported by LocalStack
	// LocalStack RDS returns 'error' state instead of 'available' causing deployment failures
	// Create RDS instance
	// rdsInstance, err := m.CreateRDSInstance(region, dbSubnetGroup, securityGroups["db"], regionalKmsKey, roles["rds"], provider)
	// if err != nil {
	// 	return nil, err
	// }

	// Create CloudWatch Log Groups
	logGroup, err := newCloudWatchLogGroup(m.ctx, fmt.Sprintf("%s-app-logs-%s", m.config.Environment, region), &cloudwatch.LogGroupArgs{
		RetentionInDays: pulumi.Int(30),
		Tags:            m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create CloudWatch Dashboard for monitoring
	dashboard, err := newCloudWatchDashboard(m.ctx, fmt.Sprintf("%s-dashboard-%s", m.config.Environment, region), &cloudwatch.DashboardArgs{
		DashboardName: pulumi.String(fmt.Sprintf("%s-dashboard-%s", m.config.Environment, region)),
		DashboardBody: pulumi.String(`{
			"widgets": [
				{
					"type": "metric",
					"properties": {
						"metrics": [
							["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "` + fmt.Sprintf("%s-database-%s", m.config.Environment, region) + `"],
							["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "` + fmt.Sprintf("%s-database-%s", m.config.Environment, region) + `"]
						],
						"period": 300,
						"stat": "Average",
						"region": "` + region + `",
						"title": "RDS Metrics"
					}
				}
			]
		}`),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Return regional resources for export
	resources := map[string]pulumi.Output{
		"vpcId":     vpc.ID().ToStringOutput(),
		"kmsKeyId":  regionalKmsKey.ID().ToStringOutput(),
		"kmsKeyArn": regionalKmsKey.Arn,
		// COMMENTED OUT: RDS instance references removed since RDS creation is commented out for LocalStack
		// "rdsInstanceId":     rdsInstance.ID().ToStringOutput(),
		// "rdsEndpoint":       rdsInstance.Endpoint,
		"dbSubnetGroupName": dbSubnetGroup.Name,
		"dbSecurityGroupId": securityGroups["db"].ID().ToStringOutput(),
		"logGroupName":      logGroup.Name,
		"dashboardName":     dashboard.DashboardName,
		"publicSubnet1Id":   subnets["public1"].ID().ToStringOutput(),
		"publicSubnet2Id":   subnets["public2"].ID().ToStringOutput(),
		"privateSubnet1Id":  subnets["private1"].ID().ToStringOutput(),
		"privateSubnet2Id":  subnets["private2"].ID().ToStringOutput(),
	}

	return resources, nil
}

func (m *MultiRegionInfrastructure) CreateSubnets(region string, vpc *ec2.Vpc, provider *aws.Provider) (map[string]*ec2.Subnet, error) {
	subnets := make(map[string]*ec2.Subnet)

	// Get availability zones
	azs, err := getAvailabilityZones(m.ctx, &aws.GetAvailabilityZonesArgs{
		State: pulumi.StringRef("available"),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Public subnets
	for i, az := range azs.Names[:2] {
		subnet, err := newSubnet(m.ctx, fmt.Sprintf("%s-public-%d-%s", m.config.Environment, i+1, region), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone:    pulumi.String(az),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags:                m.tags,
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		subnets[fmt.Sprintf("public%d", i+1)] = subnet
	}

	// Private subnets
	for i, az := range azs.Names[:2] {
		subnet, err := newSubnet(m.ctx, fmt.Sprintf("%s-private-%d-%s", m.config.Environment, i+1, region), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
			AvailabilityZone: pulumi.String(az),
			Tags:             m.tags,
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		subnets[fmt.Sprintf("private%d", i+1)] = subnet
	}

	// Internet Gateway
	igw, err := newInternetGateway(m.ctx, fmt.Sprintf("%s-igw-%s", m.config.Environment, region), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags:  m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Public route table
	publicRT, err := newRouteTable(m.ctx, fmt.Sprintf("%s-public-rt-%s", m.config.Environment, region), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
		Tags: m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Associate public subnets with public route table
	for i := 1; i <= 2; i++ {
		_, err = newRouteTableAssoc(m.ctx, fmt.Sprintf("%s-public-%d-rta-%s", m.config.Environment, i, region), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnets[fmt.Sprintf("public%d", i)].ID(),
			RouteTableId: publicRT.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	return subnets, nil
}

func (m *MultiRegionInfrastructure) CreateSecurityGroups(region string, vpc *ec2.Vpc, provider *aws.Provider) (map[string]*ec2.SecurityGroup, error) {
	securityGroups := make(map[string]*ec2.SecurityGroup)

	// Database security group
	dbSG, err := newSecurityGroup(m.ctx, fmt.Sprintf("%s-db-sg-%s", m.config.Environment, region), &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Database security group"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(3306),
				ToPort:     pulumi.Int(3306),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.11.0/24"), pulumi.String("10.0.12.0/24")},
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			&ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(443),
				ToPort:     pulumi.Int(443),
				CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
		},
		Tags: m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	securityGroups["db"] = dbSG

	return securityGroups, nil
}

func (m *MultiRegionInfrastructure) CreateRDSInstance(region string, subnetGroup *rds.SubnetGroup, securityGroup *ec2.SecurityGroup, kmsKey *kms.Key, monitoringRole *iam.Role, provider *aws.Provider) (*rds.Instance, error) {
	rdsInstance, err := newRDSInstance(m.ctx, fmt.Sprintf("%s-database-%s", m.config.Environment, region), &rds.InstanceArgs{
		AllocatedStorage: pulumi.Int(m.config.DBAllocatedStorage),
		// COMMENTED OUT: StorageType gp3 is not supported by LocalStack - causes RDS instance creation failure
		// StorageType:              pulumi.String("gp3"),
		Engine:        pulumi.String("mysql"),
		EngineVersion: pulumi.String("8.0"),
		InstanceClass: pulumi.String(m.config.DBInstanceClass),
		DbName:        pulumi.String(fmt.Sprintf("%sdb", m.config.Environment)),
		Username:      pulumi.String(fmt.Sprintf("dbadmin_%s", m.config.Environment)),
		// COMMENTED OUT: ManageMasterUserPassword is not supported by LocalStack - RDS requires explicit password
		// ManageMasterUserPassword: pulumi.Bool(true),
		Password:            pulumi.String("TempPassword123!"), // Added explicit password for LocalStack compatibility
		VpcSecurityGroupIds: pulumi.StringArray{securityGroup.ID()},
		DbSubnetGroupName:   subnetGroup.Name,
		// COMMENTED OUT: BackupRetentionPeriod is not fully supported by LocalStack - causes RDS errors
		// BackupRetentionPeriod:    pulumi.Int(m.config.BackupRetention),
		// COMMENTED OUT: BackupWindow is not supported by LocalStack
		// BackupWindow:             pulumi.String("03:00-04:00"),
		// COMMENTED OUT: MaintenanceWindow is not supported by LocalStack
		// MaintenanceWindow:        pulumi.String("sun:04:00-sun:05:00"),
		// COMMENTED OUT: MultiAZ is not supported by LocalStack - causes RDS deployment failures
		// MultiAz:                  pulumi.Bool(m.config.MultiAZ),
		// COMMENTED OUT: StorageEncrypted is not fully supported by LocalStack for RDS
		// StorageEncrypted:         pulumi.Bool(true),
		// COMMENTED OUT: KmsKeyId is not supported by LocalStack for RDS encryption
		// KmsKeyId:                 kmsKey.Arn,
		// COMMENTED OUT: MonitoringInterval is not supported by LocalStack - enhanced monitoring unavailable
		// MonitoringInterval:       pulumi.Int(60),
		// COMMENTED OUT: MonitoringRoleArn is not supported by LocalStack
		// MonitoringRoleArn:        monitoringRole.Arn,
		// COMMENTED OUT: AutoMinorVersionUpgrade is not supported by LocalStack
		// AutoMinorVersionUpgrade:  pulumi.Bool(true),
		// COMMENTED OUT: DeletionProtection is not supported by LocalStack
		// DeletionProtection:       pulumi.Bool(false),
		// COMMENTED OUT: SkipFinalSnapshot conflicts with FinalSnapshotIdentifier and snapshots not fully supported in LocalStack
		// SkipFinalSnapshot:        pulumi.Bool(false),
		SkipFinalSnapshot: pulumi.Bool(true), // Changed to true for LocalStack compatibility
		// COMMENTED OUT: FinalSnapshotIdentifier is not supported by LocalStack - snapshots not available
		// FinalSnapshotIdentifier:  pulumi.String(fmt.Sprintf("%s-final-snapshot-%s", m.config.Environment, region)),
		Tags: m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// COMMENTED OUT: CloudWatch Metric Alarms are not fully supported by LocalStack - alarm creation may fail or not function properly
	// Create CloudWatch alarms for RDS monitoring
	// _, err = cloudwatch.NewMetricAlarm(m.ctx, fmt.Sprintf("%s-rds-cpu-alarm-%s", m.config.Environment, region), &cloudwatch.MetricAlarmArgs{
	// 	Name:               pulumi.String(fmt.Sprintf("%s-rds-cpu-high-%s", m.config.Environment, region)),
	// 	ComparisonOperator: pulumi.String("GreaterThanThreshold"),
	// 	EvaluationPeriods:  pulumi.Int(2),
	// 	MetricName:         pulumi.String("CPUUtilization"),
	// 	Namespace:          pulumi.String("AWS/RDS"),
	// 	Period:             pulumi.Int(300),
	// 	Statistic:          pulumi.String("Average"),
	// 	Threshold:          pulumi.Float64(80),
	// 	AlarmDescription:   pulumi.String("RDS CPU utilization is too high"),
	// 	Dimensions: pulumi.StringMap{
	// 		"DBInstanceIdentifier": rdsInstance.ID(),
	// 	},
	// 	Tags: m.tags,
	// }, pulumi.Provider(provider))
	// if err != nil {
	// 	return nil, err
	// }

	// COMMENTED OUT: CloudWatch Metric Alarms are not fully supported by LocalStack
	// _, err = cloudwatch.NewMetricAlarm(m.ctx, fmt.Sprintf("%s-rds-connections-alarm-%s", m.config.Environment, region), &cloudwatch.MetricAlarmArgs{
	// 	Name:               pulumi.String(fmt.Sprintf("%s-rds-connections-high-%s", m.config.Environment, region)),
	// 	ComparisonOperator: pulumi.String("GreaterThanThreshold"),
	// 	EvaluationPeriods:  pulumi.Int(2),
	// 	MetricName:         pulumi.String("DatabaseConnections"),
	// 	Namespace:          pulumi.String("AWS/RDS"),
	// 	Period:             pulumi.Int(300),
	// 	Statistic:          pulumi.String("Average"),
	// 	Threshold:          pulumi.Float64(50),
	// 	AlarmDescription:   pulumi.String("RDS connection count is too high"),
	// 	Dimensions: pulumi.StringMap{
	// 		"DBInstanceIdentifier": rdsInstance.ID(),
	// 	},
	// 	Tags: m.tags,
	// }, pulumi.Provider(provider))
	// if err != nil {
	// 	return nil, err
	// }

	return rdsInstance, nil
}

func (m *MultiRegionInfrastructure) CreateCloudTrailBucket(kmsKey *kms.Key) (*s3.Bucket, error) {
	// Create dedicated S3 bucket for CloudTrail logs
	bucket, err := newS3Bucket(m.ctx, fmt.Sprintf("%s-cloudtrail-logs", m.config.Environment), &s3.BucketArgs{
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// Configure bucket encryption
	_, err = newS3BucketEncryption(m.ctx, fmt.Sprintf("%s-cloudtrail-bucket-encryption", m.config.Environment), &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: bucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					KmsMasterKeyId: kmsKey.Arn,
					SseAlgorithm:   pulumi.String("aws:kms"),
				},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Block public access
	_, err = newS3BucketPAB(m.ctx, fmt.Sprintf("%s-cloudtrail-bucket-pab", m.config.Environment), &s3.BucketPublicAccessBlockArgs{
		Bucket:                bucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})
	if err != nil {
		return nil, err
	}

	// S3 bucket policy for CloudTrail
	_, err = newS3BucketPolicy(m.ctx, fmt.Sprintf("%s-cloudtrail-bucket-policy", m.config.Environment), &s3.BucketPolicyArgs{
		Bucket: bucket.ID(),
		Policy: pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:PutObject",
					"Resource": "%s/*",
					"Condition": {
						"StringEquals": {
							"s3:x-amz-acl": "bucket-owner-full-control"
						}
					}
				},
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": "s3:GetBucketAcl",
					"Resource": "%s"
				}
			]
		}`, bucket.Arn, bucket.Arn),
	})
	if err != nil {
		return nil, err
	}

	return bucket, nil
}

func (m *MultiRegionInfrastructure) CreateCloudTrail(bucket *s3.Bucket) error {
	// CloudTrail for auditing
	_, err := newCloudTrailTrail(m.ctx, fmt.Sprintf("%s-cloudtrail", m.config.Environment), &cloudtrail.TrailArgs{
		S3BucketName:               bucket.Bucket,
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(true),
		EnableLogFileValidation:    pulumi.Bool(true),
		Tags:                       m.tags,
	})

	return err
}

func (m *MultiRegionInfrastructure) exportOutputs(bucket *s3.Bucket, cloudtrailBucket *s3.Bucket, distribution *cloudfront.Distribution, roles map[string]*iam.Role, regionalResources map[string]map[string]pulumi.Output) {
	// Global resources
	m.ctx.Export("s3BucketName", bucket.Bucket)
	m.ctx.Export("s3BucketArn", bucket.Arn)
	// LocalStack: CloudTrail bucket exports commented out since CloudTrail is not supported
	// m.ctx.Export("cloudtrailBucketName", cloudtrailBucket.Bucket)
	// m.ctx.Export("cloudtrailBucketArn", cloudtrailBucket.Arn)
	m.ctx.Export("cloudfrontDistributionId", distribution.ID())
	m.ctx.Export("cloudfrontDomainName", distribution.DomainName)
	m.ctx.Export("environment", pulumi.String(m.config.Environment))
	m.ctx.Export("regions", pulumi.ToStringArray(m.config.Regions))

	// IAM resources
	m.ctx.Export("ec2RoleArn", roles["ec2"].Arn)
	m.ctx.Export("rdsMonitoringRoleArn", roles["rds"].Arn)

	// Regional resources
	for region, resources := range regionalResources {
		for resourceName, resourceOutput := range resources {
			m.ctx.Export(fmt.Sprintf("%s_%s", region, resourceName), resourceOutput)
		}
	}
}
```

### pulumi_factories.go

```go
package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
)

// These variables exist to make error branches testable.
// In production they point to real Pulumi constructors/invokes; unit tests can
// temporarily override them to force specific calls to return errors.

var (
	newAWSProvider         = aws.NewProvider
	getAvailabilityZones   = aws.GetAvailabilityZones
	newVpc                 = ec2.NewVpc
	newSubnet              = ec2.NewSubnet
	newInternetGateway     = ec2.NewInternetGateway
	newRouteTable          = ec2.NewRouteTable
	newRouteTableAssoc     = ec2.NewRouteTableAssociation
	newSecurityGroup       = ec2.NewSecurityGroup
	newKMSKey              = kms.NewKey
	newKMSAlias            = kms.NewAlias
	newS3Bucket            = s3.NewBucket
	newS3BucketEncryption  = s3.NewBucketServerSideEncryptionConfigurationV2
	newS3BucketVersioning  = s3.NewBucketVersioningV2
	newS3BucketPAB         = s3.NewBucketPublicAccessBlock
	newS3BucketLogging     = s3.NewBucketLoggingV2
	newS3BucketPolicy      = s3.NewBucketPolicy
	newCloudFrontDist      = cloudfront.NewDistribution
	newIAMRole             = iam.NewRole
	newIAMRolePolicy       = iam.NewRolePolicy
	newIAMInstanceProfile  = iam.NewInstanceProfile
	newRDSSubnetGroup      = rds.NewSubnetGroup
	newRDSInstance         = rds.NewInstance
	newCloudWatchLogGroup  = cloudwatch.NewLogGroup
	newCloudWatchDashboard = cloudwatch.NewDashboard
	newCloudTrailTrail     = cloudtrail.NewTrail
)
```

### tap_stack.go

```go
package main

import (
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// pulumiRun exists to make main() testable. Unit tests can override this to avoid
// actually running a Pulumi program.
var pulumiRun = pulumi.Run

// tapStack contains the Pulumi program logic for this stack.
// It's split out from main() so unit tests can run it via pulumi.RunErr + mocks.
func tapStack(ctx *pulumi.Context) error {
	env := os.Getenv("ENVIRONMENT_SUFFIX")
	if env == "" {
		env = "dev"
	}

	repo := os.Getenv("REPOSITORY")
	if repo == "" {
		repo = "unknown"
	}

	author := os.Getenv("COMMIT_AUTHOR")
	if author == "" {
		author = "unknown"
	}

	tags := map[string]string{
		"Environment": env,
		"Repository":  repo,
		"Author":      author,
	}

	config := InfrastructureConfig{
		Environment:        env,
		Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
		InstanceType:       "t3.medium",
		DBInstanceClass:    "db.t3.micro",
		DBAllocatedStorage: 20,
		BackupRetention:    7,
		MultiAZ:            true,
		EnableInsights:     true,
		Tags:               tags,
	}

	infrastructure := NewMultiRegionInfrastructure(ctx, config)
	return infrastructure.Deploy()
}

func main() {
	pulumiRun(tapStack)
}
```

## Test Files

