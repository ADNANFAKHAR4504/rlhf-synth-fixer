package imports.aws.mwaa_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.923Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mwaaEnvironment.MwaaEnvironmentLoggingConfigurationTaskLogs")
@software.amazon.jsii.Jsii.Proxy(MwaaEnvironmentLoggingConfigurationTaskLogs.Jsii$Proxy.class)
public interface MwaaEnvironmentLoggingConfigurationTaskLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#enabled MwaaEnvironment#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#log_level MwaaEnvironment#log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MwaaEnvironmentLoggingConfigurationTaskLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MwaaEnvironmentLoggingConfigurationTaskLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MwaaEnvironmentLoggingConfigurationTaskLogs> {
        java.lang.Object enabled;
        java.lang.String logLevel;

        /**
         * Sets the value of {@link MwaaEnvironmentLoggingConfigurationTaskLogs#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#enabled MwaaEnvironment#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentLoggingConfigurationTaskLogs#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#enabled MwaaEnvironment#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentLoggingConfigurationTaskLogs#getLogLevel}
         * @param logLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#log_level MwaaEnvironment#log_level}.
         * @return {@code this}
         */
        public Builder logLevel(java.lang.String logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MwaaEnvironmentLoggingConfigurationTaskLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MwaaEnvironmentLoggingConfigurationTaskLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MwaaEnvironmentLoggingConfigurationTaskLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MwaaEnvironmentLoggingConfigurationTaskLogs {
        private final java.lang.Object enabled;
        private final java.lang.String logLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logLevel = software.amazon.jsii.Kernel.get(this, "logLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.logLevel = builder.logLevel;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getLogLevel() {
            return this.logLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getLogLevel() != null) {
                data.set("logLevel", om.valueToTree(this.getLogLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mwaaEnvironment.MwaaEnvironmentLoggingConfigurationTaskLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MwaaEnvironmentLoggingConfigurationTaskLogs.Jsii$Proxy that = (MwaaEnvironmentLoggingConfigurationTaskLogs.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            return this.logLevel != null ? this.logLevel.equals(that.logLevel) : that.logLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.logLevel != null ? this.logLevel.hashCode() : 0);
            return result;
        }
    }
}
