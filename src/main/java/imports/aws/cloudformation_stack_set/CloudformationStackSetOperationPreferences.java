package imports.aws.cloudformation_stack_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.221Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSetOperationPreferences")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackSetOperationPreferences.Jsii$Proxy.class)
public interface CloudformationStackSetOperationPreferences extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#failure_tolerance_count CloudformationStackSet#failure_tolerance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureToleranceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#failure_tolerance_percentage CloudformationStackSet#failure_tolerance_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureTolerancePercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#max_concurrent_count CloudformationStackSet#max_concurrent_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#max_concurrent_percentage CloudformationStackSet#max_concurrent_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#region_concurrency_type CloudformationStackSet#region_concurrency_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegionConcurrencyType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#region_order CloudformationStackSet#region_order}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionOrder() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackSetOperationPreferences}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackSetOperationPreferences}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackSetOperationPreferences> {
        java.lang.Number failureToleranceCount;
        java.lang.Number failureTolerancePercentage;
        java.lang.Number maxConcurrentCount;
        java.lang.Number maxConcurrentPercentage;
        java.lang.String regionConcurrencyType;
        java.util.List<java.lang.String> regionOrder;

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getFailureToleranceCount}
         * @param failureToleranceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#failure_tolerance_count CloudformationStackSet#failure_tolerance_count}.
         * @return {@code this}
         */
        public Builder failureToleranceCount(java.lang.Number failureToleranceCount) {
            this.failureToleranceCount = failureToleranceCount;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getFailureTolerancePercentage}
         * @param failureTolerancePercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#failure_tolerance_percentage CloudformationStackSet#failure_tolerance_percentage}.
         * @return {@code this}
         */
        public Builder failureTolerancePercentage(java.lang.Number failureTolerancePercentage) {
            this.failureTolerancePercentage = failureTolerancePercentage;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getMaxConcurrentCount}
         * @param maxConcurrentCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#max_concurrent_count CloudformationStackSet#max_concurrent_count}.
         * @return {@code this}
         */
        public Builder maxConcurrentCount(java.lang.Number maxConcurrentCount) {
            this.maxConcurrentCount = maxConcurrentCount;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getMaxConcurrentPercentage}
         * @param maxConcurrentPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#max_concurrent_percentage CloudformationStackSet#max_concurrent_percentage}.
         * @return {@code this}
         */
        public Builder maxConcurrentPercentage(java.lang.Number maxConcurrentPercentage) {
            this.maxConcurrentPercentage = maxConcurrentPercentage;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getRegionConcurrencyType}
         * @param regionConcurrencyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#region_concurrency_type CloudformationStackSet#region_concurrency_type}.
         * @return {@code this}
         */
        public Builder regionConcurrencyType(java.lang.String regionConcurrencyType) {
            this.regionConcurrencyType = regionConcurrencyType;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetOperationPreferences#getRegionOrder}
         * @param regionOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#region_order CloudformationStackSet#region_order}.
         * @return {@code this}
         */
        public Builder regionOrder(java.util.List<java.lang.String> regionOrder) {
            this.regionOrder = regionOrder;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudformationStackSetOperationPreferences}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackSetOperationPreferences build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackSetOperationPreferences}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackSetOperationPreferences {
        private final java.lang.Number failureToleranceCount;
        private final java.lang.Number failureTolerancePercentage;
        private final java.lang.Number maxConcurrentCount;
        private final java.lang.Number maxConcurrentPercentage;
        private final java.lang.String regionConcurrencyType;
        private final java.util.List<java.lang.String> regionOrder;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failureToleranceCount = software.amazon.jsii.Kernel.get(this, "failureToleranceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.failureTolerancePercentage = software.amazon.jsii.Kernel.get(this, "failureTolerancePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxConcurrentCount = software.amazon.jsii.Kernel.get(this, "maxConcurrentCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxConcurrentPercentage = software.amazon.jsii.Kernel.get(this, "maxConcurrentPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.regionConcurrencyType = software.amazon.jsii.Kernel.get(this, "regionConcurrencyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regionOrder = software.amazon.jsii.Kernel.get(this, "regionOrder", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failureToleranceCount = builder.failureToleranceCount;
            this.failureTolerancePercentage = builder.failureTolerancePercentage;
            this.maxConcurrentCount = builder.maxConcurrentCount;
            this.maxConcurrentPercentage = builder.maxConcurrentPercentage;
            this.regionConcurrencyType = builder.regionConcurrencyType;
            this.regionOrder = builder.regionOrder;
        }

        @Override
        public final java.lang.Number getFailureToleranceCount() {
            return this.failureToleranceCount;
        }

        @Override
        public final java.lang.Number getFailureTolerancePercentage() {
            return this.failureTolerancePercentage;
        }

        @Override
        public final java.lang.Number getMaxConcurrentCount() {
            return this.maxConcurrentCount;
        }

        @Override
        public final java.lang.Number getMaxConcurrentPercentage() {
            return this.maxConcurrentPercentage;
        }

        @Override
        public final java.lang.String getRegionConcurrencyType() {
            return this.regionConcurrencyType;
        }

        @Override
        public final java.util.List<java.lang.String> getRegionOrder() {
            return this.regionOrder;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFailureToleranceCount() != null) {
                data.set("failureToleranceCount", om.valueToTree(this.getFailureToleranceCount()));
            }
            if (this.getFailureTolerancePercentage() != null) {
                data.set("failureTolerancePercentage", om.valueToTree(this.getFailureTolerancePercentage()));
            }
            if (this.getMaxConcurrentCount() != null) {
                data.set("maxConcurrentCount", om.valueToTree(this.getMaxConcurrentCount()));
            }
            if (this.getMaxConcurrentPercentage() != null) {
                data.set("maxConcurrentPercentage", om.valueToTree(this.getMaxConcurrentPercentage()));
            }
            if (this.getRegionConcurrencyType() != null) {
                data.set("regionConcurrencyType", om.valueToTree(this.getRegionConcurrencyType()));
            }
            if (this.getRegionOrder() != null) {
                data.set("regionOrder", om.valueToTree(this.getRegionOrder()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudformationStackSet.CloudformationStackSetOperationPreferences"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackSetOperationPreferences.Jsii$Proxy that = (CloudformationStackSetOperationPreferences.Jsii$Proxy) o;

            if (this.failureToleranceCount != null ? !this.failureToleranceCount.equals(that.failureToleranceCount) : that.failureToleranceCount != null) return false;
            if (this.failureTolerancePercentage != null ? !this.failureTolerancePercentage.equals(that.failureTolerancePercentage) : that.failureTolerancePercentage != null) return false;
            if (this.maxConcurrentCount != null ? !this.maxConcurrentCount.equals(that.maxConcurrentCount) : that.maxConcurrentCount != null) return false;
            if (this.maxConcurrentPercentage != null ? !this.maxConcurrentPercentage.equals(that.maxConcurrentPercentage) : that.maxConcurrentPercentage != null) return false;
            if (this.regionConcurrencyType != null ? !this.regionConcurrencyType.equals(that.regionConcurrencyType) : that.regionConcurrencyType != null) return false;
            return this.regionOrder != null ? this.regionOrder.equals(that.regionOrder) : that.regionOrder == null;
        }

        @Override
        public final int hashCode() {
            int result = this.failureToleranceCount != null ? this.failureToleranceCount.hashCode() : 0;
            result = 31 * result + (this.failureTolerancePercentage != null ? this.failureTolerancePercentage.hashCode() : 0);
            result = 31 * result + (this.maxConcurrentCount != null ? this.maxConcurrentCount.hashCode() : 0);
            result = 31 * result + (this.maxConcurrentPercentage != null ? this.maxConcurrentPercentage.hashCode() : 0);
            result = 31 * result + (this.regionConcurrencyType != null ? this.regionConcurrencyType.hashCode() : 0);
            result = 31 * result + (this.regionOrder != null ? this.regionOrder.hashCode() : 0);
            return result;
        }
    }
}
