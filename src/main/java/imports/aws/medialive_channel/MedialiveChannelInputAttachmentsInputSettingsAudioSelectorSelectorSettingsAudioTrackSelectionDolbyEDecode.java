package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_selection MedialiveChannel#program_selection}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProgramSelection();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode> {
        java.lang.String programSelection;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode#getProgramSelection}
         * @param programSelection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_selection MedialiveChannel#program_selection}. This parameter is required.
         * @return {@code this}
         */
        public Builder programSelection(java.lang.String programSelection) {
            this.programSelection = programSelection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode {
        private final java.lang.String programSelection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.programSelection = software.amazon.jsii.Kernel.get(this, "programSelection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.programSelection = java.util.Objects.requireNonNull(builder.programSelection, "programSelection is required");
        }

        @Override
        public final java.lang.String getProgramSelection() {
            return this.programSelection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("programSelection", om.valueToTree(this.getProgramSelection()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionDolbyEDecode.Jsii$Proxy) o;

            return this.programSelection.equals(that.programSelection);
        }

        @Override
        public final int hashCode() {
            int result = this.programSelection.hashCode();
            return result;
        }
    }
}
