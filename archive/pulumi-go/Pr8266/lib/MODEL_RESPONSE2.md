You're right! There are import and dependency issues. Here's the corrected version with proper imports and fixed build errors:

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/configservice"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type InfrastructureConfig struct {
	Environment        string
	Regions           []string
	InstanceType      string
	DBInstanceClass   string
	DBAllocatedStorage int
	BackupRetention   int
	MultiAZ           bool
	EnableInsights    bool
}

type MultiRegionInfrastructure struct {
	config  InfrastructureConfig
	ctx     *pulumi.Context
	tags    pulumi.StringMap
}

func NewMultiRegionInfrastructure(ctx *pulumi.Context, config InfrastructureConfig) *MultiRegionInfrastructure {
	return &MultiRegionInfrastructure{
		config: config,
		ctx:    ctx,
		tags: pulumi.StringMap{
			"environment": pulumi.String(config.Environment),
			"purpose":     pulumi.String("multi-region-infrastructure"),
			"managed-by":  pulumi.String("pulumi"),
		},
	}
}

func (m *MultiRegionInfrastructure) Deploy() error {
	// Create KMS key for encryption
	kmsKey, err := m.createKMSKey()
	if err != nil {
		return err
	}

	// Create S3 bucket for static files
	bucket, err := m.createS3Bucket(kmsKey)
	if err != nil {
		return err
	}

	// Create CloudFront distribution
	distribution, err := m.createCloudFrontDistribution(bucket)
	if err != nil {
		return err
	}

	// Create IAM roles and policies
	roles, err := m.createIAMResources()
	if err != nil {
		return err
	}

	// Deploy resources across regions
	for _, region := range m.config.Regions {
		if err := m.deployRegionalResources(region, kmsKey, roles); err != nil {
			return err
		}
	}

	// Create AWS Config for compliance
	if err := m.createAWSConfig(bucket); err != nil {
		return err
	}

	// Create CloudTrail for auditing
	if err := m.createCloudTrail(bucket); err != nil {
		return err
	}

	// Export outputs
	m.exportOutputs(bucket, distribution)

	return nil
}

