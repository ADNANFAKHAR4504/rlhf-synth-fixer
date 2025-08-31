package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionOrigin")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionOrigin.Jsii$Proxy.class)
public interface LightsailDistributionOrigin extends software.amazon.jsii.JsiiSerializable {

    /**
     * The name of the origin resource.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * The AWS Region name of the origin resource.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#region_name LightsailDistribution#region_name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegionName();

    /**
     * The protocol that your Amazon Lightsail distribution uses when establishing a connection with your origin to pull content.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#protocol_policy LightsailDistribution#protocol_policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocolPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionOrigin}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionOrigin}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionOrigin> {
        java.lang.String name;
        java.lang.String regionName;
        java.lang.String protocolPolicy;

        /**
         * Sets the value of {@link LightsailDistributionOrigin#getName}
         * @param name The name of the origin resource. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionOrigin#getRegionName}
         * @param regionName The AWS Region name of the origin resource. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#region_name LightsailDistribution#region_name}
         * @return {@code this}
         */
        public Builder regionName(java.lang.String regionName) {
            this.regionName = regionName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionOrigin#getProtocolPolicy}
         * @param protocolPolicy The protocol that your Amazon Lightsail distribution uses when establishing a connection with your origin to pull content.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#protocol_policy LightsailDistribution#protocol_policy}
         * @return {@code this}
         */
        public Builder protocolPolicy(java.lang.String protocolPolicy) {
            this.protocolPolicy = protocolPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionOrigin}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionOrigin build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionOrigin}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionOrigin {
        private final java.lang.String name;
        private final java.lang.String regionName;
        private final java.lang.String protocolPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regionName = software.amazon.jsii.Kernel.get(this, "regionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocolPolicy = software.amazon.jsii.Kernel.get(this, "protocolPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.regionName = java.util.Objects.requireNonNull(builder.regionName, "regionName is required");
            this.protocolPolicy = builder.protocolPolicy;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRegionName() {
            return this.regionName;
        }

        @Override
        public final java.lang.String getProtocolPolicy() {
            return this.protocolPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("regionName", om.valueToTree(this.getRegionName()));
            if (this.getProtocolPolicy() != null) {
                data.set("protocolPolicy", om.valueToTree(this.getProtocolPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionOrigin"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionOrigin.Jsii$Proxy that = (LightsailDistributionOrigin.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!regionName.equals(that.regionName)) return false;
            return this.protocolPolicy != null ? this.protocolPolicy.equals(that.protocolPolicy) : that.protocolPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.regionName.hashCode());
            result = 31 * result + (this.protocolPolicy != null ? this.protocolPolicy.hashCode() : 0);
            return result;
        }
    }
}
