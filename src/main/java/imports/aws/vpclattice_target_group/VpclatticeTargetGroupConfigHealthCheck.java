package imports.aws.vpclattice_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.629Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigHealthCheck")
@software.amazon.jsii.Jsii.Proxy(VpclatticeTargetGroupConfigHealthCheck.Jsii$Proxy.class)
public interface VpclatticeTargetGroupConfigHealthCheck extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#enabled VpclatticeTargetGroup#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check_interval_seconds VpclatticeTargetGroup#health_check_interval_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckIntervalSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check_timeout_seconds VpclatticeTargetGroup#health_check_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#healthy_threshold_count VpclatticeTargetGroup#healthy_threshold_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthyThresholdCount() {
        return null;
    }

    /**
     * matcher block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#matcher VpclatticeTargetGroup#matcher}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher getMatcher() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#path VpclatticeTargetGroup#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#port VpclatticeTargetGroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol VpclatticeTargetGroup#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol_version VpclatticeTargetGroup#protocol_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocolVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#unhealthy_threshold_count VpclatticeTargetGroup#unhealthy_threshold_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyThresholdCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeTargetGroupConfigHealthCheck}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeTargetGroupConfigHealthCheck}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeTargetGroupConfigHealthCheck> {
        java.lang.Object enabled;
        java.lang.Number healthCheckIntervalSeconds;
        java.lang.Number healthCheckTimeoutSeconds;
        java.lang.Number healthyThresholdCount;
        imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher matcher;
        java.lang.String path;
        java.lang.Number port;
        java.lang.String protocol;
        java.lang.String protocolVersion;
        java.lang.Number unhealthyThresholdCount;

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#enabled VpclatticeTargetGroup#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#enabled VpclatticeTargetGroup#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getHealthCheckIntervalSeconds}
         * @param healthCheckIntervalSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check_interval_seconds VpclatticeTargetGroup#health_check_interval_seconds}.
         * @return {@code this}
         */
        public Builder healthCheckIntervalSeconds(java.lang.Number healthCheckIntervalSeconds) {
            this.healthCheckIntervalSeconds = healthCheckIntervalSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getHealthCheckTimeoutSeconds}
         * @param healthCheckTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check_timeout_seconds VpclatticeTargetGroup#health_check_timeout_seconds}.
         * @return {@code this}
         */
        public Builder healthCheckTimeoutSeconds(java.lang.Number healthCheckTimeoutSeconds) {
            this.healthCheckTimeoutSeconds = healthCheckTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getHealthyThresholdCount}
         * @param healthyThresholdCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#healthy_threshold_count VpclatticeTargetGroup#healthy_threshold_count}.
         * @return {@code this}
         */
        public Builder healthyThresholdCount(java.lang.Number healthyThresholdCount) {
            this.healthyThresholdCount = healthyThresholdCount;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getMatcher}
         * @param matcher matcher block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#matcher VpclatticeTargetGroup#matcher}
         * @return {@code this}
         */
        public Builder matcher(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher matcher) {
            this.matcher = matcher;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#path VpclatticeTargetGroup#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#port VpclatticeTargetGroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol VpclatticeTargetGroup#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getProtocolVersion}
         * @param protocolVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol_version VpclatticeTargetGroup#protocol_version}.
         * @return {@code this}
         */
        public Builder protocolVersion(java.lang.String protocolVersion) {
            this.protocolVersion = protocolVersion;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheck#getUnhealthyThresholdCount}
         * @param unhealthyThresholdCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#unhealthy_threshold_count VpclatticeTargetGroup#unhealthy_threshold_count}.
         * @return {@code this}
         */
        public Builder unhealthyThresholdCount(java.lang.Number unhealthyThresholdCount) {
            this.unhealthyThresholdCount = unhealthyThresholdCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeTargetGroupConfigHealthCheck}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeTargetGroupConfigHealthCheck build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeTargetGroupConfigHealthCheck}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeTargetGroupConfigHealthCheck {
        private final java.lang.Object enabled;
        private final java.lang.Number healthCheckIntervalSeconds;
        private final java.lang.Number healthCheckTimeoutSeconds;
        private final java.lang.Number healthyThresholdCount;
        private final imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher matcher;
        private final java.lang.String path;
        private final java.lang.Number port;
        private final java.lang.String protocol;
        private final java.lang.String protocolVersion;
        private final java.lang.Number unhealthyThresholdCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheckIntervalSeconds = software.amazon.jsii.Kernel.get(this, "healthCheckIntervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthCheckTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "healthCheckTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthyThresholdCount = software.amazon.jsii.Kernel.get(this, "healthyThresholdCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.matcher = software.amazon.jsii.Kernel.get(this, "matcher", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocolVersion = software.amazon.jsii.Kernel.get(this, "protocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unhealthyThresholdCount = software.amazon.jsii.Kernel.get(this, "unhealthyThresholdCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.healthCheckIntervalSeconds = builder.healthCheckIntervalSeconds;
            this.healthCheckTimeoutSeconds = builder.healthCheckTimeoutSeconds;
            this.healthyThresholdCount = builder.healthyThresholdCount;
            this.matcher = builder.matcher;
            this.path = builder.path;
            this.port = builder.port;
            this.protocol = builder.protocol;
            this.protocolVersion = builder.protocolVersion;
            this.unhealthyThresholdCount = builder.unhealthyThresholdCount;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getHealthCheckIntervalSeconds() {
            return this.healthCheckIntervalSeconds;
        }

        @Override
        public final java.lang.Number getHealthCheckTimeoutSeconds() {
            return this.healthCheckTimeoutSeconds;
        }

        @Override
        public final java.lang.Number getHealthyThresholdCount() {
            return this.healthyThresholdCount;
        }

        @Override
        public final imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheckMatcher getMatcher() {
            return this.matcher;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getProtocolVersion() {
            return this.protocolVersion;
        }

        @Override
        public final java.lang.Number getUnhealthyThresholdCount() {
            return this.unhealthyThresholdCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getHealthCheckIntervalSeconds() != null) {
                data.set("healthCheckIntervalSeconds", om.valueToTree(this.getHealthCheckIntervalSeconds()));
            }
            if (this.getHealthCheckTimeoutSeconds() != null) {
                data.set("healthCheckTimeoutSeconds", om.valueToTree(this.getHealthCheckTimeoutSeconds()));
            }
            if (this.getHealthyThresholdCount() != null) {
                data.set("healthyThresholdCount", om.valueToTree(this.getHealthyThresholdCount()));
            }
            if (this.getMatcher() != null) {
                data.set("matcher", om.valueToTree(this.getMatcher()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getProtocolVersion() != null) {
                data.set("protocolVersion", om.valueToTree(this.getProtocolVersion()));
            }
            if (this.getUnhealthyThresholdCount() != null) {
                data.set("unhealthyThresholdCount", om.valueToTree(this.getUnhealthyThresholdCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigHealthCheck"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeTargetGroupConfigHealthCheck.Jsii$Proxy that = (VpclatticeTargetGroupConfigHealthCheck.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.healthCheckIntervalSeconds != null ? !this.healthCheckIntervalSeconds.equals(that.healthCheckIntervalSeconds) : that.healthCheckIntervalSeconds != null) return false;
            if (this.healthCheckTimeoutSeconds != null ? !this.healthCheckTimeoutSeconds.equals(that.healthCheckTimeoutSeconds) : that.healthCheckTimeoutSeconds != null) return false;
            if (this.healthyThresholdCount != null ? !this.healthyThresholdCount.equals(that.healthyThresholdCount) : that.healthyThresholdCount != null) return false;
            if (this.matcher != null ? !this.matcher.equals(that.matcher) : that.matcher != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.protocolVersion != null ? !this.protocolVersion.equals(that.protocolVersion) : that.protocolVersion != null) return false;
            return this.unhealthyThresholdCount != null ? this.unhealthyThresholdCount.equals(that.unhealthyThresholdCount) : that.unhealthyThresholdCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.healthCheckIntervalSeconds != null ? this.healthCheckIntervalSeconds.hashCode() : 0);
            result = 31 * result + (this.healthCheckTimeoutSeconds != null ? this.healthCheckTimeoutSeconds.hashCode() : 0);
            result = 31 * result + (this.healthyThresholdCount != null ? this.healthyThresholdCount.hashCode() : 0);
            result = 31 * result + (this.matcher != null ? this.matcher.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.protocolVersion != null ? this.protocolVersion.hashCode() : 0);
            result = 31 * result + (this.unhealthyThresholdCount != null ? this.unhealthyThresholdCount.hashCode() : 0);
            return result;
        }
    }
}
