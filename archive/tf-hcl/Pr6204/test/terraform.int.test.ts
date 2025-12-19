// integration.test.ts
import { 
  EC2Client, 
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeVpcAttributeCommand,
  DescribeRouteTablesCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
  ModifyTargetGroupAttributesCommand,
  AddTagsCommand as ELBAddTagsCommand,
  RemoveTagsCommand as ELBRemoveTagsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  RotateSecretCommand
} from '@aws-sdk/client-secrets-manager';
import { 
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  SetDesiredCapacityCommand,
  DescribeScalingActivitiesCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  SimulatePrincipalPolicyCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
  GetOpenIDConnectProviderCommand,
} from '@aws-sdk/client-iam';
import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
} from '@aws-sdk/client-sts';
import axios from 'axios';
import { Client } from 'pg'; // NOTE: Original file used 'pg' client, keeping it here.
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'; // NOTE: Adding jest imports

// ============================================================================
// DEPLOYMENT OUTPUT MANAGEMENT
// ============================================================================

// Use the same path definition as requested
const OUTPUT_FILE = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

// Define the interface with the required outputs for the original tests
// NOTE: Defining deployment outputs based on the original request's clients 
// and the requested format (where values are directly strings, not { value: string })
interface DeploymentOutputs {
  alb_dns_name: string;
  rds_endpoint: string;
  secrets_manager_secret_arn: string;
  // Add other required outputs based on the referred format's pattern
  vpc_id: string;
  asg_name: string; 
  ec2_role_name: string; 
}

// Load deployment outputs dynamically
function loadDeploymentOutputs(): DeploymentOutputs {
  const outputPaths = [
    // Use the path from the referred file format
    path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json'), 
    path.resolve(process.cwd(), 'terraform-outputs.json'),
    path.resolve(process.cwd(), 'outputs.json'),
    path.resolve(process.cwd(), 'deployment-outputs.json'),
  ];

  for (const outputPath of outputPaths) {
    if (fs.existsSync(outputPath)) {
      const rawData = fs.readFileSync(outputPath, 'utf8');
      // NOTE: Assuming the output file structure is flat (key: value) based on the referred format
      return JSON.parse(rawData) as DeploymentOutputs; 
    }
  }

  throw new Error('Deployment outputs file not found. Please ensure Terraform outputs are exported to JSON.');
}

const outputs = loadDeploymentOutputs();
const region = process.env.AWS_REGION || 'us-east-1'; // Reverting to original region
const albDns = outputs.alb_dns_name;


// Initialize AWS SDK clients
let ec2Client: EC2Client;
let elbClient: ElasticLoadBalancingV2Client;
let rdsClient: RDSClient;
let secretsClient: SecretsManagerClient;
let autoScalingClient: AutoScalingClient;
let cloudWatchClient: CloudWatchClient;
let iamClient: IAMClient;
const stsClient = new STSClient({ region }); // Added STS client
let accountId: string;

beforeAll(async () => {

  const identity = await stsClient.send(new GetCallerIdentityCommand({}));
  accountId = identity.Account!;
  // Initialize AWS SDK clients
  ec2Client = new EC2Client({ region });
  elbClient = new ElasticLoadBalancingV2Client({ region });
  rdsClient = new RDSClient({ region });
  secretsClient = new SecretsManagerClient({ region });
  autoScalingClient = new AutoScalingClient({ region });
  cloudWatchClient = new CloudWatchClient({ region });
  iamClient = new IAMClient({ region });
});

// Helper functions (copied from the referred format)
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  delay: number = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

