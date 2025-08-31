package imports.aws.devopsguru_notification_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.994Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruNotificationChannel.DevopsguruNotificationChannelFilters")
@software.amazon.jsii.Jsii.Proxy(DevopsguruNotificationChannelFilters.Jsii$Proxy.class)
public interface DevopsguruNotificationChannelFilters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#message_types DevopsguruNotificationChannel#message_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMessageTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#severities DevopsguruNotificationChannel#severities}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSeverities() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevopsguruNotificationChannelFilters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruNotificationChannelFilters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruNotificationChannelFilters> {
        java.util.List<java.lang.String> messageTypes;
        java.util.List<java.lang.String> severities;

        /**
         * Sets the value of {@link DevopsguruNotificationChannelFilters#getMessageTypes}
         * @param messageTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#message_types DevopsguruNotificationChannel#message_types}.
         * @return {@code this}
         */
        public Builder messageTypes(java.util.List<java.lang.String> messageTypes) {
            this.messageTypes = messageTypes;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruNotificationChannelFilters#getSeverities}
         * @param severities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_notification_channel#severities DevopsguruNotificationChannel#severities}.
         * @return {@code this}
         */
        public Builder severities(java.util.List<java.lang.String> severities) {
            this.severities = severities;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruNotificationChannelFilters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruNotificationChannelFilters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruNotificationChannelFilters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruNotificationChannelFilters {
        private final java.util.List<java.lang.String> messageTypes;
        private final java.util.List<java.lang.String> severities;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.messageTypes = software.amazon.jsii.Kernel.get(this, "messageTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.severities = software.amazon.jsii.Kernel.get(this, "severities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.messageTypes = builder.messageTypes;
            this.severities = builder.severities;
        }

        @Override
        public final java.util.List<java.lang.String> getMessageTypes() {
            return this.messageTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getSeverities() {
            return this.severities;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMessageTypes() != null) {
                data.set("messageTypes", om.valueToTree(this.getMessageTypes()));
            }
            if (this.getSeverities() != null) {
                data.set("severities", om.valueToTree(this.getSeverities()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruNotificationChannel.DevopsguruNotificationChannelFilters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruNotificationChannelFilters.Jsii$Proxy that = (DevopsguruNotificationChannelFilters.Jsii$Proxy) o;

            if (this.messageTypes != null ? !this.messageTypes.equals(that.messageTypes) : that.messageTypes != null) return false;
            return this.severities != null ? this.severities.equals(that.severities) : that.severities == null;
        }

        @Override
        public final int hashCode() {
            int result = this.messageTypes != null ? this.messageTypes.hashCode() : 0;
            result = 31 * result + (this.severities != null ? this.severities.hashCode() : 0);
            return result;
        }
    }
}
