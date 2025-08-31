package imports.aws.workspacesweb_user_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.692Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference")
public class WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAllowlist(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAllowlist", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBlocklist(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBlocklist", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowlist() {
        software.amazon.jsii.Kernel.call(this, "resetAllowlist", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlocklist() {
        software.amazon.jsii.Kernel.call(this, "resetBlocklist", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList getAllowlist() {
        return software.amazon.jsii.Kernel.get(this, "allowlist", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList getBlocklist() {
        return software.amazon.jsii.Kernel.get(this, "blocklist", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowlistInput() {
        return software.amazon.jsii.Kernel.get(this, "allowlistInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlocklistInput() {
        return software.amazon.jsii.Kernel.get(this, "blocklistInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
