package imports.aws.cloudwatch_composite_alarm;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm aws_cloudwatch_composite_alarm}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarm")
public class CloudwatchCompositeAlarm extends com.hashicorp.cdktf.TerraformResource {

    protected CloudwatchCompositeAlarm(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchCompositeAlarm(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm aws_cloudwatch_composite_alarm} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudwatchCompositeAlarm(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchCompositeAlarm resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchCompositeAlarm to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchCompositeAlarm that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudwatchCompositeAlarm to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchCompositeAlarm resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchCompositeAlarm to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchCompositeAlarm that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putActionsSuppressor(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor value) {
        software.amazon.jsii.Kernel.call(this, "putActionsSuppressor", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActionsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetActionsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetActionsSuppressor() {
        software.amazon.jsii.Kernel.call(this, "resetActionsSuppressor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAlarmActions() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAlarmDescription() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsufficientDataActions() {
        software.amazon.jsii.Kernel.call(this, "resetInsufficientDataActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOkActions() {
        software.amazon.jsii.Kernel.call(this, "resetOkActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressorOutputReference getActionsSuppressor() {
        return software.amazon.jsii.Kernel.get(this, "actionsSuppressor", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressorOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActionsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "actionsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor getActionsSuppressorInput() {
        return software.amazon.jsii.Kernel.get(this, "actionsSuppressorInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarmActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "alarmActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmNameInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsufficientDataActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "insufficientDataActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOkActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "okActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getActionsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "actionsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setActionsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "actionsEnabled", java.util.Objects.requireNonNull(value, "actionsEnabled is required"));
    }

    public void setActionsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "actionsEnabled", java.util.Objects.requireNonNull(value, "actionsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAlarmActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "alarmActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAlarmActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "alarmActions", java.util.Objects.requireNonNull(value, "alarmActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmDescription() {
        return software.amazon.jsii.Kernel.get(this, "alarmDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmDescription", java.util.Objects.requireNonNull(value, "alarmDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmName() {
        return software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmName", java.util.Objects.requireNonNull(value, "alarmName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmRule() {
        return software.amazon.jsii.Kernel.get(this, "alarmRule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmRule(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmRule", java.util.Objects.requireNonNull(value, "alarmRule is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInsufficientDataActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "insufficientDataActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInsufficientDataActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "insufficientDataActions", java.util.Objects.requireNonNull(value, "insufficientDataActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOkActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "okActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOkActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "okActions", java.util.Objects.requireNonNull(value, "okActions is required"));
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
     * A fluent builder for {@link imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm> {
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
        private final imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_name CloudwatchCompositeAlarm#alarm_name}.
         * <p>
         * @return {@code this}
         * @param alarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_name CloudwatchCompositeAlarm#alarm_name}. This parameter is required.
         */
        public Builder alarmName(final java.lang.String alarmName) {
            this.config.alarmName(alarmName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_rule CloudwatchCompositeAlarm#alarm_rule}.
         * <p>
         * @return {@code this}
         * @param alarmRule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_rule CloudwatchCompositeAlarm#alarm_rule}. This parameter is required.
         */
        public Builder alarmRule(final java.lang.String alarmRule) {
            this.config.alarmRule(alarmRule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}.
         * <p>
         * @return {@code this}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}. This parameter is required.
         */
        public Builder actionsEnabled(final java.lang.Boolean actionsEnabled) {
            this.config.actionsEnabled(actionsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}.
         * <p>
         * @return {@code this}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_enabled CloudwatchCompositeAlarm#actions_enabled}. This parameter is required.
         */
        public Builder actionsEnabled(final com.hashicorp.cdktf.IResolvable actionsEnabled) {
            this.config.actionsEnabled(actionsEnabled);
            return this;
        }

        /**
         * actions_suppressor block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#actions_suppressor CloudwatchCompositeAlarm#actions_suppressor}
         * <p>
         * @return {@code this}
         * @param actionsSuppressor actions_suppressor block. This parameter is required.
         */
        public Builder actionsSuppressor(final imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarmActionsSuppressor actionsSuppressor) {
            this.config.actionsSuppressor(actionsSuppressor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_actions CloudwatchCompositeAlarm#alarm_actions}.
         * <p>
         * @return {@code this}
         * @param alarmActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_actions CloudwatchCompositeAlarm#alarm_actions}. This parameter is required.
         */
        public Builder alarmActions(final java.util.List<java.lang.String> alarmActions) {
            this.config.alarmActions(alarmActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_description CloudwatchCompositeAlarm#alarm_description}.
         * <p>
         * @return {@code this}
         * @param alarmDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm_description CloudwatchCompositeAlarm#alarm_description}. This parameter is required.
         */
        public Builder alarmDescription(final java.lang.String alarmDescription) {
            this.config.alarmDescription(alarmDescription);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#id CloudwatchCompositeAlarm#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#id CloudwatchCompositeAlarm#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#insufficient_data_actions CloudwatchCompositeAlarm#insufficient_data_actions}.
         * <p>
         * @return {@code this}
         * @param insufficientDataActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#insufficient_data_actions CloudwatchCompositeAlarm#insufficient_data_actions}. This parameter is required.
         */
        public Builder insufficientDataActions(final java.util.List<java.lang.String> insufficientDataActions) {
            this.config.insufficientDataActions(insufficientDataActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#ok_actions CloudwatchCompositeAlarm#ok_actions}.
         * <p>
         * @return {@code this}
         * @param okActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#ok_actions CloudwatchCompositeAlarm#ok_actions}. This parameter is required.
         */
        public Builder okActions(final java.util.List<java.lang.String> okActions) {
            this.config.okActions(okActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags CloudwatchCompositeAlarm#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags CloudwatchCompositeAlarm#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags_all CloudwatchCompositeAlarm#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#tags_all CloudwatchCompositeAlarm#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm}.
         */
        @Override
        public imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm build() {
            return new imports.aws.cloudwatch_composite_alarm.CloudwatchCompositeAlarm(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
