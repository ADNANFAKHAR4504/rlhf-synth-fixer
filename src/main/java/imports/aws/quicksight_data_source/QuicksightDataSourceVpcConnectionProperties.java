package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceVpcConnectionProperties")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceVpcConnectionProperties.Jsii$Proxy.class)
public interface QuicksightDataSourceVpcConnectionProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#vpc_connection_arn QuicksightDataSource#vpc_connection_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcConnectionArn();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceVpcConnectionProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceVpcConnectionProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceVpcConnectionProperties> {
        java.lang.String vpcConnectionArn;

        /**
         * Sets the value of {@link QuicksightDataSourceVpcConnectionProperties#getVpcConnectionArn}
         * @param vpcConnectionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#vpc_connection_arn QuicksightDataSource#vpc_connection_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcConnectionArn(java.lang.String vpcConnectionArn) {
            this.vpcConnectionArn = vpcConnectionArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceVpcConnectionProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceVpcConnectionProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceVpcConnectionProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceVpcConnectionProperties {
        private final java.lang.String vpcConnectionArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.vpcConnectionArn = software.amazon.jsii.Kernel.get(this, "vpcConnectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.vpcConnectionArn = java.util.Objects.requireNonNull(builder.vpcConnectionArn, "vpcConnectionArn is required");
        }

        @Override
        public final java.lang.String getVpcConnectionArn() {
            return this.vpcConnectionArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("vpcConnectionArn", om.valueToTree(this.getVpcConnectionArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceVpcConnectionProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceVpcConnectionProperties.Jsii$Proxy that = (QuicksightDataSourceVpcConnectionProperties.Jsii$Proxy) o;

            return this.vpcConnectionArn.equals(that.vpcConnectionArn);
        }

        @Override
        public final int hashCode() {
            int result = this.vpcConnectionArn.hashCode();
            return result;
        }
    }
}
