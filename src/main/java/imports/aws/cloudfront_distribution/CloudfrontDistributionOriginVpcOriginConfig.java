package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOriginVpcOriginConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionOriginVpcOriginConfig.Jsii$Proxy.class)
public interface CloudfrontDistributionOriginVpcOriginConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#vpc_origin_id CloudfrontDistribution#vpc_origin_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcOriginId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_keepalive_timeout CloudfrontDistribution#origin_keepalive_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOriginKeepaliveTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_read_timeout CloudfrontDistribution#origin_read_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOriginReadTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionOriginVpcOriginConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionOriginVpcOriginConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionOriginVpcOriginConfig> {
        java.lang.String vpcOriginId;
        java.lang.Number originKeepaliveTimeout;
        java.lang.Number originReadTimeout;

        /**
         * Sets the value of {@link CloudfrontDistributionOriginVpcOriginConfig#getVpcOriginId}
         * @param vpcOriginId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#vpc_origin_id CloudfrontDistribution#vpc_origin_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcOriginId(java.lang.String vpcOriginId) {
            this.vpcOriginId = vpcOriginId;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginVpcOriginConfig#getOriginKeepaliveTimeout}
         * @param originKeepaliveTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_keepalive_timeout CloudfrontDistribution#origin_keepalive_timeout}.
         * @return {@code this}
         */
        public Builder originKeepaliveTimeout(java.lang.Number originKeepaliveTimeout) {
            this.originKeepaliveTimeout = originKeepaliveTimeout;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginVpcOriginConfig#getOriginReadTimeout}
         * @param originReadTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_read_timeout CloudfrontDistribution#origin_read_timeout}.
         * @return {@code this}
         */
        public Builder originReadTimeout(java.lang.Number originReadTimeout) {
            this.originReadTimeout = originReadTimeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionOriginVpcOriginConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionOriginVpcOriginConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionOriginVpcOriginConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionOriginVpcOriginConfig {
        private final java.lang.String vpcOriginId;
        private final java.lang.Number originKeepaliveTimeout;
        private final java.lang.Number originReadTimeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.vpcOriginId = software.amazon.jsii.Kernel.get(this, "vpcOriginId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.originKeepaliveTimeout = software.amazon.jsii.Kernel.get(this, "originKeepaliveTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.originReadTimeout = software.amazon.jsii.Kernel.get(this, "originReadTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.vpcOriginId = java.util.Objects.requireNonNull(builder.vpcOriginId, "vpcOriginId is required");
            this.originKeepaliveTimeout = builder.originKeepaliveTimeout;
            this.originReadTimeout = builder.originReadTimeout;
        }

        @Override
        public final java.lang.String getVpcOriginId() {
            return this.vpcOriginId;
        }

        @Override
        public final java.lang.Number getOriginKeepaliveTimeout() {
            return this.originKeepaliveTimeout;
        }

        @Override
        public final java.lang.Number getOriginReadTimeout() {
            return this.originReadTimeout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("vpcOriginId", om.valueToTree(this.getVpcOriginId()));
            if (this.getOriginKeepaliveTimeout() != null) {
                data.set("originKeepaliveTimeout", om.valueToTree(this.getOriginKeepaliveTimeout()));
            }
            if (this.getOriginReadTimeout() != null) {
                data.set("originReadTimeout", om.valueToTree(this.getOriginReadTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionOriginVpcOriginConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionOriginVpcOriginConfig.Jsii$Proxy that = (CloudfrontDistributionOriginVpcOriginConfig.Jsii$Proxy) o;

            if (!vpcOriginId.equals(that.vpcOriginId)) return false;
            if (this.originKeepaliveTimeout != null ? !this.originKeepaliveTimeout.equals(that.originKeepaliveTimeout) : that.originKeepaliveTimeout != null) return false;
            return this.originReadTimeout != null ? this.originReadTimeout.equals(that.originReadTimeout) : that.originReadTimeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.vpcOriginId.hashCode();
            result = 31 * result + (this.originKeepaliveTimeout != null ? this.originKeepaliveTimeout.hashCode() : 0);
            result = 31 * result + (this.originReadTimeout != null ? this.originReadTimeout.hashCode() : 0);
            return result;
        }
    }
}
