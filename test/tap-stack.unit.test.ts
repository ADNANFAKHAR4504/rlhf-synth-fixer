// Jest unit tests for TapStack CloudFormation template (focused only on actual resources)
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

type CFNTemplate = {
    AWSTemplateFormatVersion?: string;
    Description?: string;
    Metadata?: Record<string, unknown>;
    Parameters?: Record<string, any>;
    Resources?: Record<string, any>;
    Outputs?: Record<string, any>;
};

// Minimal set of YAML tags used by our templates
function makeType(tag: string, kind: 'scalar' | 'sequence' | 'mapping', key: string) {
    return new (yaml as any).Type(tag, {
        kind,
        construct: (data: any) => ({ [key]: data }),
    });
}

const GetAttTypeScalar = new (yaml as any).Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAtt': String(data).split('.') }),
});

const schema = (yaml as any).DEFAULT_SCHEMA.extend([
    makeType('!Ref', 'scalar', 'Ref'),
    makeType('!Sub', 'scalar', 'Fn::Sub'),
    GetAttTypeScalar,
]);

function safeRead(p: string) {
    return fs.readFileSync(p, 'utf8');
}

function loadYamlTemplate(relPath: string): CFNTemplate {
    const p = path.resolve(__dirname, relPath);
    const raw = safeRead(p);
    const doc = yaml.load(raw, { schema }) as CFNTemplate;
    expect(typeof doc).toBe('object');
    return doc;
}

function res(tpl: CFNTemplate, logicalId: string) {
    const r = tpl.Resources?.[logicalId];
    expect(r).toBeDefined();
    return r;
}

describe('TapStack CloudFormation (unit tests - focused)', () => {
    const yamlTpl = loadYamlTemplate('../templates/cfn-yaml/lib/TapStack.yml');

    test('Template has basic structure and description', () => {
        expect(yamlTpl.AWSTemplateFormatVersion).toBeDefined();
        expect(yamlTpl.Description).toMatch(/TAP Stack/i);
        expect(yamlTpl.Resources).toBeDefined();
    });

    test('DynamoDB TurnAroundPromptTable exists with correct type', () => {
        const table = res(yamlTpl, 'TurnAroundPromptTable');
        expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table has expected properties: TableName, AttributeDefinitions, KeySchema, BillingMode', () => {
        const table = res(yamlTpl, 'TurnAroundPromptTable');
        const props = table.Properties || {};
        expect(props.TableName).toBeDefined();
        // TableName should include EnvironmentSuffix via Fn::Sub or similar
        const tn = JSON.stringify(props.TableName);
        expect(tn).toMatch(/EnvironmentSuffix|\$\{|TurnAroundPromptTable/);

        // AttributeDefinitions contains 'id' of type S
        const attrs = props.AttributeDefinitions || [];
        expect(Array.isArray(attrs)).toBe(true);
        const idAttr = attrs.find((a: any) => a.AttributeName === 'id');
        expect(idAttr).toBeDefined();
        expect(idAttr.AttributeType).toBe('S');

        // KeySchema contains HASH key on id
        const ks = props.KeySchema || [];
        const idKey = ks.find((k: any) => k.AttributeName === 'id' && k.KeyType === 'HASH');
        expect(idKey).toBeDefined();

        expect(props.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('Outputs export table name, ARN, StackName and EnvironmentSuffix', () => {
        const O = yamlTpl.Outputs || {};
        expect(O.TurnAroundPromptTableName).toBeDefined();
        expect(O.TurnAroundPromptTableArn).toBeDefined();
        expect(O.StackName).toBeDefined();
        expect(O.EnvironmentSuffix).toBeDefined();
    });

    test('Parameters include EnvironmentSuffix with reasonable defaults and constraints', () => {
        const P = yamlTpl.Parameters || {};
        expect(P.EnvironmentSuffix).toBeDefined();
        expect(P.EnvironmentSuffix.Default).toBeDefined();
        expect(typeof P.EnvironmentSuffix.Default).toBe('string');
        // AllowedPattern is stored as a string in the CFN YAML; compare exact pattern string
        expect(P.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
});
