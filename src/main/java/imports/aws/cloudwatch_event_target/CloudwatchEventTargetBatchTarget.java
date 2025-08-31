package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetBatchTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetBatchTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetBatchTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_definition CloudwatchEventTarget#job_definition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJobDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_name CloudwatchEventTarget#job_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJobName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#array_size CloudwatchEventTarget#array_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getArraySize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_attempts CloudwatchEventTarget#job_attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getJobAttempts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetBatchTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetBatchTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetBatchTarget> {
        java.lang.String jobDefinition;
        java.lang.String jobName;
        java.lang.Number arraySize;
        java.lang.Number jobAttempts;

        /**
         * Sets the value of {@link CloudwatchEventTargetBatchTarget#getJobDefinition}
         * @param jobDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_definition CloudwatchEventTarget#job_definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobDefinition(java.lang.String jobDefinition) {
            this.jobDefinition = jobDefinition;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetBatchTarget#getJobName}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_name CloudwatchEventTarget#job_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobName(java.lang.String jobName) {
            this.jobName = jobName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetBatchTarget#getArraySize}
         * @param arraySize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#array_size CloudwatchEventTarget#array_size}.
         * @return {@code this}
         */
        public Builder arraySize(java.lang.Number arraySize) {
            this.arraySize = arraySize;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventTargetBatchTarget#getJobAttempts}
         * @param jobAttempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#job_attempts CloudwatchEventTarget#job_attempts}.
         * @return {@code this}
         */
        public Builder jobAttempts(java.lang.Number jobAttempts) {
            this.jobAttempts = jobAttempts;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetBatchTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetBatchTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetBatchTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetBatchTarget {
        private final java.lang.String jobDefinition;
        private final java.lang.String jobName;
        private final java.lang.Number arraySize;
        private final java.lang.Number jobAttempts;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.jobDefinition = software.amazon.jsii.Kernel.get(this, "jobDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobName = software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.arraySize = software.amazon.jsii.Kernel.get(this, "arraySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.jobAttempts = software.amazon.jsii.Kernel.get(this, "jobAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.jobDefinition = java.util.Objects.requireNonNull(builder.jobDefinition, "jobDefinition is required");
            this.jobName = java.util.Objects.requireNonNull(builder.jobName, "jobName is required");
            this.arraySize = builder.arraySize;
            this.jobAttempts = builder.jobAttempts;
        }

        @Override
        public final java.lang.String getJobDefinition() {
            return this.jobDefinition;
        }

        @Override
        public final java.lang.String getJobName() {
            return this.jobName;
        }

        @Override
        public final java.lang.Number getArraySize() {
            return this.arraySize;
        }

        @Override
        public final java.lang.Number getJobAttempts() {
            return this.jobAttempts;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("jobDefinition", om.valueToTree(this.getJobDefinition()));
            data.set("jobName", om.valueToTree(this.getJobName()));
            if (this.getArraySize() != null) {
                data.set("arraySize", om.valueToTree(this.getArraySize()));
            }
            if (this.getJobAttempts() != null) {
                data.set("jobAttempts", om.valueToTree(this.getJobAttempts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetBatchTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetBatchTarget.Jsii$Proxy that = (CloudwatchEventTargetBatchTarget.Jsii$Proxy) o;

            if (!jobDefinition.equals(that.jobDefinition)) return false;
            if (!jobName.equals(that.jobName)) return false;
            if (this.arraySize != null ? !this.arraySize.equals(that.arraySize) : that.arraySize != null) return false;
            return this.jobAttempts != null ? this.jobAttempts.equals(that.jobAttempts) : that.jobAttempts == null;
        }

        @Override
        public final int hashCode() {
            int result = this.jobDefinition.hashCode();
            result = 31 * result + (this.jobName.hashCode());
            result = 31 * result + (this.arraySize != null ? this.arraySize.hashCode() : 0);
            result = 31 * result + (this.jobAttempts != null ? this.jobAttempts.hashCode() : 0);
            return result;
        }
    }
}
