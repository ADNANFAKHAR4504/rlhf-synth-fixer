export interface PipelineConfig {
  prefix: string;
  team: string;
  project: string;
  environmentSuffix: string;
  runtime: string;
  buildRuntime: string;
  testCoverageThreshold: number;
  retentionDays: number;
  maxRollbackRetries: number;
  notificationEmail?: string;
}

export function getPipelineConfig(
  team: string,
  project: string,
  environmentSuffix: string,
  notificationEmail?: string
): PipelineConfig {
  return {
    prefix: `${team}-${project}-${environmentSuffix}`,
    team,
    project,
    environmentSuffix,
    runtime: 'nodejs20.x',
    buildRuntime: 'nodejs20.x',
    testCoverageThreshold: 80,
    retentionDays: 30,
    maxRollbackRetries: 3,
    notificationEmail,
  };
}
