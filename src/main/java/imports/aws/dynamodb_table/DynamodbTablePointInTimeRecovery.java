package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTablePointInTimeRecovery")
@software.amazon.jsii.Jsii.Proxy(DynamodbTablePointInTimeRecovery.Jsii$Proxy.class)
public interface DynamodbTablePointInTimeRecovery extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#recovery_period_in_days DynamodbTable#recovery_period_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRecoveryPeriodInDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTablePointInTimeRecovery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTablePointInTimeRecovery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTablePointInTimeRecovery> {
        java.lang.Object enabled;
        java.lang.Number recoveryPeriodInDays;

        /**
         * Sets the value of {@link DynamodbTablePointInTimeRecovery#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTablePointInTimeRecovery#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#enabled DynamodbTable#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTablePointInTimeRecovery#getRecoveryPeriodInDays}
         * @param recoveryPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#recovery_period_in_days DynamodbTable#recovery_period_in_days}.
         * @return {@code this}
         */
        public Builder recoveryPeriodInDays(java.lang.Number recoveryPeriodInDays) {
            this.recoveryPeriodInDays = recoveryPeriodInDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTablePointInTimeRecovery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTablePointInTimeRecovery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTablePointInTimeRecovery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTablePointInTimeRecovery {
        private final java.lang.Object enabled;
        private final java.lang.Number recoveryPeriodInDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recoveryPeriodInDays = software.amazon.jsii.Kernel.get(this, "recoveryPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.recoveryPeriodInDays = builder.recoveryPeriodInDays;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getRecoveryPeriodInDays() {
            return this.recoveryPeriodInDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getRecoveryPeriodInDays() != null) {
                data.set("recoveryPeriodInDays", om.valueToTree(this.getRecoveryPeriodInDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTablePointInTimeRecovery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTablePointInTimeRecovery.Jsii$Proxy that = (DynamodbTablePointInTimeRecovery.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.recoveryPeriodInDays != null ? this.recoveryPeriodInDays.equals(that.recoveryPeriodInDays) : that.recoveryPeriodInDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.recoveryPeriodInDays != null ? this.recoveryPeriodInDays.hashCode() : 0);
            return result;
        }
    }
}
