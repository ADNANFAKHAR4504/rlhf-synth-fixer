package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacityInitialCapacityConfig")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationInitialCapacityInitialCapacityConfig.Jsii$Proxy.class)
public interface EmrserverlessApplicationInitialCapacityInitialCapacityConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#worker_count EmrserverlessApplication#worker_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWorkerCount();

    /**
     * worker_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#worker_configuration EmrserverlessApplication#worker_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration getWorkerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationInitialCapacityInitialCapacityConfig> {
        java.lang.Number workerCount;
        imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration workerConfiguration;

        /**
         * Sets the value of {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig#getWorkerCount}
         * @param workerCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#worker_count EmrserverlessApplication#worker_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder workerCount(java.lang.Number workerCount) {
            this.workerCount = workerCount;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig#getWorkerConfiguration}
         * @param workerConfiguration worker_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#worker_configuration EmrserverlessApplication#worker_configuration}
         * @return {@code this}
         */
        public Builder workerConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration workerConfiguration) {
            this.workerConfiguration = workerConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationInitialCapacityInitialCapacityConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationInitialCapacityInitialCapacityConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationInitialCapacityInitialCapacityConfig {
        private final java.lang.Number workerCount;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration workerConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.workerCount = software.amazon.jsii.Kernel.get(this, "workerCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.workerConfiguration = software.amazon.jsii.Kernel.get(this, "workerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.workerCount = java.util.Objects.requireNonNull(builder.workerCount, "workerCount is required");
            this.workerConfiguration = builder.workerConfiguration;
        }

        @Override
        public final java.lang.Number getWorkerCount() {
            return this.workerCount;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfigWorkerConfiguration getWorkerConfiguration() {
            return this.workerConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("workerCount", om.valueToTree(this.getWorkerCount()));
            if (this.getWorkerConfiguration() != null) {
                data.set("workerConfiguration", om.valueToTree(this.getWorkerConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacityInitialCapacityConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationInitialCapacityInitialCapacityConfig.Jsii$Proxy that = (EmrserverlessApplicationInitialCapacityInitialCapacityConfig.Jsii$Proxy) o;

            if (!workerCount.equals(that.workerCount)) return false;
            return this.workerConfiguration != null ? this.workerConfiguration.equals(that.workerConfiguration) : that.workerConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.workerCount.hashCode();
            result = 31 * result + (this.workerConfiguration != null ? this.workerConfiguration.hashCode() : 0);
            return result;
        }
    }
}
