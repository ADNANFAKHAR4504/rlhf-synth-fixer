package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role SagemakerDomain#execution_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole();

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
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig getCustomPosixUserConfig() {
        return null;
    }

    /**
     * jupyter_lab_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_lab_app_settings SagemakerDomain#jupyter_lab_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
        return null;
    }

    /**
     * jupyter_server_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_server_app_settings SagemakerDomain#jupyter_server_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
        return null;
    }

    /**
     * kernel_gateway_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kernel_gateway_app_settings SagemakerDomain#kernel_gateway_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_groups SagemakerDomain#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * space_storage_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#space_storage_settings SagemakerDomain#space_storage_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings getSpaceStorageSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettings> {
        java.lang.String executionRole;
        java.lang.Object customFileSystemConfig;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig customPosixUserConfig;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        java.util.List<java.lang.String> securityGroups;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings spaceStorageSettings;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role SagemakerDomain#execution_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getCustomFileSystemConfig}
         * @param customFileSystemConfig custom_file_system_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_file_system_config SagemakerDomain#custom_file_system_config}
         * @return {@code this}
         */
        public Builder customFileSystemConfig(com.hashicorp.cdktf.IResolvable customFileSystemConfig) {
            this.customFileSystemConfig = customFileSystemConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getCustomFileSystemConfig}
         * @param customFileSystemConfig custom_file_system_config block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_file_system_config SagemakerDomain#custom_file_system_config}
         * @return {@code this}
         */
        public Builder customFileSystemConfig(java.util.List<? extends imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig> customFileSystemConfig) {
            this.customFileSystemConfig = customFileSystemConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getCustomPosixUserConfig}
         * @param customPosixUserConfig custom_posix_user_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#custom_posix_user_config SagemakerDomain#custom_posix_user_config}
         * @return {@code this}
         */
        public Builder customPosixUserConfig(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig customPosixUserConfig) {
            this.customPosixUserConfig = customPosixUserConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getJupyterLabAppSettings}
         * @param jupyterLabAppSettings jupyter_lab_app_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_lab_app_settings SagemakerDomain#jupyter_lab_app_settings}
         * @return {@code this}
         */
        public Builder jupyterLabAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings) {
            this.jupyterLabAppSettings = jupyterLabAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getJupyterServerAppSettings}
         * @param jupyterServerAppSettings jupyter_server_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#jupyter_server_app_settings SagemakerDomain#jupyter_server_app_settings}
         * @return {@code this}
         */
        public Builder jupyterServerAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings) {
            this.jupyterServerAppSettings = jupyterServerAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getKernelGatewayAppSettings}
         * @param kernelGatewayAppSettings kernel_gateway_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kernel_gateway_app_settings SagemakerDomain#kernel_gateway_app_settings}
         * @return {@code this}
         */
        public Builder kernelGatewayAppSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings) {
            this.kernelGatewayAppSettings = kernelGatewayAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_groups SagemakerDomain#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettings#getSpaceStorageSettings}
         * @param spaceStorageSettings space_storage_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#space_storage_settings SagemakerDomain#space_storage_settings}
         * @return {@code this}
         */
        public Builder spaceStorageSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings spaceStorageSettings) {
            this.spaceStorageSettings = spaceStorageSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettings {
        private final java.lang.String executionRole;
        private final java.lang.Object customFileSystemConfig;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig customPosixUserConfig;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        private final java.util.List<java.lang.String> securityGroups;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings spaceStorageSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customFileSystemConfig = software.amazon.jsii.Kernel.get(this, "customFileSystemConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customPosixUserConfig = software.amazon.jsii.Kernel.get(this, "customPosixUserConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig.class));
            this.jupyterLabAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings.class));
            this.jupyterServerAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings.class));
            this.kernelGatewayAppSettings = software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.spaceStorageSettings = software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executionRole = java.util.Objects.requireNonNull(builder.executionRole, "executionRole is required");
            this.customFileSystemConfig = builder.customFileSystemConfig;
            this.customPosixUserConfig = builder.customPosixUserConfig;
            this.jupyterLabAppSettings = builder.jupyterLabAppSettings;
            this.jupyterServerAppSettings = builder.jupyterServerAppSettings;
            this.kernelGatewayAppSettings = builder.kernelGatewayAppSettings;
            this.securityGroups = builder.securityGroups;
            this.spaceStorageSettings = builder.spaceStorageSettings;
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.Object getCustomFileSystemConfig() {
            return this.customFileSystemConfig;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomPosixUserConfig getCustomPosixUserConfig() {
            return this.customPosixUserConfig;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
            return this.jupyterLabAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
            return this.jupyterServerAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
            return this.kernelGatewayAppSettings;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsSpaceStorageSettings getSpaceStorageSettings() {
            return this.spaceStorageSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            if (this.getCustomFileSystemConfig() != null) {
                data.set("customFileSystemConfig", om.valueToTree(this.getCustomFileSystemConfig()));
            }
            if (this.getCustomPosixUserConfig() != null) {
                data.set("customPosixUserConfig", om.valueToTree(this.getCustomPosixUserConfig()));
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
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSpaceStorageSettings() != null) {
                data.set("spaceStorageSettings", om.valueToTree(this.getSpaceStorageSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettings.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettings.Jsii$Proxy) o;

            if (!executionRole.equals(that.executionRole)) return false;
            if (this.customFileSystemConfig != null ? !this.customFileSystemConfig.equals(that.customFileSystemConfig) : that.customFileSystemConfig != null) return false;
            if (this.customPosixUserConfig != null ? !this.customPosixUserConfig.equals(that.customPosixUserConfig) : that.customPosixUserConfig != null) return false;
            if (this.jupyterLabAppSettings != null ? !this.jupyterLabAppSettings.equals(that.jupyterLabAppSettings) : that.jupyterLabAppSettings != null) return false;
            if (this.jupyterServerAppSettings != null ? !this.jupyterServerAppSettings.equals(that.jupyterServerAppSettings) : that.jupyterServerAppSettings != null) return false;
            if (this.kernelGatewayAppSettings != null ? !this.kernelGatewayAppSettings.equals(that.kernelGatewayAppSettings) : that.kernelGatewayAppSettings != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            return this.spaceStorageSettings != null ? this.spaceStorageSettings.equals(that.spaceStorageSettings) : that.spaceStorageSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.executionRole.hashCode();
            result = 31 * result + (this.customFileSystemConfig != null ? this.customFileSystemConfig.hashCode() : 0);
            result = 31 * result + (this.customPosixUserConfig != null ? this.customPosixUserConfig.hashCode() : 0);
            result = 31 * result + (this.jupyterLabAppSettings != null ? this.jupyterLabAppSettings.hashCode() : 0);
            result = 31 * result + (this.jupyterServerAppSettings != null ? this.jupyterServerAppSettings.hashCode() : 0);
            result = 31 * result + (this.kernelGatewayAppSettings != null ? this.kernelGatewayAppSettings.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.spaceStorageSettings != null ? this.spaceStorageSettings.hashCode() : 0);
            return result;
        }
    }
}
