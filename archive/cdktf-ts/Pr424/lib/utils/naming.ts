export class NamingConvention {
  constructor(
    private environment: string,
    private project: string = 'cdktf-infra',
    private region?: string
  ) {}

  resource(type: string, name: string): string {
    // For global resources like IAM roles, include region to avoid conflicts
    const globalResources = ['role', 'policy', 'profile'];
    if (this.region && globalResources.includes(type)) {
      const regionSuffix = this.region.replace('-', '');
      return `${this.project}-${this.environment}-${regionSuffix}-${type}-${name}`;
    }
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
