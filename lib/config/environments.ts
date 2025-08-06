export interface NetworkConfig {
  environment: 'dev' | 'staging' | 'prod';
  vpcCidr: string;
  subnets: {
    public: string[];
    private: string[];
    database: string[];
  };
  availabilityZones: string[];
}

export interface ComputeConfig {
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  enableDetailedMonitoring: boolean;
}

export interface DatabaseConfig {
  instanceClass: string;
  allocatedStorage: number;
  maxAllocatedStorage: number;
  backupRetentionPeriod: number;
  multiAz: boolean;
  deletionProtection: boolean;
}

export interface EnvironmentConfig {
  network: NetworkConfig;
  compute: ComputeConfig;
  database: DatabaseConfig;
  tags: Record<string, string>;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    network: {
      environment: 'dev',
      vpcCidr: '10.0.0.0/16',
      subnets: {
        public: ['10.0.1.0/24', '10.0.2.0/24'],
        private: ['10.0.3.0/24', '10.0.4.0/24'],
        database: ['10.0.5.0/24', '10.0.6.0/24'],
      },
      availabilityZones: ['eu-west-1a', 'eu-west-1b'],
    },
    compute: {
      instanceType: 't3.micro',
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      enableDetailedMonitoring: false,
    },
    database: {
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetentionPeriod: 7,
      multiAz: false,
      deletionProtection: false,
    },
    tags: {
      Environment: 'dev',
      Project: 'aws-cdktf-infrastructure',
      Owner: 'DevOps Team',
      CostCenter: 'Development',
    },
  },
  staging: {
    network: {
      environment: 'staging',
      vpcCidr: '10.1.0.0/16',
      subnets: {
        public: ['10.1.1.0/24', '10.1.2.0/24'],
        private: ['10.1.3.0/24', '10.1.4.0/24'],
        database: ['10.1.5.0/24', '10.1.6.0/24'],
      },
      availabilityZones: ['eu-west-1a', 'eu-west-1b'],
    },
    compute: {
      instanceType: 't3.small',
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      enableDetailedMonitoring: true,
    },
    database: {
      instanceClass: 'db.t3.small',
      allocatedStorage: 50,
      maxAllocatedStorage: 200,
      backupRetentionPeriod: 14,
      multiAz: true,
      deletionProtection: true,
    },
    tags: {
      Environment: 'staging',
      Project: 'aws-cdktf-infrastructure',
      Owner: 'DevOps Team',
      CostCenter: 'Staging',
    },
  },
  prod: {
    network: {
      environment: 'prod',
      vpcCidr: '10.2.0.0/16',
      subnets: {
        public: ['10.2.1.0/24', '10.2.2.0/24'],
        private: ['10.2.3.0/24', '10.2.4.0/24'],
        database: ['10.2.5.0/24', '10.2.6.0/24'],
      },
      availabilityZones: ['eu-west-1a', 'eu-west-1b'],
    },
    compute: {
      instanceType: 't3.medium',
      minSize: 3,
      maxSize: 10,
      desiredCapacity: 3,
      enableDetailedMonitoring: true,
    },
    database: {
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      backupRetentionPeriod: 30,
      multiAz: true,
      deletionProtection: true,
    },
    tags: {
      Environment: 'prod',
      Project: 'aws-cdktf-infrastructure',
      Owner: 'DevOps Team',
      CostCenter: 'Production',
    },
  },
};
