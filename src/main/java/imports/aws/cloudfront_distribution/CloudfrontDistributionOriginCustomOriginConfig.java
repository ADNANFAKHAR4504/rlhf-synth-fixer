package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.236Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOriginCustomOriginConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionOriginCustomOriginConfig.Jsii$Proxy.class)
public interface CloudfrontDistributionOriginCustomOriginConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#http_port CloudfrontDistribution#http_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHttpPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#https_port CloudfrontDistribution#https_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHttpsPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_protocol_policy CloudfrontDistribution#origin_protocol_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOriginProtocolPolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_ssl_protocols CloudfrontDistribution#origin_ssl_protocols}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOriginSslProtocols();

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
     * @return a {@link Builder} of {@link CloudfrontDistributionOriginCustomOriginConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionOriginCustomOriginConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionOriginCustomOriginConfig> {
        java.lang.Number httpPort;
        java.lang.Number httpsPort;
        java.lang.String originProtocolPolicy;
        java.util.List<java.lang.String> originSslProtocols;
        java.lang.Number originKeepaliveTimeout;
        java.lang.Number originReadTimeout;

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getHttpPort}
         * @param httpPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#http_port CloudfrontDistribution#http_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpPort(java.lang.Number httpPort) {
            this.httpPort = httpPort;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getHttpsPort}
         * @param httpsPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#https_port CloudfrontDistribution#https_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpsPort(java.lang.Number httpsPort) {
            this.httpsPort = httpsPort;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getOriginProtocolPolicy}
         * @param originProtocolPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_protocol_policy CloudfrontDistribution#origin_protocol_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder originProtocolPolicy(java.lang.String originProtocolPolicy) {
            this.originProtocolPolicy = originProtocolPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getOriginSslProtocols}
         * @param originSslProtocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_ssl_protocols CloudfrontDistribution#origin_ssl_protocols}. This parameter is required.
         * @return {@code this}
         */
        public Builder originSslProtocols(java.util.List<java.lang.String> originSslProtocols) {
            this.originSslProtocols = originSslProtocols;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getOriginKeepaliveTimeout}
         * @param originKeepaliveTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_keepalive_timeout CloudfrontDistribution#origin_keepalive_timeout}.
         * @return {@code this}
         */
        public Builder originKeepaliveTimeout(java.lang.Number originKeepaliveTimeout) {
            this.originKeepaliveTimeout = originKeepaliveTimeout;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOriginCustomOriginConfig#getOriginReadTimeout}
         * @param originReadTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#origin_read_timeout CloudfrontDistribution#origin_read_timeout}.
         * @return {@code this}
         */
        public Builder originReadTimeout(java.lang.Number originReadTimeout) {
            this.originReadTimeout = originReadTimeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionOriginCustomOriginConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionOriginCustomOriginConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionOriginCustomOriginConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionOriginCustomOriginConfig {
        private final java.lang.Number httpPort;
        private final java.lang.Number httpsPort;
        private final java.lang.String originProtocolPolicy;
        private final java.util.List<java.lang.String> originSslProtocols;
        private final java.lang.Number originKeepaliveTimeout;
        private final java.lang.Number originReadTimeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpPort = software.amazon.jsii.Kernel.get(this, "httpPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.httpsPort = software.amazon.jsii.Kernel.get(this, "httpsPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.originProtocolPolicy = software.amazon.jsii.Kernel.get(this, "originProtocolPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.originSslProtocols = software.amazon.jsii.Kernel.get(this, "originSslProtocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.originKeepaliveTimeout = software.amazon.jsii.Kernel.get(this, "originKeepaliveTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.originReadTimeout = software.amazon.jsii.Kernel.get(this, "originReadTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpPort = java.util.Objects.requireNonNull(builder.httpPort, "httpPort is required");
            this.httpsPort = java.util.Objects.requireNonNull(builder.httpsPort, "httpsPort is required");
            this.originProtocolPolicy = java.util.Objects.requireNonNull(builder.originProtocolPolicy, "originProtocolPolicy is required");
            this.originSslProtocols = java.util.Objects.requireNonNull(builder.originSslProtocols, "originSslProtocols is required");
            this.originKeepaliveTimeout = builder.originKeepaliveTimeout;
            this.originReadTimeout = builder.originReadTimeout;
        }

        @Override
        public final java.lang.Number getHttpPort() {
            return this.httpPort;
        }

        @Override
        public final java.lang.Number getHttpsPort() {
            return this.httpsPort;
        }

        @Override
        public final java.lang.String getOriginProtocolPolicy() {
            return this.originProtocolPolicy;
        }

        @Override
        public final java.util.List<java.lang.String> getOriginSslProtocols() {
            return this.originSslProtocols;
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

            data.set("httpPort", om.valueToTree(this.getHttpPort()));
            data.set("httpsPort", om.valueToTree(this.getHttpsPort()));
            data.set("originProtocolPolicy", om.valueToTree(this.getOriginProtocolPolicy()));
            data.set("originSslProtocols", om.valueToTree(this.getOriginSslProtocols()));
            if (this.getOriginKeepaliveTimeout() != null) {
                data.set("originKeepaliveTimeout", om.valueToTree(this.getOriginKeepaliveTimeout()));
            }
            if (this.getOriginReadTimeout() != null) {
                data.set("originReadTimeout", om.valueToTree(this.getOriginReadTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionOriginCustomOriginConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionOriginCustomOriginConfig.Jsii$Proxy that = (CloudfrontDistributionOriginCustomOriginConfig.Jsii$Proxy) o;

            if (!httpPort.equals(that.httpPort)) return false;
            if (!httpsPort.equals(that.httpsPort)) return false;
            if (!originProtocolPolicy.equals(that.originProtocolPolicy)) return false;
            if (!originSslProtocols.equals(that.originSslProtocols)) return false;
            if (this.originKeepaliveTimeout != null ? !this.originKeepaliveTimeout.equals(that.originKeepaliveTimeout) : that.originKeepaliveTimeout != null) return false;
            return this.originReadTimeout != null ? this.originReadTimeout.equals(that.originReadTimeout) : that.originReadTimeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpPort.hashCode();
            result = 31 * result + (this.httpsPort.hashCode());
            result = 31 * result + (this.originProtocolPolicy.hashCode());
            result = 31 * result + (this.originSslProtocols.hashCode());
            result = 31 * result + (this.originKeepaliveTimeout != null ? this.originKeepaliveTimeout.hashCode() : 0);
            result = 31 * result + (this.originReadTimeout != null ? this.originReadTimeout.hashCode() : 0);
            return result;
        }
    }
}
