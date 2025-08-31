package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettingsJupyterLabAppSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettingsJupyterLabAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec getDefaultResourceSpec();

    /**
     * app_lifecycle_management block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
        return null;
    }

    /**
     * code_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeRepository() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettingsJupyterLabAppSettings> {
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement;
        java.lang.Object codeRepository;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings#getAppLifecycleManagement}
         * @param appLifecycleManagement app_lifecycle_management block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
         * @return {@code this}
         */
        public Builder appLifecycleManagement(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement) {
            this.appLifecycleManagement = appLifecycleManagement;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(com.hashicorp.cdktf.IResolvable codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(java.util.List<? extends imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository> codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettingsJupyterLabAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettingsJupyterLabAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettingsJupyterLabAppSettings {
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement;
        private final java.lang.Object codeRepository;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec.class));
            this.appLifecycleManagement = software.amazon.jsii.Kernel.get(this, "appLifecycleManagement", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement.class));
            this.codeRepository = software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultResourceSpec = java.util.Objects.requireNonNull(builder.defaultResourceSpec, "defaultResourceSpec is required");
            this.appLifecycleManagement = builder.appLifecycleManagement;
            this.codeRepository = builder.codeRepository;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
            return this.appLifecycleManagement;
        }

        @Override
        public final java.lang.Object getCodeRepository() {
            return this.codeRepository;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            if (this.getAppLifecycleManagement() != null) {
                data.set("appLifecycleManagement", om.valueToTree(this.getAppLifecycleManagement()));
            }
            if (this.getCodeRepository() != null) {
                data.set("codeRepository", om.valueToTree(this.getCodeRepository()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettingsJupyterLabAppSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSettingsJupyterLabAppSettings.Jsii$Proxy) o;

            if (!defaultResourceSpec.equals(that.defaultResourceSpec)) return false;
            if (this.appLifecycleManagement != null ? !this.appLifecycleManagement.equals(that.appLifecycleManagement) : that.appLifecycleManagement != null) return false;
            return this.codeRepository != null ? this.codeRepository.equals(that.codeRepository) : that.codeRepository == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultResourceSpec.hashCode();
            result = 31 * result + (this.appLifecycleManagement != null ? this.appLifecycleManagement.hashCode() : 0);
            result = 31 * result + (this.codeRepository != null ? this.codeRepository.hashCode() : 0);
            return result;
        }
    }
}
