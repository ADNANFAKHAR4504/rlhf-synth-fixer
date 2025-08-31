package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.371Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationRecorderRecordingGroupRecordingStrategy.Jsii$Proxy.class)
public interface ConfigConfigurationRecorderRecordingGroupRecordingStrategy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#use_only ConfigConfigurationRecorder#use_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUseOnly() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationRecorderRecordingGroupRecordingStrategy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationRecorderRecordingGroupRecordingStrategy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationRecorderRecordingGroupRecordingStrategy> {
        java.lang.String useOnly;

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroupRecordingStrategy#getUseOnly}
         * @param useOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#use_only ConfigConfigurationRecorder#use_only}.
         * @return {@code this}
         */
        public Builder useOnly(java.lang.String useOnly) {
            this.useOnly = useOnly;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationRecorderRecordingGroupRecordingStrategy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationRecorderRecordingGroupRecordingStrategy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationRecorderRecordingGroupRecordingStrategy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationRecorderRecordingGroupRecordingStrategy {
        private final java.lang.String useOnly;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.useOnly = software.amazon.jsii.Kernel.get(this, "useOnly", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.useOnly = builder.useOnly;
        }

        @Override
        public final java.lang.String getUseOnly() {
            return this.useOnly;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUseOnly() != null) {
                data.set("useOnly", om.valueToTree(this.getUseOnly()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationRecorderRecordingGroupRecordingStrategy.Jsii$Proxy that = (ConfigConfigurationRecorderRecordingGroupRecordingStrategy.Jsii$Proxy) o;

            return this.useOnly != null ? this.useOnly.equals(that.useOnly) : that.useOnly == null;
        }

        @Override
        public final int hashCode() {
            int result = this.useOnly != null ? this.useOnly.hashCode() : 0;
            return result;
        }
    }
}
