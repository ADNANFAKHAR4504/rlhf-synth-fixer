package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRule.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#destination S3BucketReplicationConfigurationA#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * delete_marker_replication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#delete_marker_replication S3BucketReplicationConfigurationA#delete_marker_replication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication getDeleteMarkerReplication() {
        return null;
    }

    /**
     * existing_object_replication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#existing_object_replication S3BucketReplicationConfigurationA#existing_object_replication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication getExistingObjectReplication() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#filter S3BucketReplicationConfigurationA#filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#id S3BucketReplicationConfigurationA#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#prefix S3BucketReplicationConfigurationA#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#priority S3BucketReplicationConfigurationA#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * source_selection_criteria block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#source_selection_criteria S3BucketReplicationConfigurationA#source_selection_criteria}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria getSourceSelectionCriteria() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRule> {
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination destination;
        java.lang.String status;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication deleteMarkerReplication;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication existingObjectReplication;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter filter;
        java.lang.String id;
        java.lang.String prefix;
        java.lang.Number priority;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria sourceSelectionCriteria;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#destination S3BucketReplicationConfigurationA#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getDeleteMarkerReplication}
         * @param deleteMarkerReplication delete_marker_replication block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#delete_marker_replication S3BucketReplicationConfigurationA#delete_marker_replication}
         * @return {@code this}
         */
        public Builder deleteMarkerReplication(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication deleteMarkerReplication) {
            this.deleteMarkerReplication = deleteMarkerReplication;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getExistingObjectReplication}
         * @param existingObjectReplication existing_object_replication block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#existing_object_replication S3BucketReplicationConfigurationA#existing_object_replication}
         * @return {@code this}
         */
        public Builder existingObjectReplication(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication existingObjectReplication) {
            this.existingObjectReplication = existingObjectReplication;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#filter S3BucketReplicationConfigurationA#filter}
         * @return {@code this}
         */
        public Builder filter(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#id S3BucketReplicationConfigurationA#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#prefix S3BucketReplicationConfigurationA#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#priority S3BucketReplicationConfigurationA#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRule#getSourceSelectionCriteria}
         * @param sourceSelectionCriteria source_selection_criteria block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#source_selection_criteria S3BucketReplicationConfigurationA#source_selection_criteria}
         * @return {@code this}
         */
        public Builder sourceSelectionCriteria(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria sourceSelectionCriteria) {
            this.sourceSelectionCriteria = sourceSelectionCriteria;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRule {
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination destination;
        private final java.lang.String status;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication deleteMarkerReplication;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication existingObjectReplication;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter filter;
        private final java.lang.String id;
        private final java.lang.String prefix;
        private final java.lang.Number priority;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria sourceSelectionCriteria;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteMarkerReplication = software.amazon.jsii.Kernel.get(this, "deleteMarkerReplication", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication.class));
            this.existingObjectReplication = software.amazon.jsii.Kernel.get(this, "existingObjectReplication", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sourceSelectionCriteria = software.amazon.jsii.Kernel.get(this, "sourceSelectionCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.deleteMarkerReplication = builder.deleteMarkerReplication;
            this.existingObjectReplication = builder.existingObjectReplication;
            this.filter = builder.filter;
            this.id = builder.id;
            this.prefix = builder.prefix;
            this.priority = builder.priority;
            this.sourceSelectionCriteria = builder.sourceSelectionCriteria;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestination getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDeleteMarkerReplication getDeleteMarkerReplication() {
            return this.deleteMarkerReplication;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleExistingObjectReplication getExistingObjectReplication() {
            return this.existingObjectReplication;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleFilter getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleSourceSelectionCriteria getSourceSelectionCriteria() {
            return this.sourceSelectionCriteria;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            data.set("status", om.valueToTree(this.getStatus()));
            if (this.getDeleteMarkerReplication() != null) {
                data.set("deleteMarkerReplication", om.valueToTree(this.getDeleteMarkerReplication()));
            }
            if (this.getExistingObjectReplication() != null) {
                data.set("existingObjectReplication", om.valueToTree(this.getExistingObjectReplication()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }
            if (this.getSourceSelectionCriteria() != null) {
                data.set("sourceSelectionCriteria", om.valueToTree(this.getSourceSelectionCriteria()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRule.Jsii$Proxy that = (S3BucketReplicationConfigurationRule.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (!status.equals(that.status)) return false;
            if (this.deleteMarkerReplication != null ? !this.deleteMarkerReplication.equals(that.deleteMarkerReplication) : that.deleteMarkerReplication != null) return false;
            if (this.existingObjectReplication != null ? !this.existingObjectReplication.equals(that.existingObjectReplication) : that.existingObjectReplication != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.priority != null ? !this.priority.equals(that.priority) : that.priority != null) return false;
            return this.sourceSelectionCriteria != null ? this.sourceSelectionCriteria.equals(that.sourceSelectionCriteria) : that.sourceSelectionCriteria == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.status.hashCode());
            result = 31 * result + (this.deleteMarkerReplication != null ? this.deleteMarkerReplication.hashCode() : 0);
            result = 31 * result + (this.existingObjectReplication != null ? this.existingObjectReplication.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            result = 31 * result + (this.sourceSelectionCriteria != null ? this.sourceSelectionCriteria.hashCode() : 0);
            return result;
        }
    }
}
