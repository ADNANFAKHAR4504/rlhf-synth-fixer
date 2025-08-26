package com.mycompany.app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.cloudtrail.CloudTrail;
import software.amazon.awscdk.services.cloudtrail.CloudTrailProps;
import software.amazon.awscdk.services.cloudtrail.ReadWriteType;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.AlarmProps;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.MetricProps;
import software.amazon.awscdk.services.cloudwatch.Statistic;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceProps;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.NatGateway;
import software.amazon.awscdk.services.ec2.NatGatewayProps;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.PrivateSubnet;
import software.amazon.awscdk.services.ec2.PrivateSubnetProps;
import software.amazon.awscdk.services.ec2.PublicSubnet;
import software.amazon.awscdk.services.ec2.PublicSubnetProps;
import software.amazon.awscdk.services.ec2.Route;
import software.amazon.awscdk.services.ec2.RouteProps;
import software.amazon.awscdk.services.ec2.RouteTable;
import software.amazon.awscdk.services.ec2.RouteTableProps;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeyProps;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.StorageEncrypted;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.TopicProps;
import software.amazon.awscdk.services.sns.subscriptions.EmailSubscription;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class TapStack extends Stack {
    
    private static final String PROJECT_NAME = "tapproject";
    private static final String ENVIRONMENT = "prod";
    private static final String OFFICE_CIDR = "203.0.113.0/24"; // Replace with your office IP range
    private static final String DEVOPS_EMAIL = "devops@company.com"; // Replace with actual email
    
    public TapStack(final App parent, final String id) {
        this(parent, id, null);
    }

    public TapStack(final App parent, final String id, final StackProps props) {
        super(parent, id, props);

        // Apply consistent tags to all resources
        Tags.of(this).add("Project", PROJECT_NAME);
        Tags.of(this).add("Environment", ENVIRONMENT);
        Tags.of(this).add("ManagedBy", "CDK");
        Tags.of(this).add("CostCenter", "Engineering");

        // 1. Create KMS Key for encryption
        Key kmsKey = new Key(this, getResourceName("kms-key"), KeyProps.builder()
                .description("KMS key for " + PROJECT_NAME + " encryption")
                .build());

        // 2. Create VPC with public and private subnets
        Vpc vpc = createVpc();

        // 3. Create Security Groups
        SecurityGroup webSecurityGroup = createWebSecurityGroup(vpc);
        SecurityGroup rdsSecurityGroup = createRdsSecurityGroup(vpc, webSecurityGroup);

        // 4. Create IAM Roles and Policies
        Role ec2Role = createEc2Role();
        Role cloudTrailRole = createCloudTrailRole();

        // 5. Create S3 bucket for CloudTrail logs
        Bucket cloudTrailBucket = createCloudTrailBucket(kmsKey);

        // 6. Set up CloudTrail
        createCloudTrail(cloudTrailBucket, cloudTrailRole, kmsKey);

        // 7. Create SNS Topic for alerts
        Topic alertTopic = createAlertTopic();

        // 8. Launch EC2 instances in private subnets
        List<Instance> ec2Instances = createEc2Instances(vpc, webSecurityGroup, ec2Role);

        // 9. Create CloudWatch alarms for EC2 CPU monitoring
        createCpuAlarms(ec2Instances, alertTopic);

        // 10. Create RDS instance with multi-AZ and encryption
        createRdsInstance(vpc, rdsSecurityGroup, kmsKey);
    }

    private String getResourceName(String resource) {
        return PROJECT_NAME + "-" + ENVIRONMENT + "-" + resource;
    }

    private Vpc createVpc() {
        return new Vpc(this, getResourceName("vpc"), VpcProps.builder()
                .cidr("10.0.0.0/16")
                .maxAzs(2)
                .natGateways(2) // One NAT gateway per public subnet
                .subnetConfiguration(Arrays.asList(
                        // Public subnets for NAT gateways and load balancers
                        software.amazon.awscdk.services.ec2.SubnetConfiguration.builder()
                                .name(getResourceName("public-subnet"))
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        // Private subnets for EC2 instances and RDS
                        software.amazon.awscdk.services.ec2.SubnetConfiguration.builder()
                                .name(getResourceName("private-subnet"))
                                .subnetType(SubnetType.PRIVATE_WITH_NAT)
                                .cidrMask(24)
                                .build()
                ))
                .build());
    }

    private SecurityGroup createWebSecurityGroup(Vpc vpc) {
        SecurityGroup webSg = new SecurityGroup(this, getResourceName("web-sg"), 
                SecurityGroupProps.builder()
                        .vpc(vpc)
                        .description("Security group for web servers")
                        .allowAllOutbound(true)
                        .build());

        // Allow HTTP and HTTPS from office CIDR only
        webSg.addIngressRule(Peer.ipv4(OFFICE_CIDR), Port.tcp(80), "Allow HTTP from office");
        webSg.addIngressRule(Peer.ipv4(OFFICE_CIDR), Port.tcp(443), "Allow HTTPS from office");
        
        return webSg;
    }

    private SecurityGroup createRdsSecurityGroup(Vpc vpc, SecurityGroup webSecurityGroup) {
        SecurityGroup rdsSg = new SecurityGroup(this, getResourceName("rds-sg"), 
                SecurityGroupProps.builder()
                        .vpc(vpc)
                        .description("Security group for RDS instances")
                        .allowAllOutbound(false)
                        .build());

        // Allow MySQL/Aurora access from web security group only
        rdsSg.addIngressRule(webSecurityGroup, Port.tcp(3306), "Allow MySQL from web servers");
        
        return rdsSg;
    }

    private Role createEc2Role() {
        // Create policy for EC2 instances with least privilege
        PolicyStatement ec2Policy = new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "cloudwatch:PutMetricData",
                        "ec2:DescribeVolumes",
                        "ec2:DescribeTags",
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream"
                ))
                .resources(Arrays.asList("*"))
                .build());

        return new Role(this, getResourceName("ec2-role"), RoleProps.builder()
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instances")
                .inlinePolicies(Map.of(
                        getResourceName("ec2-policy"), 
                        new PolicyDocument(software.amazon.awscdk.services.iam.PolicyDocumentProps.builder()
                                .statements(Arrays.asList(ec2Policy))
                                .build())
                ))
                .build());
    }

    private Role createCloudTrailRole() {
        PolicyStatement cloudTrailPolicy = new PolicyStatement(PolicyStatementProps.builder()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream"
                ))
                .resources(Arrays.asList("*"))
                .build());

        return new Role(this, getResourceName("cloudtrail-role"), RoleProps.builder()
                .assumedBy(new ServicePrincipal("cloudtrail.amazonaws.com"))
                .description("IAM role for CloudTrail")
                .inlinePolicies(Map.of(
                        getResourceName("cloudtrail-policy"), 
                        new PolicyDocument(software.amazon.awscdk.services.iam.PolicyDocumentProps.builder()
                                .statements(Arrays.asList(cloudTrailPolicy))
                                .build())
                ))
                .build());
    }

    private Bucket createCloudTrailBucket(Key kmsKey) {
        return new Bucket(this, getResourceName("cloudtrail-bucket"), BucketProps.builder()
                .bucketName(getResourceName("cloudtrail-logs"))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .build());
    }

    private void createCloudTrail(Bucket bucket, Role role, Key kmsKey) {
        new CloudTrail(this, getResourceName("cloudtrail"), CloudTrailProps.builder()
                .trailName(getResourceName("audit-trail"))
                .bucket(bucket)
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .kmsKey(kmsKey)
                .sendToCloudWatchLogs(true)
                .build());
    }

    private Topic createAlertTopic() {
        Topic topic = new Topic(this, getResourceName("alert-topic"), TopicProps.builder()
                .topicName(getResourceName("devops-alerts"))
                .displayName("DevOps Alert Topic")
                .build());

        // Subscribe DevOps email to the topic
        topic.addSubscription(new EmailSubscription(DEVOPS_EMAIL));
        
        return topic;
    }

    private List<Instance> createEc2Instances(Vpc vpc, SecurityGroup securityGroup, Role role) {
        // Get private subnets
        List<software.amazon.awscdk.services.ec2.ISubnet> privateSubnets = vpc.getPrivateSubnets();
        
        Instance instance1 = new Instance(this, getResourceName("web-server-1"), InstanceProps.builder()
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux())
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnets(Arrays.asList(privateSubnets.get(0)))
                        .build())
                .securityGroup(securityGroup)
                .role(role)
                .keyName("my-key-pair") // Replace with your key pair name
                .build());

        Instance instance2 = new Instance(this, getResourceName("web-server-2"), InstanceProps.builder()
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux())
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnets(Arrays.asList(privateSubnets.get(1)))
                        .build())
                .securityGroup(securityGroup)
                .role(role)
                .keyName("my-key-pair") // Replace with your key pair name
                .build());

        return Arrays.asList(instance1, instance2);
    }

    private void createCpuAlarms(List<Instance> instances, Topic alertTopic) {
        for (int i = 0; i < instances.size(); i++) {
            Instance instance = instances.get(i);
            
            Metric cpuMetric = new Metric(MetricProps.builder()
                    .namespace("AWS/EC2")
                    .metricName("CPUUtilization")
                    .dimensionsMap(Map.of("InstanceId", instance.getInstanceId()))
                    .statistic(Statistic.AVERAGE)
                    .build());

            Alarm cpuAlarm = new Alarm(this, getResourceName("cpu-alarm-" + (i + 1)), AlarmProps.builder()
                    .alarmName(getResourceName("high-cpu-" + instance.getInstanceId()))
                    .alarmDescription("Alert when CPU exceeds 80% for instance " + instance.getInstanceId())
                    .metric(cpuMetric)
                    .threshold(80.0)
                    .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                    .evaluationPeriods(2)
                    .treatMissingData(TreatMissingData.BREACHING)
                    .build());

            cpuAlarm.addAlarmAction(new SnsAction(alertTopic));
        }
    }

    private void createRdsInstance(Vpc vpc, SecurityGroup securityGroup, Key kmsKey) {
        new DatabaseInstance(this, getResourceName("rds-instance"), DatabaseInstanceProps.builder()
                .instanceIdentifier(getResourceName("mysql-db"))
                .engine(DatabaseInstanceEngine.mysql(software.amazon.awscdk.services.rds.MysqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0)
                        .build()))
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .vpc(vpc)
                .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_NAT)
                        .build())
                .securityGroups(Arrays.asList(securityGroup))
                .multiAz(true)
                .storageEncrypted(true)
                .storageEncryptionKey(kmsKey)
                .allocatedStorage(20)
                .databaseName("appdb")
                .credentials(software.amazon.awscdk.services.rds.Credentials.fromGeneratedSecret("admin"))
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deletionProtection(true)
                .build());
    }

    public static void main(final String[] args) {
        App app = new App();

        new TapStack(app, "TapStack", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-east-2")
                        .build())
                .build());

        app.synth();
    }
}