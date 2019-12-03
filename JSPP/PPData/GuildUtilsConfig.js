//  Created by qupit in 2019/11/22.

JSPP.ppinclude([
  ':/PPLayer/PPResManager.js'
], function (__filepath__) {
  "use strict"

  let UtilsInfo = {
    // 头像通用圆形蒙版
    HeadNodeCircleClip: 'guild_common_bg_12.png',
    // 通用牌友群头像
    HeadImg: 'guild_common_bg_4.png',
    // 输入框通用底图
    EditBoxBg: ' blank.png',
    // 管理员提升合伙人
    GuildPromote: false,
    // 合伙人使用群导入
    GuildImport: false,
    // 成员邀请玩家
    Guildinvite: false,
    // 合伙人邀请玩家
    GuildparnterInvite: false,
    // 合伙人和管理员邀请玩家后的归属 0：待分配 1：直接分配邀请人
    Guildaffiliation: 0,
  }

  let __public__ = {
    static: {
      getInstance: function () {
        if (!this.instance) {
          this.instance = JSPP.ppnew('GuildUtilsConfig')
          // 通用资源 持有1个计数
          JSPP.ppstatic('PPResManager').getInstance().addResUse('res/guildRes/club/common/common')
        }
        return this.instance
      },
      _static: function () {
        if (this.instance) {
          this.instance.pprelease()
          this.instance = null
        }
      }
    },
    GuildUtilsConfig: function () {
      this.defaultSeting = UtilsInfo
    },
    _GuildUtilsConfig: function () { },
    //获取事件发射器用于注册
    getDispatcher: function (key) {
      return this.Evters[key]
    },

    getUtilsConfig: function (type) {
      if (this.projectSeting[type] !== undefined) {
        return this.projectSeting[type]
      }
      // 如果没有特殊设置 返回默认值
      return this.defaultSeting[type]
    },

    setUtilsConfig: function (type, value) {
      this.projectSeting[type] = value
    },

    clearUtilsConfig: function (type) {
      delete this.projectSeting[type]
    }

  }

  let __protected__ = {}

  let __private__ = {
    static: {
      instance: null
    },
    // 通用牌友群默认设置
    defaultSeting: null,
    // 项目自定义设置
    projectSeting: {}
  }

  JSPP.ppclass('GuildUtilsConfig', __public__, __protected__, __private__)

})