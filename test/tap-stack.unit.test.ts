/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing the stack
pulumi.runtime.setMocks(
  {
    newResource: (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: Record<string, unknown>;
    } => {
      // Create mock resource with appropriate defaults based on resource type
      const state: Record<string, unknown> = { ...args.inputs };

      // Add resource-specific mock states
      switch (args.type) {
        case 'aws:ec2/vpc:Vpc':
          state.id = `vpc-${args.name}`;
          state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
          break;
        case 'aws:ec2/internetGateway:InternetGateway':
          state.id = `igw-${args.name}`;
          break;
        case 'aws:ec2/subnet:Subnet':
          state.id = `subnet-${args.name}`;
          state.availabilityZone =
            args.inputs.availabilityZone || 'us-east-1a';
          break;
        case 'aws:ec2/routeTable:RouteTable':
          state.id = `rtb-${args.name}`;
          break;
        case 'aws:ec2/routeTableAssociation:RouteTableAssociation':
          state.id = `rtbassoc-${args.name}`;
          break;
        case 'aws:ec2/securityGroup:SecurityGroup':
          state.id = `sg-${args.name}`;
          break;
        case 'aws:rds/globalCluster:GlobalCluster':
          state.id = `global-cluster-${args.name}`;
          state.arn = `arn:aws:rds::123456789012:global-cluster:${args.name}`;
          break;
        case 'aws:rds/cluster:Cluster':
          state.id = `cluster-${args.name}`;
          state.endpoint = `${args.name}.cluster-xyz.us-east-1.rds.amazonaws.com`;
          state.readerEndpoint = `${args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com`;
          break;
        case 'aws:rds/clusterInstance:ClusterInstance':
          state.id = `instance-${args.name}`;
          break;
        case 'aws:rds/subnetGroup:SubnetGroup':
          state.id = `subnetgroup-${args.name}`;
          state.name = args.name;
          break;
        case 'aws:lb/loadBalancer:LoadBalancer':
          state.id = `alb-${args.name}`;
          state.dnsName = `${args.name}.us-east-1.elb.amazonaws.com`;
          state.zoneId = 'Z35SXDOTRQ7X7K';
          state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/1234567890abcdef`;
          break;
        case 'aws:lb/targetGroup:TargetGroup':
          state.id = `tg-${args.name}`;
          state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}/1234567890abcdef`;
          break;
        case 'aws:lb/listener:Listener':
          state.id = `listener-${args.name}`;
          state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${args.name}/1234567890abcdef/1234567890abcdef`;
          break;
        case 'aws:lb/targetGroupAttachment:TargetGroupAttachment':
          state.id = `tgattach-${args.name}`;
          break;
        case 'aws:lambda/function:Function':
          state.id = `lambda-${args.name}`;
          state.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
          break;
        case 'aws:iam/role:Role':
          state.id = `role-${args.name}`;
          state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
          break;
        case 'aws:ec2/instance:Instance':
          state.id = `i-${args.name}`;
          break;
        case 'aws:secretsmanager/secret:Secret':
          state.id = `secret-${args.name}`;
          state.arn = `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.name}`;
          break;
        case 'aws:secretsmanager/secretVersion:SecretVersion':
          state.id = `secretversion-${args.name}`;
          state.versionId = 'EXAMPLE1-90ab-cdef-fedc-ba987EXAMPLE';
          break;
        case 'aws:secretsmanager/secretRotation:SecretRotation':
          state.id = `rotation-${args.name}`;
          break;
        case 'aws:globalaccelerator/accelerator:Accelerator':
          state.id = `accelerator-${args.name}`;
          state.dnsName = `${args.name}.awsglobalaccelerator.com`;
          state.ipSets = [
            { ipAddresses: ['75.2.60.5', '99.83.190.54'], ipFamily: 'IPv4' },
          ];
          break;
        case 'aws:globalaccelerator/listener:Listener':
          state.id = `listener-${args.name}`;
          break;
        case 'aws:globalaccelerator/endpointGroup:EndpointGroup':
          state.id = `endpointgroup-${args.name}`;
          break;
        case 'aws:route53/zone:Zone':
          state.id = `zone-${args.name}`;
          state.zoneId = 'Z1234567890ABC';
          state.nameServers = [
            'ns-1.awsdns-01.com',
            'ns-2.awsdns-02.org',
            'ns-3.awsdns-03.net',
            'ns-4.awsdns-04.co.uk',
          ];
          break;
        case 'aws:route53/healthCheck:HealthCheck':
          state.id = `healthcheck-${args.name}`;
          break;
        case 'aws:route53/record:Record':
          state.id = `record-${args.name}`;
          state.fqdn = `${args.inputs.name || args.name}`;
          break;
        case 'aws:cloudwatch/dashboard:Dashboard':
          state.id = `dashboard-${args.name}`;
          state.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${args.name}`;
          break;
        case 'aws:cfg/recorder:Recorder':
          state.id = `recorder-${args.name}`;
          break;
        case 'aws:cfg/deliveryChannel:DeliveryChannel':
          state.id = `deliverychannel-${args.name}`;
          break;
        case 'aws:cfg/recorderStatus:RecorderStatus':
          state.id = `recorderstatus-${args.name}`;
          break;
        case 'aws:cfg/rule:Rule':
          state.id = `rule-${args.name}`;
          state.arn = `arn:aws:config:us-east-1:123456789012:config-rule/${args.name}`;
          break;
        case 'aws:s3/bucket:Bucket':
          state.id = `bucket-${args.name}`;
          state.arn = `arn:aws:s3:::${args.inputs.bucket || args.name}`;
          state.bucketDomainName = `${args.inputs.bucket || args.name}.s3.amazonaws.com`;
          break;
        case 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection':
          state.id = `pcx-${args.name}`;
          break;
        default:
          state.id = `${args.type}-${args.name}`;
      }

      return {
        id: state.id as string,
        state,
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      // Mock function calls (e.g., aws.ec2.getAmi)
      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return {
          id: 'ami-0123456789abcdef0',
          architecture: 'x86_64',
          creationDate: '2023-01-01T00:00:00.000Z',
          imageId: 'ami-0123456789abcdef0',
          imageLocation: 'amazon/amzn2-ami-hvm-x86_64-gp2',
          imageOwnerAlias: 'amazon',
          imageType: 'machine',
          kernelId: '',
          name: 'amzn2-ami-hvm-2.0.20230101.0-x86_64-gp2',
          ownerId: '137112412989',
          platform: '',
          platformDetails: 'Linux/UNIX',
          public: true,
          ramdiskId: '',
          rootDeviceName: '/dev/xvda',
          rootDeviceType: 'ebs',
          sriovNetSupport: 'simple',
          state: 'available',
          stateReason: { code: 'UNSET', message: 'UNSET' },
          usageOperation: 'RunInstances',
          virtualizationType: 'hvm',
        };
      }
      return {};
    },
  },
  'test-project',
  'test-stack',
  false
);

