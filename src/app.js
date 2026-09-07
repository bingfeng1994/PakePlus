// app.js - Vue 实例、导航切换，所有 JavaScript 必须位于 script.js

// 加载 data.json 数据
function loadDataFromJson() {
  return fetch('data.json')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      // 初始化 API 模块
      api.init(data);

      // 初始化 store
      store.setNodes(data.nodes);
      store.setTrafficData(data.trafficData);
      store.setRealtimeMetrics(data.realtimeMetrics);
      store.setHistoryData(data.historyData);
      store.setAlerts(data.alerts);
      store.setAlertStats(data.alertStats);
      store.setSystemConfig(data.systemConfig);
      store.setTopologyLinks(data.topologyLinks);

      return data;
    });
}

// 菜单配置
var menuConfig = [
  { id: 'traffic-monitor', name: '流量实时监控', icon: '📡' },
  { id: 'history-analysis', name: '历史数据分析', icon: '📈' },
  { id: 'alert-management', name: '异常峰值告警', icon: '🛰' },
  { id: 'node-management', name: '节点设备管理', icon: '🖧' },
  { id: 'alert-audit', name: '告警日志审计', icon: '🗂' },
  { id: 'system-settings', name: '系统与策略设置', icon: '⚙' }
];

// 时间格式化
function formatClock(d) {
  function p(n) { return n < 10 ? '0' + n : '' + n; }
  var weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) +
    ' ' + weeks[d.getDay()];
}

// Vue 根实例
var app = new Vue({
  el: '#app',

  data: {
    store: store,
    menuConfig: menuConfig,
    showLogoutModal: false,
    sidebarCollapsed: false,
    clock: '',
    clockTimer: null
  },

  computed: {
    currentPageTitle: function() {
      var current = this.menuConfig.find(function(item) {
        return item.id === store.currentView;
      });
      return current ? current.name : '';
    }
  },

  mounted: function() {
    // 加载数据
    var self = this;
    loadDataFromJson().then(function() {
      console.log('数据加载完成');
    }).catch(function(error) {
      console.error('数据加载失败:', error);
    });

    // 状态栏实时时钟
    this.updateClock();
    this.clockTimer = setInterval(function() {
      self.updateClock();
    }, 1000);
  },

  beforeDestroy: function() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  },

  methods: {
    // 更新时钟
    updateClock: function() {
      this.clock = formatClock(new Date());
    },

    // 切换视图
    switchView: function(viewId) {
      store.setCurrentView(viewId);
    },

    // 折叠/展开侧边栏（窗口最小化按钮）
    minimizeWindow: function() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    // 全屏切换（窗口最大化按钮）
    maximizeWindow: function() {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    },

    // 显示退出登录弹窗
    showLogout: function() {
      this.showLogoutModal = true;
    },

    // 关闭退出登录弹窗
    closeLogout: function() {
      this.showLogoutModal = false;
    },

    // 确认退出登录
    confirmLogout: function() {
      alert('已退出登录');
      this.closeLogout();
      // 实际项目中这里应该跳转到登录页
    }
  }
});
