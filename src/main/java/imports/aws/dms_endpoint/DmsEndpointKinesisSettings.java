package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointKinesisSettings")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointKinesisSettings.Jsii$Proxy.class)
public interface DmsEndpointKinesisSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_control_details DmsEndpoint#include_control_details}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeControlDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_null_and_empty DmsEndpoint#include_null_and_empty}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeNullAndEmpty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_partition_value DmsEndpoint#include_partition_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludePartitionValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_table_alter_operations DmsEndpoint#include_table_alter_operations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTableAlterOperations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_transaction_details DmsEndpoint#include_transaction_details}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTransactionDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#message_format DmsEndpoint#message_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#partition_include_schema_table DmsEndpoint#partition_include_schema_table}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPartitionIncludeSchemaTable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role_arn DmsEndpoint#service_access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#stream_arn DmsEndpoint#stream_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#use_large_integer_value DmsEndpoint#use_large_integer_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseLargeIntegerValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointKinesisSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointKinesisSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointKinesisSettings> {
        java.lang.Object includeControlDetails;
        java.lang.Object includeNullAndEmpty;
        java.lang.Object includePartitionValue;
        java.lang.Object includeTableAlterOperations;
        java.lang.Object includeTransactionDetails;
        java.lang.String messageFormat;
        java.lang.Object partitionIncludeSchemaTable;
        java.lang.String serviceAccessRoleArn;
        java.lang.String streamArn;
        java.lang.Object useLargeIntegerValue;

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeControlDetails}
         * @param includeControlDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_control_details DmsEndpoint#include_control_details}.
         * @return {@code this}
         */
        public Builder includeControlDetails(java.lang.Boolean includeControlDetails) {
            this.includeControlDetails = includeControlDetails;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeControlDetails}
         * @param includeControlDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_control_details DmsEndpoint#include_control_details}.
         * @return {@code this}
         */
        public Builder includeControlDetails(com.hashicorp.cdktf.IResolvable includeControlDetails) {
            this.includeControlDetails = includeControlDetails;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeNullAndEmpty}
         * @param includeNullAndEmpty Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_null_and_empty DmsEndpoint#include_null_and_empty}.
         * @return {@code this}
         */
        public Builder includeNullAndEmpty(java.lang.Boolean includeNullAndEmpty) {
            this.includeNullAndEmpty = includeNullAndEmpty;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeNullAndEmpty}
         * @param includeNullAndEmpty Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_null_and_empty DmsEndpoint#include_null_and_empty}.
         * @return {@code this}
         */
        public Builder includeNullAndEmpty(com.hashicorp.cdktf.IResolvable includeNullAndEmpty) {
            this.includeNullAndEmpty = includeNullAndEmpty;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludePartitionValue}
         * @param includePartitionValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_partition_value DmsEndpoint#include_partition_value}.
         * @return {@code this}
         */
        public Builder includePartitionValue(java.lang.Boolean includePartitionValue) {
            this.includePartitionValue = includePartitionValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludePartitionValue}
         * @param includePartitionValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_partition_value DmsEndpoint#include_partition_value}.
         * @return {@code this}
         */
        public Builder includePartitionValue(com.hashicorp.cdktf.IResolvable includePartitionValue) {
            this.includePartitionValue = includePartitionValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeTableAlterOperations}
         * @param includeTableAlterOperations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_table_alter_operations DmsEndpoint#include_table_alter_operations}.
         * @return {@code this}
         */
        public Builder includeTableAlterOperations(java.lang.Boolean includeTableAlterOperations) {
            this.includeTableAlterOperations = includeTableAlterOperations;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeTableAlterOperations}
         * @param includeTableAlterOperations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_table_alter_operations DmsEndpoint#include_table_alter_operations}.
         * @return {@code this}
         */
        public Builder includeTableAlterOperations(com.hashicorp.cdktf.IResolvable includeTableAlterOperations) {
            this.includeTableAlterOperations = includeTableAlterOperations;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeTransactionDetails}
         * @param includeTransactionDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_transaction_details DmsEndpoint#include_transaction_details}.
         * @return {@code this}
         */
        public Builder includeTransactionDetails(java.lang.Boolean includeTransactionDetails) {
            this.includeTransactionDetails = includeTransactionDetails;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getIncludeTransactionDetails}
         * @param includeTransactionDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#include_transaction_details DmsEndpoint#include_transaction_details}.
         * @return {@code this}
         */
        public Builder includeTransactionDetails(com.hashicorp.cdktf.IResolvable includeTransactionDetails) {
            this.includeTransactionDetails = includeTransactionDetails;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getMessageFormat}
         * @param messageFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#message_format DmsEndpoint#message_format}.
         * @return {@code this}
         */
        public Builder messageFormat(java.lang.String messageFormat) {
            this.messageFormat = messageFormat;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getPartitionIncludeSchemaTable}
         * @param partitionIncludeSchemaTable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#partition_include_schema_table DmsEndpoint#partition_include_schema_table}.
         * @return {@code this}
         */
        public Builder partitionIncludeSchemaTable(java.lang.Boolean partitionIncludeSchemaTable) {
            this.partitionIncludeSchemaTable = partitionIncludeSchemaTable;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getPartitionIncludeSchemaTable}
         * @param partitionIncludeSchemaTable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#partition_include_schema_table DmsEndpoint#partition_include_schema_table}.
         * @return {@code this}
         */
        public Builder partitionIncludeSchemaTable(com.hashicorp.cdktf.IResolvable partitionIncludeSchemaTable) {
            this.partitionIncludeSchemaTable = partitionIncludeSchemaTable;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getServiceAccessRoleArn}
         * @param serviceAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role_arn DmsEndpoint#service_access_role_arn}.
         * @return {@code this}
         */
        public Builder serviceAccessRoleArn(java.lang.String serviceAccessRoleArn) {
            this.serviceAccessRoleArn = serviceAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getStreamArn}
         * @param streamArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#stream_arn DmsEndpoint#stream_arn}.
         * @return {@code this}
         */
        public Builder streamArn(java.lang.String streamArn) {
            this.streamArn = streamArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getUseLargeIntegerValue}
         * @param useLargeIntegerValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#use_large_integer_value DmsEndpoint#use_large_integer_value}.
         * @return {@code this}
         */
        public Builder useLargeIntegerValue(java.lang.Boolean useLargeIntegerValue) {
            this.useLargeIntegerValue = useLargeIntegerValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointKinesisSettings#getUseLargeIntegerValue}
         * @param useLargeIntegerValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#use_large_integer_value DmsEndpoint#use_large_integer_value}.
         * @return {@code this}
         */
        public Builder useLargeIntegerValue(com.hashicorp.cdktf.IResolvable useLargeIntegerValue) {
            this.useLargeIntegerValue = useLargeIntegerValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointKinesisSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointKinesisSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointKinesisSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointKinesisSettings {
        private final java.lang.Object includeControlDetails;
        private final java.lang.Object includeNullAndEmpty;
        private final java.lang.Object includePartitionValue;
        private final java.lang.Object includeTableAlterOperations;
        private final java.lang.Object includeTransactionDetails;
        private final java.lang.String messageFormat;
        private final java.lang.Object partitionIncludeSchemaTable;
        private final java.lang.String serviceAccessRoleArn;
        private final java.lang.String streamArn;
        private final java.lang.Object useLargeIntegerValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.includeControlDetails = software.amazon.jsii.Kernel.get(this, "includeControlDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeNullAndEmpty = software.amazon.jsii.Kernel.get(this, "includeNullAndEmpty", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includePartitionValue = software.amazon.jsii.Kernel.get(this, "includePartitionValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeTableAlterOperations = software.amazon.jsii.Kernel.get(this, "includeTableAlterOperations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeTransactionDetails = software.amazon.jsii.Kernel.get(this, "includeTransactionDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.messageFormat = software.amazon.jsii.Kernel.get(this, "messageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partitionIncludeSchemaTable = software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serviceAccessRoleArn = software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streamArn = software.amazon.jsii.Kernel.get(this, "streamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useLargeIntegerValue = software.amazon.jsii.Kernel.get(this, "useLargeIntegerValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.includeControlDetails = builder.includeControlDetails;
            this.includeNullAndEmpty = builder.includeNullAndEmpty;
            this.includePartitionValue = builder.includePartitionValue;
            this.includeTableAlterOperations = builder.includeTableAlterOperations;
            this.includeTransactionDetails = builder.includeTransactionDetails;
            this.messageFormat = builder.messageFormat;
            this.partitionIncludeSchemaTable = builder.partitionIncludeSchemaTable;
            this.serviceAccessRoleArn = builder.serviceAccessRoleArn;
            this.streamArn = builder.streamArn;
            this.useLargeIntegerValue = builder.useLargeIntegerValue;
        }

        @Override
        public final java.lang.Object getIncludeControlDetails() {
            return this.includeControlDetails;
        }

        @Override
        public final java.lang.Object getIncludeNullAndEmpty() {
            return this.includeNullAndEmpty;
        }

        @Override
        public final java.lang.Object getIncludePartitionValue() {
            return this.includePartitionValue;
        }

        @Override
        public final java.lang.Object getIncludeTableAlterOperations() {
            return this.includeTableAlterOperations;
        }

        @Override
        public final java.lang.Object getIncludeTransactionDetails() {
            return this.includeTransactionDetails;
        }

        @Override
        public final java.lang.String getMessageFormat() {
            return this.messageFormat;
        }

        @Override
        public final java.lang.Object getPartitionIncludeSchemaTable() {
            return this.partitionIncludeSchemaTable;
        }

        @Override
        public final java.lang.String getServiceAccessRoleArn() {
            return this.serviceAccessRoleArn;
        }

        @Override
        public final java.lang.String getStreamArn() {
            return this.streamArn;
        }

        @Override
        public final java.lang.Object getUseLargeIntegerValue() {
            return this.useLargeIntegerValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIncludeControlDetails() != null) {
                data.set("includeControlDetails", om.valueToTree(this.getIncludeControlDetails()));
            }
            if (this.getIncludeNullAndEmpty() != null) {
                data.set("includeNullAndEmpty", om.valueToTree(this.getIncludeNullAndEmpty()));
            }
            if (this.getIncludePartitionValue() != null) {
                data.set("includePartitionValue", om.valueToTree(this.getIncludePartitionValue()));
            }
            if (this.getIncludeTableAlterOperations() != null) {
                data.set("includeTableAlterOperations", om.valueToTree(this.getIncludeTableAlterOperations()));
            }
            if (this.getIncludeTransactionDetails() != null) {
                data.set("includeTransactionDetails", om.valueToTree(this.getIncludeTransactionDetails()));
            }
            if (this.getMessageFormat() != null) {
                data.set("messageFormat", om.valueToTree(this.getMessageFormat()));
            }
            if (this.getPartitionIncludeSchemaTable() != null) {
                data.set("partitionIncludeSchemaTable", om.valueToTree(this.getPartitionIncludeSchemaTable()));
            }
            if (this.getServiceAccessRoleArn() != null) {
                data.set("serviceAccessRoleArn", om.valueToTree(this.getServiceAccessRoleArn()));
            }
            if (this.getStreamArn() != null) {
                data.set("streamArn", om.valueToTree(this.getStreamArn()));
            }
            if (this.getUseLargeIntegerValue() != null) {
                data.set("useLargeIntegerValue", om.valueToTree(this.getUseLargeIntegerValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointKinesisSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointKinesisSettings.Jsii$Proxy that = (DmsEndpointKinesisSettings.Jsii$Proxy) o;

            if (this.includeControlDetails != null ? !this.includeControlDetails.equals(that.includeControlDetails) : that.includeControlDetails != null) return false;
            if (this.includeNullAndEmpty != null ? !this.includeNullAndEmpty.equals(that.includeNullAndEmpty) : that.includeNullAndEmpty != null) return false;
            if (this.includePartitionValue != null ? !this.includePartitionValue.equals(that.includePartitionValue) : that.includePartitionValue != null) return false;
            if (this.includeTableAlterOperations != null ? !this.includeTableAlterOperations.equals(that.includeTableAlterOperations) : that.includeTableAlterOperations != null) return false;
            if (this.includeTransactionDetails != null ? !this.includeTransactionDetails.equals(that.includeTransactionDetails) : that.includeTransactionDetails != null) return false;
            if (this.messageFormat != null ? !this.messageFormat.equals(that.messageFormat) : that.messageFormat != null) return false;
            if (this.partitionIncludeSchemaTable != null ? !this.partitionIncludeSchemaTable.equals(that.partitionIncludeSchemaTable) : that.partitionIncludeSchemaTable != null) return false;
            if (this.serviceAccessRoleArn != null ? !this.serviceAccessRoleArn.equals(that.serviceAccessRoleArn) : that.serviceAccessRoleArn != null) return false;
            if (this.streamArn != null ? !this.streamArn.equals(that.streamArn) : that.streamArn != null) return false;
            return this.useLargeIntegerValue != null ? this.useLargeIntegerValue.equals(that.useLargeIntegerValue) : that.useLargeIntegerValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.includeControlDetails != null ? this.includeControlDetails.hashCode() : 0;
            result = 31 * result + (this.includeNullAndEmpty != null ? this.includeNullAndEmpty.hashCode() : 0);
            result = 31 * result + (this.includePartitionValue != null ? this.includePartitionValue.hashCode() : 0);
            result = 31 * result + (this.includeTableAlterOperations != null ? this.includeTableAlterOperations.hashCode() : 0);
            result = 31 * result + (this.includeTransactionDetails != null ? this.includeTransactionDetails.hashCode() : 0);
            result = 31 * result + (this.messageFormat != null ? this.messageFormat.hashCode() : 0);
            result = 31 * result + (this.partitionIncludeSchemaTable != null ? this.partitionIncludeSchemaTable.hashCode() : 0);
            result = 31 * result + (this.serviceAccessRoleArn != null ? this.serviceAccessRoleArn.hashCode() : 0);
            result = 31 * result + (this.streamArn != null ? this.streamArn.hashCode() : 0);
            result = 31 * result + (this.useLargeIntegerValue != null ? this.useLargeIntegerValue.hashCode() : 0);
            return result;
        }
    }
}
