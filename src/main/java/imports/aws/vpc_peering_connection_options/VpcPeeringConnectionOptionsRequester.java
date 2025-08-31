package imports.aws.vpc_peering_connection_options;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.610Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcPeeringConnectionOptions.VpcPeeringConnectionOptionsRequester")
@software.amazon.jsii.Jsii.Proxy(VpcPeeringConnectionOptionsRequester.Jsii$Proxy.class)
public interface VpcPeeringConnectionOptionsRequester extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection_options#allow_remote_vpc_dns_resolution VpcPeeringConnectionOptions#allow_remote_vpc_dns_resolution}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowRemoteVpcDnsResolution() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcPeeringConnectionOptionsRequester}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcPeeringConnectionOptionsRequester}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcPeeringConnectionOptionsRequester> {
        java.lang.Object allowRemoteVpcDnsResolution;

        /**
         * Sets the value of {@link VpcPeeringConnectionOptionsRequester#getAllowRemoteVpcDnsResolution}
         * @param allowRemoteVpcDnsResolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection_options#allow_remote_vpc_dns_resolution VpcPeeringConnectionOptions#allow_remote_vpc_dns_resolution}.
         * @return {@code this}
         */
        public Builder allowRemoteVpcDnsResolution(java.lang.Boolean allowRemoteVpcDnsResolution) {
            this.allowRemoteVpcDnsResolution = allowRemoteVpcDnsResolution;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionOptionsRequester#getAllowRemoteVpcDnsResolution}
         * @param allowRemoteVpcDnsResolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection_options#allow_remote_vpc_dns_resolution VpcPeeringConnectionOptions#allow_remote_vpc_dns_resolution}.
         * @return {@code this}
         */
        public Builder allowRemoteVpcDnsResolution(com.hashicorp.cdktf.IResolvable allowRemoteVpcDnsResolution) {
            this.allowRemoteVpcDnsResolution = allowRemoteVpcDnsResolution;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpcPeeringConnectionOptionsRequester}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcPeeringConnectionOptionsRequester build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcPeeringConnectionOptionsRequester}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcPeeringConnectionOptionsRequester {
        private final java.lang.Object allowRemoteVpcDnsResolution;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowRemoteVpcDnsResolution = software.amazon.jsii.Kernel.get(this, "allowRemoteVpcDnsResolution", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowRemoteVpcDnsResolution = builder.allowRemoteVpcDnsResolution;
        }

        @Override
        public final java.lang.Object getAllowRemoteVpcDnsResolution() {
            return this.allowRemoteVpcDnsResolution;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowRemoteVpcDnsResolution() != null) {
                data.set("allowRemoteVpcDnsResolution", om.valueToTree(this.getAllowRemoteVpcDnsResolution()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpcPeeringConnectionOptions.VpcPeeringConnectionOptionsRequester"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcPeeringConnectionOptionsRequester.Jsii$Proxy that = (VpcPeeringConnectionOptionsRequester.Jsii$Proxy) o;

            return this.allowRemoteVpcDnsResolution != null ? this.allowRemoteVpcDnsResolution.equals(that.allowRemoteVpcDnsResolution) : that.allowRemoteVpcDnsResolution == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowRemoteVpcDnsResolution != null ? this.allowRemoteVpcDnsResolution.hashCode() : 0;
            return result;
        }
    }
}
