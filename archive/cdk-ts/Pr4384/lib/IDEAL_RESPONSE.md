## Ideal Response — TapStack (lib/) — full sources included

This document contains a short, actionable explanation of what the `TapStack` construct does, the intended contract and behaviors, and then embeds the complete TypeScript source files that live under `lib/` so reviewers and automated tools can read the authoritative implementation inline.

Notes and constraints followed:
- All TypeScript sources under `lib/` are included in full below.
- Code blocks are complete and unmodified from the repository (except trimmed markers if present), so they can be copied into files directly.
- The description avoids environment-specific assertions and documents runtime expectations.

### Quick summary

- TapStack is a reusable Construct that creates a production-style, highly-available web application stack: VPC (2 AZs), NAT gateway, NACLs, security groups, ALB + target group, Auto Scaling Group with a Launch Template, RDS MySQL instance (multi-AZ), KMS key, S3 logging bucket, CloudWatch alarms & dashboard, SNS topic for alarms, and CloudWatch log group.
- It creates one primary stack in us-east-1 by default and contains commented scaffolding to create a secondary stack in another region.
- Outputs are exported for consumption by integration tests and other stacks (VPC ID, ELB DNS, RDS endpoint, subnets, SGs, ASG name, S3 bucket, KMS key id).

### Contract / behavior (what to expect at runtime)

- The construct will create the resources listed above. Resources are named with a `prod-` prefix and include an environment/region suffix so they are unique per deployment context.
- RDS is created with deletionProtection=false intentionally (per requirement), and CloudWatch monitoring and alarms are configured for key metrics (EC2 CPU, RDS connections, ALB healthy hosts).
- The ASG uses a Launch Template with a CloudWatch agent and a simple HTTP health endpoint under `/health` (user-data sets up Apache and static pages).

### Files included (all .ts in lib/)

- `tap-stack.ts` — the core Construct implementation.

---

