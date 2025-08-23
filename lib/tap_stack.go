package lib

import (
	"fmt"
	"strconv"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/applicationloadbalancer"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/autoscalinggroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataamiids"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataawsavailabilityzones"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataawssubnets"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/dataawsvpc"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/internetgateway"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/launchtemplate"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/lbtargetgroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/route53healthcheck"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/route53hostedzone"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/route53record"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/routetable"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/routetableassociation"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/securitygroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/subnet"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/vpc"
)

// RegionConfig holds configuration specific to each AWS region
type RegionConfig struct {
	Region           string
	AvailabilityZone string
	CidrBlock        string
	SubnetCidrs      []string
	InstanceType     string
	MinSize          int
	MaxSize          int
	DesiredCapacity  int
}

// TapStack represents our multi-region infrastructure stack
type TapStack struct {
	cdktf.TerraformStack
}

// NewTapStack creates a new instance of our multi-region stack
func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Define region configurations with specific settings for each region
	// This allows us to customize deployment parameters per region while maintaining consistency
	regionConfigs := []RegionConfig{
		{
			Region:           "us-east-1",
			AvailabilityZone: "us-east-1a",
			CidrBlock:        "10.0.0.0/16",
			SubnetCidrs:      []string{"10.0.1.0/24", "10.0.2.0/24"},
			InstanceType:     "t3.micro",
			MinSize:          2,
			MaxSize:          10,
			DesiredCapacity:  2,
		},
		{
			Region:           "us-west-2",
			AvailabilityZone: "us-west-2a",
			CidrBlock:        "10.1.0.0/16",
			SubnetCidrs:      []string{"10.1.1.0/24", "10.1.2.0/24"},
			InstanceType:     "t3.micro",
			MinSize:          2,
			MaxSize:          10,
			DesiredCapacity:  2,
		},
		{
			Region:           "eu-central-1",
			AvailabilityZone: "eu-central-1a",
			CidrBlock:        "10.2.0.0/16",
			SubnetCidrs:      []string{"10.2.1.0/24", "10.2.2.0/24"},
			InstanceType:     "t3.micro",
			MinSize:          2,
			MaxSize:          10,
			DesiredCapacity:  2,
		},
	}

	// Create AWS providers for each region
	// This enables us to deploy resources across multiple regions from a single stack
	providers := make(map[string]provider.AwsProvider)
	for _, config := range regionConfigs {
		providers[config.Region] = provider.NewAwsProvider(stack, jsii.String(fmt.Sprintf("aws-%s", config.Region)), &provider.AwsProviderConfig{
			Region: jsii.String(config.Region),
			Alias:  jsii.String(config.Region),
		})
	}

	// Create Route 53 hosted zone for DNS failover
	// Using a fake domain for testing purposes - Route 53 allows this for validation
	hostedZone := route53hostedzone.NewRoute53HostedZone(stack, jsii.String("main-hosted-zone"), &route53hostedzone.Route53HostedZoneConfig{
		Name:     jsii.String("fake-domain.com"),
		Comment:  jsii.String("Hosted zone for multi-region application with DNS failover"),
		Provider: providers["us-east-1"], // Primary provider for Route 53
	})

	// Store ELB DNS names and zone IDs for Route 53 configuration
	elbDnsNames := make(map[string]*string)
	elbZoneIds := make(map[string]*string)

	// Deploy infrastructure in each region
	for _, config := range regionConfigs {
		regionProvider := providers[config.Region]

		// Create CloudWatch Log Group for application logs
		// This provides centralized logging for each region
		cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String(fmt.Sprintf("app-logs-%s", config.Region)), &cloudwatchloggroup.CloudwatchLogGroupConfig{
			Name:            jsii.String(fmt.Sprintf("/aws/application/tap-app-%s", config.Region)),
			RetentionInDays: jsii.Number(7),
			Provider:        regionProvider,
		})

		// Create VPC for the region
		// Each region gets its own isolated network with unique CIDR blocks
		vpc := vpc.NewVpc(stack, jsii.String(fmt.Sprintf("vpc-%s", config.Region)), &vpc.VpcConfig{
			CidrBlock:          jsii.String(config.CidrBlock),
			EnableDnsHostnames: jsii.Bool(true),
			EnableDnsSupport:   jsii.Bool(true),
			Tags: &map[string]*string{
				"Name":   jsii.String(fmt.Sprintf("tap-vpc-%s", config.Region)),
				"Region": jsii.String(config.Region),
			},
			Provider: regionProvider,
		})

		// Create Internet Gateway for public internet access
		igw := internetgateway.NewInternetGateway(stack, jsii.String(fmt.Sprintf("igw-%s", config.Region)), &internetgateway.InternetGatewayConfig{
			VpcId: vpc.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("tap-igw-%s", config.Region)),
			},
			Provider: regionProvider,
		})

		// Get availability zones for the region to ensure high availability
		azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String(fmt.Sprintf("azs-%s", config.Region)), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
			State:    jsii.String("available"),
			Provider: regionProvider,
		})

		// Create subnets across multiple availability zones for high availability
		var subnetIds []*string
		for i, subnetCidr := range config.SubnetCidrs {
			subnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("subnet-%s-%d", config.Region, i)), &subnet.SubnetConfig{
				VpcId:               vpc.Id(),
				CidrBlock:           jsii.String(subnetCidr),
				AvailabilityZone:    cdktf.Fn_Element(azs.Names(), jsii.Number(float64(i))),
				MapPublicIpOnLaunch: jsii.Bool(true),
				Tags: &map[string]*string{
					"Name": jsii.String(fmt.Sprintf("tap-subnet-%s-%d", config.Region, i)),
				},
				Provider: regionProvider,
			})
			subnetIds = append(subnetIds, subnet.Id())
		}

		// Create route table for public internet access
		routeTable := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("rt-%s", config.Region)), &routetable.RouteTableConfig{
			VpcId: vpc.Id(),
			Route: &[]*routetable.RouteTableRoute{
				{
					CidrBlock: jsii.String("0.0.0.0/0"),
					GatewayId: igw.Id(),
				},
			},
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("tap-rt-%s", config.Region)),
			},
			Provider: regionProvider,
		})

		// Associate subnets with route table
		for i, subnetId := range subnetIds {
			routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("rta-%s-%d", config.Region, i)), &routetableassociation.RouteTableAssociationConfig{
				SubnetId:     subnetId,
				RouteTableId: routeTable.Id(),
				Provider:     regionProvider,
			})
		}

		// Create security group for ELB
		// Allows HTTP traffic from internet and all outbound traffic
		elbSg := securitygroup.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("elb-sg-%s", config.Region)), &securitygroup.SecurityGroupConfig{
			Name:        jsii.String(fmt.Sprintf("tap-elb-sg-%s", config.Region)),
			Description: jsii.String("Security group for ELB"),
			VpcId:       vpc.Id(),
			Ingress: &[]*securitygroup.SecurityGroupIngress{
				{
					FromPort:   jsii.Number(80),
					ToPort:     jsii.Number(80),
					Protocol:   jsii.String("tcp"),
					CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
				},
			},
			Egress: &[]*securitygroup.SecurityGroupEgress{
				{
					FromPort:   jsii.Number(0),
					ToPort:     jsii.Number(0),
					Protocol:   jsii.String("-1"),
					CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
				},
			},
			Provider: regionProvider,
		})

		// Create security group for EC2 instances
		// Allows HTTP traffic from ELB and SSH for management
		ec2Sg := securitygroup.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("ec2-sg-%s", config.Region)), &securitygroup.SecurityGroupConfig{
			Name:        jsii.String(fmt.Sprintf("tap-ec2-sg-%s", config.Region)),
			Description: jsii.String("Security group for EC2 instances"),
			VpcId:       vpc.Id(),
			Ingress: &[]*securitygroup.SecurityGroupIngress{
				{
					FromPort:       jsii.Number(80),
					ToPort:         jsii.Number(80),
					Protocol:       jsii.String("tcp"),
					SecurityGroups: &[]*string{elbSg.Id()},
				},
				{
					FromPort:   jsii.Number(22),
					ToPort:     jsii.Number(22),
					Protocol:   jsii.String("tcp"),
					CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
				},
			},
			Egress: &[]*securitygroup.SecurityGroupEgress{
				{
					FromPort:   jsii.Number(0),
					ToPort:     jsii.Number(0),
					Protocol:   jsii.String("-1"),
					CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")},
				},
			},
			Provider: regionProvider,
		})

		// Get latest Amazon Linux AMI for the region
		ami := dataamiids.NewDataAmiIds(stack, jsii.String(fmt.Sprintf("ami-%s", config.Region)), &dataamiids.DataAmiIdsConfig{
			Owners: &[]*string{jsii.String("amazon")},
			Filter: &[]*dataamiids.DataAmiIdsFilter{
				{
					Name:   jsii.String("name"),
					Values: &[]*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")},
				},
				{
					Name:   jsii.String("state"),
					Values: &[]*string{jsii.String("available")},
				},
			},
			MostRecent: jsii.Bool(true),
			Provider:   regionProvider,
		})

		// Create launch template for Auto Scaling Group
		// Includes user data to install and start a simple web server
		launchTemplate := launchtemplate.NewLaunchTemplate(stack, jsii.String(fmt.Sprintf("lt-%s", config.Region)), &launchtemplate.LaunchTemplateConfig{
			Name:         jsii.String(fmt.Sprintf("tap-lt-%s", config.Region)),
			ImageId:      cdktf.Fn_Element(ami.Ids(), jsii.Number(0)),
			InstanceType: jsii.String(config.InstanceType),
			VpcSecurityGroupIds: &[]*string{ec2Sg.Id()},
			UserData: jsii.String(cdktf.Fn_Base64encode(jsii.String(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ` + config.Region + `</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
`))),
			TagSpecification: &[]*launchtemplate.LaunchTemplateTagSpecification{
				{
					ResourceType: jsii.String("instance"),
					Tags: &map[string]*string{
						"Name":   jsii.String(fmt.Sprintf("tap-instance-%s", config.Region)),
						"Region": jsii.String(config.Region),
					},
				},
			},
			Provider: regionProvider,
		})

		// Create target group for Application Load Balancer
		targetGroup := lbtargetgroup.NewLbTargetGroup(stack, jsii.String(fmt.Sprintf("tg-%s", config.Region)), &lbtargetgroup.LbTargetGroupConfig{
			Name:     jsii.String(fmt.Sprintf("tap-tg-%s", config.Region)),
			Port:     jsii.Number(80),
			Protocol: jsii.String("HTTP"),
			VpcId:    vpc.Id(),
			HealthCheck: &lbtargetgroup.LbTargetGroupHealthCheck{
				Enabled:            jsii.Bool(true),
				HealthyThreshold:   jsii.Number(2),
				UnhealthyThreshold: jsii.Number(2),
				Timeout:            jsii.Number(5),
				Interval:           jsii.Number(30),
				Path:               jsii.String("/"),
				Matcher:            jsii.String("200"),
			},
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("tap-tg-%s", config.Region)),
			},
			Provider: regionProvider,
		})

		// Create Application Load Balancer
		// Distributes traffic across multiple availability zones
		alb := applicationloadbalancer.NewApplicationLoadBalancer(stack, jsii.String(fmt.Sprintf("alb-%s", config.Region)), &applicationloadbalancer.ApplicationLoadBalancerConfig{
			Name:           jsii.String(fmt.Sprintf("tap-alb-%s", config.Region)),
			LoadBalancerType: jsii.String("application"),
			Subnets:        &subnetIds,
			SecurityGroups: &[]*string{elbSg.Id()},
			Tags: &map[string]*string{
				"Name":   jsii.String(fmt.Sprintf("tap-alb-%s", config.Region)),
				"Region": jsii.String(config.Region),
			},
			Provider: regionProvider,
		})

		// Store ELB DNS information for Route 53 configuration
		elbDnsNames[config.Region] = alb.DnsName()
		elbZoneIds[config.Region] = alb.ZoneId()

		// Create Auto Scaling Group
		// Maintains minimum instances and scales based on demand
		autoscalinggroup.NewAutoscalingGroup(stack, jsii.String(fmt.Sprintf("asg-%s", config.Region)), &autoscalinggroup.AutoscalingGroupConfig{
			Name:               jsii.String(fmt.Sprintf("tap-asg-%s", config.Region)),
			VpcZoneIdentifier:  &subnetIds,
			MinSize:            jsii.Number(float64(config.MinSize)),
			MaxSize:            jsii.Number(float64(config.MaxSize)),
			DesiredCapacity:    jsii.Number(float64(config.DesiredCapacity)),
			HealthCheckType:    jsii.String("ELB"),
			HealthCheckGracePeriod: jsii.Number(300),
			TargetGroupArns:    &[]*string{targetGroup.Arn()},
			LaunchTemplate: &autoscalinggroup.AutoscalingGroupLaunchTemplate{
				Id:      launchTemplate.Id(),
				Version: jsii.String("$Latest"),
			},
			Tag: &[]*autoscalinggroup.AutoscalingGroupTag{
				{
					Key:               jsii.String("Name"),
					Value:             jsii.String(fmt.Sprintf("tap-asg-%s", config.Region)),
					PropagateAtLaunch: jsii.Bool(true),
				},
				{
					Key:               jsii.String("Region"),
					Value:             jsii.String(config.Region),
					PropagateAtLaunch: jsii.Bool(true),
				},
			},
			Provider: regionProvider,
		})
	}

	// Create Route 53 health checks for each region
	// These monitor the health of each ELB and enable automatic failover
	healthChecks := make(map[string]route53healthcheck.Route53HealthCheck)
	for region, dnsName := range elbDnsNames {
		healthCheck := route53healthcheck.NewRoute53HealthCheck(stack, jsii.String(fmt.Sprintf("health-check-%s", region)), &route53healthcheck.Route53HealthCheckConfig{
			Fqdn:                        dnsName,
			Port:                        jsii.Number(80),
			Type:                        jsii.String("HTTP"),
			ResourcePath:                jsii.String("/"),
			FailureThreshold:            jsii.Number(3),
			RequestInterval:             jsii.Number(30),
			CloudwatchAlarmRegion:       jsii.String("us-east-1"),
			InsufficientDataHealthStatus: jsii.String("Failure"),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("Health check for %s", region)),
			},
			Provider: providers["us-east-1"], // Health checks must be created in us-east-1
		})
		healthChecks[region] = healthCheck
	}

	// Create Route 53 records with failover routing
	// Primary record points to us-east-1, with failover to other regions
	primaryRegion := "us-east-1"
	route53record.NewRoute53Record(stack, jsii.String("primary-record"), &route53record.Route53RecordConfig{
		ZoneId: hostedZone.ZoneId(),
		Name:   jsii.String("app.fake-domain.com"),
		Type:   jsii.String("A"),
		SetIdentifier: jsii.String("primary"),
		FailoverRoutingPolicy: &route53record.Route53RecordFailoverRoutingPolicy{
			Type: jsii.String("PRIMARY"),
		},
		HealthCheckId: healthChecks[primaryRegion].Id(),
		Alias: &route53record.Route53RecordAlias{
			Name:                 elbDnsNames[primaryRegion],
			ZoneId:               elbZoneIds[primaryRegion],
			EvaluateTargetHealth: jsii.Bool(true),
		},
		Provider: providers["us-east-1"],
	})

	// Create secondary failover records for other regions
	secondaryRegions := []string{"us-west-2", "eu-central-1"}
	for i, region := range secondaryRegions {
		route53record.NewRoute53Record(stack, jsii.String(fmt.Sprintf("secondary-record-%s", region)), &route53record.Route53RecordConfig{
			ZoneId: hostedZone.ZoneId(),
			Name:   jsii.String("app.fake-domain.com"),
			Type:   jsii.String("A"),
			SetIdentifier: jsii.String(fmt.Sprintf("secondary-%d", i+1)),
			FailoverRoutingPolicy: &route53record.Route53RecordFailoverRoutingPolicy{
				Type: jsii.String("SECONDARY"),
			},
			HealthCheckId: healthChecks[region].Id(),
			Alias: &route53record.Route53RecordAlias{
				Name:                 elbDnsNames[region],
				ZoneId:               elbZoneIds[region],
				EvaluateTargetHealth: jsii.Bool(true),
			},
			Provider: providers["us-east-1"],
		})
	}

	// Create weighted routing records for load distribution
	// This distributes traffic based on weights while maintaining failover capability
	for region, dnsName := range elbDnsNames {
		weight := 100 // Equal weight for all regions
		if region == primaryRegion {
			weight = 200 // Give primary region higher weight
		}

		route53record.NewRoute53Record(stack, jsii.String(fmt.Sprintf("weighted-record-%s", region)), &route53record.Route53RecordConfig{
			ZoneId: hostedZone.ZoneId(),
			Name:   jsii.String("weighted.fake-domain.com"),
			Type:   jsii.String("A"),
			SetIdentifier: jsii.String(fmt.Sprintf("weighted-%s", region)),
			WeightedRoutingPolicy: &route53record.Route53RecordWeightedRoutingPolicy{
				Weight: jsii.Number(float64(weight)),
			},
			HealthCheckId: healthChecks[region].Id(),
			Alias: &route53record.Route53RecordAlias{
				Name:                 dnsName,
				ZoneId:               elbZoneIds[region],
				EvaluateTargetHealth: jsii.Bool(true),
			},
			Provider: providers["us-east-1"],
		})
	}

	// Output important information
	cdktf.NewTerraformOutput(stack, jsii.String("hosted-zone-id"), &cdktf.TerraformOutputConfig{
		Value:       hostedZone.ZoneId(),
		Description: jsii.String("Route 53 Hosted Zone ID"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("primary-endpoint"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("app.fake-domain.com"),
		Description: jsii.String("Primary application endpoint with failover"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("weighted-endpoint"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("weighted.fake-domain.com"),
		Description: jsii.String("Weighted application endpoint for load distribution"),
	})

	// Output ELB DNS names for each region
	for region, dnsName := range elbDnsNames {
		cdktf.NewTerraformOutput(stack, jsii.String(fmt.Sprintf("elb-dns-%s", region)), &cdktf.TerraformOutputConfig{
			Value:       dnsName,
			Description: jsii.String(fmt.Sprintf("ELB DNS name for %s", region)),
		})
	}

	return stack
}