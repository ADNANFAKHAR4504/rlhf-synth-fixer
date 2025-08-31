package imports.aws.medialive_input;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.891Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveInput.MedialiveInputMediaConnectFlows")
@software.amazon.jsii.Jsii.Proxy(MedialiveInputMediaConnectFlows.Jsii$Proxy.class)
public interface MedialiveInputMediaConnectFlows extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#flow_arn MedialiveInput#flow_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFlowArn();

    /**
     * @return a {@link Builder} of {@link MedialiveInputMediaConnectFlows}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveInputMediaConnectFlows}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveInputMediaConnectFlows> {
        java.lang.String flowArn;

        /**
         * Sets the value of {@link MedialiveInputMediaConnectFlows#getFlowArn}
         * @param flowArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#flow_arn MedialiveInput#flow_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder flowArn(java.lang.String flowArn) {
            this.flowArn = flowArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveInputMediaConnectFlows}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveInputMediaConnectFlows build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveInputMediaConnectFlows}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveInputMediaConnectFlows {
        private final java.lang.String flowArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.flowArn = software.amazon.jsii.Kernel.get(this, "flowArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.flowArn = java.util.Objects.requireNonNull(builder.flowArn, "flowArn is required");
        }

        @Override
        public final java.lang.String getFlowArn() {
            return this.flowArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("flowArn", om.valueToTree(this.getFlowArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveInput.MedialiveInputMediaConnectFlows"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveInputMediaConnectFlows.Jsii$Proxy that = (MedialiveInputMediaConnectFlows.Jsii$Proxy) o;

            return this.flowArn.equals(that.flowArn);
        }

        @Override
        public final int hashCode() {
            int result = this.flowArn.hashCode();
            return result;
        }
    }
}
