package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.873Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_channel MedialiveChannel#caption_channel}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getCaptionChannel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_description MedialiveChannel#language_description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLanguageDescription();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings> {
        java.lang.Number captionChannel;
        java.lang.String languageCode;
        java.lang.String languageDescription;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings#getCaptionChannel}
         * @param captionChannel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_channel MedialiveChannel#caption_channel}. This parameter is required.
         * @return {@code this}
         */
        public Builder captionChannel(java.lang.Number captionChannel) {
            this.captionChannel = captionChannel;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings#getLanguageDescription}
         * @param languageDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_description MedialiveChannel#language_description}. This parameter is required.
         * @return {@code this}
         */
        public Builder languageDescription(java.lang.String languageDescription) {
            this.languageDescription = languageDescription;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings {
        private final java.lang.Number captionChannel;
        private final java.lang.String languageCode;
        private final java.lang.String languageDescription;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.captionChannel = software.amazon.jsii.Kernel.get(this, "captionChannel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.languageDescription = software.amazon.jsii.Kernel.get(this, "languageDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.captionChannel = java.util.Objects.requireNonNull(builder.captionChannel, "captionChannel is required");
            this.languageCode = java.util.Objects.requireNonNull(builder.languageCode, "languageCode is required");
            this.languageDescription = java.util.Objects.requireNonNull(builder.languageDescription, "languageDescription is required");
        }

        @Override
        public final java.lang.Number getCaptionChannel() {
            return this.captionChannel;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.lang.String getLanguageDescription() {
            return this.languageDescription;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("captionChannel", om.valueToTree(this.getCaptionChannel()));
            data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            data.set("languageDescription", om.valueToTree(this.getLanguageDescription()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings.Jsii$Proxy) o;

            if (!captionChannel.equals(that.captionChannel)) return false;
            if (!languageCode.equals(that.languageCode)) return false;
            return this.languageDescription.equals(that.languageDescription);
        }

        @Override
        public final int hashCode() {
            int result = this.captionChannel.hashCode();
            result = 31 * result + (this.languageCode.hashCode());
            result = 31 * result + (this.languageDescription.hashCode());
            return result;
        }
    }
}
