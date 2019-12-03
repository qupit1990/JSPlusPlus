//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../../PPLayerFactory.js',
  '../../../CCSViewBase.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildUtils = include('Guild/Utils/GuildUtil')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetDismissGuildView', 'GuildSetDismissGuildView', 'res/guildRes/GuildSetDismissGuildLayer.csb', {

    delroom: { path: 'delroom_panel/delroom' },
    delname: { path: 'delroom_panel/delroom/name' },
    inputbg: { path: 'delroom_panel/delroom/inputbg' },
    btn_dismiss_guild: { path: 'delroom_panel/delroom/btn_dismiss_guild', function: 'dismissGuild' },

  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)

        let info = GuildDataManager.getGuildInfoByID(this.guildId)
        this.getNodeBycfgKey('delname').setString(unescape(info.name))

        this.input_node.setString('')
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetDismissGuildView: function (ccpath, cfg) {
      this.doBindingWithcfgKey('btn_dismiss_guild')

      let exitBoxEX = JSPP.ppnew('EditBoxEx', this.getNodeBycfgKey('inputbg'))
      exitBoxEX.setMaxLength(2)
      exitBoxEX.setEmptyWord('')
      exitBoxEX.setFontColor(cc.color(0X54, 0X6b, 0X9f))
      this.input_node = exitBoxEX

      this.guildId = GuildDataManager.getCurGuildID()
    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'dismissGuild':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.dismissFunc()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      dismissFunc: function () {
        let inputstr = this.input_node.getString()
        if (inputstr !== '解散') {
          utils.showMsg('请输入解散两个字！')
          return
        }
        // 解散牌友群
        utils.alertMsg('您确定要解散这个群吗？\n此操作不可逆，请慎重！', JSPP.ppfunction(function () {
          GuildServerApi.DeleteGuild(this.guildId, function (rtn) {
            if (rtn.result === 0) {
              appInstance.eventManager().dispatchEvent('delGuildSuccess')
            }
          })
        }, this), function () { })
      }
    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,

    input_node: null,
  }

  JSPP.ppclass('GuildSetDismissGuildView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
