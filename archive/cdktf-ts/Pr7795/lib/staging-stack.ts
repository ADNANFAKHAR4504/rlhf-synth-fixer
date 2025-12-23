import { Construct } from 'constructs';
import {
  BaseEnvironmentStack,
  BaseEnvironmentStackProps,
} from './base-environment-stack';

export class StagingStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 2; // Two instances for staging (includes replica from prod)
  }

  protected getEcsCpu(): string {
    return '512'; // 0.5 vCPU
  }

  protected getEcsMemory(): string {
    return '1024'; // 1 GB
  }

  protected getImageTag(): string {
    return 'staging-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 75,
      memoryUtilization: 75,
      targetResponseTime: 1.5,
      unhealthyHostCount: 1,
      databaseConnections: 100,
    };
  }
}
