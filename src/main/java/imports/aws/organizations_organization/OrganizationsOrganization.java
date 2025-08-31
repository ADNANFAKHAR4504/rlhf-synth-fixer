package imports.aws.organizations_organization;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization aws_organizations_organization}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.047Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.organizationsOrganization.OrganizationsOrganization")
public class OrganizationsOrganization extends com.hashicorp.cdktf.TerraformResource {

    protected OrganizationsOrganization(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OrganizationsOrganization(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.organizations_organization.OrganizationsOrganization.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization aws_organizations_organization} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public OrganizationsOrganization(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.organizations_organization.OrganizationsOrganizationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization aws_organizations_organization} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public OrganizationsOrganization(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a OrganizationsOrganization resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OrganizationsOrganization to import. This parameter is required.
     * @param importFromId The id of the existing OrganizationsOrganization that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OrganizationsOrganization to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.organizations_organization.OrganizationsOrganization.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OrganizationsOrganization resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OrganizationsOrganization to import. This parameter is required.
     * @param importFromId The id of the existing OrganizationsOrganization that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.organizations_organization.OrganizationsOrganization.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAwsServiceAccessPrincipals() {
        software.amazon.jsii.Kernel.call(this, "resetAwsServiceAccessPrincipals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabledPolicyTypes() {
        software.amazon.jsii.Kernel.call(this, "resetEnabledPolicyTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFeatureSet() {
        software.amazon.jsii.Kernel.call(this, "resetFeatureSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.organizations_organization.OrganizationsOrganizationAccountsList getAccounts() {
        return software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.forClass(imports.aws.organizations_organization.OrganizationsOrganizationAccountsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterAccountArn() {
        return software.amazon.jsii.Kernel.get(this, "masterAccountArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterAccountEmail() {
        return software.amazon.jsii.Kernel.get(this, "masterAccountEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterAccountId() {
        return software.amazon.jsii.Kernel.get(this, "masterAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterAccountName() {
        return software.amazon.jsii.Kernel.get(this, "masterAccountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.organizations_organization.OrganizationsOrganizationNonMasterAccountsList getNonMasterAccounts() {
        return software.amazon.jsii.Kernel.get(this, "nonMasterAccounts", software.amazon.jsii.NativeType.forClass(imports.aws.organizations_organization.OrganizationsOrganizationNonMasterAccountsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.organizations_organization.OrganizationsOrganizationRootsList getRoots() {
        return software.amazon.jsii.Kernel.get(this, "roots", software.amazon.jsii.NativeType.forClass(imports.aws.organizations_organization.OrganizationsOrganizationRootsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAwsServiceAccessPrincipalsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "awsServiceAccessPrincipalsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledPolicyTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enabledPolicyTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFeatureSetInput() {
        return software.amazon.jsii.Kernel.get(this, "featureSetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAwsServiceAccessPrincipals() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "awsServiceAccessPrincipals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAwsServiceAccessPrincipals(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "awsServiceAccessPrincipals", java.util.Objects.requireNonNull(value, "awsServiceAccessPrincipals is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledPolicyTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enabledPolicyTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnabledPolicyTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enabledPolicyTypes", java.util.Objects.requireNonNull(value, "enabledPolicyTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFeatureSet() {
        return software.amazon.jsii.Kernel.get(this, "featureSet", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFeatureSet(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "featureSet", java.util.Objects.requireNonNull(value, "featureSet is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.organizations_organization.OrganizationsOrganization}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.organizations_organization.OrganizationsOrganization> {
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
        private imports.aws.organizations_organization.OrganizationsOrganizationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#aws_service_access_principals OrganizationsOrganization#aws_service_access_principals}.
         * <p>
         * @return {@code this}
         * @param awsServiceAccessPrincipals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#aws_service_access_principals OrganizationsOrganization#aws_service_access_principals}. This parameter is required.
         */
        public Builder awsServiceAccessPrincipals(final java.util.List<java.lang.String> awsServiceAccessPrincipals) {
            this.config().awsServiceAccessPrincipals(awsServiceAccessPrincipals);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#enabled_policy_types OrganizationsOrganization#enabled_policy_types}.
         * <p>
         * @return {@code this}
         * @param enabledPolicyTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#enabled_policy_types OrganizationsOrganization#enabled_policy_types}. This parameter is required.
         */
        public Builder enabledPolicyTypes(final java.util.List<java.lang.String> enabledPolicyTypes) {
            this.config().enabledPolicyTypes(enabledPolicyTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#feature_set OrganizationsOrganization#feature_set}.
         * <p>
         * @return {@code this}
         * @param featureSet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#feature_set OrganizationsOrganization#feature_set}. This parameter is required.
         */
        public Builder featureSet(final java.lang.String featureSet) {
            this.config().featureSet(featureSet);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#id OrganizationsOrganization#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_organization#id OrganizationsOrganization#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.organizations_organization.OrganizationsOrganization}.
         */
        @Override
        public imports.aws.organizations_organization.OrganizationsOrganization build() {
            return new imports.aws.organizations_organization.OrganizationsOrganization(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.organizations_organization.OrganizationsOrganizationConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.organizations_organization.OrganizationsOrganizationConfig.Builder();
            }
            return this.config;
        }
    }
}
