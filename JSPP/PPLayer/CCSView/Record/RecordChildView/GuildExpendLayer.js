//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  ':/PPLayer/PPLayerFactory.js',
  ':/PPData/Record/GuildRecordData.js',
  ':/PPComponent/ScrollViewEx.js',
  '../GuildRecordViewBase.js'
],function (__filepath__) {"use strict"

  JSPP.ppstatic('PPLayerFactory').getInstance().addKeyDefaultInfo('ExpendLayer', 'GuildExpendLayer', 'res/guildRes/GuildRecordExpend.csb', {

    sort_title0: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_0', function: 'chooseSort' },
    sort_title1: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_1', function: 'chooseSort' },
    sort_title2: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_2', function: 'chooseSort' },
    sort_title3: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_3', function: 'chooseSort' },
    sort_title4: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_4', function: 'chooseSort' },
    sort_title5: { path: 'guildExpendLayout/tilblebg/boxpanel/Checklist_5', function: 'chooseSort' },

    scrollview: { path: 'guildExpendLayout/scrollview' },
    scrollitem: { path: 'guildExpendLayout/scrollview/recorditem' },

    totalBg: { path: 'guildExpendLayout/totalBg' },
    totalActiveText: { path: 'guildExpendLayout/totalBg/totalActiveText' },
    totalExpendText: { path: 'guildExpendLayout/totalBg/totalExpendText' },
    totalNumText: { path: 'guildExpendLayout/totalBg/ totalNumText' },
    totalFullText: { path: 'guildExpendLayout/totalBg/totalFullText' },
    totalBigWinnerText: { path: 'guildExpendLayout/totalBg/totalBigWinnerText' },

    itemTime: { path: 'time' },
    itemActive: { path: 'activeText' },
    itemCpsExpend: { path: 'cpsExpendText' },
    itemCpsMoneyBg: { path: 'cpsMonetBg' },
    itemExpend: { path: 'expendText' },
    itemMoneyBg: { path: 'moneyBg' },
    itemTotalNum: { path: ' totalNumText' },
    itemFullNum: { path: 'fullNumText' },
    itemBigWinner: { path: 'bigWinnerText' }

  }, [
    'res/guildRes/club/common/common'
  ])

  let GuildDataManager = include('Guild/Data/GuildDataManager')

  let GuildExpendType = { // 选中的排序按钮
    TimeDay: 0, // 时间
    ActiveNumber: 1, // 活跃人数
    ExpendNum: 2, // 消耗
    AllCount: 3, // 总场次
    FullCount: 4, // 完整场次
    WinCount: 5 // 大赢家场次
  }


  let GuildUtil = include('Guild/Utils/GuildUtil')

  let __public__ = {
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

        JSPP.ppstatic('GuildRecordData').getInstance().requerstGuildExpend(param.floorselect?param.floorselect.floorindex:null, param.relationselect?param.relationselect.uid:null, param.starttime, param.endtime + param.endtimeEx)
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
      this.scrollviewEx = JSPP.ppnew('ScrollViewEx', scrollview, scrollitem, undefined, undefined, 0)
      this.scrollviewEx.setDataList([], JSPP.ppfunction(this.updateItem, this))

      this.sortBtns.TimeDay = this.doBindingWithcfgKey('sort_title0', null, 'TimeDay')
      this.sortBtns.ActiveNumber = this.doBindingWithcfgKey('sort_title1', null, 'ActiveNumber')
      this.sortBtns.ExpendNum = this.doBindingWithcfgKey('sort_title2', null, 'ExpendNum')
      this.sortBtns.AllCount = this.doBindingWithcfgKey('sort_title3', null, 'AllCount')
      this.sortBtns.FullCount = this.doBindingWithcfgKey('sort_title4', null, 'FullCount')
      this.sortBtns.WinCount = this.doBindingWithcfgKey('sort_title5', null, 'WinCount')

      this.chooseSort('TimeDay')
      this.statisticsData({
        dau: 0,
        moneyUsed: 0,
        roomCount: 0,
        roomCount_complete: 0,
        bigWinnerRoomCount: 0
      })
    }

  }

  let __protected__ = {
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
        let totalNum = {
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
          totalNum.dau += oneData.dau
          totalNum.moneyUsed += oneData.moneyUsed
          totalNum.roomCount += oneData.roomCount
          totalNum.roomCount_complete += oneData.roomCount_complete
          totalNum.bigWinnerRoomCount += oneData.bigWinnerRoomCount
        }
        this.refreshDataExpend()
        this.statisticsData(totalNum)
      },
      statisticsData: function (totalNum) {
        this.getNodeBycfgKey('totalActiveText').setString(totalNum.dau)
        this.getNodeBycfgKey('totalExpendText').setString(totalNum.moneyUsed)
        this.getNodeBycfgKey('totalNumText').setString(totalNum.roomCount)
        this.getNodeBycfgKey('totalFullText').setString(totalNum.roomCount_complete)
        this.getNodeBycfgKey('totalBigWinnerText').setString(totalNum.bigWinnerRoomCount)
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
        let selectcolor = cc.color(220, 0, 0)
        let normalcolor = cc.color(134, 100, 67)

        let itemTime = this.getNodeBycfgKey('itemTime', item)
        let time = unescape(data.day)
        let day = time.substring(0, 4) + '-' + time.substring(4, 6) + '-' + time.substring(6, 8)
        itemTime.setString(day)
        itemTime.setTextColor(this.sortselect === GuildExpendType.TimeDay ? selectcolor : normalcolor)

        let itemActive = this.getNodeBycfgKey('itemActive', item)
        itemActive.setString(data.dau)
        itemActive.setTextColor(this.sortselect === GuildExpendType.ActiveNumber ? selectcolor : normalcolor)

        let itemCpsExpend = this.getNodeBycfgKey('itemCpsExpend', item)
        itemCpsExpend.setVisible(GuildDataManager.getGuildCPSSwitch())
        itemCpsExpend.setString(data.cpsMoneyUsed || '0')
        itemCpsExpend.setTextColor(this.sortselect === GuildExpendType.ExpendNum ? selectcolor : normalcolor)

        this.getNodeBycfgKey('itemCpsMoneyBg', item).setVisible(GuildDataManager.getGuildCPSSwitch())

        let itemExpend = this.getNodeBycfgKey('itemExpend', item)
        itemExpend.setString(data.moneyUsed || '0')
        itemExpend.setTextColor(this.sortselect === GuildExpendType.ExpendNum ? selectcolor : normalcolor)
        if (!GuildDataManager.getGuildCPSSwitch()) {
          itemExpend.setPositionY(item.getContentSize().height / 2)
          this.getNodeBycfgKey('itemMoneyBg', item).setPositionY(item.getContentSize().height / 2 - 2)
        }

        let itemTotalNum = this.getNodeBycfgKey('itemTotalNum', item)
        itemTotalNum.setString(data.roomCount)
        itemTotalNum.setTextColor(this.sortselect === GuildExpendType.AllCount ? selectcolor : normalcolor)

        let itemFullNum = this.getNodeBycfgKey('itemFullNum', item)
        itemFullNum.setString(data.roomCount_complete)
        itemFullNum.setTextColor(this.sortselect === GuildExpendType.FullCount ? selectcolor : normalcolor)

        let itemBigWinner = this.getNodeBycfgKey('itemBigWinner', item)
        itemBigWinner.setString(data.bigWinnerRoomCount)
        itemBigWinner.setTextColor(this.sortselect === GuildExpendType.WinCount ? selectcolor : normalcolor)
      }
    }
  }

  let __private__ = {
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
  }

  JSPP.ppclass('GuildExpendLayer', 'GuildRecordViewBase', __public__, __protected__, __private__)

})