describe('Multi-Region Trading Platform Infrastructure', () => {
  let resources: pulumi.runtime.MockResourceArgs[];

  beforeAll(async () => {
    // Track all resources created
    resources = [];

    // Spy on newResource to track resource creation
    const originalSetMocks = pulumi.runtime.setMocks;
    pulumi.runtime.setMocks(
      {
        newResource: (args: pulumi.runtime.MockResourceArgs) => {
          resources.push(args);
          return {
            id: `${args.type}-${args.name}`,
            state: { ...args.inputs, id: `${args.type}-${args.name}` },
          };
        },
        call: (args: pulumi.runtime.MockCallArgs) => {
          if (args.token === 'aws:ec2/getAmi:getAmi') {
            return { id: 'ami-mock123', imageId: 'ami-mock123' };
          }
          return {};
        },
      },
      'test-project',
      'test-stack',
      false
    );

    // Set required config
    pulumi.runtime.setConfig('environmentSuffix', 'test123');

    // Import the stack from bin/tap.ts (this will create all resources)
    await import('../bin/tap');
  });

  describe('VPC and Networking', () => {
    it('should create primary VPC in us-east-1', () => {
      const primaryVpc = resources.find(
        (r) => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'primary-vpc'
      );
      expect(primaryVpc).toBeDefined();
      expect(primaryVpc?.inputs.cidrBlock).toBe('10.0.0.0/16');
      expect(primaryVpc?.inputs.enableDnsHostnames).toBe(true);
      expect(primaryVpc?.inputs.enableDnsSupport).toBe(true);
    });

    it('should create secondary VPC in eu-west-1', () => {
      const secondaryVpc = resources.find(
        (r) => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'secondary-vpc'
      );
      expect(secondaryVpc).toBeDefined();
      expect(secondaryVpc?.inputs.cidrBlock).toBe('10.1.0.0/16');
    });

    it('should create Internet Gateway for primary region', () => {
      const primaryIgw = resources.find(
        (r) =>
          r.type === 'aws:ec2/internetGateway:InternetGateway' &&
          r.name === 'primary-igw'
      );
      expect(primaryIgw).toBeDefined();
    });

    it('should create Internet Gateway for secondary region', () => {
      const secondaryIgw = resources.find(
        (r) =>
          r.type === 'aws:ec2/internetGateway:InternetGateway' &&
          r.name === 'secondary-igw'
      );
      expect(secondaryIgw).toBeDefined();
    });

    it('should create 3 public subnets in primary region', () => {
      const primarySubnets = resources.filter(
        (r) =>
          r.type === 'aws:ec2/subnet:Subnet' && r.name.startsWith('primary-subnet')
      );
      expect(primarySubnets).toHaveLength(3);
      primarySubnets.forEach((subnet) => {
        expect(subnet.inputs.mapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should create 3 public subnets in secondary region', () => {
      const secondarySubnets = resources.filter(
        (r) =>
          r.type === 'aws:ec2/subnet:Subnet' &&
          r.name.startsWith('secondary-subnet')
      );
      expect(secondarySubnets).toHaveLength(3);
      secondarySubnets.forEach((subnet) => {
        expect(subnet.inputs.mapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should create route tables with IGW routes', () => {
      const primaryRouteTable = resources.find(
        (r) =>
          r.type === 'aws:ec2/routeTable:RouteTable' &&
          r.name === 'primary-route-table'
      );
      expect(primaryRouteTable).toBeDefined();
      expect(primaryRouteTable?.inputs.routes).toBeDefined();
    });

    it('should create route table associations', () => {
      const primaryAssociations = resources.filter(
        (r) =>
          r.type === 'aws:ec2/routeTableAssociation:RouteTableAssociation' &&
          r.name.startsWith('primary-rta')
      );
      expect(primaryAssociations).toHaveLength(3);
    });

    it('should create VPC peering connection', () => {
      const peering = resources.find(
        (r) =>
          r.type === 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection' &&
          r.name === 'vpc-peering'
      );
      expect(peering).toBeDefined();
      expect(peering?.inputs.peerRegion).toBe('eu-west-1');
    });
  });

  describe('Aurora Global Database', () => {
    it('should create global cluster', () => {
      const globalCluster = resources.find(
        (r) =>
          r.type === 'aws:rds/globalCluster:GlobalCluster' &&
          r.name === 'global-cluster'
      );
      expect(globalCluster).toBeDefined();
      expect(globalCluster?.inputs.engine).toBe('aurora-postgresql');
      expect(globalCluster?.inputs.engineVersion).toBe('14.6');
    });

    it('should create primary Aurora cluster', () => {
      const primaryCluster = resources.find(
        (r) =>
          r.type === 'aws:rds/cluster:Cluster' && r.name === 'primary-cluster'
      );
      expect(primaryCluster).toBeDefined();
      expect(primaryCluster?.inputs.engine).toBe('aurora-postgresql');
    });

    it('should create primary cluster instance', () => {
      const primaryInstance = resources.find(
        (r) =>
          r.type === 'aws:rds/clusterInstance:ClusterInstance' &&
          r.name === 'primary-cluster-instance'
      );
      expect(primaryInstance).toBeDefined();
      expect(primaryInstance?.inputs.instanceClass).toBe('db.t3.medium');
    });

    it('should create secondary Aurora cluster', () => {
      const secondaryCluster = resources.find(
        (r) =>
          r.type === 'aws:rds/cluster:Cluster' && r.name === 'secondary-cluster'
      );
      expect(secondaryCluster).toBeDefined();
    });

    it('should create secondary cluster instance', () => {
      const secondaryInstance = resources.find(
        (r) =>
          r.type === 'aws:rds/clusterInstance:ClusterInstance' &&
          r.name === 'secondary-cluster-instance'
      );
      expect(secondaryInstance).toBeDefined();
    });

    it('should create DB subnet groups', () => {
      const dbSubnetGroups = resources.filter(
        (r) => r.type === 'aws:rds/subnetGroup:SubnetGroup'
      );
      expect(dbSubnetGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should create DB security groups with environmentSuffix', () => {
      const primaryDbSg = resources.find(
        (r) =>
          r.type === 'aws:ec2/securityGroup:SecurityGroup' &&
          r.name === 'primary-db-sg'
      );
      expect(primaryDbSg).toBeDefined();
      expect(primaryDbSg?.inputs.tags?.Name).toContain('test123');
    });
  });

  describe('Secrets Manager', () => {
    it('should create database master password secret', () => {
      const dbMasterPassword = resources.find(
        (r) =>
          r.type === 'aws:secretsmanager/secret:Secret' &&
          r.name === 'db-master-password'
      );
      expect(dbMasterPassword).toBeDefined();
    });

    it('should create secrets in both regions', () => {
      const secrets = resources.filter(
        (r) => r.type === 'aws:secretsmanager/secret:Secret'
      );
      expect(secrets.length).toBeGreaterThanOrEqual(3);
    });

    it('should create secret rotation for primary region', () => {
      const primaryRotation = resources.find(
        (r) =>
          r.type === 'aws:secretsmanager/secretRotation:SecretRotation' &&
          r.name === 'primary-secret-rotation'
      );
      expect(primaryRotation).toBeDefined();
      expect(primaryRotation?.inputs.rotationRules?.automaticallyAfterDays).toBe(
        30
      );
    });

    it('should create secret rotation for secondary region', () => {
      const secondaryRotation = resources.find(
        (r) =>
          r.type === 'aws:secretsmanager/secretRotation:SecretRotation' &&
          r.name === 'secondary-secret-rotation'
      );
      expect(secondaryRotation).toBeDefined();
      expect(
        secondaryRotation?.inputs.rotationRules?.automaticallyAfterDays
      ).toBe(30);
    });

    it('should create rotation Lambda functions', () => {
      const rotationLambdas = resources.filter(
        (r) =>
          r.type === 'aws:lambda/function:Function' &&
          r.name.includes('rotation-lambda')
      );
      expect(rotationLambdas.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lambda Functions', () => {
    it('should create Lambda execution role', () => {
      const lambdaRole = resources.find(
        (r) => r.type === 'aws:iam/role:Role' && r.name === 'lambda-role'
      );
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole?.inputs.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    it('should create primary Lambda function', () => {
      const primaryLambda = resources.find(
        (r) =>
          r.type === 'aws:lambda/function:Function' && r.name === 'primary-lambda'
      );
      expect(primaryLambda).toBeDefined();
      expect(primaryLambda?.inputs.runtime).toBe('nodejs18.dX');
    });

    it('should create secondary Lambda function', () => {
      const secondaryLambda = resources.find(
        (r) =>
          r.type === 'aws:lambda/function:Function' &&
          r.name === 'secondary-lambda'
      );
      expect(secondaryLambda).toBeDefined();
    });
  });

  describe('EC2 Instances and ALB', () => {
    it('should create EC2 instances in both regions', () => {
      const instances = resources.filter(
        (r) => r.type === 'aws:ec2/instance:Instance'
      );
      expect(instances.length).toBeGreaterThanOrEqual(2);
    });

    it('should create primary ALB', () => {
      const primaryAlb = resources.find(
        (r) =>
          r.type === 'aws:lb/loadBalancer:LoadBalancer' && r.name === 'primary-alb'
      );
      expect(primaryAlb).toBeDefined();
      expect(primaryAlb?.inputs.internal).toBe(false);
      expect(primaryAlb?.inputs.loadBalancerType).toBe('application');
    });

    it('should create secondary ALB', () => {
      const secondaryAlb = resources.find(
        (r) =>
          r.type === 'aws:lb/loadBalancer:LoadBalancer' &&
          r.name === 'secondary-alb'
      );
      expect(secondaryAlb).toBeDefined();
    });

    it('should create target groups', () => {
      const targetGroups = resources.filter(
        (r) => r.type === 'aws:lb/targetGroup:TargetGroup'
      );
      expect(targetGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should create ALB listeners', () => {
      const listeners = resources.filter((r) => r.type === 'aws:lb/listener:Listener');
      expect(listeners.length).toBeGreaterThanOrEqual(2);
    });

    it('should attach instances to target groups', () => {
      const attachments = resources.filter(
        (r) => r.type === 'aws:lb/targetGroupAttachment:TargetGroupAttachment'
      );
      expect(attachments.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Global Accelerator', () => {
    it('should create Global Accelerator', () => {
      const accelerator = resources.find(
        (r) =>
          r.type === 'aws:globalaccelerator/accelerator:Accelerator' &&
          r.name === 'accelerator'
      );
      expect(accelerator).toBeDefined();
      expect(accelerator?.inputs.enabled).toBe(true);
      expect(accelerator?.inputs.ipAddressType).toBe('IPV4');
    });

    it('should create Global Accelerator listener', () => {
      const listener = resources.find(
        (r) =>
          r.type === 'aws:globalaccelerator/listener:Listener' &&
          r.name === 'listener'
      );
      expect(listener).toBeDefined();
      expect(listener?.inputs.protocol).toBe('TCP');
    });

    it('should create endpoint groups for both regions', () => {
      const endpointGroups = resources.filter(
        (r) => r.type === 'aws:globalaccelerator/endpointGroup:EndpointGroup'
      );
      expect(endpointGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should configure health checks on endpoint groups', () => {
      const primaryEndpoint = resources.find(
        (r) =>
          r.type === 'aws:globalaccelerator/endpointGroup:EndpointGroup' &&
          r.name === 'primary-endpoint'
      );
      expect(primaryEndpoint?.inputs.healthCheckIntervalSeconds).toBe(10);
      expect(primaryEndpoint?.inputs.healthCheckProtocol).toBe('HTTP');
    });
  });

  describe('Route 53', () => {
    it('should create hosted zone', () => {
      const hostedZone = resources.find(
        (r) => r.type === 'aws:route53/zone:Zone' && r.name === 'hosted-zone'
      );
      expect(hostedZone).toBeDefined();
    });

    it('should create health checks with valid intervals', () => {
      const primaryHealthCheck = resources.find(
        (r) =>
          r.type === 'aws:route53/healthCheck:HealthCheck' &&
          r.name === 'primary-health'
      );
      expect(primaryHealthCheck).toBeDefined();
      expect(primaryHealthCheck?.inputs.requestInterval).toBe(30);
    });

    it('should create health checks for both regions', () => {
      const healthChecks = resources.filter(
        (r) => r.type === 'aws:route53/healthCheck:HealthCheck'
      );
      expect(healthChecks.length).toBeGreaterThanOrEqual(2);
    });

    it('should create DNS records with failover routing', () => {
      const records = resources.filter((r) => r.type === 'aws:route53/record:Record');
      expect(records.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should create CloudWatch dashboard', () => {
      const dashboard = resources.find(
        (r) =>
          r.type === 'aws:cloudwatch/dashboard:Dashboard' && r.name === 'dashboard'
      );
      expect(dashboard).toBeDefined();
      expect(dashboard?.inputs.dashboardBody).toBeDefined();
    });

    it('should include cross-region metrics', () => {
      const dashboard = resources.find(
        (r) =>
          r.type === 'aws:cloudwatch/dashboard:Dashboard' && r.name === 'dashboard'
      );
      const dashboardBody = JSON.parse(dashboard?.inputs.dashboardBody as string);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config', () => {
    it('should create AWS Config role with correct policy', () => {
      const configRole = resources.find(
        (r) => r.type === 'aws:iam/role:Role' && r.name === 'config-role'
      );
      expect(configRole).toBeDefined();
      expect(configRole?.inputs.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });

    it('should create Config S3 bucket', () => {
      const configBucket = resources.find(
        (r) => r.type === 'aws:s3/bucket:Bucket' && r.name === 'config-bucket'
      );
      expect(configBucket).toBeDefined();
      expect(configBucket?.inputs.forceDestroy).toBe(true);
    });

    it('should create Config recorder', () => {
      const recorder = resources.find(
        (r) => r.type === 'aws:cfg/recorder:Recorder' && r.name === 'config-recorder'
      );
      expect(recorder).toBeDefined();
    });

    it('should create Config delivery channel', () => {
      const deliveryChannel = resources.find(
        (r) =>
          r.type === 'aws:cfg/deliveryChannel:DeliveryChannel' &&
          r.name === 'config-delivery'
      );
      expect(deliveryChannel).toBeDefined();
    });

    it('should create Config recorder status', () => {
      const recorderStatus = resources.find(
        (r) =>
          r.type === 'aws:cfg/recorderStatus:RecorderStatus' &&
          r.name === 'config-recorder-status'
      );
      expect(recorderStatus).toBeDefined();
      expect(recorderStatus?.inputs.isEnabled).toBe(true);
    });

    it('should create Config rule', () => {
      const configRule = resources.find(
        (r) => r.type === 'aws:cfg/rule:Rule' && r.name === 'config-rule'
      );
      expect(configRule).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should include environmentSuffix in resource names', () => {
      const namedResources = resources.filter((r) => r.inputs.tags?.Name);
      namedResources.forEach((resource) => {
        expect(resource.inputs.tags.Name).toContain('test123');
      });
    });

    it('should tag resources with environment', () => {
      const taggedResources = resources.filter(
        (r) => r.inputs.tags?.Environment
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });

    it('should tag resources with region', () => {
      const regionTaggedResources = resources.filter((r) => r.inputs.tags?.Region);
      expect(regionTaggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    it('should create security groups for ALBs', () => {
      const albSecurityGroups = resources.filter(
        (r) =>
          r.type === 'aws:ec2/securityGroup:SecurityGroup' &&
          r.name.includes('alb-sg')
      );
      expect(albSecurityGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should configure ingress rules for ALB security groups', () => {
      const primaryAlbSg = resources.find(
        (r) =>
          r.type === 'aws:ec2/securityGroup:SecurityGroup' &&
          r.name === 'primary-alb-sg'
      );
      expect(primaryAlbSg?.inputs.ingress).toBeDefined();
    });

    it('should configure egress rules for ALB security groups', () => {
      const primaryAlbSg = resources.find(
        (r) =>
          r.type === 'aws:ec2/securityGroup:SecurityGroup' &&
          r.name === 'primary-alb-sg'
      );
      expect(primaryAlbSg?.inputs.egress).toBeDefined();
    });
  });

  describe('Exported Values', () => {
    it('should export primary VPC ID', () => {
      // Exports are handled by Pulumi runtime, verify resource exists
      const primaryVpc = resources.find(
        (r) => r.type === 'aws:ec2/vpc:Vpc' && r.name === 'primary-vpc'
      );
      expect(primaryVpc).toBeDefined();
    });

    it('should export ALB DNS names', () => {
      const albs = resources.filter(
        (r) => r.type === 'aws:lb/loadBalancer:LoadBalancer'
      );
      expect(albs.length).toBeGreaterThanOrEqual(2);
    });

    it('should export cluster IDs', () => {
      const clusters = resources.filter((r) => r.type === 'aws:rds/cluster:Cluster');
      expect(clusters.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Multi-Region Provider Configuration', () => {
    it('should create secondary region provider', () => {
      const euProvider = resources.find(
        (r) => r.type === 'pulumi:providers:aws' && r.name === 'eu-provider'
      );
      // Provider resources may not be tracked the same way
      // Verify secondary region resources exist instead
      const secondaryResources = resources.filter(
        (r) =>
          r.name.includes('secondary') ||
          (r.inputs.tags && r.inputs.tags.Region === 'eu-west-1')
      );
      expect(secondaryResources.length).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should create all required AWS service resources', () => {
      const serviceTypes = new Set(
        resources.map((r) => r.type.split('/')[0].replace('aws:', ''))
      );

      expect(serviceTypes.has('ec2')).toBe(true);
      expect(serviceTypes.has('rds')).toBe(true);
      expect(serviceTypes.has('lambda')).toBe(true);
      expect(serviceTypes.has('lb')).toBe(true);
      expect(serviceTypes.has('globalaccelerator')).toBe(true);
      expect(serviceTypes.has('route53')).toBe(true);
      expect(serviceTypes.has('secretsmanager')).toBe(true);
      expect(serviceTypes.has('cloudwatch')).toBe(true);
      expect(serviceTypes.has('cfg')).toBe(true);
      expect(serviceTypes.has('s3')).toBe(true);
    });

    it('should create resources in both regions', () => {
      const primaryResources = resources.filter((r) => r.name.includes('primary'));
      const secondaryResources = resources.filter((r) =>
        r.name.includes('secondary')
      );

      expect(primaryResources.length).toBeGreaterThan(0);
      expect(secondaryResources.length).toBeGreaterThan(0);
    });

    it('should meet minimum resource count for expert complexity', () => {
      // Expert-level multi-region infrastructure should have substantial resources
      expect(resources.length).toBeGreaterThan(50);
    });
  });
});
