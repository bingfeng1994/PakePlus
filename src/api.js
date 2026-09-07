// api.js - Axios + 所有模拟接口
var api = {
  // 模拟数据缓存
  _data: null,
  
  // 初始化数据
  init: function(data) {
    this._data = data;
  },
  
  // 模拟延迟
  delay: function(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  },
  
  // 获取节点列表
  getNodes: function() {
    var self = this;
    return this.delay(300).then(function() {
      return {
        code: 200,
        data: self._data.nodes,
        message: 'success'
      };
    });
  },
  
  // 获取单个节点详情
  getNodeById: function(nodeId) {
    var self = this;
    return this.delay(200).then(function() {
      var node = self._data.nodes.find(function(n) { return n.id === nodeId; });
      return {
        code: 200,
        data: node,
        message: 'success'
      };
    });
  },
  
  // 新增节点
  addNode: function(nodeData) {
    var self = this;
    return this.delay(400).then(function() {
      var newNode = Object.assign({}, nodeData, {
        id: self._data.nodes.length + 1,
        status: 'online',
        probeStatus: 'normal'
      });
      self._data.nodes.push(newNode);
      return {
        code: 200,
        data: newNode,
        message: '节点添加成功'
      };
    });
  },
  
  // 更新节点
  updateNode: function(nodeId, nodeData) {
    var self = this;
    return this.delay(400).then(function() {
      var index = self._data.nodes.findIndex(function(n) { return n.id === nodeId; });
      if (index > -1) {
        self._data.nodes[index] = Object.assign({}, self._data.nodes[index], nodeData);
        return {
          code: 200,
          data: self._data.nodes[index],
          message: '节点更新成功'
        };
      }
      return { code: 404, data: null, message: '节点不存在' };
    });
  },
  
  // 删除节点
  deleteNode: function(nodeId) {
    var self = this;
    return this.delay(300).then(function() {
      var index = self._data.nodes.findIndex(function(n) { return n.id === nodeId; });
      if (index > -1) {
        self._data.nodes.splice(index, 1);
        return { code: 200, data: null, message: '节点删除成功' };
      }
      return { code: 404, data: null, message: '节点不存在' };
    });
  },
  
  // 获取实时流量数据
  getTrafficData: function() {
    var self = this;
    return this.delay(200).then(function() {
      return {
        code: 200,
        data: self._data.trafficData,
        message: 'success'
      };
    });
  },
  
  // 获取实时指标
  getRealtimeMetrics: function() {
    var self = this;
    return this.delay(100).then(function() {
      return {
        code: 200,
        data: self._data.realtimeMetrics,
        message: 'success'
      };
    });
  },
  
  // 获取历史数据
  getHistoryData: function(period) {
    var self = this;
    return this.delay(300).then(function() {
      var data = self._data.historyData[period] || self._data.historyData.daily;
      return {
        code: 200,
        data: {
          period: period,
          trend: data,
          p95Value: self._data.historyData.p95Value,
          totalTraffic: self._data.historyData.totalTraffic,
          peakBandwidth: self._data.historyData.peakBandwidth,
          avgBandwidthUsage: self._data.historyData.avgBandwidthUsage
        },
        message: 'success'
      };
    });
  },
  
  // 获取告警列表
  getAlerts: function(filters) {
    var self = this;
    return this.delay(300).then(function() {
      var alerts = self._data.alerts;
      
      // 应用过滤
      if (filters) {
        if (filters.status) {
          alerts = alerts.filter(function(a) { return a.status === filters.status; });
        }
        if (filters.level) {
          alerts = alerts.filter(function(a) { return a.level === filters.level; });
        }
        if (filters.keyword) {
          var keyword = filters.keyword.toLowerCase();
          alerts = alerts.filter(function(a) {
            return a.nodeName.toLowerCase().indexOf(keyword) > -1 ||
                   a.message.toLowerCase().indexOf(keyword) > -1;
          });
        }
      }
      
      return {
        code: 200,
        data: alerts,
        message: 'success'
      };
    });
  },
  
  // 获取告警统计
  getAlertStats: function() {
    var self = this;
    return this.delay(200).then(function() {
      return {
        code: 200,
        data: self._data.alertStats,
        message: 'success'
      };
    });
  },
  
  // 更新告警状态
  updateAlertStatus: function(alertId, status, assignee) {
    var self = this;
    return this.delay(400).then(function() {
      var alert = self._data.alerts.find(function(a) { return a.id === alertId; });
      if (alert) {
        alert.status = status;
        if (assignee) alert.assignee = assignee;
        return {
          code: 200,
          data: alert,
          message: '告警状态更新成功'
        };
      }
      return { code: 404, data: null, message: '告警不存在' };
    });
  },
  
  // 获取系统配置
  getSystemConfig: function() {
    var self = this;
    return this.delay(300).then(function() {
      return {
        code: 200,
        data: self._data.systemConfig,
        message: 'success'
      };
    });
  },
  
  // 更新系统配置
  updateSystemConfig: function(config) {
    var self = this;
    return this.delay(500).then(function() {
      self._data.systemConfig = Object.assign({}, self._data.systemConfig, config);
      return {
        code: 200,
        data: self._data.systemConfig,
        message: '配置更新成功'
      };
    });
  },
  
  // 获取拓扑数据
  getTopologyData: function() {
    var self = this;
    return this.delay(200).then(function() {
      return {
        code: 200,
        data: {
          nodes: self._data.nodes,
          links: self._data.topologyLinks
        },
        message: 'success'
      };
    });
  },
  
  // 导出报表
  exportReport: function(type, period) {
    var self = this;
    return this.delay(800).then(function() {
      return {
        code: 200,
        data: {
          downloadUrl: '#',
          fileName: type + '_report_' + period + '_' + new Date().getTime() + '.xlsx'
        },
        message: '报表导出成功'
      };
    });
  },
  
  // 测试通知渠道
  testNotification: function(channelId) {
    var self = this;
    return this.delay(600).then(function() {
      return {
        code: 200,
        data: null,
        message: '测试通知已发送'
      };
    });
  },
  
  // 获取用户列表
  getUsers: function() {
    var self = this;
    return this.delay(200).then(function() {
      return {
        code: 200,
        data: self._data.systemConfig.users,
        message: 'success'
      };
    });
  }
};
