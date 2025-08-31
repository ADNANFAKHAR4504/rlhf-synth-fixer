package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cbet_check_digit_string MedialiveChannel#cbet_check_digit_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCbetCheckDigitString();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cbet_stepaside MedialiveChannel#cbet_stepaside}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCbetStepaside();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#csid MedialiveChannel#csid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCsid();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings> {
        java.lang.String cbetCheckDigitString;
        java.lang.String cbetStepaside;
        java.lang.String csid;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings#getCbetCheckDigitString}
         * @param cbetCheckDigitString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cbet_check_digit_string MedialiveChannel#cbet_check_digit_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder cbetCheckDigitString(java.lang.String cbetCheckDigitString) {
            this.cbetCheckDigitString = cbetCheckDigitString;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings#getCbetStepaside}
         * @param cbetStepaside Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cbet_stepaside MedialiveChannel#cbet_stepaside}. This parameter is required.
         * @return {@code this}
         */
        public Builder cbetStepaside(java.lang.String cbetStepaside) {
            this.cbetStepaside = cbetStepaside;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings#getCsid}
         * @param csid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#csid MedialiveChannel#csid}. This parameter is required.
         * @return {@code this}
         */
        public Builder csid(java.lang.String csid) {
            this.csid = csid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings {
        private final java.lang.String cbetCheckDigitString;
        private final java.lang.String cbetStepaside;
        private final java.lang.String csid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cbetCheckDigitString = software.amazon.jsii.Kernel.get(this, "cbetCheckDigitString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cbetStepaside = software.amazon.jsii.Kernel.get(this, "cbetStepaside", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.csid = software.amazon.jsii.Kernel.get(this, "csid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cbetCheckDigitString = java.util.Objects.requireNonNull(builder.cbetCheckDigitString, "cbetCheckDigitString is required");
            this.cbetStepaside = java.util.Objects.requireNonNull(builder.cbetStepaside, "cbetStepaside is required");
            this.csid = java.util.Objects.requireNonNull(builder.csid, "csid is required");
        }

        @Override
        public final java.lang.String getCbetCheckDigitString() {
            return this.cbetCheckDigitString;
        }

        @Override
        public final java.lang.String getCbetStepaside() {
            return this.cbetStepaside;
        }

        @Override
        public final java.lang.String getCsid() {
            return this.csid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cbetCheckDigitString", om.valueToTree(this.getCbetCheckDigitString()));
            data.set("cbetStepaside", om.valueToTree(this.getCbetStepaside()));
            data.set("csid", om.valueToTree(this.getCsid()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings.Jsii$Proxy) o;

            if (!cbetCheckDigitString.equals(that.cbetCheckDigitString)) return false;
            if (!cbetStepaside.equals(that.cbetStepaside)) return false;
            return this.csid.equals(that.csid);
        }

        @Override
        public final int hashCode() {
            int result = this.cbetCheckDigitString.hashCode();
            result = 31 * result + (this.cbetStepaside.hashCode());
            result = 31 * result + (this.csid.hashCode());
            return result;
        }
    }
}
