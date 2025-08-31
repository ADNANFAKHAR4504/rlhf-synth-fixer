package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.375Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationRecorderRecordingModeRecordingModeOverride.Jsii$Proxy.class)
public interface ConfigConfigurationRecorderRecordingModeRecordingModeOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordingFrequency();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceTypes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#description ConfigConfigurationRecorder#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationRecorderRecordingModeRecordingModeOverride> {
        java.lang.String recordingFrequency;
        java.util.List<java.lang.String> resourceTypes;
        java.lang.String description;

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride#getRecordingFrequency}
         * @param recordingFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordingFrequency(java.lang.String recordingFrequency) {
            this.recordingFrequency = recordingFrequency;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride#getResourceTypes}
         * @param resourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceTypes(java.util.List<java.lang.String> resourceTypes) {
            this.resourceTypes = resourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#description ConfigConfigurationRecorder#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationRecorderRecordingModeRecordingModeOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationRecorderRecordingModeRecordingModeOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationRecorderRecordingModeRecordingModeOverride {
        private final java.lang.String recordingFrequency;
        private final java.util.List<java.lang.String> resourceTypes;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordingFrequency = software.amazon.jsii.Kernel.get(this, "recordingFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTypes = software.amazon.jsii.Kernel.get(this, "resourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordingFrequency = java.util.Objects.requireNonNull(builder.recordingFrequency, "recordingFrequency is required");
            this.resourceTypes = java.util.Objects.requireNonNull(builder.resourceTypes, "resourceTypes is required");
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getRecordingFrequency() {
            return this.recordingFrequency;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypes() {
            return this.resourceTypes;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("recordingFrequency", om.valueToTree(this.getRecordingFrequency()));
            data.set("resourceTypes", om.valueToTree(this.getResourceTypes()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationRecorderRecordingModeRecordingModeOverride.Jsii$Proxy that = (ConfigConfigurationRecorderRecordingModeRecordingModeOverride.Jsii$Proxy) o;

            if (!recordingFrequency.equals(that.recordingFrequency)) return false;
            if (!resourceTypes.equals(that.resourceTypes)) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.recordingFrequency.hashCode();
            result = 31 * result + (this.resourceTypes.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
