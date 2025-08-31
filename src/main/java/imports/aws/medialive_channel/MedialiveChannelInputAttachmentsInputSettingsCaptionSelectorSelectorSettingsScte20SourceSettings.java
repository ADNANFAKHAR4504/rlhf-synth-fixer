package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#convert_608_to_708 MedialiveChannel#convert_608_to_708}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConvert608To708() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_608_channel_number MedialiveChannel#source_608_channel_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSource608ChannelNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings> {
        java.lang.String convert608To708;
        java.lang.Number source608ChannelNumber;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings#getConvert608To708}
         * @param convert608To708 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#convert_608_to_708 MedialiveChannel#convert_608_to_708}.
         * @return {@code this}
         */
        public Builder convert608To708(java.lang.String convert608To708) {
            this.convert608To708 = convert608To708;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings#getSource608ChannelNumber}
         * @param source608ChannelNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_608_channel_number MedialiveChannel#source_608_channel_number}.
         * @return {@code this}
         */
        public Builder source608ChannelNumber(java.lang.Number source608ChannelNumber) {
            this.source608ChannelNumber = source608ChannelNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings {
        private final java.lang.String convert608To708;
        private final java.lang.Number source608ChannelNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.convert608To708 = software.amazon.jsii.Kernel.get(this, "convert608To708", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source608ChannelNumber = software.amazon.jsii.Kernel.get(this, "source608ChannelNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.convert608To708 = builder.convert608To708;
            this.source608ChannelNumber = builder.source608ChannelNumber;
        }

        @Override
        public final java.lang.String getConvert608To708() {
            return this.convert608To708;
        }

        @Override
        public final java.lang.Number getSource608ChannelNumber() {
            return this.source608ChannelNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConvert608To708() != null) {
                data.set("convert608To708", om.valueToTree(this.getConvert608To708()));
            }
            if (this.getSource608ChannelNumber() != null) {
                data.set("source608ChannelNumber", om.valueToTree(this.getSource608ChannelNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings.Jsii$Proxy) o;

            if (this.convert608To708 != null ? !this.convert608To708.equals(that.convert608To708) : that.convert608To708 != null) return false;
            return this.source608ChannelNumber != null ? this.source608ChannelNumber.equals(that.source608ChannelNumber) : that.source608ChannelNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.convert608To708 != null ? this.convert608To708.hashCode() : 0;
            result = 31 * result + (this.source608ChannelNumber != null ? this.source608ChannelNumber.hashCode() : 0);
            return result;
        }
    }
}