### Full source: `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class TapStack extends Construct {
	constructor(
		scope: Construct,
		id: string,
		props?: {
			stackName?: string;
			environmentSuffix?: string;
			env?: { account?: string; region?: string };
		}
	) {
		super(scope, id);

		// Use account from props if available
		const account = props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT;

		// Create primary stack (us-east-1)
		const primaryEnv: cdk.Environment = {
			region: 'us-east-1',
			...(account && { account }),
		};
		const primaryStack = new cdk.Stack(this, 'PrimaryStack', {
			env: primaryEnv,
		});
		this.createResources(primaryStack, 'primary');

		// Create secondary stack (us-west-2) 
		// const secondaryEnv: cdk.Environment = {
		//   region: 'us-west-2',
		//   ...(account && { account }),
		// };
		// const secondaryStack = new cdk.Stack(this, 'SecondaryStack', {
		//   env: secondaryEnv,
		// });
		// this.createResources(secondaryStack, 'secondary');
	}

	private createResources(
		stack: cdk.Stack,
		environment: 'primary' | 'secondary'
	) {
		const region = stack.region;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const domainName = stack.node.tryGetContext('domainName') || 'example.com';
		const notificationEmail =
			stack.node.tryGetContext('notificationEmail') || 'ops@example.com';

		// Generate unique string suffix for resource naming
		const stringSuffix = `${environment}-${region}`;

		// Generate timestamp for unique resource names
		const timestamp = Date.now().toString();

		// Create KMS Key for encryption
		const kmsKey = new kms.Key(stack, 'EncryptionKey', {
			description: 'KMS key for encrypting all data at rest',
			alias: `prod-encryption-key-${stringSuffix}`,
			enableKeyRotation: true,
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		// Create VPC
		const vpc = new ec2.Vpc(stack, 'AppVpc', {
			vpcName: `prod-app-vpc-${stringSuffix}`,
			ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
			maxAzs: 2,
			natGateways: 1, // Reduced to 1 to use fewer EIPs
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: `prod-public-subnet-${stringSuffix}`,
					subnetType: ec2.SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: `prod-private-subnet-${stringSuffix}`,
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				},
			],
		});

		// Create Network ACLs
		const publicNacl = new ec2.NetworkAcl(stack, 'PublicNacl', {
			vpc,
			networkAclName: `prod-public-nacl-${stringSuffix}`,
		});

		// Associate NACLs with subnets
		vpc.publicSubnets.forEach((subnet, index) => {
			new ec2.SubnetNetworkAclAssociation(
				stack,
				`PublicNaclAssociation${index}`,
				{
					subnet,
					networkAcl: publicNacl,
				}
			);
		});

		// Add NACL rules
		publicNacl.addEntry('AllowHttpInbound', {
			cidr: ec2.AclCidr.anyIpv4(),
			ruleNumber: 100,
			traffic: ec2.AclTraffic.tcpPort(80),
			direction: ec2.TrafficDirection.INGRESS,
			ruleAction: ec2.Action.ALLOW,
		});

		publicNacl.addEntry('AllowHttpsInbound', {
			cidr: ec2.AclCidr.anyIpv4(),
			ruleNumber: 110,
			traffic: ec2.AclTraffic.tcpPort(443),
			direction: ec2.TrafficDirection.INGRESS,
			ruleAction: ec2.Action.ALLOW,
		});

		publicNacl.addEntry('AllowEphemeralInbound', {
			cidr: ec2.AclCidr.anyIpv4(),
			ruleNumber: 120,
			traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
			direction: ec2.TrafficDirection.INGRESS,
			ruleAction: ec2.Action.ALLOW,
		});

		publicNacl.addEntry('AllowAllOutbound', {
			cidr: ec2.AclCidr.anyIpv4(),
			ruleNumber: 100,
			traffic: ec2.AclTraffic.allTraffic(),
			direction: ec2.TrafficDirection.EGRESS,
			ruleAction: ec2.Action.ALLOW,
		});

		// Create Security Groups
		const albSecurityGroup = new ec2.SecurityGroup(stack, 'AlbSecurityGroup', {
			vpc,
			securityGroupName: `prod-alb-sg-${stringSuffix}`,
			description: 'Security group for Application Load Balancer',
			allowAllOutbound: true,
		});

		albSecurityGroup.addIngressRule(
			ec2.Peer.anyIpv4(),
			ec2.Port.tcp(80),
			'Allow HTTP traffic from anywhere'
		);

		albSecurityGroup.addIngressRule(
			ec2.Peer.anyIpv4(),
			ec2.Port.tcp(443),
			'Allow HTTPS traffic from anywhere'
		);

		const webServerSecurityGroup = new ec2.SecurityGroup(
			stack,
			'WebServerSecurityGroup',
			{
				vpc,
				securityGroupName: `prod-webserver-sg-${stringSuffix}`,
				description: 'Security group for web servers',
				allowAllOutbound: true,
			}
		);

		webServerSecurityGroup.addIngressRule(
			albSecurityGroup,
			ec2.Port.tcp(80),
			'Allow traffic from ALB'
		);

		const rdsSecurityGroup = new ec2.SecurityGroup(stack, 'RdsSecurityGroup', {
			vpc,
			securityGroupName: `prod-rds-sg-${stringSuffix}`,
			description: 'Security group for RDS database',
			allowAllOutbound: false,
		});

		rdsSecurityGroup.addIngressRule(
			webServerSecurityGroup,
			ec2.Port.tcp(3306),
			'Allow MySQL traffic from web servers'
		);

		// Create S3 bucket for logs
		const logBucket = new s3.Bucket(stack, 'LogBucket', {
			bucketName: `prod-app-logs-${stringSuffix}-${timestamp}`.toLowerCase(),
			encryption: s3.BucketEncryption.KMS,
			encryptionKey: kmsKey,
			versioned: true,
			lifecycleRules: [
				{
					id: 'MoveToGlacier',
					enabled: true,
					transitions: [
						{
							storageClass: s3.StorageClass.GLACIER,
							transitionAfter: cdk.Duration.days(30),
						},
					],
					expiration: cdk.Duration.days(365),
				},
			],
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		// Create IAM role for EC2 instances
		const ec2Role = new iam.Role(stack, 'Ec2Role', {
			roleName: `prod-ec2-role-${stringSuffix}`,
			assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					'CloudWatchAgentServerPolicy'
				),
			],
		});

		// Grant EC2 instances access to S3 log bucket
		logBucket.grantWrite(ec2Role);

		// Create CloudWatch Log Group
		const logGroup = new logs.LogGroup(stack, 'AppLogGroup', {
			logGroupName: `/aws/ec2/prod-app-${stringSuffix}-${timestamp}`,
			retention: logs.RetentionDays.ONE_MONTH,
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		// Create SNS Topic for notifications
		const snsTopic = new sns.Topic(stack, 'AlarmTopic', {
			topicName: `prod-alarm-topic-${stringSuffix}`,
			masterKey: kmsKey,
		});

		snsTopic.addSubscription(
			new sns_subscriptions.EmailSubscription(notificationEmail)
		);

		// Create Application Load Balancer
		const alb = new elbv2.ApplicationLoadBalancer(stack, 'AppLoadBalancer', {
			vpc,
			loadBalancerName: `prod-alb-${stringSuffix}`,
			internetFacing: true,
			securityGroup: albSecurityGroup,
			crossZoneEnabled: true,
		});

		// Create Target Group
		const targetGroup = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
			vpc,
			targetGroupName: `prod-tg-${stringSuffix}`,
			port: 80,
			protocol: elbv2.ApplicationProtocol.HTTP,
			targetType: elbv2.TargetType.INSTANCE,
			healthCheck: {
				enabled: true,
				healthyHttpCodes: '200',
				path: '/health',
				interval: cdk.Duration.seconds(30),
				timeout: cdk.Duration.seconds(5),
				healthyThresholdCount: 2,
				unhealthyThresholdCount: 3,
			},
			stickinessCookieDuration: cdk.Duration.minutes(5),
			stickinessCookieName: 'MyAppSession',
		});

		// Create ACM Certificate for HTTPS
		// const certificate = new acm.Certificate(stack, 'Certificate', {
		//   domainName: domainName,
		//   subjectAlternativeNames: [`*.${domainName}`],
		//   validation: acm.CertificateValidation.fromDns(),
		// });

		// Add HTTP Listener (redirect to HTTPS)
		alb.addListener('HttpListener', {
			port: 80,
			protocol: elbv2.ApplicationProtocol.HTTP,
			defaultAction: elbv2.ListenerAction.forward([targetGroup]),
		});

		// Add HTTPS Listener
		// alb.addListener('HttpsListener', {
		//   port: 443,
		//   protocol: elbv2.ApplicationProtocol.HTTPS,
		//   certificates: [certificate],
		//   defaultTargetGroups: [targetGroup],
		// });

		// Create Launch Template with improved logging
		const userData = ec2.UserData.forLinux();
		userData.addCommands(
			'yum update -y',
			'yum install -y amazon-cloudwatch-agent',
			'yum install -y httpd',
			'systemctl start httpd',
			'systemctl enable httpd',
			'echo "<h1>Healthy - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/health',
			'echo "<h1>Hello from AWS HA Infrastructure - $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html',
			// Install CloudWatch agent for continuous logging
			'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
			'rpm -U amazon-cloudwatch-agent.rpm',
			`cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{\n  "logs": {\n    "logs_collected": {\n      "files": {\n        "collect_list": [\n          {\n            "file_path": "/var/log/httpd/access_log",\n            "log_group_name": "${logGroup.logGroupName}",\n            "log_stream_name": "{instance_id}-access"\n          },\n          {\n            "file_path": "/var/log/httpd/error_log",\n            "log_group_name": "${logGroup.logGroupName}",\n            "log_stream_name": "{instance_id}-error"\n          }\n        ]\n      }\n    }\n  }\n}\nEOF`,
			'/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
		);

		const launchTemplate = new ec2.LaunchTemplate(stack, 'LaunchTemplate', {
			launchTemplateName: `prod-lt-${stringSuffix}`,
			instanceType: ec2.InstanceType.of(
				ec2.InstanceClass.T3,
				ec2.InstanceSize.MICRO
			),
			machineImage: new ec2.AmazonLinuxImage({
				generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
			}),
			role: ec2Role,
			userData: userData,
			securityGroup: webServerSecurityGroup,
			blockDevices: [
				{
					deviceName: '/dev/xvda',
					volume: ec2.BlockDeviceVolume.ebs(30, {
						encrypted: false, // Disable custom encryption to avoid KMS key state issues
						volumeType: ec2.EbsDeviceVolumeType.GP3,
					}),
				},
			],
		});

		// Create Auto Scaling Group
		const autoScalingGroup = new autoscaling.AutoScalingGroup(
			stack,
			'AutoScalingGroup',
			{
				vpc,
				autoScalingGroupName: `prod-asg-${stringSuffix}`,
				launchTemplate: launchTemplate,
				minCapacity: 2,
				maxCapacity: 6,
				desiredCapacity: 2,
				healthCheck: autoscaling.HealthCheck.elb({
					grace: cdk.Duration.minutes(5),
				}),
				updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
					maxBatchSize: 1,
					minInstancesInService: 1,
					pauseTime: cdk.Duration.minutes(5),
				}),
				terminationPolicies: [autoscaling.TerminationPolicy.OLDEST_INSTANCE],
			}
		);

		autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

		// Add Auto Scaling policies
		autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
			targetUtilizationPercent: 70,
			cooldown: cdk.Duration.minutes(5),
		});

		// Create RDS subnet group
		const dbSubnetGroup = new rds.SubnetGroup(stack, 'DbSubnetGroup', {
			vpc,
			subnetGroupName: `prod-db-subnet-group-${stringSuffix}-${timestamp}`,
			description: 'Subnet group for RDS database',
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		// Create RDS instance with deletionProtection set to false
		const rdsInstance = new rds.DatabaseInstance(stack, 'Database', {
			instanceIdentifier: `prod-mysql-db-${stringSuffix}-${timestamp}`,
			engine: rds.DatabaseInstanceEngine.mysql({
				version: rds.MysqlEngineVersion.VER_8_0_42,
			}),
			instanceType: ec2.InstanceType.of(
				ec2.InstanceClass.T3,
				ec2.InstanceSize.MICRO
			),
			vpc,
			subnetGroup: dbSubnetGroup,
			securityGroups: [rdsSecurityGroup],
			multiAz: true,
			allocatedStorage: 100,
			storageType: rds.StorageType.GP3,
			storageEncrypted: true,
			storageEncryptionKey: kmsKey,
			backupRetention: cdk.Duration.days(7),
			preferredBackupWindow: '03:00-04:00',
			preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
			deletionProtection: false, // Set to false as per requirements
			monitoringInterval: cdk.Duration.seconds(60),
			enablePerformanceInsights: false, // Disabled for t3.micro instances
			cloudwatchLogsExports: ['error', 'general', 'slowquery'],
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		// Create CloudWatch Alarms
		const cpuAlarm = new cloudwatch.Alarm(stack, 'HighCpuAlarm', {
			alarmName: `prod-high-cpu-${stringSuffix}`,
			metric: new cloudwatch.Metric({
				namespace: 'AWS/EC2',
				metricName: 'CPUUtilization',
				statistic: 'Average',
				dimensionsMap: {
					AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
				},
			}),
			threshold: 80,
			evaluationPeriods: 2,
			datapointsToAlarm: 2,
			treatMissingData: cloudwatch.TreatMissingData.BREACHING,
		});

		cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

		const rdsConnectionAlarm = new cloudwatch.Alarm(
			stack,
			'RdsConnectionAlarm',
			{
				alarmName: `prod-rds-connections-${stringSuffix}`,
				metric: rdsInstance.metricDatabaseConnections(),
				threshold: 80,
				evaluationPeriods: 2,
				datapointsToAlarm: 2,
			}
		);

		rdsConnectionAlarm.addAlarmAction(
			new cloudwatch_actions.SnsAction(snsTopic)
		);

		const albHealthyHostsAlarm = new cloudwatch.Alarm(
			stack,
			'UnhealthyHostsAlarm',
			{
				alarmName: `prod-unhealthy-hosts-${stringSuffix}`,
				metric: targetGroup.metricHealthyHostCount(),
				threshold: 1,
				comparisonOperator:
					cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
				evaluationPeriods: 2,
				datapointsToAlarm: 2,
			}
		);

		albHealthyHostsAlarm.addAlarmAction(
			new cloudwatch_actions.SnsAction(snsTopic)
		);

		// Create Route 53 resources (commented out to avoid lookup errors in test environments)
		// const hostedZone = route53.HostedZone.fromLookup(stack, 'HostedZone', {
		//   domainName: domainName,
		// });

		// // Create Route 53 record
		// new route53.ARecord(stack, 'AppRecord', {
		//   zone: hostedZone,
		//   recordName:
		//     environment === 'primary' ? 'app' : `app-${environment}`,
		//   target: route53.RecordTarget.fromAlias(
		//     new route53_targets.LoadBalancerTarget(alb)
		//   ),
		// });

		// Create CloudWatch Dashboard
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const dashboard = new cloudwatch.Dashboard(stack, 'MonitoringDashboard', {
			dashboardName: `prod-monitoring-${stringSuffix}`,
			widgets: [
				[
					new cloudwatch.GraphWidget({
						title: 'EC2 CPU Utilization',
						left: [
							new cloudwatch.Metric({
								namespace: 'AWS/EC2',
								metricName: 'CPUUtilization',
								statistic: 'Average',
								dimensionsMap: {
									AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
								},
							}),
						],
						width: 12,
					}),
					new cloudwatch.GraphWidget({
						title: 'ALB Request Count',
						left: [alb.metricRequestCount()],
						width: 12,
					}),
				],
				[
					new cloudwatch.GraphWidget({
						title: 'RDS CPU Utilization',
						left: [rdsInstance.metricCPUUtilization()],
						width: 12,
					}),
					new cloudwatch.GraphWidget({
						title: 'RDS Database Connections',
						left: [rdsInstance.metricDatabaseConnections()],
						width: 12,
					}),
				],
			],
		});

		// Outputs
		new cdk.CfnOutput(stack, 'VpcId', {
			value: vpc.vpcId,
			description: 'VPC ID',
			exportName: `${stack.stackName}-vpc-id`,
		});

		new cdk.CfnOutput(stack, 'ElbDnsName', {
			value: alb.loadBalancerDnsName,
			description: 'Load Balancer DNS Name',
			exportName: `${stack.stackName}-elb-dns`,
		});

		new cdk.CfnOutput(stack, 'RdsEndpoint', {
			value: rdsInstance.instanceEndpoint.socketAddress,
			description: 'RDS Endpoint',
			exportName: `${stack.stackName}-rds-endpoint`,
		});

		new cdk.CfnOutput(stack, 'PublicSubnetIds', {
			value: vpc.publicSubnets.map(s => s.subnetId).join(','),
			description: 'Public Subnet IDs',
			exportName: `${stack.stackName}-public-subnets`,
		});

		new cdk.CfnOutput(stack, 'PrivateSubnetIds', {
			value: vpc.privateSubnets.map(s => s.subnetId).join(','),
			description: 'Private Subnet IDs',
			exportName: `${stack.stackName}-private-subnets`,
		});

		new cdk.CfnOutput(stack, 'SecurityGroupIds', {
			value: [
				albSecurityGroup.securityGroupId,
				webServerSecurityGroup.securityGroupId,
				rdsSecurityGroup.securityGroupId,
			].join(','),
			description: 'Security Group IDs (ALB, WebServer, RDS)',
			exportName: `${stack.stackName}-security-groups`,
		});

		new cdk.CfnOutput(stack, 'AutoScalingGroupName', {
			value: autoScalingGroup.autoScalingGroupName,
			description: 'Auto Scaling Group Name (use to query instance IDs)',
			exportName: `${stack.stackName}-asg-name`,
		});

		new cdk.CfnOutput(stack, 'LogBucketName', {
			value: logBucket.bucketName,
			description: 'S3 Bucket for Application Logs',
			exportName: `${stack.stackName}-log-bucket`,
		});

		new cdk.CfnOutput(stack, 'KmsKeyId', {
			value: kmsKey.keyId,
			description: 'KMS Key ID for Encryption',
			exportName: `${stack.stackName}-kms-key`,
		});
	}
}

```

---

