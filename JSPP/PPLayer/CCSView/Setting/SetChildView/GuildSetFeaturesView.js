//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  ':/PPComponent/CacheHeadNode.js',
  ':/PPComponent/EditBoxEx.js',
  '../../../CCSViewBase.js',
  '../../../PPLayerFactory.js',
  '../GuildSetViewBase.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let GuildUtils = include('Guild/Utils/GuildUtil')
  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')
  /*
  let ad = {
    'character_panel/Panel_0': { name: 'Panel_0' },
    'character_panel/Panel_1': { name: 'Panel_1' },
    'character_panel/Panel_1/btnopen': { name: 'readyOpen', onChecked: function () { this.clickedGuildCharacter(1, this.readyOpen) } },
    'character_panel/Panel_1/btnclose': { name: 'readyClose', onChecked: function () { this.clickedGuildCharacter(1, this.readyClose) } },
    'character_panel/Panel_1/btnopen/txtdesc': { name: 'txtOpen', onClicked: function () { this.clickedGuildCharacter(1, this.readyOpen) } },
    'character_panel/Panel_1/btnclose/txtdesc': { name: 'txtClose', onClicked: function () { this.clickedGuildCharacter(1, this.readyClose) } },
    'character_panel/Panel_2/btnopen': { name: 'createOpen', onChecked: function () { this.clickedGuildCharacter(2, this.createOpen) } },
    'character_panel/Panel_2/btnclose': { name: 'createClose', onChecked: function () { this.clickedGuildCharacter(2, this.createClose) } },
    'character_panel/Panel_2/btnopen/txtdesc': { name: 'txtCreateOpen', onClicked: function () { this.clickedGuildCharacter(2, this.createOpen) } },
    'character_panel/Panel_2/btnclose/txtdesc': { name: 'txtCreateClose', onClicked: function () { this.clickedGuildCharacter(2, this.createClose) } },
    'character_panel/btnsave': { name: 'btnsave', onClicked: this.saveGuildCharacter, likeButton: true },
    'block': { name: 'block', onClicked: function () { utils.showMsg('您不是群主或者管理员，没有权限操作！') } }
  }
  */

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetFeaturesView', 'GuildSetFeaturesView', 'res/guildRes/GuildSetFeaturesLayer.csb', {

  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    virtual: {
      ShowView: function () {
        this.rootnode.setVisible(true)
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      }
    },
    GuildSetFeaturesView: function (ccpath, cfg) {

    }

  }

  let __protected__ = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'closeView':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.close()
              }
            }, this))
            break
          case 'selTitle':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                //保持不变
                btn.setSelected(true)
                return
              }
              this.choosePanel(data)
            }, this))
            break
          case 'selectbg':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.selectGuildBGPic(data)
              }
            }, this))
            break
          case 'TableShowAll':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.setGuildTableShow(data)
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

      OnNameEditBoxEvent: function (eventType, text) {
        let evtTypes = JSPP.ppstatic('EditBoxEx')
        switch (eventType) {
          case evtTypes.Evt_EditBox_EditingDidBegin:
            this.infoEdited = true
            break
          case evtTypes.Evt_EditBox_TextChanged:
            this.nameInputBox.setString(GuildUtils.getOmittedString(text, 14, true))
            break
          case evtTypes.Evt_EditBox_EditingDidEnd:
            this.nameInputBox.setString(GuildUtils.getOmittedString(text, 14, true))
            break
        }
      },
      OnDecEditBoxEvent: function (eventType, text) {
        let evtTypes = JSPP.ppstatic('EditBoxEx')
        switch (eventType) {
          case evtTypes.Evt_EditBox_EditingDidBegin:
            this.infoEdited = true
            this.decInputBox.setString(this.getNodeBycfgKey('descShowText').string)
            break
          case evtTypes.Evt_EditBox_EditingDidEnd:
            this.getNodeBycfgKey('descShowText').string = text
            this.decInputBox.setString(text?' ':'')
            break
        }
      },

      // 设置选中框位置
      selectGuildBGPic: function (idx) {
        this.selingBg = idx
        let bgmask = this.getNodeBycfgKey('uiBgMask')
        let selbtn = this.getNodeBycfgKey('btnbg' + idx)
        bgmask.setPosition(selbtn.getPosition())
      },
      // 设置是否显示全部牌桌
      setGuildTableShow: function (bShowAll) {
        this.ShowAllState = bShowAll

        let sel0 = this.getNodeBycfgKey('btnTableShowEmpty')
        let sel1 = this.getNodeBycfgKey('btnTableShowAll')
        let seling = bShowAll ? sel1 : sel0
        let unsel = bShowAll ? sel0 : sel1

        seling.setSelected(true)
        this.getNodeBycfgKey('txtdesc', seling).setTextColor(cc.color(0xe5, 0x41, 0x00))

        unsel.setSelected(false)
        this.getNodeBycfgKey('txtdesc', unsel).setTextColor(cc.color(0x86, 0x64, 0x43))
      },

      saveFunc: function () {
        if (this.infoEdited) {
          let guildname = this.nameInputBox.getString()
          let guilddesc = this.getNodeBycfgKey('descShowText').string
          if (!guildname) {
            utils.showMsg('牌友群名称不能为空')
            return
          }
          if (utils.isHasIllegalWords(guildname)) {
            utils.showMsg('牌友群名称不能包含敏感字符，请重新输入！')
            return
          }

          let nameFilterDesc = GuildUtils.filterEmojiName(guildname)
          if (nameFilterDesc.length !== guildname.length || nameFilterDesc !== guildname) {
            utils.showMsg('牌友群名称不能包含表情符号，请重新输入！')
            return
          }

          if (utils.isHasIllegalWords(guilddesc)) {
            utils.showMsg('群简介不能包含敏感字符，请重新输入！')
            return
          }

          let filterDesc = GuildUtils.filterEmojiName(guilddesc)
          if (filterDesc.length !== guilddesc.length || filterDesc !== guilddesc) {
            utils.showMsg('群简介不能包含表情符号，请重新输入！')
            return
          }

          GuildServerApi.setGuildConfig(this.guildId, {
            guildName: escape(guildname),
            announce: escape(guilddesc)
          }, JSPP.ppfunction(function (rtn) {
            if (rtn.result === 0) {
              GuildDataManager.setShowAllTable(this.ShowAllState)
              GuildDataManager.setHallBgIndex(this.selingBg)
              GuildDataManager.setGuildName(this.guildId, guildname)
              GuildDataManager.setGuildAnnounce(this.guildId, guilddesc)
              utils.showMsg('群信息修改成功！', 1)
            }
          }, this))
        } else {
          GuildDataManager.setShowAllTable(this.ShowAllState)
          GuildDataManager.setHallBgIndex(this.selingBg)
          utils.showMsg('群信息保存成功！', 1)
        }
      }

    }
  }

  let __private__ = {
    // 当前的牌友群id
    guildId: null,

    nameInputBox: null,
    decInputBox: null,

    // 是否编辑过文本内容
    infoEdited: false,

    ShowAllState: 0,
    selingBg: null
  }

  JSPP.ppclass('GuildSetFeaturesView', 'GuildSetViewBase', __public__, __protected__, __private__)

})
