// views.js - 所有业务页面组件

// 流量实时监控页面
Vue.component('traffic-monitor', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">流量实时监控</h2>
        <p class="page-subtitle">实时采集并可视化展示各服务器节点的上下行带宽等核心网络指标</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">📊</div>
          <div class="stat-content">
            <div class="stat-label">总节点数</div>
            <div class="stat-value">{{ store.realtimeMetrics.totalNodes }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">✓</div>
          <div class="stat-content">
            <div class="stat-label">在线节点</div>
            <div class="stat-value">{{ store.realtimeMetrics.onlineNodes }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon danger">✗</div>
          <div class="stat-content">
            <div class="stat-label">离线节点</div>
            <div class="stat-value">{{ store.realtimeMetrics.offlineNodes }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">⚠</div>
          <div class="stat-content">
            <div class="stat-label">告警数量</div>
            <div class="stat-value">{{ store.realtimeMetrics.alertCount }}</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">网络拓扑图</span>
          <button class="btn btn-default btn-sm" @click="refreshTopology">刷新</button>
        </div>
        <div class="card-body">
          <div id="topologyChart" class="topology-container"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">实时流量趋势</span>
          <div>
            <button class="btn btn-default btn-sm" @click="refreshTraffic">刷新数据</button>
          </div>
        </div>
        <div class="card-body">
          <div id="trafficChart" class="chart-container"></div>
        </div>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      store: store,
      topologyChart: null,
      trafficChart: null,
      timer: null
    };
  },
  
  mounted: function() {
    this.initCharts();
    this.loadData();
    this.startRealtime();
  },
  
  methods: {
    initCharts: function() {
      this.topologyChart = echarts.init(document.getElementById('topologyChart'));
      this.trafficChart = echarts.init(document.getElementById('trafficChart'));
    },
    
    loadData: function() {
      this.loadTopology();
      this.loadTrafficData();
    },
    
    loadTopology: function() {
      var self = this;
      api.getTopologyData().then(function(res) {
        if (res.code === 200) {
          self.renderTopology(res.data);
        }
      });
    },
    
    loadTrafficData: function() {
      var self = this;
      api.getTrafficData().then(function(res) {
        if (res.code === 200) {
          self.renderTrafficChart(res.data);
        }
      });
    },
    
    renderTopology: function(data) {
      var nodes = data.nodes.map(function(node) {
        return {
          name: node.name,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 50,
          symbolSize: 50,
          category: node.status === 'online' ? 0 : 1,
          itemStyle: {
            color: node.status === 'online' ? '#67c23a' : '#f56c6c'
          },
          label: {
            show: true,
            position: 'bottom'
          }
        };
      });
      
      var links = data.links.map(function(link) {
        var sourceNode = data.nodes.find(function(n) { return n.id === link.source; });
        var targetNode = data.nodes.find(function(n) { return n.id === link.target; });
        return {
          source: sourceNode ? sourceNode.name : '',
          target: targetNode ? targetNode.name : '',
          lineStyle: {
            color: link.status === 'normal' ? '#4778C7' : '#f56c6c',
            width: 2
          }
        };
      });
      
      var option = {
        tooltip: {
          backgroundColor: 'rgba(10, 15, 30, 0.92)',
          borderColor: 'rgba(71, 120, 199, 0.6)',
          textStyle: { color: '#dce8ff' }
        },
        series: [{
          type: 'graph',
          layout: 'none',
          roam: true,
          label: {
            color: '#c3d2ee',
            position: 'right',
            formatter: '{b}'
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          data: nodes,
          links: links,
          lineStyle: {
            opacity: 0.9,
            curveness: 0
          }
        }]
      };
      
      this.topologyChart.setOption(option);
    },
    
    renderTrafficChart: function(data) {
      this.trafficCache = data;
      var option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(10, 15, 30, 0.92)',
          borderColor: 'rgba(71, 120, 199, 0.6)',
          textStyle: { color: '#dce8ff' }
        },
        legend: {
          data: ['上行带宽', '下行带宽'],
          textStyle: { color: '#9db4dd' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.timeLabels,
          axisLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.5)' } },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' }
        },
        yAxis: {
          type: 'value',
          name: 'Mbps',
          nameTextStyle: { color: '#7f95bd' },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' },
          splitLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.15)' } }
        },
        series: [
          {
            name: '上行带宽',
            type: 'line',
            data: data.upload,
            smooth: true,
            symbol: 'none',
            itemStyle: { color: '#4778C7' },
            lineStyle: { width: 2, shadowColor: 'rgba(71,120,199,0.5)', shadowBlur: 8 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(71, 120, 199, 0.35)' },
                  { offset: 1, color: 'rgba(71, 120, 199, 0)' }
                ]
              }
            }
          },
          {
            name: '下行带宽',
            type: 'line',
            data: data.download,
            smooth: true,
            symbol: 'none',
            itemStyle: { color: '#00d4ff' },
            lineStyle: { width: 2, shadowColor: 'rgba(0,212,255,0.5)', shadowBlur: 8 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 212, 255, 0.25)' },
                  { offset: 1, color: 'rgba(0, 212, 255, 0)' }
                ]
              }
            }
          }
        ]
      };
      
      this.trafficChart.setOption(option);
    },
    
    // 模拟实时数据推送（SignalR 效果）
    startRealtime: function() {
      var self = this;
      this.timer = setInterval(function() {
        var c = self.trafficCache;
        if (!c || !self.trafficChart) return;
        c.timeLabels.push(('0' + new Date().getHours()).slice(-2) + ':' + ('0' + new Date().getMinutes()).slice(-2));
        c.timeLabels.shift();
        c.upload.push(Math.max(40, Math.round(c.upload[c.upload.length - 1] + (Math.random() - 0.5) * 120)));
        c.upload.shift();
        c.download.push(Math.max(60, Math.round(c.download[c.download.length - 1] + (Math.random() - 0.5) * 160)));
        c.download.shift();
        self.trafficChart.setOption({
          xAxis: { data: c.timeLabels },
          series: [
            { name: '上行带宽', data: c.upload },
            { name: '下行带宽', data: c.download }
          ]
        });
      }, 3000);
    },
    
    refreshTopology: function() {
      this.loadTopology();
    },
    
    refreshTraffic: function() {
      this.loadTrafficData();
    }
  },
  
  beforeDestroy: function() {
    if (this.timer) clearInterval(this.timer);
    if (this.topologyChart) {
      this.topologyChart.dispose();
    }
    if (this.trafficChart) {
      this.trafficChart.dispose();
    }
  }
});

