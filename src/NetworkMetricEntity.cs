using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrafficMonitoring.Domain.Entities
{
    /// <summary>
    /// 流量指标领域模型
    /// </summary>
    [Table("NetworkMetrics")]
    public class NetworkMetricEntity
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
        /// 时间戳
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// 上行带宽 (Mbps)
        /// </summary>
        [Required]
        public double UploadBandwidth { get; set; }

        /// <summary>
        /// 下行带宽 (Mbps)
        /// </summary>
        [Required]
        public double DownloadBandwidth { get; set; }

        /// <summary>
        /// 总带宽 (Mbps)
        /// </summary>
        [Required]
        public double TotalBandwidth { get; set; }

        /// <summary>
        /// 带宽利用率 (%)
        /// </summary>
        public double BandwidthUsage { get; set; }

        /// <summary>
        /// 上行流量 (GB)
        /// </summary>
        public double UploadTraffic { get; set; }

        /// <summary>
        /// 下行流量 (GB)
        /// </summary>
        public double DownloadTraffic { get; set; }

        /// <summary>
        /// 总流量 (GB)
        /// </summary>
        public double TotalTraffic { get; set; }

        /// <summary>
        /// 丢包率 (%)
        /// </summary>
        public double PacketLossRate { get; set; }

        /// <summary>
        /// 延迟 (ms)
        /// </summary>
        public double Latency { get; set; }

        /// <summary>
        /// 关联的节点设备
        /// </summary>
        [ForeignKey("NodeId")]
        public virtual NodeEntity Node { get; set; }
    }
}
