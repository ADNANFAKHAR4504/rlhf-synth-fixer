package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.690Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationOutputReference")
public class WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putInlineRedactionPattern(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern> __cast_cd4240 = (java.util.List<imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInlineRedactionPattern", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetGlobalConfidenceLevel() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalConfidenceLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalEnforcedUrls() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalEnforcedUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalExemptUrls() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalExemptUrls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInlineRedactionPattern() {
        software.amazon.jsii.Kernel.call(this, "resetInlineRedactionPattern", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternList getInlineRedactionPattern() {
        return software.amazon.jsii.Kernel.get(this, "inlineRedactionPattern", software.amazon.jsii.NativeType.forClass(imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGlobalConfidenceLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "globalConfidenceLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlobalEnforcedUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "globalEnforcedUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlobalExemptUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "globalExemptUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInlineRedactionPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "inlineRedactionPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGlobalConfidenceLevel() {
        return software.amazon.jsii.Kernel.get(this, "globalConfidenceLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGlobalConfidenceLevel(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "globalConfidenceLevel", java.util.Objects.requireNonNull(value, "globalConfidenceLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGlobalEnforcedUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "globalEnforcedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGlobalEnforcedUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "globalEnforcedUrls", java.util.Objects.requireNonNull(value, "globalEnforcedUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGlobalExemptUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "globalExemptUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGlobalExemptUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "globalExemptUrls", java.util.Objects.requireNonNull(value, "globalExemptUrls is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
