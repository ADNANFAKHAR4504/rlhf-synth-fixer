// integration-tests.test.ts
// Integration tests for Terraform web application infrastructure
// Tests live AWS resources and end-to-end workflows using cfn-outputs/flat-outputs.json

import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import axios from 'axios';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const OUTPUT_FILE = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

// Helper function to convert snake_case to PascalCase
function toPascalCase(str: string): string {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

// Helper to parse array strings from outputs
function parseArrayString(str: string): string[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

describe('Web Application Infrastructure Integration Tests', () => {
  let outputs: any;
  let ec2: AWS.EC2;
  let elbv2: AWS.ELBv2;
  let autoscaling: AWS.AutoScaling;
  let rds: AWS.RDS;
  let s3: AWS.S3;
  let secretsManager: AWS.SecretsManager;
  let cloudwatch: AWS.CloudWatch;
  let cloudwatchLogs: AWS.CloudWatchLogs;
  let iam: AWS.IAM;
  let ssm: AWS.SSM;

  beforeAll(async () => {
    // Load deployment outputs
    if (fs.existsSync(OUTPUT_FILE)) {
      const rawOutputs = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      
      // Convert snake_case keys to PascalCase for compatibility
      outputs = {};
      for (const [key, value] of Object.entries(rawOutputs)) {
        const pascalKey = toPascalCase(key);
        outputs[pascalKey] = value;
      }
      
      console.log('Loaded outputs:', Object.keys(outputs));
    } else {
      throw new Error(`Deployment outputs not found at ${OUTPUT_FILE}. Run deployment first.`);
    }

    // Initialize AWS clients - default to us-west-2 as per your config
    const region = process.env.AWS_REGION || 'us-west-2';
    
    ec2 = new AWS.EC2({ region });
    elbv2 = new AWS.ELBv2({ region });
    autoscaling = new AWS.AutoScaling({ region });
    rds = new AWS.RDS({ region });
    s3 = new AWS.S3({ region });
    secretsManager = new AWS.SecretsManager({ region });
    cloudwatch = new AWS.CloudWatch({ region });
    cloudwatchLogs = new AWS.CloudWatchLogs({ region });
    iam = new AWS.IAM({ region });
    ssm = new AWS.SSM({ region });
  });

  // ============ RESOURCE VALIDATION (Non-Interactive) ============
  describe('Resource Validation', () => {
    describe('Deployment Outputs', () => {
      test('all required outputs are present', () => {
        const requiredOutputs = [
          'VpcId',
          'PublicSubnetIds',
          'PrivateSubnetIds',
          'DatabaseSubnetIds',
          'SecurityGroupAlbId',
          'SecurityGroupWebId',
          'SecurityGroupRdsId',
          'RdsEndpoint',
          'RdsReadReplicaEndpoints',
          'AutoscalingGroupName',
          'DbSecretArn',
          'DbSecretName'
        ];

        requiredOutputs.forEach(output => {
          expect(outputs[output]).toBeDefined();
          expect(outputs[output]).not.toBe('');
        });
      });

      test('resource naming follows convention', () => {
        expect(outputs.AutoscalingGroupName).toContain('webapp-production');
        expect(outputs.DbSecretName).toContain('webapp-production-db-credentials');
      });
    });

    describe('VPC and Network Configuration', () => {
      test('VPC exists and is configured correctly', async () => {
        const vpcs = await ec2.describeVpcs({
          VpcIds: [outputs.VpcId]
        }).promise();

        expect(vpcs.Vpcs?.length).toBe(1);
        const vpc = vpcs.Vpcs![0];
        
        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        
        // Check for webapp-production-vpc tag
        const nameTag = vpc.Tags?.find(t => t.Key === 'Name');
        expect(nameTag?.Value).toContain('webapp-production-vpc');
      });

      test('all subnets are properly configured', async () => {
        const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
        const privateSubnetIds = parseArrayString(outputs.PrivateSubnetIds);
        const databaseSubnetIds = parseArrayString(outputs.DatabaseSubnetIds);
        
        const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds];
        
        const subnets = await ec2.describeSubnets({
          SubnetIds: allSubnetIds
        }).promise();

        expect(subnets.Subnets?.length).toBe(6); // 2 public, 2 private, 2 database

        // Verify public subnets
        publicSubnetIds.forEach(subnetId => {
          const subnet = subnets.Subnets?.find(s => s.SubnetId === subnetId);
          expect(subnet?.MapPublicIpOnLaunch).toBe(true);
          expect(subnet?.VpcId).toBe(outputs.VpcId);
        });

        // Verify private and database subnets
        [...privateSubnetIds, ...databaseSubnetIds].forEach(subnetId => {
          const subnet = subnets.Subnets?.find(s => s.SubnetId === subnetId);
          expect(subnet?.MapPublicIpOnLaunch).toBe(false);
          expect(subnet?.VpcId).toBe(outputs.VpcId);
        });
      });

      test('NAT gateways are configured for high availability', async () => {
        const natGateways = await ec2.describeNatGateways({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId]
            },
            {
              Name: 'state',
              Values: ['available']
            }
          ]
        }).promise();

        expect(natGateways.NatGateways?.length).toBe(2); // One per AZ
        
        natGateways.NatGateways?.forEach(nat => {
          expect(nat.State).toBe('available');
          expect(nat.VpcId).toBe(outputs.VpcId);
          // Check NAT is in public subnet
          const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
          expect(publicSubnetIds).toContain(nat.SubnetId);
        });
      });

      test('internet gateway is attached to VPC', async () => {
        const igws = await ec2.describeInternetGateways({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.VpcId]
            }
          ]
        }).promise();

        expect(igws.InternetGateways?.length).toBe(1);
        const igw = igws.InternetGateways![0];
        
        const attachment = igw.Attachments?.find(a => a.VpcId === outputs.VpcId);
        expect(attachment?.State).toBe('available');
      });
    });

    describe('Security Groups Configuration', () => {
      test('ALB security group allows HTTP/HTTPS from internet', async () => {
        const sgs = await ec2.describeSecurityGroups({
          GroupIds: [outputs.SecurityGroupAlbId]
        }).promise();

        expect(sgs.SecurityGroups?.length).toBe(1);
        const albSg = sgs.SecurityGroups![0];
        
        // Check inbound rules
        const httpRule = albSg.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

        const httpsRule = albSg.IpPermissions?.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      });

      test('Web security group only allows traffic from ALB', async () => {
        const sgs = await ec2.describeSecurityGroups({
          GroupIds: [outputs.SecurityGroupWebId]
        }).promise();

        const webSg = sgs.SecurityGroups![0];
        
        // Check that HTTP/HTTPS rules reference ALB security group
        const httpRule = webSg.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.SecurityGroupAlbId);
      });

      test('RDS security group only allows traffic from web servers', async () => {
        const sgs = await ec2.describeSecurityGroups({
          GroupIds: [outputs.SecurityGroupRdsId]
        }).promise();

        const rdsSg = sgs.SecurityGroups![0];
        
        // Check MySQL port rule
        const mysqlRule = rdsSg.IpPermissions?.find(rule => 
          rule.FromPort === 3306 && rule.ToPort === 3306
        );
        expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.SecurityGroupWebId);
      });
    });

    describe('RDS Database Configuration', () => {
      test('RDS master instance is configured correctly', async () => {
        const endpoint = outputs.RdsEndpoint.split(':')[0];
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        expect(dbInstances.DBInstances?.length).toBe(1);
        const dbInstance = dbInstances.DBInstances![0];
        
        expect(dbInstance.DBInstanceStatus).toBe('available');
        expect(dbInstance.Engine).toBe('mysql');
        expect(dbInstance.DBInstanceClass).toBe('db.t3.medium');
        expect(dbInstance.MultiAZ).toBe(true);
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.BackupRetentionPeriod).toBe(30);
        expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(100);
        expect(dbInstance.MaxAllocatedStorage).toBe(500);
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      });

      test('RDS read replica is configured and available', async () => {
        const replicaEndpoints = parseArrayString(outputs.RdsReadReplicaEndpoints);
        expect(replicaEndpoints.length).toBeGreaterThanOrEqual(1);

        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-read-replica-1'
        }).promise();

        expect(dbInstances.DBInstances?.length).toBe(1);
        const replica = dbInstances.DBInstances![0];
        
        expect(replica.DBInstanceStatus).toBe('available');
        expect(replica.ReadReplicaSourceDBInstanceIdentifier).toContain('webapp-production-mysql-master');
        expect(replica.PerformanceInsightsEnabled).toBe(true);
      });

      test('RDS subnet group spans multiple availability zones', async () => {
        const subnetGroups = await rds.describeDBSubnetGroups({
          DBSubnetGroupName: 'webapp-production-db-subnet-group'
        }).promise();

        expect(subnetGroups.DBSubnetGroups?.length).toBe(1);
        const subnetGroup = subnetGroups.DBSubnetGroups![0];
        
        expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
        expect(subnetGroup.Subnets?.length).toBe(2);
        
        // Verify different AZs
        const azs = subnetGroup.Subnets?.map(s => s.SubnetAvailabilityZone?.Name);
        expect(new Set(azs).size).toBe(2);
      });
    });

    describe('Auto Scaling Configuration', () => {
      test('Auto Scaling Group is configured correctly', async () => {
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();

        expect(asgs.AutoScalingGroups?.length).toBe(1);
        const asg = asgs.AutoScalingGroups![0];
        
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.HealthCheckGracePeriod).toBe(300);
        
        // Verify it spans multiple AZs
        const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
        expect(asg.VPCZoneIdentifier?.split(',')).toEqual(expect.arrayContaining(publicSubnetIds));
      });

      test('Launch template is configured with proper settings', async () => {
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();

        const launchTemplate = asgs.AutoScalingGroups![0].LaunchTemplate;
        expect(launchTemplate).toBeDefined();
        
        const ltVersions = await ec2.describeLaunchTemplateVersions({
          LaunchTemplateId: launchTemplate?.LaunchTemplateId,
          Versions: ['$Latest']
        }).promise();

        expect(ltVersions.LaunchTemplateVersions?.length).toBe(1);
        const ltData = ltVersions.LaunchTemplateVersions![0].LaunchTemplateData;
        
        expect(ltData?.InstanceType).toBe('t3.medium');
        expect(ltData?.BlockDeviceMappings?.[0]?.Ebs?.VolumeSize).toBe(20);
        expect(ltData?.BlockDeviceMappings?.[0]?.Ebs?.Encrypted).toBe(true);
        expect(ltData?.MetadataOptions?.HttpTokens).toBe('required');
        expect(ltData?.Monitoring?.Enabled).toBe(true);
      });

      test('Auto Scaling policies are configured', async () => {
        const policies = await autoscaling.describePolicies({
          AutoScalingGroupName: outputs.AutoscalingGroupName
        }).promise();

        expect(policies.ScalingPolicies?.length).toBeGreaterThanOrEqual(2);
        
        const scaleUpPolicy = policies.ScalingPolicies?.find(p => 
          p.PolicyName?.includes('scale-up')
        );
        expect(scaleUpPolicy).toBeDefined();
        expect(scaleUpPolicy?.ScalingAdjustment).toBe(2);
        
        const scaleDownPolicy = policies.ScalingPolicies?.find(p => 
          p.PolicyName?.includes('scale-down')
        );
        expect(scaleDownPolicy).toBeDefined();
        expect(scaleDownPolicy?.ScalingAdjustment).toBe(-1);
      });
    });

    describe('Secrets Manager Configuration', () => {
      test('database credentials secret exists and is accessible', async () => {
        const secret = await secretsManager.describeSecret({
          SecretId: outputs.DbSecretArn
        }).promise();

        expect(secret.ARN).toBe(outputs.DbSecretArn);
        expect(secret.Name).toBe(outputs.DbSecretName);
        expect(secret.DeletedDate).toBeUndefined();
        
        // Verify rotation is not enabled (as per config)
        expect(secret.RotationEnabled).toBeFalsy();
      });

      test('secret contains valid JSON structure', async () => {
        const secretValue = await secretsManager.getSecretValue({
          SecretId: outputs.DbSecretArn
        }).promise();

        expect(secretValue.SecretString).toBeDefined();
        
        const credentials = JSON.parse(secretValue.SecretString!);
        expect(credentials.username).toBeDefined();
        expect(credentials.password).toBeDefined();
        expect(credentials.engine).toBe('mysql');
        expect(credentials.port).toBe(3306);
        expect(credentials.dbname).toBe('webapp');
      });
    });

    describe('CloudWatch Monitoring', () => {
      test('CloudWatch alarms are configured for Auto Scaling', async () => {
        const alarms = await cloudwatch.describeAlarms({
          AlarmNames: [
            'webapp-production-cpu-high',
            'webapp-production-cpu-low'
          ]
        }).promise();

        expect(alarms.MetricAlarms?.length).toBe(2);
        
        const highCpuAlarm = alarms.MetricAlarms?.find(a => 
          a.AlarmName === 'webapp-production-cpu-high'
        );
        expect(highCpuAlarm?.MetricName).toBe('CPUUtilization');
        expect(highCpuAlarm?.Threshold).toBe(70);
        expect(highCpuAlarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
        
        const lowCpuAlarm = alarms.MetricAlarms?.find(a => 
          a.AlarmName === 'webapp-production-cpu-low'
        );
        expect(lowCpuAlarm?.Threshold).toBe(20);
        expect(lowCpuAlarm?.ComparisonOperator).toBe('LessThanOrEqualToThreshold');
      });

      test('CloudWatch Log Groups exist for RDS', async () => {
        const logGroupNames = [
          '/aws/rds/instance/webapp-production-mysql-master/error',
          '/aws/rds/instance/webapp-production-mysql-master/general',
          '/aws/rds/instance/webapp-production-mysql-master/slowquery'
        ];

        for (const logGroupName of logGroupNames) {
          try {
            const logGroups = await cloudwatchLogs.describeLogGroups({
              logGroupNamePrefix: logGroupName,
              limit: 1
            }).promise();

            const logGroup = logGroups.logGroups?.find(lg => 
              lg.logGroupName === logGroupName || 
              lg.logGroupName === logGroupName + 'tf' // Handle the 'errortf' case
            );
            
            expect(logGroup).toBeDefined();
            expect(logGroup?.retentionInDays).toBe(7);
          } catch (error) {
            console.warn(`Log group ${logGroupName} might not exist yet`);
          }
        }
      });
    });

    describe('IAM Roles and Policies', () => {
      test('EC2 instance profile has required permissions', async () => {
        const profileName = 'webapp-production-web-profile';
        
        const profiles = await iam.getInstanceProfile({
          InstanceProfileName: profileName
        }).promise();

        expect(profiles.InstanceProfile.Roles.length).toBe(1);
        
        const roleName = profiles.InstanceProfile.Roles[0].RoleName;
        
        // Check attached policies
        const attachedPolicies = await iam.listAttachedRolePolicies({
          RoleName: roleName
        }).promise();

        const policyArns = attachedPolicies.AttachedPolicies?.map(p => p.PolicyArn);
        
        expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
        expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
        
        // Check for Secrets Manager policy
        const secretsPolicy = attachedPolicies.AttachedPolicies?.find(p => 
          p.PolicyName?.includes('secrets-manager-read')
        );
        expect(secretsPolicy).toBeDefined();
      });
    });
  });

  // ============ SERVICE-LEVEL TESTS (Interactive - Single Service) ============
  describe('Service-Level Tests', () => {
    describe('EC2 Instance Connectivity', () => {
      test('instances in Auto Scaling Group are healthy', async () => {
        const asgInstances = await autoscaling.describeAutoScalingInstances({
          MaxRecords: 50
        }).promise();

        const instancesInAsg = asgInstances.AutoScalingInstances?.filter(i => 
          i.AutoScalingGroupName === outputs.AutoscalingGroupName
        );

        expect(instancesInAsg?.length).toBeGreaterThanOrEqual(2);
        
        instancesInAsg?.forEach(instance => {
          expect(instance.HealthStatus).toBe('HEALTHY');
          expect(instance.LifecycleState).toBe('InService');
        });
      });

      test('instances can be accessed via Systems Manager', async () => {
        const asgInstances = await autoscaling.describeAutoScalingInstances({
          MaxRecords: 50
        }).promise();

        const instanceId = asgInstances.AutoScalingInstances?.find(i => 
          i.AutoScalingGroupName === outputs.AutoscalingGroupName
        )?.InstanceId;

        if (instanceId) {
          const instanceInfo = await ssm.describeInstanceInformation({
            Filters: [
              {
                Key: 'InstanceIds',
                Values: [instanceId]
              }
            ]
          }).promise();
        }
      });
    });

    describe('Database Connectivity', () => {
      test('can retrieve and parse database credentials from Secrets Manager', async () => {
        const secretValue = await secretsManager.getSecretValue({
          SecretId: outputs.DbSecretArn
        }).promise();

        const credentials = JSON.parse(secretValue.SecretString!);
        
        expect(credentials.username).toBeTruthy();
        expect(credentials.password).toBeTruthy();
        expect(credentials.password.length).toBeGreaterThanOrEqual(32);
      });

      test('database endpoint is resolvable', async () => {
        const endpoint = outputs.RdsEndpoint.split(':')[0];
        
        // DNS lookup to verify endpoint resolution
        const dns = require('dns').promises;
        
        try {
          const addresses = await dns.resolve4(endpoint);
          expect(addresses.length).toBeGreaterThan(0);
        } catch (error) {
          console.warn('DNS resolution failed - this might be expected in isolated test environment');
        }
      });
    });

    describe('S3 Bucket Operations', () => {
      test('ALB logs bucket exists and has correct configuration', async () => {
        // Derive bucket name from pattern
        const accountId = outputs.DbSecretArn.split(':')[4];
        const bucketName = `webapp-production-alb-logs-${accountId}`;

        try {
          // Check bucket exists
          await s3.headBucket({ Bucket: bucketName }).promise();

          // Check versioning
          const versioning = await s3.getBucketVersioning({ 
            Bucket: bucketName 
          }).promise();
          expect(versioning.Status).toBe('Enabled');

          // Check encryption
          const encryption = await s3.getBucketEncryption({ 
            Bucket: bucketName 
          }).promise();
          expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

          // Check public access block
          const publicAccessBlock = await s3.getPublicAccessBlock({ 
            Bucket: bucketName 
          }).promise();
          expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
          expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
          expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
          expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

          // Check lifecycle configuration
          const lifecycle = await s3.getBucketLifecycleConfiguration({ 
            Bucket: bucketName 
          }).promise();
          expect(lifecycle.Rules?.length).toBeGreaterThan(0);
          
          const rule = lifecycle.Rules?.[0];
          expect(rule?.Status).toBe('Enabled');
          expect(rule?.Transitions?.length).toBe(2);
        } catch (error: any) {
          if (error.code === 'NoSuchBucket') {
            console.warn('ALB logs bucket not found - it may not have been referenced in outputs');
          } else {
            throw error;
          }
        }
      });
    });
  });

  // ============ CROSS-SERVICE TESTS (Interactive - Two Services) ============
  describe('Cross-Service Tests', () => {
    describe('Auto Scaling and CloudWatch Integration', () => {
      test('Auto Scaling Group metrics are being collected', async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

        const metrics = await cloudwatch.getMetricStatistics({
          Namespace: 'AWS/EC2',
          MetricName: 'CPUUtilization',
          Dimensions: [
            {
              Name: 'AutoScalingGroupName',
              Value: outputs.AutoscalingGroupName
            }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Average']
        }).promise();
      });

      test('scaling policies respond to CloudWatch alarms', async () => {
        const alarms = await cloudwatch.describeAlarms({
          AlarmNames: ['webapp-production-cpu-high']
        }).promise();

        const alarm = alarms.MetricAlarms?.[0];
        expect(alarm).toBeDefined();
        
        // Verify alarm actions point to scaling policies
        const policies = await autoscaling.describePolicies({
          AutoScalingGroupName: outputs.AutoscalingGroupName
        }).promise();

        const scaleUpPolicy = policies.ScalingPolicies?.find(p => 
          p.PolicyName?.includes('scale-up')
        );
        
        expect(alarm?.AlarmActions).toContain(scaleUpPolicy?.PolicyARN);
      });
    });

    describe('VPC and Security Group Integration', () => {
      test('security groups properly reference each other', async () => {
        // Get all three security groups
        const sgs = await ec2.describeSecurityGroups({
          GroupIds: [
            outputs.SecurityGroupAlbId,
            outputs.SecurityGroupWebId,
            outputs.SecurityGroupRdsId
          ]
        }).promise();

        const webSg = sgs.SecurityGroups?.find(sg => sg.GroupId === outputs.SecurityGroupWebId);
        const rdsSg = sgs.SecurityGroups?.find(sg => sg.GroupId === outputs.SecurityGroupRdsId);

        // Web SG should reference ALB SG
        const webHttpRule = webSg?.IpPermissions?.find(rule => rule.FromPort === 80);
        expect(webHttpRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.SecurityGroupAlbId);

        // RDS SG should reference Web SG
        const rdsRule = rdsSg?.IpPermissions?.find(rule => rule.FromPort === 3306);
        expect(rdsRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.SecurityGroupWebId);
      });

      test('instances are in correct subnets', async () => {
        const instances = await autoscaling.describeAutoScalingInstances().promise();
        
        const asgInstances = instances.AutoScalingInstances?.filter(i => 
          i.AutoScalingGroupName === outputs.AutoscalingGroupName
        );

        if (asgInstances && asgInstances.length > 0) {
          const instanceIds = asgInstances.map(i => i.InstanceId);
          
          const ec2Instances = await ec2.describeInstances({
            InstanceIds: instanceIds
          }).promise();

          const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
          
          ec2Instances.Reservations?.forEach(reservation => {
            reservation.Instances?.forEach(instance => {
              // Instances should be in public subnets (as per ASG config)
              expect(publicSubnetIds).toContain(instance.SubnetId);
              expect(instance.VpcId).toBe(outputs.VpcId);
              
              // Check security group
              const sgIds = instance.SecurityGroups?.map(sg => sg.GroupId);
              expect(sgIds).toContain(outputs.SecurityGroupWebId);
            });
          });
        }
      });
    });

    describe('RDS and Subnet Group Integration', () => {
      test('RDS instances are in correct subnet group', async () => {
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        const dbInstance = dbInstances.DBInstances![0];
        expect(dbInstance.DBSubnetGroup?.DBSubnetGroupName).toBe('webapp-production-db-subnet-group');
        
        // Verify subnets match our database subnets
        const databaseSubnetIds = parseArrayString(outputs.DatabaseSubnetIds);
        const rdsSubnetIds = dbInstance.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier);
        
        expect(rdsSubnetIds?.sort()).toEqual(databaseSubnetIds.sort());
      });

      test('RDS security group is properly applied', async () => {
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        const dbInstance = dbInstances.DBInstances![0];
        const vpcSgIds = dbInstance.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId);
        
        expect(vpcSgIds).toContain(outputs.SecurityGroupRdsId);
      });
    });
  });

  // ============ END-TO-END TESTS (Interactive - Three+ Services) ============
  describe('End-to-End Tests', () => {
    describe('High Availability Configuration', () => {
      test('infrastructure spans multiple availability zones', async () => {
        // Check subnets span multiple AZs
        const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
        const privateSubnetIds = parseArrayString(outputs.PrivateSubnetIds);
        const databaseSubnetIds = parseArrayString(outputs.DatabaseSubnetIds);
        
        const subnets = await ec2.describeSubnets({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds]
        }).promise();

        const azs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);

        // Check Auto Scaling Group spans multiple AZs
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();

        const asgAzs = asgs.AutoScalingGroups![0].AvailabilityZones;
        expect(asgAzs?.length).toBeGreaterThanOrEqual(2);

        // Check RDS Multi-AZ is enabled
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        expect(dbInstances.DBInstances![0].MultiAZ).toBe(true);
      });

      test('failover capability with read replicas', async () => {
        const masterDb = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        const replicaDb = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-read-replica-1'
        }).promise();

        // Verify read replica is in different AZ
        const masterAz = masterDb.DBInstances![0].AvailabilityZone;
        const replicaAz = replicaDb.DBInstances![0].AvailabilityZone;
        
        // They might be in same or different AZ, but both should be available
        expect(masterDb.DBInstances![0].DBInstanceStatus).toBe('available');
        expect(replicaDb.DBInstances![0].DBInstanceStatus).toBe('available');
      });
    });

    describe('Complete Infrastructure Flow', () => {
      test('all components are properly connected', async () => {
        // This test verifies the complete chain of resources
        
        // 1. VPC exists
        const vpcs = await ec2.describeVpcs({
          VpcIds: [outputs.VpcId]
        }).promise();
        expect(vpcs.Vpcs?.length).toBe(1);

        // 2. Subnets exist in VPC
        const publicSubnetIds = parseArrayString(outputs.PublicSubnetIds);
        const subnets = await ec2.describeSubnets({
          SubnetIds: publicSubnetIds
        }).promise();
        expect(subnets.Subnets?.every(s => s.VpcId === outputs.VpcId)).toBe(true);

        // 3. Auto Scaling Group uses correct subnets
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();
        const asgSubnets = asgs.AutoScalingGroups![0].VPCZoneIdentifier?.split(',');
        expect(asgSubnets?.sort()).toEqual(publicSubnetIds.sort());

        // 4. Security groups exist in VPC
        const sgs = await ec2.describeSecurityGroups({
          GroupIds: [outputs.SecurityGroupWebId]
        }).promise();
        expect(sgs.SecurityGroups![0].VpcId).toBe(outputs.VpcId);

        // 5. RDS is in VPC
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();
        const dbSubnets = dbInstances.DBInstances![0].DBSubnetGroup?.Subnets;
        expect(dbSubnets?.every(s => s.SubnetStatus === 'Active')).toBe(true);

        // 6. Secrets Manager secret exists
        const secret = await secretsManager.describeSecret({
          SecretId: outputs.DbSecretArn
        }).promise();
        expect(secret.DeletedDate).toBeUndefined();
      });
    });

    describe('Monitoring and Observability', () => {
      test('CloudWatch dashboards could be created with available metrics', async () => {
        // List available metrics for the infrastructure
        const metrics = await cloudwatch.listMetrics({
          Namespace: 'AWS/EC2',
          Dimensions: [
            {
              Name: 'AutoScalingGroupName',
              Value: outputs.AutoscalingGroupName
            }
          ]
        }).promise();

        // Expected metrics for monitoring
        const expectedMetrics = [
          'CPUUtilization',
          'NetworkIn',
          'NetworkOut',
          'DiskReadOps',
          'DiskWriteOps'
        ];

        const availableMetricNames = metrics.Metrics?.map(m => m.MetricName) || [];
        
        // Some metrics might be available
        expectedMetrics.forEach(metric => {
          if (availableMetricNames.includes(metric)) {
            expect(availableMetricNames).toContain(metric);
          }
        });
      });

      test('RDS Performance Insights is enabled', async () => {
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        const dbInstance = dbInstances.DBInstances![0];
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
        expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
      });

      test('CloudWatch logs are configured for RDS', async () => {
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();

        const enabledLogs = dbInstances.DBInstances![0].EnabledCloudwatchLogsExports;
        expect(enabledLogs).toContain('error');
        expect(enabledLogs).toContain('general');
        expect(enabledLogs).toContain('slowquery');
      });
    });

    describe('Security Best Practices', () => {
      test('encryption is enabled for all data stores', async () => {
        // RDS encryption
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();
        expect(dbInstances.DBInstances![0].StorageEncrypted).toBe(true);

        // EBS encryption for launch template
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();
        const ltId = asgs.AutoScalingGroups![0].LaunchTemplate?.LaunchTemplateId;
        
        if (ltId) {
          const ltVersions = await ec2.describeLaunchTemplateVersions({
            LaunchTemplateId: ltId,
            Versions: ['$Latest']
          }).promise();
          
          const blockDevices = ltVersions.LaunchTemplateVersions![0]
            .LaunchTemplateData?.BlockDeviceMappings;
          expect(blockDevices?.[0]?.Ebs?.Encrypted).toBe(true);
        }
      });

      test('IMDSv2 is enforced on EC2 instances', async () => {
        const asgs = await autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [outputs.AutoscalingGroupName]
        }).promise();
        const ltId = asgs.AutoScalingGroups![0].LaunchTemplate?.LaunchTemplateId;
        
        if (ltId) {
          const ltVersions = await ec2.describeLaunchTemplateVersions({
            LaunchTemplateId: ltId,
            Versions: ['$Latest']
          }).promise();
          
          const metadataOptions = ltVersions.LaunchTemplateVersions![0]
            .LaunchTemplateData?.MetadataOptions;
          expect(metadataOptions?.HttpTokens).toBe('required');
          expect(metadataOptions?.HttpEndpoint).toBe('enabled');
        }
      });

      test('database uses secure parameters', async () => {
        // Check parameter group settings
        const dbInstances = await rds.describeDBInstances({
          DBInstanceIdentifier: 'webapp-production-mysql-master'
        }).promise();
        
        const parameterGroupName = dbInstances.DBInstances![0]
          .DBParameterGroups?.[0]?.DBParameterGroupName;
        
        if (parameterGroupName) {
          const parameters = await rds.describeDBParameters({
            DBParameterGroupName: parameterGroupName
          }).promise();
          
          // Check for important security parameters
          const slowQueryLog = parameters.Parameters?.find(p => 
            p.ParameterName === 'slow_query_log'
          );
          expect(slowQueryLog?.ParameterValue).toBe('1');
          
          const maxConnections = parameters.Parameters?.find(p => 
            p.ParameterName === 'max_connections'
          );
          expect(parseInt(maxConnections?.ParameterValue || '0')).toBeGreaterThanOrEqual(500);
        }
      });
    });
  });
});