package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ocr_language MedialiveChannel#ocr_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOcrLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pid MedialiveChannel#pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPid() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings> {
        java.lang.String ocrLanguage;
        java.lang.Number pid;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings#getOcrLanguage}
         * @param ocrLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ocr_language MedialiveChannel#ocr_language}.
         * @return {@code this}
         */
        public Builder ocrLanguage(java.lang.String ocrLanguage) {
            this.ocrLanguage = ocrLanguage;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings#getPid}
         * @param pid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pid MedialiveChannel#pid}.
         * @return {@code this}
         */
        public Builder pid(java.lang.Number pid) {
            this.pid = pid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings {
        private final java.lang.String ocrLanguage;
        private final java.lang.Number pid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ocrLanguage = software.amazon.jsii.Kernel.get(this, "ocrLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pid = software.amazon.jsii.Kernel.get(this, "pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ocrLanguage = builder.ocrLanguage;
            this.pid = builder.pid;
        }

        @Override
        public final java.lang.String getOcrLanguage() {
            return this.ocrLanguage;
        }

        @Override
        public final java.lang.Number getPid() {
            return this.pid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOcrLanguage() != null) {
                data.set("ocrLanguage", om.valueToTree(this.getOcrLanguage()));
            }
            if (this.getPid() != null) {
                data.set("pid", om.valueToTree(this.getPid()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings.Jsii$Proxy) o;

            if (this.ocrLanguage != null ? !this.ocrLanguage.equals(that.ocrLanguage) : that.ocrLanguage != null) return false;
            return this.pid != null ? this.pid.equals(that.pid) : that.pid == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ocrLanguage != null ? this.ocrLanguage.hashCode() : 0;
            result = 31 * result + (this.pid != null ? this.pid.hashCode() : 0);
            return result;
        }
    }
}
