package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingDestinationConfigOnFailure")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingDestinationConfigOnFailure.Jsii$Proxy.class)
public interface LambdaEventSourceMappingDestinationConfigOnFailure extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#destination_arn LambdaEventSourceMapping#destination_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationArn();

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingDestinationConfigOnFailure}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingDestinationConfigOnFailure}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingDestinationConfigOnFailure> {
        java.lang.String destinationArn;

        /**
         * Sets the value of {@link LambdaEventSourceMappingDestinationConfigOnFailure#getDestinationArn}
         * @param destinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#destination_arn LambdaEventSourceMapping#destination_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationArn(java.lang.String destinationArn) {
            this.destinationArn = destinationArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingDestinationConfigOnFailure}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingDestinationConfigOnFailure build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingDestinationConfigOnFailure}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingDestinationConfigOnFailure {
        private final java.lang.String destinationArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationArn = software.amazon.jsii.Kernel.get(this, "destinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationArn = java.util.Objects.requireNonNull(builder.destinationArn, "destinationArn is required");
        }

        @Override
        public final java.lang.String getDestinationArn() {
            return this.destinationArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationArn", om.valueToTree(this.getDestinationArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingDestinationConfigOnFailure"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingDestinationConfigOnFailure.Jsii$Proxy that = (LambdaEventSourceMappingDestinationConfigOnFailure.Jsii$Proxy) o;

            return this.destinationArn.equals(that.destinationArn);
        }

        @Override
        public final int hashCode() {
            int result = this.destinationArn.hashCode();
            return result;
        }
    }
}
