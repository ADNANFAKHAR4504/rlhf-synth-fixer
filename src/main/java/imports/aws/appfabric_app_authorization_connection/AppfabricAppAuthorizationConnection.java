package imports.aws.appfabric_app_authorization_connection;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection aws_appfabric_app_authorization_connection}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricAppAuthorizationConnection.AppfabricAppAuthorizationConnection")
public class AppfabricAppAuthorizationConnection extends com.hashicorp.cdktf.TerraformResource {

    protected AppfabricAppAuthorizationConnection(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppfabricAppAuthorizationConnection(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection aws_appfabric_app_authorization_connection} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppfabricAppAuthorizationConnection(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppfabricAppAuthorizationConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppfabricAppAuthorizationConnection to import. This parameter is required.
     * @param importFromId The id of the existing AppfabricAppAuthorizationConnection that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppfabricAppAuthorizationConnection to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppfabricAppAuthorizationConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppfabricAppAuthorizationConnection to import. This parameter is required.
     * @param importFromId The id of the existing AppfabricAppAuthorizationConnection that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAuthRequest(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequest>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequest> __cast_cd4240 = (java.util.List<imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequest>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequest __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAuthRequest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthRequest() {
        software.amazon.jsii.Kernel.call(this, "resetAuthRequest", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getApp() {
        return software.amazon.jsii.Kernel.get(this, "app", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequestList getAuthRequest() {
        return software.amazon.jsii.Kernel.get(this, "authRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequestList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTenantList getTenant() {
        return software.amazon.jsii.Kernel.get(this, "tenant", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTenantList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppAuthorizationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "appAuthorizationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppBundleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "appBundleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAuthRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "authRequestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppAuthorizationArn() {
        return software.amazon.jsii.Kernel.get(this, "appAuthorizationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppAuthorizationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appAuthorizationArn", java.util.Objects.requireNonNull(value, "appAuthorizationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppBundleArn() {
        return software.amazon.jsii.Kernel.get(this, "appBundleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppBundleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appBundleArn", java.util.Objects.requireNonNull(value, "appBundleArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection> {
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
        private final imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#app_authorization_arn AppfabricAppAuthorizationConnection#app_authorization_arn}.
         * <p>
         * @return {@code this}
         * @param appAuthorizationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#app_authorization_arn AppfabricAppAuthorizationConnection#app_authorization_arn}. This parameter is required.
         */
        public Builder appAuthorizationArn(final java.lang.String appAuthorizationArn) {
            this.config.appAuthorizationArn(appAuthorizationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#app_bundle_arn AppfabricAppAuthorizationConnection#app_bundle_arn}.
         * <p>
         * @return {@code this}
         * @param appBundleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#app_bundle_arn AppfabricAppAuthorizationConnection#app_bundle_arn}. This parameter is required.
         */
        public Builder appBundleArn(final java.lang.String appBundleArn) {
            this.config.appBundleArn(appBundleArn);
            return this;
        }

        /**
         * auth_request block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#auth_request AppfabricAppAuthorizationConnection#auth_request}
         * <p>
         * @return {@code this}
         * @param authRequest auth_request block. This parameter is required.
         */
        public Builder authRequest(final com.hashicorp.cdktf.IResolvable authRequest) {
            this.config.authRequest(authRequest);
            return this;
        }
        /**
         * auth_request block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#auth_request AppfabricAppAuthorizationConnection#auth_request}
         * <p>
         * @return {@code this}
         * @param authRequest auth_request block. This parameter is required.
         */
        public Builder authRequest(final java.util.List<? extends imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionAuthRequest> authRequest) {
            this.config.authRequest(authRequest);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization_connection#timeouts AppfabricAppAuthorizationConnection#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnectionTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection}.
         */
        @Override
        public imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection build() {
            return new imports.aws.appfabric_app_authorization_connection.AppfabricAppAuthorizationConnection(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
