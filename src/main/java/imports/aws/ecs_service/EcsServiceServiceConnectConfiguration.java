package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfiguration.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enabled EcsService#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#log_configuration EcsService#log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration getLogConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#namespace EcsService#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * service block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service EcsService#service}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getService() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfiguration> {
        java.lang.Object enabled;
        imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration logConfiguration;
        java.lang.String namespace;
        java.lang.Object service;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enabled EcsService#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#enabled EcsService#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getLogConfiguration}
         * @param logConfiguration log_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#log_configuration EcsService#log_configuration}
         * @return {@code this}
         */
        public Builder logConfiguration(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration logConfiguration) {
            this.logConfiguration = logConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#namespace EcsService#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getService}
         * @param service service block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service EcsService#service}
         * @return {@code this}
         */
        public Builder service(com.hashicorp.cdktf.IResolvable service) {
            this.service = service;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfiguration#getService}
         * @param service service block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#service EcsService#service}
         * @return {@code this}
         */
        public Builder service(java.util.List<? extends imports.aws.ecs_service.EcsServiceServiceConnectConfigurationService> service) {
            this.service = service;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfiguration {
        private final java.lang.Object enabled;
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration logConfiguration;
        private final java.lang.String namespace;
        private final java.lang.Object service;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logConfiguration = software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.service = software.amazon.jsii.Kernel.get(this, "service", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.logConfiguration = builder.logConfiguration;
            this.namespace = builder.namespace;
            this.service = builder.service;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration getLogConfiguration() {
            return this.logConfiguration;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.Object getService() {
            return this.service;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getLogConfiguration() != null) {
                data.set("logConfiguration", om.valueToTree(this.getLogConfiguration()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }
            if (this.getService() != null) {
                data.set("service", om.valueToTree(this.getService()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfiguration.Jsii$Proxy that = (EcsServiceServiceConnectConfiguration.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.logConfiguration != null ? !this.logConfiguration.equals(that.logConfiguration) : that.logConfiguration != null) return false;
            if (this.namespace != null ? !this.namespace.equals(that.namespace) : that.namespace != null) return false;
            return this.service != null ? this.service.equals(that.service) : that.service == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.logConfiguration != null ? this.logConfiguration.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            result = 31 * result + (this.service != null ? this.service.hashCode() : 0);
            return result;
        }
    }
}
