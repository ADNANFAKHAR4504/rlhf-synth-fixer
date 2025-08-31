package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationServiceTimeout")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfigurationServiceTimeout.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfigurationServiceTimeout extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#idle_timeout_seconds EcsService#idle_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#per_request_timeout_seconds EcsService#per_request_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerRequestTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfigurationServiceTimeout}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfigurationServiceTimeout}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfigurationServiceTimeout> {
        java.lang.Number idleTimeoutSeconds;
        java.lang.Number perRequestTimeoutSeconds;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTimeout#getIdleTimeoutSeconds}
         * @param idleTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#idle_timeout_seconds EcsService#idle_timeout_seconds}.
         * @return {@code this}
         */
        public Builder idleTimeoutSeconds(java.lang.Number idleTimeoutSeconds) {
            this.idleTimeoutSeconds = idleTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTimeout#getPerRequestTimeoutSeconds}
         * @param perRequestTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#per_request_timeout_seconds EcsService#per_request_timeout_seconds}.
         * @return {@code this}
         */
        public Builder perRequestTimeoutSeconds(java.lang.Number perRequestTimeoutSeconds) {
            this.perRequestTimeoutSeconds = perRequestTimeoutSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfigurationServiceTimeout}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfigurationServiceTimeout build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfigurationServiceTimeout}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfigurationServiceTimeout {
        private final java.lang.Number idleTimeoutSeconds;
        private final java.lang.Number perRequestTimeoutSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idleTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "idleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.perRequestTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "perRequestTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idleTimeoutSeconds = builder.idleTimeoutSeconds;
            this.perRequestTimeoutSeconds = builder.perRequestTimeoutSeconds;
        }

        @Override
        public final java.lang.Number getIdleTimeoutSeconds() {
            return this.idleTimeoutSeconds;
        }

        @Override
        public final java.lang.Number getPerRequestTimeoutSeconds() {
            return this.perRequestTimeoutSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdleTimeoutSeconds() != null) {
                data.set("idleTimeoutSeconds", om.valueToTree(this.getIdleTimeoutSeconds()));
            }
            if (this.getPerRequestTimeoutSeconds() != null) {
                data.set("perRequestTimeoutSeconds", om.valueToTree(this.getPerRequestTimeoutSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfigurationServiceTimeout"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfigurationServiceTimeout.Jsii$Proxy that = (EcsServiceServiceConnectConfigurationServiceTimeout.Jsii$Proxy) o;

            if (this.idleTimeoutSeconds != null ? !this.idleTimeoutSeconds.equals(that.idleTimeoutSeconds) : that.idleTimeoutSeconds != null) return false;
            return this.perRequestTimeoutSeconds != null ? this.perRequestTimeoutSeconds.equals(that.perRequestTimeoutSeconds) : that.perRequestTimeoutSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idleTimeoutSeconds != null ? this.idleTimeoutSeconds.hashCode() : 0;
            result = 31 * result + (this.perRequestTimeoutSeconds != null ? this.perRequestTimeoutSeconds.hashCode() : 0);
            return result;
        }
    }
}
