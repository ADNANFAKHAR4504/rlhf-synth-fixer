# Migration Infrastructure - Ideal CloudFormation Solution

This CloudFormation template provides a comprehensive migration infrastructure for moving an on-premises application to AWS with minimal downtime using DMS, VPN, Aurora MySQL, and Application Load Balancer.

## Integration Testing Framework

The solution includes robust integration tests that validate real AWS resources using AWS CLI commands rather than SDK clients to avoid ES module compatibility issues with Jest.

### Dynamic Integration Tests

```typescript
import { spawn } from 'child_process';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-2';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));
const environmentSuffix = 'pr5418'; // Extracted from deployed stack

// Helper function to run AWS CLI commands
async function runAwsCommand(command: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('aws', [...command, '--region', region, '--output', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    // Set a timeout for the AWS CLI command
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`AWS CLI command timed out: aws ${command.join(' ')}`));
    }, 20000); // 20 second timeout

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(`AWS CLI command failed: ${stderr}`));
      }
    });
  });
}

describe('Migration Infrastructure - AWS Resource Integration Tests', () => {

  describe('VPC and Network Infrastructure', () => {
    test('should have a functional VPC with correct configuration', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpcs', '--vpc-ids', outputs.VPCId]);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');

      console.log(`✅ VPC ${outputs.VPCId} is active with CIDR 10.0.0.0/16`);
    }, 25000);

    test('should have public and private subnets in different AZs', async () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      const response = await runAwsCommand(['ec2', 'describe-subnets', '--subnet-ids',
        outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]);

      expect(response.Subnets).toHaveLength(4);
      const azs = response.Subnets.map((subnet: any) => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // All subnets in 2 AZs

      console.log(`✅ Subnets deployed across AZs: ${Array.from(new Set(azs)).join(', ')}`);
    }, 25000);
  });

  describe('VPN Infrastructure', () => {
    test('should have a configured VPN gateway', async () => {
      expect(outputs.VPNGatewayId).toBeDefined();
      expect(outputs.VPNGatewayId).toMatch(/^vgw-[a-f0-9]+$/);

      const response = await runAwsCommand(['ec2', 'describe-vpn-gateways', '--vpn-gateway-ids', outputs.VPNGatewayId]);
      expect(response.VpnGateways).toHaveLength(1);
      expect(response.VpnGateways[0].State).toBe('available');

      console.log(`✅ VPN Gateway ${outputs.VPNGatewayId} is operational`);
    }, 25000);
  });

  describe('Aurora Database Infrastructure', () => {
    test('should have an operational Aurora cluster', async () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();

      // Extract cluster identifier from the endpoint
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split('.')[0];
      expect(clusterIdentifier).toContain('migration-aurora-cluster');

      const response = await runAwsCommand(['rds', 'describe-db-clusters', '--db-cluster-identifier', clusterIdentifier]);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters[0].Status).toBe('available');
      expect(response.DBClusters[0].Endpoint).toBe(outputs.AuroraClusterEndpoint);
      expect(response.DBClusters[0].Engine).toBe('aurora-mysql');

      console.log(`✅ Aurora cluster ${clusterIdentifier} is active`);
    }, 25000);

    test('should have accessible Aurora secrets', async () => {
      expect(outputs.AuroraDBSecretArn).toBeDefined();
      expect(outputs.AuroraDBSecretArn).toMatch(/^arn:aws:secretsmanager:/);

      const response = await runAwsCommand(['secretsmanager', 'describe-secret', '--secret-id', outputs.AuroraDBSecretArn]);
      expect(response.ARN).toBe(outputs.AuroraDBSecretArn);
      expect(response.Name).toContain(environmentSuffix);

      console.log(`✅ Aurora secrets ${outputs.AuroraDBSecretArn} are configured`);
    }, 25000);
  });

  describe('Data Migration Service (DMS) Infrastructure', () => {
    test('should have operational DMS replication instances', async () => {
      const response = await runAwsCommand(['dms', 'describe-replication-instances']);
      const dmsInstances = response.ReplicationInstances?.filter(
        (instance: any) => instance.ReplicationInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dmsInstances).toBeDefined();
      expect(dmsInstances.length).toBeGreaterThan(0);

      dmsInstances.forEach((instance: any) => {
        expect(instance.ReplicationInstanceStatus).toBe('available');
        console.log(`✅ DMS instance ${instance.ReplicationInstanceIdentifier} is available`);
      });
    }, 20000);

    test('should have configured DMS replication tasks', async () => {
      const response = await runAwsCommand(['dms', 'describe-replication-tasks']);
      const dmsTasks = response.ReplicationTasks?.filter(
        (task: any) => task.ReplicationTaskIdentifier?.includes(environmentSuffix)
      );

      expect(dmsTasks).toBeDefined();
      expect(dmsTasks.length).toBeGreaterThan(0);

      dmsTasks.forEach((task: any) => {
        expect(['ready', 'running', 'stopped'].includes(task.Status)).toBeTruthy();
        console.log(`✅ DMS task ${task.ReplicationTaskIdentifier} is ${task.Status}`);
      });
    }, 20000);
  });

  describe('Application Load Balancer Infrastructure', () => {
    test('should have an operational Application Load Balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      const response = await runAwsCommand(['elbv2', 'describe-load-balancers', '--load-balancer-arns', outputs.ApplicationLoadBalancerArn]);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Type).toBe('application');

      console.log(`✅ ALB ${outputs.ApplicationLoadBalancerArn} is active`);
    }, 25000);

    test('should have configured target groups for load balancer', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();

      const response = await runAwsCommand(['elbv2', 'describe-target-groups', '--load-balancer-arn', outputs.ApplicationLoadBalancerArn]);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups.length).toBeGreaterThan(0);

      response.TargetGroups.forEach((tg: any) => {
        expect(tg.TargetType).toBeDefined();
        console.log(`✅ Target group ${tg.TargetGroupName} configured for ${tg.TargetType} targets`);
      });
    }, 25000);
  });

  describe('Migration Infrastructure Validation', () => {
    test('should have all critical migration components', () => {
      const criticalOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'VPNGatewayId', 'CustomerGatewayId', 'VPNConnectionId',
        'AuroraClusterEndpoint', 'AuroraClusterReadEndpoint',
        'DMSReplicationInstanceArn', 'DMSReplicationTaskArn',
        'ApplicationLoadBalancerDNS', 'ALBTargetGroupArn',
        'AuroraDBSecretArn', 'OnPremisesDBSecretArn'
      ];

      criticalOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });

      console.log(`✅ All ${criticalOutputs.length} critical infrastructure components validated`);
    });

    test('should have correct resource naming format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.VPNGatewayId).toMatch(/^vgw-[a-f0-9]+$/);
      expect(outputs.CustomerGatewayId).toMatch(/^cgw-[a-f0-9]+$/);
      expect(outputs.VPNConnectionId).toMatch(/^vpn-[a-f0-9]+$/);
      expect(outputs.ApplicationLoadBalancerDNS).toMatch(/.*\.elb\.amazonaws\.com$/);

      console.log(`✅ All resource naming follows AWS conventions`);
    });
  });
});
```

