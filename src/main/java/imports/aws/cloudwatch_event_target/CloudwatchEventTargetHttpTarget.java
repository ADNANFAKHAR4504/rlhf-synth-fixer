package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetHttpTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetHttpTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetHttpTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#header_parameters CloudwatchEventTarget#header_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getHeaderParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#path_parameter_values CloudwatchEventTarget#path_parameter_values}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPathParameterValues() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#query_string_parameters CloudwatchEventTarget#query_string_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getQueryStringParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetHttpTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetHttpTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetHttpTarget> {
        java.util.Map<java.lang.String, java.lang.String> headerParameters;
        java.util.List<java.lang.String> pathParameterValues;
        java.util.Map<java.lang.String, java.lang.String> queryStringParameters;

        /**
         * Sets the value of {@link CloudwatchEventTargetHttpTarget#getHeaderParameters}
         * @param headerParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#header_parameters CloudwatchEventTarget#header_parameters}.
         * @return {@code this}
         */
        public Builder headerParameters(java.util.Map<java.lang.String, java.lang.String> headerParameters) {
            this.headerParameters = headerParameters;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetHttpTarget#getPathParameterValues}
         * @param pathParameterValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#path_parameter_values CloudwatchEventTarget#path_parameter_values}.
         * @return {@code this}
         */
        public Builder pathParameterValues(java.util.List<java.lang.String> pathParameterValues) {
            this.pathParameterValues = pathParameterValues;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetHttpTarget#getQueryStringParameters}
         * @param queryStringParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#query_string_parameters CloudwatchEventTarget#query_string_parameters}.
         * @return {@code this}
         */
        public Builder queryStringParameters(java.util.Map<java.lang.String, java.lang.String> queryStringParameters) {
            this.queryStringParameters = queryStringParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetHttpTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetHttpTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetHttpTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetHttpTarget {
        private final java.util.Map<java.lang.String, java.lang.String> headerParameters;
        private final java.util.List<java.lang.String> pathParameterValues;
        private final java.util.Map<java.lang.String, java.lang.String> queryStringParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.headerParameters = software.amazon.jsii.Kernel.get(this, "headerParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.pathParameterValues = software.amazon.jsii.Kernel.get(this, "pathParameterValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.queryStringParameters = software.amazon.jsii.Kernel.get(this, "queryStringParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.headerParameters = builder.headerParameters;
            this.pathParameterValues = builder.pathParameterValues;
            this.queryStringParameters = builder.queryStringParameters;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getHeaderParameters() {
            return this.headerParameters;
        }

        @Override
        public final java.util.List<java.lang.String> getPathParameterValues() {
            return this.pathParameterValues;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getQueryStringParameters() {
            return this.queryStringParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeaderParameters() != null) {
                data.set("headerParameters", om.valueToTree(this.getHeaderParameters()));
            }
            if (this.getPathParameterValues() != null) {
                data.set("pathParameterValues", om.valueToTree(this.getPathParameterValues()));
            }
            if (this.getQueryStringParameters() != null) {
                data.set("queryStringParameters", om.valueToTree(this.getQueryStringParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetHttpTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetHttpTarget.Jsii$Proxy that = (CloudwatchEventTargetHttpTarget.Jsii$Proxy) o;

            if (this.headerParameters != null ? !this.headerParameters.equals(that.headerParameters) : that.headerParameters != null) return false;
            if (this.pathParameterValues != null ? !this.pathParameterValues.equals(that.pathParameterValues) : that.pathParameterValues != null) return false;
            return this.queryStringParameters != null ? this.queryStringParameters.equals(that.queryStringParameters) : that.queryStringParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.headerParameters != null ? this.headerParameters.hashCode() : 0;
            result = 31 * result + (this.pathParameterValues != null ? this.pathParameterValues.hashCode() : 0);
            result = 31 * result + (this.queryStringParameters != null ? this.queryStringParameters.hashCode() : 0);
            return result;
        }
    }
}
