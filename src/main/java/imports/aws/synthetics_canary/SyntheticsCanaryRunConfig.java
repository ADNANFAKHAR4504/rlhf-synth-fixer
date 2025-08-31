package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryRunConfig")
@software.amazon.jsii.Jsii.Proxy(SyntheticsCanaryRunConfig.Jsii$Proxy.class)
public interface SyntheticsCanaryRunConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#active_tracing SyntheticsCanary#active_tracing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActiveTracing() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#environment_variables SyntheticsCanary#environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#memory_in_mb SyntheticsCanary#memory_in_mb}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemoryInMb() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#timeout_in_seconds SyntheticsCanary#timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SyntheticsCanaryRunConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SyntheticsCanaryRunConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SyntheticsCanaryRunConfig> {
        java.lang.Object activeTracing;
        java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        java.lang.Number memoryInMb;
        java.lang.Number timeoutInSeconds;

        /**
         * Sets the value of {@link SyntheticsCanaryRunConfig#getActiveTracing}
         * @param activeTracing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#active_tracing SyntheticsCanary#active_tracing}.
         * @return {@code this}
         */
        public Builder activeTracing(java.lang.Boolean activeTracing) {
            this.activeTracing = activeTracing;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryRunConfig#getActiveTracing}
         * @param activeTracing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#active_tracing SyntheticsCanary#active_tracing}.
         * @return {@code this}
         */
        public Builder activeTracing(com.hashicorp.cdktf.IResolvable activeTracing) {
            this.activeTracing = activeTracing;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryRunConfig#getEnvironmentVariables}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#environment_variables SyntheticsCanary#environment_variables}.
         * @return {@code this}
         */
        public Builder environmentVariables(java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.environmentVariables = environmentVariables;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryRunConfig#getMemoryInMb}
         * @param memoryInMb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#memory_in_mb SyntheticsCanary#memory_in_mb}.
         * @return {@code this}
         */
        public Builder memoryInMb(java.lang.Number memoryInMb) {
            this.memoryInMb = memoryInMb;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryRunConfig#getTimeoutInSeconds}
         * @param timeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#timeout_in_seconds SyntheticsCanary#timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder timeoutInSeconds(java.lang.Number timeoutInSeconds) {
            this.timeoutInSeconds = timeoutInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SyntheticsCanaryRunConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SyntheticsCanaryRunConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SyntheticsCanaryRunConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SyntheticsCanaryRunConfig {
        private final java.lang.Object activeTracing;
        private final java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        private final java.lang.Number memoryInMb;
        private final java.lang.Number timeoutInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.activeTracing = software.amazon.jsii.Kernel.get(this, "activeTracing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environmentVariables = software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.memoryInMb = software.amazon.jsii.Kernel.get(this, "memoryInMb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeoutInSeconds = software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.activeTracing = builder.activeTracing;
            this.environmentVariables = builder.environmentVariables;
            this.memoryInMb = builder.memoryInMb;
            this.timeoutInSeconds = builder.timeoutInSeconds;
        }

        @Override
        public final java.lang.Object getActiveTracing() {
            return this.activeTracing;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
            return this.environmentVariables;
        }

        @Override
        public final java.lang.Number getMemoryInMb() {
            return this.memoryInMb;
        }

        @Override
        public final java.lang.Number getTimeoutInSeconds() {
            return this.timeoutInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActiveTracing() != null) {
                data.set("activeTracing", om.valueToTree(this.getActiveTracing()));
            }
            if (this.getEnvironmentVariables() != null) {
                data.set("environmentVariables", om.valueToTree(this.getEnvironmentVariables()));
            }
            if (this.getMemoryInMb() != null) {
                data.set("memoryInMb", om.valueToTree(this.getMemoryInMb()));
            }
            if (this.getTimeoutInSeconds() != null) {
                data.set("timeoutInSeconds", om.valueToTree(this.getTimeoutInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.syntheticsCanary.SyntheticsCanaryRunConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SyntheticsCanaryRunConfig.Jsii$Proxy that = (SyntheticsCanaryRunConfig.Jsii$Proxy) o;

            if (this.activeTracing != null ? !this.activeTracing.equals(that.activeTracing) : that.activeTracing != null) return false;
            if (this.environmentVariables != null ? !this.environmentVariables.equals(that.environmentVariables) : that.environmentVariables != null) return false;
            if (this.memoryInMb != null ? !this.memoryInMb.equals(that.memoryInMb) : that.memoryInMb != null) return false;
            return this.timeoutInSeconds != null ? this.timeoutInSeconds.equals(that.timeoutInSeconds) : that.timeoutInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.activeTracing != null ? this.activeTracing.hashCode() : 0;
            result = 31 * result + (this.environmentVariables != null ? this.environmentVariables.hashCode() : 0);
            result = 31 * result + (this.memoryInMb != null ? this.memoryInMb.hashCode() : 0);
            result = 31 * result + (this.timeoutInSeconds != null ? this.timeoutInSeconds.hashCode() : 0);
            return result;
        }
    }
}
