package imports.aws.rds_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsCluster.RdsClusterScalingConfiguration")
@software.amazon.jsii.Jsii.Proxy(RdsClusterScalingConfiguration.Jsii$Proxy.class)
public interface RdsClusterScalingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#auto_pause RdsCluster#auto_pause}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoPause() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#max_capacity RdsCluster#max_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#min_capacity RdsCluster#min_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#seconds_before_timeout RdsCluster#seconds_before_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSecondsBeforeTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#seconds_until_auto_pause RdsCluster#seconds_until_auto_pause}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSecondsUntilAutoPause() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#timeout_action RdsCluster#timeout_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimeoutAction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsClusterScalingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsClusterScalingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsClusterScalingConfiguration> {
        java.lang.Object autoPause;
        java.lang.Number maxCapacity;
        java.lang.Number minCapacity;
        java.lang.Number secondsBeforeTimeout;
        java.lang.Number secondsUntilAutoPause;
        java.lang.String timeoutAction;

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getAutoPause}
         * @param autoPause Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#auto_pause RdsCluster#auto_pause}.
         * @return {@code this}
         */
        public Builder autoPause(java.lang.Boolean autoPause) {
            this.autoPause = autoPause;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getAutoPause}
         * @param autoPause Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#auto_pause RdsCluster#auto_pause}.
         * @return {@code this}
         */
        public Builder autoPause(com.hashicorp.cdktf.IResolvable autoPause) {
            this.autoPause = autoPause;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#max_capacity RdsCluster#max_capacity}.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getMinCapacity}
         * @param minCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#min_capacity RdsCluster#min_capacity}.
         * @return {@code this}
         */
        public Builder minCapacity(java.lang.Number minCapacity) {
            this.minCapacity = minCapacity;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getSecondsBeforeTimeout}
         * @param secondsBeforeTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#seconds_before_timeout RdsCluster#seconds_before_timeout}.
         * @return {@code this}
         */
        public Builder secondsBeforeTimeout(java.lang.Number secondsBeforeTimeout) {
            this.secondsBeforeTimeout = secondsBeforeTimeout;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getSecondsUntilAutoPause}
         * @param secondsUntilAutoPause Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#seconds_until_auto_pause RdsCluster#seconds_until_auto_pause}.
         * @return {@code this}
         */
        public Builder secondsUntilAutoPause(java.lang.Number secondsUntilAutoPause) {
            this.secondsUntilAutoPause = secondsUntilAutoPause;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterScalingConfiguration#getTimeoutAction}
         * @param timeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster#timeout_action RdsCluster#timeout_action}.
         * @return {@code this}
         */
        public Builder timeoutAction(java.lang.String timeoutAction) {
            this.timeoutAction = timeoutAction;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RdsClusterScalingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsClusterScalingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsClusterScalingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsClusterScalingConfiguration {
        private final java.lang.Object autoPause;
        private final java.lang.Number maxCapacity;
        private final java.lang.Number minCapacity;
        private final java.lang.Number secondsBeforeTimeout;
        private final java.lang.Number secondsUntilAutoPause;
        private final java.lang.String timeoutAction;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoPause = software.amazon.jsii.Kernel.get(this, "autoPause", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minCapacity = software.amazon.jsii.Kernel.get(this, "minCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.secondsBeforeTimeout = software.amazon.jsii.Kernel.get(this, "secondsBeforeTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.secondsUntilAutoPause = software.amazon.jsii.Kernel.get(this, "secondsUntilAutoPause", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeoutAction = software.amazon.jsii.Kernel.get(this, "timeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoPause = builder.autoPause;
            this.maxCapacity = builder.maxCapacity;
            this.minCapacity = builder.minCapacity;
            this.secondsBeforeTimeout = builder.secondsBeforeTimeout;
            this.secondsUntilAutoPause = builder.secondsUntilAutoPause;
            this.timeoutAction = builder.timeoutAction;
        }

        @Override
        public final java.lang.Object getAutoPause() {
            return this.autoPause;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.Number getMinCapacity() {
            return this.minCapacity;
        }

        @Override
        public final java.lang.Number getSecondsBeforeTimeout() {
            return this.secondsBeforeTimeout;
        }

        @Override
        public final java.lang.Number getSecondsUntilAutoPause() {
            return this.secondsUntilAutoPause;
        }

        @Override
        public final java.lang.String getTimeoutAction() {
            return this.timeoutAction;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoPause() != null) {
                data.set("autoPause", om.valueToTree(this.getAutoPause()));
            }
            if (this.getMaxCapacity() != null) {
                data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            }
            if (this.getMinCapacity() != null) {
                data.set("minCapacity", om.valueToTree(this.getMinCapacity()));
            }
            if (this.getSecondsBeforeTimeout() != null) {
                data.set("secondsBeforeTimeout", om.valueToTree(this.getSecondsBeforeTimeout()));
            }
            if (this.getSecondsUntilAutoPause() != null) {
                data.set("secondsUntilAutoPause", om.valueToTree(this.getSecondsUntilAutoPause()));
            }
            if (this.getTimeoutAction() != null) {
                data.set("timeoutAction", om.valueToTree(this.getTimeoutAction()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rdsCluster.RdsClusterScalingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsClusterScalingConfiguration.Jsii$Proxy that = (RdsClusterScalingConfiguration.Jsii$Proxy) o;

            if (this.autoPause != null ? !this.autoPause.equals(that.autoPause) : that.autoPause != null) return false;
            if (this.maxCapacity != null ? !this.maxCapacity.equals(that.maxCapacity) : that.maxCapacity != null) return false;
            if (this.minCapacity != null ? !this.minCapacity.equals(that.minCapacity) : that.minCapacity != null) return false;
            if (this.secondsBeforeTimeout != null ? !this.secondsBeforeTimeout.equals(that.secondsBeforeTimeout) : that.secondsBeforeTimeout != null) return false;
            if (this.secondsUntilAutoPause != null ? !this.secondsUntilAutoPause.equals(that.secondsUntilAutoPause) : that.secondsUntilAutoPause != null) return false;
            return this.timeoutAction != null ? this.timeoutAction.equals(that.timeoutAction) : that.timeoutAction == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoPause != null ? this.autoPause.hashCode() : 0;
            result = 31 * result + (this.maxCapacity != null ? this.maxCapacity.hashCode() : 0);
            result = 31 * result + (this.minCapacity != null ? this.minCapacity.hashCode() : 0);
            result = 31 * result + (this.secondsBeforeTimeout != null ? this.secondsBeforeTimeout.hashCode() : 0);
            result = 31 * result + (this.secondsUntilAutoPause != null ? this.secondsUntilAutoPause.hashCode() : 0);
            result = 31 * result + (this.timeoutAction != null ? this.timeoutAction.hashCode() : 0);
            return result;
        }
    }
}
