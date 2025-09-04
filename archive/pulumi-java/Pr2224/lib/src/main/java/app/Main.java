package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.aws.ec2.Eip;
import com.pulumi.aws.ec2.EipArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.NatGateway;
import com.pulumi.aws.ec2.NatGatewayArgs;
import com.pulumi.aws.ec2.Route;
import com.pulumi.aws.ec2.RouteArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.inputs.InstanceEbsBlockDeviceArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPolicy;
import com.pulumi.aws.s3.BucketPolicyArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;
import java.util.Random;

public final class Main {

    private Main() {
        // Private constructor to prevent instantiation
    }

    private static final String REGION = "us-east-1";
    private static final String RANDOM_SUFFIX = generateRandomSuffix();

    public static void defineInfrastructure(final com.pulumi.Context ctx) {
        // Method stub for testing - actual infrastructure is defined in main()
        throw new RuntimeException("This method is only for testing purposes");
    }

    public static void main(final String[] args) {
        Pulumi.run(ctx -> createInfrastructure(ctx));
    }

    // Extracted infrastructure creation method for testing
    public static void createInfrastructure(final com.pulumi.Context ctx) {
        var awsProvider = createAwsProvider();
        var providerOptions = createProviderOptions(awsProvider);
        var kmsKey = createKmsKey(providerOptions);
        var cloudtrailBucket = createCloudTrailS3Bucket(providerOptions, kmsKey);
        var appBucket = createApplicationS3Bucket(providerOptions, kmsKey);
        var vpcResources = createVpcInfrastructure(providerOptions);
        var securityGroup = createSecurityGroup(providerOptions, vpcResources.getVpc());
        var iamResources = createIamResources(providerOptions);
        var snsTopic = createSnsTopic(providerOptions);
        createEc2Instances(providerOptions, vpcResources, securityGroup,
            iamResources, kmsKey, snsTopic);
        var cloudTrail = createCloudTrail(providerOptions, cloudtrailBucket, kmsKey);
        exportOutputs(ctx, vpcResources, kmsKey, appBucket, snsTopic, cloudTrail, securityGroup);
    }

    private static Provider createAwsProvider() {
        return new Provider("aws-provider", ProviderArgs.builder()
            .region(REGION)
            .build());
    }

    private static CustomResourceOptions createProviderOptions(final Provider awsProvider) {
        return CustomResourceOptions.builder()
            .provider(awsProvider)
            .build();
    }

