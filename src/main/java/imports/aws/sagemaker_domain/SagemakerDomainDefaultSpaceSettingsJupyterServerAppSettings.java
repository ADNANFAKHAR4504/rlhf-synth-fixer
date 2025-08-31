package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * code_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#code_repository SagemakerDomain#code_repository}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeRepository() {
        return null;
    }

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#lifecycle_config_arns SagemakerDomain#lifecycle_config_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLifecycleConfigArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings> {
        java.lang.Object codeRepository;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec;
        java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#code_repository SagemakerDomain#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(com.hashicorp.cdktf.IResolvable codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#code_repository SagemakerDomain#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(java.util.List<? extends imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsCodeRepository> codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings#getLifecycleConfigArns}
         * @param lifecycleConfigArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#lifecycle_config_arns SagemakerDomain#lifecycle_config_arns}.
         * @return {@code this}
         */
        public Builder lifecycleConfigArns(java.util.List<java.lang.String> lifecycleConfigArns) {
            this.lifecycleConfigArns = lifecycleConfigArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings {
        private final java.lang.Object codeRepository;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.codeRepository = software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec.class));
            this.lifecycleConfigArns = software.amazon.jsii.Kernel.get(this, "lifecycleConfigArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.codeRepository = builder.codeRepository;
            this.defaultResourceSpec = builder.defaultResourceSpec;
            this.lifecycleConfigArns = builder.lifecycleConfigArns;
        }

        @Override
        public final java.lang.Object getCodeRepository() {
            return this.codeRepository;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
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

            if (this.getCodeRepository() != null) {
                data.set("codeRepository", om.valueToTree(this.getCodeRepository()));
            }
            if (this.getDefaultResourceSpec() != null) {
                data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            }
            if (this.getLifecycleConfigArns() != null) {
                data.set("lifecycleConfigArns", om.valueToTree(this.getLifecycleConfigArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettings.Jsii$Proxy) o;

            if (this.codeRepository != null ? !this.codeRepository.equals(that.codeRepository) : that.codeRepository != null) return false;
            if (this.defaultResourceSpec != null ? !this.defaultResourceSpec.equals(that.defaultResourceSpec) : that.defaultResourceSpec != null) return false;
            return this.lifecycleConfigArns != null ? this.lifecycleConfigArns.equals(that.lifecycleConfigArns) : that.lifecycleConfigArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.codeRepository != null ? this.codeRepository.hashCode() : 0;
            result = 31 * result + (this.defaultResourceSpec != null ? this.defaultResourceSpec.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfigArns != null ? this.lifecycleConfigArns.hashCode() : 0);
            return result;
        }
    }
}
