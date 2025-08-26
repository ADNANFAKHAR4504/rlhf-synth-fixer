import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.ec2.ISubnet;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.ParameterGroup;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.subscriptions.EmailSubscription;

public class Main {
  public static void main(final String[] args) {
    App app = new App();

    new TapStack(app, "TapStack", StackProps.builder()
        .env(Environment.builder()
            .region("us-east-2")
            .build())
        .build());

    app.synth();
  }
}

class TapStack extends Stack {
  private static final String PROJECT_NAME = "webapp";
  private static final String ENVIRONMENT = "prod";
  private static final String OFFICE_CIDR = "203.0.113.0/24"; // Replace with your office CIDR

  public TapStack(final App scope, final String id, final StackProps props) {
    super(scope, id, props);

    // Apply consistent tags to all resources
    Tags.of(this).add("Project", PROJECT_NAME);
    Tags.of(this).add("Environment", ENVIRONMENT);
    Tags.of(this).add("ManagedBy", "CDK");
    Tags.of(this).add("CostCenter", "DevOps");

    // Create KMS key for encryption
    Key kmsKey = createKmsKey();

    // Create VPC with public and private subnets
    Vpc vpc = createVpc();

    // Create Security Groups
    SecurityGroup webSecurityGroup = createWebSecurityGroup(vpc);
    SecurityGroup rdsSecurityGroup = createRdsSecurityGroup(vpc, webSecurityGroup);

    // Create S3 bucket for CloudTrail logs
    Bucket cloudTrailBucket = createCloudTrailBucket(kmsKey);

    // Set up CloudTrail
    createCloudTrail(cloudTrailBucket, kmsKey);

    // Create SNS topic for alerts
    Topic alertTopic = createAlertTopic();

    // Create IAM roles
    Role ec2Role = createEc2Role();

    // Launch EC2 instances in private subnets
    List<Instance> ec2Instances = createEc2Instances(vpc, webSecurityGroup, ec2Role);

    // Create CloudWatch alarms for EC2 CPU monitoring
    createCpuAlarms(ec2Instances, alertTopic);

    // Create RDS instance with multi-AZ and encryption
    createRdsInstance(vpc, rdsSecurityGroup, kmsKey);
  }

  private Key createKmsKey() {
    return Key.Builder.create(this, getResourceName("kms-key"))
        .description("KMS key for encrypting resources")
        .enableKeyRotation(true)
        .build();
  }

  private Vpc createVpc() {
    return Vpc.Builder.create(this, getResourceName("vpc"))
        .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
        .maxAzs(2)
        .subnetConfiguration(Arrays.asList(
            SubnetConfiguration.builder()
                .name(getResourceName("public-subnet"))
                .subnetType(SubnetType.PUBLIC)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name(getResourceName("private-subnet"))
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .cidrMask(24)
                .build()))
        .natGateways(2) // One NAT gateway per public subnet
        .build();
  }

  private SecurityGroup createWebSecurityGroup(Vpc vpc) {
    SecurityGroup sg = SecurityGroup.Builder.create(this, getResourceName("web-sg"))
        .vpc(vpc)
        .description("Security group for web servers")
        .allowAllOutbound(true)
        .build();

    // Allow HTTP from office CIDR
    sg.addIngressRule(
        Peer.ipv4(OFFICE_CIDR),
        Port.tcp(80),
        "Allow HTTP from office");

    // Allow HTTPS from office CIDR
    sg.addIngressRule(
        Peer.ipv4(OFFICE_CIDR),
        Port.tcp(443),
        "Allow HTTPS from office");

    return sg;
  }

  private SecurityGroup createRdsSecurityGroup(Vpc vpc, SecurityGroup webSg) {
    SecurityGroup sg = SecurityGroup.Builder.create(this, getResourceName("rds-sg"))
        .vpc(vpc)
        .description("Security group for RDS instances")
        .allowAllOutbound(false)
        .build();

    // Allow MySQL/Aurora access from web security group
    sg.addIngressRule(
        Peer.securityGroupId(webSg.getSecurityGroupId()),
        Port.tcp(3306),
        "Allow MySQL access from web servers");

    return sg;
  }

  private Bucket createCloudTrailBucket(Key kmsKey) {
    return Bucket.Builder.create(this, getResourceName("cloudtrail-bucket"))
        .bucketName(getResourceName("cloudtrail-logs"))
        .encryption(BucketEncryption.KMS)
        .encryptionKey(kmsKey)
        .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
        .versioned(true)
        .lifecycleRules(Arrays.asList(
            LifecycleRule.builder()
                .id("DeleteOldLogs")
                .enabled(true)
                .expiration(Duration.days(90))
                .build()))
        .build();
  }

