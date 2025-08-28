package stack

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/autoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	lb "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ssm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createRegionalInfra(ctx *pulumi.Context, region string, provider pulumi.ProviderResource, projectName, environment, vpcCidr string, asgMinSize, asgMaxSize int, dbInstanceClass string, tags pulumi.StringMap, accountId string, isPREnv bool) (*RegionalInfra, error) {
	azs, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{State: pulumi.StringRef("available")}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("vpc-%s", region), &ec2.VpcArgs{
		CidrBlock:          pulumi.String(vpcCidr),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags:               tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("igw-%s", region), &ec2.InternetGatewayArgs{VpcId: vpc.ID(), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	var publicSubnetIds pulumi.StringArray
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

	eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%s", region), &ec2.EipArgs{Domain: pulumi.String("vpc"), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gw-%s", region), &ec2.NatGatewayArgs{AllocationId: eip.ID(), SubnetId: publicSubnetIds[0], Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	var privateSubnetIds pulumi.StringArray
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

	publicRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", region), &ec2.RouteTableArgs{
		VpcId:  vpc.ID(),
		Routes: ec2.RouteTableRouteArray{&ec2.RouteTableRouteArgs{CidrBlock: pulumi.String("0.0.0.0/0"), GatewayId: igw.ID()}},
		Tags:   tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	privateRt, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%s", region), &ec2.RouteTableArgs{
		VpcId:  vpc.ID(),
		Routes: ec2.RouteTableRouteArray{&ec2.RouteTableRouteArgs{CidrBlock: pulumi.String("0.0.0.0/0"), NatGatewayId: natGw.ID()}},
		Tags:   tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	for i, subnetId := range publicSubnetIds {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%s-%d", region, i), &ec2.RouteTableAssociationArgs{SubnetId: subnetId, RouteTableId: publicRt.ID()}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}
	for i, subnetId := range privateSubnetIds {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%s-%d", region, i), &ec2.RouteTableAssociationArgs{SubnetId: subnetId, RouteTableId: privateRt.ID()}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	albSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId: vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{Protocol: pulumi.String("tcp"), FromPort: pulumi.Int(80), ToPort: pulumi.Int(80), CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}},
			&ec2.SecurityGroupIngressArgs{Protocol: pulumi.String("tcp"), FromPort: pulumi.Int(443), ToPort: pulumi.Int(443), CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}},
		},
		Egress: ec2.SecurityGroupEgressArray{&ec2.SecurityGroupEgressArgs{Protocol: pulumi.String("-1"), FromPort: pulumi.Int(0), ToPort: pulumi.Int(0), CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}}},
		Tags:   tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	ec2Sg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ec2-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId:   vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{&ec2.SecurityGroupIngressArgs{Protocol: pulumi.String("tcp"), FromPort: pulumi.Int(80), ToPort: pulumi.Int(80), SecurityGroups: pulumi.StringArray{albSg.ID()}}},
		Egress:  ec2.SecurityGroupEgressArray{&ec2.SecurityGroupEgressArgs{Protocol: pulumi.String("-1"), FromPort: pulumi.Int(0), ToPort: pulumi.Int(0), CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")}}},
		Tags:    tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	rdsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", region), &ec2.SecurityGroupArgs{
		VpcId:   vpc.ID(),
		Ingress: ec2.SecurityGroupIngressArray{&ec2.SecurityGroupIngressArgs{Protocol: pulumi.String("tcp"), FromPort: pulumi.Int(3306), ToPort: pulumi.Int(3306), SecurityGroups: pulumi.StringArray{ec2Sg.ID()}}},
		Tags:    tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	amiResult, err := ssm.LookupParameter(ctx, &ssm.LookupParameterArgs{Name: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	ec2Role, err := iam.NewRole(ctx, fmt.Sprintf("ec2-role-%s", region), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{ "Version": "2012-10-17", "Statement": [{ "Action": "sts:AssumeRole", "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" } }] }`),
		Tags:             tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ec2-policy-%s", region), &iam.RolePolicyArgs{
		Role:   ec2Role.ID(),
		Policy: pulumi.Sprintf(`{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": ["ssm:GetParameter","ssm:GetParameters","ssm:GetParametersByPath"], "Resource": "arn:aws:ssm:%s:%s:parameter/%s/%s/*" }, { "Effect": "Allow", "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:Query","dynamodb:Scan"], "Resource": "arn:aws:dynamodb:*:%s:table/%s-%s-global" } ] }`, region, accountId, projectName, environment, accountId, projectName, environment),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	instanceProfile, err := iam.NewInstanceProfile(ctx, fmt.Sprintf("ec2-profile-%s", region), &iam.InstanceProfileArgs{Role: ec2Role.Name, Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	launchTemplate, err := ec2.NewLaunchTemplate(ctx, fmt.Sprintf("launch-template-%s", region), &ec2.LaunchTemplateArgs{
		ImageId:      pulumi.String(amiResult.Value),
		InstanceType: pulumi.String("t3.micro"),
		IamInstanceProfile: &ec2.LaunchTemplateIamInstanceProfileArgs{
			Name: instanceProfile.Name,
		},
		VpcSecurityGroupIds: pulumi.StringArray{ec2Sg.ID()},
		UserData: pulumi.String(base64.StdEncoding.EncodeToString([]byte(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo '<h1>Healthy</h1>' > /var/www/html/healthz
echo '<h1>Hello from ` + region + `</h1>' > /var/www/html/index.html
systemctl restart httpd`))),
		Tags: tags,
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	alb, err := lb.NewLoadBalancer(ctx, fmt.Sprintf("alb-%s", region), &lb.LoadBalancerArgs{LoadBalancerType: pulumi.String("application"), Subnets: publicSubnetIds, SecurityGroups: pulumi.StringArray{albSg.ID()}, Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	targetGroup, err := lb.NewTargetGroup(ctx, fmt.Sprintf("tg-%s", region), &lb.TargetGroupArgs{Port: pulumi.Int(80), Protocol: pulumi.String("HTTP"), VpcId: vpc.ID(), HealthCheck: &lb.TargetGroupHealthCheckArgs{Path: pulumi.String("/healthz"), HealthyThreshold: pulumi.Int(2), UnhealthyThreshold: pulumi.Int(2)}, Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	if isPREnv {
		// PR environments: use HTTP listener to avoid ACM dependency/timeouts.
		_, err = lb.NewListener(ctx, fmt.Sprintf("alb-listener-%s", region), &lb.ListenerArgs{LoadBalancerArn: alb.Arn, Port: pulumi.Int(80), Protocol: pulumi.String("HTTP"), DefaultActions: lb.ListenerDefaultActionArray{&lb.ListenerDefaultActionArgs{Type: pulumi.String("forward"), TargetGroupArn: targetGroup.Arn}}}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	} else {
		cert, err := acm.NewCertificate(ctx, fmt.Sprintf("alb-cert-%s", region), &acm.CertificateArgs{DomainName: pulumi.Sprintf("%s.%s.example.com", projectName, region), ValidationMethod: pulumi.String("DNS"), Tags: tags}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
		_, err = lb.NewListener(ctx, fmt.Sprintf("alb-listener-%s", region), &lb.ListenerArgs{LoadBalancerArn: alb.Arn, Port: pulumi.Int(443), Protocol: pulumi.String("HTTPS"), SslPolicy: pulumi.String("ELBSecurityPolicy-TLS-1-2-2017-01"), CertificateArn: cert.Arn, DefaultActions: lb.ListenerDefaultActionArray{&lb.ListenerDefaultActionArgs{Type: pulumi.String("forward"), TargetGroupArn: targetGroup.Arn}}}, pulumi.Provider(provider))
		if err != nil {
			return nil, err
		}
	}

	asg, err := autoscaling.NewGroup(ctx, fmt.Sprintf("asg-%s", region), &autoscaling.GroupArgs{
		VpcZoneIdentifiers: pulumi.StringArray(privateSubnetIds),
		TargetGroupArns:    pulumi.StringArray{targetGroup.Arn},
		HealthCheckType:    pulumi.String("ELB"),
		MinSize:            pulumi.Int(asgMinSize),
		MaxSize:            pulumi.Int(asgMaxSize),
		DesiredCapacity:    pulumi.Int(asgMinSize),
		LaunchTemplate:     &autoscaling.GroupLaunchTemplateArgs{Id: launchTemplate.ID(), Version: pulumi.String("$Latest")},
		Tags: autoscaling.GroupTagArray{
			&autoscaling.GroupTagArgs{Key: pulumi.String("Environment"), Value: pulumi.String(environment), PropagateAtLaunch: pulumi.Bool(true)},
			&autoscaling.GroupTagArgs{Key: pulumi.String("Project"), Value: pulumi.String(projectName), PropagateAtLaunch: pulumi.Bool(true)},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_ = asg

	rdsSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("rds-subnet-group-%s", region), &rds.SubnetGroupArgs{SubnetIds: pulumi.StringArray(privateSubnetIds), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("rds-%s", region), &rds.InstanceArgs{AllocatedStorage: pulumi.Int(20), StorageType: pulumi.String("gp2"), Engine: pulumi.String("mysql"), EngineVersion: pulumi.String("8.0"), InstanceClass: pulumi.String(dbInstanceClass), DbName: pulumi.String("appdb"), Username: pulumi.String("admin"), Password: pulumi.String("ChangeMe-StrongP#ssw0rd1!"), DbSubnetGroupName: rdsSubnetGroup.Name, VpcSecurityGroupIds: pulumi.StringArray{rdsSg.ID()}, BackupRetentionPeriod: pulumi.Int(7), MultiAz: pulumi.Bool(true), StorageEncrypted: pulumi.Bool(true), SkipFinalSnapshot: pulumi.Bool(true), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	dataBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("data-bucket-%s", region), &s3.BucketV2Args{Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	logBucket, err := s3.NewBucketV2(ctx, fmt.Sprintf("log-bucket-%s", region), &s3.BucketV2Args{Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("data-bucket-encryption-%s", region), &s3.BucketServerSideEncryptionConfigurationV2Args{Bucket: dataBucket.ID(), Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{SseAlgorithm: pulumi.String("aws:kms")}}}}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("data-bucket-pab-%s", region), &s3.BucketPublicAccessBlockArgs{Bucket: dataBucket.ID(), BlockPublicAcls: pulumi.Bool(true), BlockPublicPolicy: pulumi.Bool(true), IgnorePublicAcls: pulumi.Bool(true), RestrictPublicBuckets: pulumi.Bool(true)}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = s3.NewBucketPolicy(ctx, fmt.Sprintf("data-bucket-policy-%s", region), &s3.BucketPolicyArgs{Bucket: dataBucket.ID(), Policy: pulumi.All(dataBucket.Arn, dataBucket.Arn).ApplyT(func(args []interface{}) (string, error) {
		bucketArn := args[0].(string)
		policy := map[string]interface{}{"Version": "2012-10-17", "Statement": []map[string]interface{}{{"Effect": "Deny", "Principal": "*", "Action": "s3:PutObject", "Resource": bucketArn + "/*", "Condition": map[string]interface{}{"StringNotEquals": map[string]interface{}{"s3:x-amz-server-side-encryption": "aws:kms"}}}}}
		b, _ := json.Marshal(policy)
		return string(b), nil
	}).(pulumi.StringOutput)}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	_, err = ssm.NewParameter(ctx, fmt.Sprintf("project-param-%s", region), &ssm.ParameterArgs{Name: pulumi.Sprintf("/%s/%s/project", projectName, environment), Type: pulumi.String("String"), Value: pulumi.String(projectName), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = ssm.NewParameter(ctx, fmt.Sprintf("env-param-%s", region), &ssm.ParameterArgs{Name: pulumi.Sprintf("/%s/%s/environment", projectName, environment), Type: pulumi.String("String"), Value: pulumi.String(environment), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}

	lambdaRole, err := iam.NewRole(ctx, fmt.Sprintf("lambda-role-%s", region), &iam.RoleArgs{AssumeRolePolicy: pulumi.String(`{ "Version": "2012-10-17", "Statement": [{ "Action": "sts:AssumeRole", "Effect": "Allow", "Principal": { "Service": "lambda.amazonaws.com" } }] }`), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	logGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("lambda-logs-%s", region), &cloudwatch.LogGroupArgs{Name: pulumi.Sprintf("/aws/lambda/%s-%s-log-shipper", projectName, environment), RetentionInDays: pulumi.Int(14), Tags: tags}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("lambda-policy-%s", region), &iam.RolePolicyArgs{Role: lambdaRole.ID(), Policy: pulumi.All(logGroup.Arn).ApplyT(func(args []interface{}) (string, error) {
		lgArn := args[0].(string)
		policy := map[string]interface{}{"Version": "2012-10-17", "Statement": []map[string]interface{}{{"Effect": "Allow", "Action": []string{"logs:CreateLogStream", "logs:PutLogEvents"}, "Resource": lgArn + ":*"}, {"Effect": "Allow", "Action": []string{"s3:GetObject"}, "Resource": "arn:aws:s3:::" + fmt.Sprintf("%s-%s-log-*", projectName, environment) + "/*"}}}
		b, _ := json.Marshal(policy)
		return string(b), nil
	}).(pulumi.StringOutput)}, pulumi.Provider(provider))
	if err != nil {
		return nil, err
	}
	_, err = lambda.NewFunction(ctx, fmt.Sprintf("log-shipper-%s", region), &lambda.FunctionArgs{
		Runtime: pulumi.String(lambda.RuntimeNodeJS20dX),
		// Inline Lambda code using an AssetArchive to avoid external zip artifacts.
		Code: pulumi.NewAssetArchive(map[string]interface{}{
			"index.js": pulumi.NewStringAsset(`exports.handler = async (event) => {
			  console.log('Event:', JSON.stringify(event));
			  return { statusCode: 200, body: JSON.stringify({ message: 'Lambda OK' }) };
			};`),
		}),
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

	return &RegionalInfra{VpcId: vpc.ID().ToStringOutput(), PublicSubnetIds: publicSubnetIds.ToStringArrayOutput(), PrivateSubnetIds: privateSubnetIds.ToStringArrayOutput(), AlbDnsName: alb.DnsName, DataBucketName: dataBucket.ID().ToStringOutput(), LogBucketName: logBucket.ID().ToStringOutput(), RdsEndpoint: rdsInstance.Endpoint}, nil
}
