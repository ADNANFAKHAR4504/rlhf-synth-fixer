package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriver")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataJobDriver.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataJobDriver extends software.amazon.jsii.JsiiSerializable {

    /**
     * spark_sql_job_driver block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_sql_job_driver EmrcontainersJobTemplate#spark_sql_job_driver}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver getSparkSqlJobDriver() {
        return null;
    }

    /**
     * spark_submit_job_driver block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_submit_job_driver EmrcontainersJobTemplate#spark_submit_job_driver}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver getSparkSubmitJobDriver() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataJobDriver}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataJobDriver}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataJobDriver> {
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver sparkSqlJobDriver;
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver sparkSubmitJobDriver;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriver#getSparkSqlJobDriver}
         * @param sparkSqlJobDriver spark_sql_job_driver block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_sql_job_driver EmrcontainersJobTemplate#spark_sql_job_driver}
         * @return {@code this}
         */
        public Builder sparkSqlJobDriver(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver sparkSqlJobDriver) {
            this.sparkSqlJobDriver = sparkSqlJobDriver;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriver#getSparkSubmitJobDriver}
         * @param sparkSubmitJobDriver spark_submit_job_driver block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_submit_job_driver EmrcontainersJobTemplate#spark_submit_job_driver}
         * @return {@code this}
         */
        public Builder sparkSubmitJobDriver(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver sparkSubmitJobDriver) {
            this.sparkSubmitJobDriver = sparkSubmitJobDriver;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataJobDriver}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataJobDriver build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataJobDriver}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataJobDriver {
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver sparkSqlJobDriver;
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver sparkSubmitJobDriver;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sparkSqlJobDriver = software.amazon.jsii.Kernel.get(this, "sparkSqlJobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.class));
            this.sparkSubmitJobDriver = software.amazon.jsii.Kernel.get(this, "sparkSubmitJobDriver", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sparkSqlJobDriver = builder.sparkSqlJobDriver;
            this.sparkSubmitJobDriver = builder.sparkSubmitJobDriver;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver getSparkSqlJobDriver() {
            return this.sparkSqlJobDriver;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSubmitJobDriver getSparkSubmitJobDriver() {
            return this.sparkSubmitJobDriver;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSparkSqlJobDriver() != null) {
                data.set("sparkSqlJobDriver", om.valueToTree(this.getSparkSqlJobDriver()));
            }
            if (this.getSparkSubmitJobDriver() != null) {
                data.set("sparkSubmitJobDriver", om.valueToTree(this.getSparkSubmitJobDriver()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriver"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataJobDriver.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataJobDriver.Jsii$Proxy) o;

            if (this.sparkSqlJobDriver != null ? !this.sparkSqlJobDriver.equals(that.sparkSqlJobDriver) : that.sparkSqlJobDriver != null) return false;
            return this.sparkSubmitJobDriver != null ? this.sparkSubmitJobDriver.equals(that.sparkSubmitJobDriver) : that.sparkSubmitJobDriver == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sparkSqlJobDriver != null ? this.sparkSqlJobDriver.hashCode() : 0;
            result = 31 * result + (this.sparkSubmitJobDriver != null ? this.sparkSubmitJobDriver.hashCode() : 0);
            return result;
        }
    }
}