    private static Key createKmsKey(final CustomResourceOptions providerOptions) {
        return new Key("financial-app-kms-key-" + RANDOM_SUFFIX, KeyArgs.builder()
            .description("KMS key for financial application encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .deletionWindowInDays(30)
            .policy(buildKmsKeyPolicy())
            .tags(Map.of(
                "Environment", "production",
                "Application", "financial-services",
                "Compliance", "required"
            ))
            .build(), providerOptions);
    }

    private static Bucket createCloudTrailS3Bucket(final CustomResourceOptions providerOptions,
                                                   final Key kmsKey) {
        String cloudtrailBucketName = "financial-cloudtrail-logs-" + RANDOM_SUFFIX;
        var cloudtrailBucket = new Bucket("financial-cloudtrail-logs-" + RANDOM_SUFFIX,
            BucketArgs.builder()
                .bucket(cloudtrailBucketName)
                .forceDestroy(true)
                .serverSideEncryptionConfiguration(
                    BucketServerSideEncryptionConfigurationArgs.builder()
                        .rule(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                            .applyServerSideEncryptionByDefault(
                                BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                    .sseAlgorithm("aws:kms")
                                    .kmsMasterKeyId(kmsKey.arn())
                                    .build())
                            .bucketKeyEnabled(true)
                            .build())
                        .build())
                .tags(Map.of(
                    "Purpose", "CloudTrail-Logs",
                    "Environment", "production"
                ))
                .build(), providerOptions);

        // Create S3 bucket policy for CloudTrail
        new BucketPolicy("cloudtrail-bucket-policy-" + RANDOM_SUFFIX,
            BucketPolicyArgs.builder()
                .bucket(cloudtrailBucket.id())
                .policy(buildCloudTrailBucketPolicy(cloudtrailBucketName))
                .build(), providerOptions);

        return cloudtrailBucket;
    }

    private static Bucket createApplicationS3Bucket(final CustomResourceOptions providerOptions,
                                                    final Key kmsKey) {
        var appBucket = new Bucket("financial-app-data-" + RANDOM_SUFFIX,
            BucketArgs.builder()
                .forceDestroy(true)
                .serverSideEncryptionConfiguration(
                    BucketServerSideEncryptionConfigurationArgs.builder()
                        .rule(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                            .applyServerSideEncryptionByDefault(
                                BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                    .sseAlgorithm("aws:kms")
                                    .kmsMasterKeyId(kmsKey.arn())
                                    .build())
                            .bucketKeyEnabled(true)
                            .build())
                        .build())
                .tags(Map.of(
                    "Purpose", "Application-Data",
                    "Environment", "production"
                ))
                .build(), providerOptions);

        return appBucket;
    }

    public static class VpcResources {
        private final Vpc vpc;
        private final Subnet publicSubnet;
        private final Subnet privateSubnet;

        public VpcResources(final Vpc vpcParam, final Subnet publicSubnetParam, final Subnet privateSubnetParam) {
            this.vpc = vpcParam;
            this.publicSubnet = publicSubnetParam;
            this.privateSubnet = privateSubnetParam;
        }

        public Vpc getVpc() {
            return vpc;
        }

        public Subnet getPublicSubnet() {
            return publicSubnet;
        }

        public Subnet getPrivateSubnet() {
            return privateSubnet;
        }
    }

    private static VpcResources createVpcInfrastructure(final CustomResourceOptions providerOptions) {
        // Create VPC
        var vpc = new Vpc("financial-app-vpc-" + RANDOM_SUFFIX, VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of(
                "Name", "financial-app-vpc-" + RANDOM_SUFFIX,
                "Environment", "production"
            ))
            .build(), providerOptions);

        // Create Internet Gateway
        var igw = new InternetGateway("financial-app-igw-" + RANDOM_SUFFIX,
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "financial-app-igw-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);

        // Create public subnet
        var publicSubnet = new Subnet("financial-app-public-subnet-" + RANDOM_SUFFIX,
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone(REGION + "a")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", "financial-app-public-subnet-" + RANDOM_SUFFIX,
                    "Type", "public"
                ))
                .build(), providerOptions);

        // Create private subnet
        var privateSubnet = new Subnet("financial-app-private-subnet-" + RANDOM_SUFFIX,
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone(REGION + "a")
                .tags(Map.of(
                    "Name", "financial-app-private-subnet-" + RANDOM_SUFFIX,
                    "Type", "private"
                ))
                .build(), providerOptions);

        // Create NAT Gateway infrastructure
        createNatGatewayInfrastructure(providerOptions, igw, publicSubnet, privateSubnet);

