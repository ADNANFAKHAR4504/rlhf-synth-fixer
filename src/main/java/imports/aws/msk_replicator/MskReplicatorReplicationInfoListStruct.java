package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.913Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListStruct")
@software.amazon.jsii.Jsii.Proxy(MskReplicatorReplicationInfoListStruct.Jsii$Proxy.class)
public interface MskReplicatorReplicationInfoListStruct extends software.amazon.jsii.JsiiSerializable {

    /**
     * consumer_group_replication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getConsumerGroupReplication();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#source_kafka_cluster_arn MskReplicator#source_kafka_cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceKafkaClusterArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_compression_type MskReplicator#target_compression_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetCompressionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_kafka_cluster_arn MskReplicator#target_kafka_cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetKafkaClusterArn();

    /**
     * topic_replication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTopicReplication();

    /**
     * @return a {@link Builder} of {@link MskReplicatorReplicationInfoListStruct}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskReplicatorReplicationInfoListStruct}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskReplicatorReplicationInfoListStruct> {
        java.lang.Object consumerGroupReplication;
        java.lang.String sourceKafkaClusterArn;
        java.lang.String targetCompressionType;
        java.lang.String targetKafkaClusterArn;
        java.lang.Object topicReplication;

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getConsumerGroupReplication}
         * @param consumerGroupReplication consumer_group_replication block. This parameter is required.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
         * @return {@code this}
         */
        public Builder consumerGroupReplication(com.hashicorp.cdktf.IResolvable consumerGroupReplication) {
            this.consumerGroupReplication = consumerGroupReplication;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getConsumerGroupReplication}
         * @param consumerGroupReplication consumer_group_replication block. This parameter is required.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
         * @return {@code this}
         */
        public Builder consumerGroupReplication(java.util.List<? extends imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication> consumerGroupReplication) {
            this.consumerGroupReplication = consumerGroupReplication;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getSourceKafkaClusterArn}
         * @param sourceKafkaClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#source_kafka_cluster_arn MskReplicator#source_kafka_cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceKafkaClusterArn(java.lang.String sourceKafkaClusterArn) {
            this.sourceKafkaClusterArn = sourceKafkaClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getTargetCompressionType}
         * @param targetCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_compression_type MskReplicator#target_compression_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetCompressionType(java.lang.String targetCompressionType) {
            this.targetCompressionType = targetCompressionType;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getTargetKafkaClusterArn}
         * @param targetKafkaClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_kafka_cluster_arn MskReplicator#target_kafka_cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetKafkaClusterArn(java.lang.String targetKafkaClusterArn) {
            this.targetKafkaClusterArn = targetKafkaClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getTopicReplication}
         * @param topicReplication topic_replication block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
         * @return {@code this}
         */
        public Builder topicReplication(com.hashicorp.cdktf.IResolvable topicReplication) {
            this.topicReplication = topicReplication;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorReplicationInfoListStruct#getTopicReplication}
         * @param topicReplication topic_replication block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
         * @return {@code this}
         */
        public Builder topicReplication(java.util.List<? extends imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication> topicReplication) {
            this.topicReplication = topicReplication;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskReplicatorReplicationInfoListStruct}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskReplicatorReplicationInfoListStruct build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskReplicatorReplicationInfoListStruct}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskReplicatorReplicationInfoListStruct {
        private final java.lang.Object consumerGroupReplication;
        private final java.lang.String sourceKafkaClusterArn;
        private final java.lang.String targetCompressionType;
        private final java.lang.String targetKafkaClusterArn;
        private final java.lang.Object topicReplication;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.consumerGroupReplication = software.amazon.jsii.Kernel.get(this, "consumerGroupReplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceKafkaClusterArn = software.amazon.jsii.Kernel.get(this, "sourceKafkaClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetCompressionType = software.amazon.jsii.Kernel.get(this, "targetCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetKafkaClusterArn = software.amazon.jsii.Kernel.get(this, "targetKafkaClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicReplication = software.amazon.jsii.Kernel.get(this, "topicReplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.consumerGroupReplication = java.util.Objects.requireNonNull(builder.consumerGroupReplication, "consumerGroupReplication is required");
            this.sourceKafkaClusterArn = java.util.Objects.requireNonNull(builder.sourceKafkaClusterArn, "sourceKafkaClusterArn is required");
            this.targetCompressionType = java.util.Objects.requireNonNull(builder.targetCompressionType, "targetCompressionType is required");
            this.targetKafkaClusterArn = java.util.Objects.requireNonNull(builder.targetKafkaClusterArn, "targetKafkaClusterArn is required");
            this.topicReplication = java.util.Objects.requireNonNull(builder.topicReplication, "topicReplication is required");
        }

        @Override
        public final java.lang.Object getConsumerGroupReplication() {
            return this.consumerGroupReplication;
        }

        @Override
        public final java.lang.String getSourceKafkaClusterArn() {
            return this.sourceKafkaClusterArn;
        }

        @Override
        public final java.lang.String getTargetCompressionType() {
            return this.targetCompressionType;
        }

        @Override
        public final java.lang.String getTargetKafkaClusterArn() {
            return this.targetKafkaClusterArn;
        }

        @Override
        public final java.lang.Object getTopicReplication() {
            return this.topicReplication;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("consumerGroupReplication", om.valueToTree(this.getConsumerGroupReplication()));
            data.set("sourceKafkaClusterArn", om.valueToTree(this.getSourceKafkaClusterArn()));
            data.set("targetCompressionType", om.valueToTree(this.getTargetCompressionType()));
            data.set("targetKafkaClusterArn", om.valueToTree(this.getTargetKafkaClusterArn()));
            data.set("topicReplication", om.valueToTree(this.getTopicReplication()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskReplicator.MskReplicatorReplicationInfoListStruct"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskReplicatorReplicationInfoListStruct.Jsii$Proxy that = (MskReplicatorReplicationInfoListStruct.Jsii$Proxy) o;

            if (!consumerGroupReplication.equals(that.consumerGroupReplication)) return false;
            if (!sourceKafkaClusterArn.equals(that.sourceKafkaClusterArn)) return false;
            if (!targetCompressionType.equals(that.targetCompressionType)) return false;
            if (!targetKafkaClusterArn.equals(that.targetKafkaClusterArn)) return false;
            return this.topicReplication.equals(that.topicReplication);
        }

        @Override
        public final int hashCode() {
            int result = this.consumerGroupReplication.hashCode();
            result = 31 * result + (this.sourceKafkaClusterArn.hashCode());
            result = 31 * result + (this.targetCompressionType.hashCode());
            result = 31 * result + (this.targetKafkaClusterArn.hashCode());
            result = 31 * result + (this.topicReplication.hashCode());
            return result;
        }
    }
}
