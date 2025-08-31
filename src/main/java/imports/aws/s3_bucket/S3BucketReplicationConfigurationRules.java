package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfigurationRules")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRules.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRules extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#destination S3Bucket#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#status S3Bucket#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#delete_marker_replication_status S3Bucket#delete_marker_replication_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeleteMarkerReplicationStatus() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#filter S3Bucket#filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#prefix S3Bucket#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#priority S3Bucket#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * source_selection_criteria block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#source_selection_criteria S3Bucket#source_selection_criteria}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria getSourceSelectionCriteria() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRules}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRules}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRules> {
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination destination;
        java.lang.String status;
        java.lang.String deleteMarkerReplicationStatus;
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter filter;
        java.lang.String id;
        java.lang.String prefix;
        java.lang.Number priority;
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria sourceSelectionCriteria;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#destination S3Bucket#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#status S3Bucket#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getDeleteMarkerReplicationStatus}
         * @param deleteMarkerReplicationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#delete_marker_replication_status S3Bucket#delete_marker_replication_status}.
         * @return {@code this}
         */
        public Builder deleteMarkerReplicationStatus(java.lang.String deleteMarkerReplicationStatus) {
            this.deleteMarkerReplicationStatus = deleteMarkerReplicationStatus;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#filter S3Bucket#filter}
         * @return {@code this}
         */
        public Builder filter(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#prefix S3Bucket#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#priority S3Bucket#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRules#getSourceSelectionCriteria}
         * @param sourceSelectionCriteria source_selection_criteria block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#source_selection_criteria S3Bucket#source_selection_criteria}
         * @return {@code this}
         */
        public Builder sourceSelectionCriteria(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria sourceSelectionCriteria) {
            this.sourceSelectionCriteria = sourceSelectionCriteria;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRules}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRules build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRules}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRules {
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination destination;
        private final java.lang.String status;
        private final java.lang.String deleteMarkerReplicationStatus;
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter filter;
        private final java.lang.String id;
        private final java.lang.String prefix;
        private final java.lang.Number priority;
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria sourceSelectionCriteria;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteMarkerReplicationStatus = software.amazon.jsii.Kernel.get(this, "deleteMarkerReplicationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sourceSelectionCriteria = software.amazon.jsii.Kernel.get(this, "sourceSelectionCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.deleteMarkerReplicationStatus = builder.deleteMarkerReplicationStatus;
            this.filter = builder.filter;
            this.id = builder.id;
            this.prefix = builder.prefix;
            this.priority = builder.priority;
            this.sourceSelectionCriteria = builder.sourceSelectionCriteria;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestination getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getDeleteMarkerReplicationStatus() {
            return this.deleteMarkerReplicationStatus;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesFilter getFilter() {
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
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesSourceSelectionCriteria getSourceSelectionCriteria() {
            return this.sourceSelectionCriteria;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            data.set("status", om.valueToTree(this.getStatus()));
            if (this.getDeleteMarkerReplicationStatus() != null) {
                data.set("deleteMarkerReplicationStatus", om.valueToTree(this.getDeleteMarkerReplicationStatus()));
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
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketReplicationConfigurationRules"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRules.Jsii$Proxy that = (S3BucketReplicationConfigurationRules.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (!status.equals(that.status)) return false;
            if (this.deleteMarkerReplicationStatus != null ? !this.deleteMarkerReplicationStatus.equals(that.deleteMarkerReplicationStatus) : that.deleteMarkerReplicationStatus != null) return false;
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
            result = 31 * result + (this.deleteMarkerReplicationStatus != null ? this.deleteMarkerReplicationStatus.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            result = 31 * result + (this.sourceSelectionCriteria != null ? this.sourceSelectionCriteria.hashCode() : 0);
            return result;
        }
    }
}
