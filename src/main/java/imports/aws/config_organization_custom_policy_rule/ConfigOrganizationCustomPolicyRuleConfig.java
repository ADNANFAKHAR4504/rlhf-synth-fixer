package imports.aws.config_organization_custom_policy_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.378Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configOrganizationCustomPolicyRule.ConfigOrganizationCustomPolicyRuleConfig")
@software.amazon.jsii.Jsii.Proxy(ConfigOrganizationCustomPolicyRuleConfig.Jsii$Proxy.class)
public interface ConfigOrganizationCustomPolicyRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#name ConfigOrganizationCustomPolicyRule#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#policy_runtime ConfigOrganizationCustomPolicyRule#policy_runtime}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyRuntime();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#policy_text ConfigOrganizationCustomPolicyRule#policy_text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyText();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#trigger_types ConfigOrganizationCustomPolicyRule#trigger_types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTriggerTypes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#debug_log_delivery_accounts ConfigOrganizationCustomPolicyRule#debug_log_delivery_accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDebugLogDeliveryAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#description ConfigOrganizationCustomPolicyRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#excluded_accounts ConfigOrganizationCustomPolicyRule#excluded_accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#id ConfigOrganizationCustomPolicyRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#input_parameters ConfigOrganizationCustomPolicyRule#input_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#maximum_execution_frequency ConfigOrganizationCustomPolicyRule#maximum_execution_frequency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaximumExecutionFrequency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#resource_id_scope ConfigOrganizationCustomPolicyRule#resource_id_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceIdScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#resource_types_scope ConfigOrganizationCustomPolicyRule#resource_types_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypesScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#tag_key_scope ConfigOrganizationCustomPolicyRule#tag_key_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTagKeyScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#tag_value_scope ConfigOrganizationCustomPolicyRule#tag_value_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTagValueScope() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#timeouts ConfigOrganizationCustomPolicyRule#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigOrganizationCustomPolicyRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigOrganizationCustomPolicyRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigOrganizationCustomPolicyRuleConfig> {
        java.lang.String name;
        java.lang.String policyRuntime;
        java.lang.String policyText;
        java.util.List<java.lang.String> triggerTypes;
        java.util.List<java.lang.String> debugLogDeliveryAccounts;
        java.lang.String description;
        java.util.List<java.lang.String> excludedAccounts;
        java.lang.String id;
        java.lang.String inputParameters;
        java.lang.String maximumExecutionFrequency;
        java.lang.String resourceIdScope;
        java.util.List<java.lang.String> resourceTypesScope;
        java.lang.String tagKeyScope;
        java.lang.String tagValueScope;
        imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#name ConfigOrganizationCustomPolicyRule#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getPolicyRuntime}
         * @param policyRuntime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#policy_runtime ConfigOrganizationCustomPolicyRule#policy_runtime}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyRuntime(java.lang.String policyRuntime) {
            this.policyRuntime = policyRuntime;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getPolicyText}
         * @param policyText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#policy_text ConfigOrganizationCustomPolicyRule#policy_text}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyText(java.lang.String policyText) {
            this.policyText = policyText;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getTriggerTypes}
         * @param triggerTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#trigger_types ConfigOrganizationCustomPolicyRule#trigger_types}. This parameter is required.
         * @return {@code this}
         */
        public Builder triggerTypes(java.util.List<java.lang.String> triggerTypes) {
            this.triggerTypes = triggerTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getDebugLogDeliveryAccounts}
         * @param debugLogDeliveryAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#debug_log_delivery_accounts ConfigOrganizationCustomPolicyRule#debug_log_delivery_accounts}.
         * @return {@code this}
         */
        public Builder debugLogDeliveryAccounts(java.util.List<java.lang.String> debugLogDeliveryAccounts) {
            this.debugLogDeliveryAccounts = debugLogDeliveryAccounts;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#description ConfigOrganizationCustomPolicyRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getExcludedAccounts}
         * @param excludedAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#excluded_accounts ConfigOrganizationCustomPolicyRule#excluded_accounts}.
         * @return {@code this}
         */
        public Builder excludedAccounts(java.util.List<java.lang.String> excludedAccounts) {
            this.excludedAccounts = excludedAccounts;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#id ConfigOrganizationCustomPolicyRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getInputParameters}
         * @param inputParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#input_parameters ConfigOrganizationCustomPolicyRule#input_parameters}.
         * @return {@code this}
         */
        public Builder inputParameters(java.lang.String inputParameters) {
            this.inputParameters = inputParameters;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getMaximumExecutionFrequency}
         * @param maximumExecutionFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#maximum_execution_frequency ConfigOrganizationCustomPolicyRule#maximum_execution_frequency}.
         * @return {@code this}
         */
        public Builder maximumExecutionFrequency(java.lang.String maximumExecutionFrequency) {
            this.maximumExecutionFrequency = maximumExecutionFrequency;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getResourceIdScope}
         * @param resourceIdScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#resource_id_scope ConfigOrganizationCustomPolicyRule#resource_id_scope}.
         * @return {@code this}
         */
        public Builder resourceIdScope(java.lang.String resourceIdScope) {
            this.resourceIdScope = resourceIdScope;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getResourceTypesScope}
         * @param resourceTypesScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#resource_types_scope ConfigOrganizationCustomPolicyRule#resource_types_scope}.
         * @return {@code this}
         */
        public Builder resourceTypesScope(java.util.List<java.lang.String> resourceTypesScope) {
            this.resourceTypesScope = resourceTypesScope;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getTagKeyScope}
         * @param tagKeyScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#tag_key_scope ConfigOrganizationCustomPolicyRule#tag_key_scope}.
         * @return {@code this}
         */
        public Builder tagKeyScope(java.lang.String tagKeyScope) {
            this.tagKeyScope = tagKeyScope;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getTagValueScope}
         * @param tagValueScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#tag_value_scope ConfigOrganizationCustomPolicyRule#tag_value_scope}.
         * @return {@code this}
         */
        public Builder tagValueScope(java.lang.String tagValueScope) {
            this.tagValueScope = tagValueScope;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_policy_rule#timeouts ConfigOrganizationCustomPolicyRule#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getDependsOn}
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
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConfigOrganizationCustomPolicyRuleConfig#getProvisioners}
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
         * @return a new instance of {@link ConfigOrganizationCustomPolicyRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigOrganizationCustomPolicyRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigOrganizationCustomPolicyRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigOrganizationCustomPolicyRuleConfig {
        private final java.lang.String name;
        private final java.lang.String policyRuntime;
        private final java.lang.String policyText;
        private final java.util.List<java.lang.String> triggerTypes;
        private final java.util.List<java.lang.String> debugLogDeliveryAccounts;
        private final java.lang.String description;
        private final java.util.List<java.lang.String> excludedAccounts;
        private final java.lang.String id;
        private final java.lang.String inputParameters;
        private final java.lang.String maximumExecutionFrequency;
        private final java.lang.String resourceIdScope;
        private final java.util.List<java.lang.String> resourceTypesScope;
        private final java.lang.String tagKeyScope;
        private final java.lang.String tagValueScope;
        private final imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts timeouts;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyRuntime = software.amazon.jsii.Kernel.get(this, "policyRuntime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyText = software.amazon.jsii.Kernel.get(this, "policyText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.triggerTypes = software.amazon.jsii.Kernel.get(this, "triggerTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.debugLogDeliveryAccounts = software.amazon.jsii.Kernel.get(this, "debugLogDeliveryAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludedAccounts = software.amazon.jsii.Kernel.get(this, "excludedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputParameters = software.amazon.jsii.Kernel.get(this, "inputParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumExecutionFrequency = software.amazon.jsii.Kernel.get(this, "maximumExecutionFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceIdScope = software.amazon.jsii.Kernel.get(this, "resourceIdScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTypesScope = software.amazon.jsii.Kernel.get(this, "resourceTypesScope", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagKeyScope = software.amazon.jsii.Kernel.get(this, "tagKeyScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagValueScope = software.amazon.jsii.Kernel.get(this, "tagValueScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.policyRuntime = java.util.Objects.requireNonNull(builder.policyRuntime, "policyRuntime is required");
            this.policyText = java.util.Objects.requireNonNull(builder.policyText, "policyText is required");
            this.triggerTypes = java.util.Objects.requireNonNull(builder.triggerTypes, "triggerTypes is required");
            this.debugLogDeliveryAccounts = builder.debugLogDeliveryAccounts;
            this.description = builder.description;
            this.excludedAccounts = builder.excludedAccounts;
            this.id = builder.id;
            this.inputParameters = builder.inputParameters;
            this.maximumExecutionFrequency = builder.maximumExecutionFrequency;
            this.resourceIdScope = builder.resourceIdScope;
            this.resourceTypesScope = builder.resourceTypesScope;
            this.tagKeyScope = builder.tagKeyScope;
            this.tagValueScope = builder.tagValueScope;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPolicyRuntime() {
            return this.policyRuntime;
        }

        @Override
        public final java.lang.String getPolicyText() {
            return this.policyText;
        }

        @Override
        public final java.util.List<java.lang.String> getTriggerTypes() {
            return this.triggerTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getDebugLogDeliveryAccounts() {
            return this.debugLogDeliveryAccounts;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludedAccounts() {
            return this.excludedAccounts;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInputParameters() {
            return this.inputParameters;
        }

        @Override
        public final java.lang.String getMaximumExecutionFrequency() {
            return this.maximumExecutionFrequency;
        }

        @Override
        public final java.lang.String getResourceIdScope() {
            return this.resourceIdScope;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypesScope() {
            return this.resourceTypesScope;
        }

        @Override
        public final java.lang.String getTagKeyScope() {
            return this.tagKeyScope;
        }

        @Override
        public final java.lang.String getTagValueScope() {
            return this.tagValueScope;
        }

        @Override
        public final imports.aws.config_organization_custom_policy_rule.ConfigOrganizationCustomPolicyRuleTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("policyRuntime", om.valueToTree(this.getPolicyRuntime()));
            data.set("policyText", om.valueToTree(this.getPolicyText()));
            data.set("triggerTypes", om.valueToTree(this.getTriggerTypes()));
            if (this.getDebugLogDeliveryAccounts() != null) {
                data.set("debugLogDeliveryAccounts", om.valueToTree(this.getDebugLogDeliveryAccounts()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExcludedAccounts() != null) {
                data.set("excludedAccounts", om.valueToTree(this.getExcludedAccounts()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInputParameters() != null) {
                data.set("inputParameters", om.valueToTree(this.getInputParameters()));
            }
            if (this.getMaximumExecutionFrequency() != null) {
                data.set("maximumExecutionFrequency", om.valueToTree(this.getMaximumExecutionFrequency()));
            }
            if (this.getResourceIdScope() != null) {
                data.set("resourceIdScope", om.valueToTree(this.getResourceIdScope()));
            }
            if (this.getResourceTypesScope() != null) {
                data.set("resourceTypesScope", om.valueToTree(this.getResourceTypesScope()));
            }
            if (this.getTagKeyScope() != null) {
                data.set("tagKeyScope", om.valueToTree(this.getTagKeyScope()));
            }
            if (this.getTagValueScope() != null) {
                data.set("tagValueScope", om.valueToTree(this.getTagValueScope()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.configOrganizationCustomPolicyRule.ConfigOrganizationCustomPolicyRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigOrganizationCustomPolicyRuleConfig.Jsii$Proxy that = (ConfigOrganizationCustomPolicyRuleConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!policyRuntime.equals(that.policyRuntime)) return false;
            if (!policyText.equals(that.policyText)) return false;
            if (!triggerTypes.equals(that.triggerTypes)) return false;
            if (this.debugLogDeliveryAccounts != null ? !this.debugLogDeliveryAccounts.equals(that.debugLogDeliveryAccounts) : that.debugLogDeliveryAccounts != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.excludedAccounts != null ? !this.excludedAccounts.equals(that.excludedAccounts) : that.excludedAccounts != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inputParameters != null ? !this.inputParameters.equals(that.inputParameters) : that.inputParameters != null) return false;
            if (this.maximumExecutionFrequency != null ? !this.maximumExecutionFrequency.equals(that.maximumExecutionFrequency) : that.maximumExecutionFrequency != null) return false;
            if (this.resourceIdScope != null ? !this.resourceIdScope.equals(that.resourceIdScope) : that.resourceIdScope != null) return false;
            if (this.resourceTypesScope != null ? !this.resourceTypesScope.equals(that.resourceTypesScope) : that.resourceTypesScope != null) return false;
            if (this.tagKeyScope != null ? !this.tagKeyScope.equals(that.tagKeyScope) : that.tagKeyScope != null) return false;
            if (this.tagValueScope != null ? !this.tagValueScope.equals(that.tagValueScope) : that.tagValueScope != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.policyRuntime.hashCode());
            result = 31 * result + (this.policyText.hashCode());
            result = 31 * result + (this.triggerTypes.hashCode());
            result = 31 * result + (this.debugLogDeliveryAccounts != null ? this.debugLogDeliveryAccounts.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.excludedAccounts != null ? this.excludedAccounts.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inputParameters != null ? this.inputParameters.hashCode() : 0);
            result = 31 * result + (this.maximumExecutionFrequency != null ? this.maximumExecutionFrequency.hashCode() : 0);
            result = 31 * result + (this.resourceIdScope != null ? this.resourceIdScope.hashCode() : 0);
            result = 31 * result + (this.resourceTypesScope != null ? this.resourceTypesScope.hashCode() : 0);
            result = 31 * result + (this.tagKeyScope != null ? this.tagKeyScope.hashCode() : 0);
            result = 31 * result + (this.tagValueScope != null ? this.tagValueScope.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
