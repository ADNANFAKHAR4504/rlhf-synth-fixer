package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.270Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParameters")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventConnectionAuthParameters.Jsii$Proxy.class)
public interface CloudwatchEventConnectionAuthParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * api_key block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#api_key CloudwatchEventConnection#api_key}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey getApiKey() {
        return null;
    }

    /**
     * basic block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#basic CloudwatchEventConnection#basic}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic getBasic() {
        return null;
    }

    /**
     * invocation_http_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#invocation_http_parameters CloudwatchEventConnection#invocation_http_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters getInvocationHttpParameters() {
        return null;
    }

    /**
     * oauth block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#oauth CloudwatchEventConnection#oauth}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth getOauth() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventConnectionAuthParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventConnectionAuthParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventConnectionAuthParameters> {
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey apiKey;
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic basic;
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters invocationHttpParameters;
        imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth oauth;

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParameters#getApiKey}
         * @param apiKey api_key block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#api_key CloudwatchEventConnection#api_key}
         * @return {@code this}
         */
        public Builder apiKey(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParameters#getBasic}
         * @param basic basic block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#basic CloudwatchEventConnection#basic}
         * @return {@code this}
         */
        public Builder basic(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic basic) {
            this.basic = basic;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParameters#getInvocationHttpParameters}
         * @param invocationHttpParameters invocation_http_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#invocation_http_parameters CloudwatchEventConnection#invocation_http_parameters}
         * @return {@code this}
         */
        public Builder invocationHttpParameters(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters invocationHttpParameters) {
            this.invocationHttpParameters = invocationHttpParameters;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParameters#getOauth}
         * @param oauth oauth block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#oauth CloudwatchEventConnection#oauth}
         * @return {@code this}
         */
        public Builder oauth(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth oauth) {
            this.oauth = oauth;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventConnectionAuthParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventConnectionAuthParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventConnectionAuthParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventConnectionAuthParameters {
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey apiKey;
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic basic;
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters invocationHttpParameters;
        private final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth oauth;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiKey = software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey.class));
            this.basic = software.amazon.jsii.Kernel.get(this, "basic", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic.class));
            this.invocationHttpParameters = software.amazon.jsii.Kernel.get(this, "invocationHttpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters.class));
            this.oauth = software.amazon.jsii.Kernel.get(this, "oauth", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiKey = builder.apiKey;
            this.basic = builder.basic;
            this.invocationHttpParameters = builder.invocationHttpParameters;
            this.oauth = builder.oauth;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey getApiKey() {
            return this.apiKey;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic getBasic() {
            return this.basic;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters getInvocationHttpParameters() {
            return this.invocationHttpParameters;
        }

        @Override
        public final imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth getOauth() {
            return this.oauth;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApiKey() != null) {
                data.set("apiKey", om.valueToTree(this.getApiKey()));
            }
            if (this.getBasic() != null) {
                data.set("basic", om.valueToTree(this.getBasic()));
            }
            if (this.getInvocationHttpParameters() != null) {
                data.set("invocationHttpParameters", om.valueToTree(this.getInvocationHttpParameters()));
            }
            if (this.getOauth() != null) {
                data.set("oauth", om.valueToTree(this.getOauth()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventConnectionAuthParameters.Jsii$Proxy that = (CloudwatchEventConnectionAuthParameters.Jsii$Proxy) o;

            if (this.apiKey != null ? !this.apiKey.equals(that.apiKey) : that.apiKey != null) return false;
            if (this.basic != null ? !this.basic.equals(that.basic) : that.basic != null) return false;
            if (this.invocationHttpParameters != null ? !this.invocationHttpParameters.equals(that.invocationHttpParameters) : that.invocationHttpParameters != null) return false;
            return this.oauth != null ? this.oauth.equals(that.oauth) : that.oauth == null;
        }

        @Override
        public final int hashCode() {
            int result = this.apiKey != null ? this.apiKey.hashCode() : 0;
            result = 31 * result + (this.basic != null ? this.basic.hashCode() : 0);
            result = 31 * result + (this.invocationHttpParameters != null ? this.invocationHttpParameters.hashCode() : 0);
            result = 31 * result + (this.oauth != null ? this.oauth.hashCode() : 0);
            return result;
        }
    }
}
