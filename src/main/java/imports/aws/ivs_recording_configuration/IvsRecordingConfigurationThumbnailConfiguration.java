package imports.aws.ivs_recording_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivsRecordingConfiguration.IvsRecordingConfigurationThumbnailConfiguration")
@software.amazon.jsii.Jsii.Proxy(IvsRecordingConfigurationThumbnailConfiguration.Jsii$Proxy.class)
public interface IvsRecordingConfigurationThumbnailConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#recording_mode IvsRecordingConfiguration#recording_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#target_interval_seconds IvsRecordingConfiguration#target_interval_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetIntervalSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IvsRecordingConfigurationThumbnailConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvsRecordingConfigurationThumbnailConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvsRecordingConfigurationThumbnailConfiguration> {
        java.lang.String recordingMode;
        java.lang.Number targetIntervalSeconds;

        /**
         * Sets the value of {@link IvsRecordingConfigurationThumbnailConfiguration#getRecordingMode}
         * @param recordingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#recording_mode IvsRecordingConfiguration#recording_mode}.
         * @return {@code this}
         */
        public Builder recordingMode(java.lang.String recordingMode) {
            this.recordingMode = recordingMode;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationThumbnailConfiguration#getTargetIntervalSeconds}
         * @param targetIntervalSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#target_interval_seconds IvsRecordingConfiguration#target_interval_seconds}.
         * @return {@code this}
         */
        public Builder targetIntervalSeconds(java.lang.Number targetIntervalSeconds) {
            this.targetIntervalSeconds = targetIntervalSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IvsRecordingConfigurationThumbnailConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvsRecordingConfigurationThumbnailConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvsRecordingConfigurationThumbnailConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvsRecordingConfigurationThumbnailConfiguration {
        private final java.lang.String recordingMode;
        private final java.lang.Number targetIntervalSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordingMode = software.amazon.jsii.Kernel.get(this, "recordingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetIntervalSeconds = software.amazon.jsii.Kernel.get(this, "targetIntervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordingMode = builder.recordingMode;
            this.targetIntervalSeconds = builder.targetIntervalSeconds;
        }

        @Override
        public final java.lang.String getRecordingMode() {
            return this.recordingMode;
        }

        @Override
        public final java.lang.Number getTargetIntervalSeconds() {
            return this.targetIntervalSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRecordingMode() != null) {
                data.set("recordingMode", om.valueToTree(this.getRecordingMode()));
            }
            if (this.getTargetIntervalSeconds() != null) {
                data.set("targetIntervalSeconds", om.valueToTree(this.getTargetIntervalSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ivsRecordingConfiguration.IvsRecordingConfigurationThumbnailConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvsRecordingConfigurationThumbnailConfiguration.Jsii$Proxy that = (IvsRecordingConfigurationThumbnailConfiguration.Jsii$Proxy) o;

            if (this.recordingMode != null ? !this.recordingMode.equals(that.recordingMode) : that.recordingMode != null) return false;
            return this.targetIntervalSeconds != null ? this.targetIntervalSeconds.equals(that.targetIntervalSeconds) : that.targetIntervalSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.recordingMode != null ? this.recordingMode.hashCode() : 0;
            result = 31 * result + (this.targetIntervalSeconds != null ? this.targetIntervalSeconds.hashCode() : 0);
            return result;
        }
    }
}
