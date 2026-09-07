// store.js - 全局响应式状态管理（替代 Pinia/Vuex）
var store = new Vue({
  data: {
    // 当前视图
    currentView: 'traffic-monitor',
    
    // 用户信息
    currentUser: {
      name: '管理员',
      role: 'admin',
      avatar: '管'
    },
    
    // 节点数据
    nodes: [],
    
    // 实时流量数据
    trafficData: {
      timeLabels: [],
      upload: [],
      download: []
    },
    
    // 实时指标
    realtimeMetrics: {
      totalNodes: 0,
      onlineNodes: 0,
      offlineNodes: 0,
      totalBandwidth: 0,
      currentUpload: 0,
      currentDownload: 0,
      alertCount: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0
    },
    
    // 历史数据
    historyData: {
      daily: { labels: [], bandwidthUsage: [], peakValues: [], avgUsage: [] },
      weekly: { labels: [], bandwidthUsage: [], peakValues: [], avgUsage: [] },
      monthly: { labels: [], bandwidthUsage: [], peakValues: [], avgUsage: [] },
      p95Value: 0,
      totalTraffic: 0,
      peakBandwidth: 0,
      avgBandwidthUsage: 0
    },
    
    // 告警数据
    alerts: [],
    alertStats: {
      total: 0,
      pending: 0,
      processing: 0,
      confirmed: 0,
      archived: 0,
      falsePositive: 0,
      critical: 0,
      warning: 0,
      info: 0,
      avgResponseTime: '',
      resolutionRate: ''
    },
    
    // 系统配置
    systemConfig: {
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
    },
    
    // 拓扑链接
    topologyLinks: [],
    
    // UI状态
    loading: false,
    sidebarCollapsed: false
  },
  
  computed: {
    // 未处理告警数
    pendingAlertCount: function() {
      return this.alerts.filter(function(a) { return a.status === 'pending'; }).length;
    },
    
    // 在线节点数
    onlineNodeCount: function() {
      return this.nodes.filter(function(n) { return n.status === 'online'; }).length;
    },
    
    // 离线节点数
    offlineNodeCount: function() {
      return this.nodes.filter(function(n) { return n.status === 'offline'; }).length;
    }
  },
  
  methods: {
    // 设置当前视图
    setCurrentView: function(view) {
      this.currentView = view;
    },
    
    // 更新节点数据
    setNodes: function(nodes) {
      this.nodes = nodes;
    },
    
    // 更新流量数据
    setTrafficData: function(data) {
      this.trafficData = data;
    },
    
    // 更新实时指标
    setRealtimeMetrics: function(metrics) {
      this.realtimeMetrics = metrics;
    },
    
    // 更新历史数据
    setHistoryData: function(data) {
      this.historyData = data;
    },
    
    // 更新告警数据
    setAlerts: function(alerts) {
      this.alerts = alerts;
    },
    
    // 更新告警统计
    setAlertStats: function(stats) {
      this.alertStats = stats;
    },
    
    // 更新系统配置
    setSystemConfig: function(config) {
      this.systemConfig = config;
    },
    
    // 更新拓扑链接
    setTopologyLinks: function(links) {
      this.topologyLinks = links;
    },
    
    // 设置加载状态
    setLoading: function(loading) {
      this.loading = loading;
    },
    
    // 更新单个告警状态
    updateAlertStatus: function(alertId, status, assignee) {
      var alert = this.alerts.find(function(a) { return a.id === alertId; });
      if (alert) {
        alert.status = status;
        if (assignee) alert.assignee = assignee;
      }
    },
    
    // 添加新告警
    addAlert: function(alert) {
      this.alerts.unshift(alert);
      this.alertStats.total++;
    },
    
    // 更新节点状态
    updateNodeStatus: function(nodeId, status) {
      var node = this.nodes.find(function(n) { return n.id === nodeId; });
      if (node) {
        node.status = status;
      }
    }
  }
});
