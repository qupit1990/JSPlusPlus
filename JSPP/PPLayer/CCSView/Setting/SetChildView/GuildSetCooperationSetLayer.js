//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  ':/PPComponent/CacheHeadNode.js',
  ':/PPComponent/EditBoxEx.js',
  ':/PPData/GuildUtilsConfig.js',
  '../../../CCSViewBase.js',
  '../../../PPLayerFactory.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildUtils = include('Guild/Utils/GuildUtil')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetCooperationSetLayer', 'GuildSetCooperationSetLayer', 'res/guildRes/GuildSetCooperationSetLayer.csb', {
    promoteBtn: { path: 'character_panel/promotePanel/promoteBtn', function: 'changeConfig' },
    importBtn: { path: 'character_panel/importPanel/importBtn', function: 'changeConfig' },
    inviteBtn: { path: 'character_panel/invitePanel/inviteBtn', function: 'changeConfig' },
    parnterInviteBtn: { path: 'character_panel/parnterInvitePanel/parnterInviteBtn', function: 'changeConfig' },
    awaitBtn: { path: 'character_panel/affiliationPanel/awaitBtn', function: 'checkaffiliationbox' },
    affiliationBtn: { path: 'character_panel/affiliationPanel/affiliationBtn', function: 'checkaffiliationbox' },

    btnsave: { path: 'character_panel/btnsave', function: 'btnsave' },
  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)

        let GuildInfo = GuildDataManager.getGuildInfoByID(this.guildId)
        if (GuildInfo.cooperSwitch) {
          this.promoteNum = Boolean(GuildInfo.cooperSwitch.managerOperateCooper === 1)
          this.importNum = Boolean(GuildInfo.cooperSwitch.partnerCopyGuild === 1)
          this.inviteNum = Boolean(GuildInfo.cooperSwitch.memberCanInvite === 1)
          this.parnterInviteNum = Boolean(GuildInfo.cooperSwitch.partnerCanInvite === 1)
          this.affiliationNum = GuildInfo.cooperSwitch.rookieRelation
        } else {
          let GuildDefaultInfo = JSPP.ppstatic('GuildUtilsConfig').getInstance()
          this.promoteNum = GuildDefaultInfo.getUtilsConfig("GuildPromote")
          this.importNum = GuildDefaultInfo.getUtilsConfig("GuildImport")
          this.inviteNum = GuildDefaultInfo.getUtilsConfig("Guildinvite")
          this.parnterInviteNum = GuildDefaultInfo.getUtilsConfig("GuildparnterInvite")
          this.affiliationNum = GuildDefaultInfo.getUtilsConfig("Guildaffiliation")
        }

        this.beDataChanged = false
        this.updateView()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetCooperationSetLayer: function (ccpath, cfg) {

      this.doBindingWithcfgKey('promoteBtn', null, 'promoteNum')
      this.doBindingWithcfgKey('importBtn', null, 'importNum')
      this.doBindingWithcfgKey('inviteBtn', null, 'inviteNum')
      this.doBindingWithcfgKey('parnterInviteBtn', null, 'parnterInviteNum')
      this.doBindingWithcfgKey('awaitBtn', null, 0)
      this.doBindingWithcfgKey('affiliationBtn', null, 1)

      this.doBindingWithcfgKey('btnsave')

      this.guildId = GuildDataManager.getCurGuildID()
    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'changeConfig':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              this.beDataChanged = true
              if (type === ccui.CheckBox.EVENT_SELECTED) {
                this[data] = true
              } else if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                this[data] = false
              }
              this.updateView();
            }, this))
            break
          case 'checkaffiliationbox':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                //保持不变
                btn.setSelected(true)
                return
              }
              this.beDataChanged = true
              this.chooseaffiliation(data)
            }, this))
            break
          case 'btnsave':
            cc.log('aaaaaaa')
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.saveFunc()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },

      updateView: function () {
        this.getNodeBycfgKey('promoteBtn').setSelected(this.promoteNum)
        this.getNodeBycfgKey('importBtn').setSelected(this.importNum)
        this.getNodeBycfgKey('inviteBtn').setSelected(this.inviteNum)
        this.getNodeBycfgKey('parnterInviteBtn').setSelected(this.parnterInviteNum)
        this.getNodeBycfgKey('awaitBtn').setSelected(this.affiliationNum === 0)
        this.getNodeBycfgKey('affiliationBtn').setSelected(this.affiliationNum === 1)
      },

      chooseaffiliation: function (idx) {
        this.affiliationNum = idx
        this.updateView();
      },

      saveFunc: function () {
        if (!this.beDataChanged) {
          utils.showFloatMsg('未检测到更改!')
          return
        }
        this.beDataChanged = false

        let para = {
          promote: (this.promoteNum ? 1 : 0),
          import: (this.importNum ? 1 : 0),
          invite: (this.inviteNum ? 1 : 0),
          parnterInvite: (this.parnterInviteNum ? 1 : 0),
          affiliation: this.affiliationNum
        }
        GuildServerApi.SetGuildCooperSwitch(this.guildId, para, JSPP.ppfunction(function (rtn) {
          if (rtn.result === 0) {
            utils.showFloatMsg('保存设置成功!')
            GuildServerApi.GetOneGuildInfo(this.guildId, function () { })
          }
        }, this))
      }

    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,

    // 界面设置信息
    promoteNum: false, // 管理员提升合伙人
    importNum: false, // 合伙人使用群导入
    inviteNum: false, // 科员邀请玩家
    parnterInviteNum: false, // 合伙人邀请玩家
    affiliationNum: 0, // 合伙人和管理员邀请玩家后的归属

    beDataChanged: false,
  }

  JSPP.ppclass('GuildSetCooperationSetLayer', 'GuildSetViewBase', __public__, __protected__, __private__)

})
