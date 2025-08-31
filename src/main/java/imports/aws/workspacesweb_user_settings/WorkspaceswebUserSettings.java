package imports.aws.workspacesweb_user_settings;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings aws_workspacesweb_user_settings}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.691Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettings")
public class WorkspaceswebUserSettings extends com.hashicorp.cdktf.TerraformResource {

    protected WorkspaceswebUserSettings(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspaceswebUserSettings(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings aws_workspacesweb_user_settings} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public WorkspaceswebUserSettings(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a WorkspaceswebUserSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorkspaceswebUserSettings to import. This parameter is required.
     * @param importFromId The id of the existing WorkspaceswebUserSettings that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the WorkspaceswebUserSettings to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a WorkspaceswebUserSettings resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorkspaceswebUserSettings to import. This parameter is required.
     * @param importFromId The id of the existing WorkspaceswebUserSettings that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCookieSynchronizationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCookieSynchronizationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putToolbarConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putToolbarConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalEncryptionContext() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalEncryptionContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCookieSynchronizationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCookieSynchronizationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerManagedKey() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerManagedKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeepLinkAllowed() {
        software.amazon.jsii.Kernel.call(this, "resetDeepLinkAllowed", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisconnectTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetDisconnectTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdleDisconnectTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetIdleDisconnectTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetToolbarConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetToolbarConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAssociatedPortalArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "associatedPortalArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationList getCookieSynchronizationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "cookieSynchronizationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfigurationList getToolbarConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "toolbarConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserSettingsArn() {
        return software.amazon.jsii.Kernel.get(this, "userSettingsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContextInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "additionalEncryptionContextInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCookieSynchronizationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "cookieSynchronizationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "copyAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerManagedKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeepLinkAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "deepLinkAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDisconnectTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDownloadAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "downloadAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleDisconnectTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPasteAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "pasteAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrintAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "printAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getToolbarConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "toolbarConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUploadAllowedInput() {
        return software.amazon.jsii.Kernel.get(this, "uploadAllowedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContext() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "additionalEncryptionContext", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdditionalEncryptionContext(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "additionalEncryptionContext", java.util.Objects.requireNonNull(value, "additionalEncryptionContext is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyAllowed() {
        return software.amazon.jsii.Kernel.get(this, "copyAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyAllowed", java.util.Objects.requireNonNull(value, "copyAllowed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerManagedKey() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerManagedKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerManagedKey", java.util.Objects.requireNonNull(value, "customerManagedKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeepLinkAllowed() {
        return software.amazon.jsii.Kernel.get(this, "deepLinkAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeepLinkAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deepLinkAllowed", java.util.Objects.requireNonNull(value, "deepLinkAllowed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDisconnectTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDisconnectTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "disconnectTimeoutInMinutes", java.util.Objects.requireNonNull(value, "disconnectTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDownloadAllowed() {
        return software.amazon.jsii.Kernel.get(this, "downloadAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDownloadAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "downloadAllowed", java.util.Objects.requireNonNull(value, "downloadAllowed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleDisconnectTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleDisconnectTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleDisconnectTimeoutInMinutes", java.util.Objects.requireNonNull(value, "idleDisconnectTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPasteAllowed() {
        return software.amazon.jsii.Kernel.get(this, "pasteAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPasteAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pasteAllowed", java.util.Objects.requireNonNull(value, "pasteAllowed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrintAllowed() {
        return software.amazon.jsii.Kernel.get(this, "printAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrintAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "printAllowed", java.util.Objects.requireNonNull(value, "printAllowed is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUploadAllowed() {
        return software.amazon.jsii.Kernel.get(this, "uploadAllowed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUploadAllowed(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uploadAllowed", java.util.Objects.requireNonNull(value, "uploadAllowed is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings> {
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
        private final imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}.
         * <p>
         * @return {@code this}
         * @param copyAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}. This parameter is required.
         */
        public Builder copyAllowed(final java.lang.String copyAllowed) {
            this.config.copyAllowed(copyAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}.
         * <p>
         * @return {@code this}
         * @param downloadAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}. This parameter is required.
         */
        public Builder downloadAllowed(final java.lang.String downloadAllowed) {
            this.config.downloadAllowed(downloadAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}.
         * <p>
         * @return {@code this}
         * @param pasteAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}. This parameter is required.
         */
        public Builder pasteAllowed(final java.lang.String pasteAllowed) {
            this.config.pasteAllowed(pasteAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}.
         * <p>
         * @return {@code this}
         * @param printAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}. This parameter is required.
         */
        public Builder printAllowed(final java.lang.String printAllowed) {
            this.config.printAllowed(printAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}.
         * <p>
         * @return {@code this}
         * @param uploadAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}. This parameter is required.
         */
        public Builder uploadAllowed(final java.lang.String uploadAllowed) {
            this.config.uploadAllowed(uploadAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.
         * <p>
         * @return {@code this}
         * @param additionalEncryptionContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}. This parameter is required.
         */
        public Builder additionalEncryptionContext(final java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext) {
            this.config.additionalEncryptionContext(additionalEncryptionContext);
            return this;
        }

        /**
         * cookie_synchronization_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
         * <p>
         * @return {@code this}
         * @param cookieSynchronizationConfiguration cookie_synchronization_configuration block. This parameter is required.
         */
        public Builder cookieSynchronizationConfiguration(final com.hashicorp.cdktf.IResolvable cookieSynchronizationConfiguration) {
            this.config.cookieSynchronizationConfiguration(cookieSynchronizationConfiguration);
            return this;
        }
        /**
         * cookie_synchronization_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
         * <p>
         * @return {@code this}
         * @param cookieSynchronizationConfiguration cookie_synchronization_configuration block. This parameter is required.
         */
        public Builder cookieSynchronizationConfiguration(final java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration> cookieSynchronizationConfiguration) {
            this.config.cookieSynchronizationConfiguration(cookieSynchronizationConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.
         * <p>
         * @return {@code this}
         * @param customerManagedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}. This parameter is required.
         */
        public Builder customerManagedKey(final java.lang.String customerManagedKey) {
            this.config.customerManagedKey(customerManagedKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.
         * <p>
         * @return {@code this}
         * @param deepLinkAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}. This parameter is required.
         */
        public Builder deepLinkAllowed(final java.lang.String deepLinkAllowed) {
            this.config.deepLinkAllowed(deepLinkAllowed);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.
         * <p>
         * @return {@code this}
         * @param disconnectTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}. This parameter is required.
         */
        public Builder disconnectTimeoutInMinutes(final java.lang.Number disconnectTimeoutInMinutes) {
            this.config.disconnectTimeoutInMinutes(disconnectTimeoutInMinutes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.
         * <p>
         * @return {@code this}
         * @param idleDisconnectTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}. This parameter is required.
         */
        public Builder idleDisconnectTimeoutInMinutes(final java.lang.Number idleDisconnectTimeoutInMinutes) {
            this.config.idleDisconnectTimeoutInMinutes(idleDisconnectTimeoutInMinutes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * toolbar_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
         * <p>
         * @return {@code this}
         * @param toolbarConfiguration toolbar_configuration block. This parameter is required.
         */
        public Builder toolbarConfiguration(final com.hashicorp.cdktf.IResolvable toolbarConfiguration) {
            this.config.toolbarConfiguration(toolbarConfiguration);
            return this;
        }
        /**
         * toolbar_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
         * <p>
         * @return {@code this}
         * @param toolbarConfiguration toolbar_configuration block. This parameter is required.
         */
        public Builder toolbarConfiguration(final java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsToolbarConfiguration> toolbarConfiguration) {
            this.config.toolbarConfiguration(toolbarConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings}.
         */
        @Override
        public imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings build() {
            return new imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettings(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