        return new VpcResources(vpc, publicSubnet, privateSubnet);
    }

    private static void createNatGatewayInfrastructure(final CustomResourceOptions providerOptions,
                                                       final InternetGateway igw,
                                                       final Subnet publicSubnet,
                                                       final Subnet privateSubnet) {
        // Create Elastic IP for NAT Gateway
        var natEip = new Eip("financial-app-nat-eip-" + RANDOM_SUFFIX,
            EipArgs.builder()
                .domain("vpc")
                .tags(Map.of(
                    "Name", "financial-app-nat-eip-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);

        // Create NAT Gateway
        var natGateway = new NatGateway("financial-app-nat-" + RANDOM_SUFFIX,
            NatGatewayArgs.builder()
                .allocationId(natEip.id())
                .subnetId(publicSubnet.id())
                .tags(Map.of(
                    "Name", "financial-app-nat-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);

        // Create route tables and associations
        createRouteTables(providerOptions, igw, natGateway, publicSubnet, privateSubnet);
    }

    private static void createRouteTables(final CustomResourceOptions providerOptions,
                                          final InternetGateway igw,
                                          final NatGateway natGateway,
                                          final Subnet publicSubnet,
                                          final Subnet privateSubnet) {
        // Public route table
        var publicRouteTable = new RouteTable("financial-app-public-rt-" + RANDOM_SUFFIX,
            RouteTableArgs.builder()
                .vpcId(publicSubnet.vpcId())
                .tags(Map.of(
                    "Name", "financial-app-public-rt-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);

        new Route("financial-app-public-route-" + RANDOM_SUFFIX,
            RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build(), providerOptions);

        new RouteTableAssociation("financial-app-public-rta-" + RANDOM_SUFFIX,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);

        // Private route table
        var privateRouteTable = new RouteTable("financial-app-private-rt-" + RANDOM_SUFFIX,
            RouteTableArgs.builder()
                .vpcId(privateSubnet.vpcId())
                .tags(Map.of(
                    "Name", "financial-app-private-rt-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);

        new Route("financial-app-private-route-" + RANDOM_SUFFIX,
            RouteArgs.builder()
                .routeTableId(privateRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.id())
                .build(), providerOptions);

        new RouteTableAssociation("financial-app-private-rta-" + RANDOM_SUFFIX,
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
    }

    private static SecurityGroup createSecurityGroup(final CustomResourceOptions providerOptions,
                                                     final Vpc vpc) {
        return new SecurityGroup("financial-app-sg-" + RANDOM_SUFFIX,
            SecurityGroupArgs.builder()
                .name("financial-app-sg-" + RANDOM_SUFFIX)
                .description("Security group for financial application")
                .vpcId(vpc.id())
                .ingress(SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("10.0.0.0/16")
                    .description("HTTPS traffic within VPC")
                    .build())
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTPS outbound")
                    .build())
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(80)
                    .toPort(80)
                    .cidrBlocks("10.0.0.0/16")
                    .description("HTTP outbound within VPC for package updates")
                    .build())
                .tags(Map.of(
                    "Name", "financial-app-sg-" + RANDOM_SUFFIX,
                    "Environment", "production"
                ))
                .build(), providerOptions);
    }

    public static class IamResources {
        private final Role ec2Role;
        private final Policy s3Policy;
        private final InstanceProfile instanceProfile;

        public IamResources(final Role ec2RoleParam, final Policy s3PolicyParam,
                           final InstanceProfile instanceProfileParam) {
            this.ec2Role = ec2RoleParam;
            this.s3Policy = s3PolicyParam;
            this.instanceProfile = instanceProfileParam;
        }

        public Role getEc2Role() {
            return ec2Role;
        }

        public Policy getS3Policy() {
            return s3Policy;
        }

        public InstanceProfile getInstanceProfile() {
            return instanceProfile;
        }
    }

    private static IamResources createIamResources(final CustomResourceOptions providerOptions) {
        // Create IAM role for EC2 instances
        var ec2Role = new Role("financial-app-ec2-role-" + RANDOM_SUFFIX, RoleArgs.builder()
            .assumeRolePolicy(buildEc2AssumeRolePolicy())
            .tags(Map.of(
                "Name", "financial-app-ec2-role-" + RANDOM_SUFFIX,
                "Environment", "production"
            ))
            .build(), providerOptions);

        // Create IAM policy for S3 read-only access
        var s3ReadOnlyPolicy = new Policy("financial-app-s3-readonly-" + RANDOM_SUFFIX,
            PolicyArgs.builder()
                .description("Read-only access to specific S3 bucket")
                .policy(buildS3ReadOnlyPolicy(REGION))
                .build(), providerOptions);

        // Attach policies to role
        new RolePolicyAttachment("financial-app-s3-policy-attachment-" + RANDOM_SUFFIX,
            RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn(s3ReadOnlyPolicy.arn())
                .build(), providerOptions);

        new RolePolicyAttachment("financial-app-cloudwatch-policy-attachment-" + RANDOM_SUFFIX,
            RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build(), providerOptions);

        // Create instance profile
        var instanceProfile = new InstanceProfile("financial-app-instance-profile-" + RANDOM_SUFFIX,
            InstanceProfileArgs.builder()
                .role(ec2Role.name())
                .build(), providerOptions);

        return new IamResources(ec2Role, s3ReadOnlyPolicy, instanceProfile);
    }

    private static Topic createSnsTopic(final CustomResourceOptions providerOptions) {
        return new Topic("financial-app-cpu-alerts-" + RANDOM_SUFFIX,
            TopicArgs.builder()
                .name("financial-app-cpu-alerts-" + RANDOM_SUFFIX)
                .tags(Map.of(
                    "Purpose", "CPU-Alerts",
                    "Environment", "production"
                ))
                .build(), providerOptions);
    }

    private static void createEc2Instances(final CustomResourceOptions providerOptions,
                                           final VpcResources vpcResources,
                                           final SecurityGroup securityGroup,
                                           final IamResources iamResources,
                                           final Key kmsKey,
                                           final Topic snsTopic) {
        // Use a more recent Amazon Linux 2 AMI ID for better security
        // In production, this should be dynamically looked up using AWS APIs
        String amazonLinux2AmiId = "ami-0abcdef1234567890";  // Placeholder - should be latest AL2 AMI

        for (int i = 1; i <= 2; i++) {
            final int instanceNumber = i;

            var instance = new Instance("financial-app-instance-" + instanceNumber
                + "-" + RANDOM_SUFFIX, InstanceArgs.builder()
                .ami(amazonLinux2AmiId)
                .instanceType("t3.micro")
                .subnetId(vpcResources.getPrivateSubnet().id())
                .vpcSecurityGroupIds(securityGroup.id().apply(id -> Output.of(List.of(id))))
                .iamInstanceProfile(iamResources.getInstanceProfile().name())
                .monitoring(true)
                .ebsOptimized(true)
                .ebsBlockDevices(InstanceEbsBlockDeviceArgs.builder()
                    .deviceName("/dev/xvda")
                    .volumeType("gp3")
                    .volumeSize(20)
                    .encrypted(true)
                    .kmsKeyId(kmsKey.arn())
                    .deleteOnTermination(true)
                    .build())
                .userData(buildEc2UserData())
                .tags(Map.of(
                    "Name", "financial-app-instance-" + instanceNumber + "-" + RANDOM_SUFFIX,
                    "Environment", "production",
                    "Application", "financial-services"
                ))
                .build(), providerOptions);

            // Create CloudWatch CPU alarm for each instance
            new MetricAlarm("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX,
                MetricAlarmArgs.builder()
                    .name("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX)
                    .comparisonOperator("GreaterThanThreshold")
                    .evaluationPeriods(2)
                    .metricName("CPUUtilization")
                    .namespace("AWS/EC2")
                    .period(300)
                    .statistic("Average")
                    .threshold(70.0)
                    .alarmDescription("This metric monitors ec2 cpu utilization")
                    .alarmActions(snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                    .tags(Map.of(
                        "Instance", "financial-app-instance-" + instanceNumber,
                        "Environment", "production"
                    ))
                    .build(), providerOptions);
        }
    }

    private static Trail createCloudTrail(final CustomResourceOptions providerOptions,
                                          final Bucket cloudtrailBucket,
                                          final Key kmsKey) {
        return new Trail("financial-app-cloudtrail-" + RANDOM_SUFFIX, TrailArgs.builder()
            .name("financial-app-cloudtrail-" + RANDOM_SUFFIX)
            .s3BucketName(cloudtrailBucket.bucket())
            .includeGlobalServiceEvents(true)
            .isMultiRegionTrail(true)
            .enableLogging(true)
            .kmsKeyId(kmsKey.arn())
            .tags(Map.of(
                "Environment", "production",
                "Purpose", "compliance-audit"
            ))
            .build(), providerOptions);
    }

    private static void exportOutputs(final com.pulumi.Context ctx,
                                      final VpcResources vpcResources,
                                      final Key kmsKey,
                                      final Bucket appBucket,
                                      final Topic snsTopic,
                                      final Trail cloudTrail,
                                      final SecurityGroup securityGroup) {
        ctx.export("vpcId", vpcResources.getVpc().id());
        ctx.export("privateSubnetId", vpcResources.getPrivateSubnet().id());
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("appBucketName", appBucket.bucket());
        ctx.export("snsTopicArn", snsTopic.arn());
        ctx.export("cloudtrailArn", cloudTrail.arn());
        ctx.export("securityGroupId", securityGroup.id());
        ctx.export("randomSuffix", Output.of(RANDOM_SUFFIX));
    }

    private static String generateRandomSuffix() {
        return String.valueOf(new Random().nextInt(10000));
    }

    // Helper method to build resource name with suffix
    public static String buildResourceName(final String prefix, final String suffix) {
        if (prefix == null || prefix.isEmpty()) {
            throw new IllegalArgumentException("Prefix cannot be null or empty");
        }
        if (suffix == null || suffix.isEmpty()) {
            throw new IllegalArgumentException("Suffix cannot be null or empty");
        }
        return prefix + "-" + suffix;
    }

    // Helper method to get AWS region
    public static String getRegion() {
        return REGION;
    }

    // Helper method to get random suffix
    public static String getRandomSuffix() {
        return RANDOM_SUFFIX;
    }

    // Helper method to validate resource tags
    public static boolean isValidResourceTag(final String key, final String value) {
        if (key == null || key.isEmpty() || value == null || value.isEmpty()) {
            return false;
        }
        // AWS tag key/value constraints
        return key.length() <= 128 && value.length() <= 256
               && !key.startsWith("aws:") && !key.startsWith("AWS:");
    }

    // Helper method to validate CIDR blocks
    public static boolean isValidCidrBlock(final String cidr) {
        if (cidr == null || cidr.isEmpty()) {
            return false;
        }

        String[] parts = cidr.split("/");
        if (parts.length != 2) {
            return false;
        }

        try {
            String ip = parts[0];
            int prefixLength = Integer.parseInt(parts[1]);

            // Validate prefix length
            if (prefixLength < 0 || prefixLength > 32) {
                return false;
            }

            // Validate IP address format
            String[] ipParts = ip.split("\\.");
            if (ipParts.length != 4) {
                return false;
            }

            for (String part : ipParts) {
                int octet = Integer.parseInt(part);
                if (octet < 0 || octet > 255) {
                    return false;
                }
            }

            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    // Helper method to validate AWS region format
    public static boolean isValidAwsRegion(final String region) {
        if (region == null || region.isEmpty()) {
            return false;
        }

        // AWS region format: us-east-1, eu-west-1, ap-southeast-2, etc.
        return region.matches("^[a-z]{2,3}-[a-z]+-\\d+$");
    }

    // Helper method to validate instance types
    public static boolean isValidInstanceType(final String instanceType) {
        if (instanceType == null || instanceType.isEmpty()) {
            return false;
        }

        // Common AWS instance type formats: t3.micro, m5.large, c5n.xlarge, r5a.2xlarge, m5dn.large, etc.
        return instanceType.matches("^[a-z][0-9][a-z]*\\.[0-9]*[a-z]+$");
    }

    // Helper method to generate availability zone name
    public static String generateAvailabilityZone(final String region, final String zone) {
        if (region == null || region.isEmpty()) {
            throw new IllegalArgumentException("Region cannot be null or empty");
        }
        if (zone == null || zone.isEmpty()) {
            throw new IllegalArgumentException("Zone cannot be null or empty");
        }
        if (!zone.matches("^[a-z]$")) {
            throw new IllegalArgumentException("Zone must be a single lowercase letter");
        }

        return region + zone;
    }

    // Helper method to validate port numbers
    public static boolean isValidPort(final int port) {
        return port >= 1 && port <= 65535;
    }

    // Helper method to validate security group protocols
    public static boolean isValidProtocol(final String protocol) {
        if (protocol == null || protocol.isEmpty()) {
            return false;
        }

        String[] validProtocols = {"tcp", "udp", "icmp", "all", "-1"};
        for (String valid : validProtocols) {
            if (valid.equalsIgnoreCase(protocol)) {
                return true;
            }
        }
        return false;
    }

    // Helper method to format resource names consistently
    public static String formatResourceName(final String type, final String name, final String suffix) {
        if (type == null || type.isEmpty()) {
            throw new IllegalArgumentException("Type cannot be null or empty");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        if (suffix == null || suffix.isEmpty()) {
            throw new IllegalArgumentException("Suffix cannot be null or empty");
        }

        return String.format("%s-%s-%s", type, name, suffix);
    }

    // Helper method to validate AWS ARN format
    public static boolean isValidArn(final String arn) {
        if (arn == null || arn.isEmpty()) {
            return false;
        }

        // Basic AWS ARN format: arn:partition:service:region:account-id:resource-type/resource-id
        // or arn:partition:service:region:account-id:resource-type:resource-id
        return arn.matches("^arn:[^:]+:[^:]+:[^:]*:[^:]*:.+$");
    }

    // Helper method to calculate subnet size from CIDR
    public static int calculateSubnetSize(final String cidr) {
        if (!isValidCidrBlock(cidr)) {
            throw new IllegalArgumentException("Invalid CIDR block: " + cidr);
        }

        String[] parts = cidr.split("/");
        int prefixLength = Integer.parseInt(parts[1]);

        return (int) Math.pow(2, 32 - prefixLength);
    }

    // Helper method to validate bucket names
    public static boolean isValidS3BucketName(final String bucketName) {
        if (bucketName == null || bucketName.isEmpty()) {
            return false;
        }

        // S3 bucket naming rules (simplified)
        if (bucketName.length() < 3 || bucketName.length() > 63) {
            return false;
        }

        // Must start and end with lowercase letter or number
        if (!bucketName.matches("^[a-z0-9].*[a-z0-9]$")) {
            return false;
        }

        // Cannot contain uppercase letters, spaces, or certain special characters
        if (!bucketName.matches("^[a-z0-9.-]+$")) {
            return false;
        }

        // Cannot be formatted as IP address
        if (bucketName.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
            return false;
        }

        return true;
    }

    // Helper method to build CloudTrail bucket policy JSON
    public static String buildCloudTrailBucketPolicy(final String bucketName) {
        if (bucketName == null || bucketName.isEmpty()) {
            throw new IllegalArgumentException("Bucket name cannot be null or empty");
        }

        return String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:GetBucketAcl",
                        "Resource": "arn:aws:s3:::%s"
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": "arn:aws:s3:::%s/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            }
            """, bucketName, bucketName);
    }

    // Helper method to build S3 read-only IAM policy JSON with specific bucket ARN
    public static String buildS3ReadOnlyPolicy(final String region) {
        if (region == null || region.isEmpty()) {
            throw new IllegalArgumentException("Region cannot be null or empty");
        }
        if (!isValidAwsRegion(region)) {
            throw new IllegalArgumentException("Invalid AWS region format: " + region);
        }

        // Use the specific bucket name with random suffix to prevent wildcard access
        String bucketName = "financial-app-data-" + RANDOM_SUFFIX;
        String accountId = getAccountId();
        
        return String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "arn:aws:s3:::%s",
                            "arn:aws:s3:::%s/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "arn:aws:kms:%s:%s:key/financial-app-kms-key-%s",
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": "s3.%s.amazonaws.com"
                            }
                        }
                    }
                ]
            }
            """, bucketName, bucketName, region, accountId, RANDOM_SUFFIX, region);
    }

    // Helper method to build EC2 assume role policy JSON
    public static String buildEc2AssumeRolePolicy() {
        return """
            {
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
            }
            """;
    }

    // Helper method to build CloudWatch agent configuration JSON
    public static String buildCloudWatchAgentConfig() {
        return """
            {
                "metrics": {
                    "namespace": "FinancialApp/EC2",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": [
                                "cpu_usage_idle",
                                "cpu_usage_iowait",
                                "cpu_usage_user",
                                "cpu_usage_system"
                            ],
                            "metrics_collection_interval": 60,
                            "totalcpu": true
                        },
                        "disk": {
                            "measurement": [
                                "used_percent"
                            ],
                            "metrics_collection_interval": 60,
                            "resources": [
                                "*"
                            ]
                        },
                        "mem": {
                            "measurement": [
                                "mem_used_percent"
                            ],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            """;
    }

    // Helper method to build EC2 user data script
    public static String buildEc2UserData() {
        return String.format("""
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            %s
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
                -a fetch-config -m ec2 \\
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \\
                -s
            """, buildCloudWatchAgentConfig());
    }

    // Helper method to validate KMS key usage
    public static boolean isValidKmsKeyUsage(final String keyUsage) {
        if (keyUsage == null || keyUsage.isEmpty()) {
            return false;
        }

        return "ENCRYPT_DECRYPT".equals(keyUsage) || "SIGN_VERIFY".equals(keyUsage);
    }

    // Helper method to validate KMS deletion window
    public static boolean isValidKmsDeletionWindow(final int deletionWindowInDays) {
        return deletionWindowInDays >= 7 && deletionWindowInDays <= 30;
    }

    // Helper method to validate EBS volume types
    public static boolean isValidEbsVolumeType(final String volumeType) {
        if (volumeType == null || volumeType.isEmpty()) {
            return false;
        }

        String[] validTypes = {"gp2", "gp3", "io1", "io2", "st1", "sc1", "standard"};
        for (String valid : validTypes) {
            if (valid.equals(volumeType)) {
                return true;
            }
        }
        return false;
    }

    // Helper method to validate EBS volume size
    public static boolean isValidEbsVolumeSize(final int volumeSize, final String volumeType) {
        if (volumeType == null || volumeSize <= 0) {
            return false;
        }

        switch (volumeType) {
            case "gp2":
            case "gp3":
                return volumeSize >= 1 && volumeSize <= 16384;
            case "io1":
            case "io2":
                return volumeSize >= 4 && volumeSize <= 16384;
            case "st1":
            case "sc1":
                return volumeSize >= 125 && volumeSize <= 16384;
            case "standard":
                return volumeSize >= 1 && volumeSize <= 1024;
            default:
                return false;
        }
    }

    // Helper method to validate CloudWatch metric period
    public static boolean isValidCloudWatchPeriod(final int period) {
        // CloudWatch periods must be 60 seconds or a multiple of 60 seconds
        return period > 0 && period % 60 == 0;
    }

    // Helper method to validate alarm threshold
    public static boolean isValidAlarmThreshold(final double threshold) {
        return threshold >= 0.0 && threshold <= 100.0;
    }

    // Helper method to build resource tags map
    public static Map<String, String> buildResourceTags(final String environment,
                                                        final String application) {
        if (environment == null || environment.isEmpty()) {
            throw new IllegalArgumentException("Environment cannot be null or empty");
        }
        if (application == null || application.isEmpty()) {
            throw new IllegalArgumentException("Application cannot be null or empty");
        }

        Map<String, String> tags = new java.util.HashMap<>();
        tags.put("Environment", environment);
        tags.put("Application", application);
        return tags;
    }

    // Helper method to build resource tags map with additional tag
    public static Map<String, String> buildResourceTags(final String environment,
                                                       final String application,
                                                       final String key,
                                                       final String value) {
        Map<String, String> tags = buildResourceTags(environment, application);
        if (key != null && !key.isEmpty() && value != null && !value.isEmpty()) {
            tags.put(key, value);
        }
        return tags;
    }

    // Helper method to get AWS account ID (placeholder for dynamic account lookup)
    private static String getAccountId() {
        // In production, this would be dynamically retrieved
        // For this implementation, we use a placeholder that would be resolved at deployment
        return "${aws:userid}";
    }

    // Helper method to build KMS key policy JSON for CloudTrail access
    public static String buildKmsKeyPolicy() {
        String accountId = getAccountId();
        return String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "EnableRootPermissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::%s:root"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:CreateGrant",
                            "kms:ListGrants",
                            "kms:RevokeGrant"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudTrail to encrypt logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": [
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:ReEncrypt*",
                            "kms:Decrypt"
                        ],
                        "Condition": {
                            "StringEquals": {
                                "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:*:trail/*"
                            }
                        }
                    },
                    {
                        "Sid": "Allow S3 service to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "s3.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": "s3.us-east-1.amazonaws.com"
                            }
                        }
                    }
                ]
            }
            """, accountId);
    }

}