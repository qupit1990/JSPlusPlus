//  Created by qupit in 2019/9/25.

(function () {

  JSPP.ppinclude(
    ':/PPData/Record/GuildRecordData.js',
    ':/PPComponent/CacheHeadNode.js',
    ':/PPComponent/ScrollViewEx.js',
    '../GuildRecordViewBase.js'
  )

  let GuildSortType = { //选中的排序按钮
    TotalScore: 0,
    TotalCount: 1,
    WinCount: 2,
    WinScore: 3
  }

  let GuildUtil = include('Guild/Utils/GuildUtil')
  let GuildDataManager = include('Guild/Data/GuildDataManager')

  let public = {
    virtual: {
      _GuildRecordLayer: function () {},

      ShowView: function () {
        this.rootnode.setVisible(true)
        let RecordDatas = JSPP.ppstatic('GuildRecordData').getInstance()
        RecordDatas.despatchDefaultStatisticsData()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      },
      ChangeReqParam: function (param) {
        if (!this.ppsuper(param)) return false

        JSPP.ppstatic('GuildRecordData').getInstance().requerstGuildRecord(param.floorselect?param.floorselect.floorindex:null, param.relationselect?param.relationselect.uid:null, param.starttime, param.endtime, param.scoreMin, param.scoreMax)
        return true
      },
      TitleSelected: function (viewFrameKey, param) {
        this.ChangeReqParam(param)
      }
    },
    GuildRecordLayer: function (ccpath, cfg) {
      let RecordData = JSPP.ppstatic('GuildRecordData').getInstance()
      RecordData.getDispatcher('memberdataChangeEvent').registHandler(JSPP.ppfunction(this.onDataChange, this), this.listener)

      this.doBindingWithcfgKey('relationSearch')
      this.doBindingWithcfgKey('peoplebg')
      this.doBindingWithcfgKey('peoplebtn')

      this.doBindingWithcfgKey('levelbg')
      this.doBindingWithcfgKey('levelbtn')

      let scrollview = this.getNodeBycfgKey('scrollview')
      let scrollitem = this.getNodeBycfgKey('scrollitem')
      this.scrollviewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, function (item) {
        //初始化一个头像节点
        let headbg = item.getChildByName('icon')
        item.headnode = JSPP.ppnew('CacheHeadNode',headbg)
      }, undefined, 0)
      this.scrollviewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))

      this.sortBtns.TotalScore = this.doBindingWithcfgKey('sort_title0', null, 'TotalScore')
      this.sortBtns.TotalCount = this.doBindingWithcfgKey('sort_title1', null, 'TotalCount')
      this.sortBtns.WinCount = this.doBindingWithcfgKey('sort_title2', null, 'WinCount')
      this.sortBtns.WinScore = this.doBindingWithcfgKey('sort_title3', null, 'WinScore')

      this.chooseSort('TotalScore')
    }

  }

  let protected = {
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'chooseSort':
            node.addEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.CheckBox.EVENT_UNSELECTED) {
                //保持不变
                btn.setSelected(true)
                return
              }
              this.chooseSort(data)
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      chooseSort: function (sortName) {
        let selBtn = this.sortBtns[sortName]

        if (this.choosedSortBtn) {
          //逻辑相同返回
          if (this.choosedSortBtn === selBtn) {
            return
          }
          this.choosedSortBtn.setSelected(false)
        }

        this.choosedSortBtn = selBtn

        if (this.choosedSortBtn) {
          this.choosedSortBtn.setSelected(true)
        }
        this.sortselect = GuildSortType[sortName]
        this.refreshDataWithSort()
      },
      onDataChange: function (data) {
        this.tmpArray = []
        for (let key in data.info) {
          data.info[key].uid = key
          this.tmpArray.push(data.info[key])
        }
        this.refreshDataWithSort()
      },
      refreshDataWithSort: function () {
        let sorttype = this.sortselect
        this.tmpArray.sort(function (a, b) {
          let ret = 0
          switch (sorttype) {
            case  GuildSortType.TotalScore:
              ret = b.totalPoint - a.totalPoint
              break
            case  GuildSortType.TotalCount:
              ret = b.gameCount - a.gameCount
              break
            case  GuildSortType.WinCount:
              ret = b.winnerCount - a.winnerCount
              break
            case  GuildSortType.WinScore:
              ret = b.winnerTotalPoint - a.winnerTotalPoint
              break
          }
          if (ret == 0) {
            ret = parseInt(a.uid) - parseInt(b.uid)
          }
          return ret
        })
        this.scrollviewEx.setDataList(this.tmpArray)
      },
      updateItem: function (index, item, data) {
        let isdoubleindex = (index % 2 == 0)
        item.getChildByName('itembg_0').setVisible(isdoubleindex)
        item.getChildByName('itembg_1').setVisible(!isdoubleindex)

        if (item.headnode){
          item.headnode.setHeadInfo(data.uid, data.headimgurl)
          item.headnode.getRootNode().setScale(0.96)
        }

        let nametext = item.getChildByName('member_name')
        let nickName = ''
        if (data.nickname) {
          nickName = GuildUtil.getOmittedString(unescape(data.nickname), 14, true)
        }
        nametext.setString(nickName)

        let idtext = item.getChildByName('member_id')
        let uid = ''
        if (data.uid) {
          uid += data.uid
        }
        idtext.setString(uid)

        let selectcolor = cc.color(220, 0, 0)
        let normalcolor = cc.color(134, 100, 67)

        let totlescrolltext = item.getChildByName('play_total_scroll')
        let totlescroll = ''
        if (data.totalPoint !== undefined) {
          totlescroll += data.totalPoint
        }
        totlescrolltext.setString(totlescroll)
        totlescrolltext.setTextColor(this.sortselect === GuildSortType.TotalScore ? selectcolor : normalcolor)

        let totletext = item.getChildByName('play_total')
        let totle = ''
        if (data.gameCount !== undefined) {
          totle += data.gameCount
        }
        totletext.setString(totle)
        totletext.setTextColor(this.sortselect === GuildSortType.TotalCount ? selectcolor : normalcolor)

        let wintext = item.getChildByName('play_win')
        let win = ''
        if (data.winnerCount !== undefined) {
          win += data.winnerCount
        }
        wintext.setString(win)
        wintext.setTextColor(this.sortselect === GuildSortType.WinCount ? selectcolor : normalcolor)

        let winscrolltext = item.getChildByName('play_win_scroll')
        let winscroll = ''
        if (data.winnerTotalPoint !== undefined) {
          winscroll += data.winnerTotalPoint
        }
        winscrolltext.setString(winscroll)
        winscrolltext.setTextColor(this.sortselect === GuildSortType.WinScore ? selectcolor : normalcolor)

        let touchActiveRange = item.getChildByName('TouchPanel')
        // 设置点击事件
        touchActiveRange.onClicked(JSPP.ppfunction(function () {
          if (Number(uid) === Number(GuildDataManager.getSelfInfo().uid)){
            this.BackgroundView.setShowMe()
          }else{
            this.BackgroundView.setSearchPeopel(uid)
          }
        },this), touchActiveRange.Proxy)
      }
    }
  }

  let private = {
    // 选中的排序
    sortselect: GuildSortType.TotalScore,
    // 排序按钮列表
    sortBtns: {},
    // 选中的排序按钮
    choosedSortBtn: null,
    // 滚动控件
    scrollviewEx: null,
    // 列表数据缓存
    tmpArray: []
  }

  JSPP.ppclass('GuildRecordLayer', 'GuildRecordViewBase', public, protected, private)

})()
