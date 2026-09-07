using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using TrafficMonitoring.Domain.Entities;
using TrafficMonitoring.Domain.Interfaces;

namespace TrafficMonitoring.Application.Services
{
    /// <summary>
    /// 系统配置服务 - 全局配置中心
    /// </summary>
    public class SystemConfigurationService
    {
        private readonly ISystemConfigRepository _configRepository;
        private readonly INotificationChannelRepository _channelRepository;

        public SystemConfigurationService(
            ISystemConfigRepository configRepository,
            INotificationChannelRepository channelRepository)
        {
            _configRepository = configRepository;
            _channelRepository = channelRepository;
        }

        /// <summary>
        /// 获取告警配置
        /// </summary>
        public async Task<AlertConfig> GetAlertConfigAsync()
        {
            return await _configRepository.GetAlertConfigAsync();
        }

        /// <summary>
        /// 更新告警配置
        /// </summary>
        public async Task UpdateAlertConfigAsync(AlertConfig config)
        {
            await _configRepository.UpdateAlertConfigAsync(config);
        }

        /// <summary>
        /// 获取采集配置
        /// </summary>
        public async Task<CollectionConfig> GetCollectionConfigAsync()
        {
            return await _configRepository.GetCollectionConfigAsync();
        }

        /// <summary>
        /// 更新采集配置
        /// </summary>
        public async Task UpdateCollectionConfigAsync(CollectionConfig config)
        {
            await _configRepository.UpdateCollectionConfigAsync(config);
        }

        /// <summary>
        /// 获取通知渠道列表
        /// </summary>
        public async Task<List<NotificationChannelEntity>> GetNotificationChannelsAsync()
        {
            return await _channelRepository.GetListAsync();
        }

        /// <summary>
        /// 创建通知渠道
        /// </summary>
        public async Task<NotificationChannelEntity> CreateNotificationChannelAsync(CreateNotificationChannelDTO dto)
        {
            var channel = new NotificationChannelEntity
            {
                Name = dto.Name,
                Type = dto.Type,
                Config = dto.Config,
                Enabled = dto.Enabled,
                CreatedTime = DateTime.UtcNow
            };

            await _channelRepository.AddAsync(channel);
            return channel;
        }

        /// <summary>
        /// 更新通知渠道
        /// </summary>
        public async Task UpdateNotificationChannelAsync(int channelId, UpdateNotificationChannelDTO dto)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
                throw new InvalidOperationException($"通知渠道 {channelId} 不存在");

            channel.Name = dto.Name;
            channel.Type = dto.Type;
            channel.Config = dto.Config;
            channel.Enabled = dto.Enabled;
            channel.UpdatedTime = DateTime.UtcNow;

            await _channelRepository.UpdateAsync(channel);
        }

        /// <summary>
        /// 删除通知渠道
        /// </summary>
        public async Task DeleteNotificationChannelAsync(int channelId)
        {
            await _channelRepository.DeleteAsync(channelId);
        }

        /// <summary>
        /// 测试通知渠道
        /// </summary>
        public async Task<bool> TestNotificationChannelAsync(int channelId)
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
                throw new InvalidOperationException($"通知渠道 {channelId} 不存在");

            // 这里应该调用具体的通知服务进行测试
            // 实际实现中应该根据渠道类型调用相应的通知 API
            return true;
        }

        /// <summary>
        /// 获取告警收敛配置
        /// </summary>
        public async Task<AlertConvergenceConfig> GetAlertConvergenceConfigAsync()
        {
            return await _configRepository.GetAlertConvergenceConfigAsync();
        }

        /// <summary>
        /// 更新告警收敛配置
        /// </summary>
        public async Task UpdateAlertConvergenceConfigAsync(AlertConvergenceConfig config)
        {
            await _configRepository.UpdateAlertConvergenceConfigAsync(config);
        }

        /// <summary>
        /// 获取用户列表
        /// </summary>
        public async Task<List<UserEntity>> GetUsersAsync()
        {
            return await _configRepository.GetUsersAsync();
        }

        /// <summary>
        /// 创建用户
        /// </summary>
        public async Task<UserEntity> CreateUserAsync(CreateUserDTO dto)
        {
            var user = new UserEntity
            {
                Name = dto.Name,
                Role = dto.Role,
                Email = dto.Email,
                Phone = dto.Phone,
                CreatedTime = DateTime.UtcNow
            };

            await _configRepository.AddUserAsync(user);
            return user;
        }

        /// <summary>
        /// 更新用户
        /// </summary>
        public async Task UpdateUserAsync(int userId, UpdateUserDTO dto)
        {
            var user = await _configRepository.GetUserByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException($"用户 {userId} 不存在");

            user.Name = dto.Name;
            user.Role = dto.Role;
            user.Email = dto.Email;
            user.Phone = dto.Phone;
            user.UpdatedTime = DateTime.UtcNow;

            await _configRepository.UpdateUserAsync(user);
        }

        /// <summary>
        /// 删除用户
        /// </summary>
        public async Task DeleteUserAsync(int userId)
        {
            await _configRepository.DeleteUserAsync(userId);
        }
    }

    #region DTOs

    public class CreateNotificationChannelDTO
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Config { get; set; }
        public bool Enabled { get; set; }
    }

    public class UpdateNotificationChannelDTO
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Config { get; set; }
        public bool Enabled { get; set; }
    }

    public class CreateUserDTO
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class UpdateUserDTO
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    #endregion
}
