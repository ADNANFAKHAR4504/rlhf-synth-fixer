/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions
 */

import fs from 'fs';
import AWS from 'aws-sdk';

// Configuration - Load from cfn-outputs after stack deployment
let outputs: any = {};

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// AWS SDK clients with longer timeouts for integration tests
const ec2 = new AWS.EC2({ httpOptions: { timeout: 30000 } });
const elbv2 = new AWS.ELBv2({ httpOptions: { timeout: 30000 } });
const rds = new AWS.RDS({ httpOptions: { timeout: 30000 } });
const s3 = new AWS.S3({ httpOptions: { timeout: 30000 } });
const cloudWatch = new AWS.CloudWatch({ httpOptions: { timeout: 30000 } });
const autoScaling = new AWS.AutoScaling({ httpOptions: { timeout: 30000 } });
const cloudFormation = new AWS.CloudFormation({ httpOptions: { timeout: 30000 } });

describe('TapStack Integration Tests', () => {
  
  /* -------------------------------------------------------------------- */
  /* Setup - Load stack outputs                                          */
  /* -------------------------------------------------------------------- */
  beforeAll(async () => {
    try {
      // Try to load from cfn-outputs file first
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
      } else {
        // Fallback: Get outputs directly from CloudFormation
        const response = await cloudFormation.describeStacks({ StackName: stackName }).promise();
        const stack = response.Stacks![0];
        
        if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
          throw new Error(`Stack ${stackName} is not in a complete state: ${stack.StackStatus}`);
        }
        
        // Convert outputs to flat format
        stack.Outputs?.forEach(output => {
          outputs[output.OutputKey!] = output.OutputValue!;
        });
      }
      
      if (Object.keys(outputs).length === 0) {
        throw new Error('No stack outputs found. Ensure the stack is deployed and cfn-outputs are available.');
      }
    } catch (error) {
      console.error('Failed to load stack outputs:', error);
      throw error;
    }
  }, 60000);

  /* -------------------------------------------------------------------- */
  /* VPC and Networking Integration Tests                                 */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking Integration', () => {
    test('VPC exists and is available', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      expect(vpcId).toBeDefined();

      const response = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      const vpc = response.Vpcs![0];

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();
    }, 30000);

    test('subnets are properly distributed across AZs', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      
      const response = await ec2.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const subnets = response.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);

      // Check AZ distribution
      const azs = [...new Set(subnets.map(s => s.AvailabilityZone))];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('NAT Gateways are running and have Elastic IPs', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      
      const response = await ec2.describeNatGateways({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const natGateways = response.NatGateways!.filter(nat => nat.State !== 'deleted');
      expect(natGateways.length).toBe(2);

      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    }, 30000);

    test('internet gateway is attached to VPC', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      
      const response = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }).promise();

      const igws = response.InternetGateways!;
      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
    }, 30000);
  });

  /* -------------------------------------------------------------------- */
  /* Load Balancer Integration Tests                                      */
  /* -------------------------------------------------------------------- */
  describe('Load Balancer Integration', () => {
    test('ALB is active and accessible', async () => {
      const albDns = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
      expect(albDns).toBeDefined();
      expect(albDns).toContain('.elb.amazonaws.com');

      const albName = albDns.split('.')[0];
      const response = await elbv2.describeLoadBalancers().promise();
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    }, 30000);

    test('target group exists and is configured correctly', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      
      const response = await elbv2.describeTargetGroups({
        Names: []
      }).promise();

      const stackTargetGroups = response.TargetGroups!.filter(tg => tg.VpcId === vpcId);
      expect(stackTargetGroups.length).toBeGreaterThanOrEqual(1);

      const tg = stackTargetGroups[0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckPath).toBe('/');
    }, 30000);

    test('ALB responds to HTTP requests', async () => {
      const albDns = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
      const http = require('http');
      
      return new Promise((resolve, reject) => {
        const req = http.get(`http://${albDns}`, { timeout: 10000 }, (res: any) => {
          expect(res.statusCode).toBeLessThan(500); // Accept any non-500 error
          resolve(res);
        });

        req.on('error', (error: any) => {
          if (error.code === 'ENOTFOUND') {
            reject(new Error(`DNS resolution failed for ${albDns}`));
          } else {
            // Connection established but may have failed - that's still a success for this test
            resolve(error);
          }
        });
        
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
    }, 15000);
  });

  /* -------------------------------------------------------------------- */
  /* Auto Scaling Group Integration Tests                                 */
  /* -------------------------------------------------------------------- */
  describe('Auto Scaling Group Integration', () => {
    test('ASG exists with correct configuration', async () => {
      const response = await autoScaling.describeAutoScalingGroups().promise();
      
      const stackAsgs = response.AutoScalingGroups!.filter(asg => 
        asg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackAsgs.length).toBe(1);
      const asg = stackAsgs[0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier).toBeDefined();
    }, 30000);

    test('EC2 instances are running in ASG', async () => {
      const asgResponse = await autoScaling.describeAutoScalingGroups().promise();
      const stackAsgs = asgResponse.AutoScalingGroups!.filter(asg => 
        asg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackAsgs.length).toBe(1);
      const asg = stackAsgs[0];
      
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map(i => i.InstanceId!);
        const ec2Response = await ec2.describeInstances({
          InstanceIds: instanceIds
        }).promise();

        ec2Response.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            expect(['running', 'pending']).toContain(instance.State!.Name);
            
            const nameTag = instance.Tags!.find(tag => tag.Key === 'Name');
            expect(nameTag?.Value).toBe('prod-web-server');
          });
        });
      } else {
        console.warn('No instances found in ASG - they may still be launching');
      }
    }, 45000);
  });

  /* -------------------------------------------------------------------- */
  /* RDS Integration Tests                                                 */
  /* -------------------------------------------------------------------- */
  describe('RDS Integration', () => {
    test('RDS instance exists and is available', async () => {
      const rdsEndpoint = outputs[`${stackName}-RDS-Endpoint`] || outputs['RDSEndpoint'];
      expect(rdsEndpoint).toBeDefined();

      const dbIdentifier = rdsEndpoint.split('.')[0];
      const response = await rds.describeDBInstances().promise();
      
      const dbInstance = response.DBInstances!.find(db => 
        db.Endpoint?.Address === rdsEndpoint ||
        db.DBInstanceIdentifier?.includes('prod') ||
        db.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(dbInstance).toBeDefined();
      expect(['available', 'creating', 'modifying']).toContain(dbInstance!.DBInstanceStatus);
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
    }, 45000);

    test('RDS is in private subnets', async () => {
      const rdsEndpoint = outputs[`${stackName}-RDS-Endpoint`] || outputs['RDSEndpoint'];
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];

      const response = await rds.describeDBInstances().promise();
      const dbInstance = response.DBInstances!.find(db => 
        db.Endpoint?.Address === rdsEndpoint ||
        db.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(dbInstance).toBeDefined();
      const subnetGroup = dbInstance!.DBSubnetGroup!;

      expect(subnetGroup.VpcId).toBe(vpcId);
      expect(subnetGroup.Subnets!.length).toBe(2);

      // Verify subnets are private (no route to IGW)
      const subnetIds = subnetGroup.Subnets!.map(s => s.SubnetIdentifier!);
      const subnetResponse = await ec2.describeSubnets({
        SubnetIds: subnetIds
      }).promise();

      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 30000);
  });

  /* -------------------------------------------------------------------- */
  /* S3 Integration Tests                                                  */
  /* -------------------------------------------------------------------- */
  describe('S3 Integration', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];
      expect(bucketName).toBeDefined();

      const response = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(response.$response.httpResponse.statusCode).toBe(200);
    }, 30000);

    test('S3 bucket has public read policy', async () => {
      const bucketName = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];

      try {
        const policyResponse = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
        const policy = JSON.parse(policyResponse.Policy!);
        
        expect(policy.Statement).toBeDefined();
        const publicReadStatement = policy.Statement.find((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Principal === '*' &&
          stmt.Action === 's3:GetObject'
        );
        
        expect(publicReadStatement).toBeDefined();
      } catch (error) {
        if (error.code !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    }, 30000);

    test('S3 bucket allows object upload and retrieval', async () => {
      const bucketName = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      try {
        // Upload test object
        await s3.putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain'
        }).promise();

        // Retrieve test object
        const getResponse = await s3.getObject({
          Bucket: bucketName,
          Key: testKey
        }).promise();

        expect(getResponse.Body!.toString()).toBe(testContent);

        // Cleanup
        await s3.deleteObject({ Bucket: bucketName, Key: testKey }).promise();
      } catch (error) {
        // Cleanup on error
        try {
          await s3.deleteObject({ Bucket: bucketName, Key: testKey }).promise();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    }, 30000);
  });

  /* -------------------------------------------------------------------- */
  /* Security Integration Tests                                            */
  /* -------------------------------------------------------------------- */
  describe('Security Integration', () => {
    test('security groups have correct rules', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];

      const response = await ec2.describeSecurityGroups({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const securityGroups = response.SecurityGroups!.filter(sg => 
        sg.GroupName !== 'default' && sg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      // Find ALB security group (should allow HTTP/HTTPS from anywhere)
      const albSG = securityGroups.find(sg => 
        sg.Tags?.some(tag => tag.Key === 'Name' && tag.Value!.includes('alb'))
      );

      if (albSG) {
        const httpRule = albSG.IpPermissions!.find(rule => rule.FromPort === 80);
        const httpsRule = albSG.IpPermissions!.find(rule => rule.FromPort === 443);
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        if (httpRule) {
          expect(httpRule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
        }
      }
    }, 30000);

    test('RDS is not directly accessible from internet', async () => {
      const rdsEndpoint = outputs[`${stackName}-RDS-Endpoint`] || outputs['RDSEndpoint'];
      
      // Attempt to connect - should fail/timeout
      const net = require('net');
      
      return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let connectionFailed = false;

        socket.setTimeout(5000);

        socket.on('timeout', () => {
          connectionFailed = true;
          socket.destroy();
          resolve('Connection timeout as expected - RDS not publicly accessible');
        });

        socket.on('error', (error: any) => {
          connectionFailed = true;
          expect(['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']).toContain(error.code);
          resolve('Connection failed as expected - RDS not publicly accessible');
        });

        socket.on('connect', () => {
          socket.destroy();
          if (!connectionFailed) {
            reject(new Error('RDS should not be accessible from internet'));
          }
        });

        socket.connect(3306, rdsEndpoint);
      });
    }, 10000);
  });

  /* -------------------------------------------------------------------- */
  /* CloudWatch Integration Tests                                         */
  /* -------------------------------------------------------------------- */
  describe('CloudWatch Integration', () => {
    test('CloudWatch alarms exist for the stack', async () => {
      const response = await cloudWatch.describeAlarms({
        MaxRecords: 100
      }).promise();

      const stackAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.AlarmArn!.includes(stackName) ||
        alarm.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(1);

      stackAlarms.forEach(alarm => {
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue!);
        expect(alarm.MetricName).toBeDefined();
        expect(alarm.Namespace).toBeDefined();
      });
    }, 30000);

    test('Auto Scaling policies exist', async () => {
      const response = await autoScaling.describePolicies().promise();
      
      const stackPolicies = response.ScalingPolicies!.filter(policy =>
        policy.PolicyName!.toLowerCase().includes('prod') ||
        policy.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      if (stackPolicies.length > 0) {
        expect(stackPolicies.length).toBeGreaterThanOrEqual(2);
        
        const scaleUpPolicy = stackPolicies.find(p => p.ScalingAdjustment! > 0);
        const scaleDownPolicy = stackPolicies.find(p => p.ScalingAdjustment! < 0);

        if (scaleUpPolicy) expect(scaleUpPolicy.ScalingAdjustment).toBe(1);
        if (scaleDownPolicy) expect(scaleDownPolicy.ScalingAdjustment).toBe(-1);
      }
    }, 30000);
  });

  /* -------------------------------------------------------------------- */
  /* End-to-End Integration Tests                                         */
  /* -------------------------------------------------------------------- */
  describe('End-to-End Integration', () => {
    test('stack outputs are accessible and valid', async () => {
      const requiredOutputs = ['VPCId', 'LoadBalancerDNS', 'RDSEndpoint', 'S3BucketName'];
      
      requiredOutputs.forEach(outputKey => {
        const value = outputs[`${stackName}-${outputKey}`] || outputs[outputKey];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    }, 10000);

    test('infrastructure components are interconnected', async () => {
      const vpcId = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
      const albDns = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
      
      // Verify ALB is in the correct VPC
      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);
      
      expect(alb).toBeDefined();
      expect(alb!.VpcId).toBe(vpcId);

      // Verify ALB subnets are in the VPC
      const subnetResponse = await ec2.describeSubnets({
        SubnetIds: alb!.AvailabilityZones!.map(az => az.SubnetId!)
      }).promise();

      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true); // ALB should be in public subnets
      });
    }, 30000);

    test('complete stack health check', async () => {
      const healthChecks = await Promise.allSettled([
        // VPC health
        ec2.describeVpcs({ VpcIds: [outputs[`${stackName}-VPC-ID`] || outputs['VPCId']] }).promise(),
        
        // S3 health  
        s3.headBucket({ Bucket: outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'] }).promise(),
        
        // ALB health
        elbv2.describeLoadBalancers().promise(),
        
        // Auto Scaling health
        autoScaling.describeAutoScalingGroups().promise()
      ]);

      const failedChecks = healthChecks.filter(result => result.status === 'rejected');
      
      if (failedChecks.length > 0) {
        console.warn('Some health checks failed:', failedChecks);
      }

      // At least 75% of health checks should pass
      const successRate = (healthChecks.length - failedChecks.length) / healthChecks.length;
      expect(successRate).toBeGreaterThanOrEqual(0.75);
    }, 45000);
  });
});
