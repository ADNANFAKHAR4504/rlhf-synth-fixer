import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';
import { FailoverStack } from './failover-stack';
import { Route53Stack } from './route53-stack';
import { ParameterStoreStack } from './parameter-store-stack';
import { EventBridgeStack } from './eventbridge-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix
    const environmentSuffix =
      props?.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Determine region with priority: props.env.region > AWS_REGION env var > AWS_REGION file > default
    let region = 'us-east-1'; // Default region

    // Check if region is provided in props
    if (props?.env?.region) {
      region = props.env.region;
    } else if (process.env.AWS_REGION) {
      // Fall back to AWS_REGION environment variable
      region = process.env.AWS_REGION;
    } else {
      // Try to read from lib/AWS_REGION file
      try {
        const regionFile = path.join(__dirname, 'AWS_REGION');
        if (fs.existsSync(regionFile)) {
          const fileContent = fs.readFileSync(regionFile, 'utf8').trim();
          if (fileContent) {
            region = fileContent;
          }
        }
      } catch (error) {
        // If file reading fails, use default region
      }
    }

    // ===========================
    // SINGLE REGION (us-east-1)
    // ===========================

    // Network Stack
    const networkStack = new NetworkStack(this, 'Network', {
      environmentSuffix,
      region,
    });

    // Database Stack
    new DatabaseStack(this, 'Database', {
      environmentSuffix,
      region,
      vpc: networkStack.vpc,
      databaseSecurityGroup: networkStack.databaseSecurityGroup,
      isPrimary: true,
    });

    // Compute Stack
    const computeStack = new ComputeStack(this, 'Compute', {
      environmentSuffix,
      region,
      vpc: networkStack.vpc,
      albSecurityGroup: networkStack.albSecurityGroup,
      ecsSecurityGroup: networkStack.ecsSecurityGroup,
    });

    // Storage Stack
    new StorageStack(this, 'Storage', {
      environmentSuffix,
      region,
      isPrimary: true,
    });

    // Backup Stack
    new BackupStack(this, 'Backup', {
      environmentSuffix,
      region,
      isPrimary: true,
    });

    // Monitoring Stack
    new MonitoringStack(this, 'Monitoring', {
      environmentSuffix,
      region,
      endpointUrl: `http://${computeStack.loadBalancer.loadBalancerDnsName}`,
    });

    // Route 53 Stack (Simple DNS without failover)
    new Route53Stack(this, 'Route53', {
      environmentSuffix,
      primaryLoadBalancer: computeStack.loadBalancer,
      primaryRegion: region,
    });

    // Failover Stack
    new FailoverStack(this, 'Failover', {
      environmentSuffix,
      region,
      isPrimary: true,
    });

    // Parameter Store Stack
    new ParameterStoreStack(this, 'ParameterStore', {
      environmentSuffix,
      region,
      isPrimary: true,
    });

    // EventBridge Stack
    new EventBridgeStack(this, 'EventBridge', {
      environmentSuffix,
      region,
      isPrimary: true,
    });

    // Root stack outputs
    new cdk.CfnOutput(this, 'Region', {
      value: region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment Suffix',
    });
  }
}
