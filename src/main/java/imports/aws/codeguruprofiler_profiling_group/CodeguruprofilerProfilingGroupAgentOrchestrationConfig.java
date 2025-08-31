package imports.aws.codeguruprofiler_profiling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.327Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codeguruprofilerProfilingGroup.CodeguruprofilerProfilingGroupAgentOrchestrationConfig")
@software.amazon.jsii.Jsii.Proxy(CodeguruprofilerProfilingGroupAgentOrchestrationConfig.Jsii$Proxy.class)
public interface CodeguruprofilerProfilingGroupAgentOrchestrationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeguruprofiler_profiling_group#profiling_enabled CodeguruprofilerProfilingGroup#profiling_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getProfilingEnabled();

    /**
     * @return a {@link Builder} of {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodeguruprofilerProfilingGroupAgentOrchestrationConfig> {
        java.lang.Object profilingEnabled;

        /**
         * Sets the value of {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig#getProfilingEnabled}
         * @param profilingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeguruprofiler_profiling_group#profiling_enabled CodeguruprofilerProfilingGroup#profiling_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder profilingEnabled(java.lang.Boolean profilingEnabled) {
            this.profilingEnabled = profilingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig#getProfilingEnabled}
         * @param profilingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeguruprofiler_profiling_group#profiling_enabled CodeguruprofilerProfilingGroup#profiling_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder profilingEnabled(com.hashicorp.cdktf.IResolvable profilingEnabled) {
            this.profilingEnabled = profilingEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodeguruprofilerProfilingGroupAgentOrchestrationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodeguruprofilerProfilingGroupAgentOrchestrationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodeguruprofilerProfilingGroupAgentOrchestrationConfig {
        private final java.lang.Object profilingEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.profilingEnabled = software.amazon.jsii.Kernel.get(this, "profilingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.profilingEnabled = java.util.Objects.requireNonNull(builder.profilingEnabled, "profilingEnabled is required");
        }

        @Override
        public final java.lang.Object getProfilingEnabled() {
            return this.profilingEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("profilingEnabled", om.valueToTree(this.getProfilingEnabled()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codeguruprofilerProfilingGroup.CodeguruprofilerProfilingGroupAgentOrchestrationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodeguruprofilerProfilingGroupAgentOrchestrationConfig.Jsii$Proxy that = (CodeguruprofilerProfilingGroupAgentOrchestrationConfig.Jsii$Proxy) o;

            return this.profilingEnabled.equals(that.profilingEnabled);
        }

        @Override
        public final int hashCode() {
            int result = this.profilingEnabled.hashCode();
            return result;
        }
    }
}
