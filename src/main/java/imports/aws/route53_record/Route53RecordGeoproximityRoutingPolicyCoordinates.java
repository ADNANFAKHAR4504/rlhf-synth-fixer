package imports.aws.route53_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53RecordGeoproximityRoutingPolicyCoordinates")
@software.amazon.jsii.Jsii.Proxy(Route53RecordGeoproximityRoutingPolicyCoordinates.Jsii$Proxy.class)
public interface Route53RecordGeoproximityRoutingPolicyCoordinates extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#latitude Route53Record#latitude}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLatitude();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#longitude Route53Record#longitude}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLongitude();

    /**
     * @return a {@link Builder} of {@link Route53RecordGeoproximityRoutingPolicyCoordinates}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordGeoproximityRoutingPolicyCoordinates}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordGeoproximityRoutingPolicyCoordinates> {
        java.lang.String latitude;
        java.lang.String longitude;

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicyCoordinates#getLatitude}
         * @param latitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#latitude Route53Record#latitude}. This parameter is required.
         * @return {@code this}
         */
        public Builder latitude(java.lang.String latitude) {
            this.latitude = latitude;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicyCoordinates#getLongitude}
         * @param longitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#longitude Route53Record#longitude}. This parameter is required.
         * @return {@code this}
         */
        public Builder longitude(java.lang.String longitude) {
            this.longitude = longitude;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordGeoproximityRoutingPolicyCoordinates}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordGeoproximityRoutingPolicyCoordinates build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordGeoproximityRoutingPolicyCoordinates}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordGeoproximityRoutingPolicyCoordinates {
        private final java.lang.String latitude;
        private final java.lang.String longitude;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.latitude = software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longitude = software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.latitude = java.util.Objects.requireNonNull(builder.latitude, "latitude is required");
            this.longitude = java.util.Objects.requireNonNull(builder.longitude, "longitude is required");
        }

        @Override
        public final java.lang.String getLatitude() {
            return this.latitude;
        }

        @Override
        public final java.lang.String getLongitude() {
            return this.longitude;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("latitude", om.valueToTree(this.getLatitude()));
            data.set("longitude", om.valueToTree(this.getLongitude()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53Record.Route53RecordGeoproximityRoutingPolicyCoordinates"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordGeoproximityRoutingPolicyCoordinates.Jsii$Proxy that = (Route53RecordGeoproximityRoutingPolicyCoordinates.Jsii$Proxy) o;

            if (!latitude.equals(that.latitude)) return false;
            return this.longitude.equals(that.longitude);
        }

        @Override
        public final int hashCode() {
            int result = this.latitude.hashCode();
            result = 31 * result + (this.longitude.hashCode());
            return result;
        }
    }
}
