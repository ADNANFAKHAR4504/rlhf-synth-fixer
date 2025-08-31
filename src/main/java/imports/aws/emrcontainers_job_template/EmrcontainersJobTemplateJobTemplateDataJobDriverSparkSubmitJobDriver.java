package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point EmrcontainersJobTemplate#entry_point}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEntryPoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point_arguments EmrcontainersJobTemplate#entry_point_arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEntryPointArguments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_submit_parameters EmrcontainersJobTemplate#spark_submit_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSparkSubmitParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver> {
        java.lang.String entryPoint;
        java.util.List<java.lang.String> entryPointArguments;
        java.lang.String sparkSubmitParameters;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver#getEntryPoint}
         * @param entryPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point EmrcontainersJobTemplate#entry_point}. This parameter is required.
         * @return {@code this}
         */
        public Builder entryPoint(java.lang.String entryPoint) {
            this.entryPoint = entryPoint;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver#getEntryPointArguments}
         * @param entryPointArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point_arguments EmrcontainersJobTemplate#entry_point_arguments}.
         * @return {@code this}
         */
        public Builder entryPointArguments(java.util.List<java.lang.String> entryPointArguments) {
            this.entryPointArguments = entryPointArguments;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver#getSparkSubmitParameters}
         * @param sparkSubmitParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_submit_parameters EmrcontainersJobTemplate#spark_submit_parameters}.
         * @return {@code this}
         */
        public Builder sparkSubmitParameters(java.lang.String sparkSubmitParameters) {
            this.sparkSubmitParameters = sparkSubmitParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver {
        private final java.lang.String entryPoint;
        private final java.util.List<java.lang.String> entryPointArguments;
        private final java.lang.String sparkSubmitParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entryPoint = software.amazon.jsii.Kernel.get(this, "entryPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.entryPointArguments = software.amazon.jsii.Kernel.get(this, "entryPointArguments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sparkSubmitParameters = software.amazon.jsii.Kernel.get(this, "sparkSubmitParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entryPoint = java.util.Objects.requireNonNull(builder.entryPoint, "entryPoint is required");
            this.entryPointArguments = builder.entryPointArguments;
            this.sparkSubmitParameters = builder.sparkSubmitParameters;
        }

        @Override
        public final java.lang.String getEntryPoint() {
            return this.entryPoint;
        }

        @Override
        public final java.util.List<java.lang.String> getEntryPointArguments() {
            return this.entryPointArguments;
        }

        @Override
        public final java.lang.String getSparkSubmitParameters() {
            return this.sparkSubmitParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("entryPoint", om.valueToTree(this.getEntryPoint()));
            if (this.getEntryPointArguments() != null) {
                data.set("entryPointArguments", om.valueToTree(this.getEntryPointArguments()));
            }
            if (this.getSparkSubmitParameters() != null) {
                data.set("sparkSubmitParameters", om.valueToTree(this.getSparkSubmitParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.Jsii$Proxy) o;

            if (!entryPoint.equals(that.entryPoint)) return false;
            if (this.entryPointArguments != null ? !this.entryPointArguments.equals(that.entryPointArguments) : that.entryPointArguments != null) return false;
            return this.sparkSubmitParameters != null ? this.sparkSubmitParameters.equals(that.sparkSubmitParameters) : that.sparkSubmitParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entryPoint.hashCode();
            result = 31 * result + (this.entryPointArguments != null ? this.entryPointArguments.hashCode() : 0);
            result = 31 * result + (this.sparkSubmitParameters != null ? this.sparkSubmitParameters.hashCode() : 0);
            return result;
        }
    }
}
