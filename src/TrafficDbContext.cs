using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrafficMonitoring.Domain.Entities;

namespace TrafficMonitoring.Infrastructure.Data
{
    /// <summary>
    /// Entity Framework Core 上下文 - 配置流量时序数据表与告警审计记录表的关系映射
    /// </summary>
    public class TrafficDbContext : DbContext
    {
        public TrafficDbContext(DbContextOptions<TrafficDbContext> options)
            : base(options)
        {
        }

        /// <summary>
        /// 流量指标数据表
        /// </summary>
        public DbSet<NetworkMetricEntity> NetworkMetrics { get; set; }

        /// <summary>
        /// 告警事件表
        /// </summary>
        public DbSet<AlertEventEntity> Alerts { get; set; }

        /// <summary>
        /// 告警审计日志表
        /// </summary>
        public DbSet<AlertAuditLogEntity> AlertAuditLogs { get; set; }

        /// <summary>
        /// 节点设备表
        /// </summary>
        public DbSet<NodeEntity> Nodes { get; set; }

        /// <summary>
        /// 节点分组表
        /// </summary>
        public DbSet<NodeGroupEntity> NodeGroups { get; set; }

        /// <summary>
        /// 探针心跳记录表
        /// </summary>
        public DbSet<ProbeHeartbeatEntity> ProbeHeartbeats { get; set; }

        /// <summary>
        /// 通知渠道表
        /// </summary>
        public DbSet<NotificationChannelEntity> NotificationChannels { get; set; }

        /// <summary>
        /// 用户表
        /// </summary>
        public DbSet<UserEntity> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 配置流量指标表
            modelBuilder.Entity<NetworkMetricEntity>(entity =>
            {
                entity.ToTable("NetworkMetrics");
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Timestamp)
                    .IsRequired()
                    .HasConversion(
                        v => v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

                entity.Property(e => e.UploadBandwidth)
                    .IsRequired()
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.DownloadBandwidth)
                    .IsRequired()
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.TotalBandwidth)
                    .IsRequired()
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.BandwidthUsage)
                    .HasColumnType("decimal(5,2)");

                entity.Property(e => e.PacketLossRate)
                    .HasColumnType("decimal(5,2)");

                entity.Property(e => e.Latency)
                    .HasColumnType("decimal(10,2)");

                // 索引优化 - 按节点和时间查询
                entity.HasIndex(e => new { e.NodeId, e.Timestamp })
                    .HasDatabaseName("IX_NetworkMetrics_NodeId_Timestamp");

                // 索引优化 - 按时间范围查询
                entity.HasIndex(e => e.Timestamp)
                    .HasDatabaseName("IX_NetworkMetrics_Timestamp");

                // 关系配置
                entity.HasOne(e => e.Node)
                    .WithMany()
                    .HasForeignKey(e => e.NodeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 配置告警事件表
            modelBuilder.Entity<AlertEventEntity>(entity =>
            {
                entity.ToTable("AlertEvents");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.NodeName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Message)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Assignee)
                    .HasMaxLength(50);

                entity.Property(e => e.TriggerTime)
                    .IsRequired()
                    .HasConversion(
                        v => v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

                // 索引优化 - 按状态查询
                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_Alerts_Status");

                // 索引优化 - 按级别查询
                entity.HasIndex(e => e.Level)
                    .HasDatabaseName("IX_Alerts_Level");

                // 索引优化 - 按节点查询
                entity.HasIndex(e => e.NodeId)
                    .HasDatabaseName("IX_Alerts_NodeId");

                // 索引优化 - 按触发时间查询
                entity.HasIndex(e => e.TriggerTime)
                    .HasDatabaseName("IX_Alerts_TriggerTime");

                // 复合索引 - 状态和时间
                entity.HasIndex(e => new { e.Status, e.TriggerTime })
                    .HasDatabaseName("IX_Alerts_Status_TriggerTime");

                // 关系配置
                entity.HasOne(e => e.Node)
                    .WithMany()
                    .HasForeignKey(e => e.NodeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.AuditLogs)
                    .WithOne(e => e.Alert)
                    .HasForeignKey(e => e.AlertId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 配置告警审计日志表
            modelBuilder.Entity<AlertAuditLogEntity>(entity =>
            {
                entity.ToTable("AlertAuditLogs");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ActionType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Operator)
                    .HasMaxLength(50);

                entity.Property(e => e.Details)
                    .HasMaxLength(500);

                // 索引优化 - 按告警 ID 查询
                entity.HasIndex(e => e.AlertId)
                    .HasDatabaseName("IX_AlertAuditLogs_AlertId");

                // 索引优化 - 按创建时间查询
                entity.HasIndex(e => e.CreatedTime)
                    .HasDatabaseName("IX_AlertAuditLogs_CreatedTime");
            });

            // 配置节点设备表
            modelBuilder.Entity<NodeEntity>(entity =>
            {
                entity.ToTable("Nodes");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.IP)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Type)
                    .HasMaxLength(50);

                entity.Property(e => e.Location)
                    .HasMaxLength(100);

                // 索引优化 - 按状态查询
                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_Nodes_Status");

                // 索引优化 - 按分组查询
                entity.HasIndex(e => e.GroupId)
                    .HasDatabaseName("IX_Nodes_GroupId");
            });

            // 配置节点分组表
            modelBuilder.Entity<NodeGroupEntity>(entity =>
            {
                entity.ToTable("NodeGroups");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);
            });

            // 配置探针心跳记录表
            modelBuilder.Entity<ProbeHeartbeatEntity>(entity =>
            {
                entity.ToTable("ProbeHeartbeats");
                entity.HasKey(e => e.Id);

                // 索引优化 - 按节点和时间查询
                entity.HasIndex(e => new { e.NodeId, e.Timestamp })
                    .HasDatabaseName("IX_ProbeHeartbeats_NodeId_Timestamp");
            });

            // 配置通知渠道表
            modelBuilder.Entity<NotificationChannelEntity>(entity =>
            {
                entity.ToTable("NotificationChannels");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Config)
                    .HasColumnType("nvarchar(max)");
            });

            // 配置用户表
            modelBuilder.Entity<UserEntity>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Email)
                    .HasMaxLength(100);

                entity.Property(e => e.Phone)
                    .HasMaxLength(20);

                entity.Property(e => e.Role)
                    .HasMaxLength(50);

                // 索引优化 - 按邮箱查询
                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasDatabaseName("IX_Users_Email");
            });
        }
    }
}
