package imports.aws.cloudfront_vpc_origin;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontVpcOrigin.CloudfrontVpcOriginVpcOriginEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontVpcOriginVpcOriginEndpointConfig.Jsii$Proxy.class)
public interface CloudfrontVpcOriginVpcOriginEndpointConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#arn CloudfrontVpcOrigin#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#http_port CloudfrontVpcOrigin#http_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHttpPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#https_port CloudfrontVpcOrigin#https_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHttpsPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#name CloudfrontVpcOrigin#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#origin_protocol_policy CloudfrontVpcOrigin#origin_protocol_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOriginProtocolPolicy();

    /**
     * origin_ssl_protocols block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#origin_ssl_protocols CloudfrontVpcOrigin#origin_ssl_protocols}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOriginSslProtocols() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontVpcOriginVpcOriginEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontVpcOriginVpcOriginEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontVpcOriginVpcOriginEndpointConfig> {
        java.lang.String arn;
        java.lang.Number httpPort;
        java.lang.Number httpsPort;
        java.lang.String name;
        java.lang.String originProtocolPolicy;
        java.lang.Object originSslProtocols;

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#arn CloudfrontVpcOrigin#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getHttpPort}
         * @param httpPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#http_port CloudfrontVpcOrigin#http_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpPort(java.lang.Number httpPort) {
            this.httpPort = httpPort;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getHttpsPort}
         * @param httpsPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#https_port CloudfrontVpcOrigin#https_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpsPort(java.lang.Number httpsPort) {
            this.httpsPort = httpsPort;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#name CloudfrontVpcOrigin#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getOriginProtocolPolicy}
         * @param originProtocolPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#origin_protocol_policy CloudfrontVpcOrigin#origin_protocol_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder originProtocolPolicy(java.lang.String originProtocolPolicy) {
            this.originProtocolPolicy = originProtocolPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getOriginSslProtocols}
         * @param originSslProtocols origin_ssl_protocols block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#origin_ssl_protocols CloudfrontVpcOrigin#origin_ssl_protocols}
         * @return {@code this}
         */
        public Builder originSslProtocols(com.hashicorp.cdktf.IResolvable originSslProtocols) {
            this.originSslProtocols = originSslProtocols;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfig#getOriginSslProtocols}
         * @param originSslProtocols origin_ssl_protocols block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#origin_ssl_protocols CloudfrontVpcOrigin#origin_ssl_protocols}
         * @return {@code this}
         */
        public Builder originSslProtocols(java.util.List<? extends imports.aws.cloudfront_vpc_origin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols> originSslProtocols) {
            this.originSslProtocols = originSslProtocols;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontVpcOriginVpcOriginEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontVpcOriginVpcOriginEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontVpcOriginVpcOriginEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontVpcOriginVpcOriginEndpointConfig {
        private final java.lang.String arn;
        private final java.lang.Number httpPort;
        private final java.lang.Number httpsPort;
        private final java.lang.String name;
        private final java.lang.String originProtocolPolicy;
        private final java.lang.Object originSslProtocols;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpPort = software.amazon.jsii.Kernel.get(this, "httpPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.httpsPort = software.amazon.jsii.Kernel.get(this, "httpsPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.originProtocolPolicy = software.amazon.jsii.Kernel.get(this, "originProtocolPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.originSslProtocols = software.amazon.jsii.Kernel.get(this, "originSslProtocols", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.httpPort = java.util.Objects.requireNonNull(builder.httpPort, "httpPort is required");
            this.httpsPort = java.util.Objects.requireNonNull(builder.httpsPort, "httpsPort is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.originProtocolPolicy = java.util.Objects.requireNonNull(builder.originProtocolPolicy, "originProtocolPolicy is required");
            this.originSslProtocols = builder.originSslProtocols;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOriginProtocolPolicy() {
            return this.originProtocolPolicy;
        }

        @Override
        public final java.lang.Object getOriginSslProtocols() {
            return this.originSslProtocols;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("httpPort", om.valueToTree(this.getHttpPort()));
            data.set("httpsPort", om.valueToTree(this.getHttpsPort()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("originProtocolPolicy", om.valueToTree(this.getOriginProtocolPolicy()));
            if (this.getOriginSslProtocols() != null) {
                data.set("originSslProtocols", om.valueToTree(this.getOriginSslProtocols()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontVpcOrigin.CloudfrontVpcOriginVpcOriginEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontVpcOriginVpcOriginEndpointConfig.Jsii$Proxy that = (CloudfrontVpcOriginVpcOriginEndpointConfig.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            if (!httpPort.equals(that.httpPort)) return false;
            if (!httpsPort.equals(that.httpsPort)) return false;
            if (!name.equals(that.name)) return false;
            if (!originProtocolPolicy.equals(that.originProtocolPolicy)) return false;
            return this.originSslProtocols != null ? this.originSslProtocols.equals(that.originSslProtocols) : that.originSslProtocols == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.httpPort.hashCode());
            result = 31 * result + (this.httpsPort.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.originProtocolPolicy.hashCode());
            result = 31 * result + (this.originSslProtocols != null ? this.originSslProtocols.hashCode() : 0);
            return result;
        }
    }
}
