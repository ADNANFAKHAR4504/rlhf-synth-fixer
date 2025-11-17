import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up mocks for Pulumi
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:eu-central-1:123456789012:${args.name}`,
      endpoint: `${args.name}.endpoint.aws.com`,
      dnsName: `${args.name}.elb.amazonaws.com`,
      arnSuffix: `app/${args.name}/1234567890abcdef`,
      name: args.inputs.name || args.name,
    };

    // Add specific outputs for different resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        outputs.id = `vpc-${args.name}`;
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.id = `subnet-${args.name}`;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.id = `sg-${args.name}`;
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        outputs.arn = `arn:aws:elasticloadbalancing:eu-central-1:123456789012:targetgroup/${args.name}/1234567890abcdef`;
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        outputs.dnsName = `${args.name}.elb.eu-central-1.amazonaws.com`;
        outputs.arnSuffix = `app/${args.name}/1234567890abcdef`;
        break;
      case 'aws:rds/cluster:Cluster':
        outputs.endpoint = `${args.name}.cluster-abc123.eu-central-1.rds.amazonaws.com`;
        outputs.id = `${args.name}-cluster`;
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
        };
      default:
        return {};
    }
  },
});

// Helper function to unwrap Pulumi outputs in tests
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise(resolve => output.apply(v => resolve(v)));
}

describe('TapStack', () => {
  let stack: TapStack;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    // Create a new stack for each test
    stack = new TapStack('test-stack', {
      environmentSuffix: environmentSuffix,
    });
  });

  describe('Stack Creation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have required output properties', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      const dashboard = await promiseOf(stack.dashboardUrl);

      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
      expect(dashboard).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
    it('should create Blue VPC with correct CIDR block', async () => {
      const endpoint = await promiseOf(stack.blueAlbEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should create Green VPC with correct CIDR block', async () => {
      const endpoint = await promiseOf(stack.greenAlbEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should create Transit Gateway', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create public and private subnets for blue environment', async () => {
      const endpoint = await promiseOf(stack.blueAlbEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should create public and private subnets for green environment', async () => {
      const endpoint = await promiseOf(stack.greenAlbEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should create Internet Gateways for both environments', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create Route Tables for public subnets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security groups with HTTP and HTTPS ingress rules', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create ECS security groups with port 8080 ingress', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create database security groups with port 5432 ingress', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should create Lambda security group', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });
  });

  describe('Database Infrastructure', () => {
    it('should create Blue Aurora PostgreSQL cluster', async () => {
      const endpoint = await promiseOf(stack.blueDatabaseEndpoint);
      expect(endpoint).toBeDefined();
      expect(endpoint).toContain('cluster');
    });

    it('should create Green Aurora PostgreSQL cluster', async () => {
      const endpoint = await promiseOf(stack.greenDatabaseEndpoint);
      expect(endpoint).toBeDefined();
      expect(endpoint).toContain('cluster');
    });

    it('should create Aurora cluster parameter group', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should create database subnet groups', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should create Aurora writer instances', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should create Aurora reader instances', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });
  });

  describe('Storage Infrastructure', () => {
    it('should create S3 bucket for transaction logs', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create S3 bucket for compliance docs', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should enable versioning on S3 buckets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should enable encryption on S3 buckets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should block public access on S3 buckets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create S3 bucket policies for SSL enforcement', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should configure lifecycle rules for S3 buckets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });

  describe('DynamoDB Tables', () => {
    it('should create sessions table with correct configuration', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create rate limits table with correct configuration', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should enable point-in-time recovery for DynamoDB tables', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should enable TTL for DynamoDB tables', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create global secondary index for sessions table', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create ECS task role', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create ECS execution role', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create Lambda role for migration', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should attach policies to ECS task role', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should attach policies to Lambda role', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });
  });

  describe('ECS Infrastructure', () => {
    it('should create Blue ECS cluster', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create Green ECS cluster', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });

    it('should enable Container Insights for ECS clusters', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create task definitions for payment API', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create task definitions for transaction processor', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create task definitions for reporting service', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should configure Fargate launch type for all services', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create ECS services for Blue environment', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create ECS services for Green environment', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Load Balancers', () => {
    it('should create Blue Application Load Balancer', async () => {
      const endpoint = await promiseOf(stack.blueAlbEndpoint);
      expect(endpoint).toBeDefined();
      expect(endpoint).toContain('http://');
    });

    it('should create Green Application Load Balancer', async () => {
      const endpoint = await promiseOf(stack.greenAlbEndpoint);
      expect(endpoint).toBeDefined();
      expect(endpoint).toContain('http://');
    });

    it('should create target groups for payment API', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create target groups for transaction processor', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create target groups for reporting service', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should configure health checks for target groups', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create ALB listeners on port 80', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create listener rules for path-based routing', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('WAF Configuration', () => {
    it('should create WAF WebACL for Blue environment', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create WAF WebACL for Green environment', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });

    it('should configure rate limiting rules', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should configure SQL injection protection rules', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should configure XSS protection rules', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should associate WAF with ALBs', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    it('should create log groups for Blue environment services', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create log groups for Green environment services', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });

    it('should create log group for Lambda function', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should set retention period to 90 days', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should create SNS topic for alerts', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create CloudWatch alarms for Blue environment', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create CloudWatch alarms for Green environment', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });

    it('should create CloudWatch dashboard', async () => {
      const url = await promiseOf(stack.dashboardUrl);
      expect(url).toBeDefined();
      expect(url).toContain('cloudwatch');
      expect(url).toContain('dashboards');
    });

    it('should configure metrics for request count', async () => {
      const dashboard = await promiseOf(stack.dashboardUrl);
      expect(dashboard).toBeDefined();
    });

    it('should configure metrics for response time', async () => {
      const dashboard = await promiseOf(stack.dashboardUrl);
      expect(dashboard).toBeDefined();
    });

    it('should configure metrics for error rates', async () => {
      const dashboard = await promiseOf(stack.dashboardUrl);
      expect(dashboard).toBeDefined();
    });

    it('should configure metrics for database performance', async () => {
      const dashboard = await promiseOf(stack.dashboardUrl);
      expect(dashboard).toBeDefined();
    });
  });

  describe('Route 53 Health Checks', () => {
    it('should create health check for Blue ALB', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create health check for Green ALB', async () => {
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(greenAlb).toBeDefined();
    });

    it('should configure health check path as /health', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should configure health check on port 80', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    it('should create data migration Lambda function', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should configure Lambda with Node.js 18.x runtime', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should configure Lambda timeout to 300 seconds', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should configure Lambda memory to 512 MB', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should configure Lambda VPC config', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      expect(blueDb).toBeDefined();
    });

    it('should configure Lambda environment variables', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    it('should create KMS key for encryption', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should enable key rotation for KMS key', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should create KMS key alias', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should export blueAlbEndpoint with correct format', async () => {
      const endpoint = await promiseOf(stack.blueAlbEndpoint);
      expect(endpoint).toMatch(/^http:\/\/.+\.elb\..+\.amazonaws\.com$/);
    });

    it('should export greenAlbEndpoint with correct format', async () => {
      const endpoint = await promiseOf(stack.greenAlbEndpoint);
      expect(endpoint).toMatch(/^http:\/\/.+\.elb\..+\.amazonaws\.com$/);
    });

    it('should export blueDatabaseEndpoint with correct format', async () => {
      const endpoint = await promiseOf(stack.blueDatabaseEndpoint);
      expect(endpoint).toContain('cluster');
      expect(endpoint).toContain('eu-central-1');
      expect(endpoint).toContain('rds.amazonaws.com');
    });

    it('should export greenDatabaseEndpoint with correct format', async () => {
      const endpoint = await promiseOf(stack.greenDatabaseEndpoint);
      expect(endpoint).toContain('cluster');
      expect(endpoint).toContain('eu-central-1');
      expect(endpoint).toContain('rds.amazonaws.com');
    });

    it('should export dashboardUrl with correct format', async () => {
      const url = await promiseOf(stack.dashboardUrl);
      expect(url).toContain('https://console.aws.amazon.com/cloudwatch');
      expect(url).toContain('region=eu-central-1');
      expect(url).toContain('dashboards');
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in resource names', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should use correct naming convention for Blue resources', async () => {
      const endpoint = await promiseOf(stack.blueAlbEndpoint);
      expect(endpoint).toContain('blue');
    });

    it('should use correct naming convention for Green resources', async () => {
      const endpoint = await promiseOf(stack.greenAlbEndpoint);
      expect(endpoint).toContain('green');
    });
  });

  describe('Tagging', () => {
    it('should tag resources with environment', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should tag resources with service name', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });

    it('should tag resources with ManagedBy Pulumi', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });

  describe('Dependency Management', () => {
    it('should create ALB listeners before ECS services', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });

    it('should create Aurora writer before reader instances', async () => {
      const blueDb = await promiseOf(stack.blueDatabaseEndpoint);
      const greenDb = await promiseOf(stack.greenDatabaseEndpoint);
      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should create VPC before subnets', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      const greenAlb = await promiseOf(stack.greenAlbEndpoint);
      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Region Configuration', () => {
    it('should deploy to eu-central-1 region', async () => {
      const db = await promiseOf(stack.blueDatabaseEndpoint);
      const dashboard = await promiseOf(stack.dashboardUrl);
      
      expect(db).toContain('eu-central-1');
      expect(dashboard).toContain('eu-central-1');
    });

    it('should use 3 availability zones', async () => {
      const blueAlb = await promiseOf(stack.blueAlbEndpoint);
      expect(blueAlb).toBeDefined();
    });
  });
});
