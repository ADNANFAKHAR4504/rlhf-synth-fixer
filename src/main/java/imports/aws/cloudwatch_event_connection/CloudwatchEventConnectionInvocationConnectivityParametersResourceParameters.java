package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters.Jsii$Proxy.class)
public interface CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#resource_configuration_arn CloudwatchEventConnection#resource_configuration_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceConfigurationArn();

    /**
     * @return a {@link Builder} of {@link CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters> {
        java.lang.String resourceConfigurationArn;

        /**
         * Sets the value of {@link CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters#getResourceConfigurationArn}
         * @param resourceConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#resource_configuration_arn CloudwatchEventConnection#resource_configuration_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceConfigurationArn(java.lang.String resourceConfigurationArn) {
            this.resourceConfigurationArn = resourceConfigurationArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters {
        private final java.lang.String resourceConfigurationArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceConfigurationArn = software.amazon.jsii.Kernel.get(this, "resourceConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceConfigurationArn = java.util.Objects.requireNonNull(builder.resourceConfigurationArn, "resourceConfigurationArn is required");
        }

        @Override
        public final java.lang.String getResourceConfigurationArn() {
            return this.resourceConfigurationArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceConfigurationArn", om.valueToTree(this.getResourceConfigurationArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventConnection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters.Jsii$Proxy that = (CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters.Jsii$Proxy) o;

            return this.resourceConfigurationArn.equals(that.resourceConfigurationArn);
        }

        @Override
        public final int hashCode() {
            int result = this.resourceConfigurationArn.hashCode();
            return result;
        }
    }
}
