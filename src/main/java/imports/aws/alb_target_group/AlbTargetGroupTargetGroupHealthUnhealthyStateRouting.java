package imports.aws.alb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albTargetGroup.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting")
@software.amazon.jsii.Jsii.Proxy(AlbTargetGroupTargetGroupHealthUnhealthyStateRouting.Jsii$Proxy.class)
public interface AlbTargetGroupTargetGroupHealthUnhealthyStateRouting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumHealthyTargetsCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMinimumHealthyTargetsPercentage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbTargetGroupTargetGroupHealthUnhealthyStateRouting> {
        java.lang.Number minimumHealthyTargetsCount;
        java.lang.String minimumHealthyTargetsPercentage;

        /**
         * Sets the value of {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting#getMinimumHealthyTargetsCount}
         * @param minimumHealthyTargetsCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_count AlbTargetGroup#minimum_healthy_targets_count}.
         * @return {@code this}
         */
        public Builder minimumHealthyTargetsCount(java.lang.Number minimumHealthyTargetsCount) {
            this.minimumHealthyTargetsCount = minimumHealthyTargetsCount;
            return this;
        }

        /**
         * Sets the value of {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting#getMinimumHealthyTargetsPercentage}
         * @param minimumHealthyTargetsPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#minimum_healthy_targets_percentage AlbTargetGroup#minimum_healthy_targets_percentage}.
         * @return {@code this}
         */
        public Builder minimumHealthyTargetsPercentage(java.lang.String minimumHealthyTargetsPercentage) {
            this.minimumHealthyTargetsPercentage = minimumHealthyTargetsPercentage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbTargetGroupTargetGroupHealthUnhealthyStateRouting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbTargetGroupTargetGroupHealthUnhealthyStateRouting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbTargetGroupTargetGroupHealthUnhealthyStateRouting {
        private final java.lang.Number minimumHealthyTargetsCount;
        private final java.lang.String minimumHealthyTargetsPercentage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.minimumHealthyTargetsCount = software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumHealthyTargetsPercentage = software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsPercentage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.minimumHealthyTargetsCount = builder.minimumHealthyTargetsCount;
            this.minimumHealthyTargetsPercentage = builder.minimumHealthyTargetsPercentage;
        }

        @Override
        public final java.lang.Number getMinimumHealthyTargetsCount() {
            return this.minimumHealthyTargetsCount;
        }

        @Override
        public final java.lang.String getMinimumHealthyTargetsPercentage() {
            return this.minimumHealthyTargetsPercentage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMinimumHealthyTargetsCount() != null) {
                data.set("minimumHealthyTargetsCount", om.valueToTree(this.getMinimumHealthyTargetsCount()));
            }
            if (this.getMinimumHealthyTargetsPercentage() != null) {
                data.set("minimumHealthyTargetsPercentage", om.valueToTree(this.getMinimumHealthyTargetsPercentage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albTargetGroup.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbTargetGroupTargetGroupHealthUnhealthyStateRouting.Jsii$Proxy that = (AlbTargetGroupTargetGroupHealthUnhealthyStateRouting.Jsii$Proxy) o;

            if (this.minimumHealthyTargetsCount != null ? !this.minimumHealthyTargetsCount.equals(that.minimumHealthyTargetsCount) : that.minimumHealthyTargetsCount != null) return false;
            return this.minimumHealthyTargetsPercentage != null ? this.minimumHealthyTargetsPercentage.equals(that.minimumHealthyTargetsPercentage) : that.minimumHealthyTargetsPercentage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.minimumHealthyTargetsCount != null ? this.minimumHealthyTargetsCount.hashCode() : 0;
            result = 31 * result + (this.minimumHealthyTargetsPercentage != null ? this.minimumHealthyTargetsPercentage.hashCode() : 0);
            return result;
        }
    }
}
