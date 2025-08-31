package imports.aws.devopsguru_notification_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.994Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruNotificationChannel.DevopsguruNotificationChannelSns")
@software.amazon.jsii.Jsii.Proxy(DevopsguruNotificationChannelSns.Jsii$Proxy.class)
public interface DevopsguruNotificationChannelSns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#topic_arn DevopsguruNotificationChannel#topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicArn();

    /**
     * @return a {@link Builder} of {@link DevopsguruNotificationChannelSns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruNotificationChannelSns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruNotificationChannelSns> {
        java.lang.String topicArn;

        /**
         * Sets the value of {@link DevopsguruNotificationChannelSns#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#topic_arn DevopsguruNotificationChannel#topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruNotificationChannelSns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruNotificationChannelSns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruNotificationChannelSns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruNotificationChannelSns {
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicArn = java.util.Objects.requireNonNull(builder.topicArn, "topicArn is required");
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("topicArn", om.valueToTree(this.getTopicArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruNotificationChannel.DevopsguruNotificationChannelSns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruNotificationChannelSns.Jsii$Proxy that = (DevopsguruNotificationChannelSns.Jsii$Proxy) o;

            return this.topicArn.equals(that.topicArn);
        }

        @Override
        public final int hashCode() {
            int result = this.topicArn.hashCode();
            return result;
        }
    }
}
