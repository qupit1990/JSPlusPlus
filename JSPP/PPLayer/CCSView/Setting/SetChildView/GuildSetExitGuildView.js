//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../../PPLayerFactory.js',
  '../../../CCSViewBase.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetExitGuildView', 'GuildSetExitGuildView', 'res/guildRes/GuildSetExitGuildLayer.csb', {

    exitname: { path: 'delroom_panel/exitroom/name' },
    btn_exit_guild: { path: 'delroom_panel/exitroom/btn_exit_guild', function: 'exitGuild' }

  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)

        let info = GuildDataManager.getGuildInfoByID(this.guildId)
        this.getNodeBycfgKey('exitname').setString(unescape(info.name))
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetExitGuildView: function (ccpath, cfg) {
      this.doBindingWithcfgKey('btn_exit_guild')

      this.guildId = GuildDataManager.getCurGuildID()
    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'exitGuild':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.exitFunc()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      exitFunc: function () {
        // 退出牌友群
        let guildinfo = { guildId: this.guildId }
        utils.alertMsg('是否确定退出本群？', JSPP.ppfunction(function () {
          GuildServerApi.QuitGuildGroup(this.guildId, JSPP.ppfunction(function (rtn) {
            if (rtn.result === 0) {
              appInstance.eventManager().dispatchEvent('quitGuildSuccess', guildinfo)
            }
          }, this))
        }, this), function () { })
      }
    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,
  }

  JSPP.ppclass('GuildSetExitGuildView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
