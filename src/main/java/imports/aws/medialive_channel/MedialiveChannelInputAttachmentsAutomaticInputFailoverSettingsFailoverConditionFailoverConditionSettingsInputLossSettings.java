package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_threshold_msec MedialiveChannel#input_loss_threshold_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInputLossThresholdMsec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings> {
        java.lang.Number inputLossThresholdMsec;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings#getInputLossThresholdMsec}
         * @param inputLossThresholdMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_threshold_msec MedialiveChannel#input_loss_threshold_msec}.
         * @return {@code this}
         */
        public Builder inputLossThresholdMsec(java.lang.Number inputLossThresholdMsec) {
            this.inputLossThresholdMsec = inputLossThresholdMsec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings {
        private final java.lang.Number inputLossThresholdMsec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputLossThresholdMsec = software.amazon.jsii.Kernel.get(this, "inputLossThresholdMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputLossThresholdMsec = builder.inputLossThresholdMsec;
        }

        @Override
        public final java.lang.Number getInputLossThresholdMsec() {
            return this.inputLossThresholdMsec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInputLossThresholdMsec() != null) {
                data.set("inputLossThresholdMsec", om.valueToTree(this.getInputLossThresholdMsec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings.Jsii$Proxy) o;

            return this.inputLossThresholdMsec != null ? this.inputLossThresholdMsec.equals(that.inputLossThresholdMsec) : that.inputLossThresholdMsec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputLossThresholdMsec != null ? this.inputLossThresholdMsec.hashCode() : 0;
            return result;
        }
    }
}
