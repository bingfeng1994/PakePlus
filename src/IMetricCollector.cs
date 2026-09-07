using System.Threading.Tasks;
using TrafficMonitoring.Domain.Entities;

namespace TrafficMonitoring.Domain.Interfaces
{
    /// <summary>
    /// 采集器接口 - 用于解耦不同网络设备的数据接入方式
    /// </summary>
    public interface IMetricCollector
    {
        /// <summary>
        /// 采集器类型（SNMP、Agent、Flow-log 等）
        /// </summary>
        string CollectorType { get; }

        /// <summary>
        /// 采集流量指标
        /// </summary>
        /// <param name="node">节点设备</param>
        /// <returns>流量指标数据</returns>
        Task<NetworkMetricEntity> CollectAsync(NodeEntity node);

        /// <summary>
        /// 批量采集流量指标
        /// </summary>
        /// <param name="nodes">节点设备列表</param>
        /// <returns>流量指标数据列表</returns>
        Task<NetworkMetricEntity[]> CollectBatchAsync(NodeEntity[] nodes);

        /// <summary>
        /// 测试采集器连接
        /// </summary>
        /// <param name="node">节点设备</param>
        /// <returns>连接是否成功</returns>
        Task<bool> TestConnectionAsync(NodeEntity node);

        /// <summary>
        /// 获取采集器状态
        /// </summary>
        /// <returns>采集器状态信息</returns>
        Task<CollectorStatus> GetStatusAsync();
    }

    /// <summary>
    /// 采集器状态
    /// </summary>
    public class CollectorStatus
    {
        /// <summary>
        /// 采集器类型
        /// </summary>
        public string CollectorType { get; set; }

        /// <summary>
        /// 是否在线
        /// </summary>
        public bool IsOnline { get; set; }

        /// <summary>
        /// 最后采集时间
        /// </summary>
        public System.DateTime? LastCollectTime { get; set; }

        /// <summary>
        /// 采集成功率
        /// </summary>
        public double SuccessRate { get; set; }

        /// <summary>
        /// 平均采集延迟（毫秒）
        /// </summary>
        public double AvgLatency { get; set; }

        /// <summary>
        /// 错误信息
        /// </summary>
        public string ErrorMessage { get; set; }
    }

    /// <summary>
    /// SNMP 采集器实现
    /// </summary>
    public class SnmpMetricCollector : IMetricCollector
    {
        public string CollectorType => "SNMP";

        public async Task<NetworkMetricEntity> CollectAsync(NodeEntity node)
        {
            // 实现 SNMP 采集逻辑
            await Task.Delay(100); // 模拟采集延迟
            
            return new NetworkMetricEntity
            {
                NodeId = node.Id,
                Timestamp = System.DateTime.UtcNow,
                UploadBandwidth = 100,
                DownloadBandwidth = 200,
                TotalBandwidth = node.Bandwidth,
                BandwidthUsage = 15.0
            };
        }

        public async Task<NetworkMetricEntity[]> CollectBatchAsync(NodeEntity[] nodes)
        {
            var results = new NetworkMetricEntity[nodes.Length];
            for (int i = 0; i < nodes.Length; i++)
            {
                results[i] = await CollectAsync(nodes[i]);
            }
            return results;
        }

        public async Task<bool> TestConnectionAsync(NodeEntity node)
        {
            // 实现 SNMP 连接测试
            await Task.Delay(50);
            return true;
        }

        public async Task<CollectorStatus> GetStatusAsync()
        {
            await Task.Delay(10);
            return new CollectorStatus
            {
                CollectorType = CollectorType,
                IsOnline = true,
                LastCollectTime = System.DateTime.UtcNow,
                SuccessRate = 99.5,
                AvgLatency = 50
            };
        }
    }

    /// <summary>
    /// Agent 采集器实现
    /// </summary>
    public class AgentMetricCollector : IMetricCollector
    {
        public string CollectorType => "Agent";

        public async Task<NetworkMetricEntity> CollectAsync(NodeEntity node)
        {
            // 实现 Agent 采集逻辑
            await Task.Delay(80);
            
            return new NetworkMetricEntity
            {
                NodeId = node.Id,
                Timestamp = System.DateTime.UtcNow,
                UploadBandwidth = 120,
                DownloadBandwidth = 220,
                TotalBandwidth = node.Bandwidth,
                BandwidthUsage = 17.0
            };
        }

        public async Task<NetworkMetricEntity[]> CollectBatchAsync(NodeEntity[] nodes)
        {
            var results = new NetworkMetricEntity[nodes.Length];
            for (int i = 0; i < nodes.Length; i++)
            {
                results[i] = await CollectAsync(nodes[i]);
            }
            return results;
        }

        public async Task<bool> TestConnectionAsync(NodeEntity node)
        {
            await Task.Delay(30);
            return true;
        }

        public async Task<CollectorStatus> GetStatusAsync()
        {
            await Task.Delay(10);
            return new CollectorStatus
            {
                CollectorType = CollectorType,
                IsOnline = true,
                LastCollectTime = System.DateTime.UtcNow,
                SuccessRate = 99.8,
                AvgLatency = 30
            };
        }
    }

    /// <summary>
    /// Flow-log 采集器实现
    /// </summary>
    public class FlowLogMetricCollector : IMetricCollector
    {
        public string CollectorType => "Flow-log";

        public async Task<NetworkMetricEntity> CollectAsync(NodeEntity node)
        {
            // 实现 Flow-log 采集逻辑
            await Task.Delay(120);
            
            return new NetworkMetricEntity
            {
                NodeId = node.Id,
                Timestamp = System.DateTime.UtcNow,
                UploadBandwidth = 90,
                DownloadBandwidth = 180,
                TotalBandwidth = node.Bandwidth,
                BandwidthUsage = 13.5
            };
        }

        public async Task<NetworkMetricEntity[]> CollectBatchAsync(NodeEntity[] nodes)
        {
            var results = new NetworkMetricEntity[nodes.Length];
            for (int i = 0; i < nodes.Length; i++)
            {
                results[i] = await CollectAsync(nodes[i]);
            }
            return results;
        }

        public async Task<bool> TestConnectionAsync(NodeEntity node)
        {
            await Task.Delay(60);
            return true;
        }

        public async Task<CollectorStatus> GetStatusAsync()
        {
            await Task.Delay(10);
            return new CollectorStatus
            {
                CollectorType = CollectorType,
                IsOnline = true,
                LastCollectTime = System.DateTime.UtcNow,
                SuccessRate = 99.2,
                AvgLatency = 60
            };
        }
    }
}
