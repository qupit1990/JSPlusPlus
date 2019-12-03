//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../CCSViewBase.js',
  '../../PPLayerFactory.js',
  'GuildSetViewBase.js',
  'SetChildView/GuildSetInfoView.js',
  'SetChildView/GuildSetFeaturesView.js',
  'SetChildView/GuildSetCooperationSetLayer.js',
  'SetChildView/GuildSetOpenTimeView.js',
  'SetChildView/GuildSetRejectView.js',
  'SetChildView/GuildSetDarkRoomView.js',
  'SetChildView/GuildSetDismissGuildView.js',
  'SetChildView/GuildSetExitGuildView.js'
], function (__filepath__) {
  'use strict'

  let GuildDataManager = include('Guild/Data/GuildDataManager')

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('GuildSetting', 'GuildSetBackground', 'res/guildRes/GuildSetBaseLayer.csb', {

    background: { path: 'background' },
    exit: { path: 'background/btn_x', function: 'closeView' },

    btn_0: { path: 'background/btns_panel/basicSet', function: 'selTitle' },
    btn_1: { path: 'background/btns_panel/guildCharacter', function: 'selTitle' },
    btn_2: { path: 'background/btns_panel/cooperationSet', function: 'selTitle' },
    btn_3: { path: 'background/btns_panel/openTime', function: 'selTitle' },
    btn_4: { path: 'background/btns_panel/repelList', function: 'selTitle' },
    btn_5: { path: 'background/btns_panel/darkRoom', function: 'selTitle' },
    btn_6: { path: 'background/btns_panel/delroom', function: 'selTitle' },
    btn_7: { path: 'background/btns_panel/exitroom', function: 'selTitle' },

    ChildrenNode: { path: 'background/childbar' }
  }, [
    'res/guildRes/club/common/common',
    'res/guildRes/club/setting/setting'
  ])

  let __public__ = {
    static: {
      VIEW_INDEX: {
        basicSet: 0,
        guildCharacter: 1,
        cooperationSet: 2,
        openTime: 3,
        repelList: 4,
        darkRoom: 5,
        delroom: 6,
        exitroom: 7,
        max: 8
      },
      static: function () {
        this.viewClass[this.VIEW_INDEX.basicSet] = 'GuildSetInfoView'
        this.viewClass[this.VIEW_INDEX.guildCharacter] = 'GuildSetFeaturesView' //
        this.viewClass[this.VIEW_INDEX.cooperationSet] = 'GuildSetCooperationSetLayer'
        this.viewClass[this.VIEW_INDEX.openTime] = 'GuildSetOpenTimeView'
        this.viewClass[this.VIEW_INDEX.repelList] = 'GuildSetRejectView'
        this.viewClass[this.VIEW_INDEX.darkRoom] = 'GuildSetDarkRoomView'
        this.viewClass[this.VIEW_INDEX.delroom] = 'GuildSetDismissGuildView'
        this.viewClass[this.VIEW_INDEX.exitroom] = 'GuildSetExitGuildView'
      }
    },
    GuildSetBackground: function (ccpath, cfg) {
      this.doBindingWithcfgKey('exit')

      for (let index = this.VIEW_INDEX.basicSet; index < this.VIEW_INDEX.max; index++) {
        let checkbtn = this.doBindingWithcfgKey('btn_' + index, null, index)
        checkbtn.setVisible(false)
        this.showPosList.push(checkbtn.getPosition())
        this.titleList[index] = checkbtn
      }

      let isOwner = GuildDataManager.getOwner()
      let isManager = GuildDataManager.getManager()
      let isGuildMerged = GuildDataManager.getMerged()
      let isGuildPartner = GuildDataManager.getGuildPartner()

      this.showIndexList.push(this.VIEW_INDEX.basicSet)
      this.showIndexList.push(this.VIEW_INDEX.guildCharacter)
      if (isGuildMerged && (isOwner || isManager || isGuildPartner)) {
        this.showIndexList.push(this.VIEW_INDEX.cooperationSet)
      }
      this.showIndexList.push(this.VIEW_INDEX.openTime)
      if (isOwner || isManager) {
        this.showIndexList.push(this.VIEW_INDEX.repelList)
        this.showIndexList.push(this.VIEW_INDEX.darkRoom)
      }
      if (isOwner) {
        this.showIndexList.push(this.VIEW_INDEX.delroom)
      } else {
        this.showIndexList.push(this.VIEW_INDEX.exitroom)
      }

      for (let index = 0; index < this.showIndexList.length; index++) {
        let showingIndex = this.showIndexList[index]
        this.titleList[showingIndex].setPosition(this.showPosList[index])
        this.titleList[showingIndex].setVisible(true)
      }

      //设置默认页面
      if (this.showIndexList.length > 0) {
        this.choosePanel(this.showIndexList[0])
      }
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
          case 'search':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.searchPeople()
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      onEnter: function () {
        this.ppsuper()
        this.doLayout(this.rootnode)
      },
      choosePanel: function (VIEW_INDEX) {
        if (this.chooseing_VIEW_INDEX === VIEW_INDEX) return
        if (this.chooseing_VIEW_INDEX !== null) {
          if (this.titleList[this.chooseing_VIEW_INDEX]) {
            this.titleList[this.chooseing_VIEW_INDEX].setSelected(false)
          }

          if (this.viewPageList[this.chooseing_VIEW_INDEX]) {
            this.viewPageList[this.chooseing_VIEW_INDEX].HideView()
          }
        }

        this.chooseing_VIEW_INDEX = VIEW_INDEX

        if (this.titleList[this.chooseing_VIEW_INDEX]) {
          this.titleList[this.chooseing_VIEW_INDEX].setSelected(true)
        }

        if (!this.viewPageList[this.chooseing_VIEW_INDEX]) {
          if (!this.viewClass[this.chooseing_VIEW_INDEX]) return
          let newPage = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView(this.viewClass[this.chooseing_VIEW_INDEX])
          if (newPage) {
            this.viewPageList[this.chooseing_VIEW_INDEX] = newPage
            newPage.addToParent(this.getNodeBycfgKey('ChildrenNode'))
            newPage.SetBackgroundView(this)
          }
        }

        if (this.viewPageList[this.chooseing_VIEW_INDEX]) {
          this.viewPageList[this.chooseing_VIEW_INDEX].ShowView()
        }

      }
    }
  }

  let __private__ = {
    static: {
      viewClass: {}
    },
    titleList: {},
    showIndexList: [],
    showPosList: [],
    viewPageList: {},
    chooseing_VIEW_INDEX: null
  }

  JSPP.ppclass('GuildSetBackground', 'CCSViewBase', __public__, __protected__, __private__)
})
