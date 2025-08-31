package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroup")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationRecorderRecordingGroup.Jsii$Proxy.class)
public interface ConfigConfigurationRecorderRecordingGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllSupported() {
        return null;
    }

    /**
     * exclusion_by_resource_types block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExclusionByResourceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeGlobalResourceTypes() {
        return null;
    }

    /**
     * recording_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRecordingStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationRecorderRecordingGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationRecorderRecordingGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationRecorderRecordingGroup> {
        java.lang.Object allSupported;
        java.lang.Object exclusionByResourceTypes;
        java.lang.Object includeGlobalResourceTypes;
        java.lang.Object recordingStrategy;
        java.util.List<java.lang.String> resourceTypes;

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getAllSupported}
         * @param allSupported Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.
         * @return {@code this}
         */
        public Builder allSupported(java.lang.Boolean allSupported) {
            this.allSupported = allSupported;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getAllSupported}
         * @param allSupported Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.
         * @return {@code this}
         */
        public Builder allSupported(com.hashicorp.cdktf.IResolvable allSupported) {
            this.allSupported = allSupported;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getExclusionByResourceTypes}
         * @param exclusionByResourceTypes exclusion_by_resource_types block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
         * @return {@code this}
         */
        public Builder exclusionByResourceTypes(com.hashicorp.cdktf.IResolvable exclusionByResourceTypes) {
            this.exclusionByResourceTypes = exclusionByResourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getExclusionByResourceTypes}
         * @param exclusionByResourceTypes exclusion_by_resource_types block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
         * @return {@code this}
         */
        public Builder exclusionByResourceTypes(java.util.List<? extends imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes> exclusionByResourceTypes) {
            this.exclusionByResourceTypes = exclusionByResourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getIncludeGlobalResourceTypes}
         * @param includeGlobalResourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.
         * @return {@code this}
         */
        public Builder includeGlobalResourceTypes(java.lang.Boolean includeGlobalResourceTypes) {
            this.includeGlobalResourceTypes = includeGlobalResourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getIncludeGlobalResourceTypes}
         * @param includeGlobalResourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.
         * @return {@code this}
         */
        public Builder includeGlobalResourceTypes(com.hashicorp.cdktf.IResolvable includeGlobalResourceTypes) {
            this.includeGlobalResourceTypes = includeGlobalResourceTypes;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getRecordingStrategy}
         * @param recordingStrategy recording_strategy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
         * @return {@code this}
         */
        public Builder recordingStrategy(com.hashicorp.cdktf.IResolvable recordingStrategy) {
            this.recordingStrategy = recordingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getRecordingStrategy}
         * @param recordingStrategy recording_strategy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
         * @return {@code this}
         */
        public Builder recordingStrategy(java.util.List<? extends imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy> recordingStrategy) {
            this.recordingStrategy = recordingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationRecorderRecordingGroup#getResourceTypes}
         * @param resourceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
         * @return {@code this}
         */
        public Builder resourceTypes(java.util.List<java.lang.String> resourceTypes) {
            this.resourceTypes = resourceTypes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationRecorderRecordingGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationRecorderRecordingGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationRecorderRecordingGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationRecorderRecordingGroup {
        private final java.lang.Object allSupported;
        private final java.lang.Object exclusionByResourceTypes;
        private final java.lang.Object includeGlobalResourceTypes;
        private final java.lang.Object recordingStrategy;
        private final java.util.List<java.lang.String> resourceTypes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allSupported = software.amazon.jsii.Kernel.get(this, "allSupported", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.exclusionByResourceTypes = software.amazon.jsii.Kernel.get(this, "exclusionByResourceTypes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeGlobalResourceTypes = software.amazon.jsii.Kernel.get(this, "includeGlobalResourceTypes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recordingStrategy = software.amazon.jsii.Kernel.get(this, "recordingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceTypes = software.amazon.jsii.Kernel.get(this, "resourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allSupported = builder.allSupported;
            this.exclusionByResourceTypes = builder.exclusionByResourceTypes;
            this.includeGlobalResourceTypes = builder.includeGlobalResourceTypes;
            this.recordingStrategy = builder.recordingStrategy;
            this.resourceTypes = builder.resourceTypes;
        }

        @Override
        public final java.lang.Object getAllSupported() {
            return this.allSupported;
        }

        @Override
        public final java.lang.Object getExclusionByResourceTypes() {
            return this.exclusionByResourceTypes;
        }

        @Override
        public final java.lang.Object getIncludeGlobalResourceTypes() {
            return this.includeGlobalResourceTypes;
        }

        @Override
        public final java.lang.Object getRecordingStrategy() {
            return this.recordingStrategy;
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

            if (this.getAllSupported() != null) {
                data.set("allSupported", om.valueToTree(this.getAllSupported()));
            }
            if (this.getExclusionByResourceTypes() != null) {
                data.set("exclusionByResourceTypes", om.valueToTree(this.getExclusionByResourceTypes()));
            }
            if (this.getIncludeGlobalResourceTypes() != null) {
                data.set("includeGlobalResourceTypes", om.valueToTree(this.getIncludeGlobalResourceTypes()));
            }
            if (this.getRecordingStrategy() != null) {
                data.set("recordingStrategy", om.valueToTree(this.getRecordingStrategy()));
            }
            if (this.getResourceTypes() != null) {
                data.set("resourceTypes", om.valueToTree(this.getResourceTypes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationRecorderRecordingGroup.Jsii$Proxy that = (ConfigConfigurationRecorderRecordingGroup.Jsii$Proxy) o;

            if (this.allSupported != null ? !this.allSupported.equals(that.allSupported) : that.allSupported != null) return false;
            if (this.exclusionByResourceTypes != null ? !this.exclusionByResourceTypes.equals(that.exclusionByResourceTypes) : that.exclusionByResourceTypes != null) return false;
            if (this.includeGlobalResourceTypes != null ? !this.includeGlobalResourceTypes.equals(that.includeGlobalResourceTypes) : that.includeGlobalResourceTypes != null) return false;
            if (this.recordingStrategy != null ? !this.recordingStrategy.equals(that.recordingStrategy) : that.recordingStrategy != null) return false;
            return this.resourceTypes != null ? this.resourceTypes.equals(that.resourceTypes) : that.resourceTypes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allSupported != null ? this.allSupported.hashCode() : 0;
            result = 31 * result + (this.exclusionByResourceTypes != null ? this.exclusionByResourceTypes.hashCode() : 0);
            result = 31 * result + (this.includeGlobalResourceTypes != null ? this.includeGlobalResourceTypes.hashCode() : 0);
            result = 31 * result + (this.recordingStrategy != null ? this.recordingStrategy.hashCode() : 0);
            result = 31 * result + (this.resourceTypes != null ? this.resourceTypes.hashCode() : 0);
            return result;
        }
    }
}
