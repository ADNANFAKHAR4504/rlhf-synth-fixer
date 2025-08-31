package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#track MedialiveChannel#track}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTrack();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks> {
        java.lang.Number track;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks#getTrack}
         * @param track Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#track MedialiveChannel#track}. This parameter is required.
         * @return {@code this}
         */
        public Builder track(java.lang.Number track) {
            this.track = track;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks {
        private final java.lang.Number track;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.track = software.amazon.jsii.Kernel.get(this, "track", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.track = java.util.Objects.requireNonNull(builder.track, "track is required");
        }

        @Override
        public final java.lang.Number getTrack() {
            return this.track;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("track", om.valueToTree(this.getTrack()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelectionTracks.Jsii$Proxy) o;

            return this.track.equals(that.track);
        }

        @Override
        public final int hashCode() {
            int result = this.track.hashCode();
            return result;
        }
    }
}
