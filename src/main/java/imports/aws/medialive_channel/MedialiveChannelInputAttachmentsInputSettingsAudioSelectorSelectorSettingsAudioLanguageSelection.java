package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLanguageCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_selection_policy MedialiveChannel#language_selection_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageSelectionPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection> {
        java.lang.String languageCode;
        java.lang.String languageSelectionPolicy;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection#getLanguageSelectionPolicy}
         * @param languageSelectionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_selection_policy MedialiveChannel#language_selection_policy}.
         * @return {@code this}
         */
        public Builder languageSelectionPolicy(java.lang.String languageSelectionPolicy) {
            this.languageSelectionPolicy = languageSelectionPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection {
        private final java.lang.String languageCode;
        private final java.lang.String languageSelectionPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.languageSelectionPolicy = software.amazon.jsii.Kernel.get(this, "languageSelectionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.languageCode = java.util.Objects.requireNonNull(builder.languageCode, "languageCode is required");
            this.languageSelectionPolicy = builder.languageSelectionPolicy;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.lang.String getLanguageSelectionPolicy() {
            return this.languageSelectionPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            if (this.getLanguageSelectionPolicy() != null) {
                data.set("languageSelectionPolicy", om.valueToTree(this.getLanguageSelectionPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection.Jsii$Proxy) o;

            if (!languageCode.equals(that.languageCode)) return false;
            return this.languageSelectionPolicy != null ? this.languageSelectionPolicy.equals(that.languageSelectionPolicy) : that.languageSelectionPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.languageCode.hashCode();
            result = 31 * result + (this.languageSelectionPolicy != null ? this.languageSelectionPolicy.hashCode() : 0);
            return result;
        }
    }
}
