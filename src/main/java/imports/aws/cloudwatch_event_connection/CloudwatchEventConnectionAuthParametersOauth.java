package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.271Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauth")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventConnectionAuthParametersOauth.Jsii$Proxy.class)
public interface CloudwatchEventConnectionAuthParametersOauth extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#authorization_endpoint CloudwatchEventConnection#authorization_endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#http_method CloudwatchEventConnection#http_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod();

    /**
     * oauth_http_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#oauth_http_parameters CloudwatchEventConnection#oauth_http_parameters}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters getOauthHttpParameters();

    /**
     * client_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#client_parameters CloudwatchEventConnection#client_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters getClientParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventConnectionAuthParametersOauth}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventConnectionAuthParametersOauth}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventConnectionAuthParametersOauth> {
        java.lang.String authorizationEndpoint;
        java.lang.String httpMethod;
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters oauthHttpParameters;
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters clientParameters;

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauth#getAuthorizationEndpoint}
         * @param authorizationEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#authorization_endpoint CloudwatchEventConnection#authorization_endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder authorizationEndpoint(java.lang.String authorizationEndpoint) {
            this.authorizationEndpoint = authorizationEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauth#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#http_method CloudwatchEventConnection#http_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauth#getOauthHttpParameters}
         * @param oauthHttpParameters oauth_http_parameters block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#oauth_http_parameters CloudwatchEventConnection#oauth_http_parameters}
         * @return {@code this}
         */
        public Builder oauthHttpParameters(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters oauthHttpParameters) {
            this.oauthHttpParameters = oauthHttpParameters;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauth#getClientParameters}
         * @param clientParameters client_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#client_parameters CloudwatchEventConnection#client_parameters}
         * @return {@code this}
         */
        public Builder clientParameters(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters clientParameters) {
            this.clientParameters = clientParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventConnectionAuthParametersOauth}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventConnectionAuthParametersOauth build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventConnectionAuthParametersOauth}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventConnectionAuthParametersOauth {
        private final java.lang.String authorizationEndpoint;
        private final java.lang.String httpMethod;
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters oauthHttpParameters;
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters clientParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authorizationEndpoint = software.amazon.jsii.Kernel.get(this, "authorizationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthHttpParameters = software.amazon.jsii.Kernel.get(this, "oauthHttpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters.class));
            this.clientParameters = software.amazon.jsii.Kernel.get(this, "clientParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authorizationEndpoint = java.util.Objects.requireNonNull(builder.authorizationEndpoint, "authorizationEndpoint is required");
            this.httpMethod = java.util.Objects.requireNonNull(builder.httpMethod, "httpMethod is required");
            this.oauthHttpParameters = java.util.Objects.requireNonNull(builder.oauthHttpParameters, "oauthHttpParameters is required");
            this.clientParameters = builder.clientParameters;
        }

        @Override
        public final java.lang.String getAuthorizationEndpoint() {
            return this.authorizationEndpoint;
        }

        @Override
        public final java.lang.String getHttpMethod() {
            return this.httpMethod;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters getOauthHttpParameters() {
            return this.oauthHttpParameters;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters getClientParameters() {
            return this.clientParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authorizationEndpoint", om.valueToTree(this.getAuthorizationEndpoint()));
            data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            data.set("oauthHttpParameters", om.valueToTree(this.getOauthHttpParameters()));
            if (this.getClientParameters() != null) {
                data.set("clientParameters", om.valueToTree(this.getClientParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauth"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventConnectionAuthParametersOauth.Jsii$Proxy that = (CloudwatchEventConnectionAuthParametersOauth.Jsii$Proxy) o;

            if (!authorizationEndpoint.equals(that.authorizationEndpoint)) return false;
            if (!httpMethod.equals(that.httpMethod)) return false;
            if (!oauthHttpParameters.equals(that.oauthHttpParameters)) return false;
            return this.clientParameters != null ? this.clientParameters.equals(that.clientParameters) : that.clientParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authorizationEndpoint.hashCode();
            result = 31 * result + (this.httpMethod.hashCode());
            result = 31 * result + (this.oauthHttpParameters.hashCode());
            result = 31 * result + (this.clientParameters != null ? this.clientParameters.hashCode() : 0);
            return result;
        }
    }
}
