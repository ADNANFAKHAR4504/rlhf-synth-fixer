package imports.aws.workspacesweb_user_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.691Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettingsConfig")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebUserSettingsConfig.Jsii$Proxy.class)
public interface WorkspaceswebUserSettingsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCopyAllowed();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDownloadAllowed();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPasteAllowed();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrintAllowed();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUploadAllowed();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContext() {
        return null;
    }

    /**
     * cookie_synchronization_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCookieSynchronizationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerManagedKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeepLinkAllowed() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDisconnectTimeoutInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleDisconnectTimeoutInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * toolbar_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getToolbarConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebUserSettingsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebUserSettingsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebUserSettingsConfig> {
        java.lang.String copyAllowed;
        java.lang.String downloadAllowed;
        java.lang.String pasteAllowed;
        java.lang.String printAllowed;
        java.lang.String uploadAllowed;
        java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext;
        java.lang.Object cookieSynchronizationConfiguration;
        java.lang.String customerManagedKey;
        java.lang.String deepLinkAllowed;
        java.lang.Number disconnectTimeoutInMinutes;
        java.lang.Number idleDisconnectTimeoutInMinutes;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object toolbarConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCopyAllowed}
         * @param copyAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}. This parameter is required.
         * @return {@code this}
         */
        public Builder copyAllowed(java.lang.String copyAllowed) {
            this.copyAllowed = copyAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getDownloadAllowed}
         * @param downloadAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}. This parameter is required.
         * @return {@code this}
         */
        public Builder downloadAllowed(java.lang.String downloadAllowed) {
            this.downloadAllowed = downloadAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getPasteAllowed}
         * @param pasteAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}. This parameter is required.
         * @return {@code this}
         */
        public Builder pasteAllowed(java.lang.String pasteAllowed) {
            this.pasteAllowed = pasteAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getPrintAllowed}
         * @param printAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}. This parameter is required.
         * @return {@code this}
         */
        public Builder printAllowed(java.lang.String printAllowed) {
            this.printAllowed = printAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getUploadAllowed}
         * @param uploadAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}. This parameter is required.
         * @return {@code this}
         */
        public Builder uploadAllowed(java.lang.String uploadAllowed) {
            this.uploadAllowed = uploadAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getAdditionalEncryptionContext}
         * @param additionalEncryptionContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.
         * @return {@code this}
         */
        public Builder additionalEncryptionContext(java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext) {
            this.additionalEncryptionContext = additionalEncryptionContext;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCookieSynchronizationConfiguration}
         * @param cookieSynchronizationConfiguration cookie_synchronization_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
         * @return {@code this}
         */
        public Builder cookieSynchronizationConfiguration(com.hashicorp.cdktf.IResolvable cookieSynchronizationConfiguration) {
            this.cookieSynchronizationConfiguration = cookieSynchronizationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCookieSynchronizationConfiguration}
         * @param cookieSynchronizationConfiguration cookie_synchronization_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
         * @return {@code this}
         */
        public Builder cookieSynchronizationConfiguration(java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration> cookieSynchronizationConfiguration) {
            this.cookieSynchronizationConfiguration = cookieSynchronizationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCustomerManagedKey}
         * @param customerManagedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.
         * @return {@code this}
         */
        public Builder customerManagedKey(java.lang.String customerManagedKey) {
            this.customerManagedKey = customerManagedKey;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getDeepLinkAllowed}
         * @param deepLinkAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.
         * @return {@code this}
         */
        public Builder deepLinkAllowed(java.lang.String deepLinkAllowed) {
            this.deepLinkAllowed = deepLinkAllowed;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getDisconnectTimeoutInMinutes}
         * @param disconnectTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder disconnectTimeoutInMinutes(java.lang.Number disconnectTimeoutInMinutes) {
            this.disconnectTimeoutInMinutes = disconnectTimeoutInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getIdleDisconnectTimeoutInMinutes}
         * @param idleDisconnectTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder idleDisconnectTimeoutInMinutes(java.lang.Number idleDisconnectTimeoutInMinutes) {
            this.idleDisconnectTimeoutInMinutes = idleDisconnectTimeoutInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getToolbarConfiguration}
         * @param toolbarConfiguration toolbar_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
         * @return {@code this}
         */
        public Builder toolbarConfiguration(com.hashicorp.cdktf.IResolvable toolbarConfiguration) {
            this.toolbarConfiguration = toolbarConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getToolbarConfiguration}
         * @param toolbarConfiguration toolbar_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
         * @return {@code this}
         */
        public Builder toolbarConfiguration(java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration> toolbarConfiguration) {
            this.toolbarConfiguration = toolbarConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getDependsOn}
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
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsConfig#getProvisioners}
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
         * @return a new instance of {@link WorkspaceswebUserSettingsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebUserSettingsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebUserSettingsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebUserSettingsConfig {
        private final java.lang.String copyAllowed;
        private final java.lang.String downloadAllowed;
        private final java.lang.String pasteAllowed;
        private final java.lang.String printAllowed;
        private final java.lang.String uploadAllowed;
        private final java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext;
        private final java.lang.Object cookieSynchronizationConfiguration;
        private final java.lang.String customerManagedKey;
        private final java.lang.String deepLinkAllowed;
        private final java.lang.Number disconnectTimeoutInMinutes;
        private final java.lang.Number idleDisconnectTimeoutInMinutes;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object toolbarConfiguration;
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
            this.copyAllowed = software.amazon.jsii.Kernel.get(this, "copyAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.downloadAllowed = software.amazon.jsii.Kernel.get(this, "downloadAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pasteAllowed = software.amazon.jsii.Kernel.get(this, "pasteAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.printAllowed = software.amazon.jsii.Kernel.get(this, "printAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uploadAllowed = software.amazon.jsii.Kernel.get(this, "uploadAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalEncryptionContext = software.amazon.jsii.Kernel.get(this, "additionalEncryptionContext", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cookieSynchronizationConfiguration = software.amazon.jsii.Kernel.get(this, "cookieSynchronizationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customerManagedKey = software.amazon.jsii.Kernel.get(this, "customerManagedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deepLinkAllowed = software.amazon.jsii.Kernel.get(this, "deepLinkAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disconnectTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.idleDisconnectTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.toolbarConfiguration = software.amazon.jsii.Kernel.get(this, "toolbarConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.copyAllowed = java.util.Objects.requireNonNull(builder.copyAllowed, "copyAllowed is required");
            this.downloadAllowed = java.util.Objects.requireNonNull(builder.downloadAllowed, "downloadAllowed is required");
            this.pasteAllowed = java.util.Objects.requireNonNull(builder.pasteAllowed, "pasteAllowed is required");
            this.printAllowed = java.util.Objects.requireNonNull(builder.printAllowed, "printAllowed is required");
            this.uploadAllowed = java.util.Objects.requireNonNull(builder.uploadAllowed, "uploadAllowed is required");
            this.additionalEncryptionContext = builder.additionalEncryptionContext;
            this.cookieSynchronizationConfiguration = builder.cookieSynchronizationConfiguration;
            this.customerManagedKey = builder.customerManagedKey;
            this.deepLinkAllowed = builder.deepLinkAllowed;
            this.disconnectTimeoutInMinutes = builder.disconnectTimeoutInMinutes;
            this.idleDisconnectTimeoutInMinutes = builder.idleDisconnectTimeoutInMinutes;
            this.tags = builder.tags;
            this.toolbarConfiguration = builder.toolbarConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCopyAllowed() {
            return this.copyAllowed;
        }

        @Override
        public final java.lang.String getDownloadAllowed() {
            return this.downloadAllowed;
        }

        @Override
        public final java.lang.String getPasteAllowed() {
            return this.pasteAllowed;
        }

        @Override
        public final java.lang.String getPrintAllowed() {
            return this.printAllowed;
        }

        @Override
        public final java.lang.String getUploadAllowed() {
            return this.uploadAllowed;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContext() {
            return this.additionalEncryptionContext;
        }

        @Override
        public final java.lang.Object getCookieSynchronizationConfiguration() {
            return this.cookieSynchronizationConfiguration;
        }

        @Override
        public final java.lang.String getCustomerManagedKey() {
            return this.customerManagedKey;
        }

        @Override
        public final java.lang.String getDeepLinkAllowed() {
            return this.deepLinkAllowed;
        }

        @Override
        public final java.lang.Number getDisconnectTimeoutInMinutes() {
            return this.disconnectTimeoutInMinutes;
        }

        @Override
        public final java.lang.Number getIdleDisconnectTimeoutInMinutes() {
            return this.idleDisconnectTimeoutInMinutes;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getToolbarConfiguration() {
            return this.toolbarConfiguration;
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

            data.set("copyAllowed", om.valueToTree(this.getCopyAllowed()));
            data.set("downloadAllowed", om.valueToTree(this.getDownloadAllowed()));
            data.set("pasteAllowed", om.valueToTree(this.getPasteAllowed()));
            data.set("printAllowed", om.valueToTree(this.getPrintAllowed()));
            data.set("uploadAllowed", om.valueToTree(this.getUploadAllowed()));
            if (this.getAdditionalEncryptionContext() != null) {
                data.set("additionalEncryptionContext", om.valueToTree(this.getAdditionalEncryptionContext()));
            }
            if (this.getCookieSynchronizationConfiguration() != null) {
                data.set("cookieSynchronizationConfiguration", om.valueToTree(this.getCookieSynchronizationConfiguration()));
            }
            if (this.getCustomerManagedKey() != null) {
                data.set("customerManagedKey", om.valueToTree(this.getCustomerManagedKey()));
            }
            if (this.getDeepLinkAllowed() != null) {
                data.set("deepLinkAllowed", om.valueToTree(this.getDeepLinkAllowed()));
            }
            if (this.getDisconnectTimeoutInMinutes() != null) {
                data.set("disconnectTimeoutInMinutes", om.valueToTree(this.getDisconnectTimeoutInMinutes()));
            }
            if (this.getIdleDisconnectTimeoutInMinutes() != null) {
                data.set("idleDisconnectTimeoutInMinutes", om.valueToTree(this.getIdleDisconnectTimeoutInMinutes()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getToolbarConfiguration() != null) {
                data.set("toolbarConfiguration", om.valueToTree(this.getToolbarConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.workspaceswebUserSettings.WorkspaceswebUserSettingsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebUserSettingsConfig.Jsii$Proxy that = (WorkspaceswebUserSettingsConfig.Jsii$Proxy) o;

            if (!copyAllowed.equals(that.copyAllowed)) return false;
            if (!downloadAllowed.equals(that.downloadAllowed)) return false;
            if (!pasteAllowed.equals(that.pasteAllowed)) return false;
            if (!printAllowed.equals(that.printAllowed)) return false;
            if (!uploadAllowed.equals(that.uploadAllowed)) return false;
            if (this.additionalEncryptionContext != null ? !this.additionalEncryptionContext.equals(that.additionalEncryptionContext) : that.additionalEncryptionContext != null) return false;
            if (this.cookieSynchronizationConfiguration != null ? !this.cookieSynchronizationConfiguration.equals(that.cookieSynchronizationConfiguration) : that.cookieSynchronizationConfiguration != null) return false;
            if (this.customerManagedKey != null ? !this.customerManagedKey.equals(that.customerManagedKey) : that.customerManagedKey != null) return false;
            if (this.deepLinkAllowed != null ? !this.deepLinkAllowed.equals(that.deepLinkAllowed) : that.deepLinkAllowed != null) return false;
            if (this.disconnectTimeoutInMinutes != null ? !this.disconnectTimeoutInMinutes.equals(that.disconnectTimeoutInMinutes) : that.disconnectTimeoutInMinutes != null) return false;
            if (this.idleDisconnectTimeoutInMinutes != null ? !this.idleDisconnectTimeoutInMinutes.equals(that.idleDisconnectTimeoutInMinutes) : that.idleDisconnectTimeoutInMinutes != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.toolbarConfiguration != null ? !this.toolbarConfiguration.equals(that.toolbarConfiguration) : that.toolbarConfiguration != null) return false;
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
            int result = this.copyAllowed.hashCode();
            result = 31 * result + (this.downloadAllowed.hashCode());
            result = 31 * result + (this.pasteAllowed.hashCode());
            result = 31 * result + (this.printAllowed.hashCode());
            result = 31 * result + (this.uploadAllowed.hashCode());
            result = 31 * result + (this.additionalEncryptionContext != null ? this.additionalEncryptionContext.hashCode() : 0);
            result = 31 * result + (this.cookieSynchronizationConfiguration != null ? this.cookieSynchronizationConfiguration.hashCode() : 0);
            result = 31 * result + (this.customerManagedKey != null ? this.customerManagedKey.hashCode() : 0);
            result = 31 * result + (this.deepLinkAllowed != null ? this.deepLinkAllowed.hashCode() : 0);
            result = 31 * result + (this.disconnectTimeoutInMinutes != null ? this.disconnectTimeoutInMinutes.hashCode() : 0);
            result = 31 * result + (this.idleDisconnectTimeoutInMinutes != null ? this.idleDisconnectTimeoutInMinutes.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.toolbarConfiguration != null ? this.toolbarConfiguration.hashCode() : 0);
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
