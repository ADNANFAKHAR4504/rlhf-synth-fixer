package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#black_detect_threshold MedialiveChannel#black_detect_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlackDetectThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_black_threshold_msec MedialiveChannel#video_black_threshold_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVideoBlackThresholdMsec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings> {
        java.lang.Number blackDetectThreshold;
        java.lang.Number videoBlackThresholdMsec;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings#getBlackDetectThreshold}
         * @param blackDetectThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#black_detect_threshold MedialiveChannel#black_detect_threshold}.
         * @return {@code this}
         */
        public Builder blackDetectThreshold(java.lang.Number blackDetectThreshold) {
            this.blackDetectThreshold = blackDetectThreshold;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings#getVideoBlackThresholdMsec}
         * @param videoBlackThresholdMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_black_threshold_msec MedialiveChannel#video_black_threshold_msec}.
         * @return {@code this}
         */
        public Builder videoBlackThresholdMsec(java.lang.Number videoBlackThresholdMsec) {
            this.videoBlackThresholdMsec = videoBlackThresholdMsec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings {
        private final java.lang.Number blackDetectThreshold;
        private final java.lang.Number videoBlackThresholdMsec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blackDetectThreshold = software.amazon.jsii.Kernel.get(this, "blackDetectThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.videoBlackThresholdMsec = software.amazon.jsii.Kernel.get(this, "videoBlackThresholdMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blackDetectThreshold = builder.blackDetectThreshold;
            this.videoBlackThresholdMsec = builder.videoBlackThresholdMsec;
        }

        @Override
        public final java.lang.Number getBlackDetectThreshold() {
            return this.blackDetectThreshold;
        }

        @Override
        public final java.lang.Number getVideoBlackThresholdMsec() {
            return this.videoBlackThresholdMsec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlackDetectThreshold() != null) {
                data.set("blackDetectThreshold", om.valueToTree(this.getBlackDetectThreshold()));
            }
            if (this.getVideoBlackThresholdMsec() != null) {
                data.set("videoBlackThresholdMsec", om.valueToTree(this.getVideoBlackThresholdMsec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings.Jsii$Proxy) o;

            if (this.blackDetectThreshold != null ? !this.blackDetectThreshold.equals(that.blackDetectThreshold) : that.blackDetectThreshold != null) return false;
            return this.videoBlackThresholdMsec != null ? this.videoBlackThresholdMsec.equals(that.videoBlackThresholdMsec) : that.videoBlackThresholdMsec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blackDetectThreshold != null ? this.blackDetectThreshold.hashCode() : 0;
            result = 31 * result + (this.videoBlackThresholdMsec != null ? this.videoBlackThresholdMsec.hashCode() : 0);
            return result;
        }
    }
}
