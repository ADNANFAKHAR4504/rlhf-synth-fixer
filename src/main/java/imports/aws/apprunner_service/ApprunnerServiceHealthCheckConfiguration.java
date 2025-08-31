package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceHealthCheckConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceHealthCheckConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceHealthCheckConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#healthy_threshold ApprunnerService#healthy_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthyThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#interval ApprunnerService#interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#path ApprunnerService#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#protocol ApprunnerService#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#timeout ApprunnerService#timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#unhealthy_threshold ApprunnerService#unhealthy_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceHealthCheckConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceHealthCheckConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceHealthCheckConfiguration> {
        java.lang.Number healthyThreshold;
        java.lang.Number interval;
        java.lang.String path;
        java.lang.String protocol;
        java.lang.Number timeout;
        java.lang.Number unhealthyThreshold;

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getHealthyThreshold}
         * @param healthyThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#healthy_threshold ApprunnerService#healthy_threshold}.
         * @return {@code this}
         */
        public Builder healthyThreshold(java.lang.Number healthyThreshold) {
            this.healthyThreshold = healthyThreshold;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getInterval}
         * @param interval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#interval ApprunnerService#interval}.
         * @return {@code this}
         */
        public Builder interval(java.lang.Number interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#path ApprunnerService#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#protocol ApprunnerService#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getTimeout}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#timeout ApprunnerService#timeout}.
         * @return {@code this}
         */
        public Builder timeout(java.lang.Number timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceHealthCheckConfiguration#getUnhealthyThreshold}
         * @param unhealthyThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#unhealthy_threshold ApprunnerService#unhealthy_threshold}.
         * @return {@code this}
         */
        public Builder unhealthyThreshold(java.lang.Number unhealthyThreshold) {
            this.unhealthyThreshold = unhealthyThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceHealthCheckConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceHealthCheckConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceHealthCheckConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceHealthCheckConfiguration {
        private final java.lang.Number healthyThreshold;
        private final java.lang.Number interval;
        private final java.lang.String path;
        private final java.lang.String protocol;
        private final java.lang.Number timeout;
        private final java.lang.Number unhealthyThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.healthyThreshold = software.amazon.jsii.Kernel.get(this, "healthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unhealthyThreshold = software.amazon.jsii.Kernel.get(this, "unhealthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.healthyThreshold = builder.healthyThreshold;
            this.interval = builder.interval;
            this.path = builder.path;
            this.protocol = builder.protocol;
            this.timeout = builder.timeout;
            this.unhealthyThreshold = builder.unhealthyThreshold;
        }

        @Override
        public final java.lang.Number getHealthyThreshold() {
            return this.healthyThreshold;
        }

        @Override
        public final java.lang.Number getInterval() {
            return this.interval;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.Number getTimeout() {
            return this.timeout;
        }

        @Override
        public final java.lang.Number getUnhealthyThreshold() {
            return this.unhealthyThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHealthyThreshold() != null) {
                data.set("healthyThreshold", om.valueToTree(this.getHealthyThreshold()));
            }
            if (this.getInterval() != null) {
                data.set("interval", om.valueToTree(this.getInterval()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }
            if (this.getUnhealthyThreshold() != null) {
                data.set("unhealthyThreshold", om.valueToTree(this.getUnhealthyThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceHealthCheckConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceHealthCheckConfiguration.Jsii$Proxy that = (ApprunnerServiceHealthCheckConfiguration.Jsii$Proxy) o;

            if (this.healthyThreshold != null ? !this.healthyThreshold.equals(that.healthyThreshold) : that.healthyThreshold != null) return false;
            if (this.interval != null ? !this.interval.equals(that.interval) : that.interval != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
            return this.unhealthyThreshold != null ? this.unhealthyThreshold.equals(that.unhealthyThreshold) : that.unhealthyThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.healthyThreshold != null ? this.healthyThreshold.hashCode() : 0;
            result = 31 * result + (this.interval != null ? this.interval.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            result = 31 * result + (this.unhealthyThreshold != null ? this.unhealthyThreshold.hashCode() : 0);
            return result;
        }
    }
}