// 历史数据分析页面
Vue.component('history-analysis', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">历史数据分析</h2>
        <p class="page-subtitle">基于实时监控沉淀的海量流量数据，提供多维度的历史趋势回溯与深度统计</p>
      </div>
      
      <div class="toolbar">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">时间范围</label>
          <select class="form-select" v-model="selectedPeriod" @change="loadHistoryData" style="width: 150px;">
            <option value="daily">按日</option>
            <option value="weekly">按周</option>
            <option value="monthly">按月</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="exportReport">导出报表</button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">📈</div>
          <div class="stat-content">
            <div class="stat-label">总流量</div>
            <div class="stat-value">{{ historyData.totalTraffic }} GB</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">⚡</div>
          <div class="stat-content">
            <div class="stat-label">最高峰值</div>
            <div class="stat-value">{{ historyData.peakBandwidth }} Mbps</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">📊</div>
          <div class="stat-content">
            <div class="stat-label">95计费峰值</div>
            <div class="stat-value">{{ historyData.p95Value }} Mbps</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">📉</div>
          <div class="stat-content">
            <div class="stat-label">平均带宽利用率</div>
            <div class="stat-value">{{ historyData.avgBandwidthUsage }}%</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">带宽利用率趋势</span>
        </div>
        <div class="card-body">
          <div id="historyTrendChart" class="chart-container"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">峰值流量统计</span>
        </div>
        <div class="card-body">
          <div id="peakValueChart" class="chart-container"></div>
        </div>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      selectedPeriod: 'daily',
      historyData: {
        totalTraffic: 0,
        peakBandwidth: 0,
        p95Value: 0,
        avgBandwidthUsage: 0
      },
      trendData: {
        labels: [],
        bandwidthUsage: [],
        peakValues: []
      },
      trendChart: null,
      peakChart: null
    };
  },
  
  mounted: function() {
    this.initCharts();
    this.loadHistoryData();
  },
  
  methods: {
    initCharts: function() {
      this.trendChart = echarts.init(document.getElementById('historyTrendChart'));
      this.peakChart = echarts.init(document.getElementById('peakValueChart'));
    },
    
    loadHistoryData: function() {
      var self = this;
      api.getHistoryData(this.selectedPeriod).then(function(res) {
        if (res.code === 200) {
          self.historyData = {
            totalTraffic: res.data.totalTraffic,
            peakBandwidth: res.data.peakBandwidth,
            p95Value: res.data.p95Value,
            avgBandwidthUsage: res.data.avgBandwidthUsage
          };
          self.trendData = res.data.trend;
          self.renderCharts();
        }
      });
    },
    
    renderCharts: function() {
      // 带宽利用率趋势图
      var trendOption = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(10, 15, 30, 0.92)',
          borderColor: 'rgba(71, 120, 199, 0.6)',
          textStyle: { color: '#dce8ff' }
        },
        legend: {
          data: ['带宽利用率', '平均利用率'],
          textStyle: { color: '#9db4dd' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.trendData.labels,
          axisLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.5)' } },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' }
        },
        yAxis: {
          type: 'value',
          name: '%',
          nameTextStyle: { color: '#7f95bd' },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' },
          splitLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.15)' } }
        },
        series: [
          {
            name: '带宽利用率',
            type: 'line',
            data: this.trendData.bandwidthUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#4778C7' },
            lineStyle: { width: 2, shadowColor: 'rgba(71,120,199,0.5)', shadowBlur: 8 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(71, 120, 199, 0.35)' },
                  { offset: 1, color: 'rgba(71, 120, 199, 0)' }
                ]
              }
            }
          },
          {
            name: '平均利用率',
            type: 'line',
            data: this.trendData.avgUsage,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#00d4ff' },
            lineStyle: { width: 2, type: 'dashed' }
          }
        ]
      };
      this.trendChart.setOption(trendOption);
      
      // 峰值流量统计图
      var peakOption = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(10, 15, 30, 0.92)',
          borderColor: 'rgba(71, 120, 199, 0.6)',
          textStyle: { color: '#dce8ff' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.trendData.labels,
          axisLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.5)' } },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' }
        },
        yAxis: {
          type: 'value',
          name: 'Mbps',
          nameTextStyle: { color: '#7f95bd' },
          axisLabel: { color: '#7f95bd', fontFamily: 'Consolas' },
          splitLine: { lineStyle: { color: 'rgba(71, 120, 199, 0.15)' } }
        },
        series: [
          {
            name: '峰值流量',
            type: 'bar',
            barWidth: '45%',
            data: this.trendData.peakValues,
            itemStyle: {
              borderRadius: [3, 3, 0, 0],
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#4778C7' },
                  { offset: 1, color: 'rgba(0, 212, 255, 0.35)' }
                ]
              }
            },
            emphasis: {
              itemStyle: { shadowBlur: 14, shadowColor: 'rgba(71, 120, 199, 0.7)' }
            }
          }
        ]
      };
      this.peakChart.setOption(peakOption);
    },
    
    exportReport: function() {
      var self = this;
      api.exportReport('history', this.selectedPeriod).then(function(res) {
        if (res.code === 200) {
          alert('报表导出成功：' + res.data.fileName);
        }
      });
    }
  },
  
  beforeDestroy: function() {
    if (this.trendChart) {
      this.trendChart.dispose();
    }
    if (this.peakChart) {
      this.peakChart.dispose();
    }
  }
});

