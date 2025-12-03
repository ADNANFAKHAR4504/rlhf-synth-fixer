import { Construct } from 'constructs';
import {
  BaseEnvironmentStack,
  BaseEnvironmentStackProps,
} from './base-environment-stack';

export class DevStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 1; // Single instance for dev
  }

  protected getEcsCpu(): string {
    return '256'; // 0.25 vCPU
  }

  protected getEcsMemory(): string {
    return '512'; // 0.5 GB
  }

  protected getImageTag(): string {
    return 'dev-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 80,
      memoryUtilization: 80,
      targetResponseTime: 2,
      unhealthyHostCount: 1,
      databaseConnections: 50,
    };
  }
}
