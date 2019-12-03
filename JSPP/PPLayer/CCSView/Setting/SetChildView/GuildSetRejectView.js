//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  ':/PPComponent/ScrollViewEx.js',
  '../../../PPLayerFactory.js',
  '../../../CCSViewBase.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildUtils = include('Guild/Utils/GuildUtil')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetRejectView', 'GuildSetRejectView', 'res/guildRes/GuildSetRejectLayer.csb', {
    scrollview: { path: 'repel_panel/ScrollView' },
    scrollitem: { path: 'repel_panel/ScrollView/item' },
    btnadd: { path: 'repel_panel/btnadd', function: 'addReject' },

    item_UserOneicon: { path: 'pairOne/icon' },
    item_UserTwoicon: { path: 'pairTwo/icon' },
    item_UserOneName: { path: 'pairOne/name' },
    item_UserTwoName: { path: 'pairTwo/name' },
    item_UserOneId: { path: 'pairOne/id' },
    item_UserTwoId: { path: 'pairTwo/id' },
    item_cancleBtn: { path: 'btn_unbind', function: 'cancleReject' },
  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)
        this.scrollviewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))
        this.reqRejectInfo()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetRejectView: function (ccpath, cfg) {
      this.doBindingWithcfgKey('btnadd')

      this.scrollviewEx = JSPP.ppnew('ScrollViewEx', this.getNodeBycfgKey('scrollview'), this.getNodeBycfgKey('scrollitem'), JSPP.ppfunction(function (item, baseitem) {
        item.HeadCachedCtrl1 = JSPP.ppnew('CacheHeadNode', this.getNodeBycfgKey('item_UserOneicon', item))
        item.HeadCachedCtrl1.getRootNode().setScale(0.96)
        this.getNodeBycfgKey('item_UserOneName', item).ignoreContentAdaptWithSize(true)
        this.getNodeBycfgKey('item_UserOneId', item).ignoreContentAdaptWithSize(true)

        item.HeadCachedCtrl2 = JSPP.ppnew('CacheHeadNode', this.getNodeBycfgKey('item_UserTwoicon', item))
        item.HeadCachedCtrl2.getRootNode().setScale(0.96)
        this.getNodeBycfgKey('item_UserTwoName', item).ignoreContentAdaptWithSize(true)
        this.getNodeBycfgKey('item_UserTwoId', item).ignoreContentAdaptWithSize(true)
      }, this), undefined, 0)

      this.guildId = GuildDataManager.getCurGuildID()
    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'cancleReject':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                utils.alertMsg('确定要将这两个玩家解除排斥么？', JSPP.ppfunction(function () {
                  GuildServerApi.ManageGuildExclusion(this.guildId, data.uid1, data.uid2, 2, JSPP.ppfunction(function () {
                    utils.showMsg('解除成功，一分钟之后生效')
                    this.reqRejectInfo()
                  }, this))
                }, this), function () { })
              }
            }, this))
            break
          case 'addReject':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.AddFunc()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },

      updateItem: function (index, item, info) {
        item.HeadCachedCtrl1.setHeadInfo(info.uid1, info.headimgurl1)
        var str = unescape(info.nickname1)
        if (str.length > 6) {
          str = str.substring(0, 6) + '...'
        }
        this.getNodeBycfgKey('item_UserOneName', item).setString(str)
        this.getNodeBycfgKey('item_UserOneId', item).setString(info.uid1)


        item.HeadCachedCtrl2.setHeadInfo(info.uid2, info.headimgurl2)
        var str2 = unescape(info.nickname2)
        if (str2.length > 6) {
          str2 = str2.substring(0, 6) + '...'
        }
        this.getNodeBycfgKey('item_UserTwoName', item).setString(str2)
        this.getNodeBycfgKey('item_UserTwoId', item).setString(info.uid2)

        this.doBindingWithcfgKey('item_cancleBtn', item, info)
      },

      AddFunc: function () {
        let GuildAddRejectClass = include('Guild/UI/Setting/GuildAddReject')
        let GuildInfo = GuildDataManager.getGuildInfoByID(this.guildId)
        let GuildAddReject = appInstance.uiManager().createPopUI(GuildAddRejectClass, GuildInfo, null, JSPP.ppfunction(function () {
          this.reqRejectInfo()
        }, this))
        this.BackgroundView.rootnode.addChild(GuildAddReject)
      },

      reqRejectInfo: function () {
        GuildServerApi.GetGuildExclusion(this.guildId, JSPP.ppfunction(function (rtn) {
          if (rtn.info) {
            let curRejectPairsData = rtn.info
            curRejectPairsData.sort(function (pairA, pairB) {
              var timeA = pairA.ctime
              var timeB = pairB.ctime
              return timeB - timeA
            })

            this.scrollviewEx.setDataList(curRejectPairsData)
          }
        }, this))
      },
    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,

    scrollviewEx: null,
  }

  JSPP.ppclass('GuildSetRejectView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
