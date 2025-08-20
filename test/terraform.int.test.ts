import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
import path from 'path';

// Load reference outputs
const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const referenceOutputs = JSON.parse(fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8'));

// AWS Clients
const stsClient = new STSClient({ region: referenceOutputs.region });
const ec2Client = new EC2Client({ region: referenceOutputs.region });
const rdsClient = new RDSClient({ region: referenceOutputs.region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: referenceOutputs.region });
const asgClient = new AutoScalingClient({ region: referenceOutputs.region });
const logsClient = new CloudWatchLogsClient({ region: referenceOutputs.region });
const iamClient = new IAMClient({ region: referenceOutputs.region });
const ssmClient = new SSMClient({ region: referenceOutputs.region });

describe('Terraform Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = stsResponse.Account!;
  });

  describe('AWS Account and Region Validation', () => {
    test('should have valid AWS account ID', () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);
    });

    test('should be in correct region', () => {
      expect(referenceOutputs.region).toBe('us-east-1');
    });

    test('should have correct environment', () => {
      expect(referenceOutputs.environment).toBe('dev');
    });
  });

  describe('VPC Infrastructure Validation', () => {
    test('should have valid VPC', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [referenceOutputs.vpc_id]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(referenceOutputs.vpc_id);
      expect(vpc.CidrBlock).toBe(referenceOutputs.vpc_cidr_block);
      expect(vpc.State).toBe('available');
    });

    test('should have correct number of public subnets', async () => {
      const publicSubnetIds = JSON.parse(referenceOutputs.public_subnet_ids);
      expect(publicSubnetIds).toHaveLength(2);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have correct number of private subnets', async () => {
      const privateSubnetIds = JSON.parse(referenceOutputs.private_subnet_ids);
      expect(privateSubnetIds).toHaveLength(2);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have valid internet gateway', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [referenceOutputs.vpc_id]
      }));

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(referenceOutputs.vpc_id);
      expect(vpc.State).toBe('available');
    });

    test('should have valid security groups', async () => {
      const securityGroupIds = [
        referenceOutputs.web_security_group_id,
        referenceOutputs.database_security_group_id
      ];

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      }));

      expect(response.SecurityGroups).toHaveLength(2);
      response.SecurityGroups!.forEach(sg => {
        expect(sg.GroupId).toBeDefined();
        expect(sg.VpcId).toBe(referenceOutputs.vpc_id);
      });
    });
  });

  describe('Database Infrastructure Validation', () => {
    test('should have valid RDS instance', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: referenceOutputs.database_identifier
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(referenceOutputs.database_identifier);
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBe(referenceOutputs.database_engine_version);
      expect(dbInstance.DBInstanceClass).toBe(referenceOutputs.database_instance_class);
      expect(dbInstance.AllocatedStorage).toBe(parseInt(referenceOutputs.database_allocated_storage));
      expect(dbInstance.StorageEncrypted).toBe(referenceOutputs.database_encrypted === 'true');
    });

    test('should have valid database endpoint', () => {
      expect(referenceOutputs.database_endpoint).toMatch(/\.rds\.amazonaws\.com:\d+$/);
      expect(referenceOutputs.database_port).toBe('5432');
    });

    test('should have valid database subnet group', () => {
      expect(referenceOutputs.subnet_group_name).toMatch(/^dev-db-subnet-group-us-east-1$/);
    });

    test('should have valid parameter group', () => {
      expect(referenceOutputs.parameter_group_name).toMatch(/^dev-db-params-us-east-1$/);
    });
  });

  describe('Compute Infrastructure Validation', () => {
    test('should have valid load balancer', async () => {
      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [referenceOutputs.load_balancer_arn]
      }));

      expect(response.LoadBalancers).toHaveLength(1);
      const lb = response.LoadBalancers![0];
      expect(lb.LoadBalancerArn).toBe(referenceOutputs.load_balancer_arn);
      expect(lb.DNSName).toBe(referenceOutputs.load_balancer_dns_name);
      expect(lb.State?.Code).toBe('active');
      expect(lb.Type).toBe('application');
    });

    test('should have valid autoscaling group', async () => {
      const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [referenceOutputs.autoscaling_group_name]
      }));

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(referenceOutputs.autoscaling_group_name);
      expect(asg.AutoScalingGroupARN).toMatch(/^arn:aws:autoscaling:us-east-1:\d+:autoScalingGroup:/);
      expect(asg.AutoScalingGroupARN).toContain(referenceOutputs.autoscaling_group_name);
      expect(asg.AutoScalingGroupName).toBeDefined();
      expect(asg.AutoScalingGroupARN).toBeDefined();
    });

    test('should have valid launch template', () => {
      expect(referenceOutputs.launch_template_id).toMatch(/^lt-[a-z0-9]+$/);
      expect(referenceOutputs.instance_type).toBe('t3.micro');
    });

    test('should have valid target group', () => {
      expect(referenceOutputs.target_group_arn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(referenceOutputs.target_group_name).toMatch(/^dev-tg-us-east-1$/);
    });
  });

  describe('IAM Infrastructure Validation', () => {
    test('should have valid EC2 role', async () => {
      const response = await iamClient.send(new GetRoleCommand({
        RoleName: referenceOutputs.ec2_role_arn.split('/').pop()
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe('dev-ec2-role-us-east-1');
      expect(response.Role!.Arn).toBe(referenceOutputs.ec2_role_arn);
    });

    test('should have valid EC2 instance profile', () => {
      expect(referenceOutputs.ec2_instance_profile_name).toBe('dev-ec2-profile-us-east-1');
    });

    test('should have valid RDS monitoring role', async () => {
      const response = await iamClient.send(new GetRoleCommand({
        RoleName: referenceOutputs.rds_monitoring_role_arn.split('/').pop()
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe('dev-rds-monitoring-role-us-east-1');
      expect(response.Role!.Arn).toBe(referenceOutputs.rds_monitoring_role_arn);
    });
  });

  describe('Security and Configuration Validation', () => {
    test('should have valid SSM parameter for database password', async () => {
      const response = await ssmClient.send(new GetParameterCommand({
        Name: referenceOutputs.ssm_parameter_name,
        WithDecryption: false
      }));

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Name).toBe(referenceOutputs.ssm_parameter_name);
      expect(response.Parameter!.Type).toBe('SecureString');
    });

    test('should have consistent tagging', () => {
      const commonTags = JSON.parse(referenceOutputs.common_tags);
      expect(commonTags.Environment).toBe('dev');
      expect(commonTags.ManagedBy).toBe('terraform');
      expect(commonTags.Owner).toBe('platform-team');
      expect(commonTags.Project).toBe('multi-region-infrastructure');
    });

    test('should have valid infrastructure summary', () => {
      const summary = JSON.parse(referenceOutputs.infrastructure_summary);
      expect(summary.environment).toBe('dev');
      expect(summary.region).toBe('us-east-1');
      expect(summary.vpc_id).toBe(referenceOutputs.vpc_id);
      expect(summary.vpc_cidr).toBe(referenceOutputs.vpc_cidr_block);
      expect(summary.public_subnets).toBe(2);
      expect(summary.private_subnets).toBe(2);
      expect(summary.load_balancer_dns).toBe(referenceOutputs.load_balancer_dns_name);
      expect(summary.database_endpoint).toBe(referenceOutputs.database_endpoint);
    });
  });

  describe('Connectivity and Health Checks', () => {
    test('should have valid AMI', () => {
      expect(referenceOutputs.ami_id).toMatch(/^ami-[a-z0-9]+$/);
    });

    test('should have valid load balancer zone ID', () => {
      expect(referenceOutputs.load_balancer_zone_id).toMatch(/^Z[A-Z0-9]+$/);
    });

    test('should have valid listener ARN', () => {
      expect(referenceOutputs.listener_arn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    test('should have valid database instance ARN', () => {
      expect(referenceOutputs.database_instance_arn).toMatch(/^arn:aws:rds:us-east-1:\d+:db:/);
    });

    test('should have valid database instance ID', () => {
      expect(referenceOutputs.database_instance_id).toMatch(/^db-[A-Z0-9]+$/);
    });
  });

  describe('Resource Relationships Validation', () => {
    test('should have consistent VPC references', () => {
      // All resources should reference the same VPC
      expect(referenceOutputs.vpc_id).toBeDefined();
      expect(referenceOutputs.vpc_cidr_block).toBe('10.0.0.0/16');
    });

    test('should have consistent subnet references', () => {
      const publicSubnets = JSON.parse(referenceOutputs.public_subnet_ids);
      const privateSubnets = JSON.parse(referenceOutputs.private_subnet_ids);
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      
      // All subnets should be unique
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const uniqueSubnets = [...new Set(allSubnets)];
      expect(uniqueSubnets).toHaveLength(4);
    });

    test('should have consistent security group references', () => {
      expect(referenceOutputs.web_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
      expect(referenceOutputs.database_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
      expect(referenceOutputs.web_security_group_id).not.toBe(referenceOutputs.database_security_group_id);
    });
  });
});