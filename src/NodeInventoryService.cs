using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using TrafficMonitoring.Domain.Entities;
using TrafficMonitoring.Domain.Interfaces;

namespace TrafficMonitoring.Application.Services
{
    /// <summary>
    /// 节点资产服务 - 管理服务器与交换机等资产元数据
    /// </summary>
    public class NodeInventoryService
    {
        private readonly INodeRepository _nodeRepository;
        private readonly INodeGroupRepository _groupRepository;
        private readonly IProbeHeartbeatRepository _heartbeatRepository;

        public NodeInventoryService(
            INodeRepository nodeRepository,
            INodeGroupRepository groupRepository,
            IProbeHeartbeatRepository heartbeatRepository)
        {
            _nodeRepository = nodeRepository;
            _groupRepository = groupRepository;
            _heartbeatRepository = heartbeatRepository;
        }

        /// <summary>
        /// 获取节点列表
        /// </summary>
        public async Task<List<NodeEntity>> GetNodesAsync(NodeFilter filter = null)
        {
            return await _nodeRepository.GetListAsync(filter);
        }

        /// <summary>
        /// 获取节点详情
        /// </summary>
        public async Task<NodeEntity> GetNodeByIdAsync(int nodeId)
        {
            return await _nodeRepository.GetByIdAsync(nodeId);
        }

        /// <summary>
        /// 创建节点
        /// </summary>
        public async Task<NodeEntity> CreateNodeAsync(CreateNodeDto dto)
        {
            var node = new NodeEntity
            {
                Name = dto.Name,
                Type = dto.Type,
                IP = dto.IP,
                GroupId = dto.GroupId,
                Tags = dto.Tags,
                Bandwidth = dto.Bandwidth,
                Location = dto.Location,
                Status = NodeStatus.Online,
                ProbeStatus = ProbeStatus.Normal,
                CreatedTime = DateTime.UtcNow
            };

            await _nodeRepository.AddAsync(node);
            return node;
        }

        /// <summary>
        /// 更新节点
        /// </summary>
        public async Task UpdateNodeAsync(int nodeId, UpdateNodeDto dto)
        {
            var node = await _nodeRepository.GetByIdAsync(nodeId);
            if (node == null)
                throw new InvalidOperationException($"节点 {nodeId} 不存在");

            node.Name = dto.Name;
            node.Type = dto.Type;
            node.IP = dto.IP;
            node.GroupId = dto.GroupId;
            node.Tags = dto.Tags;
            node.Bandwidth = dto.Bandwidth;
            node.Location = dto.Location;
            node.UpdatedTime = DateTime.UtcNow;

            await _nodeRepository.UpdateAsync(node);
        }

        /// <summary>
        /// 删除节点
        /// </summary>
        public async Task DeleteNodeAsync(int nodeId)
        {
            await _nodeRepository.DeleteAsync(nodeId);
        }

        /// <summary>
        /// 节点分组管理 - 获取分组列表
        /// </summary>
        public async Task<List<NodeGroupEntity>> GetGroupsAsync()
        {
            return await _groupRepository.GetListAsync();
        }

        /// <summary>
        /// 创建节点分组
        /// </summary>
        public async Task<NodeGroupEntity> CreateGroupAsync(string name, string description)
        {
            var group = new NodeGroupEntity
            {
                Name = name,
                Description = description,
                CreatedTime = DateTime.UtcNow
            };

            await _groupRepository.AddAsync(group);
            return group;
        }

        /// <summary>
        /// 更新节点标签
        /// </summary>
        public async Task UpdateNodeTagsAsync(int nodeId, List<string> tags)
        {
            var node = await _nodeRepository.GetByIdAsync(nodeId);
            if (node == null)
                throw new InvalidOperationException($"节点 {nodeId} 不存在");

            node.Tags = tags;
            await _nodeRepository.UpdateAsync(node);
        }

        /// <summary>
        /// 探针心跳监测 - 记录心跳
        /// </summary>
        public async Task RecordHeartbeatAsync(int nodeId, ProbeHeartbeatDTO dto)
        {
            var heartbeat = new ProbeHeartbeatEntity
            {
                NodeId = nodeId,
                Timestamp = DateTime.UtcNow,
                Latency = dto.Latency,
                Status = dto.Status,
                Message = dto.Message
            };

            await _heartbeatRepository.AddAsync(heartbeat);

            // 更新节点探针状态
            var node = await _nodeRepository.GetByIdAsync(nodeId);
            if (node != null)
            {
                node.ProbeStatus = dto.Status;
                node.LastHeartbeat = DateTime.UtcNow;
                await _nodeRepository.UpdateAsync(node);
            }
        }

        /// <summary>
        /// 检查探针超时
        /// </summary>
        public async Task CheckProbeTimeoutAsync(int timeoutSeconds = 60)
        {
            var timeoutThreshold = DateTime.UtcNow.AddSeconds(-timeoutSeconds);
            var nodes = await _nodeRepository.GetListAsync();

            foreach (var node in nodes)
            {
                if (node.LastHeartbeat < timeoutThreshold && node.Status == NodeStatus.Online)
                {
                    // 标记节点为离线
                    node.Status = NodeStatus.Offline;
                    node.ProbeStatus = ProbeStatus.Error;
                    await _nodeRepository.UpdateAsync(node);

                    // 触发离线告警
                    await TriggerOfflineAlertAsync(node);
                }
            }
        }

        /// <summary>
        /// 触发离线告警
        /// </summary>
        private async Task TriggerOfflineAlertAsync(NodeEntity node)
        {
            // 这里可以调用告警引擎服务触发离线告警
            // 实际实现中应该注入 AlertEngineService
        }

        /// <summary>
        /// 获取节点统计信息
        /// </summary>
        public async Task<NodeStatisticsDTO> GetNodeStatisticsAsync()
        {
            var nodes = await _nodeRepository.GetListAsync();

            return new NodeStatisticsDTO
            {
                TotalNodes = nodes.Count,
                OnlineNodes = nodes.Count(n => n.Status == NodeStatus.Online),
                OfflineNodes = nodes.Count(n => n.Status == NodeStatus.Offline),
                WarningNodes = nodes.Count(n => n.ProbeStatus == ProbeStatus.Warning),
                ErrorNodes = nodes.Count(n => n.ProbeStatus == ProbeStatus.Error)
            };
        }
    }

    #region DTOs

    public class NodeFilter
    {
        public string Keyword { get; set; }
        public int? GroupId { get; set; }
        public NodeStatus? Status { get; set; }
        public List<string> Tags { get; set; }
    }

    public class CreateNodeDTO
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string IP { get; set; }
        public int GroupId { get; set; }
        public List<string> Tags { get; set; }
        public int Bandwidth { get; set; }
        public string Location { get; set; }
    }

    public class UpdateNodeDTO
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string IP { get; set; }
        public int GroupId { get; set; }
        public List<string> Tags { get; set; }
        public int Bandwidth { get; set; }
        public string Location { get; set; }
    }

    public class ProbeHeartbeatDTO
    {
        public double Latency { get; set; }
        public ProbeStatus Status { get; set; }
        public string Message { get; set; }
    }

    public class NodeStatisticsDTO
    {
        public int TotalNodes { get; set; }
        public int OnlineNodes { get; set; }
        public int OfflineNodes { get; set; }
        public int WarningNodes { get; set; }
        public int ErrorNodes { get; set; }
    }

    #endregion
}
