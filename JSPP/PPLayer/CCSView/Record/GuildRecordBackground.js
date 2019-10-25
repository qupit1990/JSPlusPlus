//  Created by qupit in 2019/9/25.

(function () {

  JSPP.ppinclude(
    ':/PPComponent/CacheHeadNode.js',
    '../../CCSViewBase.js',
    '../../PPLayerFactory.js',
    './GuildRecordViewBase.js',
    ':/PPData/Record/GuildRecordData.js',
    './RecordChildView/GuildRecordLayer.js',
    './RecordChildView/GuildRoomLayer.js',
    './RecordChildView/GuildExpendLayer.js'
  )

  let resArray = [
    { plist: 'res/guildRes/club/histroy/histroy.plist', png: 'res/guildRes/club/histroy/histroy.png' }
  ]

  let GuildUtil = include('Guild/Utils/GuildUtil')
  let DatePickerLayer = include('Guild/UI/Component/DatePicker')
  let GuildResourceConfig = include('Guild/Config/GuildResourceConfig')
  let GuildDataManager = include('Guild/Data/GuildDataManager')
  let PackageConfig = include('Game/PackageConfig')

  let viewFrame = {
    guild_record: 0,
    my_roomInfo: 1,
    guild_roomInfo: 2,
    other_roomInfo: 3,
    guild_costs: 4
  }

  let public = {

    virtual: {
      _GuildRecordBackground: function () {
        appInstance.resManager().removeLoadedResByKey(resArray)
      }
    },
    GuildRecordBackground: function (ccpath, cfg) {
      appInstance.resManager().addResConfig(resArray)

      this.doBindingWithcfgKey('exit')

      this.titleBtns.guild_record = this.doBindingWithcfgKey('Title0', null, 'guild_record')
      this.titleBtns.my_roomInfo = this.doBindingWithcfgKey('Title1', null, 'my_roomInfo')
      this.titleBtns.guild_roomInfo = this.doBindingWithcfgKey('Title2', null, 'guild_roomInfo')
      this.titleBtns.other_roomInfo = this.doBindingWithcfgKey('Title3', null, 'other_roomInfo')
      this.titleBtns.guild_costs = this.doBindingWithcfgKey('Title4', null, 'guild_costs')

      this.doBindingWithcfgKey('scorebg')
      this.doBindingWithcfgKey('scorebtn')

      this.doBindingWithcfgKey('btnChangeS', null, 'Start')
      this.doBindingWithcfgKey('btnChangeE', null, 'End')
      this.doBindingWithcfgKey('btntomorrow', null, 'Tomorrow')
      this.doBindingWithcfgKey('btnToday', null, 'Now')
      this.doBindingWithcfgKey('btnYesterday', null, 'Yesterday')

      this.doBindingWithcfgKey('levelbg')
      this.doBindingWithcfgKey('levelbtn')
      this.doBindingWithcfgKey('relationSearch')
      this.doBindingWithcfgKey('peoplebg')
      this.doBindingWithcfgKey('peoplebtn')

      let RecordData = JSPP.ppstatic('GuildRecordData').getInstance()
      RecordData.getDispatcher('memberdataChangeEvent').registHandler(JSPP.ppfunction(this.onRecordDataChange, this), this.listener)
      RecordData.getDispatcher('relationdataChangeEvent').registHandler(JSPP.ppfunction(this.onRelationChange, this), this.listener)

      let floorScroll = this.getNodeBycfgKey('floorScroll')
      let floorScrollbtn = this.getNodeBycfgKey('floorScrollbtn')
      this.floorlistEx = JSPP.ppnew('ScrollViewEx', floorScroll, floorScrollbtn, function (item) {
        let selectBg = item.getChildByName('onSelectbg')
        selectBg.setVisible(false)
        let itemName = item.getChildByName('textname')
        itemName.ignoreContentAdaptWithSize(true)
      }, undefined, 2)

      let relationWordBox = this.getNodeBycfgKey('relationWordBox')
      let bgSize = relationWordBox.getContentSize()
      this.inputBox = GuildUtil.editBoxCreate(cc.size(bgSize.width * 0.9, bgSize.height * 0.8), '', 6, '请输入ID')
      this.inputBox.setName('input_ScoreId')
      this.inputBox.setInputFlag(cc.EDITBOX_INPUT_FLAG_SENSITIVE)
      this.inputBox.setInputMode(cc.EDITBOX_INPUT_MODE_NUMERIC)
      this.inputBox.setPosition(bgSize.width / 2 * 0.9, bgSize.height / 2)
      this.inputBox.setFontColor(cc.color(0xb2, 0xb2, 0xb2, 255))
      this.inputBox.setPlaceholderFontColor(cc.color(0xb2, 0xb2, 0xb2, 255))
      this.inputBox.setDelegate({
        editBoxEditingDidBegin: JSPP.ppfunction(function (editBox) {
          this.inputBox.setString('')
          this.relationselEx.setDataList([{}].concat(this.relationInfo))
        }, this),
        editBoxEditingDidEnd: JSPP.ppfunction(function (editBox) {
          this.relationSearch()
        }, this),
        editBoxTextChanged: JSPP.ppfunction(function (editBox, text) {
          if (text) {
            let relationList = this.getRelationListByKey(this.relationInfo, this.inputBox.string)
            this.relationselEx.setDataList(relationList)
          } else {
            this.relationselEx.setDataList([{}].concat(this.relationInfo))
          }
        }, this),
        editBoxReturn: JSPP.ppfunction(function (editBox) {
        }, this)
      })
      relationWordBox.addChild(this.inputBox)

      let relationScroll = this.getNodeBycfgKey('relationScroll')
      let relationScrollbtn = this.getNodeBycfgKey('relationScrollbtn')
      this.relationselEx = JSPP.ppnew('ScrollViewEx', relationScroll, relationScrollbtn, function (item) {
        let selectBg = item.getChildByName('onSelectbg')
        selectBg.setVisible(false)

        let itemidText = item.getChildByName('textID')
        itemidText.ignoreContentAdaptWithSize(true)

        let headnode = item.getChildByName('headimage')
        //初始化一个urlNode记录值
        headnode.URLNode = undefined
      }, undefined, 2)

      this.floorlistEx.setDataList([], JSPP.ppfunction(this.updateFloorList, this))
      this.relationselEx.setDataList([], JSPP.ppfunction(this.updateRelationList, this))

      this.getNodeBycfgKey('floortext').ignoreContentAdaptWithSize(true)
      this.getNodeBycfgKey('scoreText').ignoreContentAdaptWithSize(true)

      this.doBindingWithcfgKey('touchStop')
      this.doBindingWithcfgKey('btnSearch')

      let inputBg = this.getNodeBycfgKey('inputBg')
      let pSize = inputBg.getContentSize()
      this.inputBox = GuildUtil.editBoxCreate(cc.size(pSize.width * 0.9, pSize.height * 0.8), '', 6, '请输入房间ID')
      this.inputBox.setName('input_roomId')
      this.inputBox.setInputFlag(cc.EDITBOX_INPUT_FLAG_SENSITIVE)
      this.inputBox.setInputMode(cc.EDITBOX_INPUT_MODE_NUMERIC)
      this.inputBox.setPosition(pSize.width / 2 * 0.9, pSize.height / 2)
      this.inputBox.setFontColor(cc.color(0xb2, 0xb2, 0xb2, 255))
      this.inputBox.setPlaceholderFontColor(cc.color(0xb2, 0xb2, 0xb2, 255))
      this.inputBox.setDelegate({
        editBoxEditingDidBegin: JSPP.ppfunction(function (editBox) {
          //this.inputBox.setString('')
        }, this),
        editBoxEditingDidEnd: JSPP.ppfunction(function (editBox) {
          if (this.inputBox.getString() === '') {
            let newParam = this.copyViewParam()
            newParam.searchString = null
            if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
              this.viewParam = newParam
              this.updateView()
            }
          }
        }, this),
        editBoxTextChanged: JSPP.ppfunction(function (editBox, text) {
        }, this),
        editBoxReturn: JSPP.ppfunction(function (editBox) {
          if (!this.inputBox.getString()) {
            let newParam = this.copyViewParam()
            newParam.searchString = null
            if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
              this.viewParam = newParam
              this.updateView()
            }
          }
        }, this)
      })
      inputBg.addChild(this.inputBox)

      this.closeAllPanel()

      this.viewParam.starttime = new Date(new Date().toLocaleDateString()).getTime()
      this.viewParam.endtime = (new Date()).getTime()
      this.viewParam.floorselect = { floorindex: 0, floorName: '全部' }
      this.viewParam.scoreMin = 0
      this.viewParam.scoreMax = null
      this.updateView()

      let bOwnerM = GuildDataManager.getOwner() // 我是群主？
      let bManagerM = GuildDataManager.getManager() // 我是管理员？
      let isGuildPartner = GuildDataManager.getGuildPartner()// 我是合伙人?
      let merged = GuildDataManager.getMerged() // 是否合群

      if (bOwnerM || bManagerM || isGuildPartner) {
        this.choosePanel('guild_record')
      } else {
        this.titleBtns.guild_record.setVisible(false)
        this.titleBtns.my_roomInfo.setVisible(true)
        this.titleBtns.my_roomInfo.setPositionY(this.titleBtns.guild_record.getPositionY())
        this.titleBtns.guild_roomInfo.setVisible(false)
        this.titleBtns.other_roomInfo.setVisible(false)
        this.titleBtns.guild_costs.setVisible(false)

        this.choosePanel('my_roomInfo')
      }

      if (merged && (bOwnerM || bManagerM)) {
        this.getNodeBycfgKey('relationAllText').setVisible(true)
        this.getNodeBycfgKey('relationshowpanel').setVisible(false)
        this.getNodeBycfgKey('relationTextID').ignoreContentAdaptWithSize(true)
      }

    },
    setShowMe: function () {
      this.choosePanel('my_roomInfo')
    },
    setSearchRoom: function (searchroomid) {
      this.choosePanel('guild_roomInfo', searchroomid)
    },
    setSearchPeopel: function (searchid) {
      this.choosePanel('other_roomInfo', searchid)
    }
  }

  let protected = {
    // 选中的按钮
    choosedPanelBtn: null,
    // 显示中的layer
    choosedLayer: null,
    // 界面数据
    /* 示例
    *  viewParam: {
    *    // 选中玩法 { floorindex: floorindex, floorName: floorName }
    *    floorselect: { floorindex: 0, floorName: '全部' },
    *    // 选中合伙人
    *    relationselect: null || { uid:， nickname:, headimgurl:},
    *    // 搜索最低分
    *    scoreMin: 0,
    *    // 搜索最高分
    *    scoreMax: null,
    *    // 起始时间
    *    starttime: null,
    *    // 终止时间
    *    endtime: null,
    *    // 搜索中的字符串
    *    searchString: null,
    *  }
    */
    viewParam: {
      floorselect: { floorindex: 0, floorName: '全部' },
      relationselect: null,
      scoreMin: 0,
      scoreMax: null,
      starttime: null,
      endtime: null,
      searchString: null
    },
    //标题页列表
    titleBtns: {},
    // 菜单搜索输入框
    inputBox: null,
    // 玩法选择菜单
    floorlistEx: null,
    // 合伙人菜单
    relationselEx: null,
    // 合伙人缓存数据
    relationInfo: null,
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
          case 'choosePanel':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                //保持不变
                btn.setSelected(true)
                return
              }
              this.choosePanel(data)
            }, this))
            break
          case 'chooseScore':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.chooseScore()
              }
            }, this))
            break
          case 'changeDate':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                switch (data) {
                  case 'Yesterday':
                    this.changeDateby(-1)
                    break
                  case 'Now':
                    this.resetDateNow()
                    break
                  case 'Tomorrow':
                    this.changeDateby(1)
                    break
                  case 'Start':
                    this.changeDateStart()
                    break
                  case 'End':
                    this.changeDateEnd()
                    break
                }
              }
            }, this))
            break
          case 'dropFloorList':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.floorDropItem()
              }
            }, this))
            break
          case 'dropRelationList':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.peopleDropItem()
              }
            }, this))
            break
          case 'closeAllPanel':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.closeAllPanel()
              }
            }, this))
            break
          case 'relationSearch':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.relationSearch()
              }
            }, this))
            break
          case 'BtnSearch':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.onSearchPress()
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

      choosePanel: function (titleName, userdata) {
        let selBtn = this.titleBtns[titleName]

        if (this.choosedPanelBtn) {
          //逻辑相同返回
          if (this.choosedPanelBtn === selBtn) {
            return
          }
          this.choosedPanelBtn.setSelected(false)
        }

        this.choosedPanelBtn = selBtn

        if (this.choosedPanelBtn) {
          this.choosedPanelBtn.setSelected(true)
        }

        let bOwnerM = GuildDataManager.getOwner() // 我是群主？
        let bManagerM = GuildDataManager.getManager() // 我是管理员？
        let merged = GuildDataManager.getMerged() // 是否合群

        let nowSelLayer = null
        let bar = this.getNodeBycfgKey('ChildrenNode')
        switch (viewFrame[titleName]) {
          case viewFrame.guild_record:
            if (!this.RecordLayer) {
              this.RecordLayer = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView('RecordLayer')
              this.RecordLayer.SetBackgroundView(this)
              this.RecordLayer.addToParent(bar)
            }
            nowSelLayer = this.RecordLayer
            this.getNodeBycfgKey('scorebg').setVisible(true)
            this.getNodeBycfgKey('costPanel').setVisible(true)
            this.getNodeBycfgKey('search_panel').setVisible(false)
            this.getNodeBycfgKey('levelbg').setVisible(true)
            if (merged && (bOwnerM || bManagerM)) {
              this.getNodeBycfgKey('peoplebg').setVisible(true)
            } else {
              this.getNodeBycfgKey('peoplebg').setVisible(false)
            }
            break
          case viewFrame.my_roomInfo:
            if (!this.RoomLayer) {
              this.RoomLayer = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView('RoomLayer')
              this.RoomLayer.SetBackgroundView(this)
              this.RoomLayer.addToParent(bar)
            }
            nowSelLayer = this.RoomLayer
            this.getNodeBycfgKey('scorebg').setVisible(true)
            this.getNodeBycfgKey('costPanel').setVisible(false)
            this.getNodeBycfgKey('search_panel').setVisible(false)
            this.getNodeBycfgKey('levelbg').setVisible(false)
            this.getNodeBycfgKey('peoplebg').setVisible(false)
            this.viewParam.searchString = GuildDataManager.getSelfInfo().uid
            break
          case viewFrame.guild_roomInfo:
            if (!this.RoomLayer) {
              this.RoomLayer = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView('RoomLayer')
              this.RoomLayer.SetBackgroundView(this)
              this.RoomLayer.addToParent(bar)
            }
            nowSelLayer = this.RoomLayer
            this.getNodeBycfgKey('scorebg').setVisible(true)
            this.getNodeBycfgKey('costPanel').setVisible(false)
            this.getNodeBycfgKey('search_panel').setVisible(true)
            this.getNodeBycfgKey('levelbg').setVisible(false)
            this.getNodeBycfgKey('peoplebg').setVisible(false)
            this.inputBox.setPlaceHolder('请输入房间ID')
            this.inputBox.setMaxLength(6)
            if (userdata) {
              this.inputBox.string = '' + userdata
              this.viewParam.searchString = '' + userdata
            } else {
              this.inputBox.string = ''
              this.viewParam.searchString = null
            }
            break
          case viewFrame.other_roomInfo:
            if (!this.RoomLayer) {
              this.RoomLayer = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView('RoomLayer')
              this.RoomLayer.SetBackgroundView(this)
              this.RoomLayer.addToParent(bar)
            }
            nowSelLayer = this.RoomLayer
            this.getNodeBycfgKey('scorebg').setVisible(true)
            this.getNodeBycfgKey('costPanel').setVisible(false)
            this.getNodeBycfgKey('search_panel').setVisible(true)
            this.getNodeBycfgKey('levelbg').setVisible(false)
            this.getNodeBycfgKey('peoplebg').setVisible(false)
            this.inputBox.setPlaceHolder('请输入成员ID')
            this.inputBox.setMaxLength(8)
            if (userdata) {
              this.inputBox.string = '' + userdata
              this.viewParam.searchString = '' + userdata
            } else {
              this.inputBox.string = ''
              this.viewParam.searchString = null
            }
            break
          case viewFrame.guild_costs:
            if (!this.ExpendLayer) {
              this.ExpendLayer = JSPP.ppstatic('PPLayerFactory').getInstance().createCCSView('ExpendLayer')
              this.ExpendLayer.SetBackgroundView(this)
              this.ExpendLayer.addToParent(bar)
            }
            nowSelLayer = this.ExpendLayer
            this.getNodeBycfgKey('scorebg').setVisible(false)
            this.getNodeBycfgKey('costPanel').setVisible(false)
            this.getNodeBycfgKey('search_panel').setVisible(false)
            this.getNodeBycfgKey('levelbg').setVisible(true)
            if (merged && (bOwnerM || bManagerM)) {
              this.getNodeBycfgKey('peoplebg').setVisible(true)
            } else {
              this.getNodeBycfgKey('peoplebg').setVisible(false)
            }
            break
          default:
            return
        }

        if (this.choosedLayer !== nowSelLayer) {
          if (this.choosedLayer) {
            if (this.choosedLayer === this.ExpendLayer) {
              this.viewParam.starttime = new Date(new Date().toLocaleDateString()).getTime()
              this.viewParam.endtime = (new Date()).getTime()
              this.updateView()
            }
            this.choosedLayer.HideView()
          }
          this.choosedLayer = nowSelLayer
          if (this.choosedLayer) {
            this.choosedLayer.ShowView()
            if (this.choosedLayer === this.ExpendLayer) {
              let oneDayTime = 1000 * 60 * 60 * 24
              this.viewParam.starttime = (new Date()).getTime() - 7 * oneDayTime
              this.viewParam.endtime = (new Date()).getTime()
              this.updateView()
            }
          }
        }

        this.choosedLayer.TitleSelected(titleName, this.viewParam)

      },
      copyViewParam: function () {
        return JSON.parse(JSON.stringify(this.viewParam))
      },
      chooseScore: function () {
        let selectPara = {}
        selectPara.title = GuildResourceConfig.picName.historyScoreFiltrate[0]
        selectPara.startInfo = {}
        selectPara.startInfo.showArrayStart = 0
        selectPara.startInfo.showArrayEnd = 100
        selectPara.startInfo.showArrayInit = []
        selectPara.startInfo.showArrayAppend = []
        selectPara.startInfo.prefix = ''
        selectPara.startInfo.suffix = '分'
        selectPara.startInfo.selectIndex = this.scoreMin
        selectPara.endInfo = {}
        selectPara.endInfo.showArrayStart = 0
        selectPara.endInfo.showArrayEnd = 100
        selectPara.endInfo.showArrayInit = []
        selectPara.endInfo.showArrayAppend = ['无限']
        selectPara.endInfo.prefix = ''
        selectPara.endInfo.suffix = '分'
        selectPara.endInfo.selectIndex = this.viewParam.scoreMax ? this.viewParam.scoreMax : 101

        let SelectPicker = include('Guild/UI/Component/SelectPicker')
        let selectPicker = appInstance.uiManager().createUI(SelectPicker, selectPara, JSPP.ppfunction(function (value) {
          let newParam = this.copyViewParam()
          newParam.scoreMin = value.startValue
          if (value.endIndex <= 100) {
            newParam.scoreMax = value.endValue
          } else {
            newParam.scoreMax = null
          }
          if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
            this.viewParam = newParam
            this.updateView()
          }
        }, this), function (value) {
          if (value.startIndex > value.endIndex) {
            utils.showMsg('起始分数不能小于截止分数')
            return false
          }
          return true
        })
        cc.director.getRunningScene().addChild(selectPicker)
      },
      changeDateStart: function () {
        let datePickerLayer = appInstance.uiManager().createPopUI(DatePickerLayer, this.viewParam.starttime, JSPP.ppfunction(function (time) {
          let newParam = this.copyViewParam()
          newParam.starttime = time
          if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
            this.viewParam = newParam
            this.updateView()
          }
        }, this))
        cc.director.getRunningScene().addChild(datePickerLayer)
      },
      changeDateEnd: function () {
        let datePickerLayer = appInstance.uiManager().createPopUI(DatePickerLayer, this.viewParam.endtime, JSPP.ppfunction(function (time) {
          let newParam = this.copyViewParam()
          newParam.endtime = time
          if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
            this.viewParam = newParam
            this.updateView()
          }
        }, this))
        cc.director.getRunningScene().addChild(datePickerLayer)
      },
      changeDateby: function (dt) {
        let oneDayTime = 1000 * 60 * 60 * 24
        let newParam = this.copyViewParam()
        newParam.starttime = this.viewParam.starttime + oneDayTime * dt
        newParam.endtime = this.viewParam.endtime + oneDayTime * dt
        if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
          this.viewParam = newParam
          this.updateView()
        }
      },
      resetDateNow: function () {
        let newParam = this.copyViewParam()
        newParam.starttime = new Date(new Date().toLocaleDateString()).getTime()
        newParam.endtime = (new Date()).getTime()
        if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
          this.viewParam = newParam
          this.updateView()
        }
      },
      closeAllPanel: function () {
        this.getNodeBycfgKey('touchStop').setVisible(false)
        this.getNodeBycfgKey('floorselPanel').setVisible(false)
        this.getNodeBycfgKey('relationselPanel').setVisible(false)
      },
      getRelationListByKey: function (infolist, keystr) {
        if (!keystr) return []

        let relationList = []
        for (let i = 0; i < infolist.length; i++) {
          if ((new RegExp(keystr, 'g')).test(infolist[i].uid))
            relationList.push(infolist[i])
        }
        return relationList
      },
      relationSearch: function () {
        if (!this.relationInfo) return
        let relationList = this.getRelationListByKey(this.relationInfo, this.inputBox.string)
        if (relationList.length <= 0) {
          relationList = [{}].concat(this.relationInfo)
          if (this.inputBox.string) {
            this.inputBox.setString('')
            utils.showFloatMsg('对不起，没有符合条件的信息！')
          }
        }
        this.relationselEx.setDataList(relationList)
      },
      onRelationChange: function (data) {
        this.relationInfo = data.info
        let relationList = this.getRelationListByKey(this.relationInfo, this.inputBox.string)
        if (relationList.length <= 0)
          relationList = [{}].concat(this.relationInfo)
        this.relationselEx.setDataList(relationList)
      },
      peopleDropItem: function () {
        if (this.getNodeBycfgKey('touchStop').isVisible()) return
        this.getNodeBycfgKey('touchStop').setVisible(true)
        this.getNodeBycfgKey('relationselPanel').setVisible(true)

        let RecordDatas = JSPP.ppstatic('GuildRecordData').getInstance()
        RecordDatas.requerstGetCooperGuildStatistics()
        RecordDatas.despatchDefaultrelationStatisticsData()
      },
      updateRelationList: function (index, item, data) {
        let selectBg = item.getChildByName('onSelectbg')

        selectBg.setVisible(this.relationselect && this.relationselect.uid === data.uid)

        let headbg = item.getChildByName('headimage')
        let itemidText = item.getChildByName('textID')
        let itemNameText = item.getChildByName('textname')
        let itemAllText = item.getChildByName('textall')
        if (data.uid) {
          headbg.setVisible(true)
          itemidText.setVisible(true)
          itemNameText.setVisible(true)
          itemAllText.setVisible(false)

          if (!headbg.headnode){
            headbg.headnode = JSPP.ppnew('CacheHeadNode',headbg)
          }
          headbg.headnode.setHeadInfo(data.uid, data.headimgurl)
          headbg.headnode.getRootNode().setScale(0.96)

          itemidText.setString('ID: ' + data.uid)

          itemNameText.setString(GuildUtil.getOmittedString(unescape(data.nickname), 14, true))
        } else {
          headbg.setVisible(false)
          itemidText.setVisible(false)
          itemNameText.setVisible(false)
          itemAllText.setVisible(true)
        }

        item.onClicked(JSPP.ppfunction(function () {
          this.SelRelation(data.uid, data.nickname, data.headimgurl)
          this.getNodeBycfgKey('touchStop').setVisible(false)
          this.getNodeBycfgKey('relationselPanel').setVisible(false)
        }, this))
      },
      SelRelation: function (uid, nickname, headimgurl) {
        let newParam = this.copyViewParam()
        if (uid) {
          newParam.relationselect = { uid: uid, nickname: nickname, headimgurl: headimgurl }
        } else {
          newParam.relationselect = null
        }
        if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
          this.viewParam = newParam
          this.updateView()
        }
      },
      floorDropItem: function () {
        if (this.getNodeBycfgKey('touchStop').isVisible()) return
        this.getNodeBycfgKey('touchStop').setVisible(true)
        let floorPanel = this.getNodeBycfgKey('floorselPanel')
        floorPanel.setVisible(true)
        let guildInfo = GuildDataManager.getGuildInfoByID(JSPP.ppstatic('GuildRecordData').getInstance().getUsingGuildID())
        let levelConfig = guildInfo ? guildInfo.levelConfig : null
        let maxsize = 4
        let floorList = [0]
        for (let key in levelConfig) {
          floorList.push(parseInt(key))
        }
        if (floorList.length < maxsize) {
          maxsize = floorList.length
          let resize = cc.size(this.getNodeBycfgKey('floorScroll').getContentSize().width, 2 + (this.getNodeBycfgKey('floorScrollbtn').getContentSize().height + 2) * maxsize)
          floorPanel.setContentSize(resize)
          this.floorlistEx.setContentSize(resize)
        }
        this.floorlistEx.setDataList(floorList)
      },
      updateFloorList: function (index, item, data) {
        let selectBg = item.getChildByName('onSelectbg')
        selectBg.setVisible(this.floorselect === data)

        let itemName = item.getChildByName('textname')
        let floorName = '全部'
        if (data > 0 && data <= PackageConfig.floorCount) {
          floorName = GuildUtil.getOmittedString(unescape(GuildDataManager.getGuildFloorLevelName(JSPP.ppstatic('GuildRecordData').getInstance().getUsingGuildID(), parseInt(data))), 11, false)
        }
        itemName.setString(floorName)

        item.onClicked(JSPP.ppfunction(function () {
          this.SelFloor(data, floorName)
          this.getNodeBycfgKey('touchStop').setVisible(false)
          this.getNodeBycfgKey('floorselPanel').setVisible(false)
        }, this))
      },
      SelFloor: function (floorindex, floorName) {
        let newParam = this.copyViewParam()
        newParam.floorselect = { floorindex: floorindex, floorName: floorName }
        if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
          this.viewParam = newParam
          this.updateView()
        }
      },
      onRecordDataChange: function (data) {
        this.getNodeBycfgKey('guildCount').setString(String(data.gamecount))
        this.getNodeBycfgKey('guildConsume').setString(String(data.totalMoney))
      },

      onSearchPress: function () {
        let newParam = this.copyViewParam()
        newParam.searchString = this.inputBox.getString()
        if (this.choosedLayer && this.choosedLayer.ChangeReqParam(newParam)) {
          this.viewParam = newParam
          this.updateView()
        } else {
          utils.showMsg('请输入正确的id格式')
          this.inputBox.string = ''
        }
      },

      updateView: function () {
        // 使用 this.viewParam 参数刷新界面
        this.getNodeBycfgKey('startTimeText').setString(utils.timeUtil.getDateDayStr(new Date(this.viewParam.starttime), '-'))
        this.getNodeBycfgKey('endTimeText').setString(utils.timeUtil.getDateDayStr(new Date(this.viewParam.endtime), '-'))
        let text = this.viewParam.scoreMin + '分-'
        if (this.viewParam.scoreMax !== null) {
          text += this.viewParam.scoreMax + '分'
        } else {
          text += '无限'
        }
        this.getNodeBycfgKey('scoreText').setString(text)

        if (this.viewParam.relationselect) {
          cc.log(' ---- >>> ' + JSON.stringify(this.viewParam.relationselect))
          let relationinfo = this.viewParam.relationselect
          this.getNodeBycfgKey('relationAllText').setVisible(false)
          this.getNodeBycfgKey('relationshowpanel').setVisible(true)

          let headbg = this.getNodeBycfgKey('relationHeadimage')

          if (!headbg.headnode){
            headbg.headnode = JSPP.ppnew('CacheHeadNode',headbg)
          }
          headbg.headnode.setHeadInfo(relationinfo.uid, relationinfo.headimgurl)
          headbg.headnode.getRootNode().setScale(0.96)

          let nickName = ''
          if (relationinfo.nickname) {
            nickName = GuildUtil.getOmittedString(unescape(relationinfo.nickname), 14, true)
          }
          this.getNodeBycfgKey('relationTextName').setString(nickName)
          this.getNodeBycfgKey('relationTextID').setString('ID: ' + relationinfo.uid)
        } else {
          this.getNodeBycfgKey('relationAllText').setVisible(true)
          this.getNodeBycfgKey('relationshowpanel').setVisible(false)
        }

        if (this.viewParam.floorselect) {
          this.getNodeBycfgKey('floortext').setString(this.viewParam.floorselect.floorName)
        }
      }
    }
  }

  let private = {
    //选中按钮
    choosedPanelBtn: null,
    //页签对象
    layerList: [],
    RecordLayer: undefined,
    RoomLayer: undefined,
    ExpendLayer: undefined,

    //搜索输入控件
    inputBox: null
  }

  JSPP.ppclass('GuildRecordBackground', 'CCSViewBase', public, protected, private)

})()
