package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.414Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleDynamodb")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleDynamodb.Jsii$Proxy.class)
public interface IotTopicRuleDynamodb extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_field IotTopicRule#hash_key_field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHashKeyField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_value IotTopicRule#hash_key_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHashKeyValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#table_name IotTopicRule#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_type IotTopicRule#hash_key_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHashKeyType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#operation IotTopicRule#operation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#payload_field IotTopicRule#payload_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPayloadField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_field IotTopicRule#range_key_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_type IotTopicRule#range_key_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_value IotTopicRule#range_key_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleDynamodb}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleDynamodb}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleDynamodb> {
        java.lang.String hashKeyField;
        java.lang.String hashKeyValue;
        java.lang.String roleArn;
        java.lang.String tableName;
        java.lang.String hashKeyType;
        java.lang.String operation;
        java.lang.String payloadField;
        java.lang.String rangeKeyField;
        java.lang.String rangeKeyType;
        java.lang.String rangeKeyValue;

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getHashKeyField}
         * @param hashKeyField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_field IotTopicRule#hash_key_field}. This parameter is required.
         * @return {@code this}
         */
        public Builder hashKeyField(java.lang.String hashKeyField) {
            this.hashKeyField = hashKeyField;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getHashKeyValue}
         * @param hashKeyValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_value IotTopicRule#hash_key_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder hashKeyValue(java.lang.String hashKeyValue) {
            this.hashKeyValue = hashKeyValue;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#table_name IotTopicRule#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getHashKeyType}
         * @param hashKeyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#hash_key_type IotTopicRule#hash_key_type}.
         * @return {@code this}
         */
        public Builder hashKeyType(java.lang.String hashKeyType) {
            this.hashKeyType = hashKeyType;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getOperation}
         * @param operation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#operation IotTopicRule#operation}.
         * @return {@code this}
         */
        public Builder operation(java.lang.String operation) {
            this.operation = operation;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getPayloadField}
         * @param payloadField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#payload_field IotTopicRule#payload_field}.
         * @return {@code this}
         */
        public Builder payloadField(java.lang.String payloadField) {
            this.payloadField = payloadField;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getRangeKeyField}
         * @param rangeKeyField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_field IotTopicRule#range_key_field}.
         * @return {@code this}
         */
        public Builder rangeKeyField(java.lang.String rangeKeyField) {
            this.rangeKeyField = rangeKeyField;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getRangeKeyType}
         * @param rangeKeyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_type IotTopicRule#range_key_type}.
         * @return {@code this}
         */
        public Builder rangeKeyType(java.lang.String rangeKeyType) {
            this.rangeKeyType = rangeKeyType;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleDynamodb#getRangeKeyValue}
         * @param rangeKeyValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#range_key_value IotTopicRule#range_key_value}.
         * @return {@code this}
         */
        public Builder rangeKeyValue(java.lang.String rangeKeyValue) {
            this.rangeKeyValue = rangeKeyValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleDynamodb}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleDynamodb build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleDynamodb}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleDynamodb {
        private final java.lang.String hashKeyField;
        private final java.lang.String hashKeyValue;
        private final java.lang.String roleArn;
        private final java.lang.String tableName;
        private final java.lang.String hashKeyType;
        private final java.lang.String operation;
        private final java.lang.String payloadField;
        private final java.lang.String rangeKeyField;
        private final java.lang.String rangeKeyType;
        private final java.lang.String rangeKeyValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hashKeyField = software.amazon.jsii.Kernel.get(this, "hashKeyField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hashKeyValue = software.amazon.jsii.Kernel.get(this, "hashKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hashKeyType = software.amazon.jsii.Kernel.get(this, "hashKeyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operation = software.amazon.jsii.Kernel.get(this, "operation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.payloadField = software.amazon.jsii.Kernel.get(this, "payloadField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rangeKeyField = software.amazon.jsii.Kernel.get(this, "rangeKeyField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rangeKeyType = software.amazon.jsii.Kernel.get(this, "rangeKeyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rangeKeyValue = software.amazon.jsii.Kernel.get(this, "rangeKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hashKeyField = java.util.Objects.requireNonNull(builder.hashKeyField, "hashKeyField is required");
            this.hashKeyValue = java.util.Objects.requireNonNull(builder.hashKeyValue, "hashKeyValue is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.hashKeyType = builder.hashKeyType;
            this.operation = builder.operation;
            this.payloadField = builder.payloadField;
            this.rangeKeyField = builder.rangeKeyField;
            this.rangeKeyType = builder.rangeKeyType;
            this.rangeKeyValue = builder.rangeKeyValue;
        }

        @Override
        public final java.lang.String getHashKeyField() {
            return this.hashKeyField;
        }

        @Override
        public final java.lang.String getHashKeyValue() {
            return this.hashKeyValue;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final java.lang.String getHashKeyType() {
            return this.hashKeyType;
        }

        @Override
        public final java.lang.String getOperation() {
            return this.operation;
        }

        @Override
        public final java.lang.String getPayloadField() {
            return this.payloadField;
        }

        @Override
        public final java.lang.String getRangeKeyField() {
            return this.rangeKeyField;
        }

        @Override
        public final java.lang.String getRangeKeyType() {
            return this.rangeKeyType;
        }

        @Override
        public final java.lang.String getRangeKeyValue() {
            return this.rangeKeyValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hashKeyField", om.valueToTree(this.getHashKeyField()));
            data.set("hashKeyValue", om.valueToTree(this.getHashKeyValue()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getHashKeyType() != null) {
                data.set("hashKeyType", om.valueToTree(this.getHashKeyType()));
            }
            if (this.getOperation() != null) {
                data.set("operation", om.valueToTree(this.getOperation()));
            }
            if (this.getPayloadField() != null) {
                data.set("payloadField", om.valueToTree(this.getPayloadField()));
            }
            if (this.getRangeKeyField() != null) {
                data.set("rangeKeyField", om.valueToTree(this.getRangeKeyField()));
            }
            if (this.getRangeKeyType() != null) {
                data.set("rangeKeyType", om.valueToTree(this.getRangeKeyType()));
            }
            if (this.getRangeKeyValue() != null) {
                data.set("rangeKeyValue", om.valueToTree(this.getRangeKeyValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleDynamodb"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleDynamodb.Jsii$Proxy that = (IotTopicRuleDynamodb.Jsii$Proxy) o;

            if (!hashKeyField.equals(that.hashKeyField)) return false;
            if (!hashKeyValue.equals(that.hashKeyValue)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!tableName.equals(that.tableName)) return false;
            if (this.hashKeyType != null ? !this.hashKeyType.equals(that.hashKeyType) : that.hashKeyType != null) return false;
            if (this.operation != null ? !this.operation.equals(that.operation) : that.operation != null) return false;
            if (this.payloadField != null ? !this.payloadField.equals(that.payloadField) : that.payloadField != null) return false;
            if (this.rangeKeyField != null ? !this.rangeKeyField.equals(that.rangeKeyField) : that.rangeKeyField != null) return false;
            if (this.rangeKeyType != null ? !this.rangeKeyType.equals(that.rangeKeyType) : that.rangeKeyType != null) return false;
            return this.rangeKeyValue != null ? this.rangeKeyValue.equals(that.rangeKeyValue) : that.rangeKeyValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hashKeyField.hashCode();
            result = 31 * result + (this.hashKeyValue.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.hashKeyType != null ? this.hashKeyType.hashCode() : 0);
            result = 31 * result + (this.operation != null ? this.operation.hashCode() : 0);
            result = 31 * result + (this.payloadField != null ? this.payloadField.hashCode() : 0);
            result = 31 * result + (this.rangeKeyField != null ? this.rangeKeyField.hashCode() : 0);
            result = 31 * result + (this.rangeKeyType != null ? this.rangeKeyType.hashCode() : 0);
            result = 31 * result + (this.rangeKeyValue != null ? this.rangeKeyValue.hashCode() : 0);
            return result;
        }
    }
}
