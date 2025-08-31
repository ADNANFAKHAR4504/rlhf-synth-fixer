package imports.aws.route53_recoverycontrolconfig_safety_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoverycontrolconfigSafetyRule.Route53RecoverycontrolconfigSafetyRuleConfig")
@software.amazon.jsii.Jsii.Proxy(Route53RecoverycontrolconfigSafetyRuleConfig.Jsii$Proxy.class)
public interface Route53RecoverycontrolconfigSafetyRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#control_panel_arn Route53RecoverycontrolconfigSafetyRule#control_panel_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getControlPanelArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#name Route53RecoverycontrolconfigSafetyRule#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * rule_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#rule_config Route53RecoverycontrolconfigSafetyRule#rule_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig getRuleConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#wait_period_ms Route53RecoverycontrolconfigSafetyRule#wait_period_ms}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWaitPeriodMs();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#asserted_controls Route53RecoverycontrolconfigSafetyRule#asserted_controls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAssertedControls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#gating_controls Route53RecoverycontrolconfigSafetyRule#gating_controls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGatingControls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#id Route53RecoverycontrolconfigSafetyRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#target_controls Route53RecoverycontrolconfigSafetyRule#target_controls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetControls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecoverycontrolconfigSafetyRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecoverycontrolconfigSafetyRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecoverycontrolconfigSafetyRuleConfig> {
        java.lang.String controlPanelArn;
        java.lang.String name;
        imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig ruleConfig;
        java.lang.Number waitPeriodMs;
        java.util.List<java.lang.String> assertedControls;
        java.util.List<java.lang.String> gatingControls;
        java.lang.String id;
        java.util.List<java.lang.String> targetControls;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getControlPanelArn}
         * @param controlPanelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#control_panel_arn Route53RecoverycontrolconfigSafetyRule#control_panel_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder controlPanelArn(java.lang.String controlPanelArn) {
            this.controlPanelArn = controlPanelArn;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#name Route53RecoverycontrolconfigSafetyRule#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getRuleConfig}
         * @param ruleConfig rule_config block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#rule_config Route53RecoverycontrolconfigSafetyRule#rule_config}
         * @return {@code this}
         */
        public Builder ruleConfig(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig ruleConfig) {
            this.ruleConfig = ruleConfig;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getWaitPeriodMs}
         * @param waitPeriodMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#wait_period_ms Route53RecoverycontrolconfigSafetyRule#wait_period_ms}. This parameter is required.
         * @return {@code this}
         */
        public Builder waitPeriodMs(java.lang.Number waitPeriodMs) {
            this.waitPeriodMs = waitPeriodMs;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getAssertedControls}
         * @param assertedControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#asserted_controls Route53RecoverycontrolconfigSafetyRule#asserted_controls}.
         * @return {@code this}
         */
        public Builder assertedControls(java.util.List<java.lang.String> assertedControls) {
            this.assertedControls = assertedControls;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getGatingControls}
         * @param gatingControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#gating_controls Route53RecoverycontrolconfigSafetyRule#gating_controls}.
         * @return {@code this}
         */
        public Builder gatingControls(java.util.List<java.lang.String> gatingControls) {
            this.gatingControls = gatingControls;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#id Route53RecoverycontrolconfigSafetyRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getTargetControls}
         * @param targetControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53recoverycontrolconfig_safety_rule#target_controls Route53RecoverycontrolconfigSafetyRule#target_controls}.
         * @return {@code this}
         */
        public Builder targetControls(java.util.List<java.lang.String> targetControls) {
            this.targetControls = targetControls;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecoverycontrolconfigSafetyRuleConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecoverycontrolconfigSafetyRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecoverycontrolconfigSafetyRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecoverycontrolconfigSafetyRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecoverycontrolconfigSafetyRuleConfig {
        private final java.lang.String controlPanelArn;
        private final java.lang.String name;
        private final imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig ruleConfig;
        private final java.lang.Number waitPeriodMs;
        private final java.util.List<java.lang.String> assertedControls;
        private final java.util.List<java.lang.String> gatingControls;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> targetControls;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.controlPanelArn = software.amazon.jsii.Kernel.get(this, "controlPanelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleConfig = software.amazon.jsii.Kernel.get(this, "ruleConfig", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig.class));
            this.waitPeriodMs = software.amazon.jsii.Kernel.get(this, "waitPeriodMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.assertedControls = software.amazon.jsii.Kernel.get(this, "assertedControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.gatingControls = software.amazon.jsii.Kernel.get(this, "gatingControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetControls = software.amazon.jsii.Kernel.get(this, "targetControls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.controlPanelArn = java.util.Objects.requireNonNull(builder.controlPanelArn, "controlPanelArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.ruleConfig = java.util.Objects.requireNonNull(builder.ruleConfig, "ruleConfig is required");
            this.waitPeriodMs = java.util.Objects.requireNonNull(builder.waitPeriodMs, "waitPeriodMs is required");
            this.assertedControls = builder.assertedControls;
            this.gatingControls = builder.gatingControls;
            this.id = builder.id;
            this.targetControls = builder.targetControls;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getControlPanelArn() {
            return this.controlPanelArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig getRuleConfig() {
            return this.ruleConfig;
        }

        @Override
        public final java.lang.Number getWaitPeriodMs() {
            return this.waitPeriodMs;
        }

        @Override
        public final java.util.List<java.lang.String> getAssertedControls() {
            return this.assertedControls;
        }

        @Override
        public final java.util.List<java.lang.String> getGatingControls() {
            return this.gatingControls;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetControls() {
            return this.targetControls;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("controlPanelArn", om.valueToTree(this.getControlPanelArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("ruleConfig", om.valueToTree(this.getRuleConfig()));
            data.set("waitPeriodMs", om.valueToTree(this.getWaitPeriodMs()));
            if (this.getAssertedControls() != null) {
                data.set("assertedControls", om.valueToTree(this.getAssertedControls()));
            }
            if (this.getGatingControls() != null) {
                data.set("gatingControls", om.valueToTree(this.getGatingControls()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTargetControls() != null) {
                data.set("targetControls", om.valueToTree(this.getTargetControls()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecoverycontrolconfigSafetyRule.Route53RecoverycontrolconfigSafetyRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecoverycontrolconfigSafetyRuleConfig.Jsii$Proxy that = (Route53RecoverycontrolconfigSafetyRuleConfig.Jsii$Proxy) o;

            if (!controlPanelArn.equals(that.controlPanelArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!ruleConfig.equals(that.ruleConfig)) return false;
            if (!waitPeriodMs.equals(that.waitPeriodMs)) return false;
            if (this.assertedControls != null ? !this.assertedControls.equals(that.assertedControls) : that.assertedControls != null) return false;
            if (this.gatingControls != null ? !this.gatingControls.equals(that.gatingControls) : that.gatingControls != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.targetControls != null ? !this.targetControls.equals(that.targetControls) : that.targetControls != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.controlPanelArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.ruleConfig.hashCode());
            result = 31 * result + (this.waitPeriodMs.hashCode());
            result = 31 * result + (this.assertedControls != null ? this.assertedControls.hashCode() : 0);
            result = 31 * result + (this.gatingControls != null ? this.gatingControls.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.targetControls != null ? this.targetControls.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
