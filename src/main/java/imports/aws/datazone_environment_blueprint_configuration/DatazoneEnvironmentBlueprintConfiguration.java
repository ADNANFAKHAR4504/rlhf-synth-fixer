package imports.aws.datazone_environment_blueprint_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration aws_datazone_environment_blueprint_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.957Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneEnvironmentBlueprintConfiguration.DatazoneEnvironmentBlueprintConfiguration")
public class DatazoneEnvironmentBlueprintConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected DatazoneEnvironmentBlueprintConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatazoneEnvironmentBlueprintConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration aws_datazone_environment_blueprint_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DatazoneEnvironmentBlueprintConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DatazoneEnvironmentBlueprintConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatazoneEnvironmentBlueprintConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing DatazoneEnvironmentBlueprintConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DatazoneEnvironmentBlueprintConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DatazoneEnvironmentBlueprintConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatazoneEnvironmentBlueprintConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing DatazoneEnvironmentBlueprintConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetManageAccessRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetManageAccessRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisioningRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetProvisioningRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionalParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRegionalParameters", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainIdInput() {
        return software.amazon.jsii.Kernel.get(this, "domainIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledRegionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentBlueprintIdInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentBlueprintIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManageAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "manageAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProvisioningRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "provisioningRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegionalParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "regionalParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainId() {
        return software.amazon.jsii.Kernel.get(this, "domainId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainId", java.util.Objects.requireNonNull(value, "domainId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledRegions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledRegions", java.util.Objects.requireNonNull(value, "enabledRegions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentBlueprintId() {
        return software.amazon.jsii.Kernel.get(this, "environmentBlueprintId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnvironmentBlueprintId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "environmentBlueprintId", java.util.Objects.requireNonNull(value, "environmentBlueprintId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManageAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "manageAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManageAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "manageAccessRoleArn", java.util.Objects.requireNonNull(value, "manageAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProvisioningRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "provisioningRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProvisioningRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "provisioningRoleArn", java.util.Objects.requireNonNull(value, "provisioningRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRegionalParameters() {
        return software.amazon.jsii.Kernel.get(this, "regionalParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRegionalParameters(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "regionalParameters", java.util.Objects.requireNonNull(value, "regionalParameters is required"));
    }

    public void setRegionalParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.util.Map<java.lang.String, java.lang.String>> value) {
        software.amazon.jsii.Kernel.set(this, "regionalParameters", java.util.Objects.requireNonNull(value, "regionalParameters is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration> {
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
        private final imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#domain_id DatazoneEnvironmentBlueprintConfiguration#domain_id}.
         * <p>
         * @return {@code this}
         * @param domainId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#domain_id DatazoneEnvironmentBlueprintConfiguration#domain_id}. This parameter is required.
         */
        public Builder domainId(final java.lang.String domainId) {
            this.config.domainId(domainId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#enabled_regions DatazoneEnvironmentBlueprintConfiguration#enabled_regions}.
         * <p>
         * @return {@code this}
         * @param enabledRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#enabled_regions DatazoneEnvironmentBlueprintConfiguration#enabled_regions}. This parameter is required.
         */
        public Builder enabledRegions(final java.util.List<java.lang.String> enabledRegions) {
            this.config.enabledRegions(enabledRegions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#environment_blueprint_id DatazoneEnvironmentBlueprintConfiguration#environment_blueprint_id}.
         * <p>
         * @return {@code this}
         * @param environmentBlueprintId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#environment_blueprint_id DatazoneEnvironmentBlueprintConfiguration#environment_blueprint_id}. This parameter is required.
         */
        public Builder environmentBlueprintId(final java.lang.String environmentBlueprintId) {
            this.config.environmentBlueprintId(environmentBlueprintId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#manage_access_role_arn DatazoneEnvironmentBlueprintConfiguration#manage_access_role_arn}.
         * <p>
         * @return {@code this}
         * @param manageAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#manage_access_role_arn DatazoneEnvironmentBlueprintConfiguration#manage_access_role_arn}. This parameter is required.
         */
        public Builder manageAccessRoleArn(final java.lang.String manageAccessRoleArn) {
            this.config.manageAccessRoleArn(manageAccessRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#provisioning_role_arn DatazoneEnvironmentBlueprintConfiguration#provisioning_role_arn}.
         * <p>
         * @return {@code this}
         * @param provisioningRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#provisioning_role_arn DatazoneEnvironmentBlueprintConfiguration#provisioning_role_arn}. This parameter is required.
         */
        public Builder provisioningRoleArn(final java.lang.String provisioningRoleArn) {
            this.config.provisioningRoleArn(provisioningRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}.
         * <p>
         * @return {@code this}
         * @param regionalParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}. This parameter is required.
         */
        public Builder regionalParameters(final com.hashicorp.cdktf.IResolvable regionalParameters) {
            this.config.regionalParameters(regionalParameters);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}.
         * <p>
         * @return {@code this}
         * @param regionalParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}. This parameter is required.
         */
        public Builder regionalParameters(final java.util.Map<java.lang.String, ? extends java.util.Map<java.lang.String, java.lang.String>> regionalParameters) {
            this.config.regionalParameters(regionalParameters);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration}.
         */
        @Override
        public imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration build() {
            return new imports.aws.datazone_environment_blueprint_configuration.DatazoneEnvironmentBlueprintConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
