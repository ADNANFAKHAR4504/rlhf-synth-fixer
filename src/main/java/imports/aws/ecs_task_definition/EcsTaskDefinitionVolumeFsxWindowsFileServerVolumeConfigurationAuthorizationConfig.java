package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig.Jsii$Proxy.class)
public interface EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#credentials_parameter EcsTaskDefinition#credentials_parameter}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsParameter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#domain EcsTaskDefinition#domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomain();

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig> {
        java.lang.String credentialsParameter;
        java.lang.String domain;

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig#getCredentialsParameter}
         * @param credentialsParameter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#credentials_parameter EcsTaskDefinition#credentials_parameter}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsParameter(java.lang.String credentialsParameter) {
            this.credentialsParameter = credentialsParameter;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#domain EcsTaskDefinition#domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig {
        private final java.lang.String credentialsParameter;
        private final java.lang.String domain;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.credentialsParameter = software.amazon.jsii.Kernel.get(this, "credentialsParameter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.credentialsParameter = java.util.Objects.requireNonNull(builder.credentialsParameter, "credentialsParameter is required");
            this.domain = java.util.Objects.requireNonNull(builder.domain, "domain is required");
        }

        @Override
        public final java.lang.String getCredentialsParameter() {
            return this.credentialsParameter;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("credentialsParameter", om.valueToTree(this.getCredentialsParameter()));
            data.set("domain", om.valueToTree(this.getDomain()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig.Jsii$Proxy that = (EcsTaskDefinitionVolumeFsxWindowsFileServerVolumeConfigurationAuthorizationConfig.Jsii$Proxy) o;

            if (!credentialsParameter.equals(that.credentialsParameter)) return false;
            return this.domain.equals(that.domain);
        }

        @Override
        public final int hashCode() {
            int result = this.credentialsParameter.hashCode();
            result = 31 * result + (this.domain.hashCode());
            return result;
        }
    }
}
