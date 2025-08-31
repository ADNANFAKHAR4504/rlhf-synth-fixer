package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.689Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternOutputReference")
public class WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPatternOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetKeywordRegex() {
        software.amazon.jsii.Kernel.call(this, "resetKeywordRegex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPatternDescription() {
        software.amazon.jsii.Kernel.call(this, "resetPatternDescription", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeywordRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "keywordRegexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPatternDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "patternDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPatternNameInput() {
        return software.amazon.jsii.Kernel.get(this, "patternNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPatternRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "patternRegexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeywordRegex() {
        return software.amazon.jsii.Kernel.get(this, "keywordRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeywordRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keywordRegex", java.util.Objects.requireNonNull(value, "keywordRegex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPatternDescription() {
        return software.amazon.jsii.Kernel.get(this, "patternDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPatternDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "patternDescription", java.util.Objects.requireNonNull(value, "patternDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPatternName() {
        return software.amazon.jsii.Kernel.get(this, "patternName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPatternName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "patternName", java.util.Objects.requireNonNull(value, "patternName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPatternRegex() {
        return software.amazon.jsii.Kernel.get(this, "patternRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPatternRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "patternRegex", java.util.Objects.requireNonNull(value, "patternRegex is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
