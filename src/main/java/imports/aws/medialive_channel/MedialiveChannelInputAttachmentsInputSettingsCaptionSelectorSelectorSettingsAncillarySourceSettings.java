package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_ancillary_channel_number MedialiveChannel#source_ancillary_channel_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSourceAncillaryChannelNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings> {
        java.lang.Number sourceAncillaryChannelNumber;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings#getSourceAncillaryChannelNumber}
         * @param sourceAncillaryChannelNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_ancillary_channel_number MedialiveChannel#source_ancillary_channel_number}.
         * @return {@code this}
         */
        public Builder sourceAncillaryChannelNumber(java.lang.Number sourceAncillaryChannelNumber) {
            this.sourceAncillaryChannelNumber = sourceAncillaryChannelNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings {
        private final java.lang.Number sourceAncillaryChannelNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceAncillaryChannelNumber = software.amazon.jsii.Kernel.get(this, "sourceAncillaryChannelNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceAncillaryChannelNumber = builder.sourceAncillaryChannelNumber;
        }

        @Override
        public final java.lang.Number getSourceAncillaryChannelNumber() {
            return this.sourceAncillaryChannelNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceAncillaryChannelNumber() != null) {
                data.set("sourceAncillaryChannelNumber", om.valueToTree(this.getSourceAncillaryChannelNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings.Jsii$Proxy) o;

            return this.sourceAncillaryChannelNumber != null ? this.sourceAncillaryChannelNumber.equals(that.sourceAncillaryChannelNumber) : that.sourceAncillaryChannelNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceAncillaryChannelNumber != null ? this.sourceAncillaryChannelNumber.hashCode() : 0;
            return result;
        }
    }
}
