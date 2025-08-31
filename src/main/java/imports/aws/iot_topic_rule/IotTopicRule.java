package imports.aws.iot_topic_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule aws_iot_topic_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.407Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRule")
public class IotTopicRule extends com.hashicorp.cdktf.TerraformResource {

    protected IotTopicRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.iot_topic_rule.IotTopicRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule aws_iot_topic_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public IotTopicRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a IotTopicRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IotTopicRule to import. This parameter is required.
     * @param importFromId The id of the existing IotTopicRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the IotTopicRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iot_topic_rule.IotTopicRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a IotTopicRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IotTopicRule to import. This parameter is required.
     * @param importFromId The id of the existing IotTopicRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iot_topic_rule.IotTopicRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCloudwatchAlarm(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCloudwatchAlarm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudwatchMetric(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCloudwatchMetric", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDynamodb(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodb>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodb> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodb>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleDynamodb __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDynamodb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDynamodbv2(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDynamodbv2", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putElasticsearch(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleElasticsearch>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleElasticsearch> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleElasticsearch>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleElasticsearch __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putElasticsearch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putErrorAction(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorAction value) {
        software.amazon.jsii.Kernel.call(this, "putErrorAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehose(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleFirehose>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleFirehose> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleFirehose>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleFirehose __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttp(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttp>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttp> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleHttp>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleHttp __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHttp", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIotAnalytics(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIotAnalytics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIotEvents(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotEvents>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotEvents> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleIotEvents>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleIotEvents __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIotEvents", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKafka(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKafka>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKafka> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKafka>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleKafka __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKafka", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesis(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKinesis>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKinesis> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleKinesis>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleKinesis __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKinesis", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambda(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleLambda>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleLambda> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleLambda>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleLambda __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambda", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRepublish(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleRepublish>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleRepublish> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleRepublish>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleRepublish __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRepublish", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleS3>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleS3> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleS3>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleS3 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSns> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleSns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSqs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSqs> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleSqs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleSqs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSqs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStepFunctions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleStepFunctions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleStepFunctions> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleStepFunctions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleStepFunctions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStepFunctions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimestream(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_topic_rule.IotTopicRuleTimestream>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_topic_rule.IotTopicRuleTimestream> __cast_cd4240 = (java.util.List<imports.aws.iot_topic_rule.IotTopicRuleTimestream>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_topic_rule.IotTopicRuleTimestream __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTimestream", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchAlarm() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchAlarm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchMetric() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchMetric", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodb() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodbv2() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodbv2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticsearch() {
        software.amazon.jsii.Kernel.call(this, "resetElasticsearch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetErrorAction() {
        software.amazon.jsii.Kernel.call(this, "resetErrorAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttp() {
        software.amazon.jsii.Kernel.call(this, "resetHttp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIotAnalytics() {
        software.amazon.jsii.Kernel.call(this, "resetIotAnalytics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIotEvents() {
        software.amazon.jsii.Kernel.call(this, "resetIotEvents", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKafka() {
        software.amazon.jsii.Kernel.call(this, "resetKafka", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesis() {
        software.amazon.jsii.Kernel.call(this, "resetKinesis", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambda() {
        software.amazon.jsii.Kernel.call(this, "resetLambda", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepublish() {
        software.amazon.jsii.Kernel.call(this, "resetRepublish", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSns() {
        software.amazon.jsii.Kernel.call(this, "resetSns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqs() {
        software.amazon.jsii.Kernel.call(this, "resetSqs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepFunctions() {
        software.amazon.jsii.Kernel.call(this, "resetStepFunctions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestream() {
        software.amazon.jsii.Kernel.call(this, "resetTimestream", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarmList getCloudwatchAlarm() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarm", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarmList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogsList getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetricList getCloudwatchMetric() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetric", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetricList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleDynamodbList getDynamodb() {
        return software.amazon.jsii.Kernel.get(this, "dynamodb", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleDynamodbList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2List getDynamodbv2() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbv2", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleElasticsearchList getElasticsearch() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearch", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleElasticsearchList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionOutputReference getErrorAction() {
        return software.amazon.jsii.Kernel.get(this, "errorAction", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleFirehoseList getFirehose() {
        return software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleFirehoseList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleHttpList getHttp() {
        return software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleHttpList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleIotAnalyticsList getIotAnalytics() {
        return software.amazon.jsii.Kernel.get(this, "iotAnalytics", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleIotAnalyticsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleIotEventsList getIotEvents() {
        return software.amazon.jsii.Kernel.get(this, "iotEvents", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleIotEventsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleKafkaList getKafka() {
        return software.amazon.jsii.Kernel.get(this, "kafka", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleKafkaList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleKinesisList getKinesis() {
        return software.amazon.jsii.Kernel.get(this, "kinesis", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleKinesisList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleLambdaList getLambda() {
        return software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleLambdaList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleRepublishList getRepublish() {
        return software.amazon.jsii.Kernel.get(this, "republish", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleRepublishList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleS3List getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleS3List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleSnsList getSns() {
        return software.amazon.jsii.Kernel.get(this, "sns", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleSnsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleSqsList getSqs() {
        return software.amazon.jsii.Kernel.get(this, "sqs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleSqsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleStepFunctionsList getStepFunctions() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctions", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleStepFunctionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleTimestreamList getTimestream() {
        return software.amazon.jsii.Kernel.get(this, "timestream", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleTimestreamList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchAlarmInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchMetricInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetricInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDynamodbInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDynamodbv2Input() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbv2Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getElasticsearchInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorAction getErrorActionInput() {
        return software.amazon.jsii.Kernel.get(this, "errorActionInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorAction.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHttpInput() {
        return software.amazon.jsii.Kernel.get(this, "httpInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIotAnalyticsInput() {
        return software.amazon.jsii.Kernel.get(this, "iotAnalyticsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIotEventsInput() {
        return software.amazon.jsii.Kernel.get(this, "iotEventsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKafkaInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKinesisInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRepublishInput() {
        return software.amazon.jsii.Kernel.get(this, "republishInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSnsInput() {
        return software.amazon.jsii.Kernel.get(this, "snsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSqlInput() {
        return software.amazon.jsii.Kernel.get(this, "sqlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSqlVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sqlVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSqsInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStepFunctionsInput() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimestreamInput() {
        return software.amazon.jsii.Kernel.get(this, "timestreamInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSql() {
        return software.amazon.jsii.Kernel.get(this, "sql", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSql(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sql", java.util.Objects.requireNonNull(value, "sql is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSqlVersion() {
        return software.amazon.jsii.Kernel.get(this, "sqlVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSqlVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sqlVersion", java.util.Objects.requireNonNull(value, "sqlVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.iot_topic_rule.IotTopicRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.iot_topic_rule.IotTopicRule> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.iot_topic_rule.IotTopicRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.iot_topic_rule.IotTopicRuleConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#name IotTopicRule#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#name IotTopicRule#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql IotTopicRule#sql}.
         * <p>
         * @return {@code this}
         * @param sql Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql IotTopicRule#sql}. This parameter is required.
         */
        public Builder sql(final java.lang.String sql) {
            this.config.sql(sql);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql_version IotTopicRule#sql_version}.
         * <p>
         * @return {@code this}
         * @param sqlVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql_version IotTopicRule#sql_version}. This parameter is required.
         */
        public Builder sqlVersion(final java.lang.String sqlVersion) {
            this.config.sqlVersion(sqlVersion);
            return this;
        }

        /**
         * cloudwatch_alarm block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
         * <p>
         * @return {@code this}
         * @param cloudwatchAlarm cloudwatch_alarm block. This parameter is required.
         */
        public Builder cloudwatchAlarm(final com.hashicorp.cdktf.IResolvable cloudwatchAlarm) {
            this.config.cloudwatchAlarm(cloudwatchAlarm);
            return this;
        }
        /**
         * cloudwatch_alarm block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
         * <p>
         * @return {@code this}
         * @param cloudwatchAlarm cloudwatch_alarm block. This parameter is required.
         */
        public Builder cloudwatchAlarm(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm> cloudwatchAlarm) {
            this.config.cloudwatchAlarm(cloudwatchAlarm);
            return this;
        }

        /**
         * cloudwatch_logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
         * <p>
         * @return {@code this}
         * @param cloudwatchLogs cloudwatch_logs block. This parameter is required.
         */
        public Builder cloudwatchLogs(final com.hashicorp.cdktf.IResolvable cloudwatchLogs) {
            this.config.cloudwatchLogs(cloudwatchLogs);
            return this;
        }
        /**
         * cloudwatch_logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
         * <p>
         * @return {@code this}
         * @param cloudwatchLogs cloudwatch_logs block. This parameter is required.
         */
        public Builder cloudwatchLogs(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs> cloudwatchLogs) {
            this.config.cloudwatchLogs(cloudwatchLogs);
            return this;
        }

        /**
         * cloudwatch_metric block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
         * <p>
         * @return {@code this}
         * @param cloudwatchMetric cloudwatch_metric block. This parameter is required.
         */
        public Builder cloudwatchMetric(final com.hashicorp.cdktf.IResolvable cloudwatchMetric) {
            this.config.cloudwatchMetric(cloudwatchMetric);
            return this;
        }
        /**
         * cloudwatch_metric block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
         * <p>
         * @return {@code this}
         * @param cloudwatchMetric cloudwatch_metric block. This parameter is required.
         */
        public Builder cloudwatchMetric(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric> cloudwatchMetric) {
            this.config.cloudwatchMetric(cloudwatchMetric);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#description IotTopicRule#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#description IotTopicRule#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * dynamodb block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
         * <p>
         * @return {@code this}
         * @param dynamodb dynamodb block. This parameter is required.
         */
        public Builder dynamodb(final com.hashicorp.cdktf.IResolvable dynamodb) {
            this.config.dynamodb(dynamodb);
            return this;
        }
        /**
         * dynamodb block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
         * <p>
         * @return {@code this}
         * @param dynamodb dynamodb block. This parameter is required.
         */
        public Builder dynamodb(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleDynamodb> dynamodb) {
            this.config.dynamodb(dynamodb);
            return this;
        }

        /**
         * dynamodbv2 block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
         * <p>
         * @return {@code this}
         * @param dynamodbv2 dynamodbv2 block. This parameter is required.
         */
        public Builder dynamodbv2(final com.hashicorp.cdktf.IResolvable dynamodbv2) {
            this.config.dynamodbv2(dynamodbv2);
            return this;
        }
        /**
         * dynamodbv2 block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
         * <p>
         * @return {@code this}
         * @param dynamodbv2 dynamodbv2 block. This parameter is required.
         */
        public Builder dynamodbv2(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2> dynamodbv2) {
            this.config.dynamodbv2(dynamodbv2);
            return this;
        }

        /**
         * elasticsearch block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
         * <p>
         * @return {@code this}
         * @param elasticsearch elasticsearch block. This parameter is required.
         */
        public Builder elasticsearch(final com.hashicorp.cdktf.IResolvable elasticsearch) {
            this.config.elasticsearch(elasticsearch);
            return this;
        }
        /**
         * elasticsearch block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
         * <p>
         * @return {@code this}
         * @param elasticsearch elasticsearch block. This parameter is required.
         */
        public Builder elasticsearch(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleElasticsearch> elasticsearch) {
            this.config.elasticsearch(elasticsearch);
            return this;
        }

        /**
         * error_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#error_action IotTopicRule#error_action}
         * <p>
         * @return {@code this}
         * @param errorAction error_action block. This parameter is required.
         */
        public Builder errorAction(final imports.aws.iot_topic_rule.IotTopicRuleErrorAction errorAction) {
            this.config.errorAction(errorAction);
            return this;
        }

        /**
         * firehose block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
         * <p>
         * @return {@code this}
         * @param firehose firehose block. This parameter is required.
         */
        public Builder firehose(final com.hashicorp.cdktf.IResolvable firehose) {
            this.config.firehose(firehose);
            return this;
        }
        /**
         * firehose block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
         * <p>
         * @return {@code this}
         * @param firehose firehose block. This parameter is required.
         */
        public Builder firehose(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleFirehose> firehose) {
            this.config.firehose(firehose);
            return this;
        }

        /**
         * http block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
         * <p>
         * @return {@code this}
         * @param http http block. This parameter is required.
         */
        public Builder http(final com.hashicorp.cdktf.IResolvable http) {
            this.config.http(http);
            return this;
        }
        /**
         * http block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
         * <p>
         * @return {@code this}
         * @param http http block. This parameter is required.
         */
        public Builder http(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleHttp> http) {
            this.config.http(http);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#id IotTopicRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#id IotTopicRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * iot_analytics block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
         * <p>
         * @return {@code this}
         * @param iotAnalytics iot_analytics block. This parameter is required.
         */
        public Builder iotAnalytics(final com.hashicorp.cdktf.IResolvable iotAnalytics) {
            this.config.iotAnalytics(iotAnalytics);
            return this;
        }
        /**
         * iot_analytics block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
         * <p>
         * @return {@code this}
         * @param iotAnalytics iot_analytics block. This parameter is required.
         */
        public Builder iotAnalytics(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics> iotAnalytics) {
            this.config.iotAnalytics(iotAnalytics);
            return this;
        }

        /**
         * iot_events block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
         * <p>
         * @return {@code this}
         * @param iotEvents iot_events block. This parameter is required.
         */
        public Builder iotEvents(final com.hashicorp.cdktf.IResolvable iotEvents) {
            this.config.iotEvents(iotEvents);
            return this;
        }
        /**
         * iot_events block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
         * <p>
         * @return {@code this}
         * @param iotEvents iot_events block. This parameter is required.
         */
        public Builder iotEvents(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleIotEvents> iotEvents) {
            this.config.iotEvents(iotEvents);
            return this;
        }

        /**
         * kafka block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
         * <p>
         * @return {@code this}
         * @param kafka kafka block. This parameter is required.
         */
        public Builder kafka(final com.hashicorp.cdktf.IResolvable kafka) {
            this.config.kafka(kafka);
            return this;
        }
        /**
         * kafka block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
         * <p>
         * @return {@code this}
         * @param kafka kafka block. This parameter is required.
         */
        public Builder kafka(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleKafka> kafka) {
            this.config.kafka(kafka);
            return this;
        }

        /**
         * kinesis block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
         * <p>
         * @return {@code this}
         * @param kinesis kinesis block. This parameter is required.
         */
        public Builder kinesis(final com.hashicorp.cdktf.IResolvable kinesis) {
            this.config.kinesis(kinesis);
            return this;
        }
        /**
         * kinesis block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
         * <p>
         * @return {@code this}
         * @param kinesis kinesis block. This parameter is required.
         */
        public Builder kinesis(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleKinesis> kinesis) {
            this.config.kinesis(kinesis);
            return this;
        }

        /**
         * lambda block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
         * <p>
         * @return {@code this}
         * @param lambda lambda block. This parameter is required.
         */
        public Builder lambda(final com.hashicorp.cdktf.IResolvable lambda) {
            this.config.lambda(lambda);
            return this;
        }
        /**
         * lambda block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
         * <p>
         * @return {@code this}
         * @param lambda lambda block. This parameter is required.
         */
        public Builder lambda(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleLambda> lambda) {
            this.config.lambda(lambda);
            return this;
        }

        /**
         * republish block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
         * <p>
         * @return {@code this}
         * @param republish republish block. This parameter is required.
         */
        public Builder republish(final com.hashicorp.cdktf.IResolvable republish) {
            this.config.republish(republish);
            return this;
        }
        /**
         * republish block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
         * <p>
         * @return {@code this}
         * @param republish republish block. This parameter is required.
         */
        public Builder republish(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleRepublish> republish) {
            this.config.republish(republish);
            return this;
        }

        /**
         * s3 block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
         * <p>
         * @return {@code this}
         * @param s3 s3 block. This parameter is required.
         */
        public Builder s3(final com.hashicorp.cdktf.IResolvable s3) {
            this.config.s3(s3);
            return this;
        }
        /**
         * s3 block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
         * <p>
         * @return {@code this}
         * @param s3 s3 block. This parameter is required.
         */
        public Builder s3(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleS3> s3) {
            this.config.s3(s3);
            return this;
        }

        /**
         * sns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
         * <p>
         * @return {@code this}
         * @param sns sns block. This parameter is required.
         */
        public Builder sns(final com.hashicorp.cdktf.IResolvable sns) {
            this.config.sns(sns);
            return this;
        }
        /**
         * sns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
         * <p>
         * @return {@code this}
         * @param sns sns block. This parameter is required.
         */
        public Builder sns(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleSns> sns) {
            this.config.sns(sns);
            return this;
        }

        /**
         * sqs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
         * <p>
         * @return {@code this}
         * @param sqs sqs block. This parameter is required.
         */
        public Builder sqs(final com.hashicorp.cdktf.IResolvable sqs) {
            this.config.sqs(sqs);
            return this;
        }
        /**
         * sqs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
         * <p>
         * @return {@code this}
         * @param sqs sqs block. This parameter is required.
         */
        public Builder sqs(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleSqs> sqs) {
            this.config.sqs(sqs);
            return this;
        }

        /**
         * step_functions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
         * <p>
         * @return {@code this}
         * @param stepFunctions step_functions block. This parameter is required.
         */
        public Builder stepFunctions(final com.hashicorp.cdktf.IResolvable stepFunctions) {
            this.config.stepFunctions(stepFunctions);
            return this;
        }
        /**
         * step_functions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
         * <p>
         * @return {@code this}
         * @param stepFunctions step_functions block. This parameter is required.
         */
        public Builder stepFunctions(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleStepFunctions> stepFunctions) {
            this.config.stepFunctions(stepFunctions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags IotTopicRule#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags IotTopicRule#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags_all IotTopicRule#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags_all IotTopicRule#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timestream block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
         * <p>
         * @return {@code this}
         * @param timestream timestream block. This parameter is required.
         */
        public Builder timestream(final com.hashicorp.cdktf.IResolvable timestream) {
            this.config.timestream(timestream);
            return this;
        }
        /**
         * timestream block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
         * <p>
         * @return {@code this}
         * @param timestream timestream block. This parameter is required.
         */
        public Builder timestream(final java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleTimestream> timestream) {
            this.config.timestream(timestream);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.iot_topic_rule.IotTopicRule}.
         */
        @Override
        public imports.aws.iot_topic_rule.IotTopicRule build() {
            return new imports.aws.iot_topic_rule.IotTopicRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
