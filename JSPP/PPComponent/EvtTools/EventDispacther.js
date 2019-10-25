/*
使用样例 by qupit 2019/7/31

let evtlistener = EvtTools.newEventListener("GuildRecordEvent")

let evtDispacther = EvtTools.newEventDispacther()

let ViewCB = function(evtdate){
  //Do something
}

注册监听（evtlistener可不传） ViewCB用到this需要先band
evtDispacther.registHandler(ViewCB, evtlistener)
移除监听（evtlistener可不传）
evtDispacther.unregistHandler(ViewCB, evtlistener)
通过listener移除监听
evtDispacther.removeListener(evtlistener)

发送事件
evtDispacther.postEvent(evtdate)

延时发送事件
evtDispacther.postEventNextFrame(evtdate)

*/
(function () {
  if (!window.JSPP) return

  JSPP.ppinclude(
    './EventListener.js'
  )

  let public = {
    registHandler: function (listenCB, evtListener) {
      let usingName
      if (evtListener) {
        usingName = evtListener.getListenerName()
        evtListener.registDispacther(this)
      } else {
        usingName = JSPP.ppstatic('EventListener')
      }

      if (!this.eventHandlerList[usingName]) {
        this.eventHandlerList[usingName] = []
      } else {
        for (let idx in this.eventHandlerList[usingName]) {
          if (this.eventHandlerList[usingName][idx] === listenCB) {
            return
          }
        }
      }
      this.eventHandlerList[usingName].push(listenCB)
    },
    unregistHandler: function (listenCB, evtListener) {
      let usingName
      if (evtListener) {
        usingName = evtListener.getListenerName()
        evtListener.registDispacther(this)
      } else {
        usingName = JSPP.ppstatic('EventListener')
      }

      if (this.eventHandlerList[usingName]) {
        for (let idx in this.eventHandlerList[usingName]) {
          if (this.eventHandlerList[usingName][idx] === listenCB) {
            this.eventHandlerList[usingName].splice(parseInt(idx), 1)
            break
          }
        }
        if (evtListener && this.eventHandlerList[usingName].length == 0) {
          evtListener.unregistDispacther(this)
        }
      }
    },
    removeListener: function (evtListener) {
      let usingName = evtListener.getListenerName()
      evtListener.unregistDispacther(this)

      if (this.eventHandlerList[usingName])
        delete this.eventHandlerList[usingName]
    },
    postEvent: function () {
      for (let name in this.eventHandlerList) {
        for (let idx in this.eventHandlerList[name]) {
          this.eventHandlerList[name][idx].apply(null, arguments)
        }
      }
    },
    //延迟一帧触发，解决同帧多次反馈导致卡顿的问题
    postEventNextFrame: function () {
      setTimeout(function () {
        if (this.callback)
          this.callback()
      }.bind(this), 1)
      let args = arguments

      this.callback = function () {
        delete this.callback
        for (let name in this.eventHandlerList) {
          for (let idx in this.eventHandlerList[name]) {
            this.eventHandlerList[name][idx].apply(null, args)
          }
        }
      }
    }
  }

  let protected = {}

  let private = {
    eventHandlerList: {},
    callback: null
  }

  JSPP.ppclass('EventDispacther', public, protected, private)
})()

