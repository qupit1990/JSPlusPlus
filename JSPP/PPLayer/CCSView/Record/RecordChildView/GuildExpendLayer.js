//  Created by qupit in 2019/9/25.

(function () {

  JSPP.ppinclude(
    ':/PPData/Record/GuildRecordData.js',
    ':/PPComponent/ScrollViewEx.js',
    '../GuildRecordViewBase.js'
  )

  let GuildExpendType = { // 选中的排序按钮
    TimeDay: 0, // 时间
    ActiveNumber: 1, // 活跃人数
    ExpendNum: 2, // 消耗
    AllCount: 3, // 总场次
    FullCount: 4, // 完整场次
    WinCount: 5 // 大赢家场次
  }


  let GuildUtil = include('Guild/Utils/GuildUtil')

  let public = {
    virtual: {
      _GuildExpendLayer: function () {},

      ShowView: function () {
        this.rootnode.setVisible(true)
        let RecordDatas = JSPP.ppstatic('GuildRecordData').getInstance()
        RecordDatas.despatchDefaultExpendStatisticsData()
      },
      HideView: function () {
        this.rootnode.setVisible(false)
      },
      ChangeReqParam: function (param) {
        if (!this.ppsuper(param)) return false

        JSPP.ppstatic('GuildRecordData').getInstance().requerstGuildExpend(param.floorselect?param.floorselect.floorindex:null, param.relationselect?param.relationselect.uid:null, param.starttime, param.endtime)
        return true
      },
      TitleSelected: function (viewFrameKey, param) {
        this.ChangeReqParam(param)
      }
    },
    GuildExpendLayer: function (ccpath, cfg) {
      let RecordData = JSPP.ppstatic('GuildRecordData').getInstance()
      RecordData.getDispatcher('expendChangeEvent').registHandler(JSPP.ppfunction(this.onDataChange, this), this.listener)

      this.doBindingWithcfgKey('relationSearch')
      this.doBindingWithcfgKey('peoplebg')
      this.doBindingWithcfgKey('peoplebtn')

      this.doBindingWithcfgKey('levelbg')
      this.doBindingWithcfgKey('levelbtn')

      let scrollview = this.getNodeBycfgKey('scrollview')
      let scrollitem = this.getNodeBycfgKey('scrollitem')
      this.scrollviewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, function (item) {

      }, undefined, 0)
      this.scrollviewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))

      this.sortBtns.TimeDay = this.doBindingWithcfgKey('sort_title0', null, 'TimeDay')
      this.sortBtns.ActiveNumber = this.doBindingWithcfgKey('sort_title1', null, 'ActiveNumber')
      this.sortBtns.ExpendNum = this.doBindingWithcfgKey('sort_title2', null, 'ExpendNum')
      this.sortBtns.AllCount = this.doBindingWithcfgKey('sort_title3', null, 'AllCount')
      this.sortBtns.FullCount = this.doBindingWithcfgKey('sort_title4', null, 'FullCount')
      this.sortBtns.WinCount = this.doBindingWithcfgKey('sort_title5', null, 'WinCount')

      this.chooseSort('TimeDay')
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
        this.sortselect = GuildExpendType[sortName]
        this.refreshDataExpend()
      },
      onDataChange: function (msg) {
        this.tmpArray = []
        this.totalNum = {
          dau: 0,
          moneyUsed: 0,
          roomCount: 0,
          roomCount_complete: 0,
          bigWinnerRoomCount: 0
        }
        let data = msg.data
        for (let key in data) {
          let oneData = data[key]
          oneData.uid = key
          this.tmpArray.push(oneData)
          this.totalNum.dau += oneData.dau
          this.totalNum.moneyUsed += oneData.moneyUsed
          this.totalNum.roomCount += oneData.roomCount
          this.totalNum.roomCount_complete += oneData.roomCount_complete
          this.totalNum.bigWinnerRoomCount += oneData.bigWinnerRoomCount
        }
        this.refreshDataExpend()
        this.statisticsData()
      },
      statisticsData: function () {
        this.getNodeBycfgKey('totalActiveText').setString(this.totalNum.dau)
        this.getNodeBycfgKey('totalExpendText').setString(this.totalNum.moneyUsed)
        this.getNodeBycfgKey('totalNumText').setString(this.totalNum.roomCount)
        this.getNodeBycfgKey('totalFullText').setString(this.totalNum.roomCount_complete)
        this.getNodeBycfgKey('totalBigWinnerText').setString(this.totalNum.bigWinnerRoomCount)
      },
      refreshDataExpend: function () {
        let sortType = this.sortselect
        this.tmpArray.sort(function (a, b) {
          let ret = 0
          switch (sortType) {
            case GuildExpendType.TimeDay:
              ret = b.day - a.day
              break
            case GuildExpendType.ActiveNumber:
              ret = b.dau - a.dau
              break
            case GuildExpendType.ExpendNum:
              ret = b.moneyUsed - a.moneyUsed
              break
            case GuildExpendType.AllCount:
              ret = b.roomCount - a.roomCount
              break
            case GuildExpendType.FullCount:
              ret = b.roomCount_complete - a.roomCount_complete
              break
            case GuildExpendType.WinCount:
              ret = b.bigWinnerRoomCount - a.bigWinnerRoomCount
              break
          }
          if (ret === 0) {
            ret = parseInt(a.uid) - parseInt(b.uid)
          }
          return ret
        })
        this.scrollviewEx.setDataList(this.tmpArray)

      },
      updateItem: function (index, item, data) {
        let itemTime = this.getNodeBycfgKey('itemTime', item)
        let time = unescape(data.day)
        let day = time.substring(0, 4) + '-' + time.substring(4, 6) + '-' + time.substring(6, 8)
        itemTime.setString(day)

        let itemActive = this.getNodeBycfgKey('itemActive', item)
        itemActive.setString(data.dau)

        let itemExpend = this.getNodeBycfgKey('itemExpend', item)
        itemExpend.setString(data.moneyUsed)

        let itemTotalNum = this.getNodeBycfgKey('itemTotalNum', item)
        itemTotalNum.setString(data.roomCount)

        let itemFullNum = this.getNodeBycfgKey('itemFullNum', item)
        itemFullNum.setString(data.roomCount_complete)

        let itemBigWinner = this.getNodeBycfgKey('itemBigWinner', item)
        itemBigWinner.setString(data.bigWinnerRoomCount)
      }
    }
  }

  let private = {
    // 选中的排序
    sortselect: GuildExpendType.TimeDay,
    // 排序按钮列表
    sortBtns: {},
    // 选中的排序按钮
    choosedSortBtn: null,
    // 滚动控件
    scrollviewEx: null,
    // 列表数据缓存
    tmpArray: [],
    // 统计数据缓存
    totalNum: {
      dau: 0,
      moneyUsed: 0,
      roomCount: 0,
      roomCount_complete: 0,
      bigWinnerRoomCount: 0
    }
  }

  JSPP.ppclass('GuildExpendLayer', 'GuildRecordViewBase', public, protected, private)

})()
