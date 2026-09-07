using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MediatR;
using System.Threading.Tasks;
using System.Collections.Generic;
using TrafficMonitoring.Domain.Entities;
using TrafficMonitoring.Application.Commands;
using TrafficMonitoring.Application.Queries;
using TrafficMonitoring.Infrastructure.SignalR;

namespace TrafficMonitoring.API.Controllers
{
    /// <summary>
    /// 流量实时采集控制器
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class TrafficMetricsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IHubContext<MetricHub> _hubContext;

        public TrafficMetricsController(
            IMediator mediator,
            IHubContext<MetricHub> hubContext)
        {
            _mediator = mediator;
            _hubContext = hubContext;
        }

        /// <summary>
        /// 接收实时流量数据
        /// </summary>
        [HttpPost("collect")]
        public async Task<IActionResult> CollectMetric([FromBody] CollectMetricCommand command)
        {
            var result = await _mediator.Send(command);
            
            // 通过 SignalR 推送实时数据
            await _hubContext.Clients.All.SendAsync("ReceiveMetric", result);
            
            return Ok(result);
        }

        /// <summary>
        /// 批量采集流量数据
        /// </summary>
        [HttpPost("collect/batch")]
        public async Task<IActionResult> CollectBatchMetrics([FromBody] List<CollectMetricCommand> commands)
        {
            var results = new List<NetworkMetricEntity>();
            foreach (var command in commands)
            {
                var result = await _mediator.Send(command);
                results.Add(result);
                await _hubContext.Clients.All.SendAsync("ReceiveMetric", result);
            }
            
            return Ok(results);
        }

        /// <summary>
        /// 查询历史流量趋势
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetHistoryMetrics([FromQuery] GetHistoryMetricsQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// 获取实时流量数据
        /// </summary>
        [HttpGet("realtime")]
        public async Task<IActionResult> GetRealtimeMetrics()
        {
            var query = new GetRealtimeMetricsQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// 获取 95 计费统计数据
        /// </summary>
        [HttpGet("p95")]
        public async Task<IActionResult> GetP95Statistics([FromQuery] P95StatisticsQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// 获取节点流量统计
        /// </summary>
        [HttpGet("node/{nodeId}/statistics")]
        public async Task<IActionResult> GetNodeStatistics(int nodeId, [FromQuery] NodeStatisticsQuery query)
        {
            query.NodeId = nodeId;
            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }
}
