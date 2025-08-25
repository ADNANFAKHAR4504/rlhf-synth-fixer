```yaml
name: tap-stack
runtime: go
description: Multi-region AWS infrastructure with CloudFront, ALB, EC2, RDS, and DynamoDB Global Tables

config:
  projectName:
    type: string
    default: "tap"
  environment:
    type: string
    default: "prod"
  notificationEmail:
    type: string
    default: "admin@example.com"
  vpcCidr:
    type: string
    default: "10.0.0.0/16"
  asgMinSize:
    type: number
    default: 2
  asgMaxSize:
    type: number
    default: 10
  dbInstanceClass:
    type: string
    default: "db.t3.micro"
```

```go
module tap-stack

go 1.21

require (
	github.com/pulumi/pulumi-aws/sdk/v6 v6.22.2
	github.com/pulumi/pulumi/sdk/v3 v3.105.0
)
```

```go
package lib

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/logs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ssm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

type RegionalInfra struct {
	VpcId           pulumi.StringOutput
	PublicSubnetIds pulumi.StringArrayOutput
	PrivateSubnetIds pulumi.StringArrayOutput
	AlbDnsName      pulumi.StringOutput
	DataBucketName  pulumi.StringOutput
	LogBucketName   pulumi.StringOutput
	RdsEndpoint     pulumi.StringOutput
}

func CreateTapStack(ctx *pulumi.Context) error {
	cfg := config.New(ctx, "")
	projectName := cfg.Get("projectName")
	environment := cfg.Get("environment")
	notificationEmail := cfg.Get("notificationEmail")
	vpcCidr := cfg.Get("vpcCidr")
	asgMinSize := cfg.GetFloat64("asgMinSize")
	asgMaxSize := cfg.GetFloat64("asgMaxSize")
	dbInstanceClass := cfg.Get("dbInstanceClass")

	tags := pulumi.StringMap{
		"Environment": pulumi.String(environment),
		"Project":     pulumi.String(projectName),
	}

	// Get current caller identity
	current, err := aws.GetCallerIdentity(ctx, nil, nil)
	if err != nil {
		return err
	}

	// Create providers for both regions
	usEast1Provider, err := aws.NewProvider(ctx, "us-east-1", &aws.ProviderArgs{
		Region: pulumi.String("us-east-1"),
	})
	if err != nil {
		return err
	}

	euWest1Provider, err := aws.NewProvider(ctx, "eu-west-1", &aws.ProviderArgs{
		Region: pulumi.String("eu-west-1"),
	})
	if err != nil {
		return err
	}

	// Create DynamoDB Global Table
	dynamoTable, err := dynamodb.NewTable(ctx, "global-table", &dynamodb.TableArgs{
		Name:        pulumi.Sprintf("%s-%s-global", projectName, environment),
		BillingMode: pulumi.String("PAY_PER_REQUEST"),
		Attributes: dynamodb.TableAttributeArray{
			&dynamodb.TableAttributeArgs{
				Name: pulumi.String("id"),
				Type: pulumi.String("S"),
			},
		},
		HashKey: pulumi.String("id"),
		Replicas: dynamodb.TableReplicaArray{
			&dynamodb.TableReplicaArgs{
				RegionName:           pulumi.String("us-east-1"),
				PointInTimeRecovery:  pulumi.Bool(true),
			},
			&dynamodb.TableReplicaArgs{
				RegionName:           pulumi.String("eu-west-1"),
				PointInTimeRecovery:  pulumi.Bool(true),
			},
		},
		StreamEnabled:   pulumi.Bool(true),
		StreamViewType:  pulumi.String("NEW_AND_OLD_IMAGES"),
		Tags:            tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create regional infrastructure
	usEast1Infra, err := createRegionalInfra(ctx, "us-east-1", usEast1Provider, projectName, environment, vpcCidr, asgMinSize, asgMaxSize, dbInstanceClass, tags, current.AccountId)
	if err != nil {
		return err
	}

	euWest1Infra, err := createRegionalInfra(ctx, "eu-west-1", euWest1Provider, projectName, environment, vpcCidr, asgMinSize, asgMaxSize, dbInstanceClass, tags, current.AccountId)
	if err != nil {
		return err
	}

	// Create S3 cross-region replication
	err = createS3Replication(ctx, usEast1Provider, euWest1Provider, usEast1Infra.DataBucketName, euWest1Infra.DataBucketName, projectName, environment, tags, current.AccountId)
	if err != nil {
		return err
	}

	// Create CloudFront distribution (must use us-east-1 for ACM cert)
	cloudfrontDomain, err := createCloudFront(ctx, usEast1Provider, usEast1Infra.DataBucketName, projectName, environment, tags)
	if err != nil {
		return err
	}

	// Create SNS topic and CloudTrail
	err = createMonitoring(ctx, usEast1Provider, euWest1Provider, projectName, environment, notificationEmail, tags, current.AccountId)
	if err != nil {
		return err
	}

	// Export outputs
	ctx.Export("usEast1AlbDnsName", usEast1Infra.AlbDnsName)
	ctx.Export("euWest1AlbDnsName", euWest1Infra.AlbDnsName)
	ctx.Export("cloudfrontDomain", cloudfrontDomain)
	ctx.Export("usEast1DataBucket", usEast1Infra.DataBucketName)
	ctx.Export("usEast1LogBucket", usEast1Infra.LogBucketName)
	ctx.Export("euWest1DataBucket", euWest1Infra.DataBucketName)
	ctx.Export("euWest1LogBucket", euWest1Infra.LogBucketName)
	ctx.Export("dynamoTableName", dynamoTable.Name)
	ctx.Export("usEast1RdsEndpoint", usEast1Infra.RdsEndpoint)
	ctx.Export("euWest1RdsEndpoint", euWest1Infra.RdsEndpoint)
	ctx.Export("usEast1VpcId", usEast1Infra.VpcId)
	ctx.Export("euWest1VpcId", euWest1Infra.VpcId)

	return nil
}

func createRegionalInfra(ctx *pulumi.Context, region string, provider pulumi.ProviderResource, projectName, environment, vpcCidr string, asgMinSize, asgMaxSize float64, dbInstanceClass string, tags pulumi.StringMap, accountId string) (*RegionalInfra, error) {
	// Get AZs for the region
	azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{
		State: pulumi.StringRef("available"),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create VPC
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("vpc-%s", region), &ec2.VpcArgs{
		CidrBlock:          pulumi.String(vpcCidr),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags:               tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("igw-%s", region), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags:  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create public subnets
	var publicSubnetIds []pulumi.StringOutput
	for i := 0; i < 2; i++ {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%s-%d", region, i), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i+1),
			AvailabilityZone:    pulumi.String(azs.Names[i]),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags:                tags,
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		publicSubnetIds = append(publicSubnetIds, subnet.ID())
	}

	// Create NAT Gateway
	eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%s", region), &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags:   tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gw-%s", region), &ec2.NatGatewayArgs{
		AllocationId: eip.ID(),
		SubnetId:     publicSubnetIds[0],
		Tags:         tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create private subnets
	var privateSubnetIds []pulumi.StringOutput
	for i := 0; i < 2; i++ {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%s-%d", region, i), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+10),
			AvailabilityZone: pulumi.String(azs.Names[i]),
			Tags:             tags,
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		privateSubnetIds = append(privateSubnetIds, subnet.ID())
	}

	// Create route tables
	publicRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", region), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	privateRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%s", region), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock:    pulumi.String("0.0.0.0/0"),
				NatGatewayId: natGw.ID(),
			},
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Associate subnets with route tables
	for i, subnetId := range publicSubnetIds {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%s-%d", region, i), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnetId,
			RouteTableId: publicRt.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	for i, subnetId := range privateSubnetIds {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%s-%d", region, i), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnetId,
			RouteTableId: privateRt.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	// Create security groups
	albSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId: vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
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
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	ec2Sg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ec2-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId: vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(80),
				ToPort:         pulumi.Int(80),
				SecurityGroups: pulumi.StringArray{albSg.ID()},
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
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	rdsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId: vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(3306),
				ToPort:         pulumi.Int(3306),
				SecurityGroups: pulumi.StringArray{ec2Sg.ID()},
			},
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Get latest Amazon Linux 2 AMI
	amiResult, err := ssm.LookupParameter(ctx, &ssm.LookupParameterArgs{
		Name: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create IAM role for EC2
	ec2Role, err := iam.NewRole(ctx, fmt.Sprintf("ec2-role-%s", region), &iam.RoleArgs{
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
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	ec2Policy, err := iam.NewRolePolicy(ctx, fmt.Sprintf("ec2-policy-%s", region), &iam.RolePolicyArgs{
		Role: ec2Role.ID(),
		Policy: pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"ssm:GetParameter",
						"ssm:GetParameters",
						"ssm:GetParametersByPath"
					],
					"Resource": "arn:aws:ssm:%s:%s:parameter/%s/%s/*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"secretsmanager:GetSecretValue"
					],
					"Resource": "arn:aws:secretsmanager:%s:%s:secret:%s-%s-*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"dynamodb:GetItem",
						"dynamodb:PutItem",
						"dynamodb:UpdateItem",
						"dynamodb:DeleteItem",
						"dynamodb:Query",
						"dynamodb:Scan"
					],
					"Resource": "arn:aws:dynamodb:*:%s:table/%s-%s-global"
				}
			]
		}`, region, accountId, projectName, environment, region, accountId, projectName, environment, accountId, projectName, environment),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	instanceProfile, err := iam.NewInstanceProfile(ctx, fmt.Sprintf("ec2-profile-%s", region), &iam.InstanceProfileArgs{
		Role: ec2Role.Name,
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create launch template
	launchTemplate, err := ec2.NewLaunchTemplate(ctx, fmt.Sprintf("launch-template-%s", region), &ec2.LaunchTemplateArgs{
		ImageId:      pulumi.String(amiResult.Value),
		InstanceType: pulumi.String("t3.micro"),
		IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
			Name: instanceProfile.Name,
		},
		VpcSecurityGroupIds: pulumi.StringArray{ec2Sg.ID()},
		UserData: pulumi.String(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo '<h1>Healthy</h1>' > /var/www/html/healthz
echo '<h1>Hello from ` + region + `</h1>' > /var/www/html/index.html
systemctl restart httpd`),
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create ALB
	alb, err := elbv2.NewLoadBalancer(ctx, fmt.Sprintf("alb-%s", region), &elbv2.LoadBalancerArgs{
		LoadBalancerType: pulumi.String("application"),
		Subnets:          pulumi.StringArray(publicSubnetIds),
		SecurityGroups:   pulumi.StringArray{albSg.ID()},
		Tags:             tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create ACM certificate for ALB
	cert, err := acm.NewCertificate(ctx, fmt.Sprintf("alb-cert-%s", region), &acm.CertificateArgs{
		DomainName:       pulumi.Sprintf("%s.%s.example.com", projectName, region),
		ValidationMethod: pulumi.String("DNS"),
		Tags:             tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create target group
	targetGroup, err := elbv2.NewTargetGroup(ctx, fmt.Sprintf("tg-%s", region), &elbv2.TargetGroupArgs{
		Port:     pulumi.Int(80),
		Protocol: pulumi.String("HTTP"),
		VpcId:    vpc.ID(),
		HealthCheck: &elbv2.TargetGroupHealthCheckArgs{
			Path:               pulumi.String("/healthz"),
			HealthyThreshold:   pulumi.Int(2),
			UnhealthyThreshold: pulumi.Int(2),
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create ALB listener
	_, err = elbv2.NewListener(ctx, fmt.Sprintf("alb-listener-%s", region), &elbv2.ListenerArgs{
		LoadBalancerArn: alb.Arn,
		Port:            pulumi.String("443"),
		Protocol:        pulumi.String("HTTPS"),
		SslPolicy:       pulumi.String("ELBSecurityPolicy-TLS-1-2-2017-01"),
		CertificateArn:  cert.Arn,
		DefaultActions: elbv2.ListenerDefaultActionArray{
			&elbv2.ListenerDefaultActionArgs{
				Type:           pulumi.String("forward"),
				TargetGroupArn: targetGroup.Arn,
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create Auto Scaling Group
	asg, err := autoscaling.NewGroup(ctx, fmt.Sprintf("asg-%s", region), &autoscaling.GroupArgs{
		VpcZoneIdentifiers: pulumi.StringArray(privateSubnetIds),
		TargetGroupArns:    pulumi.StringArray{targetGroup.Arn},
		HealthCheckType:    pulumi.String("ELB"),
		MinSize:            pulumi.Int(int(asgMinSize)),
		MaxSize:            pulumi.Int(int(asgMaxSize)),
		DesiredCapacity:    pulumi.Int(int(asgMinSize)),
		LaunchTemplate: &autoscaling.GroupLaunchTemplateArgs{
			Id:      launchTemplate.ID(),
			Version: pulumi.String("$Latest"),
		},
		Tags: autoscaling.GroupTagArray{
			&autoscaling.GroupTagArgs{
				Key:               pulumi.String("Environment"),
				Value:             pulumi.String(environment),
				PropagateAtLaunch: pulumi.Bool(true),
			},
			&autoscaling.GroupTagArgs{
				Key:               pulumi.String("Project"),
				Value:             pulumi.String(projectName),
				PropagateAtLaunch: pulumi.Bool(true),
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create scaling policy
	_, err = autoscaling.NewPolicy(ctx, fmt.Sprintf("scale-policy-%s", region), &autoscaling.PolicyArgs{
		AutoscalingGroupName: asg.Name,
		AdjustmentType:       pulumi.String("ChangeInCapacity"),
		ScalingAdjustment:    pulumi.Int(1),
		Cooldown:             pulumi.Int(300),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create RDS subnet group
	rdsSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("rds-subnet-group-%s", region), &rds.SubnetGroupArgs{
		SubnetIds: pulumi.StringArray(privateSubnetIds),
		Tags:      tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create RDS secret
	rdsSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("rds-secret-%s", region), &secretsmanager.SecretArgs{
		GenerateSecretString: &secretsmanager.SecretGenerateSecretStringArgs{
			SecretStringTemplate: pulumi.String(`{"username": "admin"}`),
			GenerateStringKey:    pulumi.String("password"),
			PasswordLength:       pulumi.Int(32),
			ExcludeCharacters:    pulumi.String(`"@/\`),
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create RDS instance
	rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("rds-%s", region), &rds.InstanceArgs{
		AllocatedStorage:      pulumi.Int(20),
		StorageType:           pulumi.String("gp2"),
		Engine:                pulumi.String("mysql"),
		EngineVersion:         pulumi.String("8.0"),
		InstanceClass:         pulumi.String(dbInstanceClass),
		DbName:                pulumi.String("appdb"),
		Username:              pulumi.String("admin"),
		ManageUserPassword:    pulumi.Bool(true),
		DbSubnetGroupName:     rdsSubnetGroup.Name,
		VpcSecurityGroupIds:   pulumi.StringArray{rdsSg.ID()},
		BackupRetentionPeriod: pulumi.Int(7),
		MultiAz:               pulumi.Bool(true),
		StorageEncrypted:      pulumi.Bool(true),
		SkipFinalSnapshot:     pulumi.Bool(true),
		Tags:                  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create S3 buckets
	dataBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("data-bucket-%s", region), &s3.BucketV2Args{
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	logBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("log-bucket-%s", region), &s3.BucketV2Args{
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Configure S3 bucket encryption
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("data-bucket-encryption-%s", region), &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: dataBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("aws:kms"),
				},
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Block public access
	_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("data-bucket-pab-%s", region), &s3.BucketPublicAccessBlockArgs{
		Bucket:                dataBucket.ID(),
		BlockPublicAcls:       pulumi.Bool(true),
		BlockPublicPolicy:     pulumi.Bool(true),
		IgnorePublicAcls:      pulumi.Bool(true),
		RestrictPublicBuckets: pulumi.Bool(true),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// S3 bucket policy requiring encryption
	_, err = s3.NewBucketPolicy(ctx, fmt.Sprintf("data-bucket-policy-%s", region), &s3.BucketPolicyArgs{
		Bucket: dataBucket.ID(),
		Policy: pulumi.All(dataBucket.Arn, dataBucket.Arn).ApplyT(func(args []interface{}) (string, error) {
			bucketArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Deny",
						"Principal": "*",
						"Action": "s3:PutObject",
						"Resource": bucketArn + "/*",
						"Condition": map[string]interface{}{
							"StringNotEquals": map[string]interface{}{
								"s3:x-amz-server-side-encryption": "aws:kms",
							},
						},
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create SSM parameters
	_, err = ssm.New