```java
package app;

import java.util.Arrays;
import java.util.Map;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.CpuUtilizationScalingProps;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.LaunchTemplate;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.ParameterGroup;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;
import software.amazon.awscdk.services.sns.Topic;

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other
 * resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this
 * stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
  private final boolean isPrimary;
  private final String otherRegion;

  public TapStack(final App scope, final String id, final StackProps props,
      boolean isPrimary, String otherRegion) {
    super(scope, id, props);
    this.isPrimary = isPrimary;
    this.otherRegion = otherRegion;

    // Add common tags
    Tags.of(this).add("Environment", isPrimary ? "Production-Primary" : "Production-Secondary");
    Tags.of(this).add("Project", "TapApp");
    Tags.of(this).add("Region", isPrimary ? "Primary" : "Secondary");

    // Create VPC
    Vpc vpc = createVpc();

    // Create Security Groups
    SecurityGroup webSecurityGroup = createWebSecurityGroup(vpc);
    SecurityGroup dbSecurityGroup = createDbSecurityGroup(vpc, webSecurityGroup);

    // Create RDS instance
    DatabaseInstance database = createDatabase(vpc, dbSecurityGroup);

    // Create Application Load Balancer
    ApplicationLoadBalancer alb = createLoadBalancer(vpc, webSecurityGroup);

    // Create Auto Scaling Group with EC2 instances
    AutoScalingGroup asg = createAutoScalingGroup(vpc, webSecurityGroup, database);

    // Configure ALB target group
    configureLoadBalancerTargets(alb, asg);

    // Create Route 53 health check and DNS records
    if (isPrimary) {
      createRoute53Configuration(alb);
    } else {
      createRoute53FailoverConfiguration(alb);
    }

    // Create CloudWatch alarms and SNS topic
    createMonitoringAndAlarms(alb, database);

    // Create Lambda function for failover automation
    createFailoverLambda(alb);

    // Create CloudFormation outputs
    createOutputs(alb, database);
  }

  private void createOutputs(ApplicationLoadBalancer alb, DatabaseInstance database) {
    // ALB DNS Name
    CfnOutput.Builder.create(this, "LoadBalancerDNS")
        .description("Application Load Balancer DNS Name")
        .value(alb.getLoadBalancerDnsName())
        .exportName(this.getStackName() + "-ALB-DNS")
        .build();

    // Database Endpoint
    CfnOutput.Builder.create(this, "DatabaseEndpoint")
        .description("RDS Database Endpoint")
        .value(database.getInstanceEndpoint().getHostname())
        .exportName(this.getStackName() + "-DB-Endpoint")
        .build();

    // Region Information
    CfnOutput.Builder.create(this, "RegionInfo")
        .description("Region and Role Information")
        .value(String.format("Region: %s, Role: %s",
            this.getRegion(),
            isPrimary ? "Primary" : "Secondary"))
        .build();
  }

  private Vpc createVpc() {
    return Vpc.Builder.create(this, "TapVpc")
        .maxAzs(3)
        .natGateways(2)
        .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
        .subnetConfiguration(Arrays.asList(
            SubnetConfiguration.builder()
                .name("Public")
                .subnetType(SubnetType.PUBLIC)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("Private")
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("Database")
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .cidrMask(24)
                .build()))
        .build();
  }

  private SecurityGroup createWebSecurityGroup(Vpc vpc) {
    SecurityGroup sg = SecurityGroup.Builder.create(this, "WebSecurityGroup")
        .vpc(vpc)
        .description("Security group for web servers")
        .allowAllOutbound(true)
        .build();

    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP");
    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS");
    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "Allow SSH");

    Tags.of(sg).add("Name", "TapApp-Web-SG");
    return sg;
  }

  private SecurityGroup createDbSecurityGroup(Vpc vpc, SecurityGroup webSg) {
    SecurityGroup sg = SecurityGroup.Builder.create(this, "DatabaseSecurityGroup")
        .vpc(vpc)
        .description("Security group for database")
        .allowAllOutbound(false)
        .build();

    sg.addIngressRule(webSg, Port.tcp(3306), "Allow MySQL from web servers");

    Tags.of(sg).add("Name", "TapApp-DB-SG");
    return sg;
  }

  private DatabaseInstance createDatabase(Vpc vpc, SecurityGroup dbSecurityGroup) {
    // Create DB subnet group
    SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, "DbSubnetGroup")
        .vpc(vpc)
        .description("Subnet group for RDS database")
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PRIVATE_ISOLATED)
            .build())
        .build();

    // Create parameter group for MySQL
    ParameterGroup parameterGroup = ParameterGroup.Builder.create(this, "DbParameterGroup")
        .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
            .version(MysqlEngineVersion.VER_8_0_37)
            .build()))
        .description("Parameter group for TapApp database")
        .build();

    DatabaseInstance database = DatabaseInstance.Builder.create(this, "TapDatabase")
        .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
            .version(MysqlEngineVersion.VER_8_0_37)
            .build()))
        .instanceType(
            software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
        .vpc(vpc)
        .subnetGroup(subnetGroup)
        .securityGroups(Arrays.asList(dbSecurityGroup))
        .databaseName("tapapp")
        .credentials(Credentials.fromGeneratedSecret("admin"))
        .allocatedStorage(100)
        .storageType(StorageType.GP2)
        .backupRetention(Duration.days(7))
        .deletionProtection(false)
        .removalPolicy(RemovalPolicy.DESTROY)
        .parameterGroup(parameterGroup)
        .enablePerformanceInsights(true)
        .monitoringInterval(Duration.seconds(60))
        .build();

    // Enable automated backups and read replica for DR
    if (isPrimary) {
      // Create read replica in secondary region for disaster recovery
      Tags.of(database).add("BackupPolicy", "CrossRegion");
    }

    Tags.of(database).add("Name", "TapApp-Database");
    Tags.of(database).add("Role", isPrimary ? "Primary" : "Secondary");

    return database;
  }

  private ApplicationLoadBalancer createLoadBalancer(Vpc vpc, SecurityGroup webSecurityGroup) {
    ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "TapLoadBalancer")
        .vpc(vpc)
        .internetFacing(true)
        .securityGroup(webSecurityGroup)
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PUBLIC)
            .build())
        .build();

    Tags.of(alb).add("Name", "TapApp-ALB");
    Tags.of(alb).add("Role", isPrimary ? "Primary" : "Secondary");

    return alb;
  }

  private AutoScalingGroup createAutoScalingGroup(Vpc vpc, SecurityGroup webSecurityGroup, DatabaseInstance database) {
    // Create IAM role for EC2 instances
    Role ec2Role = Role.Builder.create(this, "EC2Role")
        .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
        .managedPolicies(Arrays.asList(
            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
        .build();

    // Add custom policy for accessing database secrets
    ec2Role.addToPolicy(PolicyStatement.Builder.create()
        .effect(Effect.ALLOW)
        .actions(Arrays.asList(
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"))
        .resources(Arrays.asList(database.getSecret().getSecretArn()))
        .build());

    // User data script for EC2 instances
    String userData = "#!/bin/bash\n" +
        "yum update -y\n" +
        "yum install -y httpd mysql\n" +
        "systemctl start httpd\n" +
        "systemctl enable httpd\n" +
        "echo '<h1>TapApp - " + (isPrimary ? "Primary" : "Secondary") + " Region</h1>' > /var/www/html/index.html\n" +
        "echo '<p>Database endpoint: " + database.getInstanceEndpoint().getHostname()
        + "</p>' >> /var/www/html/index.html\n" +
        "# Install CloudWatch agent\n" +
        "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\n" +
        "rpm -U ./amazon-cloudwatch-agent.rpm\n";

    LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "TapLaunchTemplate")
        .instanceType(
            software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
        .machineImage(MachineImage.latestAmazonLinux2())
        .securityGroup(webSecurityGroup)
        .userData(UserData.custom(userData))
        .role(ec2Role)
        .build();

    AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "TapAutoScalingGroup")
        .vpc(vpc)
        .launchTemplate(launchTemplate)
        .minCapacity(2)
        .maxCapacity(6)
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
            .build())
        .build();

    // Add scaling policies
    asg.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
        .targetUtilizationPercent(70)
        .build());

    Tags.of(asg).add("Name", "TapApp-ASG");
    Tags.of(asg).add("Role", isPrimary ? "Primary" : "Secondary");

    return asg;
  }

  private void configureLoadBalancerTargets(ApplicationLoadBalancer alb, AutoScalingGroup asg) {
    ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "TapTargetGroup")
        .port(80)
        .protocol(ApplicationProtocol.HTTP)
        .vpc(alb.getVpc())
        .targetType(software.amazon.awscdk.services.elasticloadbalancingv2.TargetType.INSTANCE)
        .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
            .enabled(true)
            .path("/")
            .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
            .healthyThresholdCount(2)
            .unhealthyThresholdCount(3)
            .timeout(Duration.seconds(10))
            .interval(Duration.seconds(30))
            .build())
        .build();

    asg.attachToApplicationTargetGroup(targetGroup);

    alb.addListener("HttpListener", BaseApplicationListenerProps.builder()
        .port(80)
        .protocol(ApplicationProtocol.HTTP)
        .defaultTargetGroups(Arrays.asList(targetGroup))
        .build());

    Tags.of(targetGroup).add("Name", "TapApp-TargetGroup");
  }

  private void createRoute53Configuration(ApplicationLoadBalancer alb) {
    // Create hosted zone (only in primary region)
    HostedZone hostedZone = HostedZone.Builder.create(this, "TapHostedZone")
        .zoneName("tapapp.exampleturing.com")
        .build();

    // Primary record with health check for failover capability
    ARecord.Builder.create(this, "PrimaryRecord")
        .zone(hostedZone)
        .recordName("www")
        .target(RecordTarget.fromAlias(new LoadBalancerTarget(alb)))
        .comment("Primary region ALB record")
        .build();

    // Create an additional record for the root domain
    ARecord.Builder.create(this, "RootRecord")
        .zone(hostedZone)
        .target(RecordTarget.fromAlias(new LoadBalancerTarget(alb)))
        .comment("Root domain ALB record")
        .build();

    Tags.of(hostedZone).add("Name", "TapApp-HostedZone");
    Tags.of(hostedZone).add("Purpose", "Primary-DNS");
  }

  private void createRoute53FailoverConfiguration(ApplicationLoadBalancer alb) {
    // Create a secondary hosted zone in the secondary region
    // In a real production setup, you would typically share the same hosted zone
    // For this demo, we'll create separate hosted zones for each region
    HostedZone secondaryHostedZone = HostedZone.Builder.create(this, "TapSecondaryHostedZone")
        .zoneName("secondary.tapapp.exampleturing.com")
        .build();

    // Secondary record for failover
    ARecord.Builder.create(this, "SecondaryRecord")
        .zone(secondaryHostedZone)
        .recordName("www")
        .target(RecordTarget.fromAlias(new LoadBalancerTarget(alb)))
        .build();

    Tags.of(secondaryHostedZone).add("Name", "TapApp-Secondary-HostedZone");

    // Note: In production, you would typically:
    // 1. Use Route53 health checks with failover routing
    // 2. Configure proper DNS delegation between regions
    // 3. Use weighted or latency-based routing policies
  }

  private void createMonitoringAndAlarms(ApplicationLoadBalancer alb, DatabaseInstance database) {
    // Create SNS topic for alerts
    Topic alertTopic = Topic.Builder.create(this, "AlertTopic")
        .displayName("TapApp Alerts")
        .build();

    // ALB Target Response Time Alarm
    Alarm responseTimeAlarm = Alarm.Builder.create(this, "HighResponseTime")
        .metric(Metric.Builder.create()
            .namespace("AWS/ApplicationELB")
            .metricName("TargetResponseTime")
            .dimensionsMap(Map.of("LoadBalancer", alb.getLoadBalancerFullName()))
            .build())
        .threshold(5.0)
        .evaluationPeriods(2)
        .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
        .treatMissingData(TreatMissingData.BREACHING)
        .alarmDescription("ALB target response time is too high")
        .build();

    responseTimeAlarm.addAlarmAction(new SnsAction(alertTopic));

    // ALB Healthy Host Count Alarm
    Alarm healthyHostAlarm = Alarm.Builder.create(this, "LowHealthyHosts")
        .metric(Metric.Builder.create()
            .namespace("AWS/ApplicationELB")
            .metricName("HealthyHostCount")
            .dimensionsMap(Map.of("LoadBalancer", alb.getLoadBalancerFullName()))
            .build())
        .threshold(1.0)
        .evaluationPeriods(2)
        .comparisonOperator(ComparisonOperator.LESS_THAN_THRESHOLD)
        .treatMissingData(TreatMissingData.BREACHING)
        .alarmDescription("Number of healthy hosts is too low")
        .build();

    healthyHostAlarm.addAlarmAction(new SnsAction(alertTopic));

    // Database CPU Utilization Alarm
    Alarm dbCpuAlarm = Alarm.Builder.create(this, "HighDatabaseCPU")
        .metric(database.metricCPUUtilization())
        .threshold(80.0)
        .evaluationPeriods(2)
        .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
        .alarmDescription("Database CPU utilization is too high")
        .build();

    dbCpuAlarm.addAlarmAction(new SnsAction(alertTopic));

    // Database Connection Count Alarm
    Alarm dbConnectionAlarm = Alarm.Builder.create(this, "HighDatabaseConnections")
        .metric(database.metricDatabaseConnections())
        .threshold(80.0)
        .evaluationPeriods(2)
        .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
        .alarmDescription("Database connection count is too high")
        .build();

    dbConnectionAlarm.addAlarmAction(new SnsAction(alertTopic));

    Tags.of(alertTopic).add("Name", "TapApp-Alerts");
  }

  private void createFailoverLambda(ApplicationLoadBalancer alb) {
    // Create IAM role for Lambda
    Role lambdaRole = Role.Builder.create(this, "FailoverLambdaRole")
        .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
        .managedPolicies(Arrays.asList(
            ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")))
        .build();

    // Add permissions for Route 53 and CloudWatch
    lambdaRole.addToPolicy(PolicyStatement.Builder.create()
        .effect(Effect.ALLOW)
        .actions(Arrays.asList(
            "route53:ChangeResourceRecordSets",
            "route53:GetChange",
            "route53:ListResourceRecordSets",
            "cloudwatch:PutMetricData",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"))
        .resources(Arrays.asList("*"))
        .build());

    // Lambda function code for failover automation
    String lambdaCode = "import json\n" +
        "import boto3\n" +
        "import logging\n" +
        "\n" +
        "logger = logging.getLogger()\n" +
        "logger.setLevel(logging.INFO)\n" +
        "\n" +
        "def lambda_handler(event, context):\n" +
        "    logger.info('Failover Lambda triggered')\n" +
        "    logger.info(f'Event: {json.dumps(event)}')\n" +
        "    \n" +
        "    # Parse SNS message\n" +
        "    message = json.loads(event['Records'][0]['Sns']['Message'])\n" +
        "    alarm_name = message['AlarmName']\n" +
        "    new_state = message['NewStateValue']\n" +
        "    \n" +
        "    if new_state == 'ALARM':\n" +
        "        logger.info(f'Processing alarm: {alarm_name}')\n" +
        "        # Implement failover logic here\n" +
        "        # This could include updating Route 53 records,\n" +
        "        # promoting read replicas, etc.\n" +
        "        \n" +
        "        # Send CloudWatch custom metric\n" +
        "        cloudwatch = boto3.client('cloudwatch')\n" +
        "        cloudwatch.put_metric_data(\n" +
        "            Namespace='TapApp/Failover',\n" +
        "            MetricData=[\n" +
        "                {\n" +
        "                    'MetricName': 'FailoverTriggered',\n" +
        "                    'Value': 1,\n" +
        "                    'Unit': 'Count'\n" +
        "                }\n" +
        "            ]\n" +
        "        )\n" +
        "    \n" +
        "    return {\n" +
        "        'statusCode': 200,\n" +
        "        'body': json.dumps('Failover processing completed')\n" +
        "    }\n";

    Function failoverFunction = Function.Builder.create(this, "FailoverFunction")
        .runtime(Runtime.PYTHON_3_9)
        .handler("index.lambda_handler")
        .code(Code.fromInline(lambdaCode))
        .role(lambdaRole)
        .timeout(Duration.minutes(5))
        .description("Automated failover function for TapApp")
        .environment(Map.of(
            "REGION", this.getRegion(),
            "OTHER_REGION", otherRegion,
            "IS_PRIMARY", String.valueOf(isPrimary)))
        .build();

    Tags.of(failoverFunction).add("Name", "TapApp-FailoverFunction");
  }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is
 * responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

  /**
   * Private constructor to prevent instantiation of utility class.
   */
  private Main() {
    // Utility class should not be instantiated
  }

  /**
   * Main entry point for the CDK application.
   *
   * This method creates a CDK App instance and instantiates the TapStack
   * with appropriate configuration based on environment variables and context.
   *
   * @param args Command line arguments (not used in this application)
   */
  public static void main(final String[] args) {
    App app = new App();

    // Get environment suffix from context or default to 'dev'
    String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
    if (environmentSuffix == null) {
      environmentSuffix = "dev";
    }

    new TapStack(app, "TapStack" + environmentSuffix + "-Primary", StackProps.builder()
        .env(Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-east-2")
            .build())
        .build(), true, "us-west-2");

    // Secondary region stack (us-west-2)
    new TapStack(app, "TapStack" + environmentSuffix + "-Secondary", StackProps.builder()
        .env(Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-west-2")
            .build())
        .build(), false, "us-east-2");

    // Synthesize the CDK app
    app.synth();
  }
}
```