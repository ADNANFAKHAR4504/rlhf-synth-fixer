package imports.aws.route53_recoverycontrolconfig_safety_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule aws_route53recoverycontrolconfig_safety_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoverycontrolconfigSafetyRule.Route53RecoverycontrolconfigSafetyRule")
public class Route53RecoverycontrolconfigSafetyRule extends com.hashicorp.cdktf.TerraformResource {

    protected Route53RecoverycontrolconfigSafetyRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecoverycontrolconfigSafetyRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule aws_route53recoverycontrolconfig_safety_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Route53RecoverycontrolconfigSafetyRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Route53RecoverycontrolconfigSafetyRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53RecoverycontrolconfigSafetyRule to import. This parameter is required.
     * @param importFromId The id of the existing Route53RecoverycontrolconfigSafetyRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Route53RecoverycontrolconfigSafetyRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Route53RecoverycontrolconfigSafetyRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53RecoverycontrolconfigSafetyRule to import. This parameter is required.
     * @param importFromId The id of the existing Route53RecoverycontrolconfigSafetyRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putRuleConfig(final @org.jetbrains.annotations.NotNull imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRuleConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssertedControls() {
        software.amazon.jsii.Kernel.call(this, "resetAssertedControls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatingControls() {
        software.amazon.jsii.Kernel.call(this, "resetGatingControls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetControls() {
        software.amazon.jsii.Kernel.call(this, "resetTargetControls", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference getRuleConfig() {
        return software.amazon.jsii.Kernel.get(this, "ruleConfig", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAssertedControlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "assertedControlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getControlPanelArnInput() {
        return software.amazon.jsii.Kernel.get(this, "controlPanelArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGatingControlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "gatingControlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig getRuleConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetControlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "targetControlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitPeriodMsInput() {
        return software.amazon.jsii.Kernel.get(this, "waitPeriodMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAssertedControls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "assertedControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAssertedControls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "assertedControls", java.util.Objects.requireNonNull(value, "assertedControls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getControlPanelArn() {
        return software.amazon.jsii.Kernel.get(this, "controlPanelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setControlPanelArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "controlPanelArn", java.util.Objects.requireNonNull(value, "controlPanelArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGatingControls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "gatingControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGatingControls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "gatingControls", java.util.Objects.requireNonNull(value, "gatingControls is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetControls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "targetControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTargetControls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "targetControls", java.util.Objects.requireNonNull(value, "targetControls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitPeriodMs() {
        return software.amazon.jsii.Kernel.get(this, "waitPeriodMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitPeriodMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitPeriodMs", java.util.Objects.requireNonNull(value, "waitPeriodMs is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule> {
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
        private final imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#control_panel_arn Route53RecoverycontrolconfigSafetyRule#control_panel_arn}.
         * <p>
         * @return {@code this}
         * @param controlPanelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#control_panel_arn Route53RecoverycontrolconfigSafetyRule#control_panel_arn}. This parameter is required.
         */
        public Builder controlPanelArn(final java.lang.String controlPanelArn) {
            this.config.controlPanelArn(controlPanelArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#name Route53RecoverycontrolconfigSafetyRule#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#name Route53RecoverycontrolconfigSafetyRule#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * rule_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#rule_config Route53RecoverycontrolconfigSafetyRule#rule_config}
         * <p>
         * @return {@code this}
         * @param ruleConfig rule_config block. This parameter is required.
         */
        public Builder ruleConfig(final imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig ruleConfig) {
            this.config.ruleConfig(ruleConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#wait_period_ms Route53RecoverycontrolconfigSafetyRule#wait_period_ms}.
         * <p>
         * @return {@code this}
         * @param waitPeriodMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#wait_period_ms Route53RecoverycontrolconfigSafetyRule#wait_period_ms}. This parameter is required.
         */
        public Builder waitPeriodMs(final java.lang.Number waitPeriodMs) {
            this.config.waitPeriodMs(waitPeriodMs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#asserted_controls Route53RecoverycontrolconfigSafetyRule#asserted_controls}.
         * <p>
         * @return {@code this}
         * @param assertedControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#asserted_controls Route53RecoverycontrolconfigSafetyRule#asserted_controls}. This parameter is required.
         */
        public Builder assertedControls(final java.util.List<java.lang.String> assertedControls) {
            this.config.assertedControls(assertedControls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#gating_controls Route53RecoverycontrolconfigSafetyRule#gating_controls}.
         * <p>
         * @return {@code this}
         * @param gatingControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#gating_controls Route53RecoverycontrolconfigSafetyRule#gating_controls}. This parameter is required.
         */
        public Builder gatingControls(final java.util.List<java.lang.String> gatingControls) {
            this.config.gatingControls(gatingControls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#id Route53RecoverycontrolconfigSafetyRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#id Route53RecoverycontrolconfigSafetyRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#target_controls Route53RecoverycontrolconfigSafetyRule#target_controls}.
         * <p>
         * @return {@code this}
         * @param targetControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#target_controls Route53RecoverycontrolconfigSafetyRule#target_controls}. This parameter is required.
         */
        public Builder targetControls(final java.util.List<java.lang.String> targetControls) {
            this.config.targetControls(targetControls);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule}.
         */
        @Override
        public imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule build() {
            return new imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
