package imports.aws.api_gateway_domain_name;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayDomainName.ApiGatewayDomainNameEndpointConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayDomainNameEndpointConfiguration.Jsii$Proxy.class)
public interface ApiGatewayDomainNameEndpointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#types ApiGatewayDomainName#types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTypes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ip_address_type ApiGatewayDomainName#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayDomainNameEndpointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayDomainNameEndpointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayDomainNameEndpointConfiguration> {
        java.util.List<java.lang.String> types;
        java.lang.String ipAddressType;

        /**
         * Sets the value of {@link ApiGatewayDomainNameEndpointConfiguration#getTypes}
         * @param types Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#types ApiGatewayDomainName#types}. This parameter is required.
         * @return {@code this}
         */
        public Builder types(java.util.List<java.lang.String> types) {
            this.types = types;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameEndpointConfiguration#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ip_address_type ApiGatewayDomainName#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayDomainNameEndpointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayDomainNameEndpointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayDomainNameEndpointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayDomainNameEndpointConfiguration {
        private final java.util.List<java.lang.String> types;
        private final java.lang.String ipAddressType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.types = software.amazon.jsii.Kernel.get(this, "types", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.types = java.util.Objects.requireNonNull(builder.types, "types is required");
            this.ipAddressType = builder.ipAddressType;
        }

        @Override
        public final java.util.List<java.lang.String> getTypes() {
            return this.types;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("types", om.valueToTree(this.getTypes()));
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayDomainName.ApiGatewayDomainNameEndpointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayDomainNameEndpointConfiguration.Jsii$Proxy that = (ApiGatewayDomainNameEndpointConfiguration.Jsii$Proxy) o;

            if (!types.equals(that.types)) return false;
            return this.ipAddressType != null ? this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.types.hashCode();
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            return result;
        }
    }
}
