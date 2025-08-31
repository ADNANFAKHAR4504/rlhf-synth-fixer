package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.342Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettingsJupyterServerAppSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettingsJupyterServerAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec getDefaultResourceSpec();

    /**
     * code_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeRepository() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLifecycleConfigArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettingsJupyterServerAppSettings> {
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec;
        java.lang.Object codeRepository;
        java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(com.hashicorp.cdktf.IResolvable codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(java.util.List<? extends imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository> codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings#getLifecycleConfigArns}
         * @param lifecycleConfigArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
         * @return {@code this}
         */
        public Builder lifecycleConfigArns(java.util.List<java.lang.String> lifecycleConfigArns) {
            this.lifecycleConfigArns = lifecycleConfigArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettingsJupyterServerAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettingsJupyterServerAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettingsJupyterServerAppSettings {
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final java.lang.Object codeRepository;
        private final java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec.class));
            this.codeRepository = software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lifecycleConfigArns = software.amazon.jsii.Kernel.get(this, "lifecycleConfigArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultResourceSpec = java.util.Objects.requireNonNull(builder.defaultResourceSpec, "defaultResourceSpec is required");
            this.codeRepository = builder.codeRepository;
            this.lifecycleConfigArns = builder.lifecycleConfigArns;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final java.lang.Object getCodeRepository() {
            return this.codeRepository;
        }

        @Override
        public final java.util.List<java.lang.String> getLifecycleConfigArns() {
            return this.lifecycleConfigArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            if (this.getCodeRepository() != null) {
                data.set("codeRepository", om.valueToTree(this.getCodeRepository()));
            }
            if (this.getLifecycleConfigArns() != null) {
                data.set("lifecycleConfigArns", om.valueToTree(this.getLifecycleConfigArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettingsJupyterServerAppSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSettingsJupyterServerAppSettings.Jsii$Proxy) o;

            if (!defaultResourceSpec.equals(that.defaultResourceSpec)) return false;
            if (this.codeRepository != null ? !this.codeRepository.equals(that.codeRepository) : that.codeRepository != null) return false;
            return this.lifecycleConfigArns != null ? this.lifecycleConfigArns.equals(that.lifecycleConfigArns) : that.lifecycleConfigArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultResourceSpec.hashCode();
            result = 31 * result + (this.codeRepository != null ? this.codeRepository.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfigArns != null ? this.lifecycleConfigArns.hashCode() : 0);
            return result;
        }
    }
}
