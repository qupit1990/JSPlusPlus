//  Created by qupit in 2019/9/25.

JSPP.ppinclude([
  '../../CCSViewBase.js'
],function (__filepath__) {"use strict"

  let maxQueryGameLogDuration = 30 // 最多支持查询n天内的战绩

  //虚接口类 GuildRecordViewBase
  let __public__ = {
    virtual: {
      // 界面显示时触发
      ShowView: 0,
      // 界面隐藏时触发
      HideView: 0,
      // 请求数据变化 (返回新数据请求是否有效)
      ChangeReqParam: function (param) {

        let oneDayTime = 1000 * 60 * 60 * 24
        let nowTime = (new Date()).getTime()
        let nowZeroTime = new Date(new Date().toLocaleDateString()).getTime()

        if (param.starttime > nowTime || param.endtime > nowTime) {
          utils.showMsg('查询时间超过当前时间')
          return false
        }

        if (param.endtime < param.starttime) {
          utils.showMsg('查询的截止时间不能早于起始时间')
          return false
        }

        if (nowZeroTime - param.starttime > maxQueryGameLogDuration * oneDayTime) {
          utils.showMsg('目前只能查询' + maxQueryGameLogDuration + '日内的战绩')
          return false
        }

        return true
      },
      // 激活指定标签 (viewFrameKey,param) => void
      TitleSelected: function (viewFrameKey, param) {},
      // 设置父级view节点
      SetBackgroundView: function (view) {
        this.BackgroundView = view
      }
    }
  }
  let __protected__ = {
    BackgroundView: null
  }
  let __private__ = {}

  JSPP.ppclass('GuildRecordViewBase', 'CCSViewBase', __public__, __protected__, __private__)

})