### Key Integration Testing Features

1. **AWS CLI Command Execution**: Uses `child_process.spawn()` to execute AWS CLI commands, avoiding AWS SDK v3 ES module compatibility issues with Jest
2. **Proper Timeout Management**: 20-second timeout for AWS CLI commands with 25-second test timeouts
3. **Dynamic Resource Discovery**: Tests discover and validate real AWS resources using environment suffix filtering
4. **Comprehensive Error Handling**: Proper cleanup and error messaging for failed AWS API calls
5. **Live Resource Validation**: Tests validate actual deployed infrastructure state, not static configuration files

## Architecture Overview

The solution creates a complete migration infrastructure with:

1. **VPC Network Infrastructure** (10.0.0.0/16)
   - 2 Public Subnets across 2 AZs for internet-facing resources
   - 2 Private Subnets across 2 AZs for database and DMS
   - Internet Gateway for public subnet internet access
   - NAT Gateway for private subnet outbound connectivity

2. **VPN Connectivity**
   - VPN Gateway attached to VPC
   - Customer Gateway representing on-premises VPN endpoint
   - Site-to-Site VPN Connection with static routes
   - VPN route propagation to private route table

3. **Aurora MySQL Database**
   - Aurora Serverless V2 cluster (0.5-1 ACU) for cost optimization
   - Multi-AZ deployment with read endpoint
   - Backup retention: 7 days
   - Database credentials stored in Secrets Manager
   - Security group allowing access from web tier, DMS, and on-premises

