//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../../PPLayerFactory.js',
  '../../../CCSViewBase.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')
  let GuildConfig = include('Guild/Config/GuildConfig')
  let GuildUtils = include('Guild/Utils/GuildUtil')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetDarkRoomView', 'GuildSetDarkRoomView', 'res/guildRes/GuildSetDarkroomLayer.csb', {
    scrollview: { path: 'darkroom_panel/darklist' },
    scrollitem: { path: 'darkroom_panel/darklist/item' },
    btnadd: { path: 'darkroom_panel/btnadd', function: 'addPeople' },

    blockOne: { path: 'blockOne' },
    blockTwo: { path: 'blockTwo' },
    item_UserOneicon: { path: 'blockOne/icon' },
    item_UserTwoicon: { path: 'blockTwo/icon' },
    item_UserOneName: { path: 'blockOne/name' },
    item_UserTwoName: { path: 'blockTwo/name' },
    item_UserOneId: { path: 'blockOne/id' },
    item_UserTwoId: { path: 'blockTwo/id' },
    item_cancleOneBtn: { path: 'blockOne/btn_unblock', function: 'unblock' },
    item_cancleTwoBtn: { path: 'blockTwo/btn_unblock', function: 'unblock' },
  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)

        this.scrollviewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))
        this.getDarkroomInfo()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetDarkRoomView: function (ccpath, cfg) {
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
          case 'addPeople':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.addDarkroomPlayer()
              }
            }, this))
            break
          case 'unblock':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.unblockMember(userdata)
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      // 小黑屋页面
      getDarkroomInfo: function () {
        GuildServerApi.GetGuildBlockList(this.guildId, JSPP.ppfunction(function (rtn) {
          if (rtn.info) {
            let curBlockMembersData = rtn.info
            curBlockMembersData.sort(function (memberA, memberB) {
              var timeA = memberA.ctime
              var timeB = memberB.ctime
              return timeB - timeA
            })
            let datalist = []
            for (var i = 0; i < curBlockMembersData.length;) {
              if (curBlockMembersData.length - i >= 2) {
                datalist.push([curBlockMembersData[i], curBlockMembersData[i + 1]])
              } else if (curBlockMembersData.length - i == 1) {
                datalist.push([curBlockMembersData[i], null])
              }
              i += 2
            }
            this.scrollviewEx.setDataList(datalist)
          }
        }, this))
      },
      updateItem: function (index, item, data) {
        let infoOne = data[0]
        let infoTwo = data[1]

        let blockOne = this.getNodeBycfgKey('blockOne', item)
        blockOne.setVisible(infoOne)
        if (blockOne.isVisible()) {
          item.HeadCachedCtrl1.setHeadInfo(infoOne.uid, infoOne.headimgurl)
          let nameStr = GuildUtils.getOmittedString(unescape(infoOne.nickname), 14, true)
          this.getNodeBycfgKey('item_UserOneName', item).setString(nameStr)
          this.getNodeBycfgKey('item_UserOneId', item).setString(infoOne.uid)

          this.doBindingWithcfgKey('item_cancleOneBtn', item, infoOne.uid)
        }
        let blockTwo = this.getNodeBycfgKey('blockTwo', item)
        blockTwo.setVisible(infoTwo)
        if (blockTwo.isVisible()) {
          item.HeadCachedCtrl2.setHeadInfo(infoTwo.uid, infoTwo.headimgurl)
          let nameStr = GuildUtils.getOmittedString(unescape(infoTwo.nickname), 14, true)
          this.getNodeBycfgKey('item_UserTwoName', item).setString(nameStr)
          this.getNodeBycfgKey('item_UserTwoId', item).setString(infoTwo.uid)

          this.doBindingWithcfgKey('item_cancleTwoBtn', item, infoTwo.uid)
        }
      },
      unblockMember: function (uid) {
        utils.alertMsg('确定要将此玩家解禁吗？\n解禁后玩家能够进入本群房间', JSPP.ppfunction(function () {
          GuildServerApi.SetGuildBlock(this.guildId, uid, 2, JSPP.ppfunction(function (rtn) {
            if (rtn.result === 0) {
              utils.showMsg('解禁成功!', 1)
              this.getDarkroomInfo()
            }
          }, this))
        }, this), function () { })
      },
      addDarkroomPlayer: function () {
        let layerType = GuildConfig.layerType.darkroom
        GuildServerApi.getGuildUserList(this.guildId, 1, null, 0, GuildUtils.GuildMaxPlayerNum(), null, JSPP.ppfunction(function (rtn) {
          if (rtn.result === 0) {
            let memberData = rtn.info
            let info = GuildDataManager.getGuildInfoByID(this.guildId)
            let GuildSelectPlayerClass = include('Guild/UI/Setting/GuildSelectPlayerLayer')
            let GuildSelectPlayerLayer = appInstance.uiManager().createPopUI(GuildSelectPlayerClass, info, memberData, null, JSPP.ppfunction(function (peopleinfo) {
              GuildServerApi.SetGuildBlock(this.guildId, peopleinfo.uid, 1, JSPP.ppfunction(function (rtn) {
                if (rtn.result === 0) {
                  utils.showMsg('添加成功!', 1)
                  this.getDarkroomInfo()
                } else if (rtn.result === EnumType.ZJHCode.GuildNotIn) {
                  utils.showMsg('该玩家不在本群里', 1)
                } else if (rtn.result === EnumType.ZJHCode.GuildAlreadySet) {
                  utils.showMsg('该玩家已经在小黑屋', 1)
                }
              }, this))
            }, this), layerType)
            this.BackgroundView.rootnode.addChild(GuildSelectPlayerLayer)
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

  JSPP.ppclass('GuildSetDarkRoomView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
