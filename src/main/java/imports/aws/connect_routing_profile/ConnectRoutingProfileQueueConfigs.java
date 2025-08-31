package imports.aws.connect_routing_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.389Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectRoutingProfile.ConnectRoutingProfileQueueConfigs")
@software.amazon.jsii.Jsii.Proxy(ConnectRoutingProfileQueueConfigs.Jsii$Proxy.class)
public interface ConnectRoutingProfileQueueConfigs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#channel ConnectRoutingProfile#channel}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getChannel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#delay ConnectRoutingProfile#delay}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDelay();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#priority ConnectRoutingProfile#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#queue_id ConnectRoutingProfile#queue_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueueId();

    /**
     * @return a {@link Builder} of {@link ConnectRoutingProfileQueueConfigs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectRoutingProfileQueueConfigs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectRoutingProfileQueueConfigs> {
        java.lang.String channel;
        java.lang.Number delay;
        java.lang.Number priority;
        java.lang.String queueId;

        /**
         * Sets the value of {@link ConnectRoutingProfileQueueConfigs#getChannel}
         * @param channel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#channel ConnectRoutingProfile#channel}. This parameter is required.
         * @return {@code this}
         */
        public Builder channel(java.lang.String channel) {
            this.channel = channel;
            return this;
        }

        /**
         * Sets the value of {@link ConnectRoutingProfileQueueConfigs#getDelay}
         * @param delay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#delay ConnectRoutingProfile#delay}. This parameter is required.
         * @return {@code this}
         */
        public Builder delay(java.lang.Number delay) {
            this.delay = delay;
            return this;
        }

        /**
         * Sets the value of {@link ConnectRoutingProfileQueueConfigs#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#priority ConnectRoutingProfile#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link ConnectRoutingProfileQueueConfigs#getQueueId}
         * @param queueId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#queue_id ConnectRoutingProfile#queue_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder queueId(java.lang.String queueId) {
            this.queueId = queueId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectRoutingProfileQueueConfigs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectRoutingProfileQueueConfigs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectRoutingProfileQueueConfigs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectRoutingProfileQueueConfigs {
        private final java.lang.String channel;
        private final java.lang.Number delay;
        private final java.lang.Number priority;
        private final java.lang.String queueId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.channel = software.amazon.jsii.Kernel.get(this, "channel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.delay = software.amazon.jsii.Kernel.get(this, "delay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.queueId = software.amazon.jsii.Kernel.get(this, "queueId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.channel = java.util.Objects.requireNonNull(builder.channel, "channel is required");
            this.delay = java.util.Objects.requireNonNull(builder.delay, "delay is required");
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.queueId = java.util.Objects.requireNonNull(builder.queueId, "queueId is required");
        }

        @Override
        public final java.lang.String getChannel() {
            return this.channel;
        }

        @Override
        public final java.lang.Number getDelay() {
            return this.delay;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getQueueId() {
            return this.queueId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("channel", om.valueToTree(this.getChannel()));
            data.set("delay", om.valueToTree(this.getDelay()));
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("queueId", om.valueToTree(this.getQueueId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectRoutingProfile.ConnectRoutingProfileQueueConfigs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectRoutingProfileQueueConfigs.Jsii$Proxy that = (ConnectRoutingProfileQueueConfigs.Jsii$Proxy) o;

            if (!channel.equals(that.channel)) return false;
            if (!delay.equals(that.delay)) return false;
            if (!priority.equals(that.priority)) return false;
            return this.queueId.equals(that.queueId);
        }

        @Override
        public final int hashCode() {
            int result = this.channel.hashCode();
            result = 31 * result + (this.delay.hashCode());
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.queueId.hashCode());
            return result;
        }
    }
}
