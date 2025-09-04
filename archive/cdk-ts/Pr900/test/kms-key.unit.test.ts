import * as cdk from 'aws-cdk-lib';
import { aws_kms as kms, RemovalPolicy } from 'aws-cdk-lib';
import { DataKmsKey, DataKmsKeyProps } from '../lib/constructs/kms-key';

describe('DataKmsKey', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('creates KMS key with default properties', () => {
    const keyConstruct = new DataKmsKey(stack, 'TestKey');
    expect(keyConstruct.key).toBeInstanceOf(kms.Key);
    expect(keyConstruct.alias).toBeUndefined();
    expect(keyConstruct.description).toBe(
      'CMK for encrypting S3 objects and data keys'
    );
    expect(keyConstruct.removalPolicy).toBe(RemovalPolicy.RETAIN);
    expect(keyConstruct.enableKeyRotation).toBe(true);
  });

  test('creates KMS key with custom alias, description, and removalPolicy', () => {
    const props: DataKmsKeyProps = {
      alias: 'alias/my-key',
      description: 'My custom key',
      removalPolicy: RemovalPolicy.DESTROY,
    };
    const keyConstruct = new DataKmsKey(stack, 'TestKeyCustom', props);
    expect(keyConstruct.alias).toBe('alias/my-key');
    expect(keyConstruct.description).toBe('My custom key');
    expect(keyConstruct.removalPolicy).toBe(RemovalPolicy.DESTROY);
  });

  test('creates KMS key with only custom alias', () => {
    const props: DataKmsKeyProps = {
      alias: 'alias/only-alias',
    };
    const keyConstruct = new DataKmsKey(stack, 'TestKeyAlias', props);
    expect(keyConstruct.alias).toBe('alias/only-alias');
    expect(keyConstruct.description).toBe(
      'CMK for encrypting S3 objects and data keys'
    );
    expect(keyConstruct.removalPolicy).toBe(RemovalPolicy.RETAIN);
  });

  test('creates KMS key with only custom description', () => {
    const props: DataKmsKeyProps = {
      description: 'desc',
    };
    const keyConstruct = new DataKmsKey(stack, 'TestKeyDesc', props);
    expect(keyConstruct.alias).toBeUndefined();
    expect(keyConstruct.description).toBe('desc');
    expect(keyConstruct.removalPolicy).toBe(RemovalPolicy.RETAIN);
  });

  test('creates KMS key with only custom removalPolicy', () => {
    const props: DataKmsKeyProps = {
      removalPolicy: RemovalPolicy.DESTROY,
    };
    const keyConstruct = new DataKmsKey(stack, 'TestKeyRemoval', props);
    expect(keyConstruct.alias).toBeUndefined();
    expect(keyConstruct.description).toBe(
      'CMK for encrypting S3 objects and data keys'
    );
    expect(keyConstruct.removalPolicy).toBe(RemovalPolicy.DESTROY);
    expect(keyConstruct.enableKeyRotation).toBe(true);
  });
});
