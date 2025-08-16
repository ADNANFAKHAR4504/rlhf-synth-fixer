/**
 * Configuration interface for multi-region stack deployment
 * Defines the structure for region-specific and global configurations
 */
export interface StackConfig {
  /** AWS region for deployment */
  region: string;

  /** Environment name (e.g., production, staging) */
  environment: string;

  /** VPC CIDR block for the region */
  vpcCidr: string;

  /** Database configuration */
  database: {
    instanceClass: string;
    engine: string;
    engineVersion: string;
    allocatedStorage: number;
    multiAz: boolean;
    backupRetention: number;
    deletionProtection: boolean;
    storageEncrypted: boolean;
    performanceInsights: boolean;
  };

  /** EC2 Auto Scaling configuration */
  autoScaling: {
    instanceType: string;
    minCapacity: number;
    maxCapacity: number;
    desiredCapacity: number;
    healthCheckGracePeriod: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
  };

  /** Load Balancer configuration */
  loadBalancer: {
    healthCheckPath: string;
    healthCheckInterval: number;
    healthCheckTimeout: number;
    healthyThresholdCount: number;
    unhealthyThresholdCount: number;
  };

  /** Monitoring configuration */
  monitoring: {
    logRetentionDays: number;
    alarmThresholds: {
      cpuUtilization: number;
      memoryUtilization: number;
      diskUtilization: number;
      alb5xxErrorRate: number;
      rdsCpuUtilization: number;
      rdsFreeStorageSpace: number;
    };
  };

  /** Security configuration */
  security: {
    allowSSHAccess: boolean;
    sshAllowedCidrs: string[];
    enableVpcFlowLogs: boolean;
    enableDetailedMonitoring: boolean;
  };

  /** Common tags applied to all resources */
  tags: { [key: string]: string };
}

/**
 * Default configurations for different regions
 */
export const REGION_CONFIGS: { [region: string]: StackConfig } = {
  'us-east-1': {
    region: 'us-east-1',
    environment: 'Production',
    vpcCidr: '10.0.0.0/16',
    database: {
      instanceClass: 'db.t3.micro',
      engine: 'mysql',
      engineVersion: '8.0.37',
      allocatedStorage: 20,
      multiAz: true,
      backupRetention: 7,
      deletionProtection: true,
      storageEncrypted: true,
      performanceInsights: false,
    },
    autoScaling: {
      instanceType: 't3.micro',
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      healthCheckGracePeriod: 300,
      scaleUpThreshold: 70,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300,
      scaleDownCooldown: 300,
    },
    loadBalancer: {
      healthCheckPath: '/',
      healthCheckInterval: 30,
      healthCheckTimeout: 5,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    },
    monitoring: {
      logRetentionDays: 7,
      alarmThresholds: {
        cpuUtilization: 80,
        memoryUtilization: 85,
        diskUtilization: 90,
        alb5xxErrorRate: 5,
        rdsCpuUtilization: 80,
        rdsFreeStorageSpace: 1000000000, // 1 GB in bytes
      },
    },
    security: {
      allowSSHAccess: true,
      sshAllowedCidrs: ['0.0.0.0/0'], // In production, restrict to specific IPs
      enableVpcFlowLogs: true,
      enableDetailedMonitoring: true,
    },
    tags: {
      Environment: 'Production',
      Project: 'MultiRegionApp',
      Owner: 'Prakhar-Jain',
      Region: 'us-east-1',
    },
  },
  'us-west-2': {
    region: 'us-west-2',
    environment: 'Production',
    vpcCidr: '10.1.0.0/16',
    database: {
      instanceClass: 'db.t3.micro',
      engine: 'mysql',
      engineVersion: '8.0.37',
      allocatedStorage: 20,
      multiAz: true,
      backupRetention: 7,
      deletionProtection: true,
      storageEncrypted: true,
      performanceInsights: false,
    },
    autoScaling: {
      instanceType: 't3.micro',
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      healthCheckGracePeriod: 300,
      scaleUpThreshold: 70,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300,
      scaleDownCooldown: 300,
    },
    loadBalancer: {
      healthCheckPath: '/',
      healthCheckInterval: 30,
      healthCheckTimeout: 5,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    },
    monitoring: {
      logRetentionDays: 7,
      alarmThresholds: {
        cpuUtilization: 80,
        memoryUtilization: 85,
        diskUtilization: 90,
        alb5xxErrorRate: 5,
        rdsCpuUtilization: 80,
        rdsFreeStorageSpace: 1000000000, // 1 GB in bytes
      },
    },
    security: {
      allowSSHAccess: true,
      sshAllowedCidrs: ['0.0.0.0/0'], // In production, restrict to specific IPs
      enableVpcFlowLogs: true,
      enableDetailedMonitoring: true,
    },
    tags: {
      Environment: 'Production',
      Project: 'MultiRegionApp',
      Owner: 'Prakhar-Jain',
      Region: 'us-west-2',
    },
  },
};
