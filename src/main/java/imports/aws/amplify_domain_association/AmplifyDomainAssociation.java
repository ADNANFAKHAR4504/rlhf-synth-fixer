package imports.aws.amplify_domain_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association aws_amplify_domain_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyDomainAssociation.AmplifyDomainAssociation")
public class AmplifyDomainAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected AmplifyDomainAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AmplifyDomainAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.amplify_domain_association.AmplifyDomainAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association aws_amplify_domain_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AmplifyDomainAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.amplify_domain_association.AmplifyDomainAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AmplifyDomainAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyDomainAssociation to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyDomainAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AmplifyDomainAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_domain_association.AmplifyDomainAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AmplifyDomainAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyDomainAssociation to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyDomainAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_domain_association.AmplifyDomainAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCertificateSettings(final @org.jetbrains.annotations.NotNull imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCertificateSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSubDomain(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain> __cast_cd4240 = (java.util.List<imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSubDomain", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificateSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableAutoSubDomain() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAutoSubDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForVerification() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForVerification", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettingsOutputReference getCertificateSettings() {
        return software.amazon.jsii.Kernel.get(this, "certificateSettings", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateVerificationDnsRecord() {
        return software.amazon.jsii.Kernel.get(this, "certificateVerificationDnsRecord", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomainList getSubDomain() {
        return software.amazon.jsii.Kernel.get(this, "subDomain", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomainList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppIdInput() {
        return software.amazon.jsii.Kernel.get(this, "appIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings getCertificateSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoSubDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoSubDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSubDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "subDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitForVerificationInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForVerificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppId() {
        return software.amazon.jsii.Kernel.get(this, "appId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appId", java.util.Objects.requireNonNull(value, "appId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAutoSubDomain() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoSubDomain", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAutoSubDomain(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoSubDomain", java.util.Objects.requireNonNull(value, "enableAutoSubDomain is required"));
    }

    public void setEnableAutoSubDomain(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoSubDomain", java.util.Objects.requireNonNull(value, "enableAutoSubDomain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWaitForVerification() {
        return software.amazon.jsii.Kernel.get(this, "waitForVerification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWaitForVerification(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "waitForVerification", java.util.Objects.requireNonNull(value, "waitForVerification is required"));
    }

    public void setWaitForVerification(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "waitForVerification", java.util.Objects.requireNonNull(value, "waitForVerification is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.amplify_domain_association.AmplifyDomainAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.amplify_domain_association.AmplifyDomainAssociation> {
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
        private final imports.aws.amplify_domain_association.AmplifyDomainAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.amplify_domain_association.AmplifyDomainAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#app_id AmplifyDomainAssociation#app_id}.
         * <p>
         * @return {@code this}
         * @param appId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#app_id AmplifyDomainAssociation#app_id}. This parameter is required.
         */
        public Builder appId(final java.lang.String appId) {
            this.config.appId(appId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#domain_name AmplifyDomainAssociation#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#domain_name AmplifyDomainAssociation#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * sub_domain block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#sub_domain AmplifyDomainAssociation#sub_domain}
         * <p>
         * @return {@code this}
         * @param subDomain sub_domain block. This parameter is required.
         */
        public Builder subDomain(final com.hashicorp.cdktf.IResolvable subDomain) {
            this.config.subDomain(subDomain);
            return this;
        }
        /**
         * sub_domain block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#sub_domain AmplifyDomainAssociation#sub_domain}
         * <p>
         * @return {@code this}
         * @param subDomain sub_domain block. This parameter is required.
         */
        public Builder subDomain(final java.util.List<? extends imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain> subDomain) {
            this.config.subDomain(subDomain);
            return this;
        }

        /**
         * certificate_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#certificate_settings AmplifyDomainAssociation#certificate_settings}
         * <p>
         * @return {@code this}
         * @param certificateSettings certificate_settings block. This parameter is required.
         */
        public Builder certificateSettings(final imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings certificateSettings) {
            this.config.certificateSettings(certificateSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}.
         * <p>
         * @return {@code this}
         * @param enableAutoSubDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}. This parameter is required.
         */
        public Builder enableAutoSubDomain(final java.lang.Boolean enableAutoSubDomain) {
            this.config.enableAutoSubDomain(enableAutoSubDomain);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}.
         * <p>
         * @return {@code this}
         * @param enableAutoSubDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}. This parameter is required.
         */
        public Builder enableAutoSubDomain(final com.hashicorp.cdktf.IResolvable enableAutoSubDomain) {
            this.config.enableAutoSubDomain(enableAutoSubDomain);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#id AmplifyDomainAssociation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#id AmplifyDomainAssociation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}.
         * <p>
         * @return {@code this}
         * @param waitForVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}. This parameter is required.
         */
        public Builder waitForVerification(final java.lang.Boolean waitForVerification) {
            this.config.waitForVerification(waitForVerification);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}.
         * <p>
         * @return {@code this}
         * @param waitForVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}. This parameter is required.
         */
        public Builder waitForVerification(final com.hashicorp.cdktf.IResolvable waitForVerification) {
            this.config.waitForVerification(waitForVerification);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.amplify_domain_association.AmplifyDomainAssociation}.
         */
        @Override
        public imports.aws.amplify_domain_association.AmplifyDomainAssociation build() {
            return new imports.aws.amplify_domain_association.AmplifyDomainAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
