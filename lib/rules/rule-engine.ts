// eslint-disable-next-line import/no-extraneous-dependencies
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export interface ValidationRule {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  resourceType: string;
  condition: {
    property: string;
    operator:
      | 'equals'
      | 'notEquals'
      | 'exists'
      | 'notExists'
      | 'contains'
      | 'greaterThan'
      | 'lessThan';
    value?: any;
  };
  message: string;
  remediation: string;
}

export interface RuleConfig {
  rules: ValidationRule[];
}

export class RuleEngine {
  private rules: ValidationRule[] = [];

  constructor(configPath?: string) {
    if (configPath && fs.existsSync(configPath)) {
      this.loadRules(configPath);
    }
  }

  loadRules(configPath: string): void {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as RuleConfig;
    this.rules = config.rules || [];
  }

  evaluateRules(
    node: IConstruct,
    resourceType: string,
    properties: Record<string, any>
  ): void {
    const applicableRules = this.rules.filter(
      r => r.resourceType === resourceType
    );

    for (const rule of applicableRules) {
      const startTime = Date.now();
      const result = this.evaluateCondition(rule.condition, properties);

      // For greaterThan/lessThan operators, pass=true means violation found
      // For equals/exists operators, pass=false means violation found
      const isViolation =
        rule.condition.operator === 'greaterThan' ||
        rule.condition.operator === 'lessThan'
          ? result.pass
          : !result.pass;

      if (isViolation) {
        ValidationRegistry.addFinding({
          severity: rule.severity,
          category: rule.category,
          resource: node.node.path,
          message: rule.message,
          remediation: rule.remediation,
          executionTime: Date.now() - startTime,
          metadata: {
            rule: rule.name,
            property: rule.condition.property,
            actualValue: result.actualValue,
          },
        });
      }
    }
  }

  private evaluateCondition(
    condition: ValidationRule['condition'],
    properties: Record<string, any>
  ): { pass: boolean; actualValue: any } {
    const actualValue = this.getPropertyValue(properties, condition.property);

    switch (condition.operator) {
      case 'equals':
        return { pass: actualValue === condition.value, actualValue };
      case 'notEquals':
        return { pass: actualValue !== condition.value, actualValue };
      case 'exists':
        return { pass: actualValue !== undefined, actualValue };
      case 'notExists':
        return { pass: actualValue === undefined, actualValue };
      case 'contains':
        return {
          pass:
            Array.isArray(actualValue) && actualValue.includes(condition.value),
          actualValue,
        };
      case 'greaterThan':
        return {
          pass: Number(actualValue) > Number(condition.value),
          actualValue,
        };
      case 'lessThan':
        return {
          pass: Number(actualValue) < Number(condition.value),
          actualValue,
        };
      default:
        return { pass: true, actualValue };
    }
  }

  private getPropertyValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }
}
