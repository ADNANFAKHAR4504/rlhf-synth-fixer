package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_type SagemakerSpace#app_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAppType() {
        return null;
    }

    /**
     * code_editor_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_editor_app_settings SagemakerSpace#code_editor_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings getCodeEditorAppSettings() {
        return null;
    }

    /**
     * custom_file_system block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomFileSystem() {
        return null;
    }

    /**
     * jupyter_lab_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_lab_app_settings SagemakerSpace#jupyter_lab_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
        return null;
    }

    /**
     * jupyter_server_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_server_app_settings SagemakerSpace#jupyter_server_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
        return null;
    }

    /**
     * kernel_gateway_app_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#kernel_gateway_app_settings SagemakerSpace#kernel_gateway_app_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
        return null;
    }

    /**
     * space_storage_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_storage_settings SagemakerSpace#space_storage_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings getSpaceStorageSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettings> {
        java.lang.String appType;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings codeEditorAppSettings;
        java.lang.Object customFileSystem;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings spaceStorageSettings;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getAppType}
         * @param appType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_type SagemakerSpace#app_type}.
         * @return {@code this}
         */
        public Builder appType(java.lang.String appType) {
            this.appType = appType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getCodeEditorAppSettings}
         * @param codeEditorAppSettings code_editor_app_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_editor_app_settings SagemakerSpace#code_editor_app_settings}
         * @return {@code this}
         */
        public Builder codeEditorAppSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings codeEditorAppSettings) {
            this.codeEditorAppSettings = codeEditorAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getCustomFileSystem}
         * @param customFileSystem custom_file_system block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
         * @return {@code this}
         */
        public Builder customFileSystem(com.hashicorp.cdktf.IResolvable customFileSystem) {
            this.customFileSystem = customFileSystem;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getCustomFileSystem}
         * @param customFileSystem custom_file_system block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
         * @return {@code this}
         */
        public Builder customFileSystem(java.util.List<? extends imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCustomFileSystem> customFileSystem) {
            this.customFileSystem = customFileSystem;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getJupyterLabAppSettings}
         * @param jupyterLabAppSettings jupyter_lab_app_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_lab_app_settings SagemakerSpace#jupyter_lab_app_settings}
         * @return {@code this}
         */
        public Builder jupyterLabAppSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings) {
            this.jupyterLabAppSettings = jupyterLabAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getJupyterServerAppSettings}
         * @param jupyterServerAppSettings jupyter_server_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_server_app_settings SagemakerSpace#jupyter_server_app_settings}
         * @return {@code this}
         */
        public Builder jupyterServerAppSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings) {
            this.jupyterServerAppSettings = jupyterServerAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getKernelGatewayAppSettings}
         * @param kernelGatewayAppSettings kernel_gateway_app_settings block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#kernel_gateway_app_settings SagemakerSpace#kernel_gateway_app_settings}
         * @return {@code this}
         */
        public Builder kernelGatewayAppSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings) {
            this.kernelGatewayAppSettings = kernelGatewayAppSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettings#getSpaceStorageSettings}
         * @param spaceStorageSettings space_storage_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_storage_settings SagemakerSpace#space_storage_settings}
         * @return {@code this}
         */
        public Builder spaceStorageSettings(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings spaceStorageSettings) {
            this.spaceStorageSettings = spaceStorageSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettings {
        private final java.lang.String appType;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings codeEditorAppSettings;
        private final java.lang.Object customFileSystem;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings jupyterLabAppSettings;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings jupyterServerAppSettings;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings kernelGatewayAppSettings;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings spaceStorageSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.appType = software.amazon.jsii.Kernel.get(this, "appType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codeEditorAppSettings = software.amazon.jsii.Kernel.get(this, "codeEditorAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings.class));
            this.customFileSystem = software.amazon.jsii.Kernel.get(this, "customFileSystem", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.jupyterLabAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterLabAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings.class));
            this.jupyterServerAppSettings = software.amazon.jsii.Kernel.get(this, "jupyterServerAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings.class));
            this.kernelGatewayAppSettings = software.amazon.jsii.Kernel.get(this, "kernelGatewayAppSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings.class));
            this.spaceStorageSettings = software.amazon.jsii.Kernel.get(this, "spaceStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.appType = builder.appType;
            this.codeEditorAppSettings = builder.codeEditorAppSettings;
            this.customFileSystem = builder.customFileSystem;
            this.jupyterLabAppSettings = builder.jupyterLabAppSettings;
            this.jupyterServerAppSettings = builder.jupyterServerAppSettings;
            this.kernelGatewayAppSettings = builder.kernelGatewayAppSettings;
            this.spaceStorageSettings = builder.spaceStorageSettings;
        }

        @Override
        public final java.lang.String getAppType() {
            return this.appType;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettings getCodeEditorAppSettings() {
            return this.codeEditorAppSettings;
        }

        @Override
        public final java.lang.Object getCustomFileSystem() {
            return this.customFileSystem;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettings getJupyterLabAppSettings() {
            return this.jupyterLabAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettings getJupyterServerAppSettings() {
            return this.jupyterServerAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings getKernelGatewayAppSettings() {
            return this.kernelGatewayAppSettings;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsSpaceStorageSettings getSpaceStorageSettings() {
            return this.spaceStorageSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAppType() != null) {
                data.set("appType", om.valueToTree(this.getAppType()));
            }
            if (this.getCodeEditorAppSettings() != null) {
                data.set("codeEditorAppSettings", om.valueToTree(this.getCodeEditorAppSettings()));
            }
            if (this.getCustomFileSystem() != null) {
                data.set("customFileSystem", om.valueToTree(this.getCustomFileSystem()));
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
            if (this.getSpaceStorageSettings() != null) {
                data.set("spaceStorageSettings", om.valueToTree(this.getSpaceStorageSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSettings.Jsii$Proxy) o;

            if (this.appType != null ? !this.appType.equals(that.appType) : that.appType != null) return false;
            if (this.codeEditorAppSettings != null ? !this.codeEditorAppSettings.equals(that.codeEditorAppSettings) : that.codeEditorAppSettings != null) return false;
            if (this.customFileSystem != null ? !this.customFileSystem.equals(that.customFileSystem) : that.customFileSystem != null) return false;
            if (this.jupyterLabAppSettings != null ? !this.jupyterLabAppSettings.equals(that.jupyterLabAppSettings) : that.jupyterLabAppSettings != null) return false;
            if (this.jupyterServerAppSettings != null ? !this.jupyterServerAppSettings.equals(that.jupyterServerAppSettings) : that.jupyterServerAppSettings != null) return false;
            if (this.kernelGatewayAppSettings != null ? !this.kernelGatewayAppSettings.equals(that.kernelGatewayAppSettings) : that.kernelGatewayAppSettings != null) return false;
            return this.spaceStorageSettings != null ? this.spaceStorageSettings.equals(that.spaceStorageSettings) : that.spaceStorageSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.appType != null ? this.appType.hashCode() : 0;
            result = 31 * result + (this.codeEditorAppSettings != null ? this.codeEditorAppSettings.hashCode() : 0);
            result = 31 * result + (this.customFileSystem != null ? this.customFileSystem.hashCode() : 0);
            result = 31 * result + (this.jupyterLabAppSettings != null ? this.jupyterLabAppSettings.hashCode() : 0);
            result = 31 * result + (this.jupyterServerAppSettings != null ? this.jupyterServerAppSettings.hashCode() : 0);
            result = 31 * result + (this.kernelGatewayAppSettings != null ? this.kernelGatewayAppSettings.hashCode() : 0);
            result = 31 * result + (this.spaceStorageSettings != null ? this.spaceStorageSettings.hashCode() : 0);
            return result;
        }
    }
}
