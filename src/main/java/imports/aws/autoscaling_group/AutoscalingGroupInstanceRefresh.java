package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceRefresh")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupInstanceRefresh.Jsii$Proxy.class)
public interface AutoscalingGroupInstanceRefresh extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#strategy AutoscalingGroup#strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStrategy();

    /**
     * preferences block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#preferences AutoscalingGroup#preferences}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences getPreferences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#triggers AutoscalingGroup#triggers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTriggers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupInstanceRefresh}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupInstanceRefresh}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupInstanceRefresh> {
        java.lang.String strategy;
        imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences preferences;
        java.util.List<java.lang.String> triggers;

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefresh#getStrategy}
         * @param strategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#strategy AutoscalingGroup#strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder strategy(java.lang.String strategy) {
            this.strategy = strategy;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefresh#getPreferences}
         * @param preferences preferences block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#preferences AutoscalingGroup#preferences}
         * @return {@code this}
         */
        public Builder preferences(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences preferences) {
            this.preferences = preferences;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefresh#getTriggers}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#triggers AutoscalingGroup#triggers}.
         * @return {@code this}
         */
        public Builder triggers(java.util.List<java.lang.String> triggers) {
            this.triggers = triggers;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupInstanceRefresh}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupInstanceRefresh build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupInstanceRefresh}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupInstanceRefresh {
        private final java.lang.String strategy;
        private final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences preferences;
        private final java.util.List<java.lang.String> triggers;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.strategy = software.amazon.jsii.Kernel.get(this, "strategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferences = software.amazon.jsii.Kernel.get(this, "preferences", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences.class));
            this.triggers = software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.strategy = java.util.Objects.requireNonNull(builder.strategy, "strategy is required");
            this.preferences = builder.preferences;
            this.triggers = builder.triggers;
        }

        @Override
        public final java.lang.String getStrategy() {
            return this.strategy;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences getPreferences() {
            return this.preferences;
        }

        @Override
        public final java.util.List<java.lang.String> getTriggers() {
            return this.triggers;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("strategy", om.valueToTree(this.getStrategy()));
            if (this.getPreferences() != null) {
                data.set("preferences", om.valueToTree(this.getPreferences()));
            }
            if (this.getTriggers() != null) {
                data.set("triggers", om.valueToTree(this.getTriggers()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupInstanceRefresh"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupInstanceRefresh.Jsii$Proxy that = (AutoscalingGroupInstanceRefresh.Jsii$Proxy) o;

            if (!strategy.equals(that.strategy)) return false;
            if (this.preferences != null ? !this.preferences.equals(that.preferences) : that.preferences != null) return false;
            return this.triggers != null ? this.triggers.equals(that.triggers) : that.triggers == null;
        }

        @Override
        public final int hashCode() {
            int result = this.strategy.hashCode();
            result = 31 * result + (this.preferences != null ? this.preferences.hashCode() : 0);
            result = 31 * result + (this.triggers != null ? this.triggers.hashCode() : 0);
            return result;
        }
    }
}
