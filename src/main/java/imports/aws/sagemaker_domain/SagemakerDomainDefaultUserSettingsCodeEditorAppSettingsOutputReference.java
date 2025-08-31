package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.312Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsOutputReference")
public class SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAppLifecycleManagement(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsAppLifecycleManagement value) {
        software.amazon.jsii.Kernel.call(this, "putAppLifecycleManagement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomImage(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomImage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDefaultResourceSpec(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsDefaultResourceSpec value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultResourceSpec", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAppLifecycleManagement() {
        software.amazon.jsii.Kernel.call(this, "resetAppLifecycleManagement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuiltInLifecycleConfigArn() {
        software.amazon.jsii.Kernel.call(this, "resetBuiltInLifecycleConfigArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomImage() {
        software.amazon.jsii.Kernel.call(this, "resetCustomImage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultResourceSpec() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultResourceSpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycleConfigArns() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycleConfigArns", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference getAppLifecycleManagement() {
        return software.amazon.jsii.Kernel.get(this, "appLifecycleManagement", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImageList getCustomImage() {
        return software.amazon.jsii.Kernel.get(this, "customImage", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImageList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference getDefaultResourceSpec() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsAppLifecycleManagement getAppLifecycleManagementInput() {
        return software.amazon.jsii.Kernel.get(this, "appLifecycleManagementInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsAppLifecycleManagement.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuiltInLifecycleConfigArnInput() {
        return software.amazon.jsii.Kernel.get(this, "builtInLifecycleConfigArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomImageInput() {
        return software.amazon.jsii.Kernel.get(this, "customImageInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsDefaultResourceSpec getDefaultResourceSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpecInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsDefaultResourceSpec.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLifecycleConfigArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "lifecycleConfigArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuiltInLifecycleConfigArn() {
        return software.amazon.jsii.Kernel.get(this, "builtInLifecycleConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuiltInLifecycleConfigArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "builtInLifecycleConfigArn", java.util.Objects.requireNonNull(value, "builtInLifecycleConfigArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLifecycleConfigArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "lifecycleConfigArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLifecycleConfigArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "lifecycleConfigArns", java.util.Objects.requireNonNull(value, "lifecycleConfigArns is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
