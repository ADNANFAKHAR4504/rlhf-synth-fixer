package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateData")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateData.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#execution_role_arn EmrcontainersJobTemplate#execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn();

    /**
     * job_driver block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#job_driver EmrcontainersJobTemplate#job_driver}
     */
    @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver getJobDriver();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#release_label EmrcontainersJobTemplate#release_label}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel();

    /**
     * configuration_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#configuration_overrides EmrcontainersJobTemplate#configuration_overrides}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides getConfigurationOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#job_tags EmrcontainersJobTemplate#job_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getJobTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateData> {
        java.lang.String executionRoleArn;
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver jobDriver;
        java.lang.String releaseLabel;
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides configurationOverrides;
        java.util.Map<java.lang.String, java.lang.String> jobTags;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateData#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#execution_role_arn EmrcontainersJobTemplate#execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateData#getJobDriver}
         * @param jobDriver job_driver block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#job_driver EmrcontainersJobTemplate#job_driver}
         * @return {@code this}
         */
        public Builder jobDriver(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver jobDriver) {
            this.jobDriver = jobDriver;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateData#getReleaseLabel}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#release_label EmrcontainersJobTemplate#release_label}. This parameter is required.
         * @return {@code this}
         */
        public Builder releaseLabel(java.lang.String releaseLabel) {
            this.releaseLabel = releaseLabel;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateData#getConfigurationOverrides}
         * @param configurationOverrides configuration_overrides block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#configuration_overrides EmrcontainersJobTemplate#configuration_overrides}
         * @return {@code this}
         */
        public Builder configurationOverrides(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides configurationOverrides) {
            this.configurationOverrides = configurationOverrides;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateData#getJobTags}
         * @param jobTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#job_tags EmrcontainersJobTemplate#job_tags}.
         * @return {@code this}
         */
        public Builder jobTags(java.util.Map<java.lang.String, java.lang.String> jobTags) {
            this.jobTags = jobTags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateData {
        private final java.lang.String executionRoleArn;
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver jobDriver;
        private final java.lang.String releaseLabel;
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides configurationOverrides;
        private final java.util.Map<java.lang.String, java.lang.String> jobTags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobDriver = software.amazon.jsii.Kernel.get(this, "jobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver.class));
            this.releaseLabel = software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationOverrides = software.amazon.jsii.Kernel.get(this, "configurationOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides.class));
            this.jobTags = software.amazon.jsii.Kernel.get(this, "jobTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executionRoleArn = java.util.Objects.requireNonNull(builder.executionRoleArn, "executionRoleArn is required");
            this.jobDriver = java.util.Objects.requireNonNull(builder.jobDriver, "jobDriver is required");
            this.releaseLabel = java.util.Objects.requireNonNull(builder.releaseLabel, "releaseLabel is required");
            this.configurationOverrides = builder.configurationOverrides;
            this.jobTags = builder.jobTags;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriver getJobDriver() {
            return this.jobDriver;
        }

        @Override
        public final java.lang.String getReleaseLabel() {
            return this.releaseLabel;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides getConfigurationOverrides() {
            return this.configurationOverrides;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getJobTags() {
            return this.jobTags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            data.set("jobDriver", om.valueToTree(this.getJobDriver()));
            data.set("releaseLabel", om.valueToTree(this.getReleaseLabel()));
            if (this.getConfigurationOverrides() != null) {
                data.set("configurationOverrides", om.valueToTree(this.getConfigurationOverrides()));
            }
            if (this.getJobTags() != null) {
                data.set("jobTags", om.valueToTree(this.getJobTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateData.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateData.Jsii$Proxy) o;

            if (!executionRoleArn.equals(that.executionRoleArn)) return false;
            if (!jobDriver.equals(that.jobDriver)) return false;
            if (!releaseLabel.equals(that.releaseLabel)) return false;
            if (this.configurationOverrides != null ? !this.configurationOverrides.equals(that.configurationOverrides) : that.configurationOverrides != null) return false;
            return this.jobTags != null ? this.jobTags.equals(that.jobTags) : that.jobTags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.executionRoleArn.hashCode();
            result = 31 * result + (this.jobDriver.hashCode());
            result = 31 * result + (this.releaseLabel.hashCode());
            result = 31 * result + (this.configurationOverrides != null ? this.configurationOverrides.hashCode() : 0);
            result = 31 * result + (this.jobTags != null ? this.jobTags.hashCode() : 0);
            return result;
        }
    }
}
