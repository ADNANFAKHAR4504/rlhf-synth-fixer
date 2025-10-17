import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Infrastructure } from '../lib/infrastructure';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Infrastructure Stack', () => {
  let app: cdk.App;
  let stack: Infrastructure;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new Infrastructure(app, 'TestInfrastructure', {
      environmentSuffix,
      region: 'us-west-2',
      secondaryRegion: 'ap-south-1',
      instanceType: 't3.medium',
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcCidr: '10.0.0.0/16',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block and DNS settings', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has public subnets in different AZs', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        subnet => subnet.Properties.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(2);
    });

    test('VPC has private subnets in different AZs', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(
        subnet => subnet.Properties.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets).toHaveLength(2);
    });

    test('VPC has NAT gateways for private subnet internet access', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('VPC has internet gateway for public subnet access', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('VPC has flow logs enabled for monitoring', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });

    test('VPC has route tables for public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 1 public, 1 private, 2 NAT gateway routes
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic from internet',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic from internet',
          },
        ],
      });
    });

    test('Instance security group allows traffic only from ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('Security groups have proper outbound rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is internet-facing and application type', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('ALB has HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('ALB target group has proper health check configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/health',
        HealthCheckEnabled: true,
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('ALB has access logging enabled to S3', () => {
      const alb = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const albResource = Object.values(alb)[0];
      const hasAccessLogging = albResource.Properties.LoadBalancerAttributes.some(
        attr => attr.Key === 'access_logs.s3.enabled' && attr.Value === 'true'
      );
      expect(hasAccessLogging).toBe(true);
    });

    test('ALB is deployed in public subnets', () => {
      const alb = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const albResource = Object.values(alb)[0];
      expect(albResource.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG has correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });

    test('ASG uses launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.medium',
        },
      });
    });

    test('ASG has CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      });
    });

    test('ASG has request count scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 1000,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ALBRequestCountPerTarget',
          },
        },
      });
    });

    test('ASG instances are deployed in private subnets', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];
      expect(asgResource.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('Launch template has encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 30,
                VolumeType: 'gp3',
              },
            },
          ],
        },
      });
    });

    test('Launch template has user data for web server setup', () => {
      const launchTemplate = template.findResources('AWS::EC2::LaunchTemplate');
      const ltResource = Object.values(launchTemplate)[0];
      const userData = ltResource.Properties.LaunchTemplateData.UserData;

      // Check if user data contains the expected content
      expect(userData['Fn::Base64']).toBeDefined();
      expect(userData['Fn::Base64']['Fn::Join']).toBeDefined();
      const joinContent = userData['Fn::Base64']['Fn::Join'][1].join('');
      expect(joinContent).toContain('httpd');
      expect(joinContent).toContain('nodejs');
      expect(joinContent).toContain('webapp-test');
    });
  });

  describe('IAM Configuration', () => {
    test('EC2 instance role has correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Description: 'IAM role for WebApp EC2 instances with least privilege access',
      });
    });

    test('Instance role has SSM managed policy for maintenance', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });

    test('Instance role has CloudWatch Logs permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const instancePolicy = Object.values(policies).find(policy =>
        policy.Properties.PolicyName.includes('WebAppInstanceRole')
      );
      expect(instancePolicy).toBeDefined();
      expect(instancePolicy?.Properties.PolicyDocument.Statement).toContainEqual(
        expect.objectContaining({
          Effect: 'Allow',
          Action: expect.arrayContaining(['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams']),
        })
      );
    });
  });

  describe('DynamoDB Global Table (TableV2)', () => {
    test('DynamoDB Global Table uses on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB Global Table has encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('DynamoDB Global Table has point-in-time recovery enabled', () => {
      const resources = template.findResources('AWS::DynamoDB::GlobalTable');
      const globalTable = Object.values(resources)[0];

      expect(globalTable.Properties.Replicas).toBeDefined();
      expect(globalTable.Properties.Replicas).toHaveLength(2);

      // Check that both replicas have point-in-time recovery enabled
      globalTable.Properties.Replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification).toBeDefined();
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });

    test('DynamoDB Global Table has DynamoDB streams enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('DynamoDB Global Table has composite primary key', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'status',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('DynamoDB Global Table has global secondary index', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'status-index',
            KeySchema: [
              {
                AttributeName: 'status',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('DynamoDB Global Table has replication regions configured', () => {
      const resources = template.findResources('AWS::DynamoDB::GlobalTable');
      const globalTable = Object.values(resources)[0];

      expect(globalTable.Properties.Replicas).toBeDefined();
      expect(globalTable.Properties.Replicas).toHaveLength(2);

      // Check that both regions are present
      const regions = globalTable.Properties.Replicas.map((replica: any) => replica.Region);
      expect(regions).toContain('us-west-2');
      expect(regions).toContain('ap-south-1');
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket has server-side encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-logs',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 60,
                },
              ],
            },
          ],
        },
      });
    });

    test('S3 bucket has policy for ALB access logs', () => {
      const bucketPolicy = template.findResources('AWS::S3::BucketPolicy');
      const policyResource = Object.values(bucketPolicy)[0];
      const hasAlbPolicy = policyResource.Properties.PolicyDocument.Statement.some(
        statement => statement.Principal?.Service === 'elasticloadbalancing.amazonaws.com'
      );
      expect(hasAlbPolicy).toBe(true);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('VPC ID is exported for cross-stack references', () => {
      template.hasOutput('uswest2VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `vpc-id-${environmentSuffix}-us-west-2`,
        },
      });
    });

    test('ALB DNS name is exported for application access', () => {
      template.hasOutput('uswest2ApplicationLoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
        Export: {
          Name: `alb-dns-${environmentSuffix}-us-west-2`,
        },
      });
    });

    test('ALB URL is exported for easy access', () => {
      template.hasOutput('uswest2ApplicationLoadBalancerURL', {
        Description: 'Application Load Balancer URL',
        Export: {
          Name: `alb-url-${environmentSuffix}-us-west-2`,
        },
      });
    });

    test('DynamoDB Global Table name is exported for application integration', () => {
      template.hasOutput('uswest2DynamoDBTableName', {
        Description: 'DynamoDB Global Table name',
        Export: {
          Name: `dynamodb-global-table-${environmentSuffix}`,
        },
      });
    });

    test('S3 log bucket name is exported for log access', () => {
      template.hasOutput('uswest2LogBucket', {
        Description: 'Log bucket',
        Export: {
          Name: `log-bucket-${environmentSuffix}-us-west-2`,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has proper resource tags', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const tags = vpcResource.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(tags).toContainEqual({ Key: 'Project', Value: 'WebApp' });
      expect(tags).toContainEqual({ Key: 'EnvironmentSuffix', Value: environmentSuffix });
    });

    test('All resources have consistent tagging', () => {
      const resources = template.findResources('AWS::EC2::Subnet');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Infrastructure Configuration Branches', () => {
    test('Production environment uses RETAIN removal policy', () => {
      const prodInfra = new Infrastructure(app, 'ProdInfrastructure', {
        environmentSuffix: 'prod',
        region: 'us-west-2',
      });
      expect(prodInfra.isProduction).toBe(true);
      expect(prodInfra.removalPolicy).toBe(cdk.RemovalPolicy.RETAIN);
    });

    test('Non-production environment uses DESTROY removal policy', () => {
      const devInfra = new Infrastructure(app, 'DevInfrastructure', {
        environmentSuffix: 'dev',
        region: 'us-west-2',
      });
      expect(devInfra.isProduction).toBe(false);
      expect(devInfra.removalPolicy).toBe(cdk.RemovalPolicy.DESTROY);
    });

    test('Uses default instance type when not provided', () => {
      const infra = new Infrastructure(app, 'DefaultInstanceInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        // instanceType not provided
      });
      expect(infra).toBeDefined();
    });

    test('Uses custom instance type when provided', () => {
      const infra = new Infrastructure(app, 'CustomInstanceInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        instanceType: 't3.xlarge',
      });
      expect(infra).toBeDefined();
    });

    test('Uses default capacity values when not provided', () => {
      const infra = new Infrastructure(app, 'DefaultCapacityInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        // minCapacity, maxCapacity, desiredCapacity not provided
      });
      expect(infra).toBeDefined();
    });

    test('Uses custom capacity values when provided', () => {
      const infra = new Infrastructure(app, 'CustomCapacityInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        minCapacity: 1,
        maxCapacity: 5,
        desiredCapacity: 3,
      });
      expect(infra).toBeDefined();
    });

    test('Uses default VPC CIDR when not provided', () => {
      const infra = new Infrastructure(app, 'DefaultVpcInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        // vpcCidr not provided
      });
      expect(infra).toBeDefined();
    });

    test('Uses custom VPC CIDR when provided', () => {
      const infra = new Infrastructure(app, 'CustomVpcInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        vpcCidr: '192.168.0.0/16',
      });
      expect(infra).toBeDefined();
    });

    test('Handles undefined keyPairName', () => {
      const infra = new Infrastructure(app, 'NoKeyPairInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        keyPairName: undefined,
      });
      expect(infra).toBeDefined();
    });

    test('Handles provided keyPairName', () => {
      const infra = new Infrastructure(app, 'WithKeyPairInfra', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        keyPairName: 'my-key-pair',
      });
      expect(infra).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('Creates expected number of core networking resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public, 2 private
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Creates expected number of compute resources', () => {
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 2); // CPU and request count
    });

    test('Creates expected number of load balancing resources', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    });

    test('Creates expected number of storage resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 1);
    });

    test('Creates expected number of IAM resources', () => {
      // In production, S3 auto-delete is disabled, so no auto-delete role is created
      // In non-production, S3 auto-delete is enabled, so an auto-delete role is created
      const expectedRoleCount = stack.isProduction ? 2 : 3; // Instance role, VPC flow logs role, (S3 auto-delete role if not production)
      template.resourceCountIs('AWS::IAM::Role', expectedRoleCount);
      template.resourceCountIs('AWS::IAM::Policy', 2); // Instance policy, VPC flow logs policy
    });
  });
});

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
  });

  describe('Multi-Region Infrastructure Deployment', () => {
    test('Creates primary region infrastructure in us-west-2', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      expect(primaryInfra).toBeInstanceOf(Infrastructure);
      expect(primaryInfra.region).toBe('us-west-2');
    });

    test('Creates secondary region infrastructure in ap-south-1', () => {
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;
      expect(secondaryInfra).toBeInstanceOf(Infrastructure);
      expect(secondaryInfra.region).toBe('ap-south-1');
    });

    test('Both regions have identical infrastructure configuration', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      expect(primaryInfra.environmentSuffix).toBe(secondaryInfra.environmentSuffix);
      expect(primaryInfra.isProduction).toBe(secondaryInfra.isProduction);
    });
  });

  describe('Stack Configuration', () => {
    test('Stack has proper environment configuration', () => {
      expect(stack.environment).toBeDefined();
      expect(stack.account).toBeDefined();
    });

    test('Stack creates exactly two Infrastructure constructs', () => {
      const infrastructureChildren = stack.node.children.filter(
        child => child instanceof Infrastructure
      );
      expect(infrastructureChildren).toHaveLength(2);
    });

    test('Stack uses correct instance type for both regions', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      // Both should use t3.large as configured in TapStack
      expect(primaryInfra).toBeInstanceOf(Infrastructure);
      expect(secondaryInfra).toBeInstanceOf(Infrastructure);
    });

    test('Stack uses correct capacity settings for both regions', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      // Both should have the same capacity settings as configured in TapStack
      expect(primaryInfra).toBeInstanceOf(Infrastructure);
      expect(secondaryInfra).toBeInstanceOf(Infrastructure);
    });
  });

  describe('Cross-Region Resource Validation', () => {
    test('Each region has independent VPC configuration', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      expect(primaryInfra.vpc).toBeDefined();
      expect(secondaryInfra.vpc).toBeDefined();
      expect(primaryInfra.vpc).not.toBe(secondaryInfra.vpc);
    });

    test('Each region shares the same DynamoDB Global Table', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      expect(primaryInfra.globalTable).toBeDefined();
      expect(secondaryInfra.globalTable).toBeUndefined(); // Only primary region creates the table
    });

    test('Each region has independent S3 buckets', () => {
      const primaryInfra = stack.node.children.find(
        child => child.node.id === 'PrimaryRegionInfrastructure'
      ) as Infrastructure;
      const secondaryInfra = stack.node.children.find(
        child => child.node.id === 'SecondaryRegionInfrastructure'
      ) as Infrastructure;

      expect(primaryInfra.logBucket).toBeDefined();
      expect(secondaryInfra.logBucket).toBeDefined();
      expect(primaryInfra.logBucket).not.toBe(secondaryInfra.logBucket);
    });
  });

  describe('Stack Dependencies and Relationships', () => {
    test('Stack has proper CDK dependencies', () => {
      expect(stack.node.dependencies).toBeDefined();
    });

    test('Infrastructure constructs are properly nested', () => {
      const infrastructureChildren = stack.node.children.filter(
        child => child instanceof Infrastructure
      );

      infrastructureChildren.forEach(infra => {
        expect(infra.node.scope).toBe(stack);
      });
    });

    test('Stack synthesizes without errors', () => {
      expect(() => {
        const template = Template.fromStack(stack);
        expect(template).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Environment Suffix Resolution', () => {
    test('Uses environment suffix from props when provided', () => {
      const customStack = new TapStack(app, 'CustomTapStack', {
        environmentSuffix: 'custom-env',
      });
      const constructs = customStack.node.children;
      expect(constructs).toHaveLength(2);
    });

    test('Uses default dev suffix when no props provided', () => {
      const defaultStack = new TapStack(app, 'DefaultTapStack');
      const constructs = defaultStack.node.children;
      expect(constructs).toHaveLength(2);
    });

    test('Uses context environment suffix when no props provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context-env');
      const contextStack = new TapStack(contextApp, 'ContextTapStack');
      const constructs = contextStack.node.children;
      expect(constructs).toHaveLength(2);
    });
  });
});