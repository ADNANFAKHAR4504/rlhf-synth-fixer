package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResourcesLaunchTemplate")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentComputeResourcesLaunchTemplate.Jsii$Proxy.class)
public interface BatchComputeEnvironmentComputeResourcesLaunchTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template_id BatchComputeEnvironment#launch_template_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template_name BatchComputeEnvironment#launch_template_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#version BatchComputeEnvironment#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentComputeResourcesLaunchTemplate> {
        java.lang.String launchTemplateId;
        java.lang.String launchTemplateName;
        java.lang.String version;

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate#getLaunchTemplateId}
         * @param launchTemplateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template_id BatchComputeEnvironment#launch_template_id}.
         * @return {@code this}
         */
        public Builder launchTemplateId(java.lang.String launchTemplateId) {
            this.launchTemplateId = launchTemplateId;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate#getLaunchTemplateName}
         * @param launchTemplateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template_name BatchComputeEnvironment#launch_template_name}.
         * @return {@code this}
         */
        public Builder launchTemplateName(java.lang.String launchTemplateName) {
            this.launchTemplateName = launchTemplateName;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#version BatchComputeEnvironment#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentComputeResourcesLaunchTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentComputeResourcesLaunchTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentComputeResourcesLaunchTemplate {
        private final java.lang.String launchTemplateId;
        private final java.lang.String launchTemplateName;
        private final java.lang.String version;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateId = software.amazon.jsii.Kernel.get(this, "launchTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateName = software.amazon.jsii.Kernel.get(this, "launchTemplateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateId = builder.launchTemplateId;
            this.launchTemplateName = builder.launchTemplateName;
            this.version = builder.version;
        }

        @Override
        public final java.lang.String getLaunchTemplateId() {
            return this.launchTemplateId;
        }

        @Override
        public final java.lang.String getLaunchTemplateName() {
            return this.launchTemplateName;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLaunchTemplateId() != null) {
                data.set("launchTemplateId", om.valueToTree(this.getLaunchTemplateId()));
            }
            if (this.getLaunchTemplateName() != null) {
                data.set("launchTemplateName", om.valueToTree(this.getLaunchTemplateName()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResourcesLaunchTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentComputeResourcesLaunchTemplate.Jsii$Proxy that = (BatchComputeEnvironmentComputeResourcesLaunchTemplate.Jsii$Proxy) o;

            if (this.launchTemplateId != null ? !this.launchTemplateId.equals(that.launchTemplateId) : that.launchTemplateId != null) return false;
            if (this.launchTemplateName != null ? !this.launchTemplateName.equals(that.launchTemplateName) : that.launchTemplateName != null) return false;
            return this.version != null ? this.version.equals(that.version) : that.version == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateId != null ? this.launchTemplateId.hashCode() : 0;
            result = 31 * result + (this.launchTemplateName != null ? this.launchTemplateName.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
            return result;
        }
    }
}
