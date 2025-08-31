package imports.aws.launch_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchConfiguration.LaunchConfigurationMetadataOptions")
@software.amazon.jsii.Jsii.Proxy(LaunchConfigurationMetadataOptions.Jsii$Proxy.class)
public interface LaunchConfigurationMetadataOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_endpoint LaunchConfiguration#http_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_put_response_hop_limit LaunchConfiguration#http_put_response_hop_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHttpPutResponseHopLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_tokens LaunchConfiguration#http_tokens}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpTokens() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchConfigurationMetadataOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchConfigurationMetadataOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchConfigurationMetadataOptions> {
        java.lang.String httpEndpoint;
        java.lang.Number httpPutResponseHopLimit;
        java.lang.String httpTokens;

        /**
         * Sets the value of {@link LaunchConfigurationMetadataOptions#getHttpEndpoint}
         * @param httpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_endpoint LaunchConfiguration#http_endpoint}.
         * @return {@code this}
         */
        public Builder httpEndpoint(java.lang.String httpEndpoint) {
            this.httpEndpoint = httpEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationMetadataOptions#getHttpPutResponseHopLimit}
         * @param httpPutResponseHopLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_put_response_hop_limit LaunchConfiguration#http_put_response_hop_limit}.
         * @return {@code this}
         */
        public Builder httpPutResponseHopLimit(java.lang.Number httpPutResponseHopLimit) {
            this.httpPutResponseHopLimit = httpPutResponseHopLimit;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationMetadataOptions#getHttpTokens}
         * @param httpTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#http_tokens LaunchConfiguration#http_tokens}.
         * @return {@code this}
         */
        public Builder httpTokens(java.lang.String httpTokens) {
            this.httpTokens = httpTokens;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchConfigurationMetadataOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchConfigurationMetadataOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchConfigurationMetadataOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchConfigurationMetadataOptions {
        private final java.lang.String httpEndpoint;
        private final java.lang.Number httpPutResponseHopLimit;
        private final java.lang.String httpTokens;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpEndpoint = software.amazon.jsii.Kernel.get(this, "httpEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpPutResponseHopLimit = software.amazon.jsii.Kernel.get(this, "httpPutResponseHopLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.httpTokens = software.amazon.jsii.Kernel.get(this, "httpTokens", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpEndpoint = builder.httpEndpoint;
            this.httpPutResponseHopLimit = builder.httpPutResponseHopLimit;
            this.httpTokens = builder.httpTokens;
        }

        @Override
        public final java.lang.String getHttpEndpoint() {
            return this.httpEndpoint;
        }

        @Override
        public final java.lang.Number getHttpPutResponseHopLimit() {
            return this.httpPutResponseHopLimit;
        }

        @Override
        public final java.lang.String getHttpTokens() {
            return this.httpTokens;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHttpEndpoint() != null) {
                data.set("httpEndpoint", om.valueToTree(this.getHttpEndpoint()));
            }
            if (this.getHttpPutResponseHopLimit() != null) {
                data.set("httpPutResponseHopLimit", om.valueToTree(this.getHttpPutResponseHopLimit()));
            }
            if (this.getHttpTokens() != null) {
                data.set("httpTokens", om.valueToTree(this.getHttpTokens()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchConfiguration.LaunchConfigurationMetadataOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchConfigurationMetadataOptions.Jsii$Proxy that = (LaunchConfigurationMetadataOptions.Jsii$Proxy) o;

            if (this.httpEndpoint != null ? !this.httpEndpoint.equals(that.httpEndpoint) : that.httpEndpoint != null) return false;
            if (this.httpPutResponseHopLimit != null ? !this.httpPutResponseHopLimit.equals(that.httpPutResponseHopLimit) : that.httpPutResponseHopLimit != null) return false;
            return this.httpTokens != null ? this.httpTokens.equals(that.httpTokens) : that.httpTokens == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpEndpoint != null ? this.httpEndpoint.hashCode() : 0;
            result = 31 * result + (this.httpPutResponseHopLimit != null ? this.httpPutResponseHopLimit.hashCode() : 0);
            result = 31 * result + (this.httpTokens != null ? this.httpTokens.hashCode() : 0);
            return result;
        }
    }
}
