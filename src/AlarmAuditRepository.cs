using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using TrafficMonitoring.Domain.Entities;
using TrafficMonitoring.Domain.Interfaces;
using TrafficMonitoring.Infrastructure.Data;

namespace TrafficMonitoring.Infrastructure.Repositories
{
    /// <summary>
    /// 告警审计仓储 - 负责告警事件的全生命周期持久化
    /// </summary>
    public class AlarmAuditRepository : IAlertRepository
    {
        private readonly TrafficDbContext _context;

        public AlarmAuditRepository(TrafficDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 添加告警事件
        /// </summary>
        public async Task<AlertEventEntity> AddAsync(AlertEventEntity alert)
        {
            alert.Id = 0;
            alert.CreatedTime = DateTime.UtcNow;
            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
            return alert;
        }

        /// <summary>
        /// 更新告警事件
        /// </summary>
        public async Task UpdateAsync(AlertEventEntity alert)
        {
            alert.UpdatedTime = DateTime.UtcNow;
            _context.Alerts.Update(alert);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// 根据 ID 获取告警
        /// </summary>
        public async Task<AlertEventEntity> GetByIdAsync(int alertId)
        {
            return await _context.Alerts
                .Include(a => a.AuditLogs)
                .FirstOrDefaultAsync(a => a.Id == alertId);
        }

        /// <summary>
        /// 获取告警列表
        /// </summary>
        public async Task<List<AlertEventEntity>> GetListAsync(AlertFilter filter = null)
        {
            var query = _context.Alerts.AsQueryable();

            if (filter != null)
            {
                if (filter.Status.HasValue)
                    query = query.Where(a => a.Status == filter.Status.Value);

                if (filter.Level.HasValue)
                    query = query.Where(a => a.Level == filter.Level.Value);

                if (filter.NodeId.HasValue)
                    query = query.Where(a => a.NodeId == filter.NodeId.Value);

                if (!string.IsNullOrEmpty(filter.Keyword))
                    query = query.Where(a => a.Message.Contains(filter.Keyword) || 
                                           a.NodeName.Contains(filter.Keyword));

                if (filter.StartDate.HasValue)
                    query = query.Where(a => a.TriggerTime >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(a => a.TriggerTime <= filter.EndDate.Value);
            }

            return await query
                .OrderByDescending(a => a.TriggerTime)
                .ToListAsync();
        }

        /// <summary>
        /// 获取告警统计
        /// </summary>
        public async Task<AlertStatisticsDTO> GetStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.Alerts.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(a => a.TriggerTime >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.TriggerTime <= endDate.Value);

            var alerts = await query.ToListAsync();

            return new AlertStatisticsDTO
            {
                Total = alerts.Count,
                Pending = alerts.Count(a => a.Status == AlertStatus.Pending),
                Processing = alerts.Count(a => a.Status == AlertStatus.Processing),
                Confirmed = alerts.Count(a => a.Status == AlertStatus.Confirmed),
                Archived = alerts.Count(a => a.Status == AlertStatus.Archived),
                FalsePositive = alerts.Count(a => a.Status == AlertStatus.FalsePositive),
                Critical = alerts.Count(a => a.Level == AlertLevel.Critical),
                Warning = alerts.Count(a => a.Level == AlertLevel.Warning),
                Info = alerts.Count(a => a.Level == AlertLevel.Info),
                AvgResponseTime = CalculateAvgResponseTime(alerts),
                ResolutionRate = CalculateResolutionRate(alerts)
            };
        }

        /// <summary>
        /// 添加审计日志
        /// </summary>
        public async Task AddAuditLogAsync(AlertAuditLogEntity log)
        {
            log.CreatedTime = DateTime.UtcNow;
            _context.AlertAuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// 获取审计日志
        /// </summary>
        public async Task<List<AlertAuditLogEntity>> GetAuditLogsAsync(int alertId)
        {
            return await _context.AlertAuditLogs
                .Where(l => l.AlertId == alertId)
                .OrderByDescending(l => l.CreatedTime)
                .ToListAsync();
        }

        /// <summary>
        /// 获取流量指标数据
        /// </summary>
        public async Task<List<NetworkMetricEntity>> GetMetricsByNodeAsync(int nodeId, DateTime startDate, DateTime endDate)
        {
            return await _context.NetworkMetrics
                .Where(m => m.NodeId == nodeId && 
                           m.Timestamp >= startDate && 
                           m.Timestamp <= endDate)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        /// <summary>
        /// 计算平均响应时间
        /// </summary>
        private string CalculateAvgResponseTime(List<AlertEventEntity> alerts)
        {
            var processedAlerts = alerts.Where(a => a.ConfirmedTime.HasValue).ToList();
            if (processedAlerts.Count == 0) return "0分钟";

            var avgMinutes = processedAlerts
                .Average(a => (a.ConfirmedTime.Value - a.TriggerTime).TotalMinutes);

            return $"{avgMinutes:F0}分钟";
        }

        /// <summary>
        /// 计算解决率
        /// </summary>
        private string CalculateResolutionRate(List<AlertEventEntity> alerts)
        {
            if (alerts.Count == 0) return "0%";

            var resolvedCount = alerts.Count(a => 
                a.Status == AlertStatus.Confirmed || 
                a.Status == AlertStatus.Archived);

            var rate = (double)resolvedCount / alerts.Count * 100;
            return $"{rate:F0}%";
        }
    }

    #region DTOs

    public class AlertFilter
    {
        public AlertStatus? Status { get; set; }
        public AlertLevel? Level { get; set; }
        public int? NodeId { get; set; }
        public string Keyword { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class AlertStatisticsDTO
    {
        public int Total { get; set; }
        public int Pending { get; set; }
        public int Processing { get; set; }
        public int Confirmed { get; set; }
        public int Archived { get; set; }
        public int FalsePositive { get; set; }
        public int Critical { get; set; }
        public int Warning { get; set; }
        public int Info { get; set; }
        public string AvgResponseTime { get; set; }
        public string ResolutionRate { get; set; }
    }

    #endregion
}
