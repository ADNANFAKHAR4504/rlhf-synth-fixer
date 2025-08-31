package imports.aws.route53_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53RecordGeoproximityRoutingPolicy")
@software.amazon.jsii.Jsii.Proxy(Route53RecordGeoproximityRoutingPolicy.Jsii$Proxy.class)
public interface Route53RecordGeoproximityRoutingPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#aws_region Route53Record#aws_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#bias Route53Record#bias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBias() {
        return null;
    }

    /**
     * coordinates block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#coordinates Route53Record#coordinates}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCoordinates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#local_zone_group Route53Record#local_zone_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalZoneGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecordGeoproximityRoutingPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordGeoproximityRoutingPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordGeoproximityRoutingPolicy> {
        java.lang.String awsRegion;
        java.lang.Number bias;
        java.lang.Object coordinates;
        java.lang.String localZoneGroup;

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicy#getAwsRegion}
         * @param awsRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#aws_region Route53Record#aws_region}.
         * @return {@code this}
         */
        public Builder awsRegion(java.lang.String awsRegion) {
            this.awsRegion = awsRegion;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicy#getBias}
         * @param bias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#bias Route53Record#bias}.
         * @return {@code this}
         */
        public Builder bias(java.lang.Number bias) {
            this.bias = bias;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicy#getCoordinates}
         * @param coordinates coordinates block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#coordinates Route53Record#coordinates}
         * @return {@code this}
         */
        public Builder coordinates(com.hashicorp.cdktf.IResolvable coordinates) {
            this.coordinates = coordinates;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicy#getCoordinates}
         * @param coordinates coordinates block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#coordinates Route53Record#coordinates}
         * @return {@code this}
         */
        public Builder coordinates(java.util.List<? extends imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicyCoordinates> coordinates) {
            this.coordinates = coordinates;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordGeoproximityRoutingPolicy#getLocalZoneGroup}
         * @param localZoneGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#local_zone_group Route53Record#local_zone_group}.
         * @return {@code this}
         */
        public Builder localZoneGroup(java.lang.String localZoneGroup) {
            this.localZoneGroup = localZoneGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordGeoproximityRoutingPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordGeoproximityRoutingPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordGeoproximityRoutingPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordGeoproximityRoutingPolicy {
        private final java.lang.String awsRegion;
        private final java.lang.Number bias;
        private final java.lang.Object coordinates;
        private final java.lang.String localZoneGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsRegion = software.amazon.jsii.Kernel.get(this, "awsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bias = software.amazon.jsii.Kernel.get(this, "bias", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.coordinates = software.amazon.jsii.Kernel.get(this, "coordinates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.localZoneGroup = software.amazon.jsii.Kernel.get(this, "localZoneGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsRegion = builder.awsRegion;
            this.bias = builder.bias;
            this.coordinates = builder.coordinates;
            this.localZoneGroup = builder.localZoneGroup;
        }

        @Override
        public final java.lang.String getAwsRegion() {
            return this.awsRegion;
        }

        @Override
        public final java.lang.Number getBias() {
            return this.bias;
        }

        @Override
        public final java.lang.Object getCoordinates() {
            return this.coordinates;
        }

        @Override
        public final java.lang.String getLocalZoneGroup() {
            return this.localZoneGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAwsRegion() != null) {
                data.set("awsRegion", om.valueToTree(this.getAwsRegion()));
            }
            if (this.getBias() != null) {
                data.set("bias", om.valueToTree(this.getBias()));
            }
            if (this.getCoordinates() != null) {
                data.set("coordinates", om.valueToTree(this.getCoordinates()));
            }
            if (this.getLocalZoneGroup() != null) {
                data.set("localZoneGroup", om.valueToTree(this.getLocalZoneGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53Record.Route53RecordGeoproximityRoutingPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordGeoproximityRoutingPolicy.Jsii$Proxy that = (Route53RecordGeoproximityRoutingPolicy.Jsii$Proxy) o;

            if (this.awsRegion != null ? !this.awsRegion.equals(that.awsRegion) : that.awsRegion != null) return false;
            if (this.bias != null ? !this.bias.equals(that.bias) : that.bias != null) return false;
            if (this.coordinates != null ? !this.coordinates.equals(that.coordinates) : that.coordinates != null) return false;
            return this.localZoneGroup != null ? this.localZoneGroup.equals(that.localZoneGroup) : that.localZoneGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.awsRegion != null ? this.awsRegion.hashCode() : 0;
            result = 31 * result + (this.bias != null ? this.bias.hashCode() : 0);
            result = 31 * result + (this.coordinates != null ? this.coordinates.hashCode() : 0);
            result = 31 * result + (this.localZoneGroup != null ? this.localZoneGroup.hashCode() : 0);
            return result;
        }
    }
}