func (m *MultiRegionInfrastructure) createKMSKey() (*kms.Key, error) {
	key, err := kms.NewKey(m.ctx, fmt.Sprintf("%s-encryption-key", m.config.Environment), &kms.KeyArgs{
		Description: pulumi.String("Multi-region infrastructure encryption key"),
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "arn:aws:iam::*:root"},
					"Action": "kms:*",
					"Resource": "*"
				}
			]
		}`),
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	_, err = kms.NewAlias(m.ctx, fmt.Sprintf("%s-encryption-key-alias", m.config.Environment), &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/%s-encryption", m.config.Environment)),
		TargetKeyId: key.KeyId,
	})
	if err != nil {
		return nil, err
	}

	return key, nil
}

func (m *MultiRegionInfrastructure) createS3Bucket(kmsKey *kms.Key) (*s3.Bucket, error) {
	bucket, err := s3.NewBucket(m.ctx, fmt.Sprintf("%s-static-assets", m.config.Environment), &s3.BucketArgs{
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	// Configure bucket encryption
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(m.ctx, fmt.Sprintf("%s-bucket-encryption", m.config.Environment), &s3.BucketServerSideEncryptionConfigurationV2Args{
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
	_, err = s3.NewBucketVersioningV2(m.ctx, fmt.Sprintf("%s-bucket-versioning", m.config.Environment), &s3.BucketVersioningV2Args{
		Bucket: bucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Block public access
	_, err = s3.NewBucketPublicAccessBlock(m.ctx, fmt.Sprintf("%s-bucket-pab", m.config.Environment), &s3.BucketPublicAccessBlockArgs{
		Bucket:                bucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	})

	return bucket, err
}

func (m *MultiRegionInfrastructure) createCloudFrontDistribution(bucket *s3.Bucket) (*cloudfront.Distribution, error) {
	// Create Origin Access Control
	oac, err := cloudfront.NewOriginAccessControl(m.ctx, fmt.Sprintf("%s-oac", m.config.Environment), &cloudfront.OriginAccessControlArgs{
		Name:                          pulumi.String(fmt.Sprintf("%s-oac", m.config.Environment)),
		Description:                   pulumi.String("Origin Access Control for S3 bucket"),
		OriginAccessControlOriginType: pulumi.String("s3"),
		SigningBehavior:               pulumi.String("always"),
		SigningProtocol:               pulumi.String("sigv4"),
	})
	if err != nil {
		return nil, err
	}

	// Create CloudFront distribution
	distribution, err := cloudfront.NewDistribution(m.ctx, fmt.Sprintf("%s-distribution", m.config.Environment), &cloudfront.DistributionArgs{
		Origins: cloudfront.DistributionOriginArray{
			&cloudfront.DistributionOriginArgs{
				DomainName:            bucket.BucketDomainName,
				OriginId:              pulumi.String("S3-" + m.config.Environment),
				OriginAccessControlId: oac.ID(),
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
	_, err = s3.NewBucketPolicy(m.ctx, fmt.Sprintf("%s-bucket-policy", m.config.Environment), &s3.BucketPolicyArgs{
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

func (m *MultiRegionInfrastructure) createIAMResources() (map[string]*iam.Role, error) {
	roles := make(map[string]*iam.Role)

	// EC2 Instance Role
	ec2Role, err := iam.NewRole(m.ctx, fmt.Sprintf("%s-ec2-role", m.config.Environment), &iam.RoleArgs{
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
	_, err = iam.NewRolePolicy(m.ctx, fmt.Sprintf("%s-ec2-policy", m.config.Environment), &iam.RolePolicyArgs{
		Role: ec2Role.ID(),
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
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
		}`),
	})
	if err != nil {
		return nil, err
	}

	// Instance Profile
	_, err = iam.NewInstanceProfile(m.ctx, fmt.Sprintf("%s-ec2-profile", m.config.Environment), &iam.InstanceProfileArgs{
		Role: ec2Role.Name,
		Tags: m.tags,
	})
	if err != nil {
		return nil, err
	}

	roles["ec2"] = ec2Role

	// RDS Enhanced Monitoring Role
	rdsRole, err := iam.NewRole(m.ctx, fmt.Sprintf("%s-rds-monitoring-role", m.config.Environment), &iam.RoleArgs{
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

func (m *MultiRegionInfrastructure) deployRegionalResources(region string, kmsKey *kms.Key, roles map[string]*iam.Role) error {
	provider, err := aws.NewProvider(m.ctx, fmt.Sprintf("provider-%s", region), &aws.ProviderArgs{
		Region: pulumi.String(region),
	})
	if err != nil {
		return err
	}

	// Create VPC
	vpc, err := ec2.NewVpc(m.ctx, fmt.Sprintf("%s-vpc-%s", m.config.Environment, region), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-vpc-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("networking"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return err
	}

	// Create subnets
	subnets, err := m.createSubnets(region, vpc, provider)
	if err != nil {
		return err
	}

	// Create security groups
	securityGroups, err := m.createSecurityGroups(region, vpc, provider)
	if err != nil {
		return err
	}

	// Create RDS subnet group
	dbSubnetGroup, err := rds.NewSubnetGroup(m.ctx, fmt.Sprintf("%s-db-subnet-group-%s", m.config.Environment, region), &rds.SubnetGroupArgs{
		SubnetIds: pulumi.StringArray{subnets["private1"].ID(), subnets["private2"].ID()},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-db-subnet-group-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("database"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return err
	}

	// Create RDS instance
	_, err = m.createRDSInstance(region, dbSubnetGroup, securityGroups["db"], kmsKey, roles["rds"], provider)
	if err != nil {
		return err
	}

	// Create CloudWatch Log Groups
	_, err = cloudwatch.NewLogGroup(m.ctx, fmt.Sprintf("%s-app-logs-%s", m.config.Environment, region), &cloudwatch.LogGroupArgs{
		RetentionInDays: pulumi.Int(30),
		KmsKeyId:        kmsKey.Arn,
		Tags:            m.tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return err
	}

	return nil
}

func (m *MultiRegionInfrastructure) createSubnets(region string, vpc *ec2.Vpc, provider *aws.Provider) (map[string]*ec2.Subnet, error) {
	subnets := make(map[string]*ec2.Subnet)

	// Get availability zones
	azs, err := aws.GetAvailabilityZones(m.ctx, &aws.GetAvailabilityZonesArgs{
		State: pulumi.StringRef("available"),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Public subnets
	for i, az := range azs.Names[:2] {
		subnet, err := ec2.NewSubnet(m.ctx, fmt.Sprintf("%s-public-%d-%s", m.config.Environment, i+1, region), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone:    pulumi.String(az),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-public-%d-%s", m.config.Environment, i+1, region)),
				"environment": pulumi.String(m.config.Environment),
				"purpose":     pulumi.String("public-networking"),
				"Type":        pulumi.String("Public"),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		subnets[fmt.Sprintf("public%d", i+1)] = subnet
	}

	// Private subnets
	for i, az := range azs.Names[:2] {
		subnet, err := ec2.NewSubnet(m.ctx, fmt.Sprintf("%s-private-%d-%s", m.config.Environment, i+1, region), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
			AvailabilityZone: pulumi.String(az),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-private-%d-%s", m.config.Environment, i+1, region)),
				"environment": pulumi.String(m.config.Environment),
				"purpose":     pulumi.String("private-networking"),
				"Type":        pulumi.String("Private"),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		subnets[fmt.Sprintf("private%d", i+1)] = subnet
	}

	// Internet Gateway
	igw, err := ec2.NewInternetGateway(m.ctx, fmt.Sprintf("%s-igw-%s", m.config.Environment, region), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-igw-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("internet-access"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Public route table
	publicRT, err := ec2.NewRouteTable(m.ctx, fmt.Sprintf("%s-public-rt-%s", m.config.Environment, region), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-public-rt-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("public-routing"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Associate public subnets with public route table
	for i := 1; i <= 2; i++ {
		_, err = ec2.NewRouteTableAssociation(m.ctx, fmt.Sprintf("%s-public-%d-rta-%s", m.config.Environment, i, region), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnets[fmt.Sprintf("public%d", i)].ID(),
			RouteTableId: publicRT.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	return subnets, nil
}

func (m *MultiRegionInfrastructure) createSecurityGroups(region string, vpc *ec2.Vpc, provider *aws.Provider) (map[string]*ec2.SecurityGroup, error) {
	securityGroups := make(map[string]*ec2.SecurityGroup)

	// Database security group
	dbSG, err := ec2.NewSecurityGroup(m.ctx, fmt.Sprintf("%s-db-sg-%s", m.config.Environment, region), &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Database security group"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(3306),
				ToPort:     pulumi.Int(3306),
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
			"Name":        pulumi.String(fmt.Sprintf("%s-db-sg-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("database-security"),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	securityGroups["db"] = dbSG

	return securityGroups, nil
}

func (m *MultiRegionInfrastructure) createRDSInstance(region string, subnetGroup *rds.SubnetGroup, securityGroup *ec2.SecurityGroup, kmsKey *kms.Key, monitoringRole *iam.Role, provider *aws.Provider) (*rds.Instance, error) {
	return rds.NewInstance(m.ctx, fmt.Sprintf("%s-database-%s", m.config.Environment, region), &rds.InstanceArgs{
		AllocatedStorage:                   pulumi.Int(m.config.DBAllocatedStorage),
		StorageType:                        pulumi.String("gp3"),
		Engine:                             pulumi.String("mysql"),
		EngineVersion:                      pulumi.String("8.0"),
		InstanceClass:                      pulumi.String(m.config.DBInstanceClass),
		DbName:                             pulumi.String(fmt.Sprintf("%sdb", m.config.Environment)),
		Username:                           pulumi.String("admin"),
		Password:                           pulumi.String("changeme123!"), // Use AWS Secrets Manager in production
		VpcSecurityGroupIds:                pulumi.StringArray{securityGroup.ID()},
		DbSubnetGroupName:                  subnetGroup.Name,
		BackupRetentionPeriod:              pulumi.Int(m.config.BackupRetention),
		BackupWindow:                       pulumi.String("03:00-04:00"),
		MaintenanceWindow:                  pulumi.String("sun:04:00-sun:05:00"),
		MultiAz:                            pulumi.Bool(m.config.MultiAZ),
		StorageEncrypted:                   pulumi.Bool(true),
		KmsKeyId:                           kmsKey.Arn,
		MonitoringInterval:                 pulumi.Int(60),
		MonitoringRoleArn:                  monitoringRole.Arn,
		PerformanceInsightsEnabled:         pulumi.Bool(m.config.EnableInsights),
		PerformanceInsightsKmsKeyId:        kmsKey.Arn,
		PerformanceInsightsRetentionPeriod: pulumi.Int(7),
		AutoMinorVersionUpgrade:            pulumi.Bool(true),
		DeletionProtection:                 pulumi.Bool(true),
		SkipFinalSnapshot:                  pulumi.Bool(false),
		FinalSnapshotIdentifier:            pulumi.String(fmt.Sprintf("%s-final-snapshot-%s", m.config.Environment, region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("%s-database-%s", m.config.Environment, region)),
			"environment": pulumi.String(m.config.Environment),
			"purpose":     pulumi.String("primary-database"),
		},
	}, pulumi.Provider(provider))
}

func (m *MultiRegionInfrastructure) createAWSConfig(bucket *s3.Bucket) error {
	// Configuration Recorder Role
	configRole, err := iam.NewRole(m.ctx, fmt.Sprintf("%s-config-role", m.config.Environment), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "config.amazonaws.com"
					}
				}
			]
		}`),
		ManagedPolicyArns: pulumi.StringArray{
			pulumi.String("arn:aws:iam::aws:policy/service-role/ConfigRole"),
		},
		Tags: m.tags,
	})
	if err != nil {
		return err
	}

	// S3 bucket policy for Config
	_, err = s3.NewBucketPolicy(m.ctx, fmt.Sprintf("%s-config-bucket-policy", m.config.Environment), &s3.BucketPolicyArgs{
		Bucket: bucket.ID(),
		Policy: pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "config.amazonaws.com"
					},
					"Action": "s3:GetBucketAcl",
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "config.amazonaws.com"
					},
					"Action": "s3:PutObject",
					"Resource": "%s/config/*",
					"Condition": {
						"StringEquals": {
							"s3:x-amz-acl": "bucket-owner-full-control"
						}
					}
				}
			]
		}`, bucket.Arn, bucket.Arn),
	})
	if err != nil {
		return err
	}

	// Configuration Recorder
	_, err = configservice.NewConfigurationRecorder(m.ctx, fmt.Sprintf("%s-config-recorder", m.config.Environment), &configservice.ConfigurationRecorderArgs{
		RoleArn: configRole.Arn,
		RecordingGroup: &configservice.ConfigurationRecorderRecordingGroupArgs{
			AllSupported:               pulumi.Bool(true),
			IncludeGlobalResourceTypes: pulumi.Bool(true),
		},
	})
	if err != nil {
		return err
	}

	// Delivery Channel
	_, err = configservice.NewDeliveryChannel(m.ctx, fmt.Sprintf("%s-config-delivery", m.config.Environment), &configservice.DeliveryChannelArgs{
		S3BucketName: bucket.Bucket,
		S3KeyPrefix:  pulumi.String("config/"),
	})

	return err
}

func (m *MultiRegionInfrastructure) createCloudTrail(bucket *s3.Bucket) error {
	// CloudTrail for auditing
	_, err := cloudtrail.NewTrail(m.ctx, fmt.Sprintf("%s-cloudtrail", m.config.Environment), &cloudtrail.TrailArgs{
		S3BucketName:               bucket.Bucket,
		S3KeyPrefix:                pulumi.String("cloudtrail/"),
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(true),
		EnableLogFileValidation:    pulumi.Bool(true),
		Tags:                       m.tags,
	})

	return err
}

func (m *MultiRegionInfrastructure) exportOutputs(bucket *s3.Bucket, distribution *cloudfront.Distribution) {
	m.ctx.Export("s3BucketName", bucket.Bucket)
	m.ctx.Export("s3BucketArn", bucket.Arn)
	m.ctx.Export("cloudfrontDistributionId", distribution.ID())
	m.ctx.Export("cloudfrontDomainName", distribution.DomainName)
	m.ctx.Export("environment", pulumi.String(m.config.Environment))
	m.ctx.Export("regions", pulumi.ToStringArray(m.config.Regions))
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		config := InfrastructureConfig{
			Environment:        "production",
			Regions:           []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:      "t3.medium",
			DBInstanceClass:   "db.t3.micro",
			DBAllocatedStorage: 20,
			BackupRetention:   7,
			MultiAZ:           true,
			EnableInsights:    true,
		}

		infrastructure := NewMultiRegionInfrastructure(ctx, config)
		return infrastructure.Deploy()
	})
}
```

## Required go.mod file:

```go
module multi-region-infra

go 1.21

require (
	github.com/pulumi/pulumi-aws/sdk/v6 v6.15.0
	github.com/pulumi/pulumi/sdk/v3 v3.96.1
)
```
