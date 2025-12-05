export type ValidationSeverity = 'critical' | 'warning' | 'info';

export interface ValidationFinding {
  severity: ValidationSeverity;
  category: string;
  resource: string;
  message: string;
  remediation: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

export class ValidationRegistry {
  private static findings: ValidationFinding[] = [];

  static addFinding(finding: ValidationFinding): void {
    this.findings.push(finding);
  }

  static getFindings(): ValidationFinding[] {
    return [...this.findings];
  }

  static getFindingsBySeverity(
    severity: ValidationSeverity
  ): ValidationFinding[] {
    return this.findings.filter(f => f.severity === severity);
  }

  static getFindingsByCategory(category: string): ValidationFinding[] {
    return this.findings.filter(f => f.category === category);
  }

  static clear(): void {
    this.findings = [];
  }

  static getSummary(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Record<string, number>;
  } {
    return {
      total: this.findings.length,
      critical: this.findings.filter(f => f.severity === 'critical').length,
      warning: this.findings.filter(f => f.severity === 'warning').length,
      info: this.findings.filter(f => f.severity === 'info').length,
      categories: this.findings.reduce(
        (acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
