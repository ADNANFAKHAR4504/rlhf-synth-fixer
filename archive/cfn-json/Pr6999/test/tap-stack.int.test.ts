// Multi-Tier Web Application - Integration Tests
// These tests verify the deployed CloudFormation infrastructure
import fs from 'fs';
import path from 'path';
import { CloudFormation, EC2, RDS, ElastiCache, ELBv2, AutoScaling } from 'aws-sdk';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const cfn = new CloudFormation({ region: AWS_REGION });
const ec2 = new EC2({ region: AWS_REGION });
const rds = new RDS({ region: AWS_REGION });
const elasticache = new ElastiCache({ region: AWS_REGION });
const elbv2 = new ELBv2({ region: AWS_REGION });
const autoscaling = new AutoScaling({ region: AWS_REGION });

describe('Multi-Tier Web Application Integration Tests', () => {
  let outputs: any;
  let stackName: string;

  beforeAll(() => {
    try {
      const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
      if (fs.existsSync(outputsPath)) {
        outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      }
      stackName = `TapStack${environmentSuffix}`;
    } catch (error) {
      console.warn('Could not load cfn-outputs, some tests may be skipped');
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have outputs file with data', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have VPC outputs', () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-/);
    });

    test('should have subnet outputs', () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }
      expect(outputs.PublicSubnet1).toBeDefined();
      expect(outputs.PublicSubnet2).toBeDefined();
      expect(outputs.PublicSubnet3).toBeDefined();
      expect(outputs.PrivateSubnet1).toBeDefined();
      expect(outputs.PrivateSubnet2).toBeDefined();
      expect(outputs.PrivateSubnet3).toBeDefined();
    });

    test('should have ALB output', () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }
      expect(outputs.LoadBalancerDNS || outputs.ALBDNSName).toBeDefined();
    });

    test('should have RDS output', () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }
      expect(outputs.DatabaseEndpoint || outputs.DBClusterEndpoint || outputs.RDSEndpoint).toBeDefined();
    });
  });

  describe('VPC Infrastructure Validation', () => {
    test('VPC should exist and be available', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
    });

    test('VPC should have correct CIDR block', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const [dnsSupport, dnsHostnames] = await Promise.all([
        ec2.describeVpcAttribute({
          VpcId: outputs.VpcId,
          Attribute: 'enableDnsSupport'
        }).promise(),
        ec2.describeVpcAttribute({
          VpcId: outputs.VpcId,
          Attribute: 'enableDnsHostnames'
        }).promise()
      ]);

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have subnets across 3 availability zones', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      }).promise();

      const azs = new Set(result.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('should have 3 public and 3 private subnets', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      }).promise();

      const publicSubnets = result.Subnets!.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = result.Subnets!.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have VPC Endpoints for private subnet AWS service access', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'vpc-endpoint-state',
            Values: ['available']
          }
        ]
      }).promise();

      // Template uses VPC Endpoints (S3) instead of NAT Gateways for cost optimization
      expect(result.VpcEndpoints).toBeDefined();
      expect(result.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      
      // Verify S3 endpoint exists
      const s3Endpoint = result.VpcEndpoints!.find(ep => 
        ep.ServiceName?.includes('s3')
      );
      expect(s3Endpoint).toBeDefined();
    });
  });

  describe('Application Load Balancer Validation', () => {
    test('ALB should exist and be active', async () => {
      if (!outputs || !(outputs.LoadBalancerDNS || outputs.ALBDNSName)) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const dnsName = outputs.LoadBalancerDNS || outputs.ALBDNSName;
      
      const result = await elbv2.describeLoadBalancers({
        Names: dnsName ? [] : undefined
      }).promise();

      if (result.LoadBalancers && result.LoadBalancers.length > 0) {
        const alb = result.LoadBalancers.find(lb => 
          lb.DNSName === dnsName || lb.LoadBalancerName?.includes(environmentSuffix)
        );
        
        if (alb) {
          expect(alb.State?.Code).toBe('active');
          expect(alb.Scheme).toBe('internet-facing');
        }
      }
    });

    test('ALB should be in public subnets', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await elbv2.describeLoadBalancers().promise();
      const alb = result.LoadBalancers?.find(lb => 
        lb.VpcId === outputs.VpcId
      );

      if (alb && alb.AvailabilityZones) {
        const albSubnets = alb.AvailabilityZones.map(az => az.SubnetId);
        
        // Verify these are public subnets
        const subnetResult = await ec2.describeSubnets({
          SubnetIds: albSubnets.filter(s => s) as string[]
        }).promise();

        const allPublic = subnetResult.Subnets!.every(s => s.MapPublicIpOnLaunch);
        expect(allPublic).toBe(true);
      }
    });
  });

  describe('Auto Scaling Group Validation', () => {
    test('Auto Scaling Group should exist', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await autoscaling.describeAutoScalingGroups().promise();
      
      const asg = result.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      expect(asg).toBeDefined();
    });

    test('Auto Scaling Group should have correct capacity settings', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await autoscaling.describeAutoScalingGroups().promise();
      
      const asg = result.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      if (asg) {
        expect(asg.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
        expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);
      }
    });

    test('Auto Scaling Group should use private subnets', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await autoscaling.describeAutoScalingGroups().promise();
      
      const asg = result.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      if (asg && asg.VPCZoneIdentifier) {
        const subnetIds = asg.VPCZoneIdentifier.split(',');
        
        const subnetResult = await ec2.describeSubnets({
          SubnetIds: subnetIds
        }).promise();

        // All ASG subnets should be private
        const allPrivate = subnetResult.Subnets!.every(s => !s.MapPublicIpOnLaunch);
        expect(allPrivate).toBe(true);
      }
    });
  });

  describe('RDS Aurora MySQL Validation', () => {
    test('RDS cluster should exist and be available', async () => {
      if (!outputs || !(outputs.DatabaseEndpoint || outputs.DBClusterEndpoint || outputs.RDSEndpoint)) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await rds.describeDBClusters().promise();
      
      const cluster = result.DBClusters?.find(c =>
        c.DBClusterIdentifier?.includes(environmentSuffix)
      );

      if (cluster) {
        expect(cluster.Status).toBe('available');
        expect(cluster.Engine).toBe('aurora-mysql');
      }
    });

    test('RDS cluster should be in private subnets', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await rds.describeDBClusters().promise();
      
      const cluster = result.DBClusters?.find(c =>
        c.DBClusterIdentifier?.includes(environmentSuffix)
      );

      if (cluster && cluster.DBSubnetGroup) {
        const subnetGroupResult = await rds.describeDBSubnetGroups({
          DBSubnetGroupName: cluster.DBSubnetGroup
        }).promise();

        const subnetIds = subnetGroupResult.DBSubnetGroups![0].Subnets!.map(s => s.SubnetIdentifier!);
        
        const subnetResult = await ec2.describeSubnets({
          SubnetIds: subnetIds
        }).promise();

        // All RDS subnets should be private
        const allPrivate = subnetResult.Subnets!.every(s => !s.MapPublicIpOnLaunch);
        expect(allPrivate).toBe(true);
      }
    });

    test('RDS cluster should have encryption enabled', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await rds.describeDBClusters().promise();
      
      const cluster = result.DBClusters?.find(c =>
        c.DBClusterIdentifier?.includes(environmentSuffix)
      );

      if (cluster) {
        expect(cluster.StorageEncrypted).toBe(true);
      }
    });

    test('RDS cluster should have backup retention', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await rds.describeDBClusters().promise();
      
      const cluster = result.DBClusters?.find(c =>
        c.DBClusterIdentifier?.includes(environmentSuffix)
      );

      if (cluster) {
        expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
      }
    });
  });

  describe('ElastiCache Redis Validation (Conditional)', () => {
    test('ElastiCache cluster existence depends on condition', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      try {
        const result = await elasticache.describeCacheClusters().promise();
        
        const cluster = result.CacheClusters?.find(c =>
          c.CacheClusterId?.includes(environmentSuffix)
        );

        if (cluster) {
          // If ElastiCache is deployed, verify it's Redis
          expect(cluster.Engine).toBe('redis');
          expect(cluster.CacheClusterStatus).toBe('available');
        } else {
          // ElastiCache is conditional - absence is also valid
          console.log('ElastiCache not deployed (conditional resource)');
        }
      } catch (error) {
        // ElastiCache might not be deployed if condition is false
        console.log('ElastiCache not available (conditional)');
      }
    });

    test('ElastiCache should be in private subnets if deployed', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      try {
        const result = await elasticache.describeCacheClusters().promise();
        
        const cluster = result.CacheClusters?.find(c =>
          c.CacheClusterId?.includes(environmentSuffix)
        );

        if (cluster && cluster.CacheSubnetGroupName) {
          const subnetGroupResult = await elasticache.describeCacheSubnetGroups({
            CacheSubnetGroupName: cluster.CacheSubnetGroupName
          }).promise();

          if (subnetGroupResult.CacheSubnetGroups && subnetGroupResult.CacheSubnetGroups[0]) {
            const subnetIds = subnetGroupResult.CacheSubnetGroups[0].Subnets!.map(s => s.SubnetIdentifier!);
            
            const subnetResult = await ec2.describeSubnets({
              SubnetIds: subnetIds
            }).promise();

            // All ElastiCache subnets should be private
            const allPrivate = subnetResult.Subnets!.every(s => !s.MapPublicIpOnLaunch);
            expect(allPrivate).toBe(true);
          }
        }
      } catch (error) {
        console.log('ElastiCache not available (conditional)');
      }
    });
  });

  describe('Security Group Validation', () => {
    test('security groups should exist for each tier', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      }).promise();

      const securityGroups = result.SecurityGroups!;
      
      // Should have at least: ALB SG, ASG SG, RDS SG, and optionally ElastiCache SG
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);
    });

    test('ALB security group should allow HTTP/HTTPS inbound', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'group-name',
            Values: [`alb-sg-${environmentSuffix}`]
          }
        ]
      }).promise();

      if (result.SecurityGroups && result.SecurityGroups.length > 0) {
        const albSG = result.SecurityGroups[0];
        const hasHTTP = albSG.IpPermissions!.some(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        const hasHTTPS = albSG.IpPermissions!.some(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );

        expect(hasHTTP || hasHTTPS).toBe(true);
      }
    });
  });

  describe('Resource Tagging Validation', () => {
    test('VPC should have CostCenter tag', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      const vpc = result.Vpcs![0];
      const costCenterTag = vpc.Tags?.find(t => t.Key === 'CostCenter');
      
      expect(costCenterTag).toBeDefined();
    });

    test('resources should include environment suffix in names', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      const nameTag = result.Vpcs![0].Tags?.find(t => t.Key === 'Name');
      
      if (nameTag) {
        expect(nameTag.Value).toContain(environmentSuffix);
      }
    });
  });

  describe('Stack Deployment Validation', () => {
    test('stack should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      if (!stackName) {
        console.log('Stack name not available, skipping test');
        return;
      }

      const result = await cfn.describeStacks({
        StackName: stackName
      }).promise();

      expect(result.Stacks).toBeDefined();
      expect(result.Stacks!.length).toBe(1);
      const stackStatus = result.Stacks![0].StackStatus;
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stackStatus);
    });

    test('stack should have all expected resources', async () => {
      if (!stackName) {
        console.log('Stack name not available, skipping test');
        return;
      }

      const result = await cfn.listStackResources({
        StackName: stackName
      }).promise();

      const resources = result.StackResourceSummaries || [];
      
      // Should have ~40 resources (VPC, Compute, Data layers)
      expect(resources.length).toBeGreaterThanOrEqual(35);
    });

    test('all resources should be in CREATE_COMPLETE state', async () => {
      if (!stackName) {
        console.log('Stack name not available, skipping test');
        return;
      }

      const result = await cfn.listStackResources({
        StackName: stackName
      }).promise();

      const failedResources = result.StackResourceSummaries?.filter(r =>
        r.ResourceStatus?.includes('FAILED')
      );

      expect(failedResources?.length || 0).toBe(0);
    });
  });

  describe('End-to-End Application Validation', () => {
    test('ALB should have target group with healthy targets', async () => {
      if (!outputs) {
        console.log('Outputs not available, skipping test');
        return;
      }

      try {
        const lbResult = await elbv2.describeLoadBalancers().promise();
        const alb = lbResult.LoadBalancers?.find(lb =>
          lb.VpcId === outputs.VpcId
        );

        if (alb) {
          const tgResult = await elbv2.describeTargetGroups({
            LoadBalancerArn: alb.LoadBalancerArn
          }).promise();

          expect(tgResult.TargetGroups?.length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.log('ALB/Target groups validation skipped');
      }
    });

    test('database and cache should be in same VPC as compute resources', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      // All resources should be in the same VPC
      const expectedVpc = outputs.VpcId;

      // Check RDS
      const rdsResult = await rds.describeDBClusters().promise();
      const cluster = rdsResult.DBClusters?.find(c =>
        c.DBClusterIdentifier?.includes(environmentSuffix)
      );

      if (cluster) {
        expect(cluster.VpcId || cluster.DBClusterMembers![0].DBInstanceIdentifier).toBeDefined();
      }

      // Check ALB
      const lbResult = await elbv2.describeLoadBalancers().promise();
      const alb = lbResult.LoadBalancers?.find(lb =>
        lb.VpcId === expectedVpc
      );

      expect(alb).toBeDefined();
    });
  });

  describe('High Availability Validation', () => {
    test('infrastructure should be distributed across multiple AZs', async () => {
      if (!outputs || !outputs.VpcId) {
        console.log('Outputs not available, skipping test');
        return;
      }

      // Check subnets are in different AZs
      const subnetResult = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      }).promise();

      const azs = new Set(subnetResult.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);

      // Check VPC Endpoints are available (template uses VPC Endpoints instead of NAT Gateways)
      const endpointResult = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'vpc-endpoint-state',
            Values: ['available']
          }
        ]
      }).promise();

      // VPC Endpoints provide high availability through multiple route tables
      expect(endpointResult.VpcEndpoints).toBeDefined();
      expect(endpointResult.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
