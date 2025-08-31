package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.351Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsOutputReference")
public class SagemakerUserProfileUserSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerUserProfileUserSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerUserProfileUserSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerUserProfileUserSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCanvasAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCanvasAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodeEditorAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCodeEditorAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCodeEditorAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomFileSystemConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfig> __cast_cd4240 = (java.util.List<imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomFileSystemConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomPosixUserConfig(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomPosixUserConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCustomPosixUserConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterLabAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterLabAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJupyterServerAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterServerAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putJupyterServerAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKernelGatewayAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKernelGatewayAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRSessionAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRSessionAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRSessionAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRStudioServerProAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putRStudioServerProAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSharingSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSharingSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpaceStorageSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSpaceStorageSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStudioWebPortalSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsStudioWebPortalSettings value) {
        software.amazon.jsii.Kernel.call(this, "putStudioWebPortalSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTensorBoardAppSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsTensorBoardAppSettings value) {
        software.amazon.jsii.Kernel.call(this, "putTensorBoardAppSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoMountHomeEfs() {
        software.amazon.jsii.Kernel.call(this, "resetAutoMountHomeEfs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCanvasAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCanvasAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeEditorAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCodeEditorAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomFileSystemConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCustomFileSystemConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomPosixUserConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPosixUserConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultLandingUri() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultLandingUri", software.amazon.jsii.NativeType.VOID);
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

    public void resetRSessionAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRSessionAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRStudioServerProAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRStudioServerProAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSharingSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSharingSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceStorageSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceStorageSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStudioWebPortal() {
        software.amazon.jsii.Kernel.call(this, "resetStudioWebPortal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStudioWebPortalSettings() {
        software.amazon.jsii.Kernel.call(this, "resetStudioWebPortalSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTensorBoardAppSettings() {
        software.amazon.jsii.Kernel.call(this, "resetTensorBoardAppSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference getCanvasAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "canvasAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference getCodeEditorAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfigList getCustomFileSystemConfig() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomFileSystemConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference getCustomPosixUserConfig() {
        return software.amazon.jsii.Kernel.get(this, "customPosixUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference getJupyterLabAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference getJupyterServerAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference getKernelGatewayAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference getRSessionAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "rSessionAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference getRStudioServerProAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "rStudioServerProAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettingsOutputReference getSharingSettings() {
        return software.amazon.jsii.Kernel.get(this, "sharingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference getSpaceStorageSettings() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference getStudioWebPortalSettings() {
        return software.amazon.jsii.Kernel.get(this, "studioWebPortalSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference getTensorBoardAppSettings() {
        return software.amazon.jsii.Kernel.get(this, "tensorBoardAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoMountHomeEfsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoMountHomeEfsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings getCanvasAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "canvasAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCodeEditorAppSettings getCodeEditorAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "codeEditorAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCodeEditorAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomFileSystemConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "customFileSystemConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomPosixUserConfig getCustomPosixUserConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "customPosixUserConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCustomPosixUserConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultLandingUriInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultLandingUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettings getJupyterLabAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterServerAppSettings getJupyterServerAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterServerAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings getKernelGatewayAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRSessionAppSettings getRSessionAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rSessionAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRSessionAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings getRStudioServerProAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "rStudioServerProAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings getSharingSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "sharingSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSharingSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettings getSpaceStorageSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceStorageSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStudioWebPortalInput() {
        return software.amazon.jsii.Kernel.get(this, "studioWebPortalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsStudioWebPortalSettings getStudioWebPortalSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "studioWebPortalSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsStudioWebPortalSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsTensorBoardAppSettings getTensorBoardAppSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "tensorBoardAppSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsTensorBoardAppSettings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoMountHomeEfs() {
        return software.amazon.jsii.Kernel.get(this, "autoMountHomeEfs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoMountHomeEfs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoMountHomeEfs", java.util.Objects.requireNonNull(value, "autoMountHomeEfs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultLandingUri() {
        return software.amazon.jsii.Kernel.get(this, "defaultLandingUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultLandingUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultLandingUri", java.util.Objects.requireNonNull(value, "defaultLandingUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole() {
        return software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRole", java.util.Objects.requireNonNull(value, "executionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStudioWebPortal() {
        return software.amazon.jsii.Kernel.get(this, "studioWebPortal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStudioWebPortal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "studioWebPortal", java.util.Objects.requireNonNull(value, "studioWebPortal is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
