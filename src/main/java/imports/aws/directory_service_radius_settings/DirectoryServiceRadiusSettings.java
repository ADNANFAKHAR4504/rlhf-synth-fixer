package imports.aws.directory_service_radius_settings;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings aws_directory_service_radius_settings}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceRadiusSettings.DirectoryServiceRadiusSettings")
public class DirectoryServiceRadiusSettings extends com.hashicorp.cdktf.TerraformResource {

    protected DirectoryServiceRadiusSettings(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DirectoryServiceRadiusSettings(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings aws_directory_service_radius_settings} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DirectoryServiceRadiusSettings(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DirectoryServiceRadiusSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DirectoryServiceRadiusSettings to import. This parameter is required.
     * @param importFromId The id of the existing DirectoryServiceRadiusSettings that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DirectoryServiceRadiusSettings to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DirectoryServiceRadiusSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DirectoryServiceRadiusSettings to import. This parameter is required.
     * @param importFromId The id of the existing DirectoryServiceRadiusSettings that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseSameUsername() {
        software.amazon.jsii.Kernel.call(this, "resetUseSameUsername", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "displayLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRadiusPortInput() {
        return software.amazon.jsii.Kernel.get(this, "radiusPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRadiusRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "radiusRetriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRadiusServersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "radiusServersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRadiusTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "radiusTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSharedSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "sharedSecretInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseSameUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "useSameUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationProtocol() {
        return software.amazon.jsii.Kernel.get(this, "authenticationProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationProtocol", java.util.Objects.requireNonNull(value, "authenticationProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayLabel() {
        return software.amazon.jsii.Kernel.get(this, "displayLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayLabel", java.util.Objects.requireNonNull(value, "displayLabel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusPort() {
        return software.amazon.jsii.Kernel.get(this, "radiusPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRadiusPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "radiusPort", java.util.Objects.requireNonNull(value, "radiusPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusRetries() {
        return software.amazon.jsii.Kernel.get(this, "radiusRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRadiusRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "radiusRetries", java.util.Objects.requireNonNull(value, "radiusRetries is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRadiusServers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "radiusServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRadiusServers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "radiusServers", java.util.Objects.requireNonNull(value, "radiusServers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRadiusTimeout() {
        return software.amazon.jsii.Kernel.get(this, "radiusTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRadiusTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "radiusTimeout", java.util.Objects.requireNonNull(value, "radiusTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSharedSecret() {
        return software.amazon.jsii.Kernel.get(this, "sharedSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSharedSecret(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sharedSecret", java.util.Objects.requireNonNull(value, "sharedSecret is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseSameUsername() {
        return software.amazon.jsii.Kernel.get(this, "useSameUsername", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseSameUsername(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useSameUsername", java.util.Objects.requireNonNull(value, "useSameUsername is required"));
    }

    public void setUseSameUsername(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useSameUsername", java.util.Objects.requireNonNull(value, "useSameUsername is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings> {
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
        private final imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#authentication_protocol DirectoryServiceRadiusSettings#authentication_protocol}.
         * <p>
         * @return {@code this}
         * @param authenticationProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#authentication_protocol DirectoryServiceRadiusSettings#authentication_protocol}. This parameter is required.
         */
        public Builder authenticationProtocol(final java.lang.String authenticationProtocol) {
            this.config.authenticationProtocol(authenticationProtocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#directory_id DirectoryServiceRadiusSettings#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#directory_id DirectoryServiceRadiusSettings#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config.directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#display_label DirectoryServiceRadiusSettings#display_label}.
         * <p>
         * @return {@code this}
         * @param displayLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#display_label DirectoryServiceRadiusSettings#display_label}. This parameter is required.
         */
        public Builder displayLabel(final java.lang.String displayLabel) {
            this.config.displayLabel(displayLabel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_port DirectoryServiceRadiusSettings#radius_port}.
         * <p>
         * @return {@code this}
         * @param radiusPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_port DirectoryServiceRadiusSettings#radius_port}. This parameter is required.
         */
        public Builder radiusPort(final java.lang.Number radiusPort) {
            this.config.radiusPort(radiusPort);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_retries DirectoryServiceRadiusSettings#radius_retries}.
         * <p>
         * @return {@code this}
         * @param radiusRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_retries DirectoryServiceRadiusSettings#radius_retries}. This parameter is required.
         */
        public Builder radiusRetries(final java.lang.Number radiusRetries) {
            this.config.radiusRetries(radiusRetries);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_servers DirectoryServiceRadiusSettings#radius_servers}.
         * <p>
         * @return {@code this}
         * @param radiusServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_servers DirectoryServiceRadiusSettings#radius_servers}. This parameter is required.
         */
        public Builder radiusServers(final java.util.List<java.lang.String> radiusServers) {
            this.config.radiusServers(radiusServers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_timeout DirectoryServiceRadiusSettings#radius_timeout}.
         * <p>
         * @return {@code this}
         * @param radiusTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_timeout DirectoryServiceRadiusSettings#radius_timeout}. This parameter is required.
         */
        public Builder radiusTimeout(final java.lang.Number radiusTimeout) {
            this.config.radiusTimeout(radiusTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#shared_secret DirectoryServiceRadiusSettings#shared_secret}.
         * <p>
         * @return {@code this}
         * @param sharedSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#shared_secret DirectoryServiceRadiusSettings#shared_secret}. This parameter is required.
         */
        public Builder sharedSecret(final java.lang.String sharedSecret) {
            this.config.sharedSecret(sharedSecret);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#id DirectoryServiceRadiusSettings#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#id DirectoryServiceRadiusSettings#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#timeouts DirectoryServiceRadiusSettings#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}.
         * <p>
         * @return {@code this}
         * @param useSameUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}. This parameter is required.
         */
        public Builder useSameUsername(final java.lang.Boolean useSameUsername) {
            this.config.useSameUsername(useSameUsername);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}.
         * <p>
         * @return {@code this}
         * @param useSameUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}. This parameter is required.
         */
        public Builder useSameUsername(final com.hashicorp.cdktf.IResolvable useSameUsername) {
            this.config.useSameUsername(useSameUsername);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings}.
         */
        @Override
        public imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings build() {
            return new imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettings(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
