package imports.aws.config_organization_custom_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule aws_config_organization_custom_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.378Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configOrganizationCustomRule.ConfigOrganizationCustomRule")
public class ConfigOrganizationCustomRule extends com.hashicorp.cdktf.TerraformResource {

    protected ConfigOrganizationCustomRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigOrganizationCustomRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule aws_config_organization_custom_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ConfigOrganizationCustomRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ConfigOrganizationCustomRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ConfigOrganizationCustomRule to import. This parameter is required.
     * @param importFromId The id of the existing ConfigOrganizationCustomRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ConfigOrganizationCustomRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ConfigOrganizationCustomRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ConfigOrganizationCustomRule to import. This parameter is required.
     * @param importFromId The id of the existing ConfigOrganizationCustomRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludedAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetExcludedAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputParameters() {
        software.amazon.jsii.Kernel.call(this, "resetInputParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumExecutionFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumExecutionFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceIdScope() {
        software.amazon.jsii.Kernel.call(this, "resetResourceIdScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTypesScope() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTypesScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagKeyScope() {
        software.amazon.jsii.Kernel.call(this, "resetTagKeyScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagValueScope() {
        software.amazon.jsii.Kernel.call(this, "resetTagValueScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludedAccountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "inputParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaFunctionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaximumExecutionFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceIdScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypesScopeInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceTypesScopeInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagKeyScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "tagKeyScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagValueScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "tagValueScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTriggerTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "triggerTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludedAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludedAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludedAccounts", java.util.Objects.requireNonNull(value, "excludedAccounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputParameters() {
        return software.amazon.jsii.Kernel.get(this, "inputParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputParameters(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputParameters", java.util.Objects.requireNonNull(value, "inputParameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaFunctionArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaFunctionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaFunctionArn", java.util.Objects.requireNonNull(value, "lambdaFunctionArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaximumExecutionFrequency() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaximumExecutionFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maximumExecutionFrequency", java.util.Objects.requireNonNull(value, "maximumExecutionFrequency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceIdScope() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceIdScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceIdScope", java.util.Objects.requireNonNull(value, "resourceIdScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceTypesScope() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resourceTypesScope", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceTypesScope(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTypesScope", java.util.Objects.requireNonNull(value, "resourceTypesScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagKeyScope() {
        return software.amazon.jsii.Kernel.get(this, "tagKeyScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagKeyScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagKeyScope", java.util.Objects.requireNonNull(value, "tagKeyScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagValueScope() {
        return software.amazon.jsii.Kernel.get(this, "tagValueScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagValueScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagValueScope", java.util.Objects.requireNonNull(value, "tagValueScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTriggerTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "triggerTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTriggerTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "triggerTypes", java.util.Objects.requireNonNull(value, "triggerTypes is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule> {
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
        private final imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#lambda_function_arn ConfigOrganizationCustomRule#lambda_function_arn}.
         * <p>
         * @return {@code this}
         * @param lambdaFunctionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#lambda_function_arn ConfigOrganizationCustomRule#lambda_function_arn}. This parameter is required.
         */
        public Builder lambdaFunctionArn(final java.lang.String lambdaFunctionArn) {
            this.config.lambdaFunctionArn(lambdaFunctionArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#name ConfigOrganizationCustomRule#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#name ConfigOrganizationCustomRule#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#trigger_types ConfigOrganizationCustomRule#trigger_types}.
         * <p>
         * @return {@code this}
         * @param triggerTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#trigger_types ConfigOrganizationCustomRule#trigger_types}. This parameter is required.
         */
        public Builder triggerTypes(final java.util.List<java.lang.String> triggerTypes) {
            this.config.triggerTypes(triggerTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#description ConfigOrganizationCustomRule#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#description ConfigOrganizationCustomRule#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#excluded_accounts ConfigOrganizationCustomRule#excluded_accounts}.
         * <p>
         * @return {@code this}
         * @param excludedAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#excluded_accounts ConfigOrganizationCustomRule#excluded_accounts}. This parameter is required.
         */
        public Builder excludedAccounts(final java.util.List<java.lang.String> excludedAccounts) {
            this.config.excludedAccounts(excludedAccounts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#id ConfigOrganizationCustomRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#id ConfigOrganizationCustomRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#input_parameters ConfigOrganizationCustomRule#input_parameters}.
         * <p>
         * @return {@code this}
         * @param inputParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#input_parameters ConfigOrganizationCustomRule#input_parameters}. This parameter is required.
         */
        public Builder inputParameters(final java.lang.String inputParameters) {
            this.config.inputParameters(inputParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#maximum_execution_frequency ConfigOrganizationCustomRule#maximum_execution_frequency}.
         * <p>
         * @return {@code this}
         * @param maximumExecutionFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#maximum_execution_frequency ConfigOrganizationCustomRule#maximum_execution_frequency}. This parameter is required.
         */
        public Builder maximumExecutionFrequency(final java.lang.String maximumExecutionFrequency) {
            this.config.maximumExecutionFrequency(maximumExecutionFrequency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#resource_id_scope ConfigOrganizationCustomRule#resource_id_scope}.
         * <p>
         * @return {@code this}
         * @param resourceIdScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#resource_id_scope ConfigOrganizationCustomRule#resource_id_scope}. This parameter is required.
         */
        public Builder resourceIdScope(final java.lang.String resourceIdScope) {
            this.config.resourceIdScope(resourceIdScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#resource_types_scope ConfigOrganizationCustomRule#resource_types_scope}.
         * <p>
         * @return {@code this}
         * @param resourceTypesScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#resource_types_scope ConfigOrganizationCustomRule#resource_types_scope}. This parameter is required.
         */
        public Builder resourceTypesScope(final java.util.List<java.lang.String> resourceTypesScope) {
            this.config.resourceTypesScope(resourceTypesScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#tag_key_scope ConfigOrganizationCustomRule#tag_key_scope}.
         * <p>
         * @return {@code this}
         * @param tagKeyScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#tag_key_scope ConfigOrganizationCustomRule#tag_key_scope}. This parameter is required.
         */
        public Builder tagKeyScope(final java.lang.String tagKeyScope) {
            this.config.tagKeyScope(tagKeyScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#tag_value_scope ConfigOrganizationCustomRule#tag_value_scope}.
         * <p>
         * @return {@code this}
         * @param tagValueScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#tag_value_scope ConfigOrganizationCustomRule#tag_value_scope}. This parameter is required.
         */
        public Builder tagValueScope(final java.lang.String tagValueScope) {
            this.config.tagValueScope(tagValueScope);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_organization_custom_rule#timeouts ConfigOrganizationCustomRule#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRuleTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule}.
         */
        @Override
        public imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule build() {
            return new imports.aws.config_organization_custom_rule.ConfigOrganizationCustomRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