  private void createCloudTrail(Bucket bucket, Key kmsKey) {
    Trail.Builder.create(this, getResourceName("cloudtrail"))
        .trailName(getResourceName("audit-trail"))
        .bucket(bucket)
        .includeGlobalServiceEvents(true)
        .isMultiRegionTrail(true)
        .enableFileValidation(true)
        .build();
  }

  private Topic createAlertTopic() {
    Topic topic = Topic.Builder.create(this, getResourceName("alert-topic"))
        .topicName(getResourceName("devops-alerts"))
        .displayName("DevOps Team Alerts")
        .build();

    // Add email subscription (replace with actual DevOps team email)
    topic.addSubscription(EmailSubscription.Builder.create("devops@company.com").build());

    return topic;
  }

  private Role createEc2Role() {
    return Role.Builder.create(this, getResourceName("ec2-role"))
        .roleName(getResourceName("ec2-instance-role"))
        .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
        .managedPolicies(Arrays.asList(
            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
        .inlinePolicies(Map.of(
            "S3AccessPolicy", PolicyDocument.Builder.create()
                .statements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                        .resources(Arrays.asList("arn:aws:s3:::webapp-*/*"))
                        .build()))
                .build()))
        .build();
  }

  private List<Instance> createEc2Instances(Vpc vpc, SecurityGroup sg, Role role) {
    List<Instance> instances = new ArrayList<>();

    // Get private subnets
    List<ISubnet> privateSubnets = vpc.getPrivateSubnets();

    for (int i = 0; i < privateSubnets.size(); i++) {
      Instance instance = Instance.Builder.create(this, getResourceName("web-instance-" + (i + 1)))
          .instanceName(getResourceName("web-server-" + (i + 1)))
          .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
          .machineImage(MachineImage.latestAmazonLinux2())
          .vpc(vpc)
          .vpcSubnets(SubnetSelection.builder()
              .subnets(Arrays.asList(privateSubnets.get(i)))
              .build())
          .securityGroup(sg)
          .role(role)
          .userData(UserData.forLinux())
          .build();

      instances.add(instance);
    }

    return instances;
  }

  private void createCpuAlarms(List<Instance> instances, Topic alertTopic) {
    for (int i = 0; i < instances.size(); i++) {
      Instance instance = instances.get(i);

      Alarm.Builder.create(this, getResourceName("cpu-alarm-" + (i + 1)))
          .alarmName(getResourceName("high-cpu-" + (i + 1)))
          .alarmDescription("CPU utilization exceeds 80% for " + instance.getInstanceId())
          .metric(Metric.Builder.create()
              .namespace("AWS/EC2")
              .metricName("CPUUtilization")
              .dimensionsMap(Map.of("InstanceId", instance.getInstanceId()))
              .statistic("Average")
              .period(Duration.minutes(5))
              .build())
          .threshold(80.0)
          .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
          .evaluationPeriods(2)
          .treatMissingData(TreatMissingData.BREACHING)
          .build()
          .addAlarmAction(new SnsAction(alertTopic));
    }
  }

  private void createRdsInstance(Vpc vpc, SecurityGroup sg, Key kmsKey) {
    // Create subnet group for RDS
    SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, getResourceName("rds-subnet-group"))
        .subnetGroupName(getResourceName("rds-subnets"))
        .description("Subnet group for RDS instances")
        .vpc(vpc)
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
            .build())
        .build();

    // Create parameter group
    ParameterGroup parameterGroup = ParameterGroup.Builder.create(this, getResourceName("rds-params"))
        .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
            .version(MysqlEngineVersion.VER_8_0_35)
            .build()))
        .description("Custom parameter group for MySQL")
        .build();

    // Create RDS instance
    DatabaseInstance.Builder.create(this, getResourceName("rds-instance"))
        .instanceIdentifier(getResourceName("mysql-db"))
        .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
            .version(MysqlEngineVersion.VER_8_0_35)
            .build()))
        .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
        .vpc(vpc)
        .subnetGroup(subnetGroup)
        .securityGroups(Arrays.asList(sg))
        .multiAz(true) // Multi-AZ deployment
        .storageEncrypted(true) // Encrypted storage
        .storageEncryptionKey(kmsKey)
        .parameterGroup(parameterGroup)
        .allocatedStorage(20)
        .maxAllocatedStorage(100)
        .storageType(StorageType.GP2)
        .backupRetention(Duration.days(7))
        .deletionProtection(true)
        .databaseName("webapp")
        .credentials(Credentials.fromGeneratedSecret("admin"))
        .monitoringInterval(Duration.minutes(1))
        .enablePerformanceInsights(true)
        .build();
  }

  private String getResourceName(String resource) {
    return String.format("%s-%s-%s", PROJECT_NAME, ENVIRONMENT, resource);
  }
}