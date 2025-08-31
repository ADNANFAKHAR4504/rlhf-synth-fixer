package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.375Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingMode")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationRecorderRecordingMode.Jsii$Proxy.class)
public interface ConfigConfigurationRecorderRecordingMode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordingFrequency() {
        return null;
    }

    /**
     * recording_mode_override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode_override ConfigConfigurationRecorder#recording_mode_override}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride getRecordingModeOverride() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationRecorderRecordingMode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationRecorderRecordingMode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationRecorderRecordingMode> {
        java.lang.String recordingFrequency;
        imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride recordingModeOverride;

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingMode#getRecordingFrequency}
         * @param recordingFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
         * @return {@code this}
         */
        public Builder recordingFrequency(java.lang.String recordingFrequency) {
            this.recordingFrequency = recordingFrequency;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingMode#getRecordingModeOverride}
         * @param recordingModeOverride recording_mode_override block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode_override ConfigConfigurationRecorder#recording_mode_override}
         * @return {@code this}
         */
        public Builder recordingModeOverride(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride recordingModeOverride) {
            this.recordingModeOverride = recordingModeOverride;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationRecorderRecordingMode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationRecorderRecordingMode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationRecorderRecordingMode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationRecorderRecordingMode {
        private final java.lang.String recordingFrequency;
        private final imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride recordingModeOverride;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordingFrequency = software.amazon.jsii.Kernel.get(this, "recordingFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordingModeOverride = software.amazon.jsii.Kernel.get(this, "recordingModeOverride", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordingFrequency = builder.recordingFrequency;
            this.recordingModeOverride = builder.recordingModeOverride;
        }

        @Override
        public final java.lang.String getRecordingFrequency() {
            return this.recordingFrequency;
        }

        @Override
        public final imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride getRecordingModeOverride() {
            return this.recordingModeOverride;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRecordingFrequency() != null) {
                data.set("recordingFrequency", om.valueToTree(this.getRecordingFrequency()));
            }
            if (this.getRecordingModeOverride() != null) {
                data.set("recordingModeOverride", om.valueToTree(this.getRecordingModeOverride()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingMode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationRecorderRecordingMode.Jsii$Proxy that = (ConfigConfigurationRecorderRecordingMode.Jsii$Proxy) o;

            if (this.recordingFrequency != null ? !this.recordingFrequency.equals(that.recordingFrequency) : that.recordingFrequency != null) return false;
            return this.recordingModeOverride != null ? this.recordingModeOverride.equals(that.recordingModeOverride) : that.recordingModeOverride == null;
        }

        @Override
        public final int hashCode() {
            int result = this.recordingFrequency != null ? this.recordingFrequency.hashCode() : 0;
            result = 31 * result + (this.recordingModeOverride != null ? this.recordingModeOverride.hashCode() : 0);
            return result;
        }
    }
}
