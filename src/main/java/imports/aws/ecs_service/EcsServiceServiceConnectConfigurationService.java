package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationService")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfigurationService.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfigurationService extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#port_name EcsService#port_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPortName();

    /**
     * client_alias block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#client_alias EcsService#client_alias}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias getClientAlias() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#discovery_name EcsService#discovery_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDiscoveryName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#ingress_port_override EcsService#ingress_port_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIngressPortOverride() {
        return null;
    }

    /**
     * timeout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#timeout EcsService#timeout}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout getTimeout() {
        return null;
    }

    /**
     * tls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tls EcsService#tls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls getTls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfigurationService}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfigurationService}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfigurationService> {
        java.lang.String portName;
        imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias clientAlias;
        java.lang.String discoveryName;
        java.lang.Number ingressPortOverride;
        imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout timeout;
        imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls tls;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getPortName}
         * @param portName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#port_name EcsService#port_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder portName(java.lang.String portName) {
            this.portName = portName;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getClientAlias}
         * @param clientAlias client_alias block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#client_alias EcsService#client_alias}
         * @return {@code this}
         */
        public Builder clientAlias(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias clientAlias) {
            this.clientAlias = clientAlias;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getDiscoveryName}
         * @param discoveryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#discovery_name EcsService#discovery_name}.
         * @return {@code this}
         */
        public Builder discoveryName(java.lang.String discoveryName) {
            this.discoveryName = discoveryName;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getIngressPortOverride}
         * @param ingressPortOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#ingress_port_override EcsService#ingress_port_override}.
         * @return {@code this}
         */
        public Builder ingressPortOverride(java.lang.Number ingressPortOverride) {
            this.ingressPortOverride = ingressPortOverride;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getTimeout}
         * @param timeout timeout block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#timeout EcsService#timeout}
         * @return {@code this}
         */
        public Builder timeout(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationService#getTls}
         * @param tls tls block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#tls EcsService#tls}
         * @return {@code this}
         */
        public Builder tls(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfigurationService}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfigurationService build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfigurationService}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfigurationService {
        private final java.lang.String portName;
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias clientAlias;
        private final java.lang.String discoveryName;
        private final java.lang.Number ingressPortOverride;
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout timeout;
        private final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls tls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.portName = software.amazon.jsii.Kernel.get(this, "portName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientAlias = software.amazon.jsii.Kernel.get(this, "clientAlias", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias.class));
            this.discoveryName = software.amazon.jsii.Kernel.get(this, "discoveryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ingressPortOverride = software.amazon.jsii.Kernel.get(this, "ingressPortOverride", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout.class));
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.portName = java.util.Objects.requireNonNull(builder.portName, "portName is required");
            this.clientAlias = builder.clientAlias;
            this.discoveryName = builder.discoveryName;
            this.ingressPortOverride = builder.ingressPortOverride;
            this.timeout = builder.timeout;
            this.tls = builder.tls;
        }

        @Override
        public final java.lang.String getPortName() {
            return this.portName;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceClientAlias getClientAlias() {
            return this.clientAlias;
        }

        @Override
        public final java.lang.String getDiscoveryName() {
            return this.discoveryName;
        }

        @Override
        public final java.lang.Number getIngressPortOverride() {
            return this.ingressPortOverride;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout getTimeout() {
            return this.timeout;
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTls getTls() {
            return this.tls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("portName", om.valueToTree(this.getPortName()));
            if (this.getClientAlias() != null) {
                data.set("clientAlias", om.valueToTree(this.getClientAlias()));
            }
            if (this.getDiscoveryName() != null) {
                data.set("discoveryName", om.valueToTree(this.getDiscoveryName()));
            }
            if (this.getIngressPortOverride() != null) {
                data.set("ingressPortOverride", om.valueToTree(this.getIngressPortOverride()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }
            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfigurationService"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfigurationService.Jsii$Proxy that = (EcsServiceServiceConnectConfigurationService.Jsii$Proxy) o;

            if (!portName.equals(that.portName)) return false;
            if (this.clientAlias != null ? !this.clientAlias.equals(that.clientAlias) : that.clientAlias != null) return false;
            if (this.discoveryName != null ? !this.discoveryName.equals(that.discoveryName) : that.discoveryName != null) return false;
            if (this.ingressPortOverride != null ? !this.ingressPortOverride.equals(that.ingressPortOverride) : that.ingressPortOverride != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
            return this.tls != null ? this.tls.equals(that.tls) : that.tls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.portName.hashCode();
            result = 31 * result + (this.clientAlias != null ? this.clientAlias.hashCode() : 0);
            result = 31 * result + (this.discoveryName != null ? this.discoveryName.hashCode() : 0);
            result = 31 * result + (this.ingressPortOverride != null ? this.ingressPortOverride.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            result = 31 * result + (this.tls != null ? this.tls.hashCode() : 0);
            return result;
        }
    }
}
