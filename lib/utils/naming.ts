export class NamingConvention {
  constructor(
    private environment: string,
    private project: string = 'cdktf-infra'
  ) {}

  resource(type: string, name: string): string {
    return `${this.project}-${this.environment}-${type}-${name}`;
  }

  tag(additionalTags: Record<string, string> = {}): Record<string, string> {
    return {
      Environment: this.environment,
      Project: this.project,
      ManagedBy: 'CDKTF',
      ...additionalTags,
    };
  }
}
