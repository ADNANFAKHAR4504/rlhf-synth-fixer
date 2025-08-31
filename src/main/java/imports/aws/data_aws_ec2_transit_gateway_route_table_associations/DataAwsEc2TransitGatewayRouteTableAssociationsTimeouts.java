package imports.aws.data_aws_ec2_transit_gateway_route_table_associations;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.613Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2TransitGatewayRouteTableAssociations.DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts")
@software.amazon.jsii.Jsii.Proxy(DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts.Jsii$Proxy.class)
public interface DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_transit_gateway_route_table_associations#read DataAwsEc2TransitGatewayRouteTableAssociations#read}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRead() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts> {
        java.lang.String read;

        /**
         * Sets the value of {@link DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts#getRead}
         * @param read Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_transit_gateway_route_table_associations#read DataAwsEc2TransitGatewayRouteTableAssociations#read}.
         * @return {@code this}
         */
        public Builder read(java.lang.String read) {
            this.read = read;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts {
        private final java.lang.String read;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.read = software.amazon.jsii.Kernel.get(this, "read", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.read = builder.read;
        }

        @Override
        public final java.lang.String getRead() {
            return this.read;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRead() != null) {
                data.set("read", om.valueToTree(this.getRead()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEc2TransitGatewayRouteTableAssociations.DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts.Jsii$Proxy that = (DataAwsEc2TransitGatewayRouteTableAssociationsTimeouts.Jsii$Proxy) o;

            return this.read != null ? this.read.equals(that.read) : that.read == null;
        }

        @Override
        public final int hashCode() {
            int result = this.read != null ? this.read.hashCode() : 0;
            return result;
        }
    }
}
