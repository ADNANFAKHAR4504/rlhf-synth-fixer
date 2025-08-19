// __tests__/tap-stack.integration.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { cloudtrail } from '@cdktf/provider-aws';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

describe('TapStack Integration Tests', () => {
  let app: any;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-tap-stack', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);
  });

  describe('AWS Provider Configuration', () => {
    it('should configure AWS provider with correct region', () => {
      const providers = synthesized.byType(AwsProvider);
      expect(providers).toHaveLength(1);
      expect(providers[0]).toHaveProperty('region', 'us-east-1');
    });
  });

  describe('VPC Infrastructure', () => {
    it('should create VPC with correct CIDR block', () => {
      const vpcs = synthesized.byType(Vpc);
      expect(vpcs).toHaveLength(1);
      expect(vpcs[0]).toHaveProperty('cidrBlock', '10.0.0.0/16');
      expect(vpcs[0]).toHaveProperty('enableDnsHostnames', true);
      expect(vpcs[0]).toHaveProperty('enableDnsSupport', true);
      expect(vpcs[0].tags).toMatchObject({
        Name: 'secure-app-vpc',
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create public and private subnets', () => {
      const subnets = synthesized.byType(Subnet);
      expect(subnets).toHaveLength(4); // 2 public + 2 private

      // Check public subnets - FIX: Add explicit type annotation
      const publicSubnets = subnets.filter((subnet: Subnet) => 
        subnet.mapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(2);
      expect(publicSubnets[0]).toHaveProperty('cidrBlock', '10.0.1.0/24');
      expect(publicSubnets[1]).toHaveProperty('cidrBlock', '10.0.2.0/24');

      // Check private subnets - FIX: Add explicit type annotation
      const privateSubnets = subnets.filter((subnet: Subnet) => 
        subnet.mapPublicIpOnLaunch === false
      );
      expect(privateSubnets).toHaveLength(2);
      expect(privateSubnets[0]).toHaveProperty('cidrBlock', '10.0.10.0/24');
      expect(privateSubnets[1]).toHaveProperty('cidrBlock', '10.0.20.0/24');
    });

    it('should create internet gateway', () => {
      const igws = synthesized.byType(InternetGateway);
      expect(igws).toHaveLength(1);
      expect(igws[0].tags).toMatchObject({
        Name: 'secure-app-vpc-igw',
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create NAT gateways with EIPs', () => {
      const natGateways = synthesized.byType(NatGateway);
      const eips = synthesized.byType(Eip);
      
      expect(natGateways).toHaveLength(2);
      expect(eips).toHaveLength(2);
      
      // FIX: Add explicit type annotation
      eips.forEach((eip: Eip) => {
        expect(eip).toHaveProperty('domain', 'vpc');
      });
    });

    it('should create route tables and routes', () => {
      const routeTables = synthesized.byType(RouteTable);
      const routes = synthesized.byType(Route);
      const routeTableAssociations = synthesized.byType(RouteTableAssociation);

      expect(routeTables).toHaveLength(3); // 1 public + 2 private
      expect(routes).toHaveLength(3); // 1 to IGW + 2 to NAT gateways
      expect(routeTableAssociations).toHaveLength(4); // 2 public + 2 private subnet associations
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with correct rules', () => {
      const securityGroups = synthesized.byType(SecurityGroup);
      // FIX: Add explicit type annotation
      const albSg = securityGroups.find((sg: SecurityGroup) => sg.name === 'public-frontend-sg');
      
      expect(albSg).toBeDefined();
      expect(albSg.description).toBe('Security group for Application Load Balancer');
      
      const securityGroupRules = synthesized.byType(SecurityGroupRule);
      // FIX: Add explicit type annotation
      const albIngressRules = securityGroupRules.filter((rule: SecurityGroupRule) => 
        rule.type === 'ingress' && rule.securityGroupId === albSg.id
      );
      
      expect(albIngressRules).toHaveLength(2); // HTTP and HTTPS
      
      // FIX: Add explicit type annotations
      const httpRule = albIngressRules.find((rule: SecurityGroupRule) => rule.fromPort === 80);
      const httpsRule = albIngressRules.find((rule: SecurityGroupRule) => rule.fromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.cidrBlocks).toEqual(['0.0.0.0/0']);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.cidrBlocks).toEqual(['0.0.0.0/0']);
    });

    it('should create EC2 security group with restrictive rules', () => {
      const securityGroups = synthesized.byType(SecurityGroup);
      // FIX: Add explicit type annotation
      const ec2Sg = securityGroups.find((sg: SecurityGroup) => sg.name === 'private-app-sg');
      
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg.description).toBe('Security group for EC2 application instances');
      
      const securityGroupRules = synthesized.byType(SecurityGroupRule);
      // FIX: Add explicit type annotation
      const ec2IngressRules = securityGroupRules.filter((rule: SecurityGroupRule) => 
        rule.type === 'ingress' && rule.securityGroupId === ec2Sg.id
      );
      
      expect(ec2IngressRules).toHaveLength(2); // HTTP from ALB and SSH from VPC
      
      // FIX: Add explicit type annotations
      const httpFromAlbRule = ec2IngressRules.find((rule: SecurityGroupRule) => 
        rule.fromPort === 80 && rule.sourceSecurityGroupId
      );
      const sshFromVpcRule = ec2IngressRules.find((rule: SecurityGroupRule) => 
        rule.fromPort === 22 && rule.cidrBlocks?.includes('10.0.0.0/16')
      );
      
      expect(httpFromAlbRule).toBeDefined();
      expect(sshFromVpcRule).toBeDefined();
    });

    it('should create RDS security group with database port access', () => {
      const securityGroups = synthesized.byType(SecurityGroup);
      // FIX: Add explicit type annotation
      const rdsSg = securityGroups.find((sg: SecurityGroup) => sg.name === 'private-database-sg');
      
      expect(rdsSg).toBeDefined();
      expect(rdsSg.description).toBe('Security group for RDS database');
      
      const securityGroupRules = synthesized.byType(SecurityGroupRule);
      // FIX: Add explicit type annotation
      const rdsIngressRules = securityGroupRules.filter((rule: SecurityGroupRule) => 
        rule.type === 'ingress' && rule.securityGroupId === rdsSg.id
      );
      
      expect(rdsIngressRules).toHaveLength(1); // MySQL from EC2 only
      
      const mysqlRule = rdsIngressRules[0];
      expect(mysqlRule.fromPort).toBe(3306);
      expect(mysqlRule.toPort).toBe(3306);
      expect(mysqlRule.sourceSecurityGroupId).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    it('should create KMS key with automatic rotation', () => {
      const kmsKeys = synthesized.byType(KmsKey);
      expect(kmsKeys).toHaveLength(1);
      
      const kmsKey = kmsKeys[0];
      expect(kmsKey.description).toBe('KMS key for application encryption with automatic rotation');
      expect(kmsKey.enableKeyRotation).toBe(true);
      expect(kmsKey.tags).toMatchObject({
        Name: 'app-kms-key',
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create KMS alias', () => {
      const kmsAliases = synthesized.byType(KmsAlias);
      expect(kmsAliases).toHaveLength(1);
      expect(kmsAliases[0].name).toBe('alias/app-kms-key');
    });
  });

  describe('S3 Buckets', () => {
    it('should create S3 buckets with encryption and versioning', () => {
      const s3Buckets = synthesized.byType(S3Bucket);
      expect(s3Buckets).toHaveLength(2); // CloudTrail and application buckets
      
      // FIX: Add explicit type annotation
      const bucketNames = s3Buckets.map((bucket: S3Bucket) => bucket.bucket);
      expect(bucketNames.some((name: string) => name.includes('cloudtrail-logs'))).toBe(true);
      expect(bucketNames.some((name: string) => name.includes('app-data'))).toBe(true);
      
      // FIX: Add explicit type annotation
      s3Buckets.forEach((bucket: S3Bucket) => {
        expect(bucket.tags).toMatchObject({
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        });
      });
    });

    it('should configure S3 bucket encryption', () => {
      const encryptionConfigs = synthesized.byType(S3BucketServerSideEncryptionConfigurationA);
      expect(encryptionConfigs).toHaveLength(2);
    });

    it('should enable S3 bucket versioning', () => {
      const versioningConfigs = synthesized.byType(S3BucketVersioningA);
      expect(versioningConfigs).toHaveLength(2);
      
      // FIX: Add explicit type annotation
      versioningConfigs.forEach((config: S3BucketVersioningA) => {
        expect(config.versioningConfiguration.status).toBe('Enabled');
      });
    });

    it('should block public access on S3 buckets', () => {
      const publicAccessBlocks = synthesized.byType(S3BucketPublicAccessBlock);
      expect(publicAccessBlocks).toHaveLength(2);
      
      // FIX: Add explicit type annotation
      publicAccessBlocks.forEach((block: S3BucketPublicAccessBlock) => {
        expect(block.blockPublicAcls).toBe(true);
        expect(block.blockPublicPolicy).toBe(true);
        expect(block.ignorePublicAcls).toBe(true);
        expect(block.restrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('RDS Database', () => {
    it('should create RDS instance with encryption', () => {
      const dbInstances = synthesized.byType(DbInstance);
      expect(dbInstances).toHaveLength(1);
      
      const dbInstance = dbInstances[0];
      expect(dbInstance.engine).toBe('mysql');
      expect(dbInstance.engineVersion).toBe('8.0');
      expect(dbInstance.instanceClass).toBe('db.t3.medium');
      expect(dbInstance.storageEncrypted).toBe(true);
      expect(dbInstance.backupRetentionPeriod).toBe(7);
      expect(dbInstance.deletionProtection).toBe(true);
      expect(dbInstance.tags).toMatchObject({
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create DB subnet group', () => {
      const dbSubnetGroups = synthesized.byType(DbSubnetGroup);
      expect(dbSubnetGroups).toHaveLength(1);
      
      const dbSubnetGroup = dbSubnetGroups[0];
      expect(dbSubnetGroup.subnetIds).toHaveLength(2); // Private subnets
      expect(dbSubnetGroup.tags).toMatchObject({
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });
  });

  describe('EC2 Instances', () => {
    it('should create EC2 instances in private subnets', () => {
      const instances = synthesized.byType(Instance);
      expect(instances).toHaveLength(2); // One per private subnet
      
      // FIX: Add explicit type annotation
      instances.forEach((instance: Instance) => {
        expect(instance.instanceType).toBe('t3.micro');
        expect(instance.associatePublicIpAddress).toBe(false);
        expect(instance.userData).toBeDefined();
        expect(instance.keyName).toBe('turing-key');
        expect(instance.tags).toMatchObject({
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        });
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('should create ALB with target group and listener', () => {
      const albs = synthesized.byType(Lb);
      expect(albs).toHaveLength(1);
      
      const alb = albs[0];
      expect(alb.loadBalancerType).toBe('application');
      expect(alb.enableDeletionProtection).toBe(true);
      expect(alb.subnets).toHaveLength(2); // Public subnets
      expect(alb.tags).toMatchObject({
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create target group with health check', () => {
      const targetGroups = synthesized.byType(LbTargetGroup);
      expect(targetGroups).toHaveLength(1);
      
      const targetGroup = targetGroups[0];
      expect(targetGroup.port).toBe(80);
      expect(targetGroup.protocol).toBe('HTTP');
      expect(targetGroup.healthCheck.enabled).toBe(true);
      expect(targetGroup.healthCheck.path).toBe('/health');
      expect(targetGroup.healthCheck.matcher).toBe('200');
    });

    it('should create listener for ALB', () => {
      const listeners = synthesized.byType(LbListener);
      expect(listeners).toHaveLength(1);
      
      const listener = listeners[0];
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
      expect(listener.defaultAction[0].type).toBe('forward');
    });

    it('should attach EC2 instances to target group', () => {
      const attachments = synthesized.byType(LbTargetGroupAttachment);
      expect(attachments).toHaveLength(2); // One per EC2 instance
      
      // FIX: Add explicit type annotation
      attachments.forEach((attachment: LbTargetGroupAttachment) => {
        expect(attachment.port).toBe(80);
      });
    });
  });

  describe('CloudTrail', () => {
    it('should create CloudTrail with proper configuration', () => {
      const cloudtrails = synthesized.byType(cloudtrail.Cloudtrail);
      expect(cloudtrails).toHaveLength(1);
      
      const trail = cloudtrails[0];
      expect(trail.includeGlobalServiceEvents).toBe(true);
      expect(trail.isMultiRegionTrail).toBe(true);
      expect(trail.enableLogging).toBe(true);
      expect(trail.tags).toMatchObject({
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      });
    });

    it('should create S3 bucket policy for CloudTrail', () => {
      const bucketPolicies = synthesized.byType(S3BucketPolicy);
      expect(bucketPolicies).toHaveLength(1);
      
      const policy = JSON.parse(bucketPolicies[0].policy);
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);
      
      const statements = policy.Statement;
      expect(statements[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(statements[0].Action).toBe('s3:GetBucketAcl');
      expect(statements[1].Action).toBe('s3:PutObject');
    });
  });

  describe('Resource Tagging', () => {
    it('should apply consistent tags across all resources', () => {
      const allResources = [
        ...synthesized.byType(Vpc),
        ...synthesized.byType(Subnet),
        ...synthesized.byType(SecurityGroup),
        ...synthesized.byType(Instance),
        ...synthesized.byType(S3Bucket),
        ...synthesized.byType(DbInstance),
        ...synthesized.byType(KmsKey),
        ...synthesized.byType(Lb),
        ...synthesized.byType(LbTargetGroup),
      ];

      // FIX: Add explicit type annotation
      allResources.forEach((resource: any) => {
        if (resource.tags) {
          expect(resource.tags).toHaveProperty('Environment', 'production');
          expect(resource.tags).toHaveProperty('ManagedBy', 'terraform-cdk');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should ensure EC2 instances have no public IPs', () => {
      const instances = synthesized.byType(Instance);
      // FIX: Add explicit type annotation
      instances.forEach((instance: Instance) => {
        expect(instance.associatePublicIpAddress).toBe(false);
      });
    });

    it('should ensure RDS has deletion protection enabled', () => {
      const dbInstances = synthesized.byType(DbInstance);
      // FIX: Add explicit type annotation
      dbInstances.forEach((instance: DbInstance) => {
        expect(instance.deletionProtection).toBe(true);
      });
    });

    it('should ensure ALB has deletion protection enabled', () => {
      const albs = synthesized.byType(Lb);
      // FIX: Add explicit type annotation
      albs.forEach((alb: Lb) => {
        expect(alb.enableDeletionProtection).toBe(true);
      });
    });

    it('should ensure all storage is encrypted', () => {
      const dbInstances = synthesized.byType(DbInstance);
      // FIX: Add explicit type annotation
      dbInstances.forEach((instance: DbInstance) => {
        expect(instance.storageEncrypted).toBe(true);
      });
    });
  });
});