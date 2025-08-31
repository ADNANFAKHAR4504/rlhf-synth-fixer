package imports.aws.ssoadmin_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application aws_ssoadmin_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.518Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminApplication.SsoadminApplication")
public class SsoadminApplication extends com.hashicorp.cdktf.TerraformResource {

    protected SsoadminApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsoadminApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ssoadmin_application.SsoadminApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application aws_ssoadmin_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SsoadminApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_application.SsoadminApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SsoadminApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsoadminApplication to import. This parameter is required.
     * @param importFromId The id of the existing SsoadminApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SsoadminApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssoadmin_application.SsoadminApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SsoadminApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsoadminApplication to import. This parameter is required.
     * @param importFromId The id of the existing SsoadminApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssoadmin_application.SsoadminApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putPortalOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions> __cast_cd4240 = (java.util.List<imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPortalOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClientToken() {
        software.amazon.jsii.Kernel.call(this, "resetClientToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPortalOptions() {
        software.amazon.jsii.Kernel.call(this, "resetPortalOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationAccount() {
        return software.amazon.jsii.Kernel.get(this, "applicationAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationArn() {
        return software.amazon.jsii.Kernel.get(this, "applicationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsList getPortalOptions() {
        return software.amazon.jsii.Kernel.get(this, "portalOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationProviderArnInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationProviderArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "clientTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPortalOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "portalOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationProviderArn() {
        return software.amazon.jsii.Kernel.get(this, "applicationProviderArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationProviderArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationProviderArn", java.util.Objects.requireNonNull(value, "applicationProviderArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientToken() {
        return software.amazon.jsii.Kernel.get(this, "clientToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientToken", java.util.Objects.requireNonNull(value, "clientToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "instanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceArn", java.util.Objects.requireNonNull(value, "instanceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ssoadmin_application.SsoadminApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ssoadmin_application.SsoadminApplication> {
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
        private final imports.aws.ssoadmin_application.SsoadminApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ssoadmin_application.SsoadminApplicationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#application_provider_arn SsoadminApplication#application_provider_arn}.
         * <p>
         * @return {@code this}
         * @param applicationProviderArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#application_provider_arn SsoadminApplication#application_provider_arn}. This parameter is required.
         */
        public Builder applicationProviderArn(final java.lang.String applicationProviderArn) {
            this.config.applicationProviderArn(applicationProviderArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#instance_arn SsoadminApplication#instance_arn}.
         * <p>
         * @return {@code this}
         * @param instanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#instance_arn SsoadminApplication#instance_arn}. This parameter is required.
         */
        public Builder instanceArn(final java.lang.String instanceArn) {
            this.config.instanceArn(instanceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#name SsoadminApplication#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#name SsoadminApplication#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#client_token SsoadminApplication#client_token}.
         * <p>
         * @return {@code this}
         * @param clientToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#client_token SsoadminApplication#client_token}. This parameter is required.
         */
        public Builder clientToken(final java.lang.String clientToken) {
            this.config.clientToken(clientToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#description SsoadminApplication#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#description SsoadminApplication#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * portal_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#portal_options SsoadminApplication#portal_options}
         * <p>
         * @return {@code this}
         * @param portalOptions portal_options block. This parameter is required.
         */
        public Builder portalOptions(final com.hashicorp.cdktf.IResolvable portalOptions) {
            this.config.portalOptions(portalOptions);
            return this;
        }
        /**
         * portal_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#portal_options SsoadminApplication#portal_options}
         * <p>
         * @return {@code this}
         * @param portalOptions portal_options block. This parameter is required.
         */
        public Builder portalOptions(final java.util.List<? extends imports.aws.ssoadmin_application.SsoadminApplicationPortalOptions> portalOptions) {
            this.config.portalOptions(portalOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#status SsoadminApplication#status}.
         * <p>
         * @return {@code this}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#status SsoadminApplication#status}. This parameter is required.
         */
        public Builder status(final java.lang.String status) {
            this.config.status(status);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#tags SsoadminApplication#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#tags SsoadminApplication#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ssoadmin_application.SsoadminApplication}.
         */
        @Override
        public imports.aws.ssoadmin_application.SsoadminApplication build() {
            return new imports.aws.ssoadmin_application.SsoadminApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
