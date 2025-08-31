package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfiguration")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsGlobalConfiguration.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsGlobalConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#initial_audio_gain MedialiveChannel#initial_audio_gain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInitialAudioGain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_end_action MedialiveChannel#input_end_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputEndAction() {
        return null;
    }

    /**
     * input_loss_behavior block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_behavior MedialiveChannel#input_loss_behavior}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior getInputLossBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_locking_mode MedialiveChannel#output_locking_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputLockingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_timing_source MedialiveChannel#output_timing_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputTimingSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#support_low_framerate_inputs MedialiveChannel#support_low_framerate_inputs}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSupportLowFramerateInputs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsGlobalConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsGlobalConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsGlobalConfiguration> {
        java.lang.Number initialAudioGain;
        java.lang.String inputEndAction;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior inputLossBehavior;
        java.lang.String outputLockingMode;
        java.lang.String outputTimingSource;
        java.lang.String supportLowFramerateInputs;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getInitialAudioGain}
         * @param initialAudioGain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#initial_audio_gain MedialiveChannel#initial_audio_gain}.
         * @return {@code this}
         */
        public Builder initialAudioGain(java.lang.Number initialAudioGain) {
            this.initialAudioGain = initialAudioGain;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getInputEndAction}
         * @param inputEndAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_end_action MedialiveChannel#input_end_action}.
         * @return {@code this}
         */
        public Builder inputEndAction(java.lang.String inputEndAction) {
            this.inputEndAction = inputEndAction;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getInputLossBehavior}
         * @param inputLossBehavior input_loss_behavior block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_behavior MedialiveChannel#input_loss_behavior}
         * @return {@code this}
         */
        public Builder inputLossBehavior(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior inputLossBehavior) {
            this.inputLossBehavior = inputLossBehavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getOutputLockingMode}
         * @param outputLockingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_locking_mode MedialiveChannel#output_locking_mode}.
         * @return {@code this}
         */
        public Builder outputLockingMode(java.lang.String outputLockingMode) {
            this.outputLockingMode = outputLockingMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getOutputTimingSource}
         * @param outputTimingSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_timing_source MedialiveChannel#output_timing_source}.
         * @return {@code this}
         */
        public Builder outputTimingSource(java.lang.String outputTimingSource) {
            this.outputTimingSource = outputTimingSource;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfiguration#getSupportLowFramerateInputs}
         * @param supportLowFramerateInputs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#support_low_framerate_inputs MedialiveChannel#support_low_framerate_inputs}.
         * @return {@code this}
         */
        public Builder supportLowFramerateInputs(java.lang.String supportLowFramerateInputs) {
            this.supportLowFramerateInputs = supportLowFramerateInputs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsGlobalConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsGlobalConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsGlobalConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsGlobalConfiguration {
        private final java.lang.Number initialAudioGain;
        private final java.lang.String inputEndAction;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior inputLossBehavior;
        private final java.lang.String outputLockingMode;
        private final java.lang.String outputTimingSource;
        private final java.lang.String supportLowFramerateInputs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.initialAudioGain = software.amazon.jsii.Kernel.get(this, "initialAudioGain", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.inputEndAction = software.amazon.jsii.Kernel.get(this, "inputEndAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputLossBehavior = software.amazon.jsii.Kernel.get(this, "inputLossBehavior", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.class));
            this.outputLockingMode = software.amazon.jsii.Kernel.get(this, "outputLockingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputTimingSource = software.amazon.jsii.Kernel.get(this, "outputTimingSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportLowFramerateInputs = software.amazon.jsii.Kernel.get(this, "supportLowFramerateInputs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.initialAudioGain = builder.initialAudioGain;
            this.inputEndAction = builder.inputEndAction;
            this.inputLossBehavior = builder.inputLossBehavior;
            this.outputLockingMode = builder.outputLockingMode;
            this.outputTimingSource = builder.outputTimingSource;
            this.supportLowFramerateInputs = builder.supportLowFramerateInputs;
        }

        @Override
        public final java.lang.Number getInitialAudioGain() {
            return this.initialAudioGain;
        }

        @Override
        public final java.lang.String getInputEndAction() {
            return this.inputEndAction;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior getInputLossBehavior() {
            return this.inputLossBehavior;
        }

        @Override
        public final java.lang.String getOutputLockingMode() {
            return this.outputLockingMode;
        }

        @Override
        public final java.lang.String getOutputTimingSource() {
            return this.outputTimingSource;
        }

        @Override
        public final java.lang.String getSupportLowFramerateInputs() {
            return this.supportLowFramerateInputs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInitialAudioGain() != null) {
                data.set("initialAudioGain", om.valueToTree(this.getInitialAudioGain()));
            }
            if (this.getInputEndAction() != null) {
                data.set("inputEndAction", om.valueToTree(this.getInputEndAction()));
            }
            if (this.getInputLossBehavior() != null) {
                data.set("inputLossBehavior", om.valueToTree(this.getInputLossBehavior()));
            }
            if (this.getOutputLockingMode() != null) {
                data.set("outputLockingMode", om.valueToTree(this.getOutputLockingMode()));
            }
            if (this.getOutputTimingSource() != null) {
                data.set("outputTimingSource", om.valueToTree(this.getOutputTimingSource()));
            }
            if (this.getSupportLowFramerateInputs() != null) {
                data.set("supportLowFramerateInputs", om.valueToTree(this.getSupportLowFramerateInputs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsGlobalConfiguration.Jsii$Proxy that = (MedialiveChannelEncoderSettingsGlobalConfiguration.Jsii$Proxy) o;

            if (this.initialAudioGain != null ? !this.initialAudioGain.equals(that.initialAudioGain) : that.initialAudioGain != null) return false;
            if (this.inputEndAction != null ? !this.inputEndAction.equals(that.inputEndAction) : that.inputEndAction != null) return false;
            if (this.inputLossBehavior != null ? !this.inputLossBehavior.equals(that.inputLossBehavior) : that.inputLossBehavior != null) return false;
            if (this.outputLockingMode != null ? !this.outputLockingMode.equals(that.outputLockingMode) : that.outputLockingMode != null) return false;
            if (this.outputTimingSource != null ? !this.outputTimingSource.equals(that.outputTimingSource) : that.outputTimingSource != null) return false;
            return this.supportLowFramerateInputs != null ? this.supportLowFramerateInputs.equals(that.supportLowFramerateInputs) : that.supportLowFramerateInputs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.initialAudioGain != null ? this.initialAudioGain.hashCode() : 0;
            result = 31 * result + (this.inputEndAction != null ? this.inputEndAction.hashCode() : 0);
            result = 31 * result + (this.inputLossBehavior != null ? this.inputLossBehavior.hashCode() : 0);
            result = 31 * result + (this.outputLockingMode != null ? this.outputLockingMode.hashCode() : 0);
            result = 31 * result + (this.outputTimingSource != null ? this.outputTimingSource.hashCode() : 0);
            result = 31 * result + (this.supportLowFramerateInputs != null ? this.supportLowFramerateInputs.hashCode() : 0);
            return result;
        }
    }
}
