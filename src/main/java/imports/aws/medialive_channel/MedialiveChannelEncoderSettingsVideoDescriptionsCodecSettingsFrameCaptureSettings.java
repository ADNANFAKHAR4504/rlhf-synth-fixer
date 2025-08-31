package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#capture_interval MedialiveChannel#capture_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCaptureInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#capture_interval_units MedialiveChannel#capture_interval_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCaptureIntervalUnits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings> {
        java.lang.Number captureInterval;
        java.lang.String captureIntervalUnits;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings#getCaptureInterval}
         * @param captureInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#capture_interval MedialiveChannel#capture_interval}.
         * @return {@code this}
         */
        public Builder captureInterval(java.lang.Number captureInterval) {
            this.captureInterval = captureInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings#getCaptureIntervalUnits}
         * @param captureIntervalUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#capture_interval_units MedialiveChannel#capture_interval_units}.
         * @return {@code this}
         */
        public Builder captureIntervalUnits(java.lang.String captureIntervalUnits) {
            this.captureIntervalUnits = captureIntervalUnits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings {
        private final java.lang.Number captureInterval;
        private final java.lang.String captureIntervalUnits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.captureInterval = software.amazon.jsii.Kernel.get(this, "captureInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.captureIntervalUnits = software.amazon.jsii.Kernel.get(this, "captureIntervalUnits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.captureInterval = builder.captureInterval;
            this.captureIntervalUnits = builder.captureIntervalUnits;
        }

        @Override
        public final java.lang.Number getCaptureInterval() {
            return this.captureInterval;
        }

        @Override
        public final java.lang.String getCaptureIntervalUnits() {
            return this.captureIntervalUnits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCaptureInterval() != null) {
                data.set("captureInterval", om.valueToTree(this.getCaptureInterval()));
            }
            if (this.getCaptureIntervalUnits() != null) {
                data.set("captureIntervalUnits", om.valueToTree(this.getCaptureIntervalUnits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings.Jsii$Proxy) o;

            if (this.captureInterval != null ? !this.captureInterval.equals(that.captureInterval) : that.captureInterval != null) return false;
            return this.captureIntervalUnits != null ? this.captureIntervalUnits.equals(that.captureIntervalUnits) : that.captureIntervalUnits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.captureInterval != null ? this.captureInterval.hashCode() : 0;
            result = 31 * result + (this.captureIntervalUnits != null ? this.captureIntervalUnits.hashCode() : 0);
            return result;
        }
    }
}
