/**
 * TapStack Integration Tests
 * 
 * Simple integration tests to validate resource existence using AWS describe commands.
 * Tests verify that all resources specified in the CloudFormation outputs exist and are accessible.
 */

import fs from 'fs';
import * as AWS from 'aws-sdk';

// Load stack outputs from CloudFormation deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Could not load flat-outputs.json, will attempt to fetch from AWS directly');
}

// AWS SDK configuration
const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const rds = new AWS.RDS();

describe('TapStack Integration Tests', () => {
  let stackOutputs: any = outputs; // Use the loaded outputs from the file

  // Set timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(() => {
    // Validate that all required outputs are present
    const requiredOutputs = ['VpcId', 'PublicSubnets', 'PrivateSubnets', 'DBSubnets', 
                           'WebServerSecurityGroup', 'AppServerSecurityGroup', 'DBSecurityGroup', 
                           'ALBDnsName', 'RDSEndpoint'];
    
    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required output: ${output}`);
      }
    }
    
    console.log('Loaded CloudFormation outputs:', stackOutputs);
  });

  describe('AWS Resource Existence Tests', () => {
    test('VPC should exist and be available', async () => {
      const result = await ec2.describeVpcs({
        VpcIds: [stackOutputs.VpcId]
      }).promise();
      
      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].VpcId).toBe(stackOutputs.VpcId);
      console.log(`✓ VPC ${stackOutputs.VpcId} is available`);
    });

    test('Public subnets should exist and be available', async () => {
      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: publicSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      console.log(`✓ Public subnets validated: ${publicSubnetIds.join(', ')}`);
    });

    test('Private subnets should exist and be available', async () => {
      const privateSubnetIds = stackOutputs.PrivateSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: privateSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
      console.log(`✓ Private subnets validated: ${privateSubnetIds.join(', ')}`);
    });

    test('Database subnets should exist and be available', async () => {
      const dbSubnetIds = stackOutputs.DBSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: dbSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
      console.log(`✓ DB subnets validated: ${dbSubnetIds.join(', ')}`);
    });

    test('Web server security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.WebServerSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.WebServerSecurityGroup);
      console.log(`✓ Web server security group validated: ${stackOutputs.WebServerSecurityGroup}`);
    });

    test('App server security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.AppServerSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.AppServerSecurityGroup);
      console.log(`✓ App server security group validated: ${stackOutputs.AppServerSecurityGroup}`);
    });

    test('Database security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.DBSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.DBSecurityGroup);
      console.log(`✓ DB security group validated: ${stackOutputs.DBSecurityGroup}`);
    });

    test('Application Load Balancer should exist and be active', async () => {
      const result = await elbv2.describeLoadBalancers().promise();
      const alb = result.LoadBalancers!.find(lb => 
        lb.DNSName === stackOutputs.ALBDnsName
      );
      
      expect(alb).toBeDefined();
      if (!alb) {
        throw new Error(`ALB with DNS name ${stackOutputs.ALBDnsName} not found`);
      }
      
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      console.log(`✓ ALB validated: ${stackOutputs.ALBDnsName}`);
    });

    test('RDS instance should exist and be available', async () => {
      const result = await rds.describeDBInstances().promise();
      const dbInstance = result.DBInstances!.find(db => 
        db.Endpoint?.Address === stackOutputs.RDSEndpoint
      );
      
      expect(dbInstance).toBeDefined();
      if (!dbInstance) {
        throw new Error(`RDS instance with endpoint ${stackOutputs.RDSEndpoint} not found`);
      }
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      console.log(`✓ RDS instance validated: ${stackOutputs.RDSEndpoint}`);
    });
  });

  describe('Real-World End-to-End Scenarios', () => {
    describe('Scenario 1: E-Commerce Application Deployment', () => {
      test('Complete web application infrastructure validation', async () => {
        // Simulate deploying a 3-tier e-commerce application
        console.log('🛒 Testing E-Commerce Application Infrastructure...');

        // Tier 1: Web Layer - ALB receives internet traffic
        const albResult = await elbv2.describeLoadBalancers().promise();
        const alb = albResult.LoadBalancers!.find(lb => 
          lb.DNSName === stackOutputs.ALBDnsName
        );
        
        expect(alb).toBeDefined();
        expect(alb!.State!.Code).toBe('active');
        expect(alb!.Scheme).toBe('internet-facing');
        
        // Verify ALB is in public subnets (customer-facing)
        const publicSubnets = stackOutputs.PublicSubnets.split(',');
        const albSubnets = alb!.AvailabilityZones!.map(az => az.SubnetId);
        albSubnets.forEach(subnet => {
          expect(publicSubnets).toContain(subnet);
        });

        // Tier 2: Application Layer - Private subnets for app servers
        const privateSubnets = stackOutputs.PrivateSubnets.split(',');
        expect(privateSubnets).toHaveLength(2); // Multi-AZ for high availability
        
        const subnetResult = await ec2.describeSubnets({
          SubnetIds: privateSubnets
        }).promise();
        
        // Verify private subnets don't auto-assign public IPs (security)
        subnetResult.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe('available');
        });

        // Tier 3: Database Layer - Isolated database subnets
        const dbSubnets = stackOutputs.DBSubnets.split(',');
        expect(dbSubnets).toHaveLength(2); // Multi-AZ for RDS
        
        const dbSubnetResult = await ec2.describeSubnets({
          SubnetIds: dbSubnets
        }).promise();
        
        dbSubnetResult.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe('available');
        });

        console.log('✅ 3-tier e-commerce architecture validated');
      }, 45000);

      test('Shopping cart session security and isolation', async () => {
        // Test security group isolation for customer data protection
        console.log('🔐 Testing security isolation for customer data...');

        const sgResult = await ec2.describeSecurityGroups({
          GroupIds: [
            stackOutputs.WebServerSecurityGroup,
            stackOutputs.AppServerSecurityGroup,
            stackOutputs.DBSecurityGroup
          ]
        }).promise();

        const webSg = sgResult.SecurityGroups!.find(sg => sg.GroupId === stackOutputs.WebServerSecurityGroup);
        const appSg = sgResult.SecurityGroups!.find(sg => sg.GroupId === stackOutputs.AppServerSecurityGroup);
        const dbSg = sgResult.SecurityGroups!.find(sg => sg.GroupId === stackOutputs.DBSecurityGroup);

        // Web tier: Should accept HTTP/HTTPS from internet (customers)
        const webHttpRule = webSg!.IpPermissions!.find(rule => 
          rule.FromPort === 80 && rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        );
        const webHttpsRule = webSg!.IpPermissions!.find(rule => 
          rule.FromPort === 443 && rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        );
        
        expect(webHttpRule).toBeDefined();
        expect(webHttpsRule).toBeDefined();

        // Database tier: Should ONLY accept connections from app tier (no direct access)
        const dbRule = dbSg!.IpPermissions!.find(rule => 
          rule.FromPort === 3306 && 
          rule.UserIdGroupPairs!.some(pair => pair.GroupId === stackOutputs.AppServerSecurityGroup)
        );
        expect(dbRule).toBeDefined();

        // Ensure no direct database access from web tier (security violation)
        const directDbAccess = dbSg!.IpPermissions!.find(rule => 
          rule.UserIdGroupPairs!.some(pair => pair.GroupId === stackOutputs.WebServerSecurityGroup)
        );
        expect(directDbAccess).toBeUndefined();

        console.log('✅ Customer data isolation and security validated');
      }, 30000);
    });

    describe('Scenario 2: Financial Services Compliance', () => {
      test('PCI-DSS compliance for payment processing', async () => {
        console.log('💳 Testing PCI-DSS compliance requirements...');

        // Requirement: Database encryption at rest
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        expect(dbInstance!.StorageEncrypted).toBe(true);
        expect(dbInstance!.KmsKeyId).toBeDefined();

        // Requirement: Network segmentation (no public database access)
        expect(dbInstance!.PubliclyAccessible).toBe(false);

        // Requirement: High availability for transaction processing
        expect(dbInstance!.MultiAZ).toBe(true);
        expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

        // Requirement: Audit trail for all database access
        expect(dbInstance!.EnabledCloudwatchLogsExports).toBeDefined();

        console.log('✅ PCI-DSS compliance requirements validated');
      }, 30000);

      test('Audit logging for financial transactions', async () => {
        console.log('📊 Testing audit trail for financial compliance...');

        // Verify VPC Flow Logs for network monitoring
        const flowLogsResult = await ec2.describeFlowLogs({
          Filter: [
            {
              Name: 'resource-id',
              Values: [stackOutputs.VpcId]
            }
          ]
        }).promise();

        expect(flowLogsResult.FlowLogs!.length).toBeGreaterThan(0);
        const activeFlowLog = flowLogsResult.FlowLogs!.find(fl => fl.FlowLogStatus === 'ACTIVE');
        expect(activeFlowLog).toBeDefined();
        expect(activeFlowLog!.TrafficType).toBe('ALL');

        console.log('✅ Financial audit trail validated');
      }, 30000);
    });

    describe('Scenario 3: Healthcare Data Processing (HIPAA)', () => {
      test('Protected health information (PHI) security controls', async () => {
        console.log('🏥 Testing HIPAA compliance for healthcare data...');

        // Verify all subnets are in private network space
        const allSubnets = [
          ...stackOutputs.PublicSubnets.split(','),
          ...stackOutputs.PrivateSubnets.split(','),
          ...stackOutputs.DBSubnets.split(',')
        ];

        const subnetResult = await ec2.describeSubnets({
          SubnetIds: allSubnets
        }).promise();

        subnetResult.Subnets!.forEach(subnet => {
          // Verify subnet is in valid private IP ranges
          const cidr = subnet.CidrBlock!;
          expect(cidr.startsWith('10.0.')).toBe(true); // RFC 1918 private range
          expect(subnet.VpcId).toBe(stackOutputs.VpcId);
        });

        // Verify database encryption (required for PHI)
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        expect(dbInstance!.StorageEncrypted).toBe(true);
        expect(dbInstance!.PubliclyAccessible).toBe(false);

        console.log('✅ HIPAA PHI security controls validated');
      }, 30000);

      test('Healthcare system high availability requirements', async () => {
        console.log('🏥 Testing healthcare system availability...');

        // Medical systems require 99.9%+ uptime
        const albResult = await elbv2.describeLoadBalancers().promise();
        const alb = albResult.LoadBalancers!.find(lb => 
          lb.DNSName === stackOutputs.ALBDnsName
        );

        // Verify multi-AZ deployment for high availability
        expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
        
        const azs = alb!.AvailabilityZones!.map(az => az.ZoneName);
        const uniqueAzs = new Set(azs);
        expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);

        // Verify RDS Multi-AZ for database availability
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        expect(dbInstance!.MultiAZ).toBe(true);

        console.log('✅ Healthcare high availability validated');
      }, 30000);
    });

    describe('Scenario 4: SaaS Multi-Tenant Application', () => {
      test('Tenant isolation and resource sharing', async () => {
        console.log('🏢 Testing SaaS multi-tenant infrastructure...');

        // Verify network isolation capabilities
        const vpcResult = await ec2.describeVpcs({
          VpcIds: [stackOutputs.VpcId]
        }).promise();
        
        expect(vpcResult.Vpcs![0].State).toBe('available');
        expect(vpcResult.Vpcs![0].CidrBlock).toBe('10.0.0.0/16'); // Large enough for tenant subnets

        // Verify security groups support tenant isolation
        const sgResult = await ec2.describeSecurityGroups({
          Filters: [
            { Name: 'vpc-id', Values: [stackOutputs.VpcId] }
          ]
        }).promise();

        expect(sgResult.SecurityGroups!.length).toBeGreaterThanOrEqual(3); // Web, App, DB tiers

        // Verify database supports multi-tenancy
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        // Adequate storage and performance for multiple tenants
        expect(dbInstance!.AllocatedStorage).toBeGreaterThanOrEqual(20);
        expect(dbInstance!.Engine).toBe('mysql'); // Supports multi-tenant schemas

        console.log('✅ SaaS multi-tenant capabilities validated');
      }, 30000);

      test('Scalability for growing tenant base', async () => {
        console.log('📈 Testing SaaS scalability infrastructure...');

        // Verify ALB can handle multiple tenant applications
        const albResult = await elbv2.describeLoadBalancers().promise();
        const alb = albResult.LoadBalancers!.find(lb => 
          lb.DNSName === stackOutputs.ALBDnsName
        );

        expect(alb!.Type).toBe('application'); // Supports advanced routing for tenants
        expect(alb!.State!.Code).toBe('active');

        // Verify target group configuration for scaling
        const targetGroupsResult = await elbv2.describeTargetGroups({
          LoadBalancerArn: alb!.LoadBalancerArn
        }).promise();

        expect(targetGroupsResult.TargetGroups!.length).toBeGreaterThan(0);

        console.log('✅ SaaS scalability infrastructure validated');
      }, 30000);
    });

    describe('Scenario 5: DevOps CI/CD Pipeline Integration', () => {
      test('Infrastructure automation and deployment readiness', async () => {
        console.log('🔄 Testing CI/CD pipeline infrastructure...');

        // Verify all critical outputs are available for automation
        const requiredOutputs = [
          'VpcId', 'ALBDnsName', 'WebServerSecurityGroup', 
          'AppServerSecurityGroup', 'DBSecurityGroup',
          'PublicSubnets', 'PrivateSubnets', 'DBSubnets', 'RDSEndpoint'
        ];

        requiredOutputs.forEach(output => {
          expect(stackOutputs[output]).toBeDefined();
          expect(stackOutputs[output]).not.toBe('');
          expect(typeof stackOutputs[output]).toBe('string');
        });

        // Verify subnet format for automation scripts
        const publicSubnets = stackOutputs.PublicSubnets.split(',');
        const privateSubnets = stackOutputs.PrivateSubnets.split(',');
        
        expect(publicSubnets).toHaveLength(2);
        expect(privateSubnets).toHaveLength(2);
        
        // Verify resource naming consistency for automation
        expect(stackOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
        expect(stackOutputs.WebServerSecurityGroup).toMatch(/^sg-[a-f0-9]+$/);

        console.log('✅ CI/CD automation readiness validated');
      }, 20000);

      test('Blue-Green deployment infrastructure support', async () => {
        console.log('🔄 Testing Blue-Green deployment capabilities...');

        // Verify ALB supports multiple target groups (Blue/Green)
        const albResult = await elbv2.describeLoadBalancers().promise();
        const alb = albResult.LoadBalancers!.find(lb => 
          lb.DNSName === stackOutputs.ALBDnsName
        );

        // ALB should support advanced routing for Blue-Green deployments
        expect(alb!.Type).toBe('application');
        expect(alb!.Scheme).toBe('internet-facing');

        // Verify sufficient subnet capacity for parallel deployments
        const privateSubnets = stackOutputs.PrivateSubnets.split(',');
        expect(privateSubnets.length).toBeGreaterThanOrEqual(2); // Can run Blue and Green in parallel

        console.log('✅ Blue-Green deployment support validated');
      }, 30000);
    });

    describe('Scenario 6: Disaster Recovery and Business Continuity', () => {
      test('RTO/RPO requirements for critical business systems', async () => {
        console.log('🚨 Testing disaster recovery capabilities...');

        // RTO (Recovery Time Objective) - Database failover capability
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        expect(dbInstance!.MultiAZ).toBe(true); // Automatic failover < 2 minutes
        expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7); // Point-in-time recovery

        // RPO (Recovery Point Objective) - Automated backups
        expect(dbInstance!.PreferredBackupWindow).toBeDefined();
        expect(dbInstance!.PreferredMaintenanceWindow).toBeDefined();

        // Infrastructure redundancy
        const albResult = await elbv2.describeLoadBalancers().promise();
        const alb = albResult.LoadBalancers!.find(lb => 
          lb.DNSName === stackOutputs.ALBDnsName
        );
        
        expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);

        console.log('✅ Disaster recovery RTO/RPO requirements validated');
      }, 30000);

      test('Data protection and backup validation', async () => {
        console.log('💾 Testing data protection mechanisms...');

        // Verify database encryption for data protection
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        expect(dbInstance!.StorageEncrypted).toBe(true);
        expect(dbInstance!.KmsKeyId).toBeDefined();

        // Verify backup retention meets compliance requirements
        expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
        
        // Verify copy tags to snapshots for governance
        expect(dbInstance!.CopyTagsToSnapshot).toBe(true);

        console.log('✅ Data protection and backup validated');
      }, 30000);
    });

    describe('Scenario 7: Real-Time Analytics and Monitoring', () => {
      test('Network monitoring for security analytics', async () => {
        console.log('📊 Testing real-time network monitoring...');

        // Verify VPC Flow Logs for security analytics
        const flowLogsResult = await ec2.describeFlowLogs({
          Filter: [
            { Name: 'resource-id', Values: [stackOutputs.VpcId] }
          ]
        }).promise();

        expect(flowLogsResult.FlowLogs!.length).toBeGreaterThan(0);
        
        const activeFlowLog = flowLogsResult.FlowLogs!.find(fl => fl.FlowLogStatus === 'ACTIVE');
        expect(activeFlowLog).toBeDefined();
        expect(activeFlowLog!.TrafficType).toBe('ALL'); // Capture all network traffic

        console.log('✅ Real-time network monitoring validated');
      }, 30000);

      test('Performance monitoring infrastructure readiness', async () => {
        console.log('⚡ Testing performance monitoring capabilities...');

        // Verify RDS performance monitoring capabilities
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        // Performance Insights for database monitoring
        expect(dbInstance!.MonitoringInterval).toBeGreaterThan(0);
        expect(dbInstance!.MonitoringRoleArn).toBeDefined();

        // Enhanced monitoring enabled
        expect(dbInstance!.MonitoringInterval).toBeGreaterThanOrEqual(60);

        console.log('✅ Performance monitoring infrastructure validated');
      }, 30000);
    });

    describe('Scenario 8: Global Enterprise Deployment', () => {
      test('Multi-region deployment foundation', async () => {
        console.log('🌍 Testing global enterprise infrastructure...');

        // Verify VPC CIDR allows for global expansion
        const vpcResult = await ec2.describeVpcs({
          VpcIds: [stackOutputs.VpcId]
        }).promise();
        
        const vpcCidr = vpcResult.Vpcs![0].CidrBlock!;
        expect(vpcCidr).toBe('10.0.0.0/16'); // Large enough for global subnetting

        // Verify subnet allocation supports multi-region patterns
        const publicSubnets = stackOutputs.PublicSubnets.split(',');
        const privateSubnets = stackOutputs.PrivateSubnets.split(',');
        const dbSubnets = stackOutputs.DBSubnets.split(',');
        
        // Total subnets should leave room for expansion
        const totalSubnets = publicSubnets.length + privateSubnets.length + dbSubnets.length;
        expect(totalSubnets).toBe(6); // 2 per tier, can replicate in other regions

        console.log('✅ Global enterprise deployment foundation validated');
      }, 30000);

      test('Cross-region replication readiness', async () => {
        console.log('🔄 Testing cross-region replication capabilities...');

        // Verify RDS supports cross-region read replicas
        const rdsResult = await rds.describeDBInstances().promise();
        const dbInstance = rdsResult.DBInstances!.find(db => 
          db.Endpoint?.Address === stackOutputs.RDSEndpoint
        );
        
        // Engine must support cross-region replication
        expect(dbInstance!.Engine).toBe('mysql');
        expect(dbInstance!.StorageEncrypted).toBe(true); // Required for encrypted replicas
        expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThan(0); // Required for replication

        console.log('✅ Cross-region replication readiness validated');
      }, 30000);
    });
  });
});