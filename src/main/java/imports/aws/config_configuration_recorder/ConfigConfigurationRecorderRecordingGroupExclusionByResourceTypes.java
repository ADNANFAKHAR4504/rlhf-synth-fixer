package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.371Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes.Jsii$Proxy.class)
public interface ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes> {
        java.util.List<java.lang.String> resourceTypes;

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes#getResourceTypes}
         * @param resourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
         * @return {@code this}
         */
        public Builder resourceTypes(java.util.List<java.lang.String> resourceTypes) {
            this.resourceTypes = resourceTypes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes {
        private final java.util.List<java.lang.String> resourceTypes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceTypes = software.amazon.jsii.Kernel.get(this, "resourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceTypes = builder.resourceTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypes() {
            return this.resourceTypes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getResourceTypes() != null) {
                data.set("resourceTypes", om.valueToTree(this.getResourceTypes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes.Jsii$Proxy that = (ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes.Jsii$Proxy) o;

            return this.resourceTypes != null ? this.resourceTypes.equals(that.resourceTypes) : that.resourceTypes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceTypes != null ? this.resourceTypes.hashCode() : 0;
            return result;
        }
    }
}
