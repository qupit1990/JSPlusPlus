//  Created by qupit in 2019/9/25.

(function () {

  JSPP.ppinclude(
    ':/PPComponent/EvtTools/EventDispacther.js'
  )

  let GuildServerApi = include('Guild/ServerApi/GuildServerApi')
  let GuildUtil = include('Guild/Utils/GuildUtil')

  let public = {
    static: {
      getInstance: function () {
        if (!this.instance) {
          this.instance = JSPP.ppnew('GuildRecordData')
        }
        return this.instance
      }
    },
    GuildRecordData: function () {
      this.Evters['memberdataChangeEvent'] = JSPP.ppnew('EventDispacther')
      this.Evters['recorddataChangeEvent'] = JSPP.ppnew('EventDispacther')
      this.Evters['relationdataChangeEvent'] = JSPP.ppnew('EventDispacther')
      this.Evters['expendChangeEvent'] = JSPP.ppnew('EventDispacther')

    },
    _GuildRecordData: function () {},
    //获取事件发射器用于注册
    getDispatcher: function (key) {
      return this.Evters[key]
    },

    initInfo: function (guildid) {
      this.guildid = guildid
    },

    getUsingGuildID: function () {
      return this.guildid
    },

    checkTimeAble: function (queryStartTime, queryEndTime) {
      let oneDayTime = 1000 * 60 * 60 * 24
      let nowTime = (new Date()).getTime()
      let nowZeroTime = new Date(new Date().toLocaleDateString()).getTime()

      if (queryStartTime > nowTime || queryEndTime > nowTime) {
        utils.showMsg('查询时间超过当前时间')
        return false
      }

      if (queryEndTime < queryStartTime) {
        utils.showMsg('查询的截止时间不能早于起始时间')
        return false
      }

      if (nowZeroTime - queryStartTime > maxQueryGameLogDuration * oneDayTime) {
        utils.showMsg('目前只能查询' + maxQueryGameLogDuration + '日内的战绩')
        return false
      }

      return true
    },

    requerstGuildRecord: function (floorSelect, relationSelect, queryStartTime, queryEndTime, scoreMin, scoreMax) {
      if (floorSelect === undefined || queryStartTime === undefined || queryEndTime === undefined) return false

      //let guildInfo = GuildDataManager.getGuildInfoByID(GuildDataManager.getCurGuildID())
      GuildServerApi.GetGuildStatistics(this.guildid, queryStartTime, queryEndTime, floorSelect, relationSelect, scoreMin, scoreMax, JSPP.ppfunction(function (rtn) {
        this.curStatisticsData = rtn
        this.Evters['memberdataChangeEvent'].postEvent(rtn)
      }, this))

      return true
    },
    despatchDefaultStatisticsData: function () {
      if (this.curStatisticsData) {
        this.Evters['memberdataChangeEvent'].postEvent(this.curStatisticsData)
      }
    },

    requerstGuildExpend: function (floorSelect, relationSelect, queryStartTime, queryEndTime) {
      if (floorSelect === undefined || queryStartTime === undefined || queryEndTime === undefined) return false

      GuildServerApi.GetGuildCost(this.guildid, queryStartTime, queryEndTime, relationSelect, floorSelect, JSPP.ppfunction(function (rtn) {
        this.expendStatisticsData = rtn
        this.Evters['expendChangeEvent'].postEvent(rtn)
      }, this))
      return true
    },

    despatchDefaultExpendStatisticsData: function () {
      if (this.expendStatisticsData) {
        this.Evters['expendChangeEvent'].postEvent(this.expendStatisticsData)
      }
    },

    requerstGetGuildGameTable: function (queryStartTime, queryEndTime, searchid, searchtableid, order, scoreMin, scoreMax, isMore) {
      if (queryStartTime === undefined || queryEndTime === undefined) return false

      if (isMore) {
        if (this.dataAsking || this.dataEnd) return false
        cc.log('requer more !!!!!!!!!!!!!!!!!!!!!!')
      } else {
        this.offset = 0
        this.dataEnd = false
        this.dataAsking = false
      }

      if (this.dataAsking || this.dataEnd) {
        return false
      }

      this.dataAsking = true
      let more = isMore
      //let guildInfo = GuildDataManager.getGuildInfoByID(GuildDataManager.getCurGuildID())
      GuildServerApi.GetGuildGameTable(this.guildid, queryStartTime, queryEndTime, null, null, searchid, searchtableid, this.offset, this.limit, order, scoreMin, scoreMax, JSPP.ppfunction(function (rtn) {
        this.offset += this.limit
        this.dataEnd = (rtn.gamecount <= this.offset)
        this.dataAsking = false
        this.Evters['recorddataChangeEvent'].postEvent(rtn, more)
      }, this))

      return true
    },
    requerstGetCooperGuildStatistics: function () {
      GuildServerApi.GetCooperGuildStatistics(this.guildid, (new Date()).getTime(), JSPP.ppfunction(function (rtn) {
        if (rtn.result != 0 || rtn.info === undefined)
          return
        rtn.info = GuildUtil.getFiltrateParnterData(rtn.info)
        this.relationStatisticsData = rtn
        this.Evters['relationdataChangeEvent'].postEvent(rtn)
      }, this))
    },
    despatchDefaultrelationStatisticsData: function () {
      if (this.relationStatisticsData) {
        this.Evters['relationdataChangeEvent'].postEvent(this.relationStatisticsData)
      }
    }
  }

  let protected = {
    curStatisticsData: null,
    relationStatisticsData: null,
    expendStatisticsData: null

  }

  let private = {
    static: {
      instance: null
    },
    //所有事件控制器
    Evters: {},
    guildid: undefined,
    //请求房间信息的偏移量
    offset: 0,
    limit: 20,
    dataAsking: false,
    dataEnd: false
  }

  JSPP.ppclass('GuildRecordData', public, protected, private)

})()