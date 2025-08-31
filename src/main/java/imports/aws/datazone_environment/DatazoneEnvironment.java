package imports.aws.datazone_environment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment aws_datazone_environment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.956Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneEnvironment.DatazoneEnvironment")
public class DatazoneEnvironment extends com.hashicorp.cdktf.TerraformResource {

    protected DatazoneEnvironment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatazoneEnvironment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.datazone_environment.DatazoneEnvironment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment aws_datazone_environment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DatazoneEnvironment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DatazoneEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatazoneEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing DatazoneEnvironment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DatazoneEnvironment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datazone_environment.DatazoneEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DatazoneEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatazoneEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing DatazoneEnvironment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datazone_environment.DatazoneEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.datazone_environment.DatazoneEnvironmentUserParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.datazone_environment.DatazoneEnvironmentUserParameters> __cast_cd4240 = (java.util.List<imports.aws.datazone_environment.DatazoneEnvironmentUserParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.datazone_environment.DatazoneEnvironmentUserParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUserParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccountIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetAccountIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccountRegion() {
        software.amazon.jsii.Kernel.call(this, "resetAccountRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlueprintIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetBlueprintIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlossaryTerms() {
        software.amazon.jsii.Kernel.call(this, "resetGlossaryTerms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserParameters() {
        software.amazon.jsii.Kernel.call(this, "resetUserParameters", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedBy() {
        return software.amazon.jsii.Kernel.get(this, "createdBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentLastDeploymentList getLastDeployment() {
        return software.amazon.jsii.Kernel.get(this, "lastDeployment", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentLastDeploymentList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProviderEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "providerEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentProvisionedResourcesList getProvisionedResources() {
        return software.amazon.jsii.Kernel.get(this, "provisionedResources", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentProvisionedResourcesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentUserParametersList getUserParameters() {
        return software.amazon.jsii.Kernel.get(this, "userParameters", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentUserParametersList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "accountRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBlueprintIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "blueprintIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "domainIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlossaryTermsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "glossaryTermsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "profileIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProjectIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "projectIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "userParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "accountIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountIdentifier", java.util.Objects.requireNonNull(value, "accountIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountRegion() {
        return software.amazon.jsii.Kernel.get(this, "accountRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountRegion", java.util.Objects.requireNonNull(value, "accountRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBlueprintIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "blueprintIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBlueprintIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "blueprintIdentifier", java.util.Objects.requireNonNull(value, "blueprintIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "domainIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainIdentifier", java.util.Objects.requireNonNull(value, "domainIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGlossaryTerms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "glossaryTerms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGlossaryTerms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "glossaryTerms", java.util.Objects.requireNonNull(value, "glossaryTerms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfileIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "profileIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfileIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profileIdentifier", java.util.Objects.requireNonNull(value, "profileIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProjectIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "projectIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProjectIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "projectIdentifier", java.util.Objects.requireNonNull(value, "projectIdentifier is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.datazone_environment.DatazoneEnvironment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.datazone_environment.DatazoneEnvironment> {
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
        private final imports.aws.datazone_environment.DatazoneEnvironmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.datazone_environment.DatazoneEnvironmentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#domain_identifier DatazoneEnvironment#domain_identifier}.
         * <p>
         * @return {@code this}
         * @param domainIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#domain_identifier DatazoneEnvironment#domain_identifier}. This parameter is required.
         */
        public Builder domainIdentifier(final java.lang.String domainIdentifier) {
            this.config.domainIdentifier(domainIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#name DatazoneEnvironment#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#name DatazoneEnvironment#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#profile_identifier DatazoneEnvironment#profile_identifier}.
         * <p>
         * @return {@code this}
         * @param profileIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#profile_identifier DatazoneEnvironment#profile_identifier}. This parameter is required.
         */
        public Builder profileIdentifier(final java.lang.String profileIdentifier) {
            this.config.profileIdentifier(profileIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#project_identifier DatazoneEnvironment#project_identifier}.
         * <p>
         * @return {@code this}
         * @param projectIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#project_identifier DatazoneEnvironment#project_identifier}. This parameter is required.
         */
        public Builder projectIdentifier(final java.lang.String projectIdentifier) {
            this.config.projectIdentifier(projectIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_identifier DatazoneEnvironment#account_identifier}.
         * <p>
         * @return {@code this}
         * @param accountIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_identifier DatazoneEnvironment#account_identifier}. This parameter is required.
         */
        public Builder accountIdentifier(final java.lang.String accountIdentifier) {
            this.config.accountIdentifier(accountIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_region DatazoneEnvironment#account_region}.
         * <p>
         * @return {@code this}
         * @param accountRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#account_region DatazoneEnvironment#account_region}. This parameter is required.
         */
        public Builder accountRegion(final java.lang.String accountRegion) {
            this.config.accountRegion(accountRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#blueprint_identifier DatazoneEnvironment#blueprint_identifier}.
         * <p>
         * @return {@code this}
         * @param blueprintIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#blueprint_identifier DatazoneEnvironment#blueprint_identifier}. This parameter is required.
         */
        public Builder blueprintIdentifier(final java.lang.String blueprintIdentifier) {
            this.config.blueprintIdentifier(blueprintIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#description DatazoneEnvironment#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#description DatazoneEnvironment#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#glossary_terms DatazoneEnvironment#glossary_terms}.
         * <p>
         * @return {@code this}
         * @param glossaryTerms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#glossary_terms DatazoneEnvironment#glossary_terms}. This parameter is required.
         */
        public Builder glossaryTerms(final java.util.List<java.lang.String> glossaryTerms) {
            this.config.glossaryTerms(glossaryTerms);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#timeouts DatazoneEnvironment#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.datazone_environment.DatazoneEnvironmentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * user_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#user_parameters DatazoneEnvironment#user_parameters}
         * <p>
         * @return {@code this}
         * @param userParameters user_parameters block. This parameter is required.
         */
        public Builder userParameters(final com.hashicorp.cdktf.IResolvable userParameters) {
            this.config.userParameters(userParameters);
            return this;
        }
        /**
         * user_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment#user_parameters DatazoneEnvironment#user_parameters}
         * <p>
         * @return {@code this}
         * @param userParameters user_parameters block. This parameter is required.
         */
        public Builder userParameters(final java.util.List<? extends imports.aws.datazone_environment.DatazoneEnvironmentUserParameters> userParameters) {
            this.config.userParameters(userParameters);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.datazone_environment.DatazoneEnvironment}.
         */
        @Override
        public imports.aws.datazone_environment.DatazoneEnvironment build() {
            return new imports.aws.datazone_environment.DatazoneEnvironment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
