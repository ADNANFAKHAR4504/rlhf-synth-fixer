package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.281Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetSqsTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetSqsTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetSqsTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#message_group_id CloudwatchEventTarget#message_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageGroupId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetSqsTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetSqsTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetSqsTarget> {
        java.lang.String messageGroupId;

        /**
         * Sets the value of {@link CloudwatchEventTargetSqsTarget#getMessageGroupId}
         * @param messageGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#message_group_id CloudwatchEventTarget#message_group_id}.
         * @return {@code this}
         */
        public Builder messageGroupId(java.lang.String messageGroupId) {
            this.messageGroupId = messageGroupId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetSqsTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetSqsTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetSqsTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetSqsTarget {
        private final java.lang.String messageGroupId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.messageGroupId = software.amazon.jsii.Kernel.get(this, "messageGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.messageGroupId = builder.messageGroupId;
        }

        @Override
        public final java.lang.String getMessageGroupId() {
            return this.messageGroupId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMessageGroupId() != null) {
                data.set("messageGroupId", om.valueToTree(this.getMessageGroupId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetSqsTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetSqsTarget.Jsii$Proxy that = (CloudwatchEventTargetSqsTarget.Jsii$Proxy) o;

            return this.messageGroupId != null ? this.messageGroupId.equals(that.messageGroupId) : that.messageGroupId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.messageGroupId != null ? this.messageGroupId.hashCode() : 0;
            return result;
        }
    }
}