// 异常峰值告警页面
Vue.component('alert-management', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">异常峰值告警</h2>
        <p class="page-subtitle">实时接收流量监控数据并与预设阈值进行比对，检测异常峰值并触发多级告警</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon danger">🚨</div>
          <div class="stat-content">
            <div class="stat-label">待处理告警</div>
            <div class="stat-value">{{ store.alertStats.pending }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">⚠</div>
          <div class="stat-content">
            <div class="stat-label">处理中告警</div>
            <div class="stat-value">{{ store.alertStats.processing }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">✓</div>
          <div class="stat-content">
            <div class="stat-label">已确认告警</div>
            <div class="stat-value">{{ store.alertStats.confirmed }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">📊</div>
          <div class="stat-content">
            <div class="stat-label">平均响应时间</div>
            <div class="stat-value">{{ store.alertStats.avgResponseTime }}</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">告警列表</span>
          <div style="display: flex; gap: 10px;">
            <select class="form-select" v-model="filterStatus" @change="loadAlerts" style="width: 120px;">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="confirmed">已确认</option>
              <option value="archived">已归档</option>
              <option value="false_positive">误报</option>
            </select>
            <select class="form-select" v-model="filterLevel" @change="loadAlerts" style="width: 120px;">
              <option value="">全部级别</option>
              <option value="critical">严重</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>告警ID</th>
                  <th>节点名称</th>
                  <th>告警级别</th>
                  <th>告警类型</th>
                  <th>告警信息</th>
                  <th>触发时间</th>
                  <th>状态</th>
                  <th>处理人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alert in filteredAlerts" :key="alert.id">
                  <td>{{ alert.id }}</td>
                  <td>{{ alert.nodeName }}</td>
                  <td>
                    <span :class="'alert-' + alert.level">
                      {{ getLevelText(alert.level) }}
                    </span>
                  </td>
                  <td>{{ alert.type }}</td>
                  <td>{{ alert.message }}</td>
                  <td>{{ alert.triggerTime }}</td>
                  <td>
                    <span :class="'tag-' + getStatusClass(alert.status)">
                      {{ getStatusText(alert.status) }}
                    </span>
                  </td>
                  <td>{{ alert.assignee || '-' }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewAlert(alert)">查看</button>
                    <button class="btn btn-sm btn-success" v-if="alert.status === 'pending'" @click="processAlert(alert)">处理</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 告警详情弹窗 -->
      <div class="modal-overlay" v-if="showDetailModal" @click.self="closeDetailModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">告警详情</span>
            <button class="modal-close" @click="closeDetailModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">告警ID</label>
              <div>{{ currentAlert.id }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">节点名称</label>
              <div>{{ currentAlert.nodeName }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警级别</label>
              <div :class="'alert-' + currentAlert.level">{{ getLevelText(currentAlert.level) }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警类型</label>
              <div>{{ currentAlert.type }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警信息</label>
              <div>{{ currentAlert.message }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">触发时间</label>
              <div>{{ currentAlert.triggerTime }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <div>{{ getStatusText(currentAlert.status) }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">处理人</label>
              <div>{{ currentAlert.assignee || '-' }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeDetailModal">关闭</button>
          </div>
        </div>
      </div>
      
      <!-- 处理告警弹窗 -->
      <div class="modal-overlay" v-if="showProcessModal" @click.self="closeProcessModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">处理告警</span>
            <button class="modal-close" @click="closeProcessModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">指派处理人</label>
              <select class="form-select" v-model="processForm.assignee">
                <option value="">请选择</option>
                <option v-for="user in users" :key="user.id" :value="user.name">{{ user.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">处理备注</label>
              <textarea class="form-textarea" v-model="processForm.remark" placeholder="请输入处理备注"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeProcessModal">取消</button>
            <button class="btn btn-primary" @click="submitProcess">提交</button>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      store: store,
      filterStatus: '',
      filterLevel: '',
      filteredAlerts: [],
      showDetailModal: false,
      showProcessModal: false,
      currentAlert: {},
      processForm: {
        assignee: '',
        remark: ''
      },
      users: []
    };
  },
  
  mounted: function() {
    this.loadAlerts();
    this.loadUsers();
  },
  
  methods: {
    loadAlerts: function() {
      var self = this;
      var filters = {};
      if (this.filterStatus) filters.status = this.filterStatus;
      if (this.filterLevel) filters.level = this.filterLevel;
      
      api.getAlerts(filters).then(function(res) {
        if (res.code === 200) {
          self.filteredAlerts = res.data;
        }
      });
    },
    
    loadUsers: function() {
      var self = this;
      api.getUsers().then(function(res) {
        if (res.code === 200) {
          self.users = res.data;
        }
      });
    },
    
    getLevelText: function(level) {
      var map = {
        'critical': '严重',
        'warning': '警告',
        'info': '信息'
      };
      return map[level] || level;
    },
    
    getStatusText: function(status) {
      var map = {
        'pending': '待处理',
        'processing': '处理中',
        'confirmed': '已确认',
        'archived': '已归档',
        'false_positive': '误报'
      };
      return map[status] || status;
    },
    
    getStatusClass: function(status) {
      var map = {
        'pending': 'danger',
        'processing': 'warning',
        'confirmed': 'success',
        'archived': 'info',
        'false_positive': 'info'
      };
      return map[status] || 'info';
    },
    
    viewAlert: function(alert) {
      this.currentAlert = alert;
      this.showDetailModal = true;
    },
    
    closeDetailModal: function() {
      this.showDetailModal = false;
    },
    
    processAlert: function(alert) {
      this.currentAlert = alert;
      this.processForm = { assignee: '', remark: '' };
      this.showProcessModal = true;
    },
    
    closeProcessModal: function() {
      this.showProcessModal = false;
    },
    
    submitProcess: function() {
      var self = this;
      if (!this.processForm.assignee) {
        alert('请选择处理人');
        return;
      }
      
      api.updateAlertStatus(this.currentAlert.id, 'processing', this.processForm.assignee).then(function(res) {
        if (res.code === 200) {
          alert('告警处理成功');
          self.closeProcessModal();
          self.loadAlerts();
        }
      });
    }
  }
});

// 节点设备管理页面
Vue.component('node-management', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">节点设备管理</h2>
        <p class="page-subtitle">统一管理所有被采集的服务器、交换机等网络节点资产</p>
      </div>
      
      <div class="toolbar">
        <div class="search-box">
          <input type="text" v-model="searchKeyword" placeholder="搜索节点名称或IP" @input="filterNodes">
        </div>
        <select class="form-select" v-model="filterGroup" @change="filterNodes" style="width: 150px;">
          <option value="">全部分组</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
        <select class="form-select" v-model="filterStatus" @change="filterNodes" style="width: 150px;">
          <option value="">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
        </select>
        <button class="btn btn-primary" @click="showAddModal">新增节点</button>
      </div>
      
      <div class="card">
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>节点ID</th>
                  <th>节点名称</th>
                  <th>类型</th>
                  <th>IP地址</th>
                  <th>分组</th>
                  <th>标签</th>
                  <th>状态</th>
                  <th>探针状态</th>
                  <th>位置</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="node in filteredNodes" :key="node.id">
                  <td>{{ node.id }}</td>
                  <td>{{ node.name }}</td>
                  <td>{{ node.type }}</td>
                  <td>{{ node.ip }}</td>
                  <td>{{ node.group }}</td>
                  <td>
                    <span class="tag tag-primary" v-for="tag in node.tags" :key="tag">{{ tag }}</span>
                  </td>
                  <td>
                    <span :class="'status-' + node.status"></span>
                    {{ node.status === 'online' ? '在线' : '离线' }}
                  </td>
                  <td>
                    <span :class="'tag-' + getProbeStatusClass(node.probeStatus)">
                      {{ getProbeStatusText(node.probeStatus) }}
                    </span>
                  </td>
                  <td>{{ node.location }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewNode(node)">查看</button>
                    <button class="btn btn-sm btn-default" @click="editNode(node)">编辑</button>
                    <button class="btn btn-sm btn-danger" @click="deleteNode(node)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 新增/编辑节点弹窗 -->
      <div class="modal-overlay" v-if="showFormModal" @click.self="closeFormModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">{{ isEdit ? '编辑节点' : '新增节点' }}</span>
            <button class="modal-close" @click="closeFormModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">节点名称 *</label>
              <input type="text" class="form-input" v-model="nodeForm.name" placeholder="请输入节点名称">
            </div>
            <div class="form-group">
              <label class="form-label">节点类型 *</label>
              <select class="form-select" v-model="nodeForm.type">
                <option value="">请选择</option>
                <option value="服务器">服务器</option>
                <option value="交换机">交换机</option>
                <option value="防火墙">防火墙</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">IP地址 *</label>
              <input type="text" class="form-input" v-model="nodeForm.ip" placeholder="请输入IP地址">
            </div>
            <div class="form-group">
              <label class="form-label">分组</label>
              <input type="text" class="form-input" v-model="nodeForm.group" placeholder="请输入分组名称">
            </div>
            <div class="form-group">
              <label class="form-label">标签（逗号分隔）</label>
              <input type="text" class="form-input" v-model="nodeForm.tagsStr" placeholder="例如：生产,核心">
            </div>
            <div class="form-group">
              <label class="form-label">带宽（Mbps）</label>
              <input type="number" class="form-input" v-model="nodeForm.bandwidth" placeholder="请输入带宽">
            </div>
            <div class="form-group">
              <label class="form-label">位置</label>
              <input type="text" class="form-input" v-model="nodeForm.location" placeholder="请输入位置">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeFormModal">取消</button>
            <button class="btn btn-primary" @click="submitNodeForm">{{ isEdit ? '保存' : '新增' }}</button>
          </div>
        </div>
      </div>
      
      <!-- 节点详情弹窗 -->
      <div class="modal-overlay" v-if="showDetailModal" @click.self="closeDetailModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">节点详情</span>
            <button class="modal-close" @click="closeDetailModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">节点ID</label>
              <div>{{ currentNode.id }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">节点名称</label>
              <div>{{ currentNode.name }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">类型</label>
              <div>{{ currentNode.type }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">IP地址</label>
              <div>{{ currentNode.ip }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">分组</label>
              <div>{{ currentNode.group }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">标签</label>
              <div>
                <span class="tag tag-primary" v-for="tag in currentNode.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <div>
                <span :class="'status-' + currentNode.status"></span>
                {{ currentNode.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">探针状态</label>
              <div>{{ getProbeStatusText(currentNode.probeStatus) }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">带宽</label>
              <div>{{ currentNode.bandwidth }} Mbps</div>
            </div>
            <div class="form-group">
              <label class="form-label">位置</label>
              <div>{{ currentNode.location }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeDetailModal">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      searchKeyword: '',
      filterGroup: '',
      filterStatus: '',
      filteredNodes: [],
      groups: [],
      showFormModal: false,
      showDetailModal: false,
      isEdit: false,
      currentNode: {},
      nodeForm: {
        id: null,
        name: '',
        type: '',
        ip: '',
        group: '',
        tagsStr: '',
        bandwidth: '',
        location: ''
      }
    };
  },
  
  mounted: function() {
    this.loadNodes();
  },
  
  methods: {
    loadNodes: function() {
      var self = this;
      api.getNodes().then(function(res) {
        if (res.code === 200) {
          store.setNodes(res.data);
          self.extractGroups();
          self.filterNodes();
        }
      });
    },
    
    extractGroups: function() {
      var groups = {};
      store.nodes.forEach(function(node) {
        if (node.group) {
          groups[node.group] = true;
        }
      });
      this.groups = Object.keys(groups);
    },
    
    filterNodes: function() {
      var self = this;
      var keyword = this.searchKeyword.toLowerCase();
      this.filteredNodes = store.nodes.filter(function(node) {
        var matchKeyword = !keyword || 
                          node.name.toLowerCase().indexOf(keyword) > -1 ||
                          node.ip.toLowerCase().indexOf(keyword) > -1;
        var matchGroup = !self.filterGroup || node.group === self.filterGroup;
        var matchStatus = !self.filterStatus || node.status === self.filterStatus;
        return matchKeyword && matchGroup && matchStatus;
      });
    },
    
    getProbeStatusText: function(status) {
      var map = {
        'normal': '正常',
        'warning': '警告',
        'error': '异常'
      };
      return map[status] || status;
    },
    
    getProbeStatusClass: function(status) {
      var map = {
        'normal': 'success',
        'warning': 'warning',
        'error': 'danger'
      };
      return map[status] || 'info';
    },
    
    showAddModal: function() {
      this.isEdit = false;
      this.nodeForm = {
        id: null,
        name: '',
        type: '',
        ip: '',
        group: '',
        tagsStr: '',
        bandwidth: '',
        location: ''
      };
      this.showFormModal = true;
    },
    
    editNode: function(node) {
      this.isEdit = true;
      this.nodeForm = {
        id: node.id,
        name: node.name,
        type: node.type,
        ip: node.ip,
        group: node.group,
        tagsStr: node.tags ? node.tags.join(',') : '',
        bandwidth: node.bandwidth,
        location: node.location
      };
      this.showFormModal = true;
    },
    
    closeFormModal: function() {
      this.showFormModal = false;
    },
    
    submitNodeForm: function() {
      var self = this;
      
      if (!this.nodeForm.name || !this.nodeForm.type || !this.nodeForm.ip) {
        alert('请填写必填字段');
        return;
      }
      
      var tags = this.nodeForm.tagsStr ? this.nodeForm.tagsStr.split(',').map(function(t) { return t.trim(); }) : [];
      
      var nodeData = {
        name: this.nodeForm.name,
        type: this.nodeForm.type,
        ip: this.nodeForm.ip,
        group: this.nodeForm.group,
        tags: tags,
        bandwidth: parseInt(this.nodeForm.bandwidth) || 0,
        location: this.nodeForm.location
      };
      
      if (this.isEdit) {
        api.updateNode(this.nodeForm.id, nodeData).then(function(res) {
          if (res.code === 200) {
            alert('节点更新成功');
            self.closeFormModal();
            self.loadNodes();
          }
        });
      } else {
        api.addNode(nodeData).then(function(res) {
          if (res.code === 200) {
            alert('节点添加成功');
            self.closeFormModal();
            self.loadNodes();
          }
        });
      }
    },
    
    viewNode: function(node) {
      this.currentNode = node;
      this.showDetailModal = true;
    },
    
    closeDetailModal: function() {
      this.showDetailModal = false;
    },
    
    deleteNode: function(node) {
      var self = this;
      if (confirm('确定要删除节点 "' + node.name + '" 吗？')) {
        api.deleteNode(node.id).then(function(res) {
          if (res.code === 200) {
            alert('节点删除成功');
            self.loadNodes();
          }
        });
      }
    }
  }
});

// 告警日志审计页面
Vue.component('alert-audit', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">告警日志审计</h2>
        <p class="page-subtitle">集中存储并管理所有异常峰值告警的历史记录，提供全生命周期的事件追踪</p>
      </div>
      
      <div class="toolbar">
        <div class="search-box">
          <input type="text" v-model="searchKeyword" placeholder="搜索告警信息" @input="filterAlerts">
        </div>
        <select class="form-select" v-model="filterStatus" @change="filterAlerts" style="width: 120px;">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="confirmed">已确认</option>
          <option value="archived">已归档</option>
          <option value="false_positive">误报</option>
        </select>
        <select class="form-select" v-model="filterLevel" @change="filterAlerts" style="width: 120px;">
          <option value="">全部级别</option>
          <option value="critical">严重</option>
          <option value="warning">警告</option>
          <option value="info">信息</option>
        </select>
        <button class="btn btn-primary" @click="exportAuditReport">导出审计报表</button>
      </div>
      
      <div class="card">
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>告警ID</th>
                  <th>节点名称</th>
                  <th>告警级别</th>
                  <th>告警类型</th>
                  <th>告警信息</th>
                  <th>触发时间</th>
                  <th>状态</th>
                  <th>处理人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alert in filteredAlerts" :key="alert.id">
                  <td>{{ alert.id }}</td>
                  <td>{{ alert.nodeName }}</td>
                  <td>
                    <span :class="'alert-' + alert.level">
                      {{ getLevelText(alert.level) }}
                    </span>
                  </td>
                  <td>{{ alert.type }}</td>
                  <td>{{ alert.message }}</td>
                  <td>{{ alert.triggerTime }}</td>
                  <td>
                    <span :class="'tag-' + getStatusClass(alert.status)">
                      {{ getStatusText(alert.status) }}
                    </span>
                  </td>
                  <td>{{ alert.assignee || '-' }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewAlert(alert)">查看</button>
                    <button class="btn btn-sm btn-warning" v-if="alert.status === 'pending'" @click="markFalsePositive(alert)">标记误</button>
                    <button class="btn btn-sm btn-success" v-if="alert.status !== 'archived'" @click="archiveAlert(alert)">归档</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 告警详情弹窗 -->
      <div class="modal-overlay" v-if="showDetailModal" @click.self="closeDetailModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">告警详情</span>
            <button class="modal-close" @click="closeDetailModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">告警ID</label>
              <div>{{ currentAlert.id }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">节点名称</label>
              <div>{{ currentAlert.nodeName }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警级别</label>
              <div :class="'alert-' + currentAlert.level">{{ getLevelText(currentAlert.level) }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警类型</label>
              <div>{{ currentAlert.type }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">告警信息</label>
              <div>{{ currentAlert.message }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">触发时间</label>
              <div>{{ currentAlert.triggerTime }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <div>{{ getStatusText(currentAlert.status) }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">处理人</label>
              <div>{{ currentAlert.assignee || '-' }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeDetailModal">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      searchKeyword: '',
      filterStatus: '',
      filterLevel: '',
      filteredAlerts: [],
      showDetailModal: false,
      currentAlert: {}
    };
  },
  
  mounted: function() {
    this.loadAlerts();
  },
  
  methods: {
    loadAlerts: function() {
      var self = this;
      var filters = {};
      if (this.filterStatus) filters.status = this.filterStatus;
      if (this.filterLevel) filters.level = this.filterLevel;
      
      api.getAlerts(filters).then(function(res) {
        if (res.code === 200) {
          self.filteredAlerts = res.data;
        }
      });
    },
    
    filterAlerts: function() {
      var self = this;
      var keyword = this.searchKeyword.toLowerCase();
      this.filteredAlerts = store.alerts.filter(function(alert) {
        var matchKeyword = !keyword || 
                          alert.nodeName.toLowerCase().indexOf(keyword) > -1 ||
                          alert.message.toLowerCase().indexOf(keyword) > -1;
        var matchStatus = !self.filterStatus || alert.status === self.filterStatus;
        var matchLevel = !self.filterLevel || alert.level === self.filterLevel;
        return matchKeyword && matchStatus && matchLevel;
      });
    },
    
    getLevelText: function(level) {
      var map = {
        'critical': '严重',
        'warning': '警告',
        'info': '信息'
      };
      return map[level] || level;
    },
    
    getStatusText: function(status) {
      var map = {
        'pending': '待处理',
        'processing': '处理中',
        'confirmed': '已确认',
        'archived': '已归档',
        'false_positive': '误报'
      };
      return map[status] || status;
    },
    
    getStatusClass: function(status) {
      var map = {
        'pending': 'danger',
        'processing': 'warning',
        'confirmed': 'success',
        'archived': 'info',
        'false_positive': 'info'
      };
      return map[status] || 'info';
    },
    
    viewAlert: function(alert) {
      this.currentAlert = alert;
      this.showDetailModal = true;
    },
    
    closeDetailModal: function() {
      this.showDetailModal = false;
    },
    
    markFalsePositive: function(alert) {
      var self = this;
      if (confirm('确定要将此告警标记为误报吗？')) {
        api.updateAlertStatus(alert.id, 'false_positive', '').then(function(res) {
          if (res.code === 200) {
            alert('已标记为误报');
            self.loadAlerts();
          }
        });
      }
    },
    
    archiveAlert: function(alert) {
      var self = this;
      if (confirm('确定要归档此告警吗？')) {
        api.updateAlertStatus(alert.id, 'archived', '').then(function(res) {
          if (res.code === 200) {
            alert('告警已归档');
            self.loadAlerts();
          }
        });
      }
    },
    
    exportAuditReport: function() {
      var self = this;
      api.exportReport('audit', 'all').then(function(res) {
        if (res.code === 200) {
          alert('审计报表导出成功：' + res.data.fileName);
        }
      });
    }
  }
});

// 系统与策略设置页面
Vue.component('system-settings', {
  template: `
    <div>
      <div class="page-header">
        <h2 class="page-title">系统与策略设置</h2>
        <p class="page-subtitle">全局控制中枢，负责配置系统运行参数、用户权限及通知渠道</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">采集配置</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">采集频率（秒）</label>
            <input type="number" class="form-input" v-model="config.collectionInterval" style="width: 200px;">
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">告警阈值设置</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">静态阈值 - 上行带宽（%）</label>
            <input type="number" class="form-input" v-model="config.alertThresholds.static.upload" style="width: 200px;">
          </div>
          <div class="form-group">
            <label class="form-label">静态阈值 - 下行带宽（%）</label>
            <input type="number" class="form-input" v-model="config.alertThresholds.static.download" style="width: 200px;">
          </div>
          <div class="form-group">
            <label class="form-label">静态阈值 - 95计费峰值（%）</label>
            <input type="number" class="form-input" v-model="config.alertThresholds.static.p95" style="width: 200px;">
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="config.alertThresholds.dynamic.enabled">
              启用AI动态基线
            </label>
          </div>
          <div v-if="config.alertThresholds.dynamic.enabled">
            <div class="form-group">
              <label class="form-label">基线周期</label>
              <select class="form-select" v-model="config.alertThresholds.dynamic.baseline" style="width: 200px;">
                <option value="7d">7天</option>
                <option value="14d">14天</option>
                <option value="30d">30天</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">倍数系数</label>
              <input type="number" step="0.1" class="form-input" v-model="config.alertThresholds.dynamic.multiplier" style="width: 200px;">
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">告警收敛策略</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="config.alertConvergence.enabled">
              启用告警收敛
            </label>
          </div>
          <div v-if="config.alertConvergence.enabled">
            <div class="form-group">
              <label class="form-label">收敛窗口（秒）</label>
              <input type="number" class="form-input" v-model="config.alertConvergence.windowSeconds" style="width: 200px;">
            </div>
            <div class="form-group">
              <label class="form-label">最大告警数</label>
              <input type="number" class="form-input" v-model="config.alertConvergence.maxAlerts" style="width: 200px;">
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" v-model="config.alertConvergence.deduplication">
                启用去重
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">通知渠道配置</span>
        </div>
        <div class="card-body">
          <div v-for="channel in config.notificationChannels" :key="channel.id" style="margin-bottom: 16px; padding: 12px 14px; border: 1px solid rgba(71,120,199,0.3); border-radius: 6px; background: rgba(9,15,30,0.6);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong>{{ channel.name }}</strong>
              <label>
                <input type="checkbox" v-model="channel.enabled">
                启用
              </label>
            </div>
            <div v-if="channel.enabled" style="margin-top: 8px;">
              <button class="btn btn-sm btn-default" @click="testNotification(channel)">测试通知</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <span class="card-title">用户管理</span>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>用户ID</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>邮箱</th>
                  <th>电话</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in config.users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ getRoleText(user.role) }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.phone }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button class="btn btn-primary" @click="saveConfig">保存配置</button>
      </div>
    </div>
  `,
  
  data: function() {
    return {
      config: {
        collectionInterval: 60,
        alertThresholds: {
          static: { upload: 80, download: 90, p95: 95 },
          dynamic: { enabled: true, baseline: '7d', multiplier: 1.5, aiModel: 'lstm' }
        },
        notificationChannels: [],
        alertConvergence: {
          enabled: true,
          windowSeconds: 300,
          maxAlerts: 5,
          deduplication: true
        },
        users: []
      }
    };
  },
  
  mounted: function() {
    this.loadConfig();
  },
  
  methods: {
    loadConfig: function() {
      var self = this;
      api.getSystemConfig().then(function(res) {
        if (res.code === 200) {
          self.config = res.data;
        }
      });
    },
    
    getRoleText: function(role) {
      var map = {
        'admin': '管理员',
        'operator': '运维人员',
        'viewer': '查看者'
      };
      return map[role] || role;
    },
    
    testNotification: function(channel) {
      var self = this;
      api.testNotification(channel.id).then(function(res) {
        if (res.code === 200) {
          alert('测试通知已发送到 ' + channel.name);
        }
      });
    },
    
    saveConfig: function() {
      var self = this;
      api.updateSystemConfig(this.config).then(function(res) {
        if (res.code === 200) {
          alert('配置保存成功');
        }
      });
    }
  }
});
