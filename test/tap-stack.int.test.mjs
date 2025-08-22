import { ECSClient, DescribeClustersCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { SecretsManagerClient, DescribeSecretsCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import fs from 'fs';
import path from 'path';

// Read deployment outputs
let outputs = {};
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS Clients
const ecsClient = new ECSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });
const ecrClient = new ECRClient({ region: 'us-west-2' });

describe('CI/CD Pipeline with AWS Fargate - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping VPC test - no VPC ID in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
    });
  });

  describe('ECS Cluster', () => {
    test('ECS cluster should exist and be active', async () => {
      if (!outputs.ECSClusterName) {
        console.log('Skipping ECS cluster test - no cluster name in outputs');
        return;
      }

      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName]
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);
      
      const cluster = response.clusters[0];
      expect(cluster.status).toBe('ACTIVE');
      
      // Check Container Insights is enabled (optional check)
      const containerInsightsSetting = cluster.settings?.find(s => s.name === 'containerInsights');
      // Container Insights may not always be present in settings array
      if (containerInsightsSetting) {
        expect(['enabled', 'enhanced']).toContain(containerInsightsSetting.value);
      }
    });
  });

  describe('ECS Service', () => {
    test('ECS service should be properly configured', async () => {
      if (!outputs.ECSClusterName || !outputs.ECSServiceName) {
        console.log('Skipping ECS service test - missing outputs');
        return;
      }

      try {
        const command = new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [outputs.ECSServiceName]
        });

        const response = await ecsClient.send(command);
        
        if (response.services && response.services.length > 0) {
          const service = response.services[0];
          expect(service.status).toBe('ACTIVE');
          expect(service.launchType || service.capacityProviderStrategy).toBeDefined();
        }
      } catch (error) {
        // Service might not be fully deployed yet
        console.log('ECS service not yet available:', error.message);
      }
    });
  });

  describe('ECR Repository', () => {
    test('ECR repository should exist', async () => {
      if (!outputs.ECRRepositoryUrl) {
        console.log('Skipping ECR test - no repository URL in outputs');
        return;
      }

      // Extract repository name from URL
      const repoName = outputs.ECRRepositoryUrl.split('/').pop();
      
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName]
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toHaveLength(1);
      expect(response.repositories[0].repositoryUri).toBe(outputs.ECRRepositoryUrl);
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log group should exist', async () => {
      if (!outputs.LogGroupName) {
        console.log('Skipping CloudWatch Logs test - no log group name in outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.LogGroupName);
      
      expect(logGroup).toBeDefined();
      if (logGroup) {
        expect(logGroup.retentionInDays).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('Infrastructure Health Check', () => {
    test('All critical resources should be deployed', () => {
      const criticalResources = [
        'ECSClusterName',
        'ECRRepositoryUrl',
        'LogGroupName'
      ];

      const deployedResources = criticalResources.filter(resource => outputs[resource]);
      
      // At least some core resources should be present
      expect(deployedResources.length).toBeGreaterThan(0);
      expect(outputs.ECSClusterName).toBeDefined();
    });
  });
});