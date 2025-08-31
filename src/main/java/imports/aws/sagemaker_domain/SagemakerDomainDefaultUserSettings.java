package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.310Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role SagemakerDomain#execution_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#auto_mount_home_efs SagemakerDomain#auto_mount_home_efs}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoMountHomeEfs() {
        return null;
    }

    /**
     * canvas_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#canvas_app_settings SagemakerDomain#canvas_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings getCanvasAppSettings() {
        return null;
    }

    /**
     * code_editor_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#code_editor_app_settings SagemakerDomain#code_editor_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings getCodeEditorAppSettings() {
        return null;
    }

    /**
     * custom_file_system_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_file_system_config SagemakerDomain#custom_file_system_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomFileSystemConfig() {
        return null;
    }

    /**
     * custom_posix_user_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_posix_user_config SagemakerDomain#custom_posix_user_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig getCustomPosixUserConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_landing_uri SagemakerDomain#default_landing_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultLandingUri() {
        return null;
    }

    /**
     * jupyter_lab_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_lab_app_settings SagemakerDomain#jupyter_lab_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
        return null;
    }

    /**
     * jupyter_server_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_server_app_settings SagemakerDomain#jupyter_server_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
        return null;
    }

    /**
     * kernel_gateway_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kernel_gateway_app_settings SagemakerDomain#kernel_gateway_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
        return null;
    }

    /**
     * r_session_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_session_app_settings SagemakerDomain#r_session_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings getRSessionAppSettings() {
        return null;
    }

    /**
     * r_studio_server_pro_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_server_pro_app_settings SagemakerDomain#r_studio_server_pro_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings getRStudioServerProAppSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_groups SagemakerDomain#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * sharing_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sharing_settings SagemakerDomain#sharing_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings getSharingSettings() {
        return null;
    }

    /**
     * space_storage_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#space_storage_settings SagemakerDomain#space_storage_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings getSpaceStorageSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#studio_web_portal SagemakerDomain#studio_web_portal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStudioWebPortal() {
        return null;
    }

    /**
     * studio_web_portal_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#studio_web_portal_settings SagemakerDomain#studio_web_portal_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings getStudioWebPortalSettings() {
        return null;
    }

    /**
     * tensor_board_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tensor_board_app_settings SagemakerDomain#tensor_board_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings getTensorBoardAppSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettings> {
        java.lang.String executionRole;
        java.lang.String autoMountHomeEfs;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings canvasAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings codeEditorAppSettings;
        java.lang.Object customFileSystemConfig;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig customPosixUserConfig;
        java.lang.String defaultLandingUri;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings jupyterLabAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings jupyterServerAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings rSessionAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings rStudioServerProAppSettings;
        java.util.List<java.lang.String> securityGroups;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings sharingSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings spaceStorageSettings;
        java.lang.String studioWebPortal;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings studioWebPortalSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings tensorBoardAppSettings;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role SagemakerDomain#execution_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getAutoMountHomeEfs}
         * @param autoMountHomeEfs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#auto_mount_home_efs SagemakerDomain#auto_mount_home_efs}.
         * @return {@code this}
         */
        public Builder autoMountHomeEfs(java.lang.String autoMountHomeEfs) {
            this.autoMountHomeEfs = autoMountHomeEfs;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getCanvasAppSettings}
         * @param canvasAppSettings canvas_app_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#canvas_app_settings SagemakerDomain#canvas_app_settings}
         * @return {@code this}
         */
        public Builder canvasAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings canvasAppSettings) {
            this.canvasAppSettings = canvasAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getCodeEditorAppSettings}
         * @param codeEditorAppSettings code_editor_app_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#code_editor_app_settings SagemakerDomain#code_editor_app_settings}
         * @return {@code this}
         */
        public Builder codeEditorAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings codeEditorAppSettings) {
            this.codeEditorAppSettings = codeEditorAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getCustomFileSystemConfig}
         * @param customFileSystemConfig custom_file_system_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_file_system_config SagemakerDomain#custom_file_system_config}
         * @return {@code this}
         */
        public Builder customFileSystemConfig(com.hashicorp.cdktf.IResolvable customFileSystemConfig) {
            this.customFileSystemConfig = customFileSystemConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getCustomFileSystemConfig}
         * @param customFileSystemConfig custom_file_system_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_file_system_config SagemakerDomain#custom_file_system_config}
         * @return {@code this}
         */
        public Builder customFileSystemConfig(java.util.List<? extends imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomFileSystemConfig> customFileSystemConfig) {
            this.customFileSystemConfig = customFileSystemConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getCustomPosixUserConfig}
         * @param customPosixUserConfig custom_posix_user_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_posix_user_config SagemakerDomain#custom_posix_user_config}
         * @return {@code this}
         */
        public Builder customPosixUserConfig(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig customPosixUserConfig) {
            this.customPosixUserConfig = customPosixUserConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getDefaultLandingUri}
         * @param defaultLandingUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_landing_uri SagemakerDomain#default_landing_uri}.
         * @return {@code this}
         */
        public Builder defaultLandingUri(java.lang.String defaultLandingUri) {
            this.defaultLandingUri = defaultLandingUri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getJupyterLabAppSettings}
         * @param jupyterLabAppSettings jupyter_lab_app_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_lab_app_settings SagemakerDomain#jupyter_lab_app_settings}
         * @return {@code this}
         */
        public Builder jupyterLabAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings jupyterLabAppSettings) {
            this.jupyterLabAppSettings = jupyterLabAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getJupyterServerAppSettings}
         * @param jupyterServerAppSettings jupyter_server_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_server_app_settings SagemakerDomain#jupyter_server_app_settings}
         * @return {@code this}
         */
        public Builder jupyterServerAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings jupyterServerAppSettings) {
            this.jupyterServerAppSettings = jupyterServerAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getKernelGatewayAppSettings}
         * @param kernelGatewayAppSettings kernel_gateway_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kernel_gateway_app_settings SagemakerDomain#kernel_gateway_app_settings}
         * @return {@code this}
         */
        public Builder kernelGatewayAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings kernelGatewayAppSettings) {
            this.kernelGatewayAppSettings = kernelGatewayAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getRSessionAppSettings}
         * @param rSessionAppSettings r_session_app_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_session_app_settings SagemakerDomain#r_session_app_settings}
         * @return {@code this}
         */
        public Builder rSessionAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings rSessionAppSettings) {
            this.rSessionAppSettings = rSessionAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getRStudioServerProAppSettings}
         * @param rStudioServerProAppSettings r_studio_server_pro_app_settings block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_server_pro_app_settings SagemakerDomain#r_studio_server_pro_app_settings}
         * @return {@code this}
         */
        public Builder rStudioServerProAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings rStudioServerProAppSettings) {
            this.rStudioServerProAppSettings = rStudioServerProAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_groups SagemakerDomain#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getSharingSettings}
         * @param sharingSettings sharing_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#sharing_settings SagemakerDomain#sharing_settings}
         * @return {@code this}
         */
        public Builder sharingSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings sharingSettings) {
            this.sharingSettings = sharingSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getSpaceStorageSettings}
         * @param spaceStorageSettings space_storage_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#space_storage_settings SagemakerDomain#space_storage_settings}
         * @return {@code this}
         */
        public Builder spaceStorageSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings spaceStorageSettings) {
            this.spaceStorageSettings = spaceStorageSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getStudioWebPortal}
         * @param studioWebPortal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#studio_web_portal SagemakerDomain#studio_web_portal}.
         * @return {@code this}
         */
        public Builder studioWebPortal(java.lang.String studioWebPortal) {
            this.studioWebPortal = studioWebPortal;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getStudioWebPortalSettings}
         * @param studioWebPortalSettings studio_web_portal_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#studio_web_portal_settings SagemakerDomain#studio_web_portal_settings}
         * @return {@code this}
         */
        public Builder studioWebPortalSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings studioWebPortalSettings) {
            this.studioWebPortalSettings = studioWebPortalSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettings#getTensorBoardAppSettings}
         * @param tensorBoardAppSettings tensor_board_app_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tensor_board_app_settings SagemakerDomain#tensor_board_app_settings}
         * @return {@code this}
         */
        public Builder tensorBoardAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings tensorBoardAppSettings) {
            this.tensorBoardAppSettings = tensorBoardAppSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettings {
        private final java.lang.String executionRole;
        private final java.lang.String autoMountHomeEfs;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings canvasAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings codeEditorAppSettings;
        private final java.lang.Object customFileSystemConfig;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig customPosixUserConfig;
        private final java.lang.String defaultLandingUri;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings jupyterLabAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings jupyterServerAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings rSessionAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings rStudioServerProAppSettings;
        private final java.util.List<java.lang.String> securityGroups;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings sharingSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings spaceStorageSettings;
        private final java.lang.String studioWebPortal;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings studioWebPortalSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings tensorBoardAppSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoMountHomeEfs = software.amazon.jsii.Kernel.get(this, "autoMountHomeEfs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.canvasAppSettings = software.amazon.jsii.Kernel.get(this, "canvasAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings.class));
            this.codeEditorAppSettings = software.amazon.jsii.Kernel.get(this, "codeEditorAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings.class));
            this.customFileSystemConfig = software.amazon.jsii.Kernel.get(this, "customFileSystemConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customPosixUserConfig = software.amazon.jsii.Kernel.get(this, "customPosixUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig.class));
            this.defaultLandingUri = software.amazon.jsii.Kernel.get(this, "defaultLandingUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jupyterLabAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings.class));
            this.jupyterServerAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings.class));
            this.kernelGatewayAppSettings = software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings.class));
            this.rSessionAppSettings = software.amazon.jsii.Kernel.get(this, "rSessionAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings.class));
            this.rStudioServerProAppSettings = software.amazon.jsii.Kernel.get(this, "rStudioServerProAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sharingSettings = software.amazon.jsii.Kernel.get(this, "sharingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings.class));
            this.spaceStorageSettings = software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings.class));
            this.studioWebPortal = software.amazon.jsii.Kernel.get(this, "studioWebPortal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.studioWebPortalSettings = software.amazon.jsii.Kernel.get(this, "studioWebPortalSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings.class));
            this.tensorBoardAppSettings = software.amazon.jsii.Kernel.get(this, "tensorBoardAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executionRole = java.util.Objects.requireNonNull(builder.executionRole, "executionRole is required");
            this.autoMountHomeEfs = builder.autoMountHomeEfs;
            this.canvasAppSettings = builder.canvasAppSettings;
            this.codeEditorAppSettings = builder.codeEditorAppSettings;
            this.customFileSystemConfig = builder.customFileSystemConfig;
            this.customPosixUserConfig = builder.customPosixUserConfig;
            this.defaultLandingUri = builder.defaultLandingUri;
            this.jupyterLabAppSettings = builder.jupyterLabAppSettings;
            this.jupyterServerAppSettings = builder.jupyterServerAppSettings;
            this.kernelGatewayAppSettings = builder.kernelGatewayAppSettings;
            this.rSessionAppSettings = builder.rSessionAppSettings;
            this.rStudioServerProAppSettings = builder.rStudioServerProAppSettings;
            this.securityGroups = builder.securityGroups;
            this.sharingSettings = builder.sharingSettings;
            this.spaceStorageSettings = builder.spaceStorageSettings;
            this.studioWebPortal = builder.studioWebPortal;
            this.studioWebPortalSettings = builder.studioWebPortalSettings;
            this.tensorBoardAppSettings = builder.tensorBoardAppSettings;
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.String getAutoMountHomeEfs() {
            return this.autoMountHomeEfs;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettings getCanvasAppSettings() {
            return this.canvasAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettings getCodeEditorAppSettings() {
            return this.codeEditorAppSettings;
        }

        @Override
        public final java.lang.Object getCustomFileSystemConfig() {
            return this.customFileSystemConfig;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCustomPosixUserConfig getCustomPosixUserConfig() {
            return this.customPosixUserConfig;
        }

        @Override
        public final java.lang.String getDefaultLandingUri() {
            return this.defaultLandingUri;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
            return this.jupyterLabAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
            return this.jupyterServerAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
            return this.kernelGatewayAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRSessionAppSettings getRSessionAppSettings() {
            return this.rSessionAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings getRStudioServerProAppSettings() {
            return this.rStudioServerProAppSettings;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSharingSettings getSharingSettings() {
            return this.sharingSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings getSpaceStorageSettings() {
            return this.spaceStorageSettings;
        }

        @Override
        public final java.lang.String getStudioWebPortal() {
            return this.studioWebPortal;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings getStudioWebPortalSettings() {
            return this.studioWebPortalSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings getTensorBoardAppSettings() {
            return this.tensorBoardAppSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            if (this.getAutoMountHomeEfs() != null) {
                data.set("autoMountHomeEfs", om.valueToTree(this.getAutoMountHomeEfs()));
            }
            if (this.getCanvasAppSettings() != null) {
                data.set("canvasAppSettings", om.valueToTree(this.getCanvasAppSettings()));
            }
            if (this.getCodeEditorAppSettings() != null) {
                data.set("codeEditorAppSettings", om.valueToTree(this.getCodeEditorAppSettings()));
            }
            if (this.getCustomFileSystemConfig() != null) {
                data.set("customFileSystemConfig", om.valueToTree(this.getCustomFileSystemConfig()));
            }
            if (this.getCustomPosixUserConfig() != null) {
                data.set("customPosixUserConfig", om.valueToTree(this.getCustomPosixUserConfig()));
            }
            if (this.getDefaultLandingUri() != null) {
                data.set("defaultLandingUri", om.valueToTree(this.getDefaultLandingUri()));
            }
            if (this.getJupyterLabAppSettings() != null) {
                data.set("jupyterLabAppSettings", om.valueToTree(this.getJupyterLabAppSettings()));
            }
            if (this.getJupyterServerAppSettings() != null) {
                data.set("jupyterServerAppSettings", om.valueToTree(this.getJupyterServerAppSettings()));
            }
            if (this.getKernelGatewayAppSettings() != null) {
                data.set("kernelGatewayAppSettings", om.valueToTree(this.getKernelGatewayAppSettings()));
            }
            if (this.getRSessionAppSettings() != null) {
                data.set("rSessionAppSettings", om.valueToTree(this.getRSessionAppSettings()));
            }
            if (this.getRStudioServerProAppSettings() != null) {
                data.set("rStudioServerProAppSettings", om.valueToTree(this.getRStudioServerProAppSettings()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSharingSettings() != null) {
                data.set("sharingSettings", om.valueToTree(this.getSharingSettings()));
            }
            if (this.getSpaceStorageSettings() != null) {
                data.set("spaceStorageSettings", om.valueToTree(this.getSpaceStorageSettings()));
            }
            if (this.getStudioWebPortal() != null) {
                data.set("studioWebPortal", om.valueToTree(this.getStudioWebPortal()));
            }
            if (this.getStudioWebPortalSettings() != null) {
                data.set("studioWebPortalSettings", om.valueToTree(this.getStudioWebPortalSettings()));
            }
            if (this.getTensorBoardAppSettings() != null) {
                data.set("tensorBoardAppSettings", om.valueToTree(this.getTensorBoardAppSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettings.Jsii$Proxy) o;

            if (!executionRole.equals(that.executionRole)) return false;
            if (this.autoMountHomeEfs != null ? !this.autoMountHomeEfs.equals(that.autoMountHomeEfs) : that.autoMountHomeEfs != null) return false;
            if (this.canvasAppSettings != null ? !this.canvasAppSettings.equals(that.canvasAppSettings) : that.canvasAppSettings != null) return false;
            if (this.codeEditorAppSettings != null ? !this.codeEditorAppSettings.equals(that.codeEditorAppSettings) : that.codeEditorAppSettings != null) return false;
            if (this.customFileSystemConfig != null ? !this.customFileSystemConfig.equals(that.customFileSystemConfig) : that.customFileSystemConfig != null) return false;
            if (this.customPosixUserConfig != null ? !this.customPosixUserConfig.equals(that.customPosixUserConfig) : that.customPosixUserConfig != null) return false;
            if (this.defaultLandingUri != null ? !this.defaultLandingUri.equals(that.defaultLandingUri) : that.defaultLandingUri != null) return false;
            if (this.jupyterLabAppSettings != null ? !this.jupyterLabAppSettings.equals(that.jupyterLabAppSettings) : that.jupyterLabAppSettings != null) return false;
            if (this.jupyterServerAppSettings != null ? !this.jupyterServerAppSettings.equals(that.jupyterServerAppSettings) : that.jupyterServerAppSettings != null) return false;
            if (this.kernelGatewayAppSettings != null ? !this.kernelGatewayAppSettings.equals(that.kernelGatewayAppSettings) : that.kernelGatewayAppSettings != null) return false;
            if (this.rSessionAppSettings != null ? !this.rSessionAppSettings.equals(that.rSessionAppSettings) : that.rSessionAppSettings != null) return false;
            if (this.rStudioServerProAppSettings != null ? !this.rStudioServerProAppSettings.equals(that.rStudioServerProAppSettings) : that.rStudioServerProAppSettings != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.sharingSettings != null ? !this.sharingSettings.equals(that.sharingSettings) : that.sharingSettings != null) return false;
            if (this.spaceStorageSettings != null ? !this.spaceStorageSettings.equals(that.spaceStorageSettings) : that.spaceStorageSettings != null) return false;
            if (this.studioWebPortal != null ? !this.studioWebPortal.equals(that.studioWebPortal) : that.studioWebPortal != null) return false;
            if (this.studioWebPortalSettings != null ? !this.studioWebPortalSettings.equals(that.studioWebPortalSettings) : that.studioWebPortalSettings != null) return false;
            return this.tensorBoardAppSettings != null ? this.tensorBoardAppSettings.equals(that.tensorBoardAppSettings) : that.tensorBoardAppSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.executionRole.hashCode();
            result = 31 * result + (this.autoMountHomeEfs != null ? this.autoMountHomeEfs.hashCode() : 0);
            result = 31 * result + (this.canvasAppSettings != null ? this.canvasAppSettings.hashCode() : 0);
            result = 31 * result + (this.codeEditorAppSettings != null ? this.codeEditorAppSettings.hashCode() : 0);
            result = 31 * result + (this.customFileSystemConfig != null ? this.customFileSystemConfig.hashCode() : 0);
            result = 31 * result + (this.customPosixUserConfig != null ? this.customPosixUserConfig.hashCode() : 0);
            result = 31 * result + (this.defaultLandingUri != null ? this.defaultLandingUri.hashCode() : 0);
            result = 31 * result + (this.jupyterLabAppSettings != null ? this.jupyterLabAppSettings.hashCode() : 0);
            result = 31 * result + (this.jupyterServerAppSettings != null ? this.jupyterServerAppSettings.hashCode() : 0);
            result = 31 * result + (this.kernelGatewayAppSettings != null ? this.kernelGatewayAppSettings.hashCode() : 0);
            result = 31 * result + (this.rSessionAppSettings != null ? this.rSessionAppSettings.hashCode() : 0);
            result = 31 * result + (this.rStudioServerProAppSettings != null ? this.rStudioServerProAppSettings.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.sharingSettings != null ? this.sharingSettings.hashCode() : 0);
            result = 31 * result + (this.spaceStorageSettings != null ? this.spaceStorageSettings.hashCode() : 0);
            result = 31 * result + (this.studioWebPortal != null ? this.studioWebPortal.hashCode() : 0);
            result = 31 * result + (this.studioWebPortalSettings != null ? this.studioWebPortalSettings.hashCode() : 0);
            result = 31 * result + (this.tensorBoardAppSettings != null ? this.tensorBoardAppSettings.hashCode() : 0);
            return result;
        }
    }
}