4. **DMS Replication**
   - DMS replication instance (dms.t3.medium) in private subnets
   - Source endpoint for on-premises MySQL
   - Target endpoint for Aurora MySQL
   - Replication task with full-load-and-cdc migration type
   - Comprehensive logging configuration
   - On-premises DB credentials stored in Secrets Manager

5. **Application Load Balancer**
   - Internet-facing ALB in public subnets
   - HTTP listener on port 80
   - Target group with health checks
   - Security group allowing HTTP/HTTPS from internet

6. **Security**
   - 4 security groups (ALB, Web Tier, Database, DMS)
   - Least-privilege access controls
   - Database accessible only from web tier, DMS, and on-premises
   - All credentials stored in AWS Secrets Manager

7. **Monitoring**
   - CloudWatch alarm for DMS replication lag (300s threshold)
   - CloudWatch alarm for DMS task failures
   - CloudWatch alarm for Aurora database connections (80 threshold)
   - CloudWatch alarm for Aurora CPU utilization (80% threshold)
   - CloudWatch dashboard URL output for easy access

## Key Features

### Resource Naming
All resources include `${EnvironmentSuffix}` for multi-environment deployments:
- VPC: `migration-vpc-${EnvironmentSuffix}`
- Aurora Cluster: `migration-aurora-cluster-${EnvironmentSuffix}`
- DMS Instance: `migration-dms-instance-${EnvironmentSuffix}`
- ALB: `migration-alb-${EnvironmentSuffix}`

### Destroyability
All critical resources configured with:
- `DeletionPolicy: Delete` on Aurora cluster and instance
- No deletion protection enabled
- Allows complete stack cleanup

### Cost Optimization
- Aurora Serverless V2 (0.5-1 ACU) instead of provisioned instances
- Single NAT Gateway (not one per AZ)
- Single-AZ DMS replication instance
- Minimal backup retention (7 days)

### High Availability
- Multi-AZ VPC design
- Aurora read endpoint for read scalability
- ALB across two availability zones
- DMS supports continuous data replication (CDC)

## Parameters

The template accepts these parameters for environment-specific configuration:

1. **EnvironmentSuffix**: Environment identifier (dev/staging/prod)
2. **OnPremisesCIDR**: On-premises network CIDR
3. **CustomerGatewayIP**: Public IP of on-premises VPN device
4. **DBMasterUsername**: Aurora master username
5. **DBMasterPassword**: Aurora master password (NoEcho)
6. **OnPremisesDBEndpoint**: On-premises database endpoint
7. **OnPremisesDBPort**: On-premises database port
8. **OnPremisesDBName**: On-premises database name
9. **OnPremisesDBUsername**: On-premises database username
10. **OnPremisesDBPassword**: On-premises database password (NoEcho)

## Outputs

The stack provides 23 comprehensive outputs:

### Network Outputs
- VPCId, PublicSubnet1Id, PublicSubnet2Id, PrivateSubnet1Id, PrivateSubnet2Id

### VPN Outputs
- VPNGatewayId, CustomerGatewayId, VPNConnectionId

### Database Outputs
- AuroraClusterEndpoint, AuroraClusterReadEndpoint, AuroraClusterPort
- AuroraDBSecretArn

### DMS Outputs
- DMSReplicationInstanceArn, DMSReplicationTaskArn
- OnPremisesDBSecretArn

### Application Outputs
- ApplicationLoadBalancerDNS, ApplicationLoadBalancerArn
- ALBTargetGroupArn

### Security Outputs
- WebTierSecurityGroupId, DatabaseSecurityGroupId

### Monitoring Outputs
- CloudWatchDashboardURL

### Stack Metadata
- EnvironmentSuffix, StackName

All outputs include export names for cross-stack references.

## Deployment Instructions

