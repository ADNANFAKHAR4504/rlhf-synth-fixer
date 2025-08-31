package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentUpdatePolicy")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentUpdatePolicy.Jsii$Proxy.class)
public interface BatchComputeEnvironmentUpdatePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#job_execution_timeout_minutes BatchComputeEnvironment#job_execution_timeout_minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getJobExecutionTimeoutMinutes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#terminate_jobs_on_update BatchComputeEnvironment#terminate_jobs_on_update}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTerminateJobsOnUpdate();

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentUpdatePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentUpdatePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentUpdatePolicy> {
        java.lang.Number jobExecutionTimeoutMinutes;
        java.lang.Object terminateJobsOnUpdate;

        /**
         * Sets the value of {@link BatchComputeEnvironmentUpdatePolicy#getJobExecutionTimeoutMinutes}
         * @param jobExecutionTimeoutMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#job_execution_timeout_minutes BatchComputeEnvironment#job_execution_timeout_minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobExecutionTimeoutMinutes(java.lang.Number jobExecutionTimeoutMinutes) {
            this.jobExecutionTimeoutMinutes = jobExecutionTimeoutMinutes;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentUpdatePolicy#getTerminateJobsOnUpdate}
         * @param terminateJobsOnUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#terminate_jobs_on_update BatchComputeEnvironment#terminate_jobs_on_update}. This parameter is required.
         * @return {@code this}
         */
        public Builder terminateJobsOnUpdate(java.lang.Boolean terminateJobsOnUpdate) {
            this.terminateJobsOnUpdate = terminateJobsOnUpdate;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentUpdatePolicy#getTerminateJobsOnUpdate}
         * @param terminateJobsOnUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#terminate_jobs_on_update BatchComputeEnvironment#terminate_jobs_on_update}. This parameter is required.
         * @return {@code this}
         */
        public Builder terminateJobsOnUpdate(com.hashicorp.cdktf.IResolvable terminateJobsOnUpdate) {
            this.terminateJobsOnUpdate = terminateJobsOnUpdate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchComputeEnvironmentUpdatePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentUpdatePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentUpdatePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentUpdatePolicy {
        private final java.lang.Number jobExecutionTimeoutMinutes;
        private final java.lang.Object terminateJobsOnUpdate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.jobExecutionTimeoutMinutes = software.amazon.jsii.Kernel.get(this, "jobExecutionTimeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.terminateJobsOnUpdate = software.amazon.jsii.Kernel.get(this, "terminateJobsOnUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.jobExecutionTimeoutMinutes = java.util.Objects.requireNonNull(builder.jobExecutionTimeoutMinutes, "jobExecutionTimeoutMinutes is required");
            this.terminateJobsOnUpdate = java.util.Objects.requireNonNull(builder.terminateJobsOnUpdate, "terminateJobsOnUpdate is required");
        }

        @Override
        public final java.lang.Number getJobExecutionTimeoutMinutes() {
            return this.jobExecutionTimeoutMinutes;
        }

        @Override
        public final java.lang.Object getTerminateJobsOnUpdate() {
            return this.terminateJobsOnUpdate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("jobExecutionTimeoutMinutes", om.valueToTree(this.getJobExecutionTimeoutMinutes()));
            data.set("terminateJobsOnUpdate", om.valueToTree(this.getTerminateJobsOnUpdate()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentUpdatePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentUpdatePolicy.Jsii$Proxy that = (BatchComputeEnvironmentUpdatePolicy.Jsii$Proxy) o;

            if (!jobExecutionTimeoutMinutes.equals(that.jobExecutionTimeoutMinutes)) return false;
            return this.terminateJobsOnUpdate.equals(that.terminateJobsOnUpdate);
        }

        @Override
        public final int hashCode() {
            int result = this.jobExecutionTimeoutMinutes.hashCode();
            result = 31 * result + (this.terminateJobsOnUpdate.hashCode());
            return result;
        }
    }
}
