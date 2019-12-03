/**
 * created by wzh
 *
 * 使用样例：GuildUtil.showGuildSelectTime(timestate, parent)
 *
 */
JSPP.ppinclude([
  ':/PPLayer/PPLayerFactory.js'
],function (__filepath__) {"use strict"

  let factory = JSPP.ppstatic('PPLayerFactory').getInstance()
  factory.addKeyDefaultInfo('RecordSetTimeLayer', 'GuildRecordSetTimeLayer', 'res/guildRes/GuildRecordSetTime.csb', {
    btnClose: { path: 'background/btn_x', function: 'closeClick' },
    confirmTimeBtn: { path: 'background/confirm_time', function: 'confirmTime' },

    mouthAddStart: { path: 'background/time_node_nohour/mouth_start_node/mouth_add_start', function: 'changeDate' },
    mouthSubStart: { path: 'background/time_node_nohour/mouth_start_node/mouth_sub_start', function: 'changeDate' },
    mouthAddEnd: { path: 'background/time_node_nohour/mouth_end_node/mouth_add_end', function: 'changeDate' },
    mouthSubEnd: { path: 'background/time_node_nohour/mouth_end_node/mouth_sub_end', function: 'changeDate' },

    dayAddStart: { path: 'background/time_node_nohour/day_start_node/day_add_start', function: 'changeDate' },
    daySubStart: { path: 'background/time_node_nohour/day_start_node/day_sub_start', function: 'changeDate' },
    dayAddEnd: { path: 'background/time_node_nohour/day_end_node/day_add_end', function: 'changeDate' },
    daySubEnd: { path: 'background/time_node_nohour/day_end_node/day_sub_end', function: 'changeDate' },

    yearStartNoHour: { path: 'background/time_node_nohour/year_start' },
    yearEndNoHour: { path: 'background/time_node_nohour/year_end' },
    mouthStartNoHour: { path: 'background/time_node_nohour/mouth_start_node/mouth_start_txt' },
    mouthEndNoHour: { path: 'background/time_node_nohour/mouth_end_node/mouth_end_txt' },
    dayStartTxtNoHour: { path: 'background/time_node_nohour/day_start_node/day_start_txt' },
    dayEndTxtNoHour: { path: 'background/time_node_nohour/day_end_node/day_end_txt' },
    dayTimeText: { path: 'background/dayTime' }
  }, [
    'res/guildRes/club/common/common'
  ])

  let __public__ = {
    virtual: {
      _GuildRecordSetTimeLayer: function () {}
    },
    GuildRecordSetTimeLayer: function (ccpath, cfg) {
      this.doBindingWithcfgKey('mouthAddStart', null, 'mouthAddTimeStart')
      this.doBindingWithcfgKey('mouthSubStart', null, 'mouthSubTimeStart')
      this.doBindingWithcfgKey('mouthAddEnd', null, 'mouthAddTimeEnd')
      this.doBindingWithcfgKey('mouthSubEnd', null, 'mouthSubTimeEnd')

      this.doBindingWithcfgKey('dayAddStart', null, 'dayAddTimeStart')
      this.doBindingWithcfgKey('daySubStart', null, 'daySubTimeStart')
      this.doBindingWithcfgKey('dayAddEnd', null, 'dayAddTimeEnd')
      this.doBindingWithcfgKey('daySubEnd', null, 'daySubTimeEnd')

      this.doBindingWithcfgKey('btnClose')
      this.doBindingWithcfgKey('confirmTimeBtn')

      this.timeParam = {
        startTimeArr: (new Date()).getTime(),
        endTimeArr: (new Date()).getTime(),
        dayTime: 7
      }
      this.updateTime()
      this.updateDayText(this.timeParam.dayTime)
    },
    setCallBack: function (callBack) {
      this.callback = callBack
    },

    // 起始时间和结束时间
    setShowDate: function (startTime, endTime) {
      this.timeParam.startTimeArr = startTime
      this.timeParam.endTimeArr = endTime
      this.updateTime()
    },

    // 显示本次查询时间最大的跨度
    setDateTime: function (time) {
      // 临界值的问题 
      this.timeParam.dayTime = time - 1
      this.updateDayText(time)
    },
    // 查询的最大天数
    setMaxQueryGameLogDuration: function (day) {
      this.maxQueryGameLogDuration = day
    }
  }

  let __protected__ = {
    timeParam: null,
    callback: null,
    virtual: {
      bindFunctionToNode: function (node, funckey, userdata) {
        let data = userdata
        switch (funckey) {
          case 'closeClick':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.close()
              }
            }, this))
            break
          case 'confirmTime':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                this.confirmTimeBtn()
              }
            }, this))
            break
          case 'changeDate':
            node.addTouchEventListener(JSPP.ppfunction(function (btn, type) {
              if (type === ccui.Widget.TOUCH_ENDED) {
                switch (data) {
                  case 'mouthAddTimeStart':
                    this.updateTimeData(30, 0)
                    break
                  case 'mouthSubTimeStart':
                    this.updateTimeData(-30, 0)
                    break
                  case 'mouthAddTimeEnd':
                    this.updateTimeData(30, 1)
                    break
                  case 'mouthSubTimeEnd':
                    this.updateTimeData(-30, 1)
                    break
                  case 'dayAddTimeStart':
                    this.updateTimeData(1, 0)
                    break
                  case 'daySubTimeStart':
                    this.updateTimeData(-1, 0)
                    break
                  case 'dayAddTimeEnd':
                    this.updateTimeData(1, 1)
                    break
                  case 'daySubTimeEnd':
                    this.updateTimeData(-1, 1)
                    break
                  default:
                    break
                }
              }
            }, this))
            break
          default:
            JSPP.pperror('Funciton Key:[' + funckey + '] not found', new Error())
            break
        }
      },
      confirmTimeBtn: function () {
        this.callback(this.timeParam)
        this.close()
      },
      copyTimeParam: function () {
        return JSON.parse(JSON.stringify(this.timeParam))
      },
      onEnter: function () {
        this.ppsuper()
        this.doLayout(this.rootnode)
      },
      updateDayText: function (time) {
        this.getNodeBycfgKey('dayTimeText').setString(time + '天')
      },
      updateTimeData: function (dt, type) {
        let oneDayTime = 1000 * 60 * 60 * 24
        let newParam = this.copyTimeParam()
        let time = new Date(new Date().toLocaleDateString()).getTime()
        if (type === 0) {
          newParam.startTimeArr = newParam.startTimeArr + oneDayTime * dt
          if (newParam.startTimeArr > time) {
            newParam.startTimeArr = time
          } else if (time - newParam.startTimeArr > this.maxQueryGameLogDuration * oneDayTime) {
            newParam.startTimeArr = time - this.maxQueryGameLogDuration * oneDayTime
          }
          if (newParam.startTimeArr === this.timeParam.startTimeArr) {
            if (dt > 0) {
              utils.showMsg('查询时间超过当前时间')
            } else {
              utils.showMsg('目前只能查询' + this.maxQueryGameLogDuration + '日内的战绩')
            }
            return
          }
          if ((newParam.endTimeArr - newParam.startTimeArr) / oneDayTime > newParam.dayTime) {
            newParam.endTimeArr = newParam.startTimeArr + newParam.dayTime * oneDayTime
          } else if (newParam.startTimeArr > newParam.endTimeArr) {
            newParam.endTimeArr = newParam.startTimeArr
          }
        } else {
          newParam.endTimeArr = newParam.endTimeArr + oneDayTime * dt
          if (newParam.endTimeArr > time) {
            newParam.endTimeArr = time
          } else if (time - newParam.endTimeArr > this.maxQueryGameLogDuration * oneDayTime) {
            newParam.endTimeArr = time - this.maxQueryGameLogDuration * oneDayTime
          }
          if (newParam.endTimeArr === this.timeParam.endTimeArr) {
            if (dt > 0) {
              utils.showMsg('查询时间超过当前时间')
            } else {
              utils.showMsg('目前只能查询' + this.maxQueryGameLogDuration + '日内的战绩')
            }
            return
          }
          if (newParam.startTimeArr > newParam.endTimeArr) {
            newParam.startTimeArr = newParam.endTimeArr
          } else if ((newParam.endTimeArr - newParam.startTimeArr) / oneDayTime > newParam.dayTime) {
            newParam.startTimeArr = newParam.endTimeArr - newParam.dayTime * oneDayTime
          }
        }
        this.timeParam = newParam
        this.updateTime()
      },
      updateTime: function () {
        let startDate = utils.timeUtil.getDateFromTime(this.timeParam.startTimeArr)
        let startArr = utils.timeUtil.getTimeArray(startDate)
        let endDate = utils.timeUtil.getDateFromTime(this.timeParam.endTimeArr)
        let endArr = utils.timeUtil.getTimeArray(endDate)

        this.getNodeBycfgKey('yearStartNoHour').setString(startArr[0])
        this.getNodeBycfgKey('yearEndNoHour').setString(endArr[0])
        this.getNodeBycfgKey('mouthStartNoHour').setString(startArr[1])
        this.getNodeBycfgKey('mouthEndNoHour').setString(endArr[1])
        this.getNodeBycfgKey('dayStartTxtNoHour').setString(startArr[2])
        this.getNodeBycfgKey('dayEndTxtNoHour').setString(endArr[2])
      }
    }
  }

  let __private__ = {
    maxQueryGameLogDuration: 30
  }

  JSPP.ppclass('GuildRecordSetTimeLayer', 'CCSViewBase', __public__, __protected__, __private__)
})
