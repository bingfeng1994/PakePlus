using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using TrafficMonitoring.Domain.Entities;
using TrafficMonitoring.Domain.Interfaces;
using TrafficMonitoring.Application.DTOs;

namespace TrafficMonitoring.Application.Services
{
    /// <summary>
    /// 告警引擎服务 - 核心逻辑服务
    /// </summary>
    public class AlertEngineService
    {
        private readonly IAlertRepository _alertRepository;
        private readonly INodeRepository _nodeRepository;
        private readonly ISystemConfigRepository _configRepository;
        private readonly INotificationService _notificationService;

        public AlertEngineService(
            IAlertRepository alertRepository,
            INodeRepository nodeRepository,
            ISystemConfigRepository configRepository,
            INotificationService notificationService)
        {
            _alertRepository = alertRepository;
            _nodeRepository = nodeRepository;
            _configRepository = configRepository;
            _notificationService = notificationService;
        }

        /// <summary>
        /// 评估流量指标并触发告警
        /// </summary>
        public async Task<List<AlertEventEntity>> EvaluateMetrics(NetworkMetricEntity metric)
        {
            var triggeredAlerts = new List<AlertEventEntity>();
            var node = await _nodeRepository.GetByIdAsync(metric.NodeId);
            
            if (node == null) return triggeredAlerts;

            var config = await _configRepository.GetAlertConfigAsync();
            
            // 静态阈值检查
            if (await CheckStaticThreshold(metric, config))
            {
                var alert = CreateAlertEvent(metric, node, AlertLevel.Warning, "静态阈值超限");
                triggeredAlerts.Add(alert);
            }

            // AI 动态基线检查
            if (config.DynamicThresholdEnabled)
            {
                if (await CheckDynamicBaseline(metric, config))
                {
                    var alert = CreateAlertEvent(metric, node, AlertLevel.Critical, "AI 动态基线异常");
                    triggeredAlerts.Add(alert);
                }
            }

            // 保存告警事件
            foreach (var alert in triggeredAlerts)
            {
                await _alertRepository.AddAsync(alert);
                await _notificationService.SendAlertAsync(alert);
            }

            return triggeredAlerts;
        }

        /// <summary>
        /// 检查静态阈值
        /// </summary>
        private async Task<bool> CheckStaticThreshold(NetworkMetricEntity metric, AlertConfig config)
        {
            var uploadThreshold = metric.Bandwidth * config.UploadThreshold / 100;
            var downloadThreshold = metric.Bandwidth * config.DownloadThreshold / 100;

            return metric.UploadBandwidth > uploadThreshold || 
                   metric.DownloadBandwidth > downloadThreshold;
        }

        /// <summary>
        /// 检查 AI 动态基线
        /// </summary>
        private async Task<bool> CheckDynamicBaseline(NetworkMetricEntity metric, AlertConfig config)
        {
            // 获取历史基线数据
            var baseline = await CalculateBaseline(metric.NodeId, config.BaselinePeriod);
            
            var threshold = baseline * config.DynamicMultiplier;
            
            return metric.UploadBandwidth > threshold || 
                   metric.DownloadBandwidth > threshold;
        }

        /// <summary>
        /// 计算历史基线
        /// </summary>
        private async Task<double> CalculateBaseline(int nodeId, int periodDays)
        {
            var startDate = DateTime.UtcNow.AddDays(-periodDays);
            var metrics = await _alertRepository.GetMetricsByNodeAsync(nodeId, startDate, DateTime.UtcNow);
            
            if (metrics.Count == 0) return 0;

            var avgUpload = metrics.Average(m => m.UploadBandwidth);
            var avgDownload = metrics.Average(m => m.DownloadBandwidth);
            
            return Math.Max(avgUpload, avgDownload);
        }

        /// <summary>
        /// 创建告警事件
        /// </summary>
        private AlertEventEntity CreateAlertEvent(
            NetworkMetricEntity metric,
            NodeEntity node,
            AlertLevel level,
            string message)
        {
            return new AlertEventEntity
            {
                NodeId = metric.NodeId,
                NodeName = node.Name,
                Level = level,
                Type = "流量异常",
                Message = message,
                TriggerTime = DateTime.UtcNow,
                Status = AlertStatus.Pending,
                CurrentValue = Math.Max(metric.UploadBandwidth, metric.DownloadBandwidth),
                Threshold = metric.Bandwidth * 0.9
            };
        }

        /// <summary>
        /// 确认告警
        /// </summary>
        public async Task ConfirmAlertAsync(int alertId, string assignee)
        {
            var alert = await _alertRepository.GetByIdAsync(alertId);
            if (alert != null)
            {
                alert.Status = AlertStatus.Processing;
                alert.Assignee = assignee;
                alert.ConfirmedTime = DateTime.UtcNow;
                
                await _alertRepository.UpdateAsync(alert);
            }
        }

        /// <summary>
        /// 标记误报
        /// </summary>
        public async Task MarkAsFalsePositiveAsync(int alertId)
        {
            var alert = await _alertRepository.GetByIdAsync(alertId);
            if (alert != null)
            {
                alert.Status = AlertStatus.FalsePositive;
                await _alertRepository.UpdateAsync(alert);
            }
        }

        /// <summary>
        /// 归档告警
        /// </summary>
        public async Task ArchiveAlertAsync(int alertId)
        {
            var alert = await _alertRepository.GetByIdAsync(alertId);
            if (alert != null)
            {
                alert.Status = AlertStatus.Archived;
                alert.ArchivedTime = DateTime.UtcNow;
                await _alertRepository.UpdateAsync(alert);
            }
        }
    }
}
