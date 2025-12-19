import * as fs from 'fs';

export interface StackDifference {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export class StackComparator {
  /**
   * Compare two CloudFormation templates and identify differences
   */
  static compareTemplates(
    template1Path: string,
    template2Path: string
  ): StackDifference[] {
    const template1 = JSON.parse(fs.readFileSync(template1Path, 'utf-8'));
    const template2 = JSON.parse(fs.readFileSync(template2Path, 'utf-8'));

    const differences: StackDifference[] = [];

    // Compare Resources
    differences.push(
      ...this.compareResources(
        template1.Resources || {},
        template2.Resources || {}
      )
    );

    // Compare Outputs
    differences.push(
      ...this.compareOutputs(template1.Outputs || {}, template2.Outputs || {})
    );

    // Compare Parameters
    differences.push(
      ...this.compareParameters(
        template1.Parameters || {},
        template2.Parameters || {}
      )
    );

    return differences;
  }

  private static compareResources(
    resources1: Record<string, any>,
    resources2: Record<string, any>
  ): StackDifference[] {
    const differences: StackDifference[] = [];
    const allResourceIds = new Set([
      ...Object.keys(resources1),
      ...Object.keys(resources2),
    ]);

    for (const resourceId of allResourceIds) {
      const resource1 = resources1[resourceId];
      const resource2 = resources2[resourceId];

      if (!resource1) {
        differences.push({
          type: 'added',
          path: `Resources.${resourceId}`,
          newValue: resource2,
          description: `Resource ${resourceId} (${resource2.Type}) was added`,
        });
      } else if (!resource2) {
        differences.push({
          type: 'removed',
          path: `Resources.${resourceId}`,
          oldValue: resource1,
          description: `Resource ${resourceId} (${resource1.Type}) was removed`,
        });
      } else {
        // Resource exists in both, check for property differences
        const propDiffs = this.compareObjects(
          resource1.Properties || {},
          resource2.Properties || {},
          `Resources.${resourceId}.Properties`
        );
        differences.push(...propDiffs);
      }
    }

    return differences;
  }

  private static compareOutputs(
    outputs1: Record<string, any>,
    outputs2: Record<string, any>
  ): StackDifference[] {
    return this.compareObjects(outputs1, outputs2, 'Outputs');
  }

  private static compareParameters(
    params1: Record<string, any>,
    params2: Record<string, any>
  ): StackDifference[] {
    return this.compareObjects(params1, params2, 'Parameters');
  }

  private static compareObjects(
    obj1: Record<string, any>,
    obj2: Record<string, any>,
    basePath: string
  ): StackDifference[] {
    const differences: StackDifference[] = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      const value1 = obj1[key];
      const value2 = obj2[key];
      const currentPath = `${basePath}.${key}`;

      if (value1 === undefined) {
        differences.push({
          type: 'added',
          path: currentPath,
          newValue: value2,
          description: `Property ${currentPath} was added`,
        });
      } else if (value2 === undefined) {
        differences.push({
          type: 'removed',
          path: currentPath,
          oldValue: value1,
          description: `Property ${currentPath} was removed`,
        });
      } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push({
          type: 'modified',
          path: currentPath,
          oldValue: value1,
          newValue: value2,
          description: `Property ${currentPath} was modified`,
        });
      }
    }

    return differences;
  }

  /**
   * Generate a human-readable report of differences
   */
  static generateReport(differences: StackDifference[]): string {
    if (differences.length === 0) {
      return 'No differences found between stacks';
    }

    let report = 'Stack Comparison Report\n';
    report += `Found ${differences.length} difference(s)\n\n`;

    const byType = {
      added: differences.filter(d => d.type === 'added'),
      removed: differences.filter(d => d.type === 'removed'),
      modified: differences.filter(d => d.type === 'modified'),
    };

    if (byType.added.length > 0) {
      report += `Added (${byType.added.length}):\n`;
      for (const diff of byType.added) {
        report += `  + ${diff.path}\n`;
      }
      report += '\n';
    }

    if (byType.removed.length > 0) {
      report += `Removed (${byType.removed.length}):\n`;
      for (const diff of byType.removed) {
        report += `  - ${diff.path}\n`;
      }
      report += '\n';
    }

    if (byType.modified.length > 0) {
      report += `Modified (${byType.modified.length}):\n`;
      for (const diff of byType.modified) {
        report += `  ~ ${diff.path}\n`;
      }
      report += '\n';
    }

    return report;
  }
}
