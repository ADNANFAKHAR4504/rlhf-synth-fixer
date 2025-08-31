package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.690Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternOutputReference")
public class WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCustomPattern(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomPattern", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRedactionPlaceHolder(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRedactionPlaceHolder", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBuiltInPatternId() {
        software.amazon.jsii.Kernel.call(this, "resetBuiltInPatternId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfidenceLevel() {
        software.amazon.jsii.Kernel.call(this, "resetConfidenceLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomPattern() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPattern", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnforcedUrls() {
        software.amazon.jsii.Kernel.call(this, "resetEnforcedUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExemptUrls() {
        software.amazon.jsii.Kernel.call(this, "resetExemptUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedactionPlaceHolder() {
        software.amazon.jsii.Kernel.call(this, "resetRedactionPlaceHolder", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternList getCustomPattern() {
        return software.amazon.jsii.Kernel.get(this, "customPattern", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolderList getRedactionPlaceHolder() {
        return software.amazon.jsii.Kernel.get(this, "redactionPlaceHolder", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolderList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuiltInPatternIdInput() {
        return software.amazon.jsii.Kernel.get(this, "builtInPatternIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConfidenceLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "confidenceLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "customPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnforcedUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "enforcedUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExemptUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "exemptUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRedactionPlaceHolderInput() {
        return software.amazon.jsii.Kernel.get(this, "redactionPlaceHolderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuiltInPatternId() {
        return software.amazon.jsii.Kernel.get(this, "builtInPatternId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuiltInPatternId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "builtInPatternId", java.util.Objects.requireNonNull(value, "builtInPatternId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConfidenceLevel() {
        return software.amazon.jsii.Kernel.get(this, "confidenceLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConfidenceLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "confidenceLevel", java.util.Objects.requireNonNull(value, "confidenceLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnforcedUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "enforcedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnforcedUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "enforcedUrls", java.util.Objects.requireNonNull(value, "enforcedUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExemptUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "exemptUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExemptUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "exemptUrls", java.util.Objects.requireNonNull(value, "exemptUrls is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
