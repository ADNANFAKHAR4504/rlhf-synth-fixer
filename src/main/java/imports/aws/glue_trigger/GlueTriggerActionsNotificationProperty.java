package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerActionsNotificationProperty")
@software.amazon.jsii.Jsii.Proxy(GlueTriggerActionsNotificationProperty.Jsii$Proxy.class)
public interface GlueTriggerActionsNotificationProperty extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#notify_delay_after GlueTrigger#notify_delay_after}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNotifyDelayAfter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueTriggerActionsNotificationProperty}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueTriggerActionsNotificationProperty}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueTriggerActionsNotificationProperty> {
        java.lang.Number notifyDelayAfter;

        /**
         * Sets the value of {@link GlueTriggerActionsNotificationProperty#getNotifyDelayAfter}
         * @param notifyDelayAfter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#notify_delay_after GlueTrigger#notify_delay_after}.
         * @return {@code this}
         */
        public Builder notifyDelayAfter(java.lang.Number notifyDelayAfter) {
            this.notifyDelayAfter = notifyDelayAfter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueTriggerActionsNotificationProperty}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueTriggerActionsNotificationProperty build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueTriggerActionsNotificationProperty}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueTriggerActionsNotificationProperty {
        private final java.lang.Number notifyDelayAfter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.notifyDelayAfter = software.amazon.jsii.Kernel.get(this, "notifyDelayAfter", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.notifyDelayAfter = builder.notifyDelayAfter;
        }

        @Override
        public final java.lang.Number getNotifyDelayAfter() {
            return this.notifyDelayAfter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNotifyDelayAfter() != null) {
                data.set("notifyDelayAfter", om.valueToTree(this.getNotifyDelayAfter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueTrigger.GlueTriggerActionsNotificationProperty"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueTriggerActionsNotificationProperty.Jsii$Proxy that = (GlueTriggerActionsNotificationProperty.Jsii$Proxy) o;

            return this.notifyDelayAfter != null ? this.notifyDelayAfter.equals(that.notifyDelayAfter) : that.notifyDelayAfter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.notifyDelayAfter != null ? this.notifyDelayAfter.hashCode() : 0;
            return result;
        }
    }
}
