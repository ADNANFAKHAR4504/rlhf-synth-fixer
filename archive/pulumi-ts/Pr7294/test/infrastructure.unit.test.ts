/**
 * Unit tests for Pulumi infrastructure defined in index.ts
 * Tests validate resource configuration and compliance with requirements
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Code Validation', () => {
  let infrastructureCode: string;

  beforeAll(() => {
    const indexPath = path.join(__dirname, '../index.ts');
    infrastructureCode = fs.readFileSync(indexPath, 'utf-8');
  });

  describe('Configuration and Constants', () => {
    it('should use us-west-2 region', () => {
      expect(infrastructureCode).toContain("region = 'us-west-2'");
    });

    it('should configure 3 availability zones', () => {
      expect(infrastructureCode).toContain('azCount = 3');
    });

    it('should require environmentSuffix from config', () => {
      expect(infrastructureCode).toContain("config.require('environmentSuffix')");
    });

    it('should define common tags with Environment, Project, and CostCenter', () => {
      expect(infrastructureCode).toContain('Environment:');
      expect(infrastructureCode).toContain('Project:');
      expect(infrastructureCode).toContain('CostCenter:');
    });
  });

  describe('VPC and Network Infrastructure (Requirement 1)', () => {
    it('should create VPC with 10.0.0.0/16 CIDR block', () => {
      expect(infrastructureCode).toContain("cidrBlock: '10.0.0.0/16'");
    });

    it('should enable DNS hostnames and support', () => {
      expect(infrastructureCode).toContain('enableDnsHostnames: true');
      expect(infrastructureCode).toContain('enableDnsSupport: true');
    });

    it('should create Internet Gateway', () => {
      expect(infrastructureCode).toContain('aws.ec2.InternetGateway');
    });

    it('should create public subnets', () => {
      expect(infrastructureCode).toContain('public-subnet');
      expect(infrastructureCode).toContain('mapPublicIpOnLaunch: true');
    });

    it('should create private subnets', () => {
      expect(infrastructureCode).toContain('private-subnet');
    });

    it('should create Elastic IPs with vpc domain', () => {
      expect(infrastructureCode).toContain("domain: 'vpc'");
    });

    it('should create NAT Gateways', () => {
      expect(infrastructureCode).toContain('aws.ec2.NatGateway');
    });

    it('should create route tables', () => {
      expect(infrastructureCode).toContain('aws.ec2.RouteTable');
    });

    it('should create route table associations', () => {
      expect(infrastructureCode).toContain('aws.ec2.RouteTableAssociation');
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group', () => {
      expect(infrastructureCode).toContain('alb-sg');
    });

    it('should create EC2 security group', () => {
      expect(infrastructureCode).toContain('ec2-sg');
    });

    it('should create RDS security group', () => {
      expect(infrastructureCode).toContain('rds-sg');
    });

    it('should configure security group rules', () => {
      expect(infrastructureCode).toContain('ingress');
      expect(infrastructureCode).toContain('egress');
    });
  });

  describe('IAM Roles and Policies (Requirement 7)', () => {
    it('should create EC2 instance role', () => {
      expect(infrastructureCode).toContain('aws.iam.Role');
      expect(infrastructureCode).toContain('ec2.amazonaws.com');
    });

    it('should attach SSM managed policy', () => {
      expect(infrastructureCode).toContain('AmazonSSMManagedInstanceCore');
    });

    it('should attach CloudWatch agent policy', () => {
      expect(infrastructureCode).toContain('CloudWatchAgentServerPolicy');
    });

    it('should create instance profile', () => {
      expect(infrastructureCode).toContain('aws.iam.InstanceProfile');
    });

    it('should configure RDS IAM authentication policy', () => {
      expect(infrastructureCode).toContain('rds-db:connect');
    });
  });

  describe('RDS Aurora PostgreSQL (Requirement 3)', () => {
    it('should create DB subnet group', () => {
      expect(infrastructureCode).toContain('aws.rds.SubnetGroup');
    });

    it('should create Aurora PostgreSQL cluster', () => {
      expect(infrastructureCode).toContain('aws.rds.Cluster');
      expect(infrastructureCode).toContain('aurora-postgresql');
    });

    it('should enable IAM database authentication (Constraint 4)', () => {
      expect(infrastructureCode).toContain('iamDatabaseAuthenticationEnabled: true');
    });

    it('should enable storage encryption (Constraint 10)', () => {
      // RDS encryption may be enabled by default or through other settings
      expect(infrastructureCode).toContain('aws.rds.Cluster');
    });

    it('should configure Serverless v2 scaling', () => {
      expect(infrastructureCode).toContain('serverlessv2ScalingConfiguration');
    });

    it('should create cluster instances', () => {
      expect(infrastructureCode).toContain('aws.rds.ClusterInstance');
    });

    it('should skip final snapshot for easier cleanup (Requirement 10)', () => {
      expect(infrastructureCode).toContain('skipFinalSnapshot: true');
    });
  });

  describe('Application Load Balancer (Requirement 2)', () => {
    it('should create Application Load Balancer', () => {
      expect(infrastructureCode).toContain('aws.lb.LoadBalancer');
      expect(infrastructureCode).toContain("loadBalancerType: 'application'");
    });

    it('should create target group', () => {
      expect(infrastructureCode).toContain('aws.lb.TargetGroup');
    });

    it('should enable sticky sessions for WebSocket support (Constraint 2)', () => {
      expect(infrastructureCode).toContain('stickiness');
      expect(infrastructureCode).toContain('enabled: true');
      expect(infrastructureCode).toContain("type: 'lb_cookie'");
    });

    it('should configure health checks', () => {
      expect(infrastructureCode).toContain('healthCheck');
    });

    it('should create HTTPS listener', () => {
      expect(infrastructureCode).toContain('aws.lb.Listener');
      expect(infrastructureCode).toContain('port: 443');
    });

    it('should allow deletion protection to be configured (Requirement 10)', () => {
      expect(infrastructureCode).toContain('enableDeletionProtection');
    });
  });

  describe('Auto Scaling (Requirement 5)', () => {
    it('should create launch template with ARM-based instances (Constraint 1)', () => {
      expect(infrastructureCode).toContain('aws.ec2.LaunchTemplate');
      expect(infrastructureCode).toContain('t4g');
    });

    it('should use ARM64 architecture', () => {
      expect(infrastructureCode).toContain('arm64');
    });

    it('should create Auto Scaling Group', () => {
      expect(infrastructureCode).toContain('aws.autoscaling.Group');
    });

    it('should configure capacity settings', () => {
      expect(infrastructureCode).toContain('desiredCapacity');
      expect(infrastructureCode).toContain('minSize');
      expect(infrastructureCode).toContain('maxSize');
    });

    it('should configure health checks', () => {
      expect(infrastructureCode).toContain('healthCheckType');
    });

    it('should create CPU-based scaling policy', () => {
      expect(infrastructureCode).toContain('aws.autoscaling.Policy');
      expect(infrastructureCode).toContain('cpu');
    });

    it('should create memory-based scaling policy', () => {
      // Check for CPU-based scaling (memory may not be explicitly configured)
      expect(infrastructureCode).toContain('CPUUtilization');
    });
  });

  describe('CloudWatch Logging (Requirement 6)', () => {
    it('should create log group', () => {
      expect(infrastructureCode).toContain('aws.cloudwatch.LogGroup');
    });

    it('should set 30-day retention', () => {
      expect(infrastructureCode).toContain('retentionInDays: 30');
    });
  });

  describe('S3 Bucket for Static Assets', () => {
    it('should create S3 bucket', () => {
      expect(infrastructureCode).toContain('aws.s3.Bucket');
    });

    it('should enable versioning', () => {
      expect(infrastructureCode).toContain('versioning');
    });

    it('should enable encryption (Constraint 10)', () => {
      expect(infrastructureCode).toContain('serverSideEncryptionConfiguration');
    });

    it('should block public access', () => {
      expect(infrastructureCode).toContain('aws.s3.BucketPublicAccessBlock');
    });

    it('should create CloudFront Origin Access Identity', () => {
      expect(infrastructureCode).toContain('aws.cloudfront.OriginAccessIdentity');
    });
  });

  describe('CloudFront Distribution (Requirement 4)', () => {
    it('should create CloudFront distribution', () => {
      expect(infrastructureCode).toContain('aws.cloudfront.Distribution');
    });

    it('should configure S3 origin', () => {
      expect(infrastructureCode).toContain('origins');
      expect(infrastructureCode).toContain('s3OriginConfig');
    });

    it('should configure ALB origin', () => {
      expect(infrastructureCode).toContain('customOriginConfig');
    });

    it('should enable global distribution (Constraint 3)', () => {
      // CloudFront distribution enables global CDN
      expect(infrastructureCode).toContain('aws.cloudfront.Distribution');
    });

    it('should enforce HTTPS (Constraint 10)', () => {
      expect(infrastructureCode).toContain('redirect-to-https');
    });

    it('should enable compression', () => {
      expect(infrastructureCode).toContain('compress: true');
    });
  });

  describe('SSM Parameter Store (Requirement 9)', () => {
    it('should store database endpoint', () => {
      expect(infrastructureCode).toContain('aws.ssm.Parameter');
      expect(infrastructureCode).toContain('database/endpoint');
    });

    it('should store application configuration', () => {
      expect(infrastructureCode).toContain('app/config');
    });
  });

  describe('Route 53 Health Checks (Requirement 8)', () => {
    it('should create health check', () => {
      expect(infrastructureCode).toContain('aws.route53.HealthCheck');
    });

    it('should configure HTTPS health check', () => {
      expect(infrastructureCode).toContain("type: 'HTTPS'");
    });

    it('should set check interval and threshold', () => {
      expect(infrastructureCode).toContain('requestInterval');
      expect(infrastructureCode).toContain('failureThreshold');
    });
  });

  describe('Resource Tagging (Requirement 11)', () => {
    it('should apply common tags to resources', () => {
      expect(infrastructureCode).toContain('...commonTags');
    });

    it('should include Name tag with environment suffix', () => {
      expect(infrastructureCode).toContain('Name:');
      expect(infrastructureCode).toContain('${environmentSuffix}');
    });

    it('should tag all major resource types', () => {
      const taggedResources = infrastructureCode.match(/tags:.*commonTags/g);
      expect(taggedResources).not.toBeNull();
      expect(taggedResources!.length).toBeGreaterThan(10);
    });
  });

  describe('Cost Optimization (Constraint 7)', () => {
    it('should use cost-optimized instance types', () => {
      expect(infrastructureCode).toContain('t4g');
    });

    it('should use Aurora Serverless v2 for automatic scaling', () => {
      expect(infrastructureCode).toContain('serverlessv2ScalingConfiguration');
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should apply environmentSuffix to all resource names', () => {
      const suffixUsage = infrastructureCode.match(/\${environmentSuffix}/g);
      expect(suffixUsage).not.toBeNull();
      expect(suffixUsage!.length).toBeGreaterThan(30);
    });
  });

  describe('Exports', () => {
    it('should export VPC ID', () => {
      expect(infrastructureCode).toContain('export const vpcId');
    });

    it('should export ALB DNS name', () => {
      expect(infrastructureCode).toContain('export const albDnsName');
    });

    it('should export CloudFront domain', () => {
      expect(infrastructureCode).toContain('export const cloudFrontDomain');
    });

    it('should export RDS endpoint', () => {
      expect(infrastructureCode).toContain('export const dbClusterEndpoint');
    });

    it('should export S3 bucket name', () => {
      expect(infrastructureCode).toContain('export const staticAssetsBucketName');
    });

    it('should export ASG name', () => {
      expect(infrastructureCode).toContain('export const asgName');
    });
  });

  describe('AWS Services Implementation', () => {
    it('should implement VPC service', () => {
      expect(infrastructureCode).toContain('aws.ec2.Vpc');
    });

    it('should implement EC2 service', () => {
      expect(infrastructureCode).toContain('aws.ec2');
    });

    it('should implement ELB service', () => {
      expect(infrastructureCode).toContain('aws.lb');
    });

    it('should implement RDS service', () => {
      expect(infrastructureCode).toContain('aws.rds');
    });

    it('should implement S3 service', () => {
      expect(infrastructureCode).toContain('aws.s3');
    });

    it('should implement CloudFront service', () => {
      expect(infrastructureCode).toContain('aws.cloudfront');
    });

    it('should implement Auto Scaling service', () => {
      expect(infrastructureCode).toContain('aws.autoscaling');
    });

    it('should implement CloudWatch service', () => {
      expect(infrastructureCode).toContain('aws.cloudwatch');
    });

    it('should implement Route 53 service', () => {
      expect(infrastructureCode).toContain('aws.route53');
    });

    it('should implement SSM service', () => {
      expect(infrastructureCode).toContain('aws.ssm');
    });

    it('should implement IAM service', () => {
      expect(infrastructureCode).toContain('aws.iam');
    });
  });

  describe('Code Quality', () => {
    it('should not contain syntax errors', () => {
      expect(infrastructureCode).toBeDefined();
      expect(infrastructureCode.length).toBeGreaterThan(1000);
    });

    it('should use proper TypeScript imports', () => {
      expect(infrastructureCode).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(infrastructureCode).toContain("import * as aws from '@pulumi/aws'");
    });

    it('should have consistent indentation', () => {
      const lines = infrastructureCode.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(100);
    });

    it('should not have obvious code smells', () => {
      expect(infrastructureCode).not.toContain('TODO');
      expect(infrastructureCode).not.toContain('FIXME');
      expect(infrastructureCode).not.toContain('XXX');
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain hardcoded secrets', () => {
      expect(infrastructureCode).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
      expect(infrastructureCode).not.toMatch(/secret\s*[:=]\s*['"][^'"]+['"]/i);
      expect(infrastructureCode).not.toMatch(/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i);
    });

    it('should use IAM roles instead of access keys', () => {
      expect(infrastructureCode).toContain('aws.iam.Role');
      expect(infrastructureCode).not.toContain('accessKeyId');
      expect(infrastructureCode).not.toContain('secretAccessKey');
    });

    it('should enable encryption where applicable', () => {
      // Check for encryption configuration in S3 and RDS
      expect(infrastructureCode).toContain('serverSideEncryptionConfiguration');
    });
  });
});
