package imports.aws.servicecatalog_portfolio_share;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share aws_servicecatalog_portfolio_share}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.429Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogPortfolioShare.ServicecatalogPortfolioShare")
public class ServicecatalogPortfolioShare extends com.hashicorp.cdktf.TerraformResource {

    protected ServicecatalogPortfolioShare(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServicecatalogPortfolioShare(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share aws_servicecatalog_portfolio_share} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ServicecatalogPortfolioShare(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ServicecatalogPortfolioShare resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ServicecatalogPortfolioShare to import. This parameter is required.
     * @param importFromId The id of the existing ServicecatalogPortfolioShare that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ServicecatalogPortfolioShare to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ServicecatalogPortfolioShare resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ServicecatalogPortfolioShare to import. This parameter is required.
     * @param importFromId The id of the existing ServicecatalogPortfolioShare that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcceptLanguage() {
        software.amazon.jsii.Kernel.call(this, "resetAcceptLanguage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSharePrincipals() {
        software.amazon.jsii.Kernel.call(this, "resetSharePrincipals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShareTagOptions() {
        software.amazon.jsii.Kernel.call(this, "resetShareTagOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForAcceptance() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForAcceptance", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAccepted() {
        return software.amazon.jsii.Kernel.get(this, "accepted", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAcceptLanguageInput() {
        return software.amazon.jsii.Kernel.get(this, "acceptLanguageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPortfolioIdInput() {
        return software.amazon.jsii.Kernel.get(this, "portfolioIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalIdInput() {
        return software.amazon.jsii.Kernel.get(this, "principalIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSharePrincipalsInput() {
        return software.amazon.jsii.Kernel.get(this, "sharePrincipalsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getShareTagOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "shareTagOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitForAcceptanceInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForAcceptanceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcceptLanguage() {
        return software.amazon.jsii.Kernel.get(this, "acceptLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcceptLanguage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acceptLanguage", java.util.Objects.requireNonNull(value, "acceptLanguage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPortfolioId() {
        return software.amazon.jsii.Kernel.get(this, "portfolioId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPortfolioId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "portfolioId", java.util.Objects.requireNonNull(value, "portfolioId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipalId() {
        return software.amazon.jsii.Kernel.get(this, "principalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrincipalId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "principalId", java.util.Objects.requireNonNull(value, "principalId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSharePrincipals() {
        return software.amazon.jsii.Kernel.get(this, "sharePrincipals", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSharePrincipals(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sharePrincipals", java.util.Objects.requireNonNull(value, "sharePrincipals is required"));
    }

    public void setSharePrincipals(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sharePrincipals", java.util.Objects.requireNonNull(value, "sharePrincipals is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getShareTagOptions() {
        return software.amazon.jsii.Kernel.get(this, "shareTagOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setShareTagOptions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "shareTagOptions", java.util.Objects.requireNonNull(value, "shareTagOptions is required"));
    }

    public void setShareTagOptions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "shareTagOptions", java.util.Objects.requireNonNull(value, "shareTagOptions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWaitForAcceptance() {
        return software.amazon.jsii.Kernel.get(this, "waitForAcceptance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWaitForAcceptance(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "waitForAcceptance", java.util.Objects.requireNonNull(value, "waitForAcceptance is required"));
    }

    public void setWaitForAcceptance(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "waitForAcceptance", java.util.Objects.requireNonNull(value, "waitForAcceptance is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare> {
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
        private final imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#portfolio_id ServicecatalogPortfolioShare#portfolio_id}.
         * <p>
         * @return {@code this}
         * @param portfolioId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#portfolio_id ServicecatalogPortfolioShare#portfolio_id}. This parameter is required.
         */
        public Builder portfolioId(final java.lang.String portfolioId) {
            this.config.portfolioId(portfolioId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#principal_id ServicecatalogPortfolioShare#principal_id}.
         * <p>
         * @return {@code this}
         * @param principalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#principal_id ServicecatalogPortfolioShare#principal_id}. This parameter is required.
         */
        public Builder principalId(final java.lang.String principalId) {
            this.config.principalId(principalId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#type ServicecatalogPortfolioShare#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#type ServicecatalogPortfolioShare#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#accept_language ServicecatalogPortfolioShare#accept_language}.
         * <p>
         * @return {@code this}
         * @param acceptLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#accept_language ServicecatalogPortfolioShare#accept_language}. This parameter is required.
         */
        public Builder acceptLanguage(final java.lang.String acceptLanguage) {
            this.config.acceptLanguage(acceptLanguage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#id ServicecatalogPortfolioShare#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#id ServicecatalogPortfolioShare#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_principals ServicecatalogPortfolioShare#share_principals}.
         * <p>
         * @return {@code this}
         * @param sharePrincipals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_principals ServicecatalogPortfolioShare#share_principals}. This parameter is required.
         */
        public Builder sharePrincipals(final java.lang.Boolean sharePrincipals) {
            this.config.sharePrincipals(sharePrincipals);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_principals ServicecatalogPortfolioShare#share_principals}.
         * <p>
         * @return {@code this}
         * @param sharePrincipals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_principals ServicecatalogPortfolioShare#share_principals}. This parameter is required.
         */
        public Builder sharePrincipals(final com.hashicorp.cdktf.IResolvable sharePrincipals) {
            this.config.sharePrincipals(sharePrincipals);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_tag_options ServicecatalogPortfolioShare#share_tag_options}.
         * <p>
         * @return {@code this}
         * @param shareTagOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_tag_options ServicecatalogPortfolioShare#share_tag_options}. This parameter is required.
         */
        public Builder shareTagOptions(final java.lang.Boolean shareTagOptions) {
            this.config.shareTagOptions(shareTagOptions);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_tag_options ServicecatalogPortfolioShare#share_tag_options}.
         * <p>
         * @return {@code this}
         * @param shareTagOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#share_tag_options ServicecatalogPortfolioShare#share_tag_options}. This parameter is required.
         */
        public Builder shareTagOptions(final com.hashicorp.cdktf.IResolvable shareTagOptions) {
            this.config.shareTagOptions(shareTagOptions);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#timeouts ServicecatalogPortfolioShare#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShareTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#wait_for_acceptance ServicecatalogPortfolioShare#wait_for_acceptance}.
         * <p>
         * @return {@code this}
         * @param waitForAcceptance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#wait_for_acceptance ServicecatalogPortfolioShare#wait_for_acceptance}. This parameter is required.
         */
        public Builder waitForAcceptance(final java.lang.Boolean waitForAcceptance) {
            this.config.waitForAcceptance(waitForAcceptance);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#wait_for_acceptance ServicecatalogPortfolioShare#wait_for_acceptance}.
         * <p>
         * @return {@code this}
         * @param waitForAcceptance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_portfolio_share#wait_for_acceptance ServicecatalogPortfolioShare#wait_for_acceptance}. This parameter is required.
         */
        public Builder waitForAcceptance(final com.hashicorp.cdktf.IResolvable waitForAcceptance) {
            this.config.waitForAcceptance(waitForAcceptance);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare}.
         */
        @Override
        public imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare build() {
            return new imports.aws.servicecatalog_portfolio_share.ServicecatalogPortfolioShare(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
