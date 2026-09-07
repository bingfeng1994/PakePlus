using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrafficMonitoring.Domain.Entities
{
    /// <summary>
    /// 告警事件领域模型
    /// </summary>
    [Table("AlertEvents")]
    public class AlertEventEntity
    {
        /// <summary>
        /// 主键 ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 节点 ID
        /// </summary>
        [Required]
        public int NodeId { get; set; }

        /// <summary>
        /// 节点名称
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string NodeName { get; set; }

        /// <summary>
        /// 告警级别
        /// </summary>
        [Required]
        public AlertLevel Level { get; set; }

        /// <summary>
        /// 告警类型
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Type { get; set; }

        /// <summary>
        /// 告警信息
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Message { get; set; }

        /// <summary>
        /// 触发时间
        /// </summary>
        [Required]
        public DateTime TriggerTime { get; set; }

        /// <summary>
        /// 告警状态
        /// </summary>
        [Required]
        public AlertStatus Status { get; set; }

        /// <summary>
        /// 处理人
        /// </summary>
        [MaxLength(50)]
        public string Assignee { get; set; }

        /// <summary>
        /// 当前值
        /// </summary>
        public double? CurrentValue { get; set; }

        /// <summary>
        /// 阈值
        /// </summary>
        public double? Threshold { get; set; }

        /// <summary>
        /// 确认时间
        /// </summary>
        public DateTime? ConfirmedTime { get; set; }

        /// <summary>
        /// 归档时间
        /// </summary>
        public DateTime? ArchivedTime { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        [Required]
        public DateTime CreatedTime { get; set; }

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime? UpdatedTime { get; set; }

        /// <summary>
        /// 关联的节点设备
        /// </summary>
        [ForeignKey("NodeId")]
        public virtual NodeEntity Node { get; set; }

        /// <summary>
        /// 关联的审计日志
        /// </summary>
        public virtual ICollection<AlertAuditLogEntity> AuditLogs { get; set; } = new List<AlertAuditLogEntity>();
    }

    /// <summary>
    /// 告警级别枚举
    /// </summary>
    public enum AlertLevel
    {
        Info = 0,
        Warning = 1,
        Critical = 2
    }

    /// <summary>
    /// 告警状态枚举
    /// </summary>
    public enum AlertStatus
    {
        Pending = 0,
        Processing = 1,
        Confirmed = 2,
        Archived = 3,
        FalsePositive = 4
    }

    /// <summary>
    /// 告警审计日志实体
    /// </summary>
    [Table("AlertAuditLogs")]
    public class AlertAuditLogEntity
    {
        /// <summary>
        /// 主键 ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 告警 ID
        /// </summary>
        [Required]
        public int AlertId { get; set; }

        /// <summary>
        /// 操作类型
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string ActionType { get; set; }

        /// <summary>
        /// 操作人
        /// </summary>
        [MaxLength(50)]
        public string Operator { get; set; }

        /// <summary>
        /// 操作详情
        /// </summary>
        [MaxLength(500)]
        public string Details { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        [Required]
        public DateTime CreatedTime { get; set; }

        /// <summary>
        /// 关联的告警事件
        /// </summary>
        [ForeignKey("AlertId")]
        public virtual AlertEventEntity Alert { get; set; }
    }
}
