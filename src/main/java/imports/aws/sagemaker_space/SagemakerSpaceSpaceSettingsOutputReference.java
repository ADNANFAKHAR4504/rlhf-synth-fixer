package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.343Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsOutputReference")
public class SagemakerSpaceSpaceSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerSpaceSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpaceSpaceSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerSpaceSpaceSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCodeEditorAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCodeEditorAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomFileSystem(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystem>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystem> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystem>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystem __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomFileSystem", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterLabAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterLabAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterServerAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterServerAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKernelGatewayAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKernelGatewayAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpaceStorageSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSpaceStorageSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAppType() {
        software.amazon.jsii.Kernel.call(this, "resetAppType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeEditorAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCodeEditorAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomFileSystem() {
        software.amazon.jsii.Kernel.call(this, "resetCustomFileSystem", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJupyterLabAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetJupyterLabAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJupyterServerAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetJupyterServerAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKernelGatewayAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetKernelGatewayAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceStorageSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceStorageSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference getCodeEditorAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemList getCustomFileSystem() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystem", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystemList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference getJupyterLabAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference getJupyterServerAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference getKernelGatewayAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference getSpaceStorageSettings() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "appTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings getCodeEditorAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomFileSystemInput() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystemInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings getSpaceStorageSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppType() {
        return software.amazon.jsii.Kernel.get(this, "appType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appType", java.util.Objects.requireNonNull(value, "appType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
