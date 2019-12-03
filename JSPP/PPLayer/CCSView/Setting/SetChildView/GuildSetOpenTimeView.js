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

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetOpenTimeView', 'GuildSetOpenTimeView', 'res/guildRes/GuildSetOpenTimeLayer.csb', {

    ActiveBtn: { path: 'opentime_panel/Panel_btn/openstate', function: 'setOpenState' },
    TimeEdit: { path: 'opentime_panel/Panel_time/timeEdit', function: 'selectTime' },

    startTimeHour: { path: 'opentime_panel/Panel_time/startTime/hour' },
    startTimeMinute: { path: 'opentime_panel/Panel_time/startTime/minute' },
    endTimeHour: { path: 'opentime_panel/Panel_time/endTime/hour' },
    endTimeMinute: { path: 'opentime_panel/Panel_time/endTime/minute' },

    btnsave: { path: 'opentime_panel/btnsave', function: 'saveBtn' },
  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)

        let GuildInfo = GuildDataManager.getGuildInfoByID(this.guildId)
        if (GuildInfo.shield !== undefined) {
          this.shieldSwitch = Boolean(GuildInfo.shield === 1)
        } else {
          this.shieldSwitch = false
        }

        this.startTime = GuildInfo.shieldStart ? GuildInfo.shieldStart : 0
        this.endTime = GuildInfo.shieldEnd ? GuildInfo.shieldEnd : 0

        this.beDataChanged = false
        this.updateView()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetOpenTimeView: function (ccpath, cfg) {

      this.doBindingWithcfgKey('ActiveBtn')
      this.doBindingWithcfgKey('TimeEdit')
      this.doBindingWithcfgKey('btnsave')

      this.guildId = GuildDataManager.getCurGuildID()
    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'setOpenState':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              this.beDataChanged = true
              if (type === ccui.CheckBox.EVENT_SELECTED) {
                this.shieldSwitch = true
              } else if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                this.shieldSwitch = false
              }
              this.updateView()
            }, this))
            break
          case 'selectTime':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.createSelectTimeUI()
              }
            }, this))
            break
          case 'saveBtn':
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
      PrefixInteger: function (num, n) {
        return (Array(n).join(0) + num).slice(-n)
      },
      updateView: function () {
        this.getNodeBycfgKey('ActiveBtn').setSelected(this.shieldSwitch)

        this.getNodeBycfgKey('startTimeHour').setString(this.PrefixInteger(Math.floor(this.startTime / 60), 2))
        this.getNodeBycfgKey('startTimeMinute').setString(this.PrefixInteger(Math.floor(this.startTime % 60), 2))
        this.getNodeBycfgKey('endTimeHour').setString(this.PrefixInteger(Math.floor(this.endTime / 60), 2))
        this.getNodeBycfgKey('endTimeMinute').setString(this.PrefixInteger(Math.floor(this.endTime % 60), 2))
      },

      createSelectTimeUI: function () {
      },

      saveFunc: function () {
        if (!this.beDataChanged) {
          utils.showFloatMsg('未检测到更改!')
          return
        }
        this.beDataChanged = false

        let stopTip = (this.shieldSwitch ? '开启此功能后，本群只能在营业时间段内创建新的房间' : '关闭此功能后，本群可以随时创建新的房间')
        utils.alertMsg(stopTip, JSPP.ppfunction(function () {
          let cfgPara = {
            shield: (this.shieldSwitch ? 1 : 0),
            shieldStart: this.startTime,
            shieldEnd: this.endtime
          }
          GuildServerApi.setGuildConfig(this.guildId, cfgPara, JSPP.ppfunction(function (rtn) {
            if (rtn.result === 0) {
              GuildDataManager.setGuildShieldCreate(this.guildId, (this.shieldSwitch ? 1 : 0), this.startTime, this.endtime)
              this.updateView()
              utils.showMsg('修改成功')
            }
          }, this))
        }, this), function () { })
      }
    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,

    shieldSwitch: false,

    startTime: 0,

    endTime: 0,

    beDataChanged: false,
  }

  JSPP.ppclass('GuildSetOpenTimeView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
