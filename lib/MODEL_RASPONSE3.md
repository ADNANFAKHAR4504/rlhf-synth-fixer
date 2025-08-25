```yaml
name: tap-stack
runtime: go
description: Multi-region AWS infrastructure with CloudFront, ALB, EC2, RDS, and DynamoDB Global Tables

config:
  projectName:
    type: string
    default: 'tap'
  environment:
    type: string
    default: 'prod'
  notificationEmail:
    type: string
    default: 'admin@example.com'
  vpcCidr:
    type: string
    default: '10.0.0.0/16'
  asgMinSize:
    type: integer
    default: 2
  asgMaxSize:
    type: integer
    default: 10
  dbInstanceClass:
    type: string
    default: 'db.t3.micro'
```

```go
module tap-stack

go 1.21

require (
	github.com/pulumi/pulumi-aws/sdk/v6 v6.22.2
	github.com/pulumi/pulumi/sdk/v3 v3.105.0
)
```

````go
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
	VpcId            pulumi.StringOutput
	PublicSubnetIds  pulumi.StringArrayOutput
	PrivateSubnetIds pulumi.StringArrayOutput
	AlbDnsName       pulumi.StringOutput
	DataBucketName   pulumi.StringOutput
	LogBucketName    pulumi.StringOutput
	RdsEndpoint      pulumi.StringOutput
}

func CreateTapStack(ctx *pulumi.Context) error {
	cfg := config.New(ctx, "")
	projectName := cfg.Get("projectName")
	environment := cfg.Get("environment")
	notificationEmail := cfg.Get("notificationEmail")
	vpcCidr := cfg.Get("vpcCidr")
	asgMinSize := cfg.GetInt("asgMinSize")
	asgMaxSize := cfg.GetInt("asgMaxSize")
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
				RegionName:          pulumi.String("us-east-1"),
				PointInTimeRecovery: pulumi.Bool(true),
			},
			&dynamodb.TableReplicaArgs{
				RegionName:          pulumi.String("eu-west-1"),
				PointInTimeRecovery: pulumi.Bool(true),
			},
		},
		StreamEnabled:  pulumi.Bool(true),
		StreamViewType: pulumi.String("NEW_AND_OLD_IMAGES"),
		Tags:           tags,
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

