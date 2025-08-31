package imports.aws.api_gateway_rest_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.957Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayRestApi.ApiGatewayRestApiEndpointConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayRestApiEndpointConfiguration.Jsii$Proxy.class)
public interface ApiGatewayRestApiEndpointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#types ApiGatewayRestApi#types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTypes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#ip_address_type ApiGatewayRestApi#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#vpc_endpoint_ids ApiGatewayRestApi#vpc_endpoint_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcEndpointIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayRestApiEndpointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayRestApiEndpointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayRestApiEndpointConfiguration> {
        java.util.List<java.lang.String> types;
        java.lang.String ipAddressType;
        java.util.List<java.lang.String> vpcEndpointIds;

        /**
         * Sets the value of {@link ApiGatewayRestApiEndpointConfiguration#getTypes}
         * @param types Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#types ApiGatewayRestApi#types}. This parameter is required.
         * @return {@code this}
         */
        public Builder types(java.util.List<java.lang.String> types) {
            this.types = types;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiEndpointConfiguration#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#ip_address_type ApiGatewayRestApi#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayRestApiEndpointConfiguration#getVpcEndpointIds}
         * @param vpcEndpointIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api#vpc_endpoint_ids ApiGatewayRestApi#vpc_endpoint_ids}.
         * @return {@code this}
         */
        public Builder vpcEndpointIds(java.util.List<java.lang.String> vpcEndpointIds) {
            this.vpcEndpointIds = vpcEndpointIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayRestApiEndpointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayRestApiEndpointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayRestApiEndpointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayRestApiEndpointConfiguration {
        private final java.util.List<java.lang.String> types;
        private final java.lang.String ipAddressType;
        private final java.util.List<java.lang.String> vpcEndpointIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.types = software.amazon.jsii.Kernel.get(this, "types", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcEndpointIds = software.amazon.jsii.Kernel.get(this, "vpcEndpointIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.types = java.util.Objects.requireNonNull(builder.types, "types is required");
            this.ipAddressType = builder.ipAddressType;
            this.vpcEndpointIds = builder.vpcEndpointIds;
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
        public final java.util.List<java.lang.String> getVpcEndpointIds() {
            return this.vpcEndpointIds;
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
            if (this.getVpcEndpointIds() != null) {
                data.set("vpcEndpointIds", om.valueToTree(this.getVpcEndpointIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayRestApi.ApiGatewayRestApiEndpointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayRestApiEndpointConfiguration.Jsii$Proxy that = (ApiGatewayRestApiEndpointConfiguration.Jsii$Proxy) o;

            if (!types.equals(that.types)) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            return this.vpcEndpointIds != null ? this.vpcEndpointIds.equals(that.vpcEndpointIds) : that.vpcEndpointIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.types.hashCode();
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointIds != null ? this.vpcEndpointIds.hashCode() : 0);
            return result;
        }
    }
}
