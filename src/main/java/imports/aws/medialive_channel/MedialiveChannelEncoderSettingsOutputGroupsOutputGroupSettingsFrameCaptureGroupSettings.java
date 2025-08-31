package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.872Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination getDestination();

    /**
     * frame_capture_cdn_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_cdn_settings MedialiveChannel#frame_capture_cdn_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings getFrameCaptureCdnSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination destination;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings frameCaptureCdnSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings#getFrameCaptureCdnSettings}
         * @param frameCaptureCdnSettings frame_capture_cdn_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_cdn_settings MedialiveChannel#frame_capture_cdn_settings}
         * @return {@code this}
         */
        public Builder frameCaptureCdnSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings frameCaptureCdnSettings) {
            this.frameCaptureCdnSettings = frameCaptureCdnSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination destination;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings frameCaptureCdnSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination.class));
            this.frameCaptureCdnSettings = software.amazon.jsii.Kernel.get(this, "frameCaptureCdnSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.frameCaptureCdnSettings = builder.frameCaptureCdnSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsDestination getDestination() {
            return this.destination;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettingsFrameCaptureCdnSettings getFrameCaptureCdnSettings() {
            return this.frameCaptureCdnSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            if (this.getFrameCaptureCdnSettings() != null) {
                data.set("frameCaptureCdnSettings", om.valueToTree(this.getFrameCaptureCdnSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            return this.frameCaptureCdnSettings != null ? this.frameCaptureCdnSettings.equals(that.frameCaptureCdnSettings) : that.frameCaptureCdnSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.frameCaptureCdnSettings != null ? this.frameCaptureCdnSettings.hashCode() : 0);
            return result;
        }
    }
}
