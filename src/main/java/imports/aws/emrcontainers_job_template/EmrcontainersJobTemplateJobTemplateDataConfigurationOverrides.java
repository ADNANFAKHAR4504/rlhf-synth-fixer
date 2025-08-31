package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * application_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#application_configuration EmrcontainersJobTemplate#application_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplicationConfiguration() {
        return null;
    }

    /**
     * monitoring_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#monitoring_configuration EmrcontainersJobTemplate#monitoring_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration getMonitoringConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides> {
        java.lang.Object applicationConfiguration;
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration monitoringConfiguration;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides#getApplicationConfiguration}
         * @param applicationConfiguration application_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#application_configuration EmrcontainersJobTemplate#application_configuration}
         * @return {@code this}
         */
        public Builder applicationConfiguration(com.hashicorp.cdktf.IResolvable applicationConfiguration) {
            this.applicationConfiguration = applicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides#getApplicationConfiguration}
         * @param applicationConfiguration application_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#application_configuration EmrcontainersJobTemplate#application_configuration}
         * @return {@code this}
         */
        public Builder applicationConfiguration(java.util.List<? extends imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesApplicationConfiguration> applicationConfiguration) {
            this.applicationConfiguration = applicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides#getMonitoringConfiguration}
         * @param monitoringConfiguration monitoring_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#monitoring_configuration EmrcontainersJobTemplate#monitoring_configuration}
         * @return {@code this}
         */
        public Builder monitoringConfiguration(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration monitoringConfiguration) {
            this.monitoringConfiguration = monitoringConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides {
        private final java.lang.Object applicationConfiguration;
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration monitoringConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationConfiguration = software.amazon.jsii.Kernel.get(this, "applicationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.monitoringConfiguration = software.amazon.jsii.Kernel.get(this, "monitoringConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationConfiguration = builder.applicationConfiguration;
            this.monitoringConfiguration = builder.monitoringConfiguration;
        }

        @Override
        public final java.lang.Object getApplicationConfiguration() {
            return this.applicationConfiguration;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration getMonitoringConfiguration() {
            return this.monitoringConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApplicationConfiguration() != null) {
                data.set("applicationConfiguration", om.valueToTree(this.getApplicationConfiguration()));
            }
            if (this.getMonitoringConfiguration() != null) {
                data.set("monitoringConfiguration", om.valueToTree(this.getMonitoringConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataConfigurationOverrides.Jsii$Proxy) o;

            if (this.applicationConfiguration != null ? !this.applicationConfiguration.equals(that.applicationConfiguration) : that.applicationConfiguration != null) return false;
            return this.monitoringConfiguration != null ? this.monitoringConfiguration.equals(that.monitoringConfiguration) : that.monitoringConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applicationConfiguration != null ? this.applicationConfiguration.hashCode() : 0;
            result = 31 * result + (this.monitoringConfiguration != null ? this.monitoringConfiguration.hashCode() : 0);
            return result;
        }
    }
}
