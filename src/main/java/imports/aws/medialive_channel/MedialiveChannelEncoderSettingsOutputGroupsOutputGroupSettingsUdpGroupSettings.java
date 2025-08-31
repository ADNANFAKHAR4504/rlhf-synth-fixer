package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_action MedialiveChannel#input_loss_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputLossAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_id3_frame MedialiveChannel#timed_metadata_id3_frame}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataId3Frame() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_id3_period MedialiveChannel#timed_metadata_id3_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimedMetadataId3Period() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings> {
        java.lang.String inputLossAction;
        java.lang.String timedMetadataId3Frame;
        java.lang.Number timedMetadataId3Period;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings#getInputLossAction}
         * @param inputLossAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_action MedialiveChannel#input_loss_action}.
         * @return {@code this}
         */
        public Builder inputLossAction(java.lang.String inputLossAction) {
            this.inputLossAction = inputLossAction;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings#getTimedMetadataId3Frame}
         * @param timedMetadataId3Frame Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_id3_frame MedialiveChannel#timed_metadata_id3_frame}.
         * @return {@code this}
         */
        public Builder timedMetadataId3Frame(java.lang.String timedMetadataId3Frame) {
            this.timedMetadataId3Frame = timedMetadataId3Frame;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings#getTimedMetadataId3Period}
         * @param timedMetadataId3Period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_id3_period MedialiveChannel#timed_metadata_id3_period}.
         * @return {@code this}
         */
        public Builder timedMetadataId3Period(java.lang.Number timedMetadataId3Period) {
            this.timedMetadataId3Period = timedMetadataId3Period;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings {
        private final java.lang.String inputLossAction;
        private final java.lang.String timedMetadataId3Frame;
        private final java.lang.Number timedMetadataId3Period;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputLossAction = software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timedMetadataId3Frame = software.amazon.jsii.Kernel.get(this, "timedMetadataId3Frame", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timedMetadataId3Period = software.amazon.jsii.Kernel.get(this, "timedMetadataId3Period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputLossAction = builder.inputLossAction;
            this.timedMetadataId3Frame = builder.timedMetadataId3Frame;
            this.timedMetadataId3Period = builder.timedMetadataId3Period;
        }

        @Override
        public final java.lang.String getInputLossAction() {
            return this.inputLossAction;
        }

        @Override
        public final java.lang.String getTimedMetadataId3Frame() {
            return this.timedMetadataId3Frame;
        }

        @Override
        public final java.lang.Number getTimedMetadataId3Period() {
            return this.timedMetadataId3Period;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInputLossAction() != null) {
                data.set("inputLossAction", om.valueToTree(this.getInputLossAction()));
            }
            if (this.getTimedMetadataId3Frame() != null) {
                data.set("timedMetadataId3Frame", om.valueToTree(this.getTimedMetadataId3Frame()));
            }
            if (this.getTimedMetadataId3Period() != null) {
                data.set("timedMetadataId3Period", om.valueToTree(this.getTimedMetadataId3Period()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings.Jsii$Proxy) o;

            if (this.inputLossAction != null ? !this.inputLossAction.equals(that.inputLossAction) : that.inputLossAction != null) return false;
            if (this.timedMetadataId3Frame != null ? !this.timedMetadataId3Frame.equals(that.timedMetadataId3Frame) : that.timedMetadataId3Frame != null) return false;
            return this.timedMetadataId3Period != null ? this.timedMetadataId3Period.equals(that.timedMetadataId3Period) : that.timedMetadataId3Period == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputLossAction != null ? this.inputLossAction.hashCode() : 0;
            result = 31 * result + (this.timedMetadataId3Frame != null ? this.timedMetadataId3Frame.hashCode() : 0);
            result = 31 * result + (this.timedMetadataId3Period != null ? this.timedMetadataId3Period.hashCode() : 0);
            return result;
        }
    }
}