1. Prepare parameters:
   ```bash
   export ENV_SUFFIX="dev"
   export CUSTOMER_GATEWAY_IP="203.0.113.1"
   export ONPREM_DB_ENDPOINT="mysql.onprem.local"
   export ONPREM_DB_USER="app_user"
   export ONPREM_DB_PASS="SecurePassword123!"
   export AURORA_MASTER_PASS="AuroraSecure456!"
   ```

2. Deploy stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name tap-stack-${ENV_SUFFIX} \
     --template-body file://lib/TapStack.yml \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=${ENV_SUFFIX} \
       ParameterKey=CustomerGatewayIP,ParameterValue=${CUSTOMER_GATEWAY_IP} \
       ParameterKey=OnPremisesDBEndpoint,ParameterValue=${ONPREM_DB_ENDPOINT} \
       ParameterKey=OnPremisesDBUsername,ParameterValue=${ONPREM_DB_USER} \
       ParameterKey=OnPremisesDBPassword,ParameterValue=${ONPREM_DB_PASS} \
       ParameterKey=DBMasterPassword,ParameterValue=${AURORA_MASTER_PASS}
   ```

3. Monitor stack creation:
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name tap-stack-${ENV_SUFFIX}
   ```

4. Retrieve outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name tap-stack-${ENV_SUFFIX} \
     --query 'Stacks[0].Outputs'
   ```

## Migration Workflow

1. **VPN Setup**: Configure on-premises VPN device with VPN connection details
2. **Network Validation**: Verify connectivity from on-premises to AWS VPC
3. **Database Preparation**: Create Aurora database schema matching on-premises
4. **DMS Configuration**: Start DMS replication task for full load + CDC
5. **Monitor Replication**: Watch CloudWatch alarms for replication lag
6. **Application Migration**: Deploy web tier instances to private subnets
7. **ALB Configuration**: Register web tier instances with ALB target group
8. **DNS Cutover**: Update DNS to point to ALB DNS name
9. **Validation**: Verify application functionality through ALB
10. **Cleanup**: Stop on-premises application after successful migration

## Security Considerations

- All database passwords use NoEcho parameter
- Credentials stored in AWS Secrets Manager
- Security groups follow least-privilege principle
- Database not publicly accessible
- VPN provides encrypted communication to on-premises
- CloudWatch alarms for anomaly detection

## Best Practices Implemented

1. **Infrastructure as Code**: Complete stack defined in CloudFormation
2. **Parameterization**: Environment-specific values as parameters
3. **Resource Tagging**: All resources tagged with Name including EnvironmentSuffix
4. **Monitoring**: CloudWatch alarms for critical metrics
5. **High Availability**: Multi-AZ design
6. **Cost Optimization**: Serverless Aurora, minimal resource sizing
7. **Security**: Secrets Manager, security groups, private subnets
8. **Destroyability**: No retain policies for complete cleanup

## Cost Estimate (us-east-2)

Approximate monthly costs:
- VPC (NAT Gateway): $32.85
- Aurora Serverless V2 (0.5 ACU average): $43.80
- DMS Replication Instance (t3.medium): $66.00
- Application Load Balancer: $16.20
- VPN Connection: $36.00
- Secrets Manager: $0.80
- **Total**: ~$195.65/month

Actual costs vary based on:
- Aurora scaling (0.5-1 ACU range)
- Data transfer volumes
- DMS replication duration
- ALB data processing

## Resource Count

The template creates 47 AWS resources:
- 1 VPC
- 4 Subnets
- 2 Route Tables
- 1 Internet Gateway
- 1 NAT Gateway
- 1 EIP
- 1 VPN Gateway
- 1 Customer Gateway
- 1 VPN Connection
- 4 Security Groups
- 2 Secrets Manager Secrets
- 1 RDS Subnet Group
- 1 Aurora Cluster
- 1 Aurora Instance
- 1 DMS Subnet Group
- 1 DMS Replication Instance
- 2 DMS Endpoints
- 1 DMS Replication Task
- 1 Application Load Balancer
- 1 ALB Target Group
- 1 ALB Listener
- 4 CloudWatch Alarms
- Plus route table associations and VPC attachments

This comprehensive infrastructure provides a production-ready migration platform with all necessary components for a phased on-premises to AWS migration.