func createRegionalInfra(ctx *pulumi.Context, region string, provider pulumi.ProviderResource, projectName, environment, vpcCidr string, asgMinSize, asgMaxSize int, dbInstanceClass string, tags pulumi.StringMap, accountId string) (*RegionalInfra, error) {
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

	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ec2-policy-%s", region), &iam.RolePolicyArgs{
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
		MinSize:            pulumi.Int(asgMinSize),
		MaxSize:            pulumi.Int(asgMaxSize),
		DesiredCapacity:    pulumi.Int(asgMinSize),
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
	_, err = secretsmanager.NewSecret(ctx, fmt.Sprintf("rds-secret-%s", region), &secretsmanager.SecretArgs{
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
						"Effect":    "Deny",
						"Principal": "*",
						"Action":    "s3:PutObject",
						"Resource":  bucketArn + "/*",
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
	_, err = ssm.NewParameter(ctx, fmt.Sprintf("project-param-%s```go
", region), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/%s/%s/project", projectName, environment),
		Type:  pulumi.String("String"),
		Value: pulumi.String(projectName),
		Tags:  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = ssm.NewParameter(ctx, fmt.Sprintf("env-param-%s", region), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/%s/%s/environment", projectName, environment),
		Type:  pulumi.String("String"),
		Value: pulumi.String(environment),
		Tags:  tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	// Create Lambda function for log shipping
	lambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("lambda-role-%s", region), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					}
				}
			]
		}`),
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	logGroup, err := logs.NewLogGroup(ctx, fmt.Sprintf("lambda-logs-%s", region), &logs.LogGroupArgs{
		Name:            pulumi.Sprintf("/aws/lambda/%s-%s-log-shipper", projectName, environment),
		RetentionInDays: pulumi.Int(14),
		Tags:            tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("lambda-policy-%s", region), &iam.RolePolicyArgs{
		Role: lambdaRole.ID(),
		Policy: pulumi.All(logGroup.Arn).ApplyT(func(args []interface{}) (string, error) {
			logGroupArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"logs:CreateLogStream",
							"logs:PutLogEvents",
						},
						"Resource": logGroupArn + ":*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObject",
						},
						"Resource": "arn:aws:s3:::" + fmt.Sprintf("%s-%s-log-*", projectName, environment) + "/*",
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

	_, err = lambda.NewFunction(ctx, fmt.Sprintf("log-shipper-%s", region), &lambda.FunctionArgs{
		Runtime: pulumi.String("python3.9"),
		Code:    pulumi.NewFileArchive("lambda.zip"),
		Handler: pulumi.String("index.handler"),
		Role:    lambdaRole.Arn,
		Environment: &lambda.FunctionEnvironmentArgs{
			Variables: pulumi.StringMap{
				"LOG_GROUP": logGroup.Name,
			},
		},
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	return &RegionalInfra{
		VpcId:            vpc.ID(),
		PublicSubnetIds:  pulumi.StringArray(publicSubnetIds).ToStringArrayOutput(),
		PrivateSubnetIds: pulumi.StringArray(privateSubnetIds).ToStringArrayOutput(),
		AlbDnsName:       alb.DnsName,
		DataBucketName:   dataBucket.ID(),
		LogBucketName:    logBucket.ID(),
		RdsEndpoint:      rdsInstance.Endpoint,
	}, nil
}

func createS3Replication(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, primaryBucket, secondaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap, accountId string) error {
	// Create replication role
	replicationRole, err := iam.NewRole(ctx, "s3-replication-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "s3.amazonaws.com"
					}
				}
			]
		}`),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicy(ctx, "s3-replication-policy", &iam.RolePolicyArgs{
		Role: replicationRole.ID(),
		Policy: pulumi.All(primaryBucket, secondaryBucket).ApplyT(func(args []interface{}) (string, error) {
			primaryBucketName := args[0].(string)
			secondaryBucketName := args[1].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:GetObjectVersionForReplication",
							"s3:GetObjectVersionAcl",
						},
						"Resource": "arn:aws:s3:::" + primaryBucketName + "/*",
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ListBucket",
						},
						"Resource": "arn:aws:s3:::" + primaryBucketName,
					},
					{
						"Effect": "Allow",
						"Action": []string{
							"s3:ReplicateObject",
							"s3:ReplicateDelete",
						},
						"Resource": "arn:aws:s3:::" + secondaryBucketName + "/*",
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Enable versioning on both buckets
	_, err = s3.NewBucketVersioningV2(ctx, "primary-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: primaryBucket,
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketVersioningV2(ctx, "secondary-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: secondaryBucket,
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	}, pulumi.Provider(euWest1Provider))
	if err != nil {
		return err
	}

	// Create replication configuration
	_, err = s3.NewBucketReplicationConfig(ctx, "s3-replication", &s3.BucketReplicationConfigArgs{
		Role:   replicationRole.Arn,
		Bucket: primaryBucket,
		Rules: s3.BucketReplicationConfigRuleArray{
			&s3.BucketReplicationConfigRuleArgs{
				Id:     pulumi.String("ReplicateEverything"),
				Status: pulumi.String("Enabled"),
				Destination: &s3.BucketReplicationConfigRuleDestinationArgs{
					Bucket: pulumi.All(secondaryBucket).ApplyT(func(args []interface{}) string {
						return "arn:aws:s3:::" + args[0].(string)
					}).(pulumi.StringOutput),
					StorageClass: pulumi.String("STANDARD"),
				},
			},
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	return nil
}

func createCloudFront(ctx *pulumi.Context, usEast1Provider pulumi.ProviderResource, primaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap) (pulumi.StringOutput, error) {
	// Create ACM certificate for CloudFront (must be in us-east-1)
	cert, err := acm.NewCertificate(ctx, "cloudfront-cert", &acm.CertificateArgs{
		DomainName:       pulumi.Sprintf("%s.example.com", projectName),
		ValidationMethod: pulumi.String("DNS"),
		Tags:             tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	// Create CloudFront OAC
	oac, err := cloudfront.NewOriginAccessControl(ctx, "s3-oac", &cloudfront.OriginAccessControlArgs{
		Name:                          pulumi.Sprintf("%s-%s-oac", projectName, environment),
		Description:                   pulumi.String("OAC for S3 bucket"),
		OriginAccessControlOriginType: pulumi.String("s3"),
		SigningBehavior:               pulumi.String("always"),
		SigningProtocol:               pulumi.String("sigv4"),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	// Create CloudFront distribution
	distribution, err := cloudfront.NewDistribution(ctx, "cloudfront", &cloudfront.DistributionArgs{
		Origins: cloudfront.DistributionOriginArray{
			&cloudfront.DistributionOriginArgs{
				DomainName: pulumi.All(primaryBucket).ApplyT(func(args []interface{}) string {
					return args[0].(string) + ".s3.amazonaws.com"
				}).(pulumi.StringOutput),
				OriginId:              pulumi.String("S3-primary"),
				OriginAccessControlId: oac.ID(),
			},
		},
		Enabled:           pulumi.Bool(true),
		DefaultRootObject: pulumi.String("index.html"),
		DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{
			TargetOriginId:       pulumi.String("S3-primary"),
			ViewerProtocolPolicy: pulumi.String("redirect-to-https"),
			AllowedMethods:       pulumi.StringArray{pulumi.String("DELETE"), pulumi.String("GET"), pulumi.String("HEAD"), pulumi.String("OPTIONS"), pulumi.String("PATCH"), pulumi.String("POST"), pulumi.String("PUT")},
			CachedMethods:        pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")},
			Compress:             pulumi.Bool(true),
			ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
				QueryString: pulumi.Bool(false),
				Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
					Forward: pulumi.String("none"),
				},
			},
		},
		PriceClass: pulumi.String("PriceClass_100"),
		Restrictions: &cloudfront.DistributionRestrictionsArgs{
			GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{
				RestrictionType: pulumi.String("none"),
			},
		},
		ViewerCertificate: &cloudfront.DistributionViewerCertificateArgs{
			AcmCertificateArn:      cert.Arn,
			SslSupportMethod:       pulumi.String("sni-only"),
			MinimumProtocolVersion: pulumi.String("TLSv1.2_2021"),
		},
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	return distribution.DomainName, nil
}

func createMonitoring(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, projectName, environment, notificationEmail string, tags pulumi.StringMap, accountId string) error {
	// Create SNS topic
	snsTopic, err := sns.NewTopic(ctx, "alerts", &sns.TopicArgs{
		Name: pulumi.Sprintf("%s-%s-alerts", projectName, environment),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = sns.NewTopicSubscription(ctx, "email-alert", &sns.TopicSubscriptionArgs{
		TopicArn: snsTopic.Arn,
		Protocol: pulumi.String("email"),
		Endpoint: pulumi.String(notificationEmail),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail S3 bucket
	cloudtrailBucket, err := s3.NewBucketV2(ctx, "cloudtrail-bucket", &s3.BucketV2Args{
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "cloudtrail-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{
		Bucket: cloudtrailBucket.ID(),
		Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
			&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
				ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
					SseAlgorithm: pulumi.String("aws:kms"),
				},
			},
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = s3.NewBucketPolicy(ctx, "cloudtrail-bucket-policy", &s3.BucketPolicyArgs{
		Bucket: cloudtrailBucket.ID(),
		Policy: pulumi.All(cloudtrailBucket.Arn).ApplyT(func(args []interface{}) (string, error) {
			bucketArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action":   "s3:PutObject",
						"Resource": bucketArn + "/*",
						"Condition": map[string]interface{}{
							"StringEquals": map[string]interface{}{
								"s3:x-amz-acl": "bucket-owner-full-control",
							},
						},
					},
					{
						"Effect": "Allow",
						"Principal": map[string]interface{}{
							"Service": "cloudtrail.amazonaws.com",
						},
						"Action":   "s3:GetBucketAcl",
						"Resource": bucketArn,
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup, err := logs.NewLogGroup(ctx, "cloudtrail-logs", &logs.LogGroupArgs{
		Name:            pulumi.Sprintf("/aws/cloudtrail/%s-%s", projectName, environment),
		RetentionInDays: pulumi.Int(90),
		Tags:            tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail role
	cloudtrailRole, err := iam.NewRole(ctx, "cloudtrail-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					}
				}
			]
		}`),
		Tags: tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicy(ctx, "cloudtrail-policy", &iam.RolePolicyArgs{
		Role: cloudtrailRole.ID(),
		Policy: pulumi.All(cloudtrailLogGroup.Arn).ApplyT(func(args []interface{}) (string, error) {
			logGroupArn := args[0].(string)
			policy := map[string]interface{}{
				"Version": "2012-10-17",
				"Statement": []map[string]interface{}{
					{
						"Effect": "Allow",
						"Action": []string{
							"logs:CreateLogStream",
							"logs:PutLogEvents",
						},
						"Resource": logGroupArn + ":*",
					},
				},
			}
			policyJSON, _ := json.Marshal(policy)
			return string(policyJSON), nil
		}).(pulumi.StringOutput),
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create CloudTrail
	_, err = cloudtrail.NewTrail(ctx, "cloudtrail", &cloudtrail.TrailArgs{
		Name:                       pulumi.Sprintf("%s-%s-trail", projectName, environment),
		S3BucketName:               cloudtrailBucket.ID(),
		IncludeGlobalServiceEvents: pulumi.Bool(true),
		IsMultiRegionTrail:         pulumi.Bool(true),
		EnableLogFileValidation:    pulumi.Bool(true),
		CloudWatchLogsGroupArn: pulumi.All(cloudtrailLogGroup.Arn).ApplyT(func(args []interface{}) string {
			return args[0].(string) + ":*"
		}).(pulumi.StringOutput),
		CloudWatchLogsRoleArn: cloudtrailRole.Arn,
		Tags:                  tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	// Create metric filter and alarm
	_, err = logs.NewMetricFilter(ctx, "unauthorized-api-calls", &logs.MetricFilterArgs{
		Name:          pulumi.String("UnauthorizedAPICalls"),
		LogGroupName:  cloudtrailLogGroup.Name,
		FilterPattern: pulumi.String(`{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }`),
		MetricTransformation: &logs.MetricFilterMetricTransformationArgs{
			Name:      pulumi.String("UnauthorizedAPICalls"),
			Namespace: pulumi.String("CloudTrailMetrics"),
			Value:     pulumi.String("1"),
		},
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	_, err = cloudwatch.NewMetricAlarm(ctx, "unauthorized-api-alarm", &cloudwatch.MetricAlarmArgs{
		Name:               pulumi.Sprintf("%s-%s-unauthorized-api-calls", projectName, environment),
		ComparisonOperator: pulumi.String("GreaterThanOrEqualToThreshold"),
		EvaluationPeriods:  pulumi.String("1"),
		MetricName:         pulumi.String("UnauthorizedAPICalls"),
		Namespace:          pulumi.String("CloudTrailMetrics"),
		Period:             pulumi.String("300"),
		Statistic:          pulumi.String("Sum"),
		Threshold:          pulumi.String("1"),
		AlarmDescription:   pulumi.String("Monitors unauthorized API calls"),
		AlarmActions:       pulumi.StringArray{snsTopic.Arn},
		Tags:               tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	return nil
}
````