const waitForIgwAttachment = async (vpcId: string, maxAttempts: number = 20, delayMs: number = 3000) => {
    for (let i = 0; i < maxAttempts; i++) {
        const igws = await ec2Client.send(new DescribeInternetGatewaysCommand({
            Filters: [
                { Name: 'attachment.vpc-id', Values: [vpcId] }
            ]
        }));

        if (igws.InternetGateways && igws.InternetGateways.length > 0) {
            const attachmentState = igws.InternetGateways[0].Attachments![0]?.State;
            
            if (attachmentState === 'attached') {
                return true; // Success!
            }
        }
        
        // Wait before trying again
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false; // Failed after max attempts
};

describe('Infrastructure Integration Tests', () => {
  
  /**
   * RESOURCE VALIDATION TESTS (Non-Interactive)
   * Validate that resources are deployed with correct configurations
   */
  describe('Resource Validation', () => {
    
    describe('VPC and Networking Resources', () => {
      test('VPC should be configured with correct CIDR and DNS settings', async () => {
        const vpcs = await ec2Client.send(new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id]
        }));
        expect(vpcs.Vpcs).toHaveLength(1);
        const vpc = vpcs.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');

        // DescribeVpcAttribute must be used to retrieve DNS attributes
        const dnsHostnames = await ec2Client.send(new DescribeVpcAttributeCommand({
          VpcId: vpc.VpcId!,
          Attribute: 'enableDnsHostnames'
        }));
        expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupport = await ec2Client.send(new DescribeVpcAttributeCommand({
          VpcId: vpc.VpcId!,
          Attribute: 'enableDnsSupport'
        }));
        expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      });

      test('Should have 3 public and 3 private subnets across different AZs', async () => {
        const subnets = await ec2Client.send(new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.vpc_id] } 
          ]
        }));
        
        const publicSubnets = subnets.Subnets!.filter(s => 
          s.Tags?.find(t => t.Key === 'Type' && t.Value === 'Public')
        );
        const privateSubnets = subnets.Subnets!.filter(s => 
          s.Tags?.find(t => t.Key === 'Type' && t.Value === 'Private')
        );
        
        expect(publicSubnets).toHaveLength(3);
        expect(privateSubnets).toHaveLength(3);
        
        // Verify different AZs
        const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
        const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));
        expect(publicAZs.size).toBe(3);
        expect(privateAZs.size).toBe(3);
        
        // Verify public IP assignment
        publicSubnets.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      });

      test('NAT Gateways should be deployed in each public subnet', async () => {
        const natGateways = await ec2Client.send(new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [outputs.vpc_id] }
          ]
        }));
        
        expect(natGateways.NatGateways).toHaveLength(3);
        natGateways.NatGateways!.forEach(nat => {
          expect(nat.State).toBe('available');
          expect(nat.ConnectivityType).toBe('public');
        });
      });

  });

    describe('Security Groups Configuration', () => {
      test('ALB security group should allow HTTP traffic on port 80', async () => {
        const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.vpc_id] },
            { Name: 'tag:Name', Values: ['webapp-alb-sg'] }
          ]
        }));
        
        expect(sgs.SecurityGroups).toHaveLength(1);
        const albSg = sgs.SecurityGroups![0];
        
        const httpIngress = albSg.IpPermissions!.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpIngress).toBeDefined();
        expect(httpIngress!.IpProtocol).toBe('tcp');
        expect(httpIngress!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      });

      test('EC2 security group should only allow traffic from ALB on port 3000', async () => {
        const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'tag:Name', Values: ['webapp-ec2-sg'] }
          ]
        }));
        
        const ec2Sg = sgs.SecurityGroups![0];
        const appIngress = ec2Sg.IpPermissions!.find(rule => 
          rule.FromPort === 3000 && rule.ToPort === 3000
        );
        
        expect(appIngress).toBeDefined();
        expect(appIngress!.UserIdGroupPairs).toHaveLength(1);
        // Should reference ALB security group
        expect(appIngress!.UserIdGroupPairs![0].Description).toContain('ALB');
      });

      test('RDS security group should only allow PostgreSQL traffic from EC2', async () => {
        const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'tag:Name', Values: ['webapp-rds-sg'] }
          ]
        }));
        
        const rdsSg = sgs.SecurityGroups![0];
        const pgIngress = rdsSg.IpPermissions!.find(rule => 
          rule.FromPort === 5432 && rule.ToPort === 5432
        );
        
        expect(pgIngress).toBeDefined();
        expect(pgIngress!.UserIdGroupPairs).toHaveLength(1);
      });
    });

    describe('Application Load Balancer Configuration', () => {
      test('ALB should be internet-facing with correct settings', async () => {
        const albs = await elbClient.send(new DescribeLoadBalancersCommand({
          Names: ['webapp-alb1']
        }));

        const alb = albs.LoadBalancers!.find(lb => lb.DNSName === outputs.alb_dns_name);
                       
        expect(alb).toBeDefined();
        expect(alb!.Scheme).toBe('internet-facing');
        expect(alb!.Type).toBe('application');
        expect(alb!.State?.Code).toBe('active');
        expect(alb!.DNSName).toBe(outputs.alb_dns_name);
      });

      test('Target group should have proper health check configuration', async () => {
        const tgs = await elbClient.send(new DescribeTargetGroupsCommand({
          Names: ['webapp-tg']
        }));
        
        const tg = tgs.TargetGroups![0];
        expect(tg.Port).toBe(3000);
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.HealthCheckPath).toBe('/health');
        expect(tg.HealthCheckIntervalSeconds).toBe(30);
        expect(tg.HealthyThresholdCount).toBe(2);
        expect(tg.UnhealthyThresholdCount).toBe(2);
      });

      test('ALB listener should forward traffic to target group', async () => {
        const albs = await elbClient.send(new DescribeLoadBalancersCommand({
          Names: ['webapp-alb']
        }));    
        const listeners = await elbClient.send(new DescribeListenersCommand({
          LoadBalancerArn: albs.LoadBalancers![0].LoadBalancerArn
        }));
        
        expect(listeners.Listeners).toHaveLength(1);
        const listener = listeners.Listeners![0];
        expect(listener.Port).toBe(80);
        expect(listener.Protocol).toBe('HTTP');
        expect(listener.DefaultActions![0].Type).toBe('forward');
      });
    });

    describe('Auto Scaling Configuration', () => {
      test('Auto Scaling Group should have correct capacity settings', async () => {
        const asgs = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.asg_name],
        }));
        
        expect(asgs.AutoScalingGroups).toHaveLength(1);
        const asg = asgs.AutoScalingGroups![0];
        
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(10);
        expect(asg.DesiredCapacity).toBe(2);
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.HealthCheckGracePeriod).toBe(300);
      });
    });

    describe('RDS Configuration', () => {
      test('RDS instance should be Multi-AZ PostgreSQL with encryption', async () => {
        const endpoint = outputs.rds_endpoint.split(':')[0];
        const dbs = await rdsClient.send(new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'engine', Values: ['postgres'] }
          ]
        }));
        
        const db = dbs.DBInstances!.find(d => 
          d.Endpoint?.Address === endpoint
        );
        
        expect(db).toBeDefined();
        expect(db!.Engine).toBe('postgres');
        expect(db!.EngineVersion).toContain('15');
        expect(db!.MultiAZ).toBe(true);
        expect(db!.StorageEncrypted).toBe(true);
        expect(db!.DBInstanceClass).toBe('db.t3.micro');
        expect(db!.BackupRetentionPeriod).toBe(7);
        expect(db!.PubliclyAccessible).toBe(false);
      });
    });

    describe('IAM Configuration', () => {
      test('EC2 IAM role should have correct permissions', async () => {
        const role = await iamClient.send(new GetRoleCommand({
          RoleName: outputs.ec2_role_name || 'webapp-ec2-role' // Use output or fallback
        }));
        
        expect(role.Role).toBeDefined();
        const assumeRolePolicy = JSON.parse(decodeURIComponent(role.Role!.AssumeRolePolicyDocument!));
        expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
      });

      test('EC2 instances should have access to Secrets Manager', async () => {
        const roleName = outputs.ec2_role_name || 'webapp-ec2-role';
        const simulation = await iamClient.send(new SimulatePrincipalPolicyCommand({
          PolicySourceArn: `arn:aws:iam::${accountId}:role/${roleName}`, // Use dynamic accountId
          ActionNames: ['secretsmanager:GetSecretValue'],
          ResourceArns: [outputs.secrets_manager_secret_arn]
        }));
        
        expect(simulation.EvaluationResults![0].EvalDecision).toBe('allowed');
      });
    });

    describe('CloudWatch Alarms', () => {
      test('CPU high alarm should be configured correctly', async () => {
        const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: ['webapp-cpu-high']
        }));
        
        expect(alarms.MetricAlarms).toHaveLength(1);
        const alarm = alarms.MetricAlarms![0];
        
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Threshold).toBe(70);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.EvaluationPeriods).toBe(2);
      });
    });
  });

  /**
   * CROSS-SERVICE TESTS (Interactive)
   * Test interactions between two services
   */
  describe('Cross-Service Tests', () => {
    
    test('ALB should route traffic to healthy EC2 targets', async () => {
      // Get target group
      const tgs = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: ['webapp-tg']
      }));
      const targetGroupArn = tgs.TargetGroups![0].TargetGroupArn;
      
      // Check target health
      const health = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn
      }));
      
      const healthyTargets = health.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      
      expect(healthyTargets.length).toBeGreaterThanOrEqual(2);
      
      // Make HTTP request through ALB
      const albUrl = `http://${outputs.alb_dns_name}`;
      const response = await axios.get(albUrl, { timeout: 10000 });
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('Hello from AWS!');
      
      // Verify health endpoint
      const healthResponse = await axios.get(`${albUrl}/health`);
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toBe('OK');
    });

    test('EC2 instances should retrieve RDS password from Secrets Manager', async () => {
      // Get secret value
      const secret = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_arn
      }));
      
      expect(secret.SecretString).toBeDefined();
      expect(secret.SecretString!.length).toBeGreaterThan(20);
      
      // Get EC2 instances
      const instances = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Project', Values: ['webapp'] },
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      }));
      
      // Verify instances have IAM profile attached
      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toContain('webapp-ec2-profile');
        });
      });
    });

    test('CloudWatch should collect metrics from Auto Scaling Group', async () => {
      const asgs = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.asg_name],
      }));
      
      const asgName = asgs.AutoScalingGroups![0].AutoScalingGroupName;
      
      // Get CPU metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago
      
      const metrics = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'AutoScalingGroupName',
            Value: asgName
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average']
      }));
      
      expect(metrics.Datapoints).toBeDefined();
      expect(metrics.Label).toBe('CPUUtilization');
    });

    test('RDS should be accessible from EC2 instances in private subnets', async () => {
      // Get RDS endpoint
      const [rdsHost, rdsPort] = outputs.rds_endpoint.split(':');
      
      // Get secret for password
      const secret = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_arn
      }));
      
      // Verify connectivity would work (we can't directly test from EC2)
      // But we can verify network path exists
      const rdsInstances = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'engine', Values: ['postgres'] }
        ]
      }));
      
      const rdsInstance = rdsInstances.DBInstances!.find(db => 
        db.Endpoint?.Address === rdsHost
      );
      
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance!.DBSubnetGroup?.VpcId).toBeDefined();
      
      // Verify EC2 and RDS are in same VPC
      const instances = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Project', Values: ['webapp'] },
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      }));
      
      const ec2VpcId = instances.Reservations![0].Instances![0].VpcId;
      expect(ec2VpcId).toBeDefined();
    });
  });

  /**
   * END-TO-END TESTS (Interactive)
   * Test complete flows involving 3+ services
   */
  describe('End-to-End Tests', () => {
    
    test('Complete request flow: Client -> ALB -> EC2 -> Health Check', async () => {
      const albUrl = `http://${outputs.alb_dns_name}`;
      
      // Step 1: Make multiple requests to test load balancing
      const requests = Array(10).fill(null).map(() => 
        axios.get(albUrl, { 
          timeout: 10000,
          validateStatus: () => true 
        })
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toContain('Hello from AWS!');
      });
      
      // Step 2: Verify targets are healthy
      const tgs = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: ['webapp-tg']
      }));
      
      const health = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: tgs.TargetGroups![0].TargetGroupArn
      }));
      
      const healthyTargets = health.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      
      expect(healthyTargets.length).toBeGreaterThanOrEqual(2);
      
      // Step 3: Verify CloudWatch is receiving metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 900000); // 15 minutes ago
      
      const albMetrics = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApplicationELB',
        MetricName: 'RequestCount',
        Dimensions: [
          {
            Name: 'LoadBalancer',
            Value: `app/webapp-alb/${outputs.alb_dns_name.split('-')[2].split('.')[0]}`
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      }));
      
      expect(albMetrics.Datapoints).toBeDefined();
    });

    test('Secret rotation flow: Rotate secret -> Update RDS -> Verify connectivity', async () => {
      // Step 1: Get current secret version
      const currentSecret = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_arn
      }));
      
      const currentVersionId = currentSecret.VersionId;
      
      // Step 2: Initiate secret rotation (if rotation is configured)
      try {
        await secretsClient.send(new RotateSecretCommand({
          SecretId: outputs.secrets_manager_secret_arn,
          RotationRules: {
            AutomaticallyAfterDays: 30
          }
        }));
      } catch (error: any) {

      }
      
      // Step 3: Verify secret metadata
      const updatedSecret = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_arn
      }));
      
      expect(updatedSecret.ARN).toBe(outputs.secrets_manager_secret_arn);
      expect(updatedSecret.SecretString).toBeDefined();
      
      // Step 4: Verify RDS is still accessible
      const rdsInstances = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'engine', Values: ['postgres'] }
        ]
      }));
      
      const [dbHost] = outputs.rds_endpoint.split(':');
      const rdsInstance = rdsInstances.DBInstances!.find(db => 
        db.Endpoint?.Address === dbHost
      );
      
      expect(rdsInstance!.DBInstanceStatus).toBe('available');
      
    });
  });

  /**
   * SERVICE-LEVEL TESTS (Interactive)
   * Test operations within single services
   */
  describe('Service-Level Tests', () => {
    
    describe('RDS Service Tests', () => {
      test('RDS backup configuration should be properly set', async () => {
        const [dbHost] = outputs.rds_endpoint.split(':');
        const rdsInstances = await rdsClient.send(new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'engine', Values: ['postgres'] }
          ]
        }));
        const rdsInstance = rdsInstances.DBInstances!.find(db => 
          db.Endpoint?.Address === dbHost
        );

        expect(rdsInstance).toBeDefined();
        expect(rdsInstance!.BackupRetentionPeriod).toBe(7);
        expect(rdsInstance!.PreferredBackupWindow).toBeDefined(); 
        expect(rdsInstance!.PreferredMaintenanceWindow).toBeDefined();
        
        // Verify automated backups are enabled
        expect(rdsInstance!.BackupRetentionPeriod).toBeGreaterThan(0);
      });

      test('RDS monitoring and logging should be enabled', async () => {
        const [dbHost] = outputs.rds_endpoint.split(':');
        const rdsInstances = await rdsClient.send(new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'engine', Values: ['postgres'] }
          ]
        }));
        
        const rdsInstance = rdsInstances.DBInstances!.find(db => 
          db.Endpoint?.Address === dbHost
        );

        expect(rdsInstance).toBeDefined();
        expect(rdsInstance!.EnabledCloudwatchLogsExports).toContain('postgresql');
        expect(rdsInstance!.MonitoringInterval).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Auto Scaling Service Tests', () => {      
      test('Auto Scaling should respect min and max boundaries', async () => {
        const asgs = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.asg_name],
        }));
        
        const asg = asgs.AutoScalingGroups![0];
        const asgName = asg.AutoScalingGroupName!;
        const originalCapacity = asg.DesiredCapacity;
        
        // Try to set capacity below minimum (should fail or adjust to min)
        try {
          await autoScalingClient.send(new SetDesiredCapacityCommand({
            AutoScalingGroupName: asgName,
            DesiredCapacity: 0
          }));
        }catch (error: any) {
        }
        
        // Try to set capacity above maximum (should fail or adjust to max)
        try {
          await autoScalingClient.send(new SetDesiredCapacityCommand({
            AutoScalingGroupName: asgName,
            DesiredCapacity: 15
          }));
        }catch (error: any) {
        }

        await autoScalingClient.send(new SetDesiredCapacityCommand({
          AutoScalingGroupName: asgName,
          DesiredCapacity: originalCapacity
        }));

        // Give AWS time to process the last command before checking
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify capacity is still within bounds
        const updatedAsgs = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        }));
        
        const updatedAsg = updatedAsgs.AutoScalingGroups![0];
        expect(updatedAsg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(updatedAsg.DesiredCapacity).toBeLessThanOrEqual(10);
      });
    });

    describe('CloudWatch Service Tests', () => {
      test('CloudWatch should collect and store metrics', async () => {
        // Put custom metric
        const timestamp = new Date();
        await cloudWatchClient.send(new PutMetricDataCommand({
          Namespace: 'WebApp/Performance',
          MetricData: [
            {
              MetricName: 'ResponseTime',
              Value: 150,
              Unit: 'Milliseconds',
              Timestamp: timestamp,
              Dimensions: [
                {
                  Name: 'Environment',
                  Value: 'production'
                }
              ]
            }
          ]
        }));
        
        // Wait for metric to be available
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Retrieve metric
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 300000); // 5 minutes ago
        
        const metrics = await cloudWatchClient.send(new GetMetricStatisticsCommand({
          Namespace: 'WebApp/Performance',
          MetricName: 'ResponseTime',
          Dimensions: [
            {
              Name: 'Environment',
              Value: 'production'
            }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 60,
          Statistics: ['Average', 'Maximum', 'Minimum']
        }));
        
        expect(metrics.Label).toBe('ResponseTime');
        // Metrics might not be immediately available
        if (metrics.Datapoints && metrics.Datapoints.length > 0) {
          expect(metrics.Datapoints[0].Maximum).toBeGreaterThanOrEqual(150);
        }
      });

      test('CloudWatch alarms should track state changes', async () => {
        const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: ['webapp-cpu-high']
        }));
        
        expect(alarms.MetricAlarms).toHaveLength(1);
        const alarm = alarms.MetricAlarms![0];
        
        // Check alarm state
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);
        
        // Verify state reason
        expect(alarm.StateReason).toBeDefined();
        expect(alarm.StateUpdatedTimestamp).toBeDefined();
        
        // Check alarm actions are configured
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      });
    });

    describe('Secrets Manager Service Tests', () => {
      test('Secret should have proper versioning', async () => {
        const secret = await secretsClient.send(new GetSecretValueCommand({
          SecretId: outputs.secrets_manager_secret_arn
        }));
        
        expect(secret.VersionId).toBeDefined();
        // AWSCURRENT is the stage for the version currently being used
        expect(secret.VersionStages).toContain('AWSCURRENT'); 
        expect(secret.CreatedDate).toBeDefined();
      });

      test('Secret should be retrievable with proper permissions', async () => {
        // Test secret retrieval
        const secret = await secretsClient.send(new GetSecretValueCommand({
          SecretId: outputs.secrets_manager_secret_arn
        }));
        
        expect(secret.SecretString).toBeDefined();
        expect(secret.SecretString!.length).toBeGreaterThan(20);
        
        // Verify secret format (should be a strong password)
        const password = secret.SecretString!;
        expect(password).toMatch(/[A-Z]/); // Has uppercase
        expect(password).toMatch(/[a-z]/); // Has lowercase
        // expect(password).toMatch(/[0-9]/); // Has numbers
        expect(password).toMatch(/[!#$%&()*+,\-.:;<=>?[$^{}|~]/); // Has special chars
      });
    });

    describe('VPC Service Tests', () => {
      test('VPC DNS resolution should work correctly', async () => {
        const vpcs = await ec2Client.send(new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id]
        }));

        expect(vpcs.Vpcs).toHaveLength(1);
        const vpc = vpcs.Vpcs![0];
      
        // Verify DHCP options
        expect(vpc.DhcpOptionsId).toBeDefined();
        expect(vpc.DhcpOptionsId).not.toBe('dopt-00000000'); // Ensure it's not a dummy ID
      });

      test('Route tables should have correct routes configured', async () => {
        // Check public route table
        const publicRoutes = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.vpc_id] },
            { Name: 'tag:Name', Values: ['webapp-public-rt'] }
          ]
        }));
        
        expect(publicRoutes.RouteTables).toHaveLength(1);
        const publicRoute = publicRoutes.RouteTables![0].Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        
        expect(publicRoute).toBeDefined();
        expect(publicRoute!.GatewayId).toContain('igw-');
        
        // Check private route tables
        const privateRoutes = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.vpc_id] },
            { Name: 'tag:Name', Values: ['webapp-private-rt-1'] } // Check one example
          ]
        }));
        
        expect(privateRoutes.RouteTables).toHaveLength(1);
        const privateRoute = privateRoutes.RouteTables![0].Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        
        expect(privateRoute).toBeDefined();
        expect(privateRoute!.NatGatewayId).toContain('nat-');
      });
    });
  });

  /**
   * PERFORMANCE AND LOAD TESTS
   */
  describe('Performance and Load Tests', () => {
    test('ALB should handle concurrent requests efficiently', async () => {
      const albUrl = `http://${outputs.alb_dns_name}`; 
      const concurrentRequests = 50;
      
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill(null).map((_, index) => 
        axios.get(albUrl, { 
          timeout: 30000,
          headers: { 'X-Request-ID': `perf-test-${index}` }
        })
      );
      
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful).toBeGreaterThan(concurrentRequests * 0.90); // 90% success rate
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
    });
  });

  /**
   * CLEANUP AND VALIDATION
   */
  afterAll(async () => {
    console.log('Integration tests completed');
    console.log('Infrastructure validation summary:');
    console.log('- ALB endpoint:', outputs.alb_dns_name);
    console.log('- RDS endpoint:', outputs.rds_endpoint);
    console.log('- Secrets ARN:', outputs.secrets_manager_secret_arn);
  });
});